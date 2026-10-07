/**
 * core/scheduler.ts
 * Single wrapper around Google Cloud Tasks.
 * All delayed jobs go through this module.
 */
import { CloudTasksClient } from '@google-cloud/tasks';
import type { TaskPayload } from './types.js';

let _client: CloudTasksClient | null = null;

function getClient(): CloudTasksClient {
  if (!_client) _client = new CloudTasksClient();
  return _client;
}

const PROJECT  = () => process.env['GCP_PROJECT_ID']!;
const LOCATION = () => process.env['GCP_LOCATION'] ?? 'europe-west2';
const BASE_URL = () => process.env['SERVICE_BASE_URL']!;

export type QueueName =
  | 'automation-reminders'
  | 'automation-reviews'
  | 'automation-jobs';

function queuePath(queue: QueueName): string {
  return getClient().queuePath(PROJECT(), LOCATION(), queue);
}

/**
 * Schedules a Cloud Tasks job.
 * @returns The Cloud Tasks task name (used for cancellation).
 */
export async function scheduleJob(
  payload: TaskPayload,
  queue: QueueName,
  scheduleTime: Date,
): Promise<string> {
  const parent = queuePath(queue);

  // Task body is delivered to POST /webhooks/tasks
  const body = Buffer.from(JSON.stringify(payload)).toString('base64');

  const [task] = await getClient().createTask({
    parent,
    task: {
      scheduleTime: {
        seconds: Math.floor(scheduleTime.getTime() / 1000),
      },
      httpRequest: {
        httpMethod: 'POST',
        url: `${BASE_URL()}/webhooks/tasks`,
        headers: {
          'Content-Type':     'application/json',
          'X-Task-Secret':    process.env['TASK_SECRET']!,
        },
        body,
      },
    },
  });

  return task.name ?? '';
}

/**
 * Cancels a previously scheduled task by its full task name.
 */
export async function cancelJob(taskName: string): Promise<void> {
  if (!taskName) return;
  try {
    await getClient().deleteTask({ name: taskName });
  } catch (err: unknown) {
    // Task may already have executed — not an error
    const message = err instanceof Error ? err.message : String(err);
    if (!message.includes('NOT_FOUND')) throw err;
  }
}

/**
 * Cancels an existing job and schedules a replacement.
 */
export async function rescheduleJob(
  existingTaskName: string,
  payload: TaskPayload,
  queue: QueueName,
  newScheduleTime: Date,
): Promise<string> {
  await cancelJob(existingTaskName);
  return scheduleJob(payload, queue, newScheduleTime);
}

/**
 * Schedules a job for immediate execution (30 seconds from now, to allow the
 * current request to complete first).
 */
export async function scheduleImmediate(
  payload: TaskPayload,
  queue: QueueName = 'automation-jobs',
): Promise<string> {
  const soon = new Date(Date.now() + 30_000);
  return scheduleJob(payload, queue, soon);
}

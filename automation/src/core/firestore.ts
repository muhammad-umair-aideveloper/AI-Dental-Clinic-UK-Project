/**
 * core/firestore.ts
 * Firestore client + typed collection helpers.
 * Uses service account credentials from environment (GOOGLE_APPLICATION_CREDENTIALS).
 */
import { Firestore, Timestamp } from '@google-cloud/firestore';
import type {
  Lead,
  Conversation,
  MessageLog,
  IdempotencyRecord,
  ReviewClick,
  KpiSnapshot,
} from './types.js';

// ─── Singleton Firestore Client ───────────────────────────────────────────────

let _db: Firestore | null = null;

export function getDb(): Firestore {
  if (!_db) {
    _db = new Firestore({
      projectId:  process.env['GCP_PROJECT_ID'],
      databaseId: process.env['FIRESTORE_DATABASE_ID'] ?? '(default)',
    });
  }
  return _db;
}

// ─── Collection References ─────────────────────────────────────────────────────

export const Collections = {
  LEADS:          'leads',
  CONVERSATIONS:  'conversations',
  MESSAGES_LOG:   'messages_log',
  IDEMPOTENCY:    'idempotency',
  REVIEW_CLICKS:  'review_clicks',
  KPIS:           'kpis',
} as const;

// ─── Typed Helpers ────────────────────────────────────────────────────────────

export async function getLead(id: string): Promise<Lead | null> {
  const doc = await getDb().collection(Collections.LEADS).doc(id).get();
  if (!doc.exists) return null;
  return doc.data() as Lead;
}

export async function createLead(lead: Lead): Promise<void> {
  await getDb().collection(Collections.LEADS).doc(lead.id).set(lead);
}

export async function updateLead(id: string, patch: Partial<Lead>): Promise<void> {
  await getDb()
    .collection(Collections.LEADS)
    .doc(id)
    .update({
      ...patch,
      updatedAt: new Date().toISOString(),
    });
}

export async function getConversation(id: string): Promise<Conversation | null> {
  const doc = await getDb().collection(Collections.CONVERSATIONS).doc(id).get();
  if (!doc.exists) return null;
  return doc.data() as Conversation;
}

export async function getConversationBySession(
  sessionId: string,
): Promise<Conversation | null> {
  const snap = await getDb()
    .collection(Collections.CONVERSATIONS)
    .where('sessionId', '==', sessionId)
    .limit(1)
    .get();
  if (snap.empty) return null;
  return snap.docs[0]!.data() as Conversation;
}

export async function createConversation(conv: Conversation): Promise<void> {
  await getDb().collection(Collections.CONVERSATIONS).doc(conv.id).set(conv);
}

export async function updateConversation(
  id: string,
  patch: Partial<Conversation>,
): Promise<void> {
  await getDb()
    .collection(Collections.CONVERSATIONS)
    .doc(id)
    .update({
      ...patch,
      updatedAt: new Date().toISOString(),
    });
}

export async function logMessage(msg: MessageLog): Promise<void> {
  await getDb().collection(Collections.MESSAGES_LOG).doc(msg.id).set(msg);
}

export async function updateMessageLog(
  id: string,
  patch: Partial<MessageLog>,
): Promise<void> {
  await getDb().collection(Collections.MESSAGES_LOG).doc(id).update(patch);
}

// ─── Idempotency ──────────────────────────────────────────────────────────────

/**
 * Returns true if the key has already been processed (idempotent webhook).
 * Records the key atomically if not.
 */
export async function checkAndMarkIdempotent(
  key: string,
  result?: string,
): Promise<boolean> {
  const db = getDb();
  const ref = db.collection(Collections.IDEMPOTENCY).doc(key);

  let alreadyProcessed = false;

  await db.runTransaction(async (tx) => {
    const doc = await tx.get(ref);
    if (doc.exists) {
      alreadyProcessed = true;
      return;
    }
    const record: IdempotencyRecord = {
      key,
      processedAt: new Date().toISOString(),
      result,
    };
    tx.set(ref, record);
  });

  return alreadyProcessed;
}

// ─── Review Clicks ────────────────────────────────────────────────────────────

export async function logReviewClick(click: ReviewClick): Promise<void> {
  await getDb().collection(Collections.REVIEW_CLICKS).doc(click.id).set(click);
}

export async function countReviewClicks(leadId: string): Promise<number> {
  const snap = await getDb()
    .collection(Collections.REVIEW_CLICKS)
    .where('leadId', '==', leadId)
    .count()
    .get();
  return snap.data().count;
}

// ─── Admin Queries ────────────────────────────────────────────────────────────

export async function getTodaysLeads(): Promise<Lead[]> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const snap = await getDb()
    .collection(Collections.LEADS)
    .where('appointmentDateTime', '>=', startOfDay.toISOString().slice(0, 10))
    .where('appointmentDateTime', '<', new Date(startOfDay.getTime() + 86400000).toISOString().slice(0, 10))
    .get();

  return snap.docs.map((d) => d.data() as Lead);
}

export async function getLeadsForDashboard(limit = 100): Promise<Lead[]> {
  const snap = await getDb()
    .collection(Collections.LEADS)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();
  return snap.docs.map((d) => d.data() as Lead);
}

export async function getLeadsByStatus(status: string): Promise<Lead[]> {
  const snap = await getDb()
    .collection(Collections.LEADS)
    .where('status', '==', status)
    .orderBy('createdAt', 'desc')
    .get();
  return snap.docs.map((d) => d.data() as Lead);
}

// ─── GDPR ─────────────────────────────────────────────────────────────────────

/**
 * Permanently deletes PII from a lead while retaining anonymised KPI data.
 */
export async function deletePii(leadId: string): Promise<void> {
  const patch: Partial<Lead> = {
    fullName:     '[DELETED]',
    mobile:       '[DELETED]',
    email:        undefined,
    ipAddress:    undefined,
    consentGiven: false,
    updatedAt:    new Date().toISOString(),
  };
  await getDb().collection(Collections.LEADS).doc(leadId).update(patch);

  // Delete all conversation messages (contain free-text health data)
  const convSnap = await getDb()
    .collection(Collections.CONVERSATIONS)
    .where('leadId', '==', leadId)
    .get();
  const batch = getDb().batch();
  for (const doc of convSnap.docs) {
    batch.delete(doc.ref);
  }
  await batch.commit();
}

/**
 * Exports all data associated with a lead (GDPR Subject Access Request).
 */
export async function exportLeadData(leadId: string): Promise<Record<string, unknown>> {
  const [leadDoc, convSnap, msgSnap] = await Promise.all([
    getDb().collection(Collections.LEADS).doc(leadId).get(),
    getDb().collection(Collections.CONVERSATIONS).where('leadId', '==', leadId).get(),
    getDb().collection(Collections.MESSAGES_LOG).where('leadId', '==', leadId).get(),
  ]);

  return {
    lead:          leadDoc.data() ?? null,
    conversations: convSnap.docs.map((d) => d.data()),
    messages:      msgSnap.docs.map((d) => d.data()),
  };
}

/**
 * Purges unconverted leads older than the configured retention period.
 * Called by the daily summary job.
 */
export async function purgeExpiredLeads(retentionMonths: number): Promise<number> {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - retentionMonths);

  const unconvertedStatuses = ['NEW', 'QUALIFYING', 'QUALIFIED', 'CANCELLED'];
  const snap = await getDb()
    .collection(Collections.LEADS)
    .where('status', 'in', unconvertedStatuses)
    .where('createdAt', '<', cutoff.toISOString())
    .get();

  const batch = getDb().batch();
  for (const doc of snap.docs) {
    batch.delete(doc.ref);
  }
  await batch.commit();

  return snap.size;
}

// ─── KPI helpers ──────────────────────────────────────────────────────────────

export async function saveKpiSnapshot(snapshot: KpiSnapshot): Promise<void> {
  await getDb()
    .collection(Collections.KPIS)
    .doc(snapshot.date)
    .set(snapshot, { merge: true });
}

export async function getKpiSnapshot(date: string): Promise<KpiSnapshot | null> {
  const doc = await getDb().collection(Collections.KPIS).doc(date).get();
  if (!doc.exists) return null;
  return doc.data() as KpiSnapshot;
}

// ─── Utility ──────────────────────────────────────────────────────────────────

export function newId(): string {
  return getDb().collection('_').doc().id;
}

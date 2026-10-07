/**
 * workflows/w4-review/short-link.ts
 * Tracked review short link: /r/:id → logs click → 302 to Google Review URL
 */
import { logReviewClick, countReviewClicks, getLead, updateLead, newId } from '../../core/firestore.js';
import { clinicConfig } from '../../clinic.config.js';
import { logger } from '../../core/logger.js';

export async function handleReviewClick(
  leadId: string,
  userAgent?: string,
  ipAddress?: string,
): Promise<string> {
  const lead = await getLead(leadId);
  if (!lead) {
    logger.warn({ leadId }, 'Review click for unknown lead — redirecting anyway');
    return clinicConfig.googleReviewUrl;
  }

  // Log the click
  await logReviewClick({
    id:        newId(),
    leadId,
    clickedAt: new Date().toISOString(),
    userAgent,
    ipAddress,
  });

  // Update lead flag
  if (!lead.reviewLinkClicked) {
    await updateLead(leadId, { reviewLinkClicked: true });
  }

  logger.info({ leadId }, 'Review link clicked');

  return clinicConfig.googleReviewUrl;
}

/**
 * Returns the tracked short URL for a lead's review request.
 */
export function buildReviewShortUrl(leadId: string): string {
  return `${process.env['SERVICE_BASE_URL']}/r/${leadId}`;
}

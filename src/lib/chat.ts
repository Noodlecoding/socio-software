import { ChatMessage } from '../types';

export const formatTimestamp = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });

export const rowToChatMessage = (row: any): ChatMessage => ({
  id: row.id,
  sender: row.sender,
  senderName: row.sender_name,
  senderTitle: row.sender_title ?? undefined,
  senderInitials: row.sender_initials ?? undefined,
  text: row.text,
  timestamp: formatTimestamp(row.created_at),
  attachments: row.attachments ?? undefined,
  isPreliminaryPlan: row.is_preliminary_plan ?? undefined,
  architectReviewNotice: row.architect_review_notice ?? undefined
});

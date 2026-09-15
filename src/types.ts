export type EngagementModelId = 'quick-module' | 'core-workflow' | 'comprehensive-system';

export interface EngagementModel {
  id: EngagementModelId;
  tag: string;
  title: string;
  name: string;
  duration: string;
  description: string;
  features: string[];
  ctaText: string;
  isPopular?: boolean;
}

export type ClientStatus = 'new_client' | 'interested' | 'paid';

export interface UserProfile {
  id: string;
  name: string;
  organization: string;
  email: string;
  initials: string;
  selectedModel: EngagementModelId;
}

export interface AdminConversation {
  userId: string;
  fullName: string;
  organization: string;
  status: ClientStatus;
  clientSince: string;
  unreadCount: number;
  lastMessage: string | null;
  lastMessageAt: string | null;
}

export interface AffiliateStats {
  affiliateId: string;
  referralCode: string;
  leadsCount: number;
  dealsClosed: number;
  totalDealValue: number;
  commissionOwed: number;
}

export interface ChatMessage {
  id: string;
  sender: 'architect' | 'user' | 'system';
  senderName: string;
  senderTitle?: string;
  senderInitials?: string;
  text: string;
  timestamp: string;
  attachments?: {
    name: string;
    type: string;
    size?: string;
  }[];
  isPreliminaryPlan?: boolean;
  architectReviewNotice?: boolean;
}

export interface SpecFile {
  id: string;
  name: string;
  size: string;
  type: string;
  dateAdded: string;
}

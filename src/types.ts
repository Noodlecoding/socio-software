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

export type AccountType = 'client' | 'affiliate';

export interface UserProfile {
  id: string;
  name: string;
  organization: string;
  country: string;
  email: string;
  initials: string;
  selectedModel: EngagementModelId;
  accountType: AccountType;
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
  affiliateEmail: string | null;
  affiliateName: string | null;
}

export interface AffiliateStats {
  affiliateId: string;
  referralCode: string;
  leadsCount: number;
  dealsClosed: number;
  totalDealValue: number;
  commissionOwed: number;
}

export interface AdminAffiliate {
  affiliateId: string;
  fullName: string;
  email: string;
  age: number | null;
  country: string | null;
  referralCode: string;
  createdAt: string;
  leadsCount: number;
  dealsClosed: number;
  totalDealValue: number;
  commissionOwed: number;
}

export interface AdminAffiliateConversation {
  affiliateId: string;
  fullName: string;
  email: string;
  referralCode: string;
  affiliateSince: string;
  unreadCount: number;
  lastMessage: string | null;
  lastMessageAt: string | null;
}

export interface AffiliateReferredClient {
  userId: string;
  affiliateId: string;
  fullName: string;
  organization: string;
  status: ClientStatus;
  dealValue: number | null;
  clientSince: string;
  commissionContribution: number;
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
    path?: string;
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
  path: string;
}

export interface NotebookSection {
  key: string;
  label: string;
  content: string;
  sortOrder: number;
  updatedBy: string | null;
  updatedAt: string | null;
}

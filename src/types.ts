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

export interface UserProfile {
  name: string;
  organization: string;
  email: string;
  initials: string;
  selectedModel: EngagementModelId;
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

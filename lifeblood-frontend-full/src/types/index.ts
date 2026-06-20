export interface User {
  id: number;
  name: string;
  email: string;
  bloodGroup: BloodGroup;
  phone: string;
  address: string;
  division: string;
  district: string;
  upazila: string;
  role: 'donor' | 'recipient' | 'admin';
  isVerified: boolean;
  isActive: boolean;
  lastDonationDate?: string;
  totalDonations: number;
  badge?: BadgeLabel | null;
  chatEnabled?: boolean;
  createdAt?: string;
  updatedAt?: string;
  searchHistory?: SearchRecord[];
}

export type BadgeLabel = 'Hero Donor' | 'Life Saver';

export type RequestStatus = 'open' | 'fulfilled' | 'cancelled';
export type NotificationStatus = 'pending' | 'accepted' | 'declined';

export interface DonationRequest {
  id: number;
  seeker: { id: number };
  bloodGroup: BloodGroup;
  division: string;
  district: string;
  upazila: string;
  deadline: string;
  status: RequestStatus;
  notes?: string;
  createdAt?: string;
  notifiedDonorCount: number;
}

export interface RequestNotification {
  id: number;
  request: DonationRequest;
  donor: { id: number };
  status: NotificationStatus;
  createdAt?: string;
  respondedAt?: string;
}

export interface DonationRecord {
  id: number;
  donor: { id: number };
  donationDate: string;
  location: string;
  recipientContact?: string;
  notes?: string;
  createdAt?: string;
}

export interface SearchRecord {
  id: string;
  bloodGroup: BloodGroup;
  location: string;
  timestamp: string;
  resultsCount: number;
}

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export interface SearchFilters {
  bloodGroup: BloodGroup;
  city: string;
  state: string;
  maxDistance?: number;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
}

export type MessageType = 'text' | 'location';

export interface ChatMessage {
  id: number;
  senderId: number;
  receiverId: number;
  type: MessageType;
  content?: string;
  latitude?: number;
  longitude?: number;
  isRead: boolean;
  createdAt?: string;
}

export interface ConversationUserRef {
  id: number;
  name: string;
  bloodGroup: BloodGroup;
  role: 'donor' | 'recipient' | 'admin';
}

export interface Conversation {
  otherUser: ConversationUserRef;
  lastMessage: ChatMessage;
  unreadCount: number;
  blockedByMe: boolean;
  blockedMe: boolean;
}

export interface BlockedUserEntry {
  id: number;
  blockedUser: ConversationUserRef;
  createdAt?: string;
}
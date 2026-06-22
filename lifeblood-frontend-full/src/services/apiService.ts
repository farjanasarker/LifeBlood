import axios from 'axios';
import { API_BASE_URL } from '../config/apiConfig';
import { jwtUtils } from '../utils/jwtUtils';
import type {
  BlockedUserEntry,
  BloodGroup,
  ChatMessage,
  Conversation,
  ConversationUserRef,
  DonationRequest,
  RequestNotification,
  User,
} from '../types';

interface UserPayload {
  id?: number;
  name?: string;
  email: string;
  password?: string;
  passwordHash?: string;
  phone?: string;
  role?: string;
  bloodGroup?: string;
  division?: string;
  district?: string;
  upazila?: string;
  address?: string;
  isActive?: boolean;
  isVerified?: boolean;
}

interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  division: string;
  district: string;
  upazila: string;
  address?: string;
  bloodGroup: string;
}

interface RawDonation {
  id: number;
  donor: { id: number };
  donationDate: string;
  location: string;
  notes?: string;
  recipientContact?: string;
  createdAt?: string;
}

interface RawAdminUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  division: string;
  district: string;
  upazila: string;
  address: string;
  bloodGroup: string;
  role: string;
  isActive: boolean;
  isVerified: boolean;
  totalDonations: number;
  lastDonationDate?: string;
  createdAt?: string;
}

interface SearchParams {
  bloodGroup?: string;
  division?: string;
  district?: string;
  upazila?: string;
}

interface RawDonationRequest {
  id: number;
  seeker: { id: number };
  bloodGroup: string;
  division: string;
  district: string;
  upazila: string;
  deadline: string;
  status: string;
  notes?: string;
  createdAt?: string;
  notifiedDonorCount: number;
}

interface RawNotification {
  id: number;
  request: RawDonationRequest;
  donor: { id: number };
  status: string;
  createdAt?: string;
  respondedAt?: string;
}

interface RequestPayload {
  bloodGroup: string;
  division: string;
  district: string;
  upazila: string;
  deadline: string;
  notes?: string;
}

interface RawConversationUserRef {
  id: number;
  name: string;
  bloodGroup: string;
  role: string;
}

interface RawMessage {
  id: number;
  senderId: number;
  receiverId: number;
  type: string;
  content?: string;
  latitude?: number;
  longitude?: number;
  isRead: boolean;
  createdAt?: string;
}

interface RawConversation {
  otherUser: RawConversationUserRef;
  lastMessage: RawMessage;
  unreadCount: number;
  blockedByMe: boolean;
  blockedMe: boolean;
}

interface RawBlockedUserEntry {
  id: number;
  blockedUser: RawConversationUserRef;
  createdAt?: string;
}

interface SendMessagePayload {
  receiverId: number;
  type: 'text' | 'location';
  content?: string;
  latitude?: number;
  longitude?: number;
}

export interface AssistantChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
  withCredentials: true,
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  console.log('API: Making request to:', config.url);
  const token = localStorage.getItem("token");
  if (token) {
    if (jwtUtils.isTokenExpired()) {
      console.warn('Token expired, removing from storage');
      localStorage.removeItem('token');
      return Promise.reject(new Error('Token expired'));
    }
    config.headers.Authorization = `Bearer ${token}`;
    console.log('API: Added Authorization header');
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log('API: Response received:', response.status);
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    if (error.response?.status === 401) {
      const isAuthEndpoint = error.config?.url?.includes('/auth/') || error.config?.url?.includes('/login');
      if (isAuthEndpoint) localStorage.removeItem('token');
      else error.authenticationError = true;
    }
    return Promise.reject(error);
  }
);

const bloodGroupToEnumMap: Record<string, string> = { "A+": "A_PLUS", "A-": "A_NEG", "B+": "B_PLUS", "B-": "B_NEG", "AB+": "AB_PLUS", "AB-": "AB_NEG", "O+": "O_PLUS", "O-": "O_NEG" };
const bloodGroupFromEnumMap: Record<string, string> = { "A_PLUS": "A+", "A_NEG": "A-", "B_PLUS": "B+", "B_NEG": "B-", "AB_PLUS": "AB+", "AB_NEG": "AB-", "O_PLUS": "O+", "O_NEG": "O-" };

const formatDateForBackend = (dateString: string): string => {
  try {
    if (dateString.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/)) return dateString;
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) return dateString + 'T00:00:00';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) throw new Error('Invalid date');
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T00:00:00`;
  } catch (error) {
    console.error('API: Date formatting error:', error);
    throw new Error(`Invalid date format: ${dateString}`);
  }
};

const parseDateFromBackend = (dateString: string): string => {
  try {
    if (!dateString) return dateString;
    if (dateString.match(/^\d{4}-\d{2}-\d{2}T/)) return dateString.split('T')[0];
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('API: Date parsing error:', error);
    return dateString;
  }
};

const extractErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string; error?: string } | string | undefined;
    if (typeof data === 'string' && data) return data;
    if (data && typeof data === 'object') {
      if (data.message) return data.message;
      if (data.error) return data.error;
    }
    return error.message || fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
};

export const apiService = {
  getCurrentUser: () => jwtUtils.getTokenInfo(),
  getCurrentUserId: (): number | null => {
    const userId = jwtUtils.getUserId();
    return userId ? parseInt(userId, 10) : null;
  },
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('token');
    return token !== null && !jwtUtils.isTokenExpired();
  },
  register: async (userData: RegisterPayload) => {
    try {
      const response = await api.post('/auth/register', {
        name: userData.fullName,
        email: userData.email,
        passwordHash: userData.password,
        phone: userData.phone,
        division: userData.division,
        district: userData.district,
        upazila: userData.upazila,
        address: userData.address || '',
        bloodGroup: bloodGroupToEnumMap[userData.bloodGroup] || userData.bloodGroup,
      });
      return response.data;
    } catch (error) {
      console.error('API: Registration error:', error);
      throw error;
    }
  },
  login: async (user: UserPayload) => {
    try {
      const response = await api.post('/auth/login', { email: user.email, passwordHash: user.password });
      const authHeader = response.headers['authorization'] || response.headers['Authorization'] || response.headers['AUTHORIZATION'];
      const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
      if (token) {
        localStorage.setItem('token', token);
        jwtUtils.getTokenInfo();
      }
      return response.data;
    } catch (error) {
      console.error('API: Login error:', error);
      throw error;
    }
  },
  logout: () => localStorage.removeItem('token'),
  addDonation: async (donationData: { donationDate: string; location: string; notes?: string; recipientContact?: string }) => {
    try {
      const donorId = apiService.getCurrentUserId();
      if (!donorId) throw new Error('Unable to determine donor ID. Please login again.');
      if (typeof donorId !== 'number' || donorId <= 0) throw new Error(`Invalid donor ID: ${donorId}`);
      if (!donationData.donationDate) throw new Error('Donation date is required');
      if (!donationData.location || donationData.location.trim() === '') throw new Error('Location is required');
      const formattedDate = formatDateForBackend(donationData.donationDate);
      const payload = { donationDate: formattedDate, location: donationData.location.trim(), recipientContact: donationData.recipientContact?.trim() || '', notes: donationData.notes?.trim() || '', donor: { id: donorId } };
      const response = await api.post('/donations', payload);
      return response.data || { success: true };
    } catch (error) {
      console.error('API: Failed to add donation:', error);
      throw new Error(extractErrorMessage(error, 'Failed to add donation record. Please try again.'));
    }
  },
  getDonations: async (donorId?: number) => {
    try {
      let targetDonorId: number | null | undefined = donorId;
      if (!targetDonorId) {
        targetDonorId = apiService.getCurrentUserId();
        if (!targetDonorId) throw new Error('Unable to determine donor ID. Please login again.');
      }
      if (!targetDonorId || typeof targetDonorId !== 'number' || targetDonorId <= 0) throw new Error(`Invalid donor ID: ${targetDonorId}`);
      const response = await api.get(`/donations/${targetDonorId}`);
      const donations = ((response.data || []) as RawDonation[]).map((donation) => ({
        ...donation,
        donationDate: donation.donationDate ? parseDateFromBackend(donation.donationDate) : donation.donationDate,
        donationTimestamp: donation.donationDate,
        id: donation.id?.toString() || Math.random().toString(),
        donor: { ...donation.donor, id: donation.donor?.id ?? targetDonorId }
      }));
      return donations;
    } catch (error) {
      console.error('API: Failed to fetch donations:', error);
      if (axios.isAxiosError(error) && error.response?.status === 404) return [];
      throw new Error(extractErrorMessage(error, 'Failed to fetch donation records'));
    }
  },
  getDonationStats: async (donorId?: number) => {
    try {
      const targetDonorId = donorId || apiService.getCurrentUserId();
      if (!targetDonorId) throw new Error('Unable to determine donor ID. Please login again.');
      const donations = await apiService.getDonations(targetDonorId);
      const stats = {
        totalDonations: donations.length,
        lastDonationDate: donations.length > 0 ? donations.sort((a, b) => {
          const dateA = new Date(a.donationTimestamp || a.donationDate);
          const dateB = new Date(b.donationTimestamp || b.donationDate);
          return dateB.getTime() - dateA.getTime();
        })[0].donationDate : null,
        donationsThisYear: donations.filter((d) => new Date(d.donationTimestamp || d.donationDate).getFullYear() === new Date().getFullYear()).length
      };
      return stats;
    } catch (error) {
      console.error('API: Failed to calculate donation stats:', error);
      throw error;
    }
  },
  updateUser: async (id: number, userData: UserPayload) => {
    try {
      if (!userData.name || !userData.email) throw new Error('Name and email are required');
      const currentToken = localStorage.getItem('token');
      if (!apiService.isAuthenticated()) throw new Error('Authentication required. Please login again.');
      const updatePayload: UserPayload & { id: number } = {
        id: id,
        name: userData.name.trim(),
        email: userData.email.trim(),
        phone: userData.phone?.trim() || '',
        division: userData.division?.trim() || '',
        district: userData.district?.trim() || '',
        upazila: userData.upazila?.trim() || '',
        address: userData.address?.trim() || '',
        bloodGroup: userData.bloodGroup,
        role: userData.role,
        isActive: userData.isActive,
        isVerified: userData.isVerified
      };
      if (userData.passwordHash && userData.passwordHash.length > 0) {
        updatePayload.passwordHash = userData.passwordHash;
      }
      const response = await api.put(`/users/${id}`, updatePayload);
      const stillAuthenticated = apiService.isAuthenticated();
      if (!stillAuthenticated && currentToken) {
        localStorage.setItem('token', currentToken);
        apiService.isAuthenticated();
      }
      return response.data || { success: true, message: 'Profile updated successfully', ...updatePayload };
    } catch (error) {
      console.error('API: Profile update failed:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) throw new Error('Authentication session expired. Please login again.');
        if (error.response?.status === 400) throw new Error(error.response?.data?.message || 'Invalid profile data provided');
        if (error.response?.status === 403) throw new Error('You do not have permission to update this profile');
        if (error.response?.status === 404) throw new Error('User profile not found');
        if (error.response?.status && error.response.status >= 500) throw new Error('Server error occurred. Please try again later.');
        if (error.code === 'ERR_NETWORK' || error.message?.includes('Network')) throw new Error('Network error. Please check your connection.');
      }
      throw new Error(extractErrorMessage(error, 'Failed to update profile. Please try again.'));
    }
  },
  handleTokenRefresh: async (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const token = localStorage.getItem('token');
      if (token && !jwtUtils.isTokenExpired()) {
        try {
          const tokenInfo = jwtUtils.getTokenInfo();
          if (tokenInfo) return true;
        } catch {
          console.log('API: Token is actually expired, removing...');
          localStorage.removeItem('token');
          return false;
        }
      } else {
        localStorage.removeItem('token');
        return false;
      }
    }
    return true;
  },
  getUser: async (id: number) => {
    try {
      const response = await api.get(`/users/${id}`);
      return response.data;
    } catch (error) {
      console.error('API: Failed to fetch user:', error);
      throw error;
    }
  },
  checkServerHealth: async () => {
    try {
      const response = await api.get('/health', { timeout: 5000 });
      return response.status === 200;
    } catch (error) {
      console.error('Server health check failed:', error);
      return false;
    }
  },
  validateSession: async () => {
    try {
      if (!apiService.isAuthenticated()) return false;
      const userId = apiService.getCurrentUserId();
      if (!userId) return false;
      await apiService.getUser(userId);
      return true;
    } catch (error) {
      console.error('Session validation failed:', error);
      localStorage.removeItem('token');
      return false;
    }
  },
  getCurrentUserProfile: async () => {
    try {
      const userId = apiService.getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');
      return await apiService.getUser(userId);
    } catch (error) {
      console.error('API: Failed to fetch current user profile:', error);
      throw error;
    }
  },
  getAllUsers: async (): Promise<User[]> => {
    try {
      const response = await api.get('/admin/users');
      return (response.data as RawAdminUser[]).map((user) => ({
        ...user,
        bloodGroup: (bloodGroupFromEnumMap[user.bloodGroup] || user.bloodGroup) as BloodGroup,
        role: user.role as User['role'],
      }));
    } catch (error) {
      console.error('API: Failed to fetch all users:', error);
      throw error;
    }
  },
  verifyUser: async (id: number) => {
    try {
      const response = await api.put(`/admin/verify/${id}`);
      return response.data;
    } catch (error) {
      console.error('API: Failed to verify user:', error);
      throw error;
    }
  },
  disableUser: async (id: number) => {
    try {
      const response = await api.put(`/admin/disable/${id}`);
      return response.data;
    } catch (error) {
      console.error('API: Failed to disable user:', error);
      throw error;
    }
  },
  reactiveUser: async (id: number) => {
    try {
      const response = await api.put(`/admin/reactive/${id}`);
      return response.data;
    } catch (error) {
      console.error('API: Failed to reactivate user:', error);
      throw error;
    }
  },
  createRequest: async (data: RequestPayload): Promise<DonationRequest> => {
    try {
      const payload = { ...data, bloodGroup: bloodGroupToEnumMap[data.bloodGroup] || data.bloodGroup };
      const response = await api.post('/requests', payload);
      const raw = response.data as RawDonationRequest;
      return {
        ...raw,
        bloodGroup: (bloodGroupFromEnumMap[raw.bloodGroup] || raw.bloodGroup) as BloodGroup,
        status: raw.status as DonationRequest['status'],
      };
    } catch (error) {
      console.error('API: Failed to create request:', error);
      throw new Error(extractErrorMessage(error, 'Failed to create blood request. Please try again.'));
    }
  },
  getMyRequests: async (): Promise<DonationRequest[]> => {
    try {
      const response = await api.get('/requests/mine');
      return ((response.data || []) as RawDonationRequest[]).map((r) => ({
        ...r,
        bloodGroup: (bloodGroupFromEnumMap[r.bloodGroup] || r.bloodGroup) as BloodGroup,
        status: r.status as DonationRequest['status'],
      }));
    } catch (error) {
      console.error('API: Failed to fetch my requests:', error);
      throw new Error(extractErrorMessage(error, 'Failed to fetch your requests.'));
    }
  },
  getMyNotifications: async (): Promise<RequestNotification[]> => {
    try {
      const response = await api.get('/requests/notifications/mine');
      return ((response.data || []) as RawNotification[]).map((n) => ({
        ...n,
        status: n.status as RequestNotification['status'],
        request: {
          ...n.request,
          bloodGroup: (bloodGroupFromEnumMap[n.request.bloodGroup] || n.request.bloodGroup) as BloodGroup,
          status: n.request.status as DonationRequest['status'],
        },
      }));
    } catch (error) {
      console.error('API: Failed to fetch notifications:', error);
      throw new Error(extractErrorMessage(error, 'Failed to fetch notifications.'));
    }
  },
  respondToNotification: async (notificationId: number, status: 'accepted' | 'declined') => {
    try {
      const response = await api.put(`/requests/notifications/${notificationId}/respond`, { status });
      return response.data;
    } catch (error) {
      console.error('API: Failed to respond to notification:', error);
      throw new Error(extractErrorMessage(error, 'Failed to submit your response. Please try again.'));
    }
  },
  searchDonors: async (params: SearchParams) => {
    try {
      const searchParams = { bloodGroup: params.bloodGroup, division: params.division, district: params.district, upazila: params.upazila };
      const cleanParams = Object.fromEntries(Object.entries(searchParams).filter(([, v]) => v !== undefined && v !== ''));
      const response = await api.get('/search', { params: cleanParams });
      const transformedResults = (response.data || []).map((donor: RawAdminUser) => ({ ...donor, bloodGroup: bloodGroupFromEnumMap[donor.bloodGroup] || donor.bloodGroup }));
      return transformedResults;
    } catch (error) {
      console.error('API: Failed to search donors:', error);
      if (axios.isAxiosError(error) && error.response?.status === 404) return [];
      throw error;
    }
  },
  updateChatSettings: async (chatEnabled: boolean): Promise<{ chatEnabled: boolean }> => {
    try {
      const response = await api.put('/chat/settings', { chatEnabled });
      return response.data;
    } catch (error) {
      console.error('API: Failed to update chat settings:', error);
      throw new Error(extractErrorMessage(error, 'Failed to update chat settings.'));
    }
  },
  sendMessage: async (data: SendMessagePayload): Promise<ChatMessage> => {
    try {
      const response = await api.post('/messages', data);
      const raw = response.data as RawMessage;
      return { ...raw, type: raw.type as ChatMessage['type'] };
    } catch (error) {
      console.error('API: Failed to send message:', error);
      throw new Error(extractErrorMessage(error, 'Failed to send message.'));
    }
  },
  getConversations: async (): Promise<Conversation[]> => {
    try {
      const response = await api.get('/messages/conversations');
      return ((response.data || []) as RawConversation[]).map((c) => ({
        ...c,
        otherUser: {
          ...c.otherUser,
          bloodGroup: (bloodGroupFromEnumMap[c.otherUser.bloodGroup] || c.otherUser.bloodGroup) as BloodGroup,
          role: c.otherUser.role as ConversationUserRef['role'],
        },
        lastMessage: { ...c.lastMessage, type: c.lastMessage.type as ChatMessage['type'] },
      }));
    } catch (error) {
      console.error('API: Failed to fetch conversations:', error);
      throw new Error(extractErrorMessage(error, 'Failed to fetch conversations.'));
    }
  },
  getMessages: async (otherUserId: number): Promise<ChatMessage[]> => {
    try {
      const response = await api.get(`/messages/${otherUserId}`);
      return ((response.data || []) as RawMessage[]).map((m) => ({ ...m, type: m.type as ChatMessage['type'] }));
    } catch (error) {
      console.error('API: Failed to fetch messages:', error);
      throw new Error(extractErrorMessage(error, 'Failed to fetch messages.'));
    }
  },
  blockUser: async (userId: number): Promise<BlockedUserEntry> => {
    try {
      const response = await api.post(`/blocks/${userId}`);
      const raw = response.data as RawBlockedUserEntry;
      return {
        ...raw,
        blockedUser: {
          ...raw.blockedUser,
          bloodGroup: (bloodGroupFromEnumMap[raw.blockedUser.bloodGroup] || raw.blockedUser.bloodGroup) as BloodGroup,
          role: raw.blockedUser.role as ConversationUserRef['role'],
        },
      };
    } catch (error) {
      console.error('API: Failed to block user:', error);
      throw new Error(extractErrorMessage(error, 'Failed to block user.'));
    }
  },
  unblockUser: async (userId: number): Promise<void> => {
    try {
      await api.delete(`/blocks/${userId}`);
    } catch (error) {
      console.error('API: Failed to unblock user:', error);
      throw new Error(extractErrorMessage(error, 'Failed to unblock user.'));
    }
  },
  getBlockedUsers: async (): Promise<BlockedUserEntry[]> => {
    try {
      const response = await api.get('/blocks');
      return ((response.data || []) as RawBlockedUserEntry[]).map((b) => ({
        ...b,
        blockedUser: {
          ...b.blockedUser,
          bloodGroup: (bloodGroupFromEnumMap[b.blockedUser.bloodGroup] || b.blockedUser.bloodGroup) as BloodGroup,
          role: b.blockedUser.role as ConversationUserRef['role'],
        },
      }));
    } catch (error) {
      console.error('API: Failed to fetch blocked users:', error);
      throw new Error(extractErrorMessage(error, 'Failed to fetch blocked users.'));
    }
  },
  assistantChat: async (message: string, history: AssistantChatTurn[]): Promise<string> => {
    try {
      const response = await api.post('/assistant/chat', { message, history });
      return (response.data as { answer: string }).answer;
    } catch (error) {
      console.error('API: Failed to get assistant reply:', error);
      throw new Error(extractErrorMessage(error, 'The assistant is unavailable right now. Please try again later.'));
    }
  },
};
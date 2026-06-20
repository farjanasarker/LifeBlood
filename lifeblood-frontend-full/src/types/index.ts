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
  createdAt?: string;
  updatedAt?: string;
  searchHistory?: SearchRecord[];
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
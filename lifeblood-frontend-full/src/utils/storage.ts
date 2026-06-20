import { User, DonationRecord } from '../types';

const USERS_KEY = 'lifeblood_users';
const DONATIONS_KEY = 'lifeblood_donations';
const CURRENT_USER_KEY = 'lifeblood_current_user';

export const storageUtils = {
  // User management
  getUsers(): User[] {
    const users = localStorage.getItem(USERS_KEY);
    return users ? JSON.parse(users) : [];
  },

  saveUsers(users: User[]): void {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },

  getUserById(id: number): User | null {
    const users = this.getUsers();
    return users.find(user => user.id === id) || null;
  },

  getUserByEmail(email: string): User | null {
    const users = this.getUsers();
    return users.find(user => user.email === email) || null;
  },

  saveUser(user: User): void {
    const users = this.getUsers();
    const existingIndex = users.findIndex(u => u.id === user.id);

    if (existingIndex >= 0) {
      users[existingIndex] = user;
    } else {
      users.push(user);
    }

    this.saveUsers(users);
  },

  deleteUser(userId: number): void {
    const users = this.getUsers().filter(user => user.id !== userId);
    this.saveUsers(users);
  },

  // Current user session
  getCurrentUser(): User | null {
    const userJson = localStorage.getItem(CURRENT_USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  },

  setCurrentUser(user: User | null): void {
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  },

  // Donation records
  getDonations(): DonationRecord[] {
    const donations = localStorage.getItem(DONATIONS_KEY);
    return donations ? JSON.parse(donations) : [];
  },

  saveDonation(donation: DonationRecord): void {
    const donations = this.getDonations();
    donations.push(donation);
    localStorage.setItem(DONATIONS_KEY, JSON.stringify(donations));
  },

  getDonationsByDonor(donorId: number): DonationRecord[] {
    return this.getDonations().filter(donation => donation.donor.id === donorId);
  },

  // Initialize with sample data
  initializeSampleData(): void {
    if (this.getUsers().length === 0) {
      const sampleUsers: User[] = [
        {
          id: 1,
          name: 'John Smith',
          email: 'john@example.com',
          bloodGroup: 'O+',
          phone: '+1-555-0101',
          address: '123 Main St',
          division: 'Dhaka',
          district: 'Dhaka',
          upazila: 'Dhanmondi',
          role: 'donor',
          isVerified: true,
          isActive: true,
          totalDonations: 0,
        },
        {
          id: 2,
          name: 'Sarah Johnson',
          email: 'sarah@example.com',
          bloodGroup: 'A+',
          phone: '+1-555-0102',
          address: '456 Oak Ave',
          division: 'Dhaka',
          district: 'Dhaka',
          upazila: 'Gulshan',
          role: 'donor',
          isVerified: true,
          isActive: true,
          totalDonations: 0,
        },
        {
          id: 3,
          name: 'Admin User',
          email: 'admin@lifeblood.com',
          bloodGroup: 'AB+',
          phone: '+1-555-0000',
          address: '789 Admin St',
          division: 'Dhaka',
          district: 'Dhaka',
          upazila: 'Mirpur',
          role: 'admin',
          isVerified: true,
          isActive: true,
          totalDonations: 0,
        }
      ];

      this.saveUsers(sampleUsers);
    }
  }
};

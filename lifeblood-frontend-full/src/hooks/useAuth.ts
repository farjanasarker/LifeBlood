import { useState, useEffect } from 'react';
import { User, AuthState } from '../types';
import { apiService } from '../services/apiService';

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    loading: true,
  });

  // FIXED: Proper token validation and user data retrieval
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('useAuth: Initializing authentication...');
      
      // Check if API service considers us authenticated
      if (apiService.isAuthenticated()) {
        try {
          console.log('useAuth: User is authenticated, checking stored data...');
          
          // Try to get stored user data
          const storedUser = localStorage.getItem('user');
          
          if (storedUser) {
            const userData = JSON.parse(storedUser);
            console.log('useAuth: Restored user from storage:', userData);
            
            setAuthState({
              user: userData,
              isAuthenticated: true,
              loading: false,
            });
          } else {
            console.log('useAuth: Token exists but no user data, clearing...');
            
            // Clear invalid token
            apiService.logout();
            setAuthState({
              user: null,
              isAuthenticated: false,
              loading: false,
            });
          }
        } catch (error) {
          console.error('useAuth: Error restoring auth state:', error);
          apiService.logout();
          localStorage.removeItem('user');
          setAuthState({
            user: null,
            isAuthenticated: false,
            loading: false,
          });
        }
      } else {
        console.log('useAuth: Not authenticated');
        setAuthState({
          user: null,
          isAuthenticated: false,
          loading: false,
        });
      }
    };

    initializeAuth();
  }, []);

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('useAuth: Starting login process...');
      setAuthState(prev => ({ ...prev, loading: true }));
      
      const response = await apiService.login({ email, password });
      console.log('useAuth: Login response received:', response);
      
      // FIXED: Properly handle user data from response
      const userData = response;
      
      // Ensure user has required fields
      if (!userData.id) {
        console.error('useAuth: User data missing ID:', userData);
        throw new Error('Invalid user data received');
      }

      // Store user data in localStorage for persistence
      localStorage.setItem('user', JSON.stringify(userData));
      console.log('useAuth: User data stored in localStorage');

      setAuthState({
        user: userData,
        isAuthenticated: true,
        loading: false,
      });

      console.log('useAuth: Login successful, state updated');
      return { success: true };
    } catch (error: any) {
      console.error('useAuth: Login failed:', error);
      
      let errorMessage = 'Login failed';
      
      if (error.response) {
        switch (error.response.status) {
          case 401:
            errorMessage = 'Invalid email or password';
            break;
          case 400:
            errorMessage = 'Please provide valid email and password';
            break;
          case 500:
            errorMessage = 'Server error. Please try again later';
            break;
          default:
            errorMessage = `Login failed: ${error.response.status}`;
        }
      } else if (error.request) {
        errorMessage = 'Network error. Please check your connection';
      } else {
        errorMessage = error.message || 'Login failed';
      }

      setAuthState({
        user: null,
        isAuthenticated: false,
        loading: false,
      });
      
      return { success: false, error: errorMessage };
    }
  };

  const register = async (
    userData: any
  ): Promise<{ success: boolean; error?: string; message?: string; user?: any }> => {
    try {
      console.log('useAuth: Starting registration process...');
      console.log('useAuth: Registration data:', userData);

      // Validate required fields
      const requiredFields = ['fullName', 'email', 'password', 'phone', 'division', 'district', 'upazila', 'bloodGroup'];
      const missingFields = requiredFields.filter(field => !userData[field] || userData[field].trim() === '');
      
      if (missingFields.length > 0) {
        const error = `Missing required fields: ${missingFields.join(', ')}`;
        console.error('useAuth: Validation failed:', error);
        return { success: false, error };
      }

      // Call API service for registration
      const response = await apiService.register(userData);
      console.log('useAuth: Registration successful:', response);

      // FIXED: Simplified auto-login - wait longer and handle properly
      console.log('useAuth: Starting auto-login after registration...');
      
      // Wait for registration to complete on server
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const loginResult = await login(userData.email, userData.password);
      
      if (loginResult.success) {
        console.log('useAuth: Auto-login successful after registration');
        return { 
          success: true, 
          message: 'Registration and login successful!',
          user: authState.user,
          autoLogin: true
        };
      } else {
        console.log('useAuth: Auto-login failed, but registration was successful');
        return { 
          success: true, 
          message: 'Registration successful! Please login manually.',
          error: 'Auto-login failed: ' + loginResult.error,
          autoLogin: false
        };
      }
      
    } catch (error: any) {
      console.error('useAuth: Registration failed:', error);

      let errorMessage = 'Registration failed';

      if (error.response) {
        console.error('useAuth: Server error response:', error.response.data);
        switch (error.response.status) {
          case 409:
            errorMessage = 'User already exists with this email';
            break;
          case 400:
            errorMessage = error.response.data?.message || 'Invalid data provided';
            break;
          case 422:
            errorMessage = 'Invalid input data. Please check all fields';
            break;
          case 500:
            errorMessage = 'Server error. Please try again later';
            break;
          default:
            errorMessage = `Registration failed: ${error.response.status}`;
        }
      } else if (error.request) {
        console.error('useAuth: Network error:', error.request);
        errorMessage = 'Network error. Please check your connection';
      } else {
        console.error('useAuth: Unknown error:', error.message);
        errorMessage = error.message || 'Registration failed';
      }

      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    console.log('useAuth: Logging out...');
    apiService.logout();
    localStorage.removeItem('user'); // Also remove user data
    setAuthState({
      user: null,
      isAuthenticated: false,
      loading: false,
    });
    console.log('useAuth: Logout complete');
  };

  // FIXED: Enhanced updateUser to prevent navigation issues
  const updateUser = async (updatedUser: User) => {
  if (authState.user) {
    try {
      console.log('useAuth: Updating user:', updatedUser);
      
      // Call API to update user on server
      const response = await apiService.updateUser(
        parseInt(authState.user.id),
        updatedUser
      );

      // ধরো server শুধু success message রিটার্ন করে
      // সেক্ষেত্রে আসল updated user আমরা বানিয়ে নিতে পারি
      const mergedUser = {
        ...authState.user,  // আগের user state
        ...updatedUser     // নতুন updated fields
      };

      // LocalStorage এ save করো
      localStorage.setItem('user', JSON.stringify(mergedUser));

      // Auth state update করো
      setAuthState((prev) => ({
        ...prev,
        user: mergedUser,
      }));

      console.log('useAuth: User updated successfully in auth state and localStorage');

      return { success: true, message: "Profile updated successfully", user: mergedUser };
    } catch (error) {
      console.error('useAuth: User update failed:', error);
      throw error;
    }
  } else {
    throw new Error('No user to update');
  }
};
//     const updateUser = async (updatedUser: UserType) => {
//   try {
//     const response = await api.put(`/users/${updatedUser.id}`, updatedUser);
//     const newToken = response.headers["authorization"]; // Bearer token
//     const user = response.data; // updated user profile

//     if (newToken) {
//       localStorage.setItem("token", newToken.replace("Bearer ", ""));
//     }
//     localStorage.setItem("user", JSON.stringify(user));
//     setUser(user);

//     return { success: true, user };
//   } catch (err) {
//     return { success: false, error: err.message };
//   }
// };


  // FIXED: Enhanced authentication validation
  const validateAuth = (): boolean => {
    const isValid = !!(authState.user && authState.isAuthenticated && authState.user.id && apiService.isAuthenticated());
    console.log('useAuth: Auth validation result:', isValid, {
      hasUser: !!authState.user,
      isAuthenticated: authState.isAuthenticated,
      hasUserId: !!authState.user?.id,
      userId: authState.user?.id,
      apiServiceAuth: apiService.isAuthenticated()
    });
    return isValid;
  };

  // FIXED: Enhanced donation management with better state handling
  const addDonation = async (donationData: {
    donationDate: string;
    location: string;
    notes?: string;
    recipientContact?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    console.log('useAuth: Starting addDonation...');
    console.log('useAuth: Donation data received:', donationData);
    console.log('useAuth: Current auth state:', {
      hasUser: !!authState.user,
      isAuthenticated: authState.isAuthenticated,
      userId: authState.user?.id
    });

    // Use validation helper
    if (!validateAuth()) {
      console.error('useAuth: Authentication validation failed');
      return { success: false, error: 'User not authenticated. Please login again.' };
    }

    try {
      console.log('useAuth: Adding donation record...');
      
      // FIXED: Validate date format before sending
      if (!donationData.donationDate || donationData.donationDate.trim() === '') {
        return { success: false, error: 'Please select a valid donation date.' };
      }
      
      // Check if date is in the future
      const selectedDate = new Date(donationData.donationDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to compare only dates
      
      if (selectedDate > today) {
        return { success: false, error: 'Donation date cannot be in the future.' };
      }
      
      // FIXED: Use apiService directly - it handles user ID detection and date formatting
      const response = await apiService.addDonation(donationData);
      console.log('useAuth: Donation added successfully:', response);

      // FIXED: Update user's last donation date and availability WITHOUT causing navigation
      const updatedUserData = {
        ...authState.user!,
        lastDonationDate: donationData.donationDate,
        isAvailable: false
      };

      // Update localStorage to maintain consistency
      localStorage.setItem('user', JSON.stringify(updatedUserData));

      // Update auth state with new user data
      setAuthState(prev => ({
        ...prev,
        user: updatedUserData
      }));

      console.log('useAuth: User state updated after donation');
      return { success: true };
      
    } catch (error: any) {
      console.error('useAuth: Failed to add donation:', error);
      
      let errorMessage = 'Failed to add donation';
      
      if (error.response) {
        switch (error.response.status) {
          case 400:
            if (error.response.data?.message?.includes('date')) {
              errorMessage = 'Please provide a valid donation date in YYYY-MM-DD format';
            } else {
              errorMessage = error.response.data?.message || 'Invalid donation data provided';
            }
            break;
          case 401:
            errorMessage = 'Authentication expired. Please login again.';
            // Clear auth state on 401
            logout();
            break;
          case 403:
            errorMessage = 'Access denied';
            break;
          case 500:
            errorMessage = 'Server error. Please try again later';
            break;
          default:
            errorMessage = `Failed to add donation: ${error.response.status}`;
        }
      } else if (error.request) {
        errorMessage = 'Network error. Please check your connection';
      } else {
        errorMessage = error.message || 'Failed to add donation';
      }

      return { success: false, error: errorMessage };
    }
  };

  const getDonations = async (): Promise<{ success: boolean; data?: any[]; error?: string }> => {
    console.log('useAuth: Starting getDonations...');
    console.log('useAuth: Current auth state:', {
      hasUser: !!authState.user,
      isAuthenticated: authState.isAuthenticated,
      userId: authState.user?.id
    });

    // Use validation helper
    if (!validateAuth()) {
      console.error('useAuth: Authentication validation failed');
      return { success: false, error: 'User not authenticated. Please login again.' };
    }

    try {
      console.log('useAuth: Fetching donation records...');
      
      // FIXED: Use apiService directly - it handles user ID detection and date parsing
      const donations = await apiService.getDonations();
      console.log('useAuth: Donations fetched successfully:', donations);

      // FIXED: Transform backend data to frontend format with proper date handling
      const transformedDonations = donations.map((donation: any) => ({
        id: donation.id?.toString() || Math.random().toString(),
        donorId: donation.donor?.id?.toString() || authState.user!.id,
        date: donation.donationDate, // Already formatted by apiService
        donationDate: donation.donationDate, // Frontend format (YYYY-MM-DD)
        donationTimestamp: donation.donationTimestamp, // Keep original timestamp
        location: donation.location,
        notes: donation.notes || '',
        recipientContact: donation.recipientContact || '',
        createdAt: donation.createdAt || donation.donationTimestamp || donation.donationDate
      }));

      console.log('useAuth: Transformed donations:', transformedDonations);
      return { success: true, data: transformedDonations };
    } catch (error: any) {
      console.error('useAuth: Failed to fetch donations:', error);
      
      let errorMessage = 'Failed to fetch donations';
      
      if (error.response) {
        switch (error.response.status) {
          case 401:
            errorMessage = 'Authentication expired. Please login again.';
            // Clear auth state on 401
            logout();
            break;
          case 403:
            errorMessage = 'Access denied';
            break;
          case 404:
            console.log('useAuth: No donations found, returning empty array');
            return { success: true, data: [] };
          case 500:
            errorMessage = 'Server error. Please try again later';
            break;
          default:
            errorMessage = `Failed to fetch donations: ${error.response.status}`;
        }
      } else if (error.request) {
        errorMessage = 'Network error. Please check your connection';
      } else {
        errorMessage = error.message || 'Failed to fetch donations';
      }

      return { success: false, error: errorMessage };
    }
  };

  // FIXED: Get donation statistics with proper date handling
  const getDonationStats = async (): Promise<{ 
    success: boolean; 
    stats?: {
      totalDonations: number;
      lastDonationDate: string | null;
      donationsThisYear: number;
      nextEligibleDate?: string;
    }; 
    error?: string 
  }> => {
    console.log('useAuth: Starting getDonationStats...');

    if (!validateAuth()) {
      console.error('useAuth: Authentication validation failed');
      return { success: false, error: 'User not authenticated. Please login again.' };
    }

    try {
      const donationsResult = await getDonations();
      
      if (!donationsResult.success || !donationsResult.data) {
        return { success: false, error: donationsResult.error || 'Failed to fetch donations' };
      }

      const donations = donationsResult.data;
      
      // Calculate statistics
      const totalDonations = donations.length;
      
      // Find last donation date
      let lastDonationDate: string | null = null;
      let nextEligibleDate: string | null = null;
      
      if (donations.length > 0) {
        // Sort by donation date (most recent first)
        const sortedDonations = [...donations].sort((a, b) => {
          const dateA = new Date(a.donationTimestamp || a.donationDate);
          const dateB = new Date(b.donationTimestamp || b.donationDate);
          return dateB.getTime() - dateA.getTime();
        });
        
        lastDonationDate = sortedDonations[0].donationDate;
        
        // Calculate next eligible date (3 months after last donation)
        const lastDonation = new Date(sortedDonations[0].donationTimestamp || sortedDonations[0].donationDate);
        const nextEligible = new Date(lastDonation);
        nextEligible.setMonth(nextEligible.getMonth() + 3);
        nextEligibleDate = nextEligible.toISOString().split('T')[0];
      }
      
      // Count donations this year
      const currentYear = new Date().getFullYear();
      const donationsThisYear = donations.filter(donation => {
        const donationYear = new Date(donation.donationTimestamp || donation.donationDate).getFullYear();
        return donationYear === currentYear;
      }).length;
      
      const stats = {
        totalDonations,
        lastDonationDate,
        donationsThisYear,
        nextEligibleDate
      };
      
      console.log('useAuth: Donation stats calculated:', stats);
      return { success: true, stats };
    } catch (error: any) {
      console.error('useAuth: Failed to calculate donation stats:', error);
      return { success: false, error: error.message || 'Failed to calculate donation statistics' };
    }
  };

  return {
    ...authState,
    login,
    register,
    logout,
    updateUser,
    addDonation,
    getDonations,
    getDonationStats,
    validateAuth,
  };
};
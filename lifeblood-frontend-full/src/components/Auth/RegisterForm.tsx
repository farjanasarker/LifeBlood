// import React, { useState } from 'react';
// import { User, Mail, Lock, Phone, MapPin, Droplet, UserPlus, AlertCircle, Home } from 'lucide-react';
// // import { BloodGroup } from '../../types';
// // import { locationUtils } from '../../utils/location';
// // import { apiService } from '../../services/apiService';

// interface RegisterFormData {
//   fullName: string;
//   email: string;
//   password: string;
//   phone: string;
//   division: string;
//   district: string;
//   upazila: string;
//   address: string; // ✅ Added address field
//   bloodGroup: string;
// }

// interface RegisterFormProps {
//   onRegister: (userData: any) => Promise<{ success: boolean; message?: string; error?: string; user?: any; autoLogin?: boolean }>;
//   onNavigateToLogin: () => void;
// }

// const RegisterForm: React.FC<RegisterFormProps> = ({ onRegister, onNavigateToLogin }) => {
//   const [formData, setFormData] = useState<RegisterFormData>({
//     fullName: "",
//     email: "",
//     password: "",
//     phone: "",
//     division: "",
//     district: "",
//     upazila: "",
//     address: "", // ✅ Added address field
//     bloodGroup: "",
//   });

//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [success, setSuccess] = useState(false);

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);
//     setError(null);
//     setSuccess(false);

//     try {
//       console.log("Sending registration request through useAuth...");
      
//       // Clean data for registration
//       const result = await onRegister({
//         fullName: formData.fullName,
//         email: formData.email,
//         password: formData.password, // ✅ Simple field name
//         phone: formData.phone,
//         division: formData.division,
//         district: formData.district,
//         upazila: formData.upazila,
//         address: formData.address, // ✅ Added address
//         bloodGroup: formData.bloodGroup,
//       });

//       console.log("Registration result:", result);

//       if (result.success) {
//         setSuccess(true);
//         setFormData({
//           fullName: "",
//           email: "",
//           password: "",
//           phone: "",
//           division: "",
//           district: "",
//           upazila: "",
//           address: "", // ✅ Reset address
//           bloodGroup: "",
//         });

//         // সফল হলে লগইন পেজে পাঠানো
//         setTimeout(() => {
//           onNavigateToLogin();
//         }, 1500);
//       } else {
//         setError(result.error || "Registration failed");
//       }

//     } catch (err: any) {
//       console.error("Registration error:", err);
//       setError(err.message || "Registration failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
//       <div className="max-w-md w-full mx-auto p-8 bg-white rounded-2xl shadow-xl">
//         <div className="text-center mb-6">
//           <h2 className="text-3xl font-bold text-gray-800 mb-2">Join LifeBlood</h2>
//           <p className="text-gray-600">Create your account to save lives</p>
//         </div>

//         {error && (
//           <div className="text-red-600 mb-4 p-3 border border-red-300 rounded-lg bg-red-50 flex items-center">
//             <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
//             <span className="text-sm">{error}</span>
//           </div>
//         )}
        
//         {success && (
//           <div className="text-green-600 mb-4 p-3 border border-green-300 rounded-lg bg-green-50 flex items-center">
//             <div className="w-5 h-5 mr-2 flex-shrink-0 bg-green-500 rounded-full flex items-center justify-center">
//               <div className="w-2 h-2 bg-white rounded-full"></div>
//             </div>
//             <span className="text-sm">Registration successful! Logging you in...</span>
//           </div>
//         )}
        
//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div className="relative">
//             <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
//             <input 
//               type="text" 
//               name="fullName" 
//               placeholder="Full Name" 
//               value={formData.fullName} 
//               onChange={handleChange} 
//               required 
//               className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200" 
//             />
//           </div>

//           <div className="relative">
//             <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
//             <input 
//               type="email" 
//               name="email" 
//               placeholder="Email Address" 
//               value={formData.email} 
//               onChange={handleChange} 
//               required 
//               className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200" 
//             />
//           </div>

//           <div className="relative">
//             <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
//             <input 
//               type="password" 
//               name="password" 
//               placeholder="Password" 
//               value={formData.password} 
//               onChange={handleChange} 
//               required 
//               minLength={6}
//               className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200" 
//             />
//           </div>

//           <div className="relative">
//             <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
//             <input 
//               type="tel" 
//               name="phone" 
//               placeholder="Phone Number" 
//               value={formData.phone} 
//               onChange={handleChange} 
//               required 
//               className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200" 
//             />
//           </div>

//           <div className="grid grid-cols-1 gap-4">
//             <div className="relative">
//               <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
//               <input 
//                 type="text" 
//                 name="division" 
//                 placeholder="Division (e.g., Dhaka)" 
//                 value={formData.division} 
//                 onChange={handleChange} 
//                 required 
//                 className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200" 
//               />
//             </div>

//             <input 
//               type="text" 
//               name="district" 
//               placeholder="District (e.g., Dhaka)" 
//               value={formData.district} 
//               onChange={handleChange} 
//               required 
//               className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200" 
//             />

//             <input 
//               type="text" 
//               name="upazila" 
//               placeholder="Upazila (e.g., Wari)" 
//               value={formData.upazila} 
//               onChange={handleChange} 
//               required 
//               className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200" 
//             />
//           </div>

//           {/* ✅ Address Field Added */}
//           <div className="relative">
//             <Home className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
//             <input 
//               type="text" 
//               name="address" 
//               placeholder="Full Address (Optional)" 
//               value={formData.address} 
//               onChange={handleChange} 
//               className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200" 
//             />
//           </div>

//           <div className="relative">
//             <Droplet className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
//             <select 
//               name="bloodGroup" 
//               value={formData.bloodGroup} 
//               onChange={handleChange} 
//               required 
//               className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 appearance-none bg-white"
//             >
//               <option value="">Select Blood Group</option>
//               <option value="A+">A+</option>
//               <option value="A-">A-</option>
//               <option value="B+">B+</option>
//               <option value="B-">B-</option>
//               <option value="O+">O+</option>
//               <option value="O-">O-</option>
//               <option value="AB+">AB+</option>
//               <option value="AB-">AB-</option>
//             </select>
//           </div>

//           <button 
//             type="submit" 
//             disabled={loading} 
//             className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3 px-4 rounded-lg hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 font-semibold text-lg shadow-lg"
//           >
//             {loading ? (
//               <>
//                 <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
//                 Creating Account...
//               </>
//             ) : (
//               <>
//                 <UserPlus className="w-5 h-5 mr-2" />
//                 Create Account
//               </>
//             )}
//           </button>
//         </form>

//         <div className="mt-6 text-center">
//           <p className="text-gray-600">
//             Already have an account?{' '}
//             <button 
//               onClick={onNavigateToLogin}
//               className="text-red-500 hover:text-red-600 font-semibold transition-colors duration-200"
//             >
//               Sign in here
//             </button>
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default RegisterForm;

import React, { useState, useEffect } from 'react';
import { User as UserIcon, Mail, Lock, Phone, MapPin, Droplet, UserPlus, AlertCircle, Home } from 'lucide-react';
import type { User } from '../../types';
import { divisions, districtsByDivision, upazilasByDistrict } from '../../utils/bangladeshLocations';

interface RegisterFormData {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  division: string;
  district: string;
  upazila: string;
  address: string;
  bloodGroup: string;
}

interface RegisterFormProps {
  onRegister: (userData: RegisterFormData) => Promise<{ success: boolean; message?: string; error?: string; user?: User; autoLogin?: boolean }>;
  onNavigateToLogin: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onRegister, onNavigateToLogin }) => {
  const [formData, setFormData] = useState<RegisterFormData>({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    division: "",
    district: "",
    upazila: "",
    address: "",
    bloodGroup: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);
  const [availableUpazilas, setAvailableUpazilas] = useState<string[]>([]);

  // Update districts when division changes
  useEffect(() => {
    if (formData.division) {
      setAvailableDistricts(districtsByDivision[formData.division] || []);
      // Reset district if it's not in the new division
      if (formData.district && !districtsByDivision[formData.division]?.includes(formData.district)) {
        setFormData(prev => ({ ...prev, district: "", upazila: "" }));
      }
    } else {
      setAvailableDistricts([]);
    }
  }, [formData.division, formData.district]);

  // Update upazilas when district changes
  useEffect(() => {
    if (formData.district) {
      setAvailableUpazilas(upazilasByDistrict[formData.district] || []);
      // Reset upazila if it's not in the new district
      if (formData.upazila && !upazilasByDistrict[formData.district]?.includes(formData.upazila)) {
        setFormData(prev => ({ ...prev, upazila: "" }));
      }
    } else {
      setAvailableUpazilas([]);
    }
  }, [formData.district, formData.upazila]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      console.log("Sending registration request through useAuth...");
      
      // Clean data for registration
      const result = await onRegister({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        division: formData.division,
        district: formData.district,
        upazila: formData.upazila,
        address: formData.address,
        bloodGroup: formData.bloodGroup,
      });

      console.log("Registration result:", result);

      if (result.success) {
        setSuccess(true);
        setFormData({
          fullName: "",
          email: "",
          password: "",
          phone: "",
          division: "",
          district: "",
          upazila: "",
          address: "",
          bloodGroup: "",
        });

        // সফল হলে লগইন পেজে পাঠানো
        setTimeout(() => {
          onNavigateToLogin();
        }, 1500);
      } else {
        setError(result.error || "Registration failed");
      }

    } catch (err) {
      console.error("Registration error:", err);
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full mx-auto p-8 bg-white rounded-2xl shadow-xl">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Join LifeBlood</h2>
          <p className="text-gray-600">Create your account to save lives</p>
        </div>

        {error && (
          <div className="text-red-600 mb-4 p-3 border border-red-300 rounded-lg bg-red-50 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}
        
        {success && (
          <div className="text-green-600 mb-4 p-3 border border-green-300 rounded-lg bg-green-50 flex items-center">
            <div className="w-5 h-5 mr-2 flex-shrink-0 bg-green-500 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
            <span className="text-sm">Registration successful! Logging you in...</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <UserIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              name="fullName"
              placeholder="Full Name" 
              value={formData.fullName} 
              onChange={handleChange} 
              required 
              className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200" 
            />
          </div>

          <div className="relative">
            <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input 
              type="email" 
              name="email" 
              placeholder="Email Address" 
              value={formData.email} 
              onChange={handleChange} 
              required 
              className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200" 
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input 
              type="password" 
              name="password" 
              placeholder="Password" 
              value={formData.password} 
              onChange={handleChange} 
              required 
              minLength={6}
              className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200" 
            />
          </div>

          <div className="relative">
            <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input 
              type="tel" 
              name="phone" 
              placeholder="Phone Number" 
              value={formData.phone} 
              onChange={handleChange} 
              required 
              className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200" 
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            {/* Division Dropdown */}
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400 z-10" />
              <select 
                name="division" 
                value={formData.division} 
                onChange={handleChange} 
                required 
                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 appearance-none bg-white"
              >
                <option value="">Select Division</option>
                {divisions.map((division) => (
                  <option key={division} value={division}>
                    {division}
                  </option>
                ))}
              </select>
            </div>

            {/* District Dropdown */}
            <select 
              name="district" 
              value={formData.district} 
              onChange={handleChange} 
              required 
              disabled={!formData.division}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 appearance-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">
                {formData.division ? "Select District" : "Select Division First"}
              </option>
              {availableDistricts.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>

            {/* Upazila Dropdown */}
            <select
              name="upazila"
              value={formData.upazila}
              onChange={handleChange}
              required
              disabled={!formData.district}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 appearance-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">
                {formData.district ? "Select Upazila" : "Select District First"}
              </option>
              {availableUpazilas.map((upazila) => (
                <option key={upazila} value={upazila}>
                  {upazila}
                </option>
              ))}
            </select>
          </div>

          {/* Address Field */}
          <div className="relative">
            <Home className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              name="address" 
              placeholder="Full Address (Optional)" 
              value={formData.address} 
              onChange={handleChange} 
              className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200" 
            />
          </div>

          <div className="relative">
            <Droplet className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <select 
              name="bloodGroup" 
              value={formData.bloodGroup} 
              onChange={handleChange} 
              required 
              className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 appearance-none bg-white"
            >
              <option value="">Select Blood Group</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
            </select>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3 px-4 rounded-lg hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 font-semibold text-lg shadow-lg"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Creating Account...
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5 mr-2" />
                Create Account
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <button 
              onClick={onNavigateToLogin}
              className="text-red-500 hover:text-red-600 font-semibold transition-colors duration-200"
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
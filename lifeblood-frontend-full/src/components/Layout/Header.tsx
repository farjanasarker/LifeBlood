// import React from 'react';
// import { Heart, User, LogOut, Users, Search } from 'lucide-react';
// import { User as UserType } from '../../types';

// interface HeaderProps {
//   user: UserType | null;
//   onLogout: () => void;
//   currentPage: string;
//   onNavigate: (page: string) => void;
// }

// export const Header: React.FC<HeaderProps> = ({ user, onLogout, currentPage, onNavigate }) => {
//   const isAdmin = user?.role === 'admin';

//   return (
//     <header className="bg-white shadow-sm border-b border-gray-200">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="flex justify-between items-center h-16">
//           <div className="flex items-center space-x-8">
//             <div 
//               className="flex items-center space-x-2 cursor-pointer"
//               onClick={() => onNavigate('home')}
//             >
//               <Heart className="h-8 w-8 text-red-600" />
//               <span className="text-2xl font-bold text-gray-900">LifeBlood</span>
//             </div>
            
//             <nav className="hidden md:flex space-x-6">
//               <button
//                 onClick={() => onNavigate('search')}
//                 className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
//                   currentPage === 'search'
//                     ? 'bg-red-100 text-red-700'
//                     : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
//                 }`}
//               >
//                 <Search className="h-4 w-4" />
//                 <span>Find Donors</span>
//               </button>
              
//               {user && (
//                 <button
//                   onClick={() => onNavigate('dashboard')}
//                   className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
//                     currentPage === 'dashboard'
//                       ? 'bg-red-100 text-red-700'
//                       : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
//                   }`}
//                 >
//                   <User className="h-4 w-4" />
//                   <span>Dashboard</span>
//                 </button>
//               )}
              
//               {isAdmin && (
//                 <button
//                   onClick={() => onNavigate('admin')}
//                   className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
//                     currentPage === 'admin'
//                       ? 'bg-red-100 text-red-700'
//                       : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
//                   }`}
//                 >
//                   <Users className="h-4 w-4" />
//                   <span>Admin</span>
//                 </button>
//               )}
//             </nav>
//           </div>

//           <div className="flex items-center space-x-4">
//             {user ? (
//               <div className="flex items-center space-x-4">
//                 <div className="flex items-center space-x-2">
//                   <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
//                     <span className="text-red-700 font-medium text-sm">
//                       {user.name.charAt(0).toUpperCase()}
//                     </span>
//                   </div>
//                   <div className="hidden md:block">
//                     <p className="text-sm font-medium text-gray-900">{user.name}</p>
//                     <p className="text-xs text-gray-500">{user.bloodGroup}</p>
//                   </div>
//                 </div>
//                 <button
//                   onClick={onLogout}
//                   className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
//                 >
//                   <LogOut className="h-4 w-4" />
//                   <span className="hidden md:inline">Logout</span>
//                 </button>
//               </div>
//             ) : (
//               <div className="flex items-center space-x-2">
//                 <button
//                   onClick={() => onNavigate('login')}
//                   className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
//                 >
//                   Login
//                 </button>
//                 <button
//                   onClick={() => onNavigate('register')}
//                   className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
//                 >
//                   Register
//                 </button>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </header>
//   );
// };
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Heart, User, LogOut, Users, Search, Send, Bell, MessageCircle } from 'lucide-react';
import { User as UserType } from '../../types';
import { apiService } from '../../services/apiService';

interface HeaderProps {
  user: UserType | null;
  onLogout: () => void;
}

const UNREAD_POLL_INTERVAL_MS = 20000;

const NavBadge: React.FC<{ count: number }> = ({ count }) => {
  if (count <= 0) return null;
  return (
    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold leading-none">
      {count > 9 ? '9+' : count}
    </span>
  );
};

export const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = user?.role === 'admin';

  const [chatUnread, setChatUnread] = useState(0);
  const [notificationUnread, setNotificationUnread] = useState(0);

  useEffect(() => {
    if (!user) {
      setChatUnread(0);
      setNotificationUnread(0);
      return;
    }

    const refreshUnreadCounts = async () => {
      try {
        const [conversations, notifications] = await Promise.all([
          apiService.getConversations(),
          apiService.getMyNotifications(),
        ]);
        setChatUnread(conversations.reduce((sum, c) => sum + c.unreadCount, 0));
        setNotificationUnread(notifications.filter((n) => n.status === 'pending').length);
      } catch {
        // badge just won't refresh this cycle; next poll will retry
      }
    };

    refreshUnreadCounts();
    const interval = setInterval(refreshUnreadCounts, UNREAD_POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [user, location.pathname]);

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <div 
              className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => handleNavigation('/')}
            >
              <Heart className="h-8 w-8 text-red-600" />
              <span className="text-2xl font-bold text-gray-900">LifeBlood</span>
            </div>
            
            <nav className="hidden md:flex space-x-6">
              <button
                onClick={() => handleNavigation('/search')}
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/search')
                    ? 'bg-red-100 text-red-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Search className="h-4 w-4" />
                <span>Find Donors</span>
              </button>
              
              {user && (
                <button
                  onClick={() => handleNavigation('/dashboard')}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/dashboard')
                      ? 'bg-red-100 text-red-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <User className="h-4 w-4" />
                  <span>Dashboard</span>
                </button>
              )}

              {user && (
                <button
                  onClick={() => handleNavigation('/requests/mine')}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/requests/mine') || isActive('/requests/new')
                      ? 'bg-red-100 text-red-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Send className="h-4 w-4" />
                  <span>Requests</span>
                </button>
              )}

              {user && (
                <button
                  onClick={() => handleNavigation('/notifications')}
                  className={`relative flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/notifications')
                      ? 'bg-red-100 text-red-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Bell className="h-4 w-4" />
                  <span>Notifications</span>
                  <NavBadge count={notificationUnread} />
                </button>
              )}

              {user && (
                <button
                  onClick={() => handleNavigation('/chat')}
                  className={`relative flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/chat') || location.pathname.startsWith('/chat/')
                      ? 'bg-red-100 text-red-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Chat</span>
                  <NavBadge count={chatUnread} />
                </button>
              )}

              {isAdmin && (
                <button
                  onClick={() => handleNavigation('/admin')}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/admin')
                      ? 'bg-red-100 text-red-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Users className="h-4 w-4" />
                  <span>Admin</span>
                </button>
              )}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-700 font-medium text-sm">
                      {user.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="hidden md:block">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.bloodGroup}</p>
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden md:inline">Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleNavigation('/login')}
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Login
                </button>
                <button
                  onClick={() => handleNavigation('/register')}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
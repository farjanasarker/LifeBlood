import React, { useEffect, useState } from 'react';
import { Bell, MapPin, Clock, Check, X } from 'lucide-react';
import type { RequestNotification } from '../../types';
import { apiService } from '../../services/apiService';
import { dateUtils } from '../../utils/dateUtils';

const statusStyles: Record<RequestNotification['status'], string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-green-100 text-green-800',
  declined: 'bg-gray-100 text-gray-800',
};

export const NotificationsPanel: React.FC = () => {
  const [notifications, setNotifications] = useState<RequestNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [respondingId, setRespondingId] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setNotifications(await apiService.getMyNotifications());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const respond = async (id: number, status: 'accepted' | 'declined') => {
    try {
      setRespondingId(id);
      await apiService.respondToNotification(id, status);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, status } : n)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit response');
    } finally {
      setRespondingId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Bell className="h-7 w-7 mr-2 text-red-600" />
          Donation Requests Near You
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          Seekers matching your blood group and location have requested your help
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-red-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Loading notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications yet</h3>
          <p className="text-gray-500">You'll be notified here when a nearby seeker needs your blood group.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div key={notification.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    {notification.request.bloodGroup}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[notification.status]}`}>
                    {notification.status.charAt(0).toUpperCase() + notification.status.slice(1)}
                  </span>
                </div>
              </div>
              <div className="flex items-center text-sm text-gray-600 mb-1">
                <MapPin className="h-4 w-4 mr-2" />
                <span>
                  {notification.request.upazila}, {notification.request.district}, {notification.request.division}
                </span>
              </div>
              <div className="flex items-center text-sm text-gray-600 mb-1">
                <Clock className="h-4 w-4 mr-2" />
                <span>Deadline: {dateUtils.formatDate(notification.request.deadline)}</span>
              </div>
              {notification.request.notes && (
                <p className="text-sm text-gray-500 mt-2">{notification.request.notes}</p>
              )}

              {notification.status === 'pending' && (
                <div className="flex space-x-3 mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => respond(notification.id, 'accepted')}
                    disabled={respondingId === notification.id}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center justify-center transition-colors"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Accept
                  </button>
                  <button
                    onClick={() => respond(notification.id, 'declined')}
                    disabled={respondingId === notification.id}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium flex items-center justify-center transition-colors"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Decline
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

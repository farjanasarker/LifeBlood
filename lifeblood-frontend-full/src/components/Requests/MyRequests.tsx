import React, { useEffect, useState } from 'react';
import { Droplet, MapPin, Clock, Users, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { DonationRequest } from '../../types';
import { apiService } from '../../services/apiService';
import { dateUtils } from '../../utils/dateUtils';

const statusStyles: Record<DonationRequest['status'], string> = {
  open: 'bg-yellow-100 text-yellow-800',
  fulfilled: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

export const MyRequests: React.FC = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<DonationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setRequests(await apiService.getMyRequests());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load requests');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Blood Requests</h1>
          <p className="mt-2 text-lg text-gray-600">Track the urgent requests you've posted</p>
        </div>
        <button
          onClick={() => navigate('/requests/new')}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Request
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-red-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Loading your requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <Droplet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No requests yet</h3>
          <p className="text-gray-500">Post an urgent request to notify nearby eligible donors.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div key={request.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    {request.bloodGroup}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[request.status]}`}>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Users className="h-4 w-4 mr-1" />
                  {request.notifiedDonorCount} donor{request.notifiedDonorCount !== 1 ? 's' : ''} notified
                </div>
              </div>
              <div className="flex items-center text-sm text-gray-600 mb-1">
                <MapPin className="h-4 w-4 mr-2" />
                <span>{request.upazila}, {request.district}, {request.division}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600 mb-1">
                <Clock className="h-4 w-4 mr-2" />
                <span>Deadline: {dateUtils.formatDate(request.deadline)}</span>
              </div>
              {request.notes && <p className="text-sm text-gray-500 mt-2">{request.notes}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

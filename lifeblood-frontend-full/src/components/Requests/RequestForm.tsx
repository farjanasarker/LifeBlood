import React, { useState } from 'react';
import { Droplet, MapPin, Clock, Send, AlertCircle, CheckCircle } from 'lucide-react';
import type { BloodGroup } from '../../types';
import { apiService } from '../../services/apiService';
import { divisions, districtsByDivision, upazilasByDistrict } from '../../utils/bangladeshLocations';

const bloodGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const RequestForm: React.FC = () => {
  const [form, setForm] = useState({
    bloodGroup: 'O+' as BloodGroup,
    division: '',
    district: '',
    upazila: '',
    deadline: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  const availableDistricts = form.division ? districtsByDivision[form.division] || [] : [];
  const availableUpazilas = form.district ? upazilasByDistrict[form.district] || [] : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessCount(null);

    if (!form.division || !form.district || !form.upazila || !form.deadline) {
      setError('Please fill in blood group, location, and deadline.');
      return;
    }

    try {
      setLoading(true);
      const created = await apiService.createRequest({
        bloodGroup: form.bloodGroup,
        division: form.division,
        district: form.district,
        upazila: form.upazila,
        deadline: form.deadline,
        notes: form.notes.trim() || undefined,
      });
      setSuccessCount(created.notifiedDonorCount);
      setForm((prev) => ({ ...prev, district: '', upazila: '', deadline: '', notes: '' }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Post an Urgent Blood Request</h1>
        <p className="mt-2 text-lg text-gray-600">
          Nearby eligible donors matching your blood group and location will be notified.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-4">
        {error && (
          <div className="p-3 border border-red-300 rounded-lg bg-red-50 flex items-center text-red-600">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}
        {successCount !== null && (
          <div className="p-3 border border-green-300 rounded-lg bg-green-50 flex items-center text-green-700">
            <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            <span className="text-sm">
              Request posted! {successCount} eligible donor{successCount !== 1 ? 's' : ''} notified.
            </span>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Blood Group *</label>
          <div className="relative">
            <Droplet className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={form.bloodGroup}
              onChange={(e) => setForm((prev) => ({ ...prev, bloodGroup: e.target.value as BloodGroup }))}
              className="pl-10 w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
            >
              {bloodGroups.map((group) => (
                <option key={group} value={group}>{group}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Division *</label>
            <select
              value={form.division}
              onChange={(e) => setForm((prev) => ({ ...prev, division: e.target.value, district: '', upazila: '' }))}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
            >
              <option value="">Select Division</option>
              {divisions.map((division) => (
                <option key={division} value={division}>{division}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">District *</label>
            <select
              value={form.district}
              onChange={(e) => setForm((prev) => ({ ...prev, district: e.target.value, upazila: '' }))}
              disabled={!form.division}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">{form.division ? 'Select District' : 'Select Division First'}</option>
              {availableDistricts.map((district) => (
                <option key={district} value={district}>{district}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Upazila *</label>
            <select
              value={form.upazila}
              onChange={(e) => setForm((prev) => ({ ...prev, upazila: e.target.value }))}
              disabled={!form.district}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">{form.district ? 'Select Upazila' : 'Select District First'}</option>
              {availableUpazilas.map((upazila) => (
                <option key={upazila} value={upazila}>{upazila}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Deadline *</label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="datetime-local"
              value={form.deadline}
              onChange={(e) => setForm((prev) => ({ ...prev, deadline: e.target.value }))}
              min={new Date().toISOString().slice(0, 16)}
              className="pl-10 w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <textarea
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              rows={3}
              placeholder="Hospital name, patient condition, contact details..."
              className="pl-10 w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white py-3 px-4 rounded-lg font-semibold flex items-center justify-center transition-colors"
        >
          {loading ? (
            <div className="animate-spin h-5 w-5 mr-2 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <Send className="h-5 w-5 mr-2" />
          )}
          {loading ? 'Posting...' : 'Post Urgent Request'}
        </button>
      </form>
    </div>
  );
};

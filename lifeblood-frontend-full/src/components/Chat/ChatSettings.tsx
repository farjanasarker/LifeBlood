import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, ShieldCheck } from 'lucide-react';
import type { BlockedUserEntry } from '../../types';
import { apiService } from '../../services/apiService';

interface ChatSettingsProps {
  chatEnabled: boolean;
  onChatEnabledChange: (enabled: boolean) => void;
}

export const ChatSettings: React.FC<ChatSettingsProps> = ({ chatEnabled, onChatEnabledChange }) => {
  const navigate = useNavigate();
  const [enabled, setEnabled] = useState(chatEnabled);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUserEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setBlockedUsers(await apiService.getBlockedUsers());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load blocked users');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleToggle = async () => {
    setError(null);
    setSaving(true);
    try {
      const result = await apiService.updateChatSettings(!enabled);
      setEnabled(result.chatEnabled);
      onChatEnabledChange(result.chatEnabled);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update chat settings');
    } finally {
      setSaving(false);
    }
  };

  const handleUnblock = async (userId: number) => {
    try {
      await apiService.unblockUser(userId);
      setBlockedUsers((prev) => prev.filter((b) => b.blockedUser.id !== userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unblock user');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center space-x-3 mb-8">
        <button onClick={() => navigate('/chat')} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Chat Settings</h1>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">{error}</div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <MessageCircle className="h-6 w-6 text-red-600" />
            <div>
              <h3 className="font-medium text-gray-900">Allow others to message me</h3>
              <p className="text-sm text-gray-500">
                Turn this off if you don't want to receive any chat messages.
              </p>
            </div>
          </div>
          <button
            onClick={handleToggle}
            disabled={saving}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              enabled ? 'bg-red-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="font-medium text-gray-900 mb-4">Blocked Users</h3>
        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : blockedUsers.length === 0 ? (
          <p className="text-sm text-gray-500">You haven't blocked anyone.</p>
        ) : (
          <div className="space-y-3">
            {blockedUsers.map((block) => (
              <div key={block.id} className="flex items-center justify-between border border-gray-200 rounded-md p-3">
                <div>
                  <p className="font-medium text-gray-900">{block.blockedUser.name}</p>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    {block.blockedUser.bloodGroup}
                  </span>
                </div>
                <button
                  onClick={() => handleUnblock(block.blockedUser.id)}
                  className="flex items-center space-x-1 text-sm text-green-700 hover:bg-green-50 px-3 py-1.5 rounded-md transition-colors"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>Unblock</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Settings, ShieldOff, MapPin } from 'lucide-react';
import type { Conversation } from '../../types';
import { apiService } from '../../services/apiService';
import { dateUtils } from '../../utils/dateUtils';

export const ConversationsList: React.FC = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setConversations(await apiService.getConversations());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load conversations');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const previewText = (conversation: Conversation): string => {
    const { lastMessage } = conversation;
    if (lastMessage.type === 'location') return '📍 Shared a location';
    return lastMessage.content || '';
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <MessageCircle className="h-7 w-7 mr-2 text-red-600" />
            Messages
          </h1>
          <p className="mt-2 text-lg text-gray-600">Chat with donors and recipients</p>
        </div>
        <button
          onClick={() => navigate('/chat/settings')}
          className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
        >
          <Settings className="h-4 w-4" />
          <span>Chat Settings</span>
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-red-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Loading conversations...</p>
        </div>
      ) : conversations.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations yet</h3>
          <p className="text-gray-500">
            Message a donor from the search page to start a conversation.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md divide-y divide-gray-100">
          {conversations.map((conversation) => (
            <button
              key={conversation.otherUser.id}
              onClick={() => navigate(`/chat/${conversation.otherUser.id}`)}
              className="w-full text-left p-4 hover:bg-gray-50 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-red-700 font-medium text-sm">
                    {conversation.otherUser.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="font-medium text-gray-900 truncate">{conversation.otherUser.name}</p>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {conversation.otherUser.bloodGroup}
                    </span>
                    {conversation.blockedByMe && (
                      <span className="inline-flex items-center text-xs text-gray-400">
                        <ShieldOff className="h-3 w-3 mr-1" /> Blocked
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate flex items-center">
                    {conversation.lastMessage.type === 'location' && <MapPin className="h-3 w-3 mr-1" />}
                    {previewText(conversation)}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end space-y-1 flex-shrink-0 ml-4">
                <span className="text-xs text-gray-400">
                  {conversation.lastMessage.createdAt ? dateUtils.formatDate(conversation.lastMessage.createdAt) : ''}
                </span>
                {conversation.unreadCount > 0 && (
                  <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-600 text-white text-xs font-medium">
                    {conversation.unreadCount}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

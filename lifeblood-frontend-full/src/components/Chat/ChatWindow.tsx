import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, MapPin, ArrowLeft, ShieldOff, ShieldCheck, AlertCircle } from 'lucide-react';
import type { ChatMessage } from '../../types';
import { apiService } from '../../services/apiService';
import { jwtUtils } from '../../utils/jwtUtils';

interface OtherUserInfo {
  id: number;
  name: string;
  bloodGroup: string;
}

const POLL_INTERVAL_MS = 5000;

const bloodGroupFromEnumMap: Record<string, string> = {
  A_PLUS: 'A+', A_NEG: 'A-', B_PLUS: 'B+', B_NEG: 'B-',
  AB_PLUS: 'AB+', AB_NEG: 'AB-', O_PLUS: 'O+', O_NEG: 'O-',
};

export const ChatWindow: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const otherUserId = Number(userId);
  const navigate = useNavigate();
  const myId = Number(jwtUtils.getUserId());

  const [otherUser, setOtherUser] = useState<OtherUserInfo | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async () => {
    try {
      setMessages(await apiService.getMessages(otherUserId));
    } catch {
      // keep showing whatever we already have; polling will retry
    }
  }, [otherUserId]);

  useEffect(() => {
    const loadHeader = async () => {
      try {
        const user = await apiService.getUser(otherUserId);
        setOtherUser({
          id: user.id,
          name: user.name,
          bloodGroup: bloodGroupFromEnumMap[user.bloodGroup] || user.bloodGroup,
        });
        const blocks = await apiService.getBlockedUsers();
        setIsBlocked(blocks.some((b) => b.blockedUser.id === otherUserId));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load conversation');
      }
    };
    loadHeader();
    loadMessages();

    const interval = setInterval(loadMessages, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [otherUserId, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendText = async () => {
    if (!text.trim()) return;
    setError(null);
    setSending(true);
    try {
      await apiService.sendMessage({ receiverId: otherUserId, type: 'text', content: text.trim() });
      setText('');
      await loadMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleShareLocation = () => {
    if (!navigator.geolocation) {
      setError('Location sharing is not supported on this device.');
      return;
    }
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          setSending(true);
          await apiService.sendMessage({
            receiverId: otherUserId,
            type: 'location',
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          await loadMessages();
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to share location');
        } finally {
          setSending(false);
        }
      },
      () => setError('Could not access your location. Please check permissions.')
    );
  };

  const toggleBlock = async () => {
    try {
      if (isBlocked) {
        await apiService.unblockUser(otherUserId);
        setIsBlocked(false);
      } else {
        await apiService.blockUser(otherUserId);
        setIsBlocked(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update block status');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col h-[calc(100vh-8rem)]">
      <div className="bg-white rounded-t-lg shadow-md p-4 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <button onClick={() => navigate('/chat')} className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="w-9 h-9 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-red-700 font-medium text-sm">
              {otherUser?.name.charAt(0).toUpperCase() || '?'}
            </span>
          </div>
          <div>
            <p className="font-medium text-gray-900">{otherUser?.name || 'Loading...'}</p>
            {otherUser && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {otherUser.bloodGroup}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={toggleBlock}
          className={`flex items-center space-x-1 px-3 py-2 text-sm rounded-md transition-colors ${
            isBlocked ? 'text-green-700 hover:bg-green-50' : 'text-red-600 hover:bg-red-50'
          }`}
        >
          {isBlocked ? <ShieldCheck className="h-4 w-4" /> : <ShieldOff className="h-4 w-4" />}
          <span>{isBlocked ? 'Unblock' : 'Block'}</span>
        </button>
      </div>

      <div className="flex-1 bg-gray-50 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => {
          const mine = message.senderId === myId;
          return (
            <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-xs px-4 py-2 rounded-lg text-sm ${
                  mine ? 'bg-red-600 text-white' : 'bg-white text-gray-900 border border-gray-200'
                }`}
              >
                {message.type === 'location' ? (
                  <a
                    href={`https://www.google.com/maps?q=${message.latitude},${message.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center underline ${mine ? 'text-white' : 'text-blue-600'}`}
                  >
                    <MapPin className="h-4 w-4 mr-1" />
                    Shared location
                  </a>
                ) : (
                  <p>{message.content}</p>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-200 text-red-600 text-sm flex items-center">
          <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="bg-white rounded-b-lg shadow-md p-4 flex items-center space-x-2">
        <button
          onClick={handleShareLocation}
          disabled={sending || isBlocked}
          title="Share your location"
          className="p-2 text-gray-500 hover:text-red-600 disabled:text-gray-300 rounded-full hover:bg-gray-100 transition-colors"
        >
          <MapPin className="h-5 w-5" />
        </button>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
          disabled={sending || isBlocked}
          placeholder={isBlocked ? 'You have blocked this user' : 'Type a message...'}
          className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100"
        />
        <button
          onClick={handleSendText}
          disabled={sending || isBlocked || !text.trim()}
          className="bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white p-2 rounded-md transition-colors"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

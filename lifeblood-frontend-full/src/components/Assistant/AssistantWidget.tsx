import React, { useEffect, useRef, useState } from 'react';
import { Bot, Send, X } from 'lucide-react';
import { apiService } from '../../services/apiService';
import type { AssistantChatTurn } from '../../services/apiService';

const WELCOME_MESSAGE =
  "Hi, I'm the LifeBlood Assistant. Ask me whether you're eligible to donate, how the donation process works, blood group compatibility, or post-donation care tips.";

const HISTORY_LIMIT = 8;

export const AssistantWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AssistantChatTurn[]>([
    { role: 'assistant', content: WELCOME_MESSAGE },
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isSending) return;

    const nextMessages: AssistantChatTurn[] = [...messages, { role: 'user', content: text }];
    setMessages(nextMessages);
    setInput('');
    setError(null);
    setIsSending(true);

    try {
      const history = nextMessages.slice(-HISTORY_LIMIT - 1, -1);
      const answer = await apiService.assistantChat(text, history);
      setMessages((prev) => [...prev, { role: 'assistant', content: answer }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="mb-3 flex h-[480px] w-[340px] flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl">
          <div className="flex items-center justify-between bg-red-600 px-4 py-3 text-white">
            <div className="flex items-center space-x-2">
              <Bot className="h-5 w-5" />
              <span className="font-semibold">LifeBlood Assistant</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close assistant"
              className="rounded p-1 hover:bg-red-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-gray-50 px-3 py-3">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
                    msg.role === 'user'
                      ? 'bg-red-600 text-white'
                      : 'bg-white text-gray-800 border border-gray-200'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isSending && (
              <div className="flex justify-start">
                <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500">
                  Typing...
                </div>
              </div>
            )}
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div ref={bottomRef} />
          </div>

          <div className="flex items-center space-x-2 border-t border-gray-200 px-3 py-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your question..."
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              disabled={isSending}
            />
            <button
              onClick={handleSend}
              disabled={isSending || !input.trim()}
              aria-label="Send message"
              className="rounded-md bg-red-600 p-2 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? 'Close assistant' : 'Open assistant'}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition-colors hover:bg-red-700"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
      </button>
    </div>
  );
};

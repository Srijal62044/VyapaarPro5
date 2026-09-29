import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  MessageSquare,
  X,
  Send,
  RefreshCw,
  Trash2,
  Headphones,
  UserCheck,
  ChevronDown,
  ExternalLink,
  AlertCircle,
  HelpCircle,
  ShoppingBag,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { aiSupportService } from '../../services/aiSupportService';
import { CreateTicketModal } from './CreateTicketModal';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  isError?: boolean;
  suggestedActions?: string[];
}

const QUICK_QUESTIONS = [
  'What services do you provide?',
  'Show me your services',
  'What products are available?',
  'How can I place an order?',
  'What is my order status?',
  'How does payment work?',
  'I need help',
];

const LOCAL_CHAT_STORAGE_KEY = 'vp_ai_support_chat_history_v1';
const CONV_ID_STORAGE_KEY = 'vp_ai_support_current_conv_id_v1';

export const AISupportWidget: React.FC = () => {
  const { user } = useAuth();
  const { settings } = useSettings();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_CHAT_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {}
    return [
      {
        id: 'msg-welcome',
        sender: 'ai',
        text: 'Namaste! Welcome to VyapaarPro AI Support. Ask me about our custom web development services, digital templates, social media growth services, or order updates.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });

  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(CONV_ID_STORAGE_KEY) || null;
    } catch (e) {
      return null;
    }
  });

  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync messages to local storage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_CHAT_STORAGE_KEY, JSON.stringify(messages));
    } catch (e) {}
  }, [messages]);

  // Sync conversation ID to local storage
  useEffect(() => {
    try {
      if (conversationId) {
        localStorage.setItem(CONV_ID_STORAGE_KEY, conversationId);
      } else {
        localStorage.removeItem(CONV_ID_STORAGE_KEY);
      }
    } catch (e) {}
  }, [conversationId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 200);
    }
  }, [isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setLastFailedMessage(null);

    try {
      const response = await aiSupportService.sendMessage({
        message: text,
        conversationId,
        contextType: 'general',
      });

      if (response.conversation_id) {
        setConversationId(response.conversation_id);
      }

      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: response.suggested_actions,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err: any) {
      setLastFailedMessage(text);
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'ai',
        text: 'Sorry, I encountered a temporary connection issue. Please retry or contact our support team.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    if (lastFailedMessage) {
      handleSendMessage(lastFailedMessage);
    }
  };

  const handleClearChat = () => {
    const welcome: ChatMessage = {
      id: `msg-welcome-${Date.now()}`,
      sender: 'ai',
      text: 'Namaste! Welcome to VyapaarPro AI Support. Ask me about our custom web development services, digital templates, social media growth services, or order updates.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages([welcome]);
    setConversationId(null);
    setLastFailedMessage(null);
    localStorage.removeItem(LOCAL_CHAT_STORAGE_KEY);
    localStorage.removeItem(CONV_ID_STORAGE_KEY);
  };

  const handleOpenWhatsApp = () => {
    const phone = (settings.whatsapp || '919876543210').replace(/[^0-9]/g, '');
    const url = `https://wa.me/${phone}?text=${encodeURIComponent('Hello VyapaarPro team, I need assistance.')}`;
    window.open(url, '_blank');
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-40 flex items-center space-x-3">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="group flex items-center space-x-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-2xl shadow-violet-900/50 hover:shadow-violet-600/40 border border-violet-400/30 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
            aria-label="Open AI Support"
          >
            <div className="relative">
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-violet-950" />
            </div>
            <span className="font-bold tracking-wide">AI Support</span>
            <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] bg-white/20 text-white font-mono">
              Live
            </span>
          </button>
        )}
      </div>

      {/* Slide-out / Floating Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[420px] h-[580px] max-h-[calc(100vh-3rem)] flex flex-col bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl shadow-black/80 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-violet-950/80 via-slate-900 to-slate-950 border-b border-slate-800/80 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 p-0.5 shadow-lg shadow-violet-600/30 flex items-center justify-center text-white">
                <Sparkles className="w-5 h-5 text-amber-200" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <h3 className="text-sm font-bold text-white">VyapaarPro AI Support</h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <p className="text-[11px] text-slate-400 truncate max-w-[220px]">
                  Ask about services, products, orders, or support
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={handleClearChat}
                className="p-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white transition"
                title="Clear Conversation"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white transition"
                title="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Subtitle Banner */}
          <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800/60 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Powered by dynamic catalog & order intelligence</span>
            {user ? (
              <span className="text-emerald-400 font-medium flex items-center space-x-1">
                <UserCheck className="w-3 h-3" />
                <span>Logged In</span>
              </span>
            ) : (
              <span className="text-slate-500">Guest Access</span>
            )}
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-violet-600 text-white rounded-br-none shadow-md shadow-violet-900/30 font-medium'
                      : msg.isError
                      ? 'bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-bl-none'
                      : 'bg-slate-950/90 border border-slate-800 text-slate-200 rounded-bl-none shadow-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  {/* Fallback actions if human assistance is recommended */}
                  {msg.suggestedActions?.includes('create_ticket') && (
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap gap-2">
                      <button
                        onClick={() => setIsTicketModalOpen(true)}
                        className="px-2.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-semibold transition flex items-center space-x-1 shadow-sm"
                      >
                        <Headphones className="w-3 h-3" />
                        <span>Create Support Ticket</span>
                      </button>
                      <button
                        onClick={handleOpenWhatsApp}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold transition flex items-center space-x-1"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>WhatsApp Admin</span>
                      </button>
                    </div>
                  )}

                  {msg.isError && (
                    <div className="mt-2 flex items-center space-x-2">
                      <button
                        onClick={handleRetry}
                        className="px-2 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-[10px] font-bold flex items-center space-x-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Retry</span>
                      </button>
                      <button
                        onClick={() => setIsTicketModalOpen(true)}
                        className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
                      >
                        Contact Human Support
                      </button>
                    </div>
                  )}
                </div>

                <span className="text-[10px] text-slate-500 mt-1 px-1">{msg.timestamp}</span>
              </div>
            ))}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex flex-col items-start space-y-1">
                <div className="bg-slate-950 border border-slate-800 rounded-2xl rounded-bl-none px-4 py-3 text-slate-400 flex items-center space-x-2 text-xs">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]" />
                    <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce [animation-delay:0.4s]" />
                  </div>
                  <span className="text-[11px] text-slate-400">Thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions Chips */}
          <div className="px-3 py-2 bg-slate-950/40 border-t border-slate-800/60 overflow-x-auto flex items-center space-x-1.5 no-scrollbar shrink-0">
            {QUICK_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => handleSendMessage(q)}
                disabled={isLoading}
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-violet-600/20 text-slate-300 hover:text-violet-300 border border-slate-700/60 text-[10px] font-medium transition cursor-pointer disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Bottom Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-slate-950 border-t border-slate-800 flex items-center space-x-2 shrink-0"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask anything about VyapaarPro..."
              disabled={isLoading}
              maxLength={1000}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-violet-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="p-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition disabled:opacity-40 disabled:hover:bg-violet-600 cursor-pointer shadow-md shadow-violet-600/30"
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Support Ticket Quick Link in Footer */}
          <div className="px-3 py-1.5 bg-slate-950 border-t border-slate-900 text-[10px] text-slate-400 flex items-center justify-between">
            <button
              onClick={() => setIsTicketModalOpen(true)}
              className="text-violet-400 hover:text-violet-300 font-medium flex items-center space-x-1 cursor-pointer"
            >
              <Headphones className="w-3 h-3" />
              <span>Talk to Admin / Ticket</span>
            </button>
            <button
              onClick={handleOpenWhatsApp}
              className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center space-x-1 cursor-pointer"
            >
              <MessageSquare className="w-3 h-3" />
              <span>WhatsApp Us</span>
            </button>
          </div>
        </div>
      )}

      {/* Ticket Modal Fallback */}
      <CreateTicketModal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        defaultSubject="Assistance requested via AI Support"
      />
    </>
  );
};

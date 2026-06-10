import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, MessageCircle, Wifi, WifiOff } from 'lucide-react';
import { useChat } from '../../utils/ChatContext';
import api from '../../utils/api';

// ── Pure helpers ─────────────────────────────────────────────────────────────

const formatTime = (ts) =>
  new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const formatDate = (ts) => {
  const d = new Date(ts);
  return d.toDateString() === new Date().toDateString()
    ? formatTime(ts)
    : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

// ── Contact filter ────────────────────────────────────────────────────────────

const CONTACT_PATTERNS = [
  // Email
  /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/,
  // Phone: +256701234567 | 0701 234 567 | (070) 123-4567
  /(\+?\d[\d\s\-().]{6,18}\d)/,
  // URLs with protocol or www
  /(https?:\/\/|www\.)\S+/i,
  // Bare domains with common TLDs
  /\S+\.(com|net|org|io|co|app|me|ly|gg)\b/i,
  // Social handles
  /@[a-zA-Z0-9_]{3,}/,
  // Telegram / WhatsApp invite links
  /t\.me\/\S+/i,
  /wa\.me\/\S+/i,
];

const containsContactInfo = (text) =>
  CONTACT_PATTERNS.some((pattern) => pattern.test(text));

// ── Small reusable components ────────────────────────────────────────────────

const Avatar = ({ name, size = 'md', active = false }) => {
  const initial = (name || '?').charAt(0).toUpperCase();
  const sizeClass =
    size === 'sm' ? 'w-7 h-7 text-xs'
      : size === 'lg' ? 'w-11 h-11 text-base'
        : 'w-9 h-9 text-sm';
  return (
    <div className={`${sizeClass} rounded-full flex items-center justify-center
      text-white font-semibold shrink-0
      ${active ? 'bg-blue-500' : 'bg-gradient-to-br from-blue-400 to-indigo-500'}`}>
      {initial}
    </div>
  );
};

export const ConnectionBadge = ({ isConnected, short = false }) =>
  isConnected ? (
    <span className="flex items-center gap-1.5 text-xs font-medium text-green-600">
      <Wifi className="w-3.5 h-3.5 text-green-500" />
      {!short && 'Live'}
    </span>
  ) : (
    <span className="flex items-center gap-1.5 text-xs font-medium text-orange-500">
      <WifiOff className="w-3.5 h-3.5 text-orange-400" />
      {!short && 'Connecting…'}
    </span>
  );

// ── InboxPanel ───────────────────────────────────────────────────────────────

const InboxPanel = ({ inbox, activeChatId, isConnected, onSelectConversation }) => (
  <div className="flex flex-col h-full">
    <div className="px-4 py-3 border-b bg-white flex items-center justify-between shrink-0">
      <div>
        <h1 className="text-lg font-bold text-gray-900">Messages</h1>
        <p className="text-xs text-gray-500">
          {inbox.length} conversation{inbox.length !== 1 ? 's' : ''}
        </p>
      </div>
      <ConnectionBadge isConnected={isConnected} />
    </div>

    <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
      {inbox.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full py-16 text-center px-6">
          <MessageCircle className="w-12 h-12 text-gray-200 mb-3" />
          <p className="text-gray-500 font-medium">No conversations yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Go to a product and tap "Message Seller" to start chatting.
          </p>
        </div>
      ) : (
        inbox.map(conv => {
          const isActive = activeChatId === conv.partner_id;
          return (
            <button
              key={conv.partner_id}
              onClick={() => onSelectConversation(conv.partner_id)}
              className={`w-full text-left px-4 py-3.5 flex items-center gap-3 transition-colors
                ${isActive
                  ? 'bg-blue-50 border-l-4 border-blue-500'
                  : 'hover:bg-gray-50 border-l-4 border-transparent'}`}
            >
              <Avatar name={conv.partner_name} size="lg" active={isActive} />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <span className={`font-semibold text-sm truncate
                    ${isActive ? 'text-blue-700' : 'text-gray-900'}`}>
                    {conv.partner_name}
                  </span>
                  <span className="text-xs text-gray-400 shrink-0 ml-2">
                    {formatDate(conv.timestamp)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 truncate mt-0.5">
                  {conv.last_message || 'No messages yet'}
                </p>
              </div>
              {conv.unread_count > 0 && (
                <span className="shrink-0 bg-blue-500 text-white text-xs font-bold
                  w-5 h-5 rounded-full flex items-center justify-center">
                  {conv.unread_count > 9 ? '9+' : conv.unread_count}
                </span>
              )}
            </button>
          );
        })
      )}
    </div>
  </div>
);

// ── ChatPanel ────────────────────────────────────────────────────────────────

const ChatPanel = ({
  messages,
  currentUser,
  currentChatPartner,
  isConnected,
  inputText,
  setInputText,
  inputRef,
  messagesEndRef,
  onSend,
  onBack,
  blockedMessage,
}) => {
  const isBlocked = containsContactInfo(inputText);

  // Auto-focus input when chat loads
  useEffect(() => {
    if (inputRef.current) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.click(); // Some mobile browsers need this
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [currentChatPartner, inputRef]);

  const handleInputClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    inputRef.current?.focus();
  };

  const handleInputTouch = (e) => {
    // For mobile devices
    e.preventDefault();
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="px-3 py-3 border-b bg-white flex items-center gap-3 shrink-0">
        <button
          onClick={onBack}
          className="md:hidden p-1.5 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
          aria-label="Back to inbox"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <Avatar name={currentChatPartner} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">{currentChatPartner}</p>
          <ConnectionBadge isConnected={isConnected} short />
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-2">
        {messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-center py-12">
            <div>
              <MessageCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Tap the input below to start chatting</p>
            </div>
          </div>
        )}
        {messages.map((msg, idx) => {
          const isMe = msg.sender === currentUser?.id;
          return (
            <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              {!isMe && <Avatar name={currentChatPartner} size="sm" />}
              <div className={`max-w-[75%] sm:max-w-[65%] rounded-2xl px-3.5 py-2 ml-2
                ${isMe
                  ? 'bg-blue-500 text-white rounded-br-sm'
                  : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm shadow-sm'}`}>
                <p className="text-sm leading-relaxed break-words">{msg.content}</p>
                <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                  {formatTime(msg.timestamp)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Warning Messages */}
      {isBlocked && (
        <div className="mx-3 mb-1 px-3 py-2 bg-red-50 border border-red-200 rounded-xl
          text-xs text-red-600 flex items-center gap-2">
          <span>🚫</span>
          Contact details (phones, emails, links) cannot be shared here.
        </div>
      )}

      {blockedMessage && (
        <div className="mx-3 mb-1 px-3 py-2 bg-orange-50 border border-orange-200 rounded-xl
          text-xs text-orange-600 flex items-center gap-2">
          <span>⚠️</span>
          {blockedMessage}
        </div>
      )}

      {/* Input Area - Fixed for mobile keyboard */}
      <div className="px-3 py-3 bg-white border-t shrink-0 relative z-10">
        <form onSubmit={onSend} className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onClick={handleInputClick}
            onTouchStart={handleInputTouch}
            placeholder="Type a message…"
            autoFocus={true}
            className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm text-gray-900
              placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 
              focus:bg-white transition-colors cursor-text"
            style={{ 
              WebkitAppearance: 'none',
              WebkitTapHighlightColor: 'transparent'
            }}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || !isConnected || isBlocked}
            className="shrink-0 w-10 h-10 bg-blue-500 hover:bg-blue-600
              disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-full
              flex items-center justify-center transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

// ── ChatPage ─────────────────────────────────────────────────────────────────

const ChatPage = () => {
  const {
    messages, setMessages,
    inbox, fetchInbox,
    activeChatId, setActiveChatId,
    sendMessage, isConnected,
  } = useChat();

  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [inputText, setInputText] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [mobileView, setMobileView] = useState(activeChatId ? 'chat' : 'inbox');
  const [blockedMessage, setBlockedMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Get current user info
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        setCurrentUser(JSON.parse(stored));
      } catch (e) {
        console.error('Error parsing user:', e);
      }
    }
  }, []);

  // Auto-select chat when coming from seller page
  useEffect(() => {
    const autoSelectChat = async () => {
      if (isLoading) return;
      
      const sellerId = searchParams.get('sellerId');
      const buyerId = searchParams.get('buyerId');
      const userId = searchParams.get('userId');
      const targetUserId = sellerId || buyerId || userId;
      
      if (targetUserId && !activeChatId) {
        setIsLoading(true);
        try {
          setActiveChatId(parseInt(targetUserId));
          
          const historyResult = await api.getChatHistory(targetUserId);
          if (!historyResult.error && historyResult.data) {
            setMessages(historyResult.data);
          }
          
          await fetchInbox();
          setMobileView('chat');
          
          // Focus input after chat loads
          setTimeout(() => {
            inputRef.current?.focus();
          }, 500);
        } catch (error) {
          console.error('Error auto-selecting chat:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    autoSelectChat();
  }, [searchParams, activeChatId, setActiveChatId, setMessages, fetchInbox, isLoading]);

  // Fetch chat history when activeChatId changes
  useEffect(() => {
    if (!activeChatId) return;
    
    const fetchChat = async () => {
      const result = await api.getChatHistory(activeChatId);
      if (!result.error && result.data) {
        setMessages(result.data);
        fetchInbox();
      }
    };
    
    fetchChat();
    setMobileView('chat');
  }, [activeChatId, setMessages, fetchInbox]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Listen for server-side contact-filter rejections
  useEffect(() => {
    const handleChatError = (e) => {
      if (e.detail?.code === 'contact_info_blocked') {
        setBlockedMessage(e.detail.message);
        setMessages(prev => prev.filter(m => !String(m.id).startsWith('temp-')));
        setTimeout(() => setBlockedMessage(null), 5000);
      }
    };
    
    window.addEventListener('chatError', handleChatError);
    return () => window.removeEventListener('chatError', handleChatError);
  }, [setMessages]);

  const handleSend = useCallback((e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChatId) return;
    if (containsContactInfo(inputText)) return;

    sendMessage(activeChatId, inputText);
    setMessages(prev => [...prev, {
      id: 'temp-' + Date.now(),
      sender: currentUser?.id,
      recipient: activeChatId,
      content: inputText,
      timestamp: new Date().toISOString(),
    }]);
    setInputText('');
    
    // Keep focus on input after sending
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, [inputText, activeChatId, currentUser, sendMessage, setMessages]);

  const handleSelectConversation = useCallback((partnerId) => {
    setActiveChatId(partnerId);
    setMobileView('chat');
  }, [setActiveChatId]);

  const currentChatPartner = inbox.find(c => c.partner_id === activeChatId)?.partner_name || 'Chat';

  const sharedInboxProps = {
    inbox,
    activeChatId,
    isConnected,
    onSelectConversation: handleSelectConversation,
  };

  const sharedChatProps = {
    messages,
    currentUser,
    currentChatPartner,
    isConnected,
    inputText,
    setInputText,
    inputRef,
    messagesEndRef,
    onSend: handleSend,
    onBack: () => setMobileView('inbox'),
    blockedMessage,
  };

  return (
    <div className="flex h-[calc(100vh-56px)] bg-white overflow-hidden">
      {/* Mobile View */}
      <div className="flex flex-col flex-1 md:hidden">
        {mobileView === 'inbox' || !activeChatId
          ? <InboxPanel {...sharedInboxProps} />
          : <ChatPanel {...sharedChatProps} />
        }
      </div>

      {/* Desktop View */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        <div className="w-72 lg:w-80 border-r flex flex-col shrink-0 overflow-hidden">
          <InboxPanel {...sharedInboxProps} />
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeChatId ? (
            <ChatPanel {...sharedChatProps} />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
              <MessageCircle className="w-16 h-16 text-gray-200 mb-4" />
              <p className="text-gray-500 font-medium text-lg">Select a conversation</p>
              <p className="text-gray-400 text-sm mt-1">
                Choose a chat from the sidebar to start messaging
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
// ChatPage.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, MessageCircle, Wifi, WifiOff, RefreshCw } from 'lucide-react';
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
  /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/,
  /(\+?\d[\d\s\-().]{6,18}\d)/,
  /(https?:\/\/|www\.)\S+/i,
  /\S+\.(com|net|org|io|co|app|me|ly|gg)\b/i,
  /@[a-zA-Z0-9_]{3,}/,
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

const InboxPanel = React.memo(({ inbox, activeChatId, isConnected, onSelectConversation }) => (
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
            When you start chatting with someone, they'll appear here.
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
));

InboxPanel.displayName = 'InboxPanel';

// ── ChatPanel ────────────────────────────────────────────────────────────────

const ChatPanel = React.memo(({
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
  isTyping,
  onTyping,
  isRefreshing,
  onRefresh,
  retryMessage,
  failedMessages,
}) => {
  const isBlocked = containsContactInfo(inputText);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesContainerRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [currentChatPartner, inputRef]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollButton(!isNearBottom);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 relative">
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
        {isRefreshing && (
          <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
        )}
      </div>

      {/* Disconnected Banner */}
      {!isConnected && (
        <div className="px-3 py-1.5 bg-yellow-50 border-b border-yellow-200 text-center">
          <p className="text-xs text-yellow-700 flex items-center justify-center gap-1">
            <WifiOff className="w-3 h-3 inline" />
            Reconnecting to chat server...
          </p>
        </div>
      )}

      {/* Messages Container */}
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-2"
      >
        {messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-center py-12">
            <div>
              <MessageCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No messages yet</p>
              <p className="text-xs text-gray-300 mt-1">Start the conversation!</p>
            </div>
          </div>
        )}
        
        {messages.map((msg, idx) => {
          const isMe = msg.sender === currentUser?.id;
          const isFailed = msg.status === 'failed';
          const isSending = msg.status === 'sending' || (typeof msg.id === 'string' && msg.id.startsWith('temp-'));
          
          const key = msg.id || `msg-${idx}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
          
          return (
            <div key={key} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              {!isMe && <Avatar name={currentChatPartner} size="sm" />}
              <div className={`max-w-[75%] sm:max-w-[65%] rounded-2xl px-3.5 py-2 ml-2
                ${isMe
                  ? `bg-blue-500 text-white rounded-br-sm ${isFailed ? 'opacity-70' : ''}`
                  : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm shadow-sm'}`}>
                <p className="text-sm leading-relaxed break-words">{msg.content}</p>
                <div className="flex items-center justify-end gap-1 mt-0.5">
                  <span className={`text-[10px] ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                    {formatTime(msg.timestamp)}
                  </span>
                  {isMe && isSending && (
                    <span className="text-[10px] text-blue-200 animate-pulse">Sending...</span>
                  )}
                  {isMe && isFailed && (
                    <button 
                      onClick={() => retryMessage?.(msg.id)}
                      className="text-[10px] text-red-300 hover:text-red-100 transition-colors flex items-center gap-0.5"
                    >
                      <RefreshCw className="w-3 h-3" /> Retry
                    </button>
                  )}
                  {isMe && !isSending && !isFailed && (
                    <span className="text-[10px] text-blue-200">✓</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-20 right-4 bg-white rounded-full shadow-lg p-2 border border-gray-200
            hover:bg-gray-50 transition-colors"
        >
          <MessageCircle className="w-4 h-4 text-blue-500 rotate-180" />
        </button>
      )}

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

      {/* Input Area */}
      <div className="px-3 py-3 bg-white border-t shrink-0 relative z-10">
        <form onSubmit={onSend} className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={onTyping}
            placeholder="Type a message…"
            autoFocus={true}
            className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm text-gray-900
              placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 
              focus:bg-white transition-colors cursor-text"
            style={{ 
              WebkitAppearance: 'none',
              WebkitTapHighlightColor: 'transparent',
              fontSize: '16px'
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
        {isTyping && (
          <div className="text-xs text-gray-400 mt-1 ml-3 animate-pulse">
            {currentChatPartner} is typing...
          </div>
        )}
      </div>
    </div>
  );
});

ChatPanel.displayName = 'ChatPanel';

// ── Chat Error Boundary ──────────────────────────────────────────────────────

class ChatErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Chat error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full p-8 text-center bg-gray-50">
          <div>
            <p className="text-red-600 font-semibold text-lg">Something went wrong</p>
            <p className="text-gray-500 text-sm mt-2">We're having trouble loading your messages</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ── Main ChatPage ─────────────────────────────────────────────────────────────

const ChatPageContent = () => {
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
  const [userRole, setUserRole] = useState(null);
  const [mobileView, setMobileView] = useState(() => 
    searchParams.get('userId') || searchParams.get('sellerId') || searchParams.get('buyerId') 
      ? 'chat' 
      : 'inbox'
  );
  const [blockedMessage, setBlockedMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [failedMessages, setFailedMessages] = useState([]);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const wsRef = useRef(null);
  const sentMessagesRef = useRef(new Set());
  const loadChatTimeoutRef = useRef(null);

  // Get current user info and role
  useEffect(() => {
    const stored = localStorage.getItem('user');
    const role = localStorage.getItem('userRole');
    if (stored) {
      try {
        setCurrentUser(JSON.parse(stored));
      } catch (e) {
        console.error('Error parsing user:', e);
      }
    }
    setUserRole(role);
  }, []);

  // Auto-select chat from URL params - with debounce to prevent loops
  useEffect(() => {
    // Clear any pending load
    if (loadChatTimeoutRef.current) {
      clearTimeout(loadChatTimeoutRef.current);
    }

    const userId = searchParams.get('userId');
    const sellerId = searchParams.get('sellerId');
    const buyerId = searchParams.get('buyerId');
    const targetUserId = userId || sellerId || buyerId;
    
    if (!targetUserId) {
      setMobileView('inbox');
      setInitialLoadDone(true);
      return;
    }
    
    const targetId = parseInt(targetUserId);
    
    // If already on this chat and initial load done, just refresh
    if (activeChatId === targetId && initialLoadDone) {
      return;
    }
    
    setLoadingChat(true);
    setMobileView('chat');
    
    // Debounce the load
    loadChatTimeoutRef.current = setTimeout(async () => {
      try {
        console.log('Loading chat for user:', targetId);
        setActiveChatId(targetId);
        setMessages([]);
        
        const historyResult = await api.getChatHistory(targetId);
        if (!historyResult.error && historyResult.data) {
          setMessages(historyResult.data);
        }
        
        await fetchInbox();
        setInitialLoadDone(true);
        
        setTimeout(() => {
          inputRef.current?.focus();
        }, 500);
      } catch (error) {
        console.error('Error loading chat:', error);
      } finally {
        setLoadingChat(false);
      }
    }, 300);

    return () => {
      if (loadChatTimeoutRef.current) {
        clearTimeout(loadChatTimeoutRef.current);
      }
    };
  }, [searchParams, setActiveChatId, setMessages, fetchInbox, activeChatId, initialLoadDone]);

  // Mark messages as read - with debounce
  useEffect(() => {
    if (!activeChatId || !messages.length || loadingChat) return;
    
    const markMessagesAsRead = async () => {
      try {
        // Only mark if there are unread messages from the other user
        const hasUnread = messages.some(m => 
          m.sender === activeChatId && !m.is_read
        );
        
        if (hasUnread) {
          await api.markMessagesAsRead?.(activeChatId);
          setMessages(prev => prev.map(msg => 
            msg.sender === activeChatId ? { ...msg, is_read: true } : msg
          ));
          fetchInbox();
        }
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    };
    
    const timeoutId = setTimeout(markMessagesAsRead, 1500);
    return () => clearTimeout(timeoutId);
  }, [activeChatId, messages.length, loadingChat]);

  // Clean up duplicate temp messages
  useEffect(() => {
    const tempMessages = messages.filter(m => typeof m.id === 'string' && m.id.startsWith('temp-'));
    const seen = new Set();
    const duplicateIds = [];
    
    tempMessages.forEach(msg => {
      const key = `${msg.content}-${msg.sender}`;
      if (seen.has(key)) {
        duplicateIds.push(msg.id);
      } else {
        seen.add(key);
      }
    });
    
    if (duplicateIds.length > 0) {
      setMessages(prev => prev.filter(m => !duplicateIds.includes(m.id)));
    }
  }, [messages, setMessages]);

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

  // Handle typing indicator
  const handleTyping = useCallback((e) => {
    const value = e.target.value;
    setInputText(value);
    
    if (value.trim() && !isTyping) {
      setIsTyping(true);
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'typing',
          recipient_id: activeChatId,
          is_typing: true
        }));
      }
    }
    
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'typing',
            recipient_id: activeChatId,
            is_typing: false
          }));
        }
      }
    }, 2000);
  }, [activeChatId, isTyping]);

  // Listen for typing indicators from other users
  useEffect(() => {
    const handleTypingIndicator = (e) => {
      if (e.detail?.type === 'typing' && e.detail?.sender_id === activeChatId) {
        setPartnerTyping(e.detail.is_typing);
      }
    };
    
    window.addEventListener('typingIndicator', handleTypingIndicator);
    return () => window.removeEventListener('typingIndicator', handleTypingIndicator);
  }, [activeChatId]);

  // Retry failed message
  const retryMessage = useCallback((messageId) => {
    const message = messages.find(m => m.id === messageId);
    if (!message) return;
    
    setFailedMessages(prev => prev.filter(id => id !== messageId));
    sendMessage(activeChatId, message.content);
  }, [messages, activeChatId, sendMessage]);

  // Handle send message
  const handleSend = useCallback((e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChatId || !isConnected) return;
    if (containsContactInfo(inputText)) {
      setBlockedMessage('Contact information cannot be shared in chat');
      setTimeout(() => setBlockedMessage(null), 5000);
      return;
    }

    const messageKey = `${inputText}-${activeChatId}-${Date.now()}`;
    if (sentMessagesRef.current.has(messageKey)) {
      console.log('Prevented duplicate message submission');
      return;
    }
    sentMessagesRef.current.add(messageKey);
    
    setTimeout(() => {
      sentMessagesRef.current.delete(messageKey);
    }, 3000);

    const tempId = `temp-${Date.now()}`;
    const newMessage = {
      id: tempId,
      sender: currentUser?.id,
      recipient: activeChatId,
      content: inputText.trim(),
      timestamp: new Date().toISOString(),
      status: 'sending',
    };

    setMessages(prev => [...prev, newMessage]);
    const contentToSend = inputText.trim();
    setInputText('');

    try {
      sendMessage(activeChatId, contentToSend);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? { ...msg, status: 'failed' } : msg
      ));
      setFailedMessages(prev => [...prev, tempId]);
    }
    
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, [inputText, activeChatId, currentUser, sendMessage, setMessages, isConnected]);

  // Refresh messages
  const handleRefresh = useCallback(async () => {
    if (!activeChatId || isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      const result = await api.getChatHistory(activeChatId);
      if (!result.error && result.data) {
        setMessages(result.data);
      }
      await fetchInbox();
    } catch (error) {
      console.error('Error refreshing messages:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [activeChatId, isRefreshing, setMessages, fetchInbox]);

  // Handle conversation selection
  const handleSelectConversation = useCallback((partnerId) => {
    setActiveChatId(partnerId);
    setMobileView('chat');
    setMessages([]);
    setInitialLoadDone(false);
    
    const loadChat = async () => {
      const result = await api.getChatHistory(partnerId);
      if (!result.error && result.data) {
        setMessages(result.data);
      }
      setInitialLoadDone(true);
    };
    loadChat();
  }, [setActiveChatId, setMessages]);

  // Clear blocked message after timeout
  useEffect(() => {
    if (blockedMessage) {
      const timer = setTimeout(() => setBlockedMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [blockedMessage]);

  // Get the chat partner name
  const nameFromUrl = searchParams.get('name');
  const inboxPartner = inbox.find(c => c.partner_id === activeChatId);
  
  const currentChatPartner = useMemo(() => {
    if (nameFromUrl) {
      return decodeURIComponent(nameFromUrl);
    }
    if (inboxPartner?.partner_name) {
      return inboxPartner.partner_name;
    }
    return `User ${activeChatId || ''}`;
  }, [nameFromUrl, inboxPartner, activeChatId]);

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
    isTyping: partnerTyping,
    onTyping: handleTyping,
    isRefreshing,
    onRefresh: handleRefresh,
    retryMessage,
    failedMessages,
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

// ── Export with Error Boundary ──────────────────────────────────────────────

export default function ChatPage() {
  return (
    <ChatErrorBoundary>
      <ChatPageContent />
    </ChatErrorBoundary>
  );
}
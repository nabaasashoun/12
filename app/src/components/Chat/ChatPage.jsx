// ChatPage.jsx - Fully updated with robust profile picture handling
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Send, MessageCircle, Wifi, WifiOff, RefreshCw, 
  ChevronLeft, MoreVertical, Flag, UserX, Trash2, 
  Image as ImageIcon, Camera, X, Check, AlertCircle,
  User 
} from 'lucide-react';
import { useChat } from '../../utils/ChatContext';
import { useDarkMode } from '../../utils/BuyerDarkModeContext';
import { useSellerDarkMode } from '../../utils/SellerDarkModeContext';
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

// ── Enhanced Avatar component with robust image handling ──────────────────

const Avatar = ({ name, size = 'md', active = false, imageUrl = null, isDarkMode = false, className = '' }) => {
  const [imgError, setImgError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const sizeClass =
    size === 'sm' ? 'w-8 h-8 text-xs'
      : size === 'lg' ? 'w-12 h-12 text-base'
        : 'w-10 h-10 text-sm';
  
  const borderClass = active ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900' : '';
  
  // Default profile image - using a data URI for reliable fallback
  const defaultImage = '/profile.jpg';
  
  // Determine which image to show - robust fallback chain
  let displayImage = defaultImage;
  if (imageUrl && !imgError) {
    // Check if it's a valid URL (starts with http or /)
    if (imageUrl.startsWith('http') || imageUrl.startsWith('/')) {
      displayImage = imageUrl;
    } else {
      // Try to construct absolute URL if relative
      try {
        displayImage = new URL(imageUrl, window.location.origin).toString();
      } catch {
        displayImage = defaultImage;
      }
    }
  }

  // Get initials for fallback
  const getInitials = () => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const initials = getInitials();

  return (
    <div className={`relative shrink-0 ${sizeClass} ${className}`}>
      {isLoading && (
        <div className={`absolute inset-0 rounded-full animate-pulse ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
      )}
      
      {/* Show initials as fallback when image fails */}
      {imgError && (
        <div className={`${sizeClass} rounded-full flex items-center justify-center font-bold
          ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}
          ${active ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900' : ''}
          border-2 ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}
        >
          {initials}
        </div>
      )}
      
      {/* Image - hidden when error */}
      <img 
        src={displayImage} 
        alt={name || 'User'}
        className={`${sizeClass} rounded-full object-cover border-2 transition-all duration-300 ease-in-out
          ${active ? 'border-blue-500' : isDarkMode ? 'border-gray-600' : 'border-gray-200'}
          ${borderClass}
          ${isLoading ? 'opacity-0' : 'opacity-100'}
          ${imgError ? 'hidden' : 'block'}
          hover:scale-105 transition-transform duration-200`}
        onLoad={() => setIsLoading(false)}
        onError={(e) => {
          console.log(`🖼️ Avatar image failed to load for ${name}:`, imageUrl);
          setImgError(true);
          setIsLoading(false);
        }}
        loading="lazy"
      />
      
      {active && !imgError && (
        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
      )}
    </div>
  );
};

// ── Connection Badge with animation (EXPORTED) ────────────────────────────

export const ConnectionBadge = ({ isConnected, short = false }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  
  return (
    <div className="relative">
      <span 
        className={`flex items-center gap-1.5 text-xs font-medium transition-all duration-300
          ${isConnected 
            ? 'text-green-600 dark:text-green-400' 
            : 'text-orange-500 dark:text-orange-400 animate-pulse'
          }`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {isConnected ? (
          <Wifi className="w-3.5 h-3.5 text-green-500 dark:text-green-400" />
        ) : (
          <WifiOff className="w-3.5 h-3.5 text-orange-400 dark:text-orange-300 animate-pulse" />
        )}
        {!short && (isConnected ? 'Live' : 'Connecting…')}
      </span>
      {!short && showTooltip && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-0.5 text-[10px] 
          bg-gray-900 dark:bg-gray-700 text-white rounded whitespace-nowrap opacity-90">
          {isConnected ? 'Connected to chat server' : 'Attempting to reconnect...'}
        </span>
      )}
    </div>
  );
};

// ── Three Dots Menu Component ──────────────────────────────────────────────

const ThreeDotsMenu = ({ isDarkMode, onReport, onBlock, onClearChat, isBlocked }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const menuItems = [
    { icon: Flag, label: 'Report', onClick: onReport, color: 'text-red-500' },
    { icon: UserX, label: isBlocked ? 'Unblock' : 'Block', onClick: onBlock, color: 'text-red-500' },
    { icon: Trash2, label: 'Clear Chat', onClick: onClearChat, color: 'text-red-400' },
  ];

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-full transition-all duration-200 hover:scale-110 active:scale-90
          ${isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
        aria-label="More options"
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className={`absolute right-0 top-full mt-2 w-48 rounded-lg shadow-lg border overflow-hidden z-50
          ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
          animate-fade-in-down`}
        >
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                item.onClick();
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors duration-200
                ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}
                ${index !== menuItems.length - 1 ? (isDarkMode ? 'border-b border-gray-700' : 'border-b border-gray-100') : ''}`}
            >
              <item.icon className={`w-4 h-4 ${item.color}`} />
              <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ── InboxPanel ─────────────────────────────────────────────────────────────

const InboxPanel = React.memo(({ inbox, activeChatId, isConnected, onSelectConversation, isDarkMode }) => {
  const getPartnerImage = (conv) => {
    // Robust image URL handling
    const image = conv.profile_photo || conv.partner_profile_photo || null;
    if (!image) return null;
    
    // If it's a relative path, make it absolute
    if (image.startsWith('/')) {
      return image;
    }
    
    // If it's already absolute or a full URL, return as is
    if (image.startsWith('http://') || image.startsWith('https://')) {
      return image;
    }
    
    // Try to construct absolute URL
    try {
      return new URL(image, window.location.origin).toString();
    } catch {
      return null;
    }
  };
  
  return (
    <div className={`flex flex-col h-full transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
      <div className={`px-4 py-4 border-b transition-colors duration-300 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} flex items-center justify-between shrink-0 sticky top-0 z-10`}>
        <div>
          <h1 className={`text-xl font-bold transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Messages</h1>
          <p className={`text-xs transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {inbox.length} conversation{inbox.length !== 1 ? 's' : ''}
          </p>
        </div>
        <ConnectionBadge isConnected={isConnected} />
      </div>

      <div className={`flex-1 overflow-y-auto divide-y transition-colors duration-300 ${isDarkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
        {inbox.length === 0 ? (
          <div className={`flex flex-col items-center justify-center h-full py-16 text-center px-6 transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
            <MessageCircle className={`w-16 h-16 transition-colors duration-300 ${isDarkMode ? 'text-gray-600' : 'text-gray-200'} mb-4`} />
            <p className={`font-medium transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>No conversations yet</p>
            <p className={`text-sm mt-1 max-w-xs transition-colors duration-300 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              When you start chatting with someone, they'll appear here.
            </p>
          </div>
        ) : (
          inbox.map((conv) => {
            const isActive = activeChatId === conv.partner_id;
            const partnerImage = getPartnerImage(conv);
            
            return (
              <button
                key={conv.partner_id}
                onClick={() => onSelectConversation(conv.partner_id)}
                className={`w-full text-left px-4 py-4 flex items-center gap-3 transition-all duration-200 
                  hover:scale-[1.01] active:scale-[0.98] group
                  ${isActive
                    ? isDarkMode ? 'bg-gray-800 border-l-4 border-blue-500' : 'bg-blue-50 border-l-4 border-blue-500'
                    : isDarkMode ? 'hover:bg-gray-800 border-l-4 border-transparent' : 'hover:bg-gray-50 border-l-4 border-transparent'}`}
              >
                <Avatar 
                  name={conv.partner_name} 
                  size="lg" 
                  active={isActive} 
                  imageUrl={partnerImage}
                  isDarkMode={isDarkMode}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <span className={`font-semibold text-base truncate transition-colors duration-200
                      ${isActive ? (isDarkMode ? 'text-blue-400' : 'text-blue-700') : (isDarkMode ? 'text-gray-200' : 'text-gray-900')}`}>
                      {conv.partner_name || 'User'}
                    </span>
                    <span className={`text-xs shrink-0 ml-2 transition-colors duration-200 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      {formatDate(conv.timestamp)}
                    </span>
                  </div>
                  <p className={`text-sm truncate mt-0.5 transition-colors duration-200 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {conv.last_message || 'No messages yet'}
                  </p>
                </div>
                {conv.unread_count > 0 && (
                  <span className="shrink-0 bg-blue-500 text-white text-xs font-bold
                    w-6 h-6 rounded-full flex items-center justify-center animate-bounce-once">
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
});

InboxPanel.displayName = 'InboxPanel';

// ── Animated Message Component ─────────────────────────────────────────────

const AnimatedMessage = React.memo(({ 
  message, 
  isMe, 
  currentChatPartner, 
  currentChatPartnerImage, 
  isDarkMode, 
  retryMessage, 
  isSending, 
  isFailed,
  index 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50 + (index * 30));
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <div 
      className={`flex ${isMe ? 'justify-end' : 'justify-start'} transition-all duration-300 ease-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
    >
      {!isMe && (
        <Avatar 
          name={currentChatPartner} 
          size="sm" 
          imageUrl={currentChatPartnerImage || null} 
          isDarkMode={isDarkMode}
          className="mt-1"
        />
      )}
      <div className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 ml-2 transition-all duration-200
        ${isMe
          ? `bg-blue-500 text-white rounded-br-sm ${isFailed ? 'opacity-70' : ''}`
          : isDarkMode 
            ? 'bg-gray-800 text-gray-200 border border-gray-700 rounded-bl-sm shadow-sm' 
            : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm shadow-sm'}`}
      >
        <p className="text-sm leading-relaxed break-words">{message.content}</p>
        <div className="flex items-center justify-end gap-1 mt-1">
          <span className={`text-[10px] ${isMe ? 'text-blue-200' : (isDarkMode ? 'text-gray-500' : 'text-gray-400')}`}>
            {formatTime(message.timestamp)}
          </span>
          {isMe && isSending && (
            <span className="text-[10px] text-blue-200 animate-pulse">Sending...</span>
          )}
          {isMe && isFailed && (
            <button 
              onClick={() => retryMessage?.(message.id)}
              className="text-[10px] text-red-300 hover:text-red-100 transition-colors duration-200 flex items-center gap-0.5 hover:scale-105 active:scale-95"
            >
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
          )}
          {isMe && !isSending && !isFailed && (
            <span className="text-[10px] text-blue-200">✓</span>
          )}
          {!isMe && message.is_read && (
            <span className={`text-[10px] ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>✓</span>
          )}
        </div>
      </div>
    </div>
  );
});

AnimatedMessage.displayName = 'AnimatedMessage';

// ── ChatView ────────────────────────────────────────────────────────────────

const ChatView = React.memo(({
  messages,
  currentUser,
  currentChatPartner,
  currentChatPartnerImage,
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
  isDarkMode,
  onReport,
  onBlock,
  onClearChat,
  isBlocked,
  onFileUpload,
  onCameraCapture,
}) => {
  const isBlockedInput = containsContactInfo(inputText);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesContainerRef = useRef(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [currentChatPartner, inputRef]);

  useEffect(() => {
    if (messagesEndRef.current && isAtBottom) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isAtBottom]);

  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollButton(!isNearBottom);
    setIsAtBottom(isNearBottom);
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setIsAtBottom(true);
  }, []);

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups = [];
    let currentDate = null;
    
    messages.forEach((msg, index) => {
      const msgDate = new Date(msg.timestamp).toDateString();
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: msgDate, messages: [msg], startIndex: index });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    });
    
    return groups;
  }, [messages]);

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  return (
    <div className={`flex flex-col h-full ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} relative`}>
      {/* Header */}
      <div className={`px-3 py-3 border-b transition-colors duration-300 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} flex items-center gap-3 shrink-0 sticky top-0 z-10`}>
        <button
          onClick={onBack}
          className={`p-2 -ml-2 rounded-full transition-all duration-200 active:scale-90 
            ${isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
          aria-label="Back to inbox"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <Avatar 
          name={currentChatPartner} 
          size="lg" 
          imageUrl={currentChatPartnerImage || null}
          isDarkMode={isDarkMode}
          active={true}
        />
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-base truncate transition-colors duration-300 ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
            {currentChatPartner || 'User'}
          </p>
          <div className="flex items-center gap-2">
            <ConnectionBadge isConnected={isConnected} short />
            {isTyping && (
              <span className="text-xs text-blue-500 animate-pulse flex items-center gap-1">
                <span className="typing-dot">.</span>
                <span className="typing-dot" style={{ animationDelay: '0.2s' }}>.</span>
                <span className="typing-dot" style={{ animationDelay: '0.4s' }}>.</span>
              </span>
            )}
          </div>
        </div>
        <ThreeDotsMenu 
          isDarkMode={isDarkMode}
          onReport={onReport}
          onBlock={onBlock}
          onClearChat={onClearChat}
          isBlocked={isBlocked}
        />
      </div>

      {/* Disconnected Banner */}
      {!isConnected && (
        <div className={`px-3 py-2 border-b text-center transition-all duration-300 ${isDarkMode ? 'bg-yellow-900/30 border-yellow-800' : 'bg-yellow-50 border-yellow-200'} animate-slide-down`}>
          <p className={`text-xs flex items-center justify-center gap-1 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-700'}`}>
            <WifiOff className="w-3 h-3 inline animate-pulse" />
            Reconnecting to chat server...
          </p>
        </div>
      )}

      {/* Messages Container */}
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className={`flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-2 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
      >
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-center py-12 animate-fade-in">
            <div>
              <MessageCircle className={`w-12 h-12 mx-auto mb-3 ${isDarkMode ? 'text-gray-600' : 'text-gray-200'}`} />
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}>No messages yet</p>
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`}>Say hello to {currentChatPartner}!</p>
            </div>
          </div>
        ) : (
          groupedMessages.map((group) => (
            <React.Fragment key={group.date}>
              <div className="flex justify-center my-2 animate-fade-in">
                <span className={`text-xs px-3 py-1 rounded-full transition-colors duration-300 ${isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-400'}`}>
                  {new Date(group.date).toLocaleDateString([], { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
              {group.messages.map((msg, idx) => {
                const isMe = msg.sender === currentUser?.id;
                const isFailed = msg.status === 'failed';
                const isSending = msg.status === 'sending' || (typeof msg.id === 'string' && msg.id.startsWith('temp-'));
                const globalIndex = group.startIndex + idx;
                
                return (
                  <AnimatedMessage
                    key={msg.id || `msg-${globalIndex}`}
                    message={msg}
                    isMe={isMe}
                    currentChatPartner={currentChatPartner}
                    currentChatPartnerImage={currentChatPartnerImage}
                    isDarkMode={isDarkMode}
                    retryMessage={retryMessage}
                    isSending={isSending}
                    isFailed={isFailed}
                    index={globalIndex}
                  />
                );
              })}
            </React.Fragment>
          ))
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className={`absolute bottom-24 right-4 rounded-full shadow-lg p-2.5 border transition-all duration-200 
            hover:scale-105 active:scale-95 animate-fade-in-up
            ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} 
            hover:bg-gray-50 dark:hover:bg-gray-700`}
        >
          <MessageCircle className="w-4 h-4 text-blue-500 rotate-180" />
        </button>
      )}

      {/* Warning Messages */}
      {isBlockedInput && (
        <div className="mx-3 mb-1 px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2 animate-shake">
          <span>🚫</span>
          Contact details (phones, emails, links) cannot be shared here.
        </div>
      )}

      {blockedMessage && (
        <div className="mx-3 mb-1 px-3 py-2 bg-orange-50 border border-orange-200 rounded-xl text-xs text-orange-600 flex items-center gap-2 animate-shake">
          <span>⚠️</span>
          {blockedMessage}
        </div>
      )}

      {/* Input Area with File Upload and Camera */}
      <div className={`px-3 py-3 border-t shrink-0 relative z-10 transition-colors duration-300 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <form onSubmit={onSend} className="flex items-center gap-2">
          {/* File Upload Button */}
          <button
            type="button"
            onClick={handleFileClick}
            className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-90
              ${isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
            aria-label="Upload file"
          >
            <ImageIcon className="w-5 h-5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,.pdf,.doc,.docx,.txt"
            onChange={onFileUpload}
            className="hidden"
            multiple
          />

          {/* Camera Button */}
          <button
            type="button"
            onClick={handleCameraClick}
            className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-90
              ${isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
            aria-label="Take photo"
          >
            <Camera className="w-5 h-5" />
          </button>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={onCameraCapture}
            className="hidden"
          />

          {/* Message Input */}
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={onTyping}
            placeholder="Type a message…"
            autoFocus={true}
            className={`flex-1 rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200
              ${isDarkMode 
                ? 'bg-gray-700 text-gray-200 placeholder-gray-400 focus:bg-gray-600' 
                : 'bg-gray-100 text-gray-900 placeholder-gray-400 focus:bg-white'}`}
            style={{ 
              WebkitAppearance: 'none',
              WebkitTapHighlightColor: 'transparent',
              fontSize: '16px'
            }}
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim() || !isConnected || isBlockedInput}
            className="shrink-0 w-11 h-11 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 hover:scale-105"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
});

ChatView.displayName = 'ChatView';

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
        <div className="flex items-center justify-center h-full p-8 text-center bg-gray-50 dark:bg-gray-900">
          <div>
            <p className="text-red-600 font-semibold text-lg">Something went wrong</p>
            <p className="text-gray-500 text-sm mt-2">We're having trouble loading your messages</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 hover:scale-105 active:scale-95"
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
    markAsRead,
  } = useChat();

  // Get dark mode based on user role
  const buyerDarkMode = useDarkMode();
  const sellerDarkMode = useSellerDarkMode();
  
  // Determine which dark mode to use (buyer or seller)
  const userRole = localStorage.getItem('userRole');
  const isDarkMode = userRole === 'seller' 
    ? sellerDarkMode?.isDarkMode || false 
    : buyerDarkMode?.isDarkMode || false;

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [inputText, setInputText] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [blockedMessage, setBlockedMessage] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [failedMessages, setFailedMessages] = useState([]);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const sentMessagesRef = useRef(new Set());
  const loadChatTimeoutRef = useRef(null);

  // Get the chat partner name and image
  const inboxPartner = inbox.find(c => c.partner_id === activeChatId);
  
  const currentChatPartner = useMemo(() => {
    if (inboxPartner?.partner_name) {
      return inboxPartner.partner_name;
    }
    return `User ${activeChatId || ''}`;
  }, [inboxPartner, activeChatId]);
  
  const currentChatPartnerImage = useMemo(() => {
    if (!inboxPartner) return null;
    const image = inboxPartner.profile_photo || null;
    if (!image) return null;
    
    // Handle relative URLs
    if (image.startsWith('/')) {
      return image;
    }
    
    // Handle absolute URLs
    if (image.startsWith('http://') || image.startsWith('https://')) {
      return image;
    }
    
    // Try to construct absolute URL
    try {
      return new URL(image, window.location.origin).toString();
    } catch {
      return null;
    }
  }, [inboxPartner]);

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

  // Auto-select chat from URL params
  useEffect(() => {
    if (loadChatTimeoutRef.current) {
      clearTimeout(loadChatTimeoutRef.current);
    }

    const userId = searchParams.get('userId');
    const sellerId = searchParams.get('sellerId');
    const buyerId = searchParams.get('buyerId');
    const targetUserId = userId || sellerId || buyerId;
    
    if (!targetUserId) {
      return;
    }
    
    const targetId = parseInt(targetUserId);
    
    if (activeChatId === targetId) {
      return;
    }
    
    setLoadingChat(true);
    
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
        await markAsRead(targetId);
        
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
  }, [searchParams, setActiveChatId, setMessages, fetchInbox, activeChatId, markAsRead]);

  // Mark messages as read when chat is active
  useEffect(() => {
    if (activeChatId && messages.length > 0 && !loadingChat) {
      const hasUnread = messages.some(m => m.sender === activeChatId && !m.is_read);
      if (hasUnread) {
        markAsRead(activeChatId);
      }
    }
  }, [activeChatId, messages, loadingChat, markAsRead]);

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
    
    clearTimeout(typingTimeoutRef.current);
    
    if (value.trim() && !isTyping) {
      setIsTyping(true);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 2000);
  }, [isTyping]);

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
    if (!inputText.trim() || !activeChatId || !isConnected) {
      console.log('Cannot send: missing text, chat ID, or not connected');
      return;
    }
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
    setIsTyping(false);

    try {
      const success = sendMessage(activeChatId, contentToSend);
      if (!success) {
        setMessages(prev => prev.map(msg => 
          msg.id === tempId ? { ...msg, status: 'failed' } : msg
        ));
        setFailedMessages(prev => [...prev, tempId]);
      }
      setTimeout(() => {
        setMessages(prev => prev.map(msg => {
          if (msg.id === tempId && msg.status === 'sending') {
            console.log('⏰ Message timeout, marking as failed');
            return { ...msg, status: 'failed' };
          }
          return msg;
        }));
      }, 10000);
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
      await markAsRead(activeChatId);
    } catch (error) {
      console.error('Error refreshing messages:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [activeChatId, isRefreshing, setMessages, fetchInbox, markAsRead]);

  // Handle conversation selection
  const handleSelectConversation = useCallback((partnerId) => {
    console.log('🔄 Selecting conversation with partner:', partnerId);
    
    setActiveChatId(partnerId);
    setMessages([]);
    
    api.getChatHistory(partnerId).then(result => {
      console.log('📥 Chat history result:', result);
      if (!result.error && result.data) {
        console.log(`✅ Loaded ${result.data.length} messages`);
        setMessages(result.data);
      }
      fetchInbox();
      markAsRead(partnerId);
    }).catch(error => {
      console.error('❌ Error fetching chat history:', error);
    });
    
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 500);
  }, [setActiveChatId, setMessages, fetchInbox, markAsRead]);

  // Handle back from chat view - Mobile
  const handleBack = useCallback(() => {
    setActiveChatId(null);
    setMessages([]);
    navigate('/chat');
  }, [setActiveChatId, setMessages, navigate]);

  // Clear blocked message after timeout
  useEffect(() => {
    if (blockedMessage) {
      const timer = setTimeout(() => setBlockedMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [blockedMessage]);

  // Three Dots Menu Handlers
  const handleReport = useCallback(() => {
    if (!activeChatId) return;
    console.log('🚨 Reporting user:', activeChatId);
    alert(`Report user ${currentChatPartner}? This will notify our moderation team.`);
  }, [activeChatId, currentChatPartner]);

  const handleBlock = useCallback(() => {
    if (!activeChatId) return;
    setIsBlocked(!isBlocked);
    console.log(`${isBlocked ? '🔓 Unblocking' : '🔒 Blocking'} user:`, activeChatId);
    alert(`${isBlocked ? 'Unblocked' : 'Blocked'} ${currentChatPartner}`);
  }, [activeChatId, isBlocked, currentChatPartner]);

  const handleClearChat = useCallback(() => {
    if (!activeChatId) return;
    if (window.confirm(`Are you sure you want to clear all messages with ${currentChatPartner}?`)) {
      console.log('🗑️ Clearing chat:', activeChatId);
      setMessages([]);
      alert('Chat cleared successfully');
    }
  }, [activeChatId, currentChatPartner, setMessages]);

  // File upload handler
  const handleFileUpload = useCallback((e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    console.log('📎 Uploading files:', files);
    alert(`Uploading ${files.length} file(s)...`);
    
    // Reset input
    e.target.value = '';
  }, []);

  // Camera capture handler
  const handleCameraCapture = useCallback((e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    console.log('📸 Captured photo:', files[0]);
    alert('Photo captured!');
    
    // Reset input
    e.target.value = '';
  }, []);

  const sharedInboxProps = {
    inbox,
    activeChatId,
    isConnected,
    onSelectConversation: handleSelectConversation,
    isDarkMode,
  };

  const sharedChatProps = {
    messages,
    currentUser,
    currentChatPartner,
    currentChatPartnerImage,
    isConnected,
    inputText,
    setInputText,
    inputRef,
    messagesEndRef,
    onSend: handleSend,
    onBack: handleBack,
    blockedMessage,
    isTyping: partnerTyping,
    onTyping: handleTyping,
    isRefreshing,
    onRefresh: handleRefresh,
    retryMessage,
    failedMessages,
    isDarkMode,
    onReport: handleReport,
    onBlock: handleBlock,
    onClearChat: handleClearChat,
    isBlocked,
    onFileUpload: handleFileUpload,
    onCameraCapture: handleCameraCapture,
  };

  return (
    <div className={`flex h-[calc(100vh-56px)] ${isDarkMode ? 'bg-gray-900' : 'bg-white'} overflow-hidden`}>
      {/* Mobile View - Full screen conversation */}
      <div className="flex flex-col flex-1 md:hidden">
        {!activeChatId ? (
          <InboxPanel {...sharedInboxProps} />
        ) : (
          <ChatView {...sharedChatProps} />
        )}
      </div>

      {/* Desktop View - Split view */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        <div className={`w-80 border-r ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} flex flex-col shrink-0 overflow-hidden`}>
          <InboxPanel {...sharedInboxProps} />
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeChatId ? (
            <ChatView {...sharedChatProps} />
          ) : (
            <div className={`flex-1 flex flex-col items-center justify-center text-center px-8 transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
              <MessageCircle className={`w-20 h-20 mb-4 transition-colors duration-300 ${isDarkMode ? 'text-gray-600' : 'text-gray-200'}`} />
              <p className={`font-medium text-xl transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Select a conversation</p>
              <p className={`text-sm mt-1 max-w-sm transition-colors duration-300 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
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
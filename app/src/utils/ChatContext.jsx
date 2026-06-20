// ChatContext.jsx - Fully updated
import {
  createContext, useContext, useState, useEffect,
  useRef, useCallback, useMemo,
} from 'react';
import api from './api';

const ChatContext = createContext();

export function ChatProvider({ children }) {
  const [messages, setMessages] = useState([]);
  const [inbox, setInbox] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const wsRef = useRef(null);
  const reconnectDelayRef = useRef(2000);
  const reconnectTimerRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const fetchInboxRef = useRef(null);
  const isConnectingRef = useRef(false);
  const maxReconnectAttempts = 10;
  const messageDedupRef = useRef(new Set());

  const fetchInbox = useCallback(async () => {
    if (!api.getToken()) {
      console.log('No token, skipping inbox fetch');
      return;
    }
    try {
      const r = await api.getChatInbox();
      if (!r.error && r.data) {
        console.log('📬 Inbox updated:', r.data.length, 'conversations');
        setInbox(r.data);
      } else {
        console.log('📬 Inbox fetch returned empty or error');
        setInbox([]);
      }
    } catch (error) {
      console.error('Error fetching inbox:', error);
      setInbox([]);
    }
  }, []);

  // Keep the ref current without re-creating connectWs
  useEffect(() => { 
    fetchInboxRef.current = fetchInbox; 
  }, [fetchInbox]);

// In ChatContext.jsx, update the connectWs function to better handle connection states

  const connectWs = useCallback(() => {
    const token = api.getToken();
    if (!token) {
      console.log('No token available for WebSocket connection');
      setConnectionError('No authentication token');
      return;
    }

    // Check if already connected or connecting
    const ws = wsRef.current;
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
      console.log('WebSocket already connected or connecting, skipping new connection');
      return;
    }

    // Check if we're currently in the process of connecting
    if (isConnectingRef.current) {
      console.log('WebSocket connection already in progress, skipping...');
      return;
    }

    // Clean up any existing socket
    if (ws) {
      ws._intentional = true;
      ws.close();
      wsRef.current = null;
    }

    isConnectingRef.current = true;

    // Build WebSocket URL
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    const baseUrl = apiBaseUrl.replace('/api', '');
    const wsBaseUrl = baseUrl.replace('http', 'ws');
    const wsUrl = `${wsBaseUrl}/ws/?token=${token}`;
    
    console.log('🔌 Connecting to WebSocket:', wsUrl.replace(token, 'token=***'));

    try {
      const socket = new WebSocket(wsUrl);
      socket._intentional = false;
      wsRef.current = socket;

      socket.onopen = () => {
        if (wsRef.current !== socket) return;
        console.log('✅ WebSocket connected successfully');
        setIsConnected(true);
        setConnectionError(null);
        reconnectDelayRef.current = 2000;
        reconnectAttemptsRef.current = 0;
        isConnectingRef.current = false;
        
        // Send initial ping
        socket.send(JSON.stringify({ type: 'ping' }));
        
        // Refresh inbox on connection
        fetchInboxRef.current?.();
      };

      socket.onclose = (event) => {
        console.log(`WebSocket closed: Code ${event.code} - ${event.reason || 'No reason'}`);
        isConnectingRef.current = false;
        
        // Only reconnect if not intentional and not in the middle of auth change
        if (socket._intentional) {
          console.log('Intentional close, not reconnecting');
          return;
        }

        if (wsRef.current === socket) {
          wsRef.current = null;
          setIsConnected(false);
        }

        // Don't reconnect if we've exceeded max attempts
        if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          console.log('Max reconnection attempts reached');
          setConnectionError('Unable to connect to chat server');
          return;
        }

        // Calculate delay with exponential backoff
        const delay = reconnectDelayRef.current;
        reconnectDelayRef.current = Math.min(delay * 1.5, 30000);
        reconnectAttemptsRef.current += 1;

        console.log(`Reconnecting in ${delay}ms... (Attempt ${reconnectAttemptsRef.current})`);
        
        if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = setTimeout(() => {
          if (api.getToken()) {
            connectWs();
          }
        }, delay);
      };

      // ... rest of the code remains the same
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      setConnectionError('Failed to create WebSocket connection');
      isConnectingRef.current = false;
    }
  }, []);

  // Initial connection setup
  useEffect(() => {
    if (isInitialized) return;
    
    const token = api.getToken();
    if (token) {
      connectWs();
      fetchInbox();
      setIsInitialized(true);
    }

    const handleAuthChange = () => {
      console.log('Auth state changed, reconnecting WebSocket...');
      reconnectAttemptsRef.current = 0;
      reconnectDelayRef.current = 2000;
      messageDedupRef.current.clear();
      connectWs();
      fetchInbox();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Page became visible, checking WebSocket...');
        const ws = wsRef.current;
        if (!ws || ws.readyState !== WebSocket.OPEN) {
          connectWs();
        }
        // Refresh inbox when tab becomes visible
        fetchInbox();
      }
    };

    // Listen for new message events to refresh inbox
    const handleNewMessage = () => {
      console.log('New message event received, refreshing inbox...');
      fetchInbox();
    };

    window.addEventListener('authStateChanged', handleAuthChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('chatMessageReceived', handleNewMessage);
    window.addEventListener('newChatMessage', handleNewMessage);

    return () => {
      window.removeEventListener('authStateChanged', handleAuthChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('chatMessageReceived', handleNewMessage);
      window.removeEventListener('newChatMessage', handleNewMessage);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current._intentional = true;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connectWs, fetchInbox, isInitialized]);

  // Send message function
  const sendMessage = useCallback((recipientId, content) => {
    if (!recipientId || !content) {
      console.warn('Cannot send message: missing recipient or content');
      return false;
    }

    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      const message = {
        type: 'chat_message',
        recipient_id: recipientId,
        content: content.trim(),
      };
      
      try {
        ws.send(JSON.stringify(message));
        console.log(`📤 Message sent to ${recipientId}:`, content);
        return true;
      } catch (error) {
        console.error('Error sending message:', error);
        setConnectionError('Failed to send message');
        return false;
      }
    } else {
      console.warn('❌ WebSocket not connected. ReadyState:', ws?.readyState);
      setConnectionError('Not connected to chat server');
      
      // Attempt to reconnect
      connectWs();
      return false;
    }
  }, [connectWs]);

  // Start chat with a user
  const startChat = useCallback(async (userId) => {
    if (!userId) {
      console.warn('Cannot start chat: missing userId');
      return;
    }
    
    setActiveChatId(userId);
    // Clear messages when switching chats
    setMessages([]);
    // Clear dedup set
    messageDedupRef.current.clear();
    
    try {
      // Fetch messages for this user
      const response = await api.getChatHistory(userId);
      if (!response.error && response.data) {
        setMessages(response.data);
        console.log(`📨 Loaded ${response.data.length} messages for chat with user ${userId}`);
      }
      
      // Refresh inbox to update unread counts
      fetchInbox();
      
      // Mark messages as read
      try {
        await api.markChatRead(userId);
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
      
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  }, [fetchInbox]);

  // Mark messages as read
  const markAsRead = useCallback(async (userId) => {
    if (!userId) return;
    try {
      await api.markChatRead(userId);
      // Update local messages to mark as read
      setMessages(prev => prev.map(msg => 
        msg.sender === userId ? { ...msg, is_read: true } : msg
      ));
      // Refresh inbox to update unread counts
      fetchInbox();
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [fetchInbox]);

  // Calculate unread count
  const unreadCount = useMemo(
    () => inbox.reduce((sum, item) => sum + (item.unread_count || 0), 0),
    [inbox],
  );

  // Clear all messages
  const clearMessages = useCallback(() => {
    setMessages([]);
    messageDedupRef.current.clear();
  }, []);

  // Force refresh inbox
  const refreshInbox = useCallback(() => {
    fetchInbox();
  }, [fetchInbox]);

  const value = useMemo(() => ({
    messages,
    setMessages,
    inbox,
    fetchInbox: refreshInbox,
    activeChatId,
    setActiveChatId,
    sendMessage,
    isConnected,
    connectionError,
    startChat,
    unreadCount,
    clearMessages,
    markAsRead,
    reconnect: connectWs,
  }), [
    messages,
    inbox,
    activeChatId,
    isConnected,
    connectionError,
    unreadCount,
    refreshInbox,
    sendMessage,
    startChat,
    clearMessages,
    markAsRead,
    connectWs,
  ]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
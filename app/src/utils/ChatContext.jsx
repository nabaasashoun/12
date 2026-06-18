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

  const wsRef = useRef(null);
  const reconnectDelayRef = useRef(2000);
  const reconnectTimerRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 10;
  const fetchInboxRef = useRef(null);

  const fetchInbox = useCallback(async () => {
    if (!api.getToken()) return;
    try {
      const r = await api.getChatInbox();
      if (!r.error && r.data) {
        setInbox(r.data);
      }
    } catch (error) {
      console.error('Error fetching inbox:', error);
    }
  }, []);

  // Keep the ref current without re-creating connectWs
  useEffect(() => { fetchInboxRef.current = fetchInbox; }, [fetchInbox]);

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
      console.log('WebSocket already connected or connecting');
      return;
    }

    // Clean up any existing socket
    if (ws) {
      ws._intentional = true;
      ws.close();
      wsRef.current = null;
    }

    // Build WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname || 'localhost';
    const port = '8000'; // Your Django server port
    
    // Use environment variable if available
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    const baseUrl = apiBaseUrl.replace('/api', '');
    const wsBaseUrl = baseUrl.replace('http', 'ws');
    const wsUrl = `${wsBaseUrl}/ws/?token=${token}`;
    
    console.log('Connecting to WebSocket:', wsUrl.replace(token, 'token=***'));

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
        
        // Send initial ping to verify connection
        socket.send(JSON.stringify({ type: 'ping' }));
      };

      socket.onmessage = (event) => {
        if (wsRef.current !== socket) return;

        let payload;
        try {
          payload = JSON.parse(event.data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          return;
        }

        // Server-side keepalive
        if (payload.type === 'ping') {
          socket.send(JSON.stringify({ type: 'pong' }));
          return;
        }
        if (payload.type === 'pong') {
          console.log('💓 Pong received');
          return;
        }

        // Handle chat messages
        if (payload.type === 'chat_message') {
          const newMsg = {
            id: payload.id || Date.now(),
            sender: payload.sender_id,
            recipient: payload.recipient_id,
            content: payload.content,
            timestamp: payload.timestamp || new Date().toISOString(),
          };

          setMessages(prev => {
            // Deduplicate messages
            if (prev.some(m => m.id === payload.id)) return prev;

            // Replace optimistic temp message if present
            const tempIdx = prev.findIndex(
              m => typeof m.id === 'string'
                && m.id.startsWith('temp-')
                && m.sender === payload.sender_id
                && m.content === payload.content,
            );
            if (tempIdx !== -1) {
              const updated = [...prev];
              updated[tempIdx] = newMsg;
              return updated;
            }
            return [...prev, newMsg];
          });

          // Refresh inbox to update unread counts
          fetchInboxRef.current?.();
          
          // Dispatch event for other components
          window.dispatchEvent(new CustomEvent('chatMessageReceived', { detail: payload }));
        } 
        // Handle notifications
        else if (payload.type === 'notification') {
          window.dispatchEvent(new CustomEvent('newNotification', { detail: payload }));
        }
        // Handle errors
        else if (payload.type === 'error') {
          console.error('WebSocket error message:', payload.message);
          setConnectionError(payload.message);
          window.dispatchEvent(new CustomEvent('chatError', { detail: payload }));
        }
      };

      socket.onclose = (event) => {
        console.log(`WebSocket closed: Code ${event.code} - ${event.reason || 'No reason'}`);
        
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

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionError('WebSocket connection error');
        // onclose will fire after onerror
      };

    } catch (error) {
      console.error('Error creating WebSocket:', error);
      setConnectionError('Failed to create WebSocket connection');
    }
  }, []); // No dependencies - uses refs

  // Initial connection setup
  useEffect(() => {
    const token = api.getToken();
    if (token) {
      connectWs();
      fetchInbox();
    }

    const handleAuthChange = () => {
      console.log('Auth state changed, reconnecting WebSocket...');
      reconnectAttemptsRef.current = 0;
      reconnectDelayRef.current = 2000;
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
      }
    };

    window.addEventListener('authStateChanged', handleAuthChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('authStateChanged', handleAuthChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current._intentional = true;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connectWs, fetchInbox]);

  // Send message function
  const sendMessage = useCallback((recipientId, content) => {
    if (!recipientId || !content) {
      console.warn('Cannot send message: missing recipient or content');
      return;
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
        
        // Add optimistic message to UI
        const optimisticMessage = {
          id: `temp-${Date.now()}`,
          sender: JSON.parse(atob(api.getToken().split('.')[1])).user_id || 'me',
          recipient: recipientId,
          content: content.trim(),
          timestamp: new Date().toISOString(),
          isOptimistic: true,
        };
        setMessages(prev => [...prev, optimisticMessage]);
        
      } catch (error) {
        console.error('Error sending message:', error);
        setConnectionError('Failed to send message');
      }
    } else {
      console.warn('❌ WebSocket not connected. ReadyState:', ws?.readyState);
      setConnectionError('Not connected to chat server');
      
      // Attempt to reconnect
      connectWs();
    }
  }, [connectWs]);

  // Start chat with a user
  const startChat = useCallback((userId) => {
    if (userId) {
      setActiveChatId(userId);
      // Clear messages when switching chats
      setMessages([]);
      // Fetch messages for this user
      api.getChatHistory(userId).then(response => {
        if (!response.error && response.data) {
          setMessages(response.data);
        }
      });
    }
  }, []);

  // Mark messages as read
  const markAsRead = useCallback((senderId) => {
    // This will be handled by the backend
    // The chat history endpoint already marks messages as read
  }, []);

  // Calculate unread count
  const unreadCount = useMemo(
    () => inbox.reduce((sum, item) => sum + (item.unread_count || 0), 0),
    [inbox],
  );

  // Clear all messages
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const value = useMemo(() => ({
    messages,
    setMessages,
    inbox,
    fetchInbox,
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
    fetchInbox,
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
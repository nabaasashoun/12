// ChatContext.jsx - Fully updated with message confirmation handling
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
  const reconnectDelayRef = useRef(1000);
  const reconnectTimerRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const fetchInboxRef = useRef(null);
  const isConnectingRef = useRef(false);
  const maxReconnectAttempts = 5;
  const messageDedupRef = useRef(new Set());
  const connectionTimeoutRef = useRef(null);

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

  useEffect(() => { 
    fetchInboxRef.current = fetchInbox; 
  }, [fetchInbox]);

  const connectWs = useCallback(() => {
    const token = api.getToken();
    if (!token) {
      console.log('No token available for WebSocket connection');
      setConnectionError('No authentication token');
      return;
    }

    const ws = wsRef.current;
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
      console.log('WebSocket already connected or connecting');
      return;
    }

    if (isConnectingRef.current) {
      console.log('WebSocket connection already in progress');
      return;
    }

    if (ws) {
      ws._intentional = true;
      ws.close();
      wsRef.current = null;
    }

    isConnectingRef.current = true;

    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    const baseUrl = apiBaseUrl.replace('/api', '');
    const wsBaseUrl = baseUrl.replace('http', 'ws');
    const wsUrl = `${wsBaseUrl}/ws/?token=${token}`;
    
    console.log('🔌 Connecting to WebSocket...');

    try {
      const socket = new WebSocket(wsUrl);
      socket._intentional = false;
      wsRef.current = socket;

      connectionTimeoutRef.current = setTimeout(() => {
        if (socket.readyState !== WebSocket.OPEN) {
          console.log('WebSocket connection timeout');
          socket.close();
          isConnectingRef.current = false;
        }
      }, 3000);

      socket.onopen = () => {
        clearTimeout(connectionTimeoutRef.current);
        if (wsRef.current !== socket) return;
        console.log('✅ WebSocket connected successfully');
        console.log('WebSocket readyState:', socket.readyState);
        setIsConnected(true);
        setConnectionError(null);
        reconnectDelayRef.current = 1000;
        reconnectAttemptsRef.current = 0;
        isConnectingRef.current = false;
        
        socket.send(JSON.stringify({ type: 'ping' }));
        fetchInboxRef.current?.();
      };

      socket.onmessage = (event) => {
        if (wsRef.current !== socket) return;

        let payload;
        try {
          payload = JSON.parse(event.data);
        } catch {
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

        // Handle message sent confirmation from server
        if (payload.type === 'message_sent') {
          console.log('✅ Message confirmed by server:', payload.data);
          const msgData = payload.data;
          
          setMessages(prev => prev.map(msg => {
            // Find the temp message by content and sender
            if (typeof msg.id === 'string' && 
                msg.id.startsWith('temp-') && 
                msg.content === msgData.content &&
                msg.sender === msgData.sender_id) {
              return {
                ...msg,
                id: msgData.id,
                status: 'sent',
                timestamp: msgData.timestamp,
              };
            }
            return msg;
          }));
          return;
        }

        // Handle chat messages from other users
        if (payload.type === 'chat_message') {
          const messageId = payload.id || `msg-${payload.timestamp}`;
          if (messageDedupRef.current.has(messageId)) {
            console.log('Duplicate message ignored:', messageId);
            return;
          }
          messageDedupRef.current.add(messageId);
          
          if (messageDedupRef.current.size > 1000) {
            messageDedupRef.current.clear();
          }

          const newMsg = {
            id: messageId,
            sender: payload.sender_id,
            recipient: payload.recipient_id,
            content: payload.content,
            timestamp: payload.timestamp || new Date().toISOString(),
            is_read: payload.is_read || false,
          };

          setMessages(prev => {
            if (prev.some(m => m.id === messageId)) return prev;

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

          fetchInboxRef.current?.();
          window.dispatchEvent(new CustomEvent('chatMessageReceived', { detail: payload }));
          return;
        }

        // Handle notifications
        if (payload.type === 'notification') {
          window.dispatchEvent(new CustomEvent('newNotification', { detail: payload }));
          return;
        }

        // Handle errors
        if (payload.type === 'error') {
          console.error('WebSocket error message:', payload.message);
          setConnectionError(payload.message);
          window.dispatchEvent(new CustomEvent('chatError', { detail: payload }));
          
          // Mark the message as failed if it was a contact info block
          if (payload.code === 'contact_info_blocked') {
            setMessages(prev => prev.map(msg => {
              if (typeof msg.id === 'string' && msg.id.startsWith('temp-')) {
                return { ...msg, status: 'failed' };
              }
              return msg;
            }));
          }
          return;
        }

        // Handle connection established
        if (payload.type === 'connection_established') {
          console.log('Connection established:', payload);
          return;
        }
      };

      socket.onclose = (event) => {
        clearTimeout(connectionTimeoutRef.current);
        console.log(`WebSocket closed: ${event.code}`);
        isConnectingRef.current = false;
        
        if (socket._intentional) {
          console.log('Intentional close, not reconnecting');
          return;
        }

        if (wsRef.current === socket) {
          wsRef.current = null;
          setIsConnected(false);
        }

        if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          console.log('Max reconnection attempts reached');
          setConnectionError('Unable to connect to chat server');
          return;
        }

        const delay = reconnectDelayRef.current;
        reconnectDelayRef.current = Math.min(delay * 1.5, 10000);
        reconnectAttemptsRef.current += 1;

        console.log(`Reconnecting in ${delay}ms...`);
        
        if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = setTimeout(() => {
          if (api.getToken()) {
            connectWs();
          }
        }, delay);
      };

      socket.onerror = (error) => {
        clearTimeout(connectionTimeoutRef.current);
        console.error('WebSocket error:', error);
        isConnectingRef.current = false;
      };

    } catch (error) {
      console.error('Error creating WebSocket:', error);
      setConnectionError('Failed to create WebSocket connection');
      isConnectingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (isInitialized) return;
    
    const token = api.getToken();
    if (token) {
      const timer = setTimeout(() => {
        connectWs();
        fetchInbox();
        setIsInitialized(true);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [connectWs, fetchInbox, isInitialized]);

  useEffect(() => {
    const handleAuthChange = () => {
      console.log('Auth state changed, reconnecting WebSocket...');
      reconnectAttemptsRef.current = 0;
      reconnectDelayRef.current = 1000;
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
        fetchInbox();
      }
    };

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
      if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current._intentional = true;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connectWs, fetchInbox]);

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
        
        // Add optimistic message to UI
        const tempId = `temp-${Date.now()}`;
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const optimisticMessage = {
          id: tempId,
          sender: user.id,
          recipient: recipientId,
          content: content.trim(),
          timestamp: new Date().toISOString(),
          status: 'sending',
        };
        
        setMessages(prev => {
          // Prevent duplicate optimistic messages
          if (prev.some(m => 
            m.content === optimisticMessage.content && 
            m.sender === optimisticMessage.sender &&
            m.id.startsWith('temp-')
          )) {
            return prev;
          }
          return [...prev, optimisticMessage];
        });
        
        // Set a timeout to mark as failed if no confirmation received
        setTimeout(() => {
          setMessages(prev => prev.map(msg => {
            if (msg.id === tempId && msg.status === 'sending') {
              console.log('⏰ Message timeout, marking as failed');
              return { ...msg, status: 'failed' };
            }
            return msg;
          }));
        }, 10000);
        
        return true;
      } catch (error) {
        console.error('Error sending message:', error);
        setConnectionError('Failed to send message');
        return false;
      }
    } else {
      console.warn('❌ WebSocket not connected. ReadyState:', ws?.readyState);
      setConnectionError('Not connected to chat server');
      connectWs();
      return false;
    }
  }, [connectWs, setMessages]);

  const startChat = useCallback(async (userId) => {
    if (!userId) {
      console.warn('Cannot start chat: missing userId');
      return;
    }
    
    setActiveChatId(userId);
    setMessages([]);
    messageDedupRef.current.clear();
    
    try {
      const response = await api.getChatHistory(userId);
      if (!response.error && response.data) {
        setMessages(response.data);
        console.log(`📨 Loaded ${response.data.length} messages for chat with user ${userId}`);
      }
      
      fetchInbox();
      
      try {
        await api.markChatRead(userId);
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
      
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  }, [fetchInbox]);

  const markAsRead = useCallback(async (userId) => {
    if (!userId) return;
    try {
      await api.markChatRead(userId);
      setMessages(prev => prev.map(msg => 
        msg.sender === userId ? { ...msg, is_read: true } : msg
      ));
      fetchInbox();
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [fetchInbox]);

  const unreadCount = useMemo(
    () => inbox.reduce((sum, item) => sum + (item.unread_count || 0), 0),
    [inbox],
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    messageDedupRef.current.clear();
  }, []);

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
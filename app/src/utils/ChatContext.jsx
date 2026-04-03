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

  const wsRef = useRef(null);
  const reconnectDelayRef = useRef(2000);
  const reconnectTimerRef = useRef(null);
  // Stable ref so connectWs never needs fetchInbox as a dep
  const fetchInboxRef = useRef(null);

  const fetchInbox = useCallback(async () => {
    if (!api.getToken()) return;
    const r = await api.getChatInbox();
    if (!r.error && r.data) setInbox(r.data);
  }, []);

  // Keep the ref current without re-creating connectWs
  useEffect(() => { fetchInboxRef.current = fetchInbox; }, [fetchInbox]);

  const connectWs = useCallback(() => {
    if (!api.getToken()) return;

    const ws = wsRef.current;
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    // Tear down any stale socket
    if (ws) {
      ws._intentional = true;
      ws.close();
      wsRef.current = null;
    }

    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    const wsUrl = API_BASE_URL.replace('http', 'ws').replace('/api', '') + '/ws/';
    const socket = new WebSocket(`${wsUrl}?token=${api.getToken()}`);
    socket._intentional = false;
    wsRef.current = socket;

    socket.onopen = () => {
      if (wsRef.current !== socket) return;
      setIsConnected(true);
      reconnectDelayRef.current = 2000;
    };

    socket.onmessage = (event) => {
      if (wsRef.current !== socket) return;

      let payload;
      try {
        payload = JSON.parse(event.data);
      } catch {
        return;
      }

      // Server-side keepalive — no UI action needed
      if (payload.type === 'ping') {
        socket.send(JSON.stringify({ type: 'pong' }));
        return;
      }
      if (payload.type === 'pong') return;

      if (payload.type === 'chat_message') {
        const newMsg = {
          id: payload.id,
          sender: payload.sender_id,
          recipient: payload.recipient_id,
          content: payload.content,
          timestamp: payload.timestamp,
        };

        setMessages(prev => {
          // Deduplicate confirmed messages
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

        fetchInboxRef.current?.();
        window.dispatchEvent(new CustomEvent('chatMessageReceived', { detail: payload }));
      } else if (payload.type === 'notification') {
        window.dispatchEvent(new CustomEvent('newNotification', { detail: payload }));
      }
    };

    socket.onclose = (event) => {
      if (socket._intentional) return;

      if (wsRef.current === socket) {
        wsRef.current = null;
        setIsConnected(false);
      }

      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);

      const delay = reconnectDelayRef.current;
      reconnectDelayRef.current = Math.min(delay * 1.5, 30_000);

      reconnectTimerRef.current = setTimeout(() => {
        if (api.getToken()) connectWs();
      }, delay);
    };

    socket.onerror = () => {
      // onclose fires after onerror — reconnect logic lives there
    };
  }, []); // No deps — fetchInbox accessed via ref

  useEffect(() => {
    if (api.getToken()) {
      connectWs();
      fetchInbox();
    }

    const handleAuth = () => {
      reconnectDelayRef.current = 2000;
      connectWs();
      fetchInbox();
    };

    window.addEventListener('authStateChanged', handleAuth);
    return () => {
      window.removeEventListener('authStateChanged', handleAuth);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current._intentional = true;
        wsRef.current.close();
      }
    };
  }, [connectWs, fetchInbox]);

  const sendMessage = useCallback((recipientId, content) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'chat_message',
        recipient_id: recipientId,
        content,
      }));
    } else {
      console.warn('[WS] Not connected — message dropped.');
    }
  }, []);

  const startChat = useCallback((userId) => setActiveChatId(userId), []);

  const unreadCount = useMemo(
    () => inbox.reduce((sum, item) => sum + (item.unread_count || 0), 0),
    [inbox],
  );

  const value = useMemo(() => ({
    messages, setMessages,
    inbox, fetchInbox,
    activeChatId, setActiveChatId,
    sendMessage, isConnected,
    startChat, unreadCount,
  }), [messages, inbox, activeChatId, isConnected, fetchInbox, sendMessage, startChat, unreadCount]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export const useChat = () => useContext(ChatContext);
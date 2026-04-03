import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import api from './api';

const ChatContext = createContext();

export function ChatProvider({ children }) {
  const [messages, setMessages] = useState([]);
  const [inbox, setInbox] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);

  const connectWs = useCallback(() => {
    const token = api.getToken();
    if (!token) {
        console.log("No token available for WS");
        return;
    }

    if (wsRef.current) {
        wsRef.current.close();
    }

    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    const wsUrl = API_BASE_URL.replace('http', 'ws').replace('/api', '') + '/ws/';
    
    console.log("Connecting WS to", wsUrl);
    const socket = new WebSocket(`${wsUrl}?token=${token}`);

    socket.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    };

    socket.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      console.log("WS received", payload);
      if (payload.type === 'chat_message') {
        const newMsg = {
           id: payload.id, 
           sender: payload.sender_id,
           recipient: payload.recipient_id,
           content: payload.content,
           timestamp: payload.timestamp
        };
        
        setMessages(prev => {
            // Remove duplicates
            if (prev.find(m => m.id === payload.id)) return prev;
            return [...prev, newMsg];
        });
        
        // Refresh inbox
        fetchInbox();

        // Dispatch an event
        window.dispatchEvent(new CustomEvent('chatMessageReceived', { detail: payload }));
        
      } else if (payload.type === 'notification') {
        window.dispatchEvent(new CustomEvent('newNotification', { detail: payload }));
      }
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      setTimeout(connectWs, 3000);
    };

    wsRef.current = socket;
  }, []);

  const fetchInbox = async () => {
      const r = await api.getChatInbox();
      if (!r.error && r.data) {
          setInbox(r.data);
      }
  };

  useEffect(() => {
    connectWs();
    fetchInbox();
    
    const handleAuth = () => {
        connectWs();
        fetchInbox();
    };
    
    window.addEventListener('authStateChanged', handleAuth);
    return () => {
      if (wsRef.current) wsRef.current.close();
      window.removeEventListener('authStateChanged', handleAuth);
    };
  }, [connectWs]);

  const sendMessage = useCallback((recipientId, content) => {
    if (wsRef.current && isConnected) {
       wsRef.current.send(JSON.stringify({
         type: 'chat_message',
         recipient_id: recipientId,
         content: content
       }));
    } else {
       console.warn("Cannot send message, WS not connected.");
    }
  }, [isConnected]);

  return (
    <ChatContext.Provider value={{ messages, setMessages, inbox, fetchInbox, activeChatId, setActiveChatId, sendMessage, isConnected }}>
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => useContext(ChatContext);

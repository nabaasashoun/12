import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../../utils/ChatContext';
import api from '../../utils/api';

const ChatPage = () => {
  const { messages, setMessages, inbox, fetchInbox, activeChatId, setActiveChatId, sendMessage, isConnected } = useChat();
  const [inputText, setInputText] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
  }, []);

  useEffect(() => {
    if (activeChatId) {
      api.getChatHistory(activeChatId).then(r => {
        if (!r.error && r.data) {
          setMessages(r.data);
          fetchInbox(); // refresh unread counts
        }
      });
    }
  }, [activeChatId, setMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChatId) return;
    sendMessage(activeChatId, inputText);
    
    // Add optimistically
    const optMsg = {
        id: 'temp-' + Date.now(),
        sender: currentUser?.id,
        recipient: activeChatId,
        content: inputText,
        timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, optMsg]);
    setInputText('');
  };

  const currentChatPartner = inbox.find(c => c.partner_id === activeChatId)?.partner_name || 'Chat';

  return (
    <div className="flex h-[calc(100vh-64px)] bg-white overflow-hidden">
      {/* Sidebar Inbox */}
      <div className="w-1/3 border-r flex flex-col">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
          <h2 className="text-xl font-bold">Messages</h2>
          <div className="text-sm">
             {isConnected ? <span className="text-green-500">● Online</span> : <span className="text-red-500">● Reconnecting...</span>}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {inbox.map(conv => (
            <div 
              key={conv.partner_id}
              onClick={() => setActiveChatId(conv.partner_id)}
              className={`p-4 border-b cursor-pointer hover:bg-gray-100 ${activeChatId === conv.partner_id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
            >
              <div className="flex justify-between items-center">
                <span className="font-semibold">{conv.partner_name}</span>
                {conv.unread_count > 0 && (
                  <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                    {conv.unread_count}
                  </span>
                )}
              </div>
              <p className="text-gray-500 text-sm truncate mt-1">{conv.last_message}</p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(conv.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          ))}
          {inbox.length === 0 && (
            <div className="p-4 text-center text-gray-500">No messages yet.</div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="w-2/3 flex flex-col">
        {activeChatId ? (
          <>
            <div className="p-4 border-b bg-gray-50 font-bold text-lg">
              {currentChatPartner}
            </div>
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-2">
              {messages.map((msg, idx) => {
                const isMe = msg.sender === currentUser?.id;
                // Simple deduplication based on UI array rendering handled by React keys properly
                return (
                  <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${isMe ? 'bg-blue-500 text-white rounded-br-none' : 'bg-white border rounded-bl-none shadow-sm'}`}>
                      <p>{msg.content}</p>
                      <p className={`text-xs mt-1 ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 bg-white border-t">
              <form onSubmit={handleSend} className="flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:border-blue-500"
                />
                <button 
                  type="submit"
                  disabled={!inputText.trim() || !isConnected}
                  className="bg-blue-500 text-white rounded-full px-6 py-2 font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;

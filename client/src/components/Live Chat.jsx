// components/LiveChat.jsx
import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import './LiveChat.css';

const LiveChat = ({ user }) => {
  const [socket, setSocket] = useState(null);
  
  useEffect(() => {
    const newSocket = io('YOUR_BACKEND_URL');
    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('message', (message) => {
        setMessages(prev => [...prev, message]);
      });
    }
  }, [socket]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newMessage.trim() && socket) {
      const messageData = {
        id: Date.now(),
        text: newMessage,
        user: user.email,
        timestamp: new Date().toLocaleTimeString()
      };
      socket.emit('message', messageData);
      setNewMessage('');
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>Live Chat</h2>
        <span className="online-status">Online</span>
      </div>
      
      <div className="messages-container">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`message ${message.user === user.email ? 'sent' : 'received'}`}
          >
            <div className="message-content">
              <p>{message.text}</p>
              <span className="message-info">
                {message.user} • {message.timestamp}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="chat-input-form">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="chat-input"
        />
        <button type="submit" className="send-button">
          Send
        </button>
      </form>
    </div>
  );
};

export default LiveChat;

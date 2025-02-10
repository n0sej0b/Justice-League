import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import './LiveChat.css';

const LiveChat = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const messagesEndRef = useRef(null);
  const { user, isLoggedIn } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!isLoggedIn || !user) return;

    // Connect to the chat server
    const newSocket = io('http://localhost:4000', {
      auth: {
        token: localStorage.getItem('token'),
        username: user.username
      }
    });

    // Connection events
    newSocket.on('connect', () => {
      console.log('Connected to chat server');
      setIsConnected(true);
      // Join the main chat room
      newSocket.emit('join_chat', { 
        userId: user.id,
        username: user.username 
      });
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from chat server');
      setIsConnected(false);
    });

    // Message handling
    newSocket.on('chat_message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    // Load chat history
    newSocket.on('chat_history', (history) => {
      setMessages(history);
    });

    // Online users handling
    newSocket.on('user_joined', (userData) => {
      setOnlineUsers(prev => new Set([...prev, userData.username]));
      setMessages(prev => [...prev, {
        type: 'system',
        text: `${userData.username} joined the chat`,
        timestamp: new Date().toISOString()
      }]);
    });

    newSocket.on('user_left', (userData) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userData.username);
        return newSet;
      });
      setMessages(prev => [...prev, {
        type: 'system',
        text: `${userData.username} left the chat`,
        timestamp: new Date().toISOString()
      }]);
    });

    newSocket.on('online_users', (users) => {
      setOnlineUsers(new Set(users.map(u => u.username)));
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [isLoggedIn, user]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newMessage.trim() && socket && user) {
      const messageData = {
        type: 'user',
        id: crypto.randomUUID(),
        text: newMessage,
        user: {
          id: user.id,
          username: user.username
        },
        timestamp: new Date().toISOString()
      };

      socket.emit('chat_message', messageData);
      setNewMessage('');
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="chat-container">
        <div className="chat-login-message">
          Please log in to join the chat room.
        </div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="chat-header-main">
          <h2>Community Chat Room</h2>
          <span className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        <div className="online-users">
          <span className="online-count">
            {onlineUsers.size} online
          </span>
        </div>
      </div>

      <div className="chat-body">
        <div className="messages-container">
          {messages.map((message) => (
            <div 
              key={message.id || message.timestamp} 
              className={`message ${
                message.type === 'system' 
                  ? 'system-message' 
                  : message.user?.id === user.id 
                    ? 'sent' 
                    : 'received'
              }`}
            >
              {message.type === 'system' ? (
                <div className="system-message-content">
                  <p>{message.text}</p>
                  <span className="timestamp">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ) : (
                <div className="message-content">
                  <div className="message-header">
                    <span className="username">{message.user.username}</span>
                    <span className="timestamp">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p>{message.text}</p>
                </div>
              )}
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
            disabled={!isConnected}
            maxLength={500}
          />
          <button 
            type="submit" 
            className="send-button"
            disabled={!isConnected || !newMessage.trim()}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default LiveChat;

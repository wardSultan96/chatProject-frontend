import React, { useState, useRef, useEffect } from 'react';
import { Send, Hash, MessageCircle, Users, UserPlus } from 'lucide-react';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import MessageList from './MessageList';
import JoinRoomModal from './JoinRoomModal';

export default function ChatArea() {
  const { user } = useAuth();
  const {
    activeRoom,
    activeConversation,
    sendMessage,
    sendDirectMessage,
    connected,
  } = useSocket();
  
  const [messageInput, setMessageInput] = useState('');
  const [showJoinRoom, setShowJoinRoom] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageInput.trim() || !connected) return;

    if (activeRoom) {
      sendMessage(activeRoom._id, messageInput);
    } else if (activeConversation) {
      sendDirectMessage(activeConversation.otherUser._id, messageInput);
    }

    setMessageInput('');
  };

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [activeRoom, activeConversation]);

  if (!activeRoom && !activeConversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">Welcome to Chat</h3>
          <p className="text-gray-500 mb-6">Select a room or conversation to start chatting</p>
          
          <div className="space-y-3">
            <Button
              onClick={() => setShowJoinRoom(true)}
              icon={<UserPlus className="w-4 h-4" />}
              className="w-full"
            >
              Join a Room
            </Button>
          </div>
        </div>
        
        {showJoinRoom && (
          <JoinRoomModal onClose={() => setShowJoinRoom(false)} />
        )}
      </div>
    );
  }

  const currentChat = activeRoom || activeConversation;
  const isRoom = !!activeRoom;
  const messages = isRoom ? activeRoom.messages : activeConversation?.messages || [];

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {isRoom ? (
              <>
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Hash className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{activeRoom.name}</h2>
                  {activeRoom.description && (
                    <p className="text-sm text-gray-500">{activeRoom.description}</p>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">
                    {activeConversation?.otherUser.displayName?.[0] || activeConversation?.otherUser.username[0]}
                  </span>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {activeConversation?.otherUser.displayName || activeConversation?.otherUser.username}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {activeConversation?.otherUser.isOnline ? 'Online' : 'Offline'}
                  </p>
                </div>
              </>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            {isRoom && (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Users className="w-4 h-4" />
                <span>{activeRoom.onlineUsers.length} online</span>
              </div>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowJoinRoom(true)}
              icon={<UserPlus className="w-4 h-4" />}
            >
              Join Room
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <MessageList 
          messages={messages} 
          currentUserId={user?.id || ''} 
          roomId={isRoom ? activeRoom._id : undefined}
        />
      </div>

      {/* Message Input */}
      <div className="px-6 py-4 border-t border-gray-200 bg-white">
        <form onSubmit={handleSendMessage} className="flex space-x-3">
          <input
            ref={inputRef}
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder={`Message ${isRoom ? `#${activeRoom.name}` : activeConversation?.otherUser.username}...`}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            disabled={!connected}
          />
          <Button
            type="submit"
            disabled={!messageInput.trim() || !connected}
            icon={<Send className="w-4 h-4" />}
          >
            Send
          </Button>
        </form>
        
        {!connected && (
          <p className="text-sm text-red-500 mt-2">Disconnected from server. Reconnecting...</p>
        )}
      </div>

      {/* Join Room Modal */}
      {showJoinRoom && (
        <JoinRoomModal onClose={() => setShowJoinRoom(false)} />
      )}
    </div>
  );
}
import React, { useState } from 'react';
import { Hash, MessageCircle, Users, Search } from 'lucide-react';
import { useSocket } from '../../contexts/SocketContext';
import Input from '../ui/Input';

export default function Sidebar() {
  const {
    rooms,
    directConversations,
    activeRoom,
    activeConversation,
    setActiveRoom,
    setActiveConversation,
    joinRoom,
  } = useSocket();
  
  const [activeTab, setActiveTab] = useState<'rooms' | 'messages'>('rooms');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredConversations = directConversations.filter(conv =>
    conv.otherUser?.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.otherUser?.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRoomClick = (room: any) => {
    setActiveConversation(null);
    //  setActiveRoom(room);
    joinRoom(room._id);
  };

  const handleConversationClick = (conversation: any) => {
    setActiveRoom(null);
    setActiveConversation(conversation);
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Search */}
      <div className="p-4 border-b border-gray-200">
        <Input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          icon={<Search className="w-4 h-4" />}
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('rooms')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'rooms'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Hash className="w-4 h-4 inline mr-2" />
          Rooms
        </button>
        <button
          onClick={() => setActiveTab('messages')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'messages'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <MessageCircle className="w-4 h-4 inline mr-2" />
          Messages
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'rooms' ? (
          <div className="p-2">
            {filteredRooms.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Hash className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No rooms found</p>
              </div>
            ) : (
              filteredRooms.map((room) => (
                <button
                  key={room._id}
                  onClick={() => handleRoomClick(room)}
                  className={`w-full p-3 rounded-lg text-left transition-colors mb-1 ${
                    activeRoom?._id === room._id
                      ? 'bg-blue-100 text-blue-900'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Hash className="w-5 h-5 text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{room.name}</p>
                      {room.description && (
                        <p className="text-sm text-gray-500 truncate">{room.description}</p>
                      )}
                      <div className="flex items-center space-x-2 mt-1">
                        <Users className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {room.onlineUsers.length} online
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        ) : (
          <div className="p-2">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No conversations yet</p>
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <button
                  key={conversation.otherUser._id}
                  onClick={() => handleConversationClick(conversation)}
                  className={`w-full p-3 rounded-lg text-left transition-colors mb-1 ${
                    activeConversation?.otherUser._id === conversation.otherUser._id
                      ? 'bg-blue-100 text-blue-900'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold">
                          {conversation.otherUser?.displayName?.[0] || conversation.otherUser?.username[0]}
                        </span>
                      </div>
                      {conversation.otherUser.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium truncate">
                          {conversation.otherUser?.displayName || conversation.otherUser?.username}
                        </p>
                        {conversation.unreadCount > 0 && (
                          <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                      {conversation.lastMessage && (
                        <p className="text-sm text-gray-500 truncate">
                          {conversation.lastMessage.content}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
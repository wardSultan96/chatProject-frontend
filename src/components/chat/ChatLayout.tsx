import React, { useState } from 'react';
import { LogOut, Plus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import Sidebar from './Sidebar';
import ChatArea from './ChatArea';
import CreateRoomModal from './CreateRoomModal';
import Button from '../ui/Button';

export default function ChatLayout() {
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  const [showCreateRoom, setShowCreateRoom] = useState(false);

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-lg">
                  {user?.displayName?.[0] || user?.username?.[0] || 'U'}
                </span>
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">{user?.displayName || user?.username}</h2>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-xs text-gray-500">
                    {connected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateRoom(true)}
                icon={<Plus className="w-4 h-4" />}
              >
                Room
              </Button>
              <Button
                              variant="ghost"
                              size="sm"
                              onClick={logout}
                              icon={<LogOut className="w-4 h-4" />} children={''}              />
            </div>
          </div>
        </div>

        {/* Sidebar Content */}
        <Sidebar />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <ChatArea />
      </div>

      {/* Create Room Modal */}
      {showCreateRoom && (
        <CreateRoomModal onClose={() => setShowCreateRoom(false)} />
      )}
    </div>
  );
}
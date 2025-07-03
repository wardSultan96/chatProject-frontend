import React, { useState, useEffect } from 'react';
import { X, Hash, Search, Users, Lock } from 'lucide-react';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import LoadingSpinner from '../ui/LoadingSpinner';
import axiosInstance from 'src/api/api';

interface Room {
  _id: string;
  name: string;
  description?: string;
  isPrivate: boolean;
  members: string[];
  createdBy: {
    username: string;
    displayName?: string;
  };
}

interface JoinRoomModalProps {
  onClose: () => void;
}

export default function JoinRoomModal({ onClose }: JoinRoomModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningRoom, setJoiningRoom] = useState<string | null>(null);
  const { joinRoom, setActiveRoom } = useSocket();
  const { token } = useAuth();

  useEffect(() => {
    fetchAvailableRooms();
  }, []);

const fetchAvailableRooms = async () => {
  try {
    const { data: rooms } = await axiosInstance.get('/rooms');
    setAvailableRooms(rooms);
  } catch (error) {
    console.error('Failed to fetch rooms:', error);
  } finally {
    setLoading(false);
  }
};
const handleJoinRoom = async (room: Room) => {
  setJoiningRoom(room._id);

  try {
    await axiosInstance.post(`/rooms/${room._id}/join`);

    // Join via WebSocket
    joinRoom(room._id);

    // Set as active room
    setActiveRoom({
      ...room,
      messages: [],
      onlineUsers: [],
    });

    onClose();
  } catch (error) {
    console.error('Failed to join room:', error);
  } finally {
    setJoiningRoom(null);
  }
};
  const filteredRooms = availableRooms.filter(room =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Join a Room</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 border-b border-gray-200">
          <Input
            type="text"
            placeholder="Search rooms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="w-5 h-5" />}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Hash className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No rooms found</p>
              <p>Try adjusting your search or create a new room</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRooms.map((room) => (
                <div
                  key={room._id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                          <Hash className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {room.name}
                            </h3>
                            {room.isPrivate && (
                              <Lock className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                          <p className="text-sm text-gray-500">
                            Created by {room.createdBy.displayName || room.createdBy.username}
                          </p>
                        </div>
                      </div>
                      
                      {room.description && (
                        <p className="text-sm text-gray-600 mb-3">{room.description}</p>
                      )}
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>{room.members.length} members</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      <Button
                        onClick={() => handleJoinRoom(room)}
                        loading={joiningRoom === room._id}
                        disabled={joiningRoom !== null}
                        size="sm"
                      >
                        Join
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200">
          <Button
            variant="secondary"
            onClick={onClose}
            className="w-full"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
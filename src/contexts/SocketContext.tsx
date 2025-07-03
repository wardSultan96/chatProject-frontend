import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { API_BASE_URL } from '../config/config';
import axiosInstance from '../api/api';
interface Message {
    _id: string;
    content: string;
    senderId: {
        _id: string;
        username: string;
        displayName?: string;
    };
    receiverId?: {
        _id: string;
        username: string;
        displayName?: string;
    };
    roomId?: string;
    type: string;
    createdAt: string;
}

interface Room {
    _id: string;
    name: string;
    description?: string;
    isPrivate: boolean;
    members: string[];
    onlineUsers: string[];
    messages: Message[];
}

interface DirectConversation {
    otherUser: {
        _id: string;
        username: string;
        displayName?: string;
        avatar?: string;
        isOnline: boolean;
    };
    lastMessage: Message;
    unreadCount: number;
    messages: Message[];
}

interface SocketContextType {
    socket: Socket | null;
    connected: boolean;
    rooms: Room[];
    activeRoom: Room | null;
    directConversations: DirectConversation[];
    activeConversation: DirectConversation | null;
    onlineUsers: string[];
    joinRoom: (roomId: string) => void;
    leaveRoom: (roomId: string) => void;
    sendMessage: (roomId: string, content: string) => void;
    sendDirectMessage: (receiverId: string, content: string) => void;
    setActiveRoom: (room: Room | null) => void;
    setActiveConversation: (conversation: DirectConversation | null) => void;
    loadOlderMessages: (roomId: string, lastMessageId: string) => Promise<void>;
    createRoom: (name: string, description?: string, isPrivate?: boolean) => void;
    fetchRooms: () => void;
    fetchDirectConversations: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
    const { token, user } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [connected, setConnected] = useState(false);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [activeRoom, setActiveRoom] = useState<Room | null>(null);
    const [directConversations, setDirectConversations] = useState<DirectConversation[]>([]);
    const [activeConversation, setActiveConversation] = useState<DirectConversation | null>(null);
    const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

    useEffect(() => {
        if (token && user) {
            const newSocket = io(API_BASE_URL, {
                auth: { token },
            });

            newSocket.on('connect', () => {
                setConnected(true);
                console.log('Connected to server');
            });

            newSocket.on('disconnect', () => {
                setConnected(false);
                console.log('Disconnected from server');
            });

            newSocket.on('connected', (data) => {
                console.log('Server confirmed connection:', data);
            });

            newSocket.on('joinedRoom', (data) => {
                setRooms(prev => {
                    const updated = prev.map(room =>
                        room._id === data.roomId
                            ? { ...room, messages: data.messages, onlineUsers: data.onlineUsers }
                            : room
                    );

                    const joined = updated.find(room => room._id === data.roomId);
                    if (joined) {
                        setActiveRoom(joined); // ← نحدثها بعد ما تصير جاهزة من الرد
                    }

                    return updated;
                });
            });

            newSocket.on('newMessage', (message) => {
                setRooms(prevRooms => {
                    const updatedRooms = prevRooms.map(room => {
                        if (room._id === message.roomId) {
                            // نتأكد من عدم التكرار
                            const alreadyExists = room.messages.some(msg => msg._id === message._id);
                            if (alreadyExists) return room;

                            const updatedMessages = [...room.messages, message];
                            const updatedRoom = { ...room, messages: updatedMessages };

                            // تحديث activeRoom إذا كانت هذه الغرفة نشطة
                            setActiveRoom(prev => prev && prev._id === room._id ? updatedRoom : prev);

                            return updatedRoom;
                        }
                        return room;
                    });

                    return updatedRooms;
                });

            });

            newSocket.on('olderMessages', (data) => {
                const { roomId, messages: olderMessages, hasMore } = data;

                setRooms(prev => prev.map(room =>
                    room._id === roomId
                        ? { ...room, messages: [...olderMessages, ...room.messages] }
                        : room
                ));

                if (activeRoom?._id === roomId) {
                    setActiveRoom(prev => prev ? {
                        ...prev,
                        messages: [...olderMessages, ...prev.messages]
                    } : null);
                }
            });

            newSocket.on('newDirectMessage', (message) => {
                const otherUserId = message.senderId._id === user.id ? message.receiverId._id : message.senderId._id;

                setDirectConversations(prev => prev.map(conv =>
                    conv.otherUser._id === otherUserId
                        ? { ...conv, messages: [...conv.messages, message], lastMessage: message }
                        : conv
                ));

                if (activeConversation?.otherUser._id === otherUserId) {
                    setActiveConversation(prev => prev ? { ...prev, messages: [...prev.messages, message] } : null);
                }
            });

            newSocket.on('userJoined', (data) => {
                setRooms(prev => prev.map(room =>
                    room._id === data.roomId
                        ? { ...room, onlineUsers: data.onlineUsers }
                        : room
                ));

                if (activeRoom?._id === data.roomId) {
                    setActiveRoom(prev => prev ? { ...prev, onlineUsers: data.onlineUsers } : null);
                }
            });

            newSocket.on('userLeft', (data) => {
                setRooms(prev => prev.map(room =>
                    room._id === data.roomId
                        ? { ...room, onlineUsers: data.onlineUsers }
                        : room
                ));

                if (activeRoom?._id === data.roomId) {
                    setActiveRoom(prev => prev ? { ...prev, onlineUsers: data.onlineUsers } : null);
                }
            });

            newSocket.on('error', (error) => {
                console.error('Socket error:', error);
            });

            setSocket(newSocket);

            return () => {
                newSocket.close();
            };
        }
    }, [token, user]);

    const joinRoom = (roomId: string) => {
        if (socket) {
            socket.emit('joinRoom', { roomId });
        }
    };

    const leaveRoom = (roomId: string) => {
        if (socket) {
            socket.emit('leaveRoom', { roomId });
        }
    };

    const sendMessage = (roomId: string, content: string) => {
        if (socket && content.trim()) {
            socket.emit('sendMessage', { roomId, content: content.trim() });
        }
    };

    const sendDirectMessage = (receiverId: string, content: string) => {
        if (socket && content.trim()) {
            socket.emit('sendDirectMessage', { receiverId, content: content.trim() });
        }
    };

    const loadOlderMessages = async (roomId: string, lastMessageId: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            if (!socket) {
                reject(new Error('Socket not connected'));
                return;
            }

            const timeout = setTimeout(() => {
                reject(new Error('Request timeout'));
            }, 10000);

            const handleOlderMessages = (data: any) => {
                if (data.roomId === roomId) {
                    clearTimeout(timeout);
                    socket.off('olderMessages', handleOlderMessages);
                    resolve();
                }
            };

            socket.on('olderMessages', handleOlderMessages);
            socket.emit('loadOlderMessages', { roomId, lastMessageId, limit: 20 });
        });
    };

    const createRoom = async (name: string, description?: string, isPrivate?: boolean) => {
        try {
            await axiosInstance.post('/rooms', {
                name,
                description,
                isPrivate,
            });
            fetchRooms();
        } catch (error) {
            console.error('Failed to create room:', error);
        }
    };

    const fetchRooms = async () => {
        try {
            const { data } = await axiosInstance.get('/rooms/my-rooms');
            setRooms(data.map((room: any) => ({ ...room, messages: [], onlineUsers: [] })));
        } catch (error) {
            console.error('Failed to fetch rooms:', error);
        }
    };

    const fetchDirectConversations = async () => {
        try {
            const { data } = await axiosInstance.get('/messages/conversations');
            setDirectConversations(data.map((conv: any) => ({ ...conv, messages: [] })));
        } catch (error) {
            console.error('Failed to fetch conversations:', error);
        }
    };


    useEffect(() => {
        if (connected) {
            fetchRooms();
            fetchDirectConversations();
        }
    }, [connected]);

    return (
        <SocketContext.Provider value={{
            socket,
            connected,
            rooms,
            activeRoom,
            directConversations,
            activeConversation,
            onlineUsers,
            joinRoom,
            leaveRoom,
            sendMessage,
            sendDirectMessage,
            setActiveRoom,
            setActiveConversation,
            loadOlderMessages,
            createRoom,
            fetchRooms,
            fetchDirectConversations,
        }}>
            {children}
        </SocketContext.Provider>
    );
}

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (context === undefined) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};
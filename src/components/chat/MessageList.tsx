import React, { useEffect, useRef, useState, useCallback } from 'react';
import {  format, isToday, isYesterday } from 'date-fns';
import { ChevronUp, Loader2 } from 'lucide-react';
import { useSocket } from '../../contexts/SocketContext';

interface Message {
  _id: string;
  content: string;
  senderId: {
    _id: string;
    username: string;
    displayName?: string;
  };
  createdAt: string;
  type: string;
}

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  roomId?: string;
}

export default function MessageList({ messages, currentUserId, roomId }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isNearTop, setIsNearTop] = useState(false);
  const { loadOlderMessages, socket } = useSocket();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToTop = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = 0;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  // Handle scroll events for pagination
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isAtTop = scrollTop < 100;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 100;
    
    setIsNearTop(isAtTop);

    // Load older messages when scrolling near the top
    if (isAtTop && !isLoadingOlder && hasMoreMessages && roomId && messages.length > 0) {
      handleLoadOlderMessages();
    }
  }, [isLoadingOlder, hasMoreMessages, roomId, messages.length]);

  const handleLoadOlderMessages = useCallback(async () => {
    if (!roomId || messages.length === 0 || isLoadingOlder) return;

    setIsLoadingOlder(true);
    const oldestMessage = messages[0];
    
    try {
      await loadOlderMessages(roomId, oldestMessage._id);
    } catch (error) {
      console.error('Failed to load older messages:', error);
    } finally {
      setIsLoadingOlder(false);
    }
  }, [roomId, messages, isLoadingOlder, loadOlderMessages]);

  // Listen for older messages response
  useEffect(() => {
    if (!socket) return;

    const handleOlderMessages = (data: { roomId: string; messages: Message[]; hasMore: boolean }) => {
      if (data.roomId === roomId) {
        setHasMoreMessages(data.hasMore);
        setIsLoadingOlder(false);
      }
    };

    socket.on('olderMessages', handleOlderMessages);
    return () => {
      socket.off('olderMessages', handleOlderMessages);
    };
  }, [socket, roomId]);

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, 'HH:mm')}`;
    } else {
      return format(date, 'MMM d, HH:mm');
    }
  };

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {};
    
    messages.forEach(message => {
      const date = new Date(message.createdAt);
      let dateKey;
      
      if (isToday(date)) {
        dateKey = 'Today';
      } else if (isYesterday(date)) {
        dateKey = 'Yesterday';
      } else {
        dateKey = format(date, 'MMMM d, yyyy');
      }
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(message);
    });
    
    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <p>No messages yet. Start the conversation!</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col relative">
      {/* Load More Button */}
      {hasMoreMessages && messages.length > 0 && (
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-2">
          <button
            onClick={handleLoadOlderMessages}
            disabled={isLoadingOlder}
            className="w-full flex items-center justify-center space-x-2 py-2 px-4 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
          >
            {isLoadingOlder ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading older messages...</span>
              </>
            ) : (
              <>
                <ChevronUp className="w-4 h-4" />
                <span>Load older messages</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Messages Container */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-6 space-y-4"
        onScroll={handleScroll}
      >
        {/* Loading indicator at top */}
        {isLoadingOlder && (
          <div className="flex justify-center py-4">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        )}

        {Object.entries(messageGroups).map(([dateKey, dateMessages]) => (
          <div key={dateKey}>
            {/* Date Separator */}
            <div className="flex items-center justify-center my-6">
              <div className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
                {dateKey}
              </div>
            </div>
            
            {/* Messages for this date */}
            {dateMessages.map((message, index) => {
              const isOwnMessage = message.senderId._id === currentUserId;
              const showAvatar = index === 0 || dateMessages[index - 1].senderId._id !== message.senderId._id;
              const showName = showAvatar && !isOwnMessage;
              
              return (
                <div
                  key={message._id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} ${
                    showAvatar ? 'mt-4' : 'mt-1'
                  }`}
                >
                  <div className={`flex max-w-xs lg:max-w-md ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Avatar */}
                    {showAvatar && !isOwnMessage && (
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <span className="text-white text-sm font-semibold">
                          {message.senderId.displayName?.[0] || message.senderId.username[0]}
                        </span>
                      </div>
                    )}
                    
                    {/* Message Content */}
                    <div className={`${isOwnMessage ? 'mr-3' : showAvatar ? '' : 'ml-11'}`}>
                      {showName && (
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          {message.senderId.displayName || message.senderId.username}
                        </p>
                      )}
                      
                      <div
                        className={`px-4 py-2 rounded-2xl ${
                          isOwnMessage
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        } ${
                          showAvatar
                            ? isOwnMessage
                              ? 'rounded-br-md'
                              : 'rounded-bl-md'
                            : ''
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                      </div>
                      
                      <p className={`text-xs text-gray-500 mt-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                        {formatMessageTime(message.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {isNearTop && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 right-4 bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg transition-all duration-200 z-10"
        >
          <ChevronUp className="w-5 h-5 rotate-180" />
        </button>
      )}
    </div>
  );
}
import React, { useState, useEffect, useRef } from 'react';
import { Plus, Send, Reply, MessageCircle } from 'lucide-react';
import { Button, Card, Modal, Input, Avatar, Badge } from '../components';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const Collaboration = () => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomType, setNewRoomType] = useState('general');
  const [replyingTo, setReplyingTo] = useState(null);
  const messagesEndRef = useRef(null);

  const roomTypes = {
    department: { label: 'Department', color: '#4A90E2' },
    academic: { label: 'Academic', color: '#50C878' },
    event: { label: 'Event', color: '#FFB84D' },
    general: { label: 'General', color: '#9B59B6' },
  };

  // Fetch rooms on mount
  useEffect(() => {
    fetchRooms();
  }, []);

  // Fetch messages when room changes
  useEffect(() => {
    if (selectedRoom) {
      fetchMessages(selectedRoom.id);
    }
  }, [selectedRoom]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const data = await api.get('/collaboration/rooms');
      setRooms(data || []);
      if (data?.length > 0) {
        setSelectedRoom(data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (roomId) => {
    try {
      const data = await api.get(`/collaboration/rooms/${roomId}/messages`);
      setMessages(data || []);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) return;

    try {
      const newRoom = await api.post('/collaboration/rooms', {
        name: newRoomName,
        type: newRoomType,
      });
      setRooms([...rooms, newRoom]);
      setSelectedRoom(newRoom);
      setNewRoomName('');
      setNewRoomType('general');
      setShowCreateRoom(false);
    } catch (error) {
      console.error('Failed to create room:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedRoom) return;

    try {
      setSendingMessage(true);
      const newMessage = await api.post(`/collaboration/rooms/${selectedRoom.id}/messages`, {
        content: messageInput,
        parentMessageId: replyingTo?.id,
      });
      setMessages([...messages, newMessage]);
      setMessageInput('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const containerStyles = {
    display: 'flex',
    height: '100vh',
    backgroundColor: 'var(--color-background)',
    gap: '16px',
    padding: '16px',
  };

  const leftPanelStyles = {
    width: '300px',
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--border-radius)',
    border: '1px solid var(--color-border)',
    display: 'flex',
    flexDirection: 'column',
  };

  const headerStyles = {
    padding: '16px',
    borderBottom: '1px solid var(--color-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  };

  const titleStyles = {
    fontSize: '16px',
    fontWeight: 600,
    margin: 0,
    color: 'var(--color-text)',
  };

  const roomsListStyles = {
    flex: 1,
    overflow: 'auto',
    padding: '8px',
  };

  const roomItemStyles = (isSelected) => ({
    padding: '12px',
    marginBottom: '4px',
    borderRadius: 'var(--border-radius-sm)',
    cursor: 'pointer',
    transition: 'var(--transition)',
    backgroundColor: isSelected ? 'var(--color-primary)' : 'transparent',
    color: isSelected ? 'white' : 'var(--color-text)',
    border: '1px solid',
    borderColor: isSelected ? 'var(--color-primary)' : 'transparent',
  });

  const roomNameStyles = {
    fontSize: '14px',
    fontWeight: 600,
    marginBottom: '4px',
  };

  const badgeContainerStyles = {
    display: 'flex',
    gap: '4px',
    marginTop: '4px',
  };

  const rightPanelStyles = {
    flex: 1,
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--border-radius)',
    border: '1px solid var(--color-border)',
    display: 'flex',
    flexDirection: 'column',
  };

  const chatHeaderStyles = {
    padding: '16px',
    borderBottom: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-background)',
  };

  const chatTitleStyles = {
    fontSize: '18px',
    fontWeight: 600,
    margin: 0,
    color: 'var(--color-text)',
  };

  const messagesContainerStyles = {
    flex: 1,
    overflow: 'auto',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  };

  const messageStyles = (isOwn) => ({
    display: 'flex',
    gap: '8px',
    flexDirection: isOwn ? 'row-reverse' : 'row',
    marginBottom: '8px',
  });

  const messageBubbleStyles = (isOwn) => ({
    maxWidth: '60%',
    backgroundColor: isOwn ? 'var(--color-primary)' : 'var(--color-background)',
    color: isOwn ? 'white' : 'var(--color-text)',
    padding: '10px 14px',
    borderRadius: 'var(--border-radius-sm)',
    wordWrap: 'break-word',
  });

  const messageMetaStyles = {
    fontSize: '12px',
    color: 'var(--color-text-light)',
    marginTop: '4px',
  };

  const inputContainerStyles = {
    padding: '16px',
    borderTop: '1px solid var(--color-border)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  };

  const inputWrapperStyles = {
    display: 'flex',
    gap: '8px',
    alignItems: 'flex-end',
  };

  const emptyStateStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: 'var(--color-text-light)',
    fontSize: '14px',
  };

  const replyingToStyles = {
    padding: '8px 12px',
    backgroundColor: 'var(--color-background)',
    borderLeft: '3px solid var(--color-primary)',
    fontSize: '12px',
    color: 'var(--color-text-light)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  if (loading) {
    return (
      <div style={emptyStateStyles}>
        Loading rooms...
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      <div style={containerStyles}>
        {/* Left Panel - Rooms List */}
        <div style={leftPanelStyles}>
          <div style={headerStyles}>
            <h2 style={titleStyles}>Rooms</h2>
            <Button
              size="sm"
              variant="primary"
              icon={Plus}
              onClick={() => setShowCreateRoom(true)}
            />
          </div>
          <div style={roomsListStyles}>
            {rooms.length === 0 ? (
              <div style={{ padding: '16px', color: 'var(--color-text-light)', textAlign: 'center', fontSize: '12px' }}>
                No rooms yet
              </div>
            ) : (
              rooms.map((room) => (
                <div
                  key={room.id}
                  style={roomItemStyles(selectedRoom?.id === room.id)}
                  onClick={() => setSelectedRoom(room)}
                  onMouseEnter={(e) => {
                    if (selectedRoom?.id !== room.id) {
                      e.currentTarget.style.backgroundColor = 'var(--color-border-light)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedRoom?.id !== room.id) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <div style={roomNameStyles}>{room.name}</div>
                  <div style={badgeContainerStyles}>
                    <Badge variant="neutral" style={{ fontSize: '10px', padding: '2px 8px' }}>
                      {roomTypes[room.type]?.label || room.type}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Panel - Chat */}
        {selectedRoom ? (
          <div style={rightPanelStyles}>
            <div style={chatHeaderStyles}>
              <h2 style={chatTitleStyles}>{selectedRoom.name}</h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--color-text-light)' }}>
                {roomTypes[selectedRoom.type]?.label || selectedRoom.type}
              </p>
            </div>

            <div style={messagesContainerStyles}>
              {messages.length === 0 ? (
                <div style={{ ...emptyStateStyles, height: 'auto' }}>
                  No messages yet. Start the conversation!
                </div>
              ) : (
                messages.map((message) => {
                  const isOwnMessage = message.authorId === user?.id;
                  return (
                    <div key={message.id} style={messageStyles(isOwnMessage)}>
                      {!isOwnMessage && (
                        <Avatar name={message.authorName} size="sm" />
                      )}
                      <div>
                        {message.parentMessageId && (
                          <div style={{ fontSize: '10px', color: 'var(--color-text-light)', marginBottom: '4px' }}>
                            Replying to {message.parentAuthorName}
                          </div>
                        )}
                        <div style={messageBubbleStyles(isOwnMessage)}>
                          {message.content}
                        </div>
                        <div style={messageMetaStyles}>
                          {!isOwnMessage && <span>{message.authorName} • </span>}
                          {new Date(message.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                      {isOwnMessage && (
                        <Avatar name={message.authorName} size="sm" />
                      )}
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div style={inputContainerStyles}>
              {replyingTo && (
                <div style={replyingToStyles}>
                  <span>Replying to {replyingTo.authorName}</span>
                  <button
                    onClick={() => setReplyingTo(null)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--color-text-light)',
                      fontSize: '14px',
                    }}
                  >
                    ✕
                  </button>
                </div>
              )}
              <div style={inputWrapperStyles}>
                <Input
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  style={{ flex: 1 }}
                />
                <Button
                  size="md"
                  variant="primary"
                  icon={Send}
                  loading={sendingMessage}
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                />
              </div>
            </div>
          </div>
        ) : (
          <div style={{ ...rightPanelStyles, ...emptyStateStyles }}>
            Select a room to start chatting
          </div>
        )}
      </div>

      {/* Create Room Modal */}
      <Modal
        isOpen={showCreateRoom}
        onClose={() => setShowCreateRoom(false)}
        title="Create New Room"
        footer={
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <Button
              variant="secondary"
              onClick={() => setShowCreateRoom(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateRoom}
              disabled={!newRoomName.trim()}
            >
              Create
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="Room Name"
            placeholder="e.g., Math Department"
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            required
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>
              Room Type
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {Object.entries(roomTypes).map(([type, config]) => (
                <button
                  key={type}
                  onClick={() => setNewRoomType(type)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--border-radius-sm)',
                    border: '2px solid',
                    borderColor: newRoomType === type ? config.color : 'var(--color-border)',
                    backgroundColor: newRoomType === type ? config.color : 'transparent',
                    color: newRoomType === type ? 'white' : 'var(--color-text)',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 600,
                    transition: 'var(--transition)',
                  }}
                >
                  {config.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default Collaboration;

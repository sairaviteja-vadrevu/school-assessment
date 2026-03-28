import { useState, useEffect, useRef } from 'react';
import { Plus, Send, X } from 'lucide-react';
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
  const messagesEndRef = useRef(null);

  const roomTypes = {
    department: { label: 'Department', color: '#4A90E2' },
    academic: { label: 'Academic', color: '#50C878' },
    event: { label: 'Event', color: '#FFB84D' },
    general: { label: 'General', color: '#9B59B6' },
  };

  useEffect(() => { fetchRooms(); }, []);

  useEffect(() => {
    if (selectedRoom) fetchMessages(selectedRoom.id);
  }, [selectedRoom]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const data = await api.get('/collaboration/rooms');
      setRooms(data || []);
      if (data?.length > 0) setSelectedRoom(data[0]);
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (roomId) => {
    try {
      const data = await api.get(`/collaboration/messages/${roomId}`);
      // Flatten: server returns top-level messages with nested replies
      const flat = [];
      (data || []).forEach((msg) => {
        flat.push(msg);
        if (msg.replies) flat.push(...msg.replies);
      });
      setMessages(flat);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) return;
    try {
      const newRoom = await api.post('/collaboration/rooms', { name: newRoomName, type: newRoomType });
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
      const newMessage = await api.post('/collaboration/messages', {
        room_id: selectedRoom.id,
        content: messageInput,
      });
      setMessages([...messages, newMessage]);
      setMessageInput('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--color-text-secondary)' }}>
        Loading rooms...
      </div>
    );
  }

  return (
    <>
      <div style={{ display: 'flex', height: 'calc(100vh - 80px)', gap: '0', overflow: 'hidden', borderRadius: '14px', border: '1px solid var(--color-border)' }}>
        {/* Left Panel - Rooms */}
        <div style={{
          width: '280px', flexShrink: 0, backgroundColor: 'var(--color-surface)',
          borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column',
        }}>
          <div style={{
            padding: '16px 20px', borderBottom: '1px solid var(--color-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rooms</span>
            <button
              onClick={() => setShowCreateRoom(true)}
              style={{
                width: '30px', height: '30px', borderRadius: '8px', border: 'none',
                backgroundColor: '#1A1A2E', color: 'white', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Plus size={16} />
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {rooms.map((room) => {
              const isSelected = selectedRoom?.id === room.id;
              return (
                <div
                  key={room.id}
                  onClick={() => setSelectedRoom(room)}
                  style={{
                    padding: '14px 20px', cursor: 'pointer',
                    backgroundColor: isSelected ? '#1A1A2E' : 'transparent',
                    color: isSelected ? 'white' : 'var(--color-text)',
                    borderBottom: '1px solid var(--color-border-light)',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--color-border-light)'; }}
                  onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = isSelected ? '#1A1A2E' : 'transparent'; }}
                >
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>{room.name}</div>
                  <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.6 }}>
                    {roomTypes[room.type]?.label || room.type}
                    {room.message_count > 0 && ` · ${room.message_count} messages`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Panel - Chat */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-surface)' }}>
          {selectedRoom ? (
            <>
              {/* Chat Header */}
              <div style={{
                padding: '16px 24px', borderBottom: '1px solid var(--color-border)',
                display: 'flex', alignItems: 'center', gap: '12px',
              }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  backgroundColor: roomTypes[selectedRoom.type]?.color || '#9B59B6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontSize: '14px', fontWeight: 800, flexShrink: 0,
                }}>
                  {selectedRoom.name?.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)' }}>{selectedRoom.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{roomTypes[selectedRoom.type]?.label || selectedRoom.type}</div>
                </div>
              </div>

              {/* Messages */}
              <div style={{
                flex: 1, overflowY: 'auto', padding: '24px',
                display: 'flex', flexDirection: 'column', gap: '16px',
                backgroundColor: 'var(--color-background)',
              }}>
                {messages.length === 0 ? (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwn = msg.author_id === user?.id;
                    return (
                      <div key={msg.id} style={{
                        display: 'flex', flexDirection: isOwn ? 'row-reverse' : 'row',
                        gap: '10px', alignItems: 'flex-end',
                      }}>
                        {!isOwn && (
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '50%',
                            backgroundColor: '#1A1A2E', color: 'white', fontSize: '11px', fontWeight: 700,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}>
                            {msg.author_name?.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div style={{ maxWidth: '65%' }}>
                          {!isOwn && (
                            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px', marginLeft: '2px' }}>
                              {msg.author_name}
                            </div>
                          )}
                          <div style={{
                            padding: '10px 16px',
                            backgroundColor: isOwn ? '#1A1A2E' : 'var(--color-surface)',
                            color: isOwn ? 'white' : 'var(--color-text)',
                            borderRadius: isOwn ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                            fontSize: '14px', lineHeight: 1.5, wordBreak: 'break-word',
                            border: isOwn ? 'none' : '1px solid var(--color-border)',
                          }}>
                            {msg.content}
                          </div>
                          <div style={{
                            fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px',
                            textAlign: isOwn ? 'right' : 'left', marginRight: isOwn ? '2px' : 0, marginLeft: isOwn ? 0 : '2px',
                          }}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div style={{
                padding: '16px 24px', borderTop: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
              }}>
                <div style={{
                  display: 'flex', gap: '10px', alignItems: 'center',
                  backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)',
                  borderRadius: '12px', padding: '6px 6px 6px 16px',
                }}>
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    style={{
                      flex: 1, border: 'none', outline: 'none', fontSize: '14px',
                      color: 'var(--color-text)', backgroundColor: 'transparent',
                      fontFamily: 'var(--font-family)',
                    }}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim() || sendingMessage}
                    style={{
                      width: '38px', height: '38px', borderRadius: '10px', border: 'none',
                      backgroundColor: messageInput.trim() ? '#1A1A2E' : 'var(--color-border-light)',
                      color: messageInput.trim() ? 'white' : 'var(--color-text-secondary)',
                      cursor: messageInput.trim() ? 'pointer' : 'default',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s', flexShrink: 0,
                    }}
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)', fontSize: '14px' }}>
              Select a room to start chatting
            </div>
          )}
        </div>
      </div>

      {/* Create Room Modal */}
      {showCreateRoom && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}
          onClick={() => setShowCreateRoom(false)}
        >
          <div
            style={{ backgroundColor: 'white', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '440px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>Create New Room</h2>
              <button onClick={() => setShowCreateRoom(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: '4px' }}><X size={20} /></button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' }}>Room Name *</label>
              <input
                type="text"
                placeholder="e.g. Math Department"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreateRoom(); }}
                style={{
                  width: '100%', padding: '11px 14px', border: '1px solid var(--color-border)',
                  borderRadius: '10px', fontSize: '14px', fontFamily: 'var(--font-family)',
                  color: 'var(--color-text)', outline: 'none', backgroundColor: 'white',
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px' }}>Room Type</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {Object.entries(roomTypes).map(([type, config]) => (
                  <button
                    key={type}
                    onClick={() => setNewRoomType(type)}
                    style={{
                      padding: '8px 16px', borderRadius: '8px', border: '2px solid',
                      borderColor: newRoomType === type ? config.color : 'var(--color-border)',
                      backgroundColor: newRoomType === type ? config.color : 'transparent',
                      color: newRoomType === type ? 'white' : 'var(--color-text)',
                      cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                      fontFamily: 'var(--font-family)', transition: 'all 0.15s',
                    }}
                  >
                    {config.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowCreateRoom(false)} style={{
                padding: '10px 20px', backgroundColor: 'var(--color-border-light)', color: 'var(--color-text)',
                border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-family)',
              }}>Cancel</button>
              <button onClick={handleCreateRoom} disabled={!newRoomName.trim()} style={{
                padding: '10px 20px', backgroundColor: '#1A1A2E', color: 'white',
                border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600,
                cursor: newRoomName.trim() ? 'pointer' : 'default', fontFamily: 'var(--font-family)',
                opacity: newRoomName.trim() ? 1 : 0.5,
              }}>Create Room</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Collaboration;

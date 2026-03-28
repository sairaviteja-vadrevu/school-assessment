import { useState, useEffect, useRef } from 'react';
import { Plus, Send, X, Users, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const Collaboration = () => {
  const { user, isAdmin } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomType, setNewRoomType] = useState('general');
  const [allUsers, setAllUsers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const messagesEndRef = useRef(null);

  const roomTypes = {
    department: { label: 'Department', color: '#4A90E2' },
    academic: { label: 'Academic', color: '#50C878' },
    event: { label: 'Event', color: '#FFB84D' },
    general: { label: 'General', color: '#9B59B6' },
  };

  useEffect(() => { fetchRooms(); }, []);

  // Poll for new messages and room updates every 15s
  useEffect(() => {
    const interval = setInterval(() => {
      fetchRooms();
      if (selectedRoom) fetchMessages(selectedRoom.id, true);
    }, 15000);
    return () => clearInterval(interval);
  }, [selectedRoom]);

  useEffect(() => {
    if (selectedRoom) {
      fetchMessages(selectedRoom.id);
      // Mark as read
      api.post('/collaboration/notifications/mark-read', { room_id: selectedRoom.id })
        .then(() => {
          setRooms((prev) => prev.map((r) => r.id === selectedRoom.id ? { ...r, unread_count: 0 } : r));
        })
        .catch(() => {});
    }
  }, [selectedRoom]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchRooms = async () => {
    try {
      const data = await api.get('/collaboration/rooms');
      setRooms(data || []);
      if (!selectedRoom && data?.length > 0) setSelectedRoom(data[0]);
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (roomId, silent = false) => {
    try {
      const data = await api.get(`/collaboration/messages/${roomId}`);
      setMessages(data || []);
    } catch (error) {
      if (!silent) console.error('Failed to fetch messages:', error);
    }
  };

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) return;
    try {
      const newRoom = await api.post('/collaboration/rooms', {
        name: newRoomName,
        type: newRoomType,
        member_ids: selectedMembers,
      });
      setRooms([newRoom, ...rooms]);
      setSelectedRoom(newRoom);
      setNewRoomName('');
      setNewRoomType('general');
      setSelectedMembers([]);
      setShowCreateRoom(false);
    } catch (error) {
      console.error('Failed to create room:', error);
      alert('Failed to create room');
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

  const openCreateModal = async () => {
    setNewRoomName('');
    setNewRoomType('general');
    setSelectedMembers([]);
    // Fetch all users for member selection
    try {
      const data = isAdmin ? await api.get('/admin/users') : [];
      setAllUsers((data || []).filter((u) => u.id !== user?.id));
    } catch (e) {
      console.error('Failed to fetch users:', e);
    }
    setShowCreateRoom(true);
  };

  const toggleMember = (userId) => {
    setSelectedMembers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const totalUnread = rooms.reduce((sum, r) => sum + (r.unread_count || 0), 0);

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
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Rooms
              {totalUnread > 0 && (
                <span style={{
                  marginLeft: '8px', backgroundColor: '#DC2626', color: 'white',
                  fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '10px',
                }}>{totalUnread}</span>
              )}
            </span>
            {isAdmin && (
              <button
                onClick={openCreateModal}
                style={{
                  width: '30px', height: '30px', borderRadius: '8px', border: 'none',
                  backgroundColor: '#004493', color: 'white', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Plus size={16} />
              </button>
            )}
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {rooms.length === 0 ? (
              <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '13px' }}>
                {isAdmin ? 'No rooms yet. Create one!' : 'No rooms available. Ask your admin to add you.'}
              </div>
            ) : (
              rooms.map((room) => {
                const isSelected = selectedRoom?.id === room.id;
                return (
                  <div
                    key={room.id}
                    onClick={() => setSelectedRoom(room)}
                    style={{
                      padding: '14px 20px', cursor: 'pointer',
                      backgroundColor: isSelected ? '#004493' : 'transparent',
                      color: isSelected ? 'white' : 'var(--color-text)',
                      borderBottom: '1px solid var(--color-border-light)',
                      transition: 'all 0.15s',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--color-border-light)'; }}
                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = isSelected ? '#004493' : 'transparent'; }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: 600 }}>{room.name}</div>
                      <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.6 }}>
                        {roomTypes[room.type]?.label || room.type}
                        {room.message_count > 0 && ` · ${room.message_count} msgs`}
                      </div>
                    </div>
                    {room.unread_count > 0 && !isSelected && (
                      <span style={{
                        backgroundColor: '#DC2626', color: 'white', fontSize: '10px',
                        fontWeight: 700, padding: '2px 7px', borderRadius: '10px', flexShrink: 0,
                      }}>{room.unread_count}</span>
                    )}
                  </div>
                );
              })
            )}
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
                            backgroundColor: '#004493', color: 'white', fontSize: '11px', fontWeight: 700,
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
                            backgroundColor: isOwn ? '#004493' : 'var(--color-surface)',
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
                      backgroundColor: messageInput.trim() ? '#004493' : 'var(--color-border-light)',
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
              {rooms.length === 0 ? 'No rooms available' : 'Select a room to start chatting'}
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
            style={{ backgroundColor: 'white', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '500px', maxHeight: '85vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>Create New Room</h2>
              <button onClick={() => setShowCreateRoom(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: '4px' }}><X size={20} /></button>
            </div>

            {/* Room Name */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' }}>Room Name *</label>
              <input
                type="text" placeholder="e.g. Math Department" value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && newRoomName.trim() && selectedMembers.length > 0) handleCreateRoom(); }}
                style={{
                  width: '100%', padding: '11px 14px', border: '1px solid var(--color-border)',
                  borderRadius: '10px', fontSize: '14px', fontFamily: 'var(--font-family)',
                  color: 'var(--color-text)', outline: 'none', backgroundColor: 'white',
                }}
              />
            </div>

            {/* Room Type */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px' }}>Room Type</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {Object.entries(roomTypes).map(([type, config]) => (
                  <button
                    key={type} onClick={() => setNewRoomType(type)}
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

            {/* Invite Members */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px' }}>
                <Users size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                Invite Members ({selectedMembers.length} selected)
              </label>
              <div style={{
                border: '1px solid var(--color-border)', borderRadius: '10px',
                maxHeight: '200px', overflowY: 'auto',
              }}>
                {allUsers.length === 0 ? (
                  <div style={{ padding: '16px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '13px' }}>
                    No users available
                  </div>
                ) : (
                  allUsers.map((u) => {
                    const isChecked = selectedMembers.includes(u.id);
                    return (
                      <div
                        key={u.id}
                        onClick={() => toggleMember(u.id)}
                        style={{
                          padding: '10px 16px', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: '12px',
                          borderBottom: '1px solid var(--color-border-light)',
                          backgroundColor: isChecked ? '#F0FDF4' : 'transparent',
                          transition: 'all 0.1s',
                        }}
                        onMouseEnter={(e) => { if (!isChecked) e.currentTarget.style.backgroundColor = 'var(--color-border-light)'; }}
                        onMouseLeave={(e) => { if (!isChecked) e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        <div style={{
                          width: '20px', height: '20px', borderRadius: '6px',
                          border: `2px solid ${isChecked ? '#059669' : 'var(--color-border)'}`,
                          backgroundColor: isChecked ? '#059669' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0, transition: 'all 0.15s',
                        }}>
                          {isChecked && <Check size={12} color="white" />}
                        </div>
                        <div style={{
                          width: '30px', height: '30px', borderRadius: '50%',
                          backgroundColor: u.role === 'admin' ? '#7C3AED' : '#004493',
                          color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '10px', fontWeight: 700, flexShrink: 0,
                        }}>
                          {u.name?.substring(0, 2).toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>{u.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{u.role}{u.subject ? ` · ${u.subject}` : ''}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowCreateRoom(false)} style={{
                padding: '10px 20px', backgroundColor: 'var(--color-border-light)', color: 'var(--color-text)',
                border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-family)',
              }}>Cancel</button>
              <button onClick={handleCreateRoom} disabled={!newRoomName.trim()} style={{
                padding: '10px 20px', backgroundColor: '#004493', color: 'white',
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

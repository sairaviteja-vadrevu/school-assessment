import { useState, useEffect } from 'react';
import { Plus, X, Trash2, CheckCircle, Mail, Phone, BookOpen, Shield, Search } from 'lucide-react';
import { Badge } from '../components';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const UserCard = ({ user, currentUser, onDelete }) => {
  const isCurrentUser = user.id === currentUser?.id;
  const isAdmin = user.role === 'admin';

  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface)',
        borderRadius: '14px',
        border: '1px solid var(--color-border)',
        padding: '24px',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: '50%',
          backgroundColor: isAdmin ? '#7C3AED' : '#004493',
          color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '15px', fontWeight: 700, flexShrink: 0,
        }}>
          {user.name?.substring(0, 2).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--color-text)' }}>{user.name}</p>
            {isCurrentUser && (
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#059669', backgroundColor: '#ECFDF5', padding: '2px 8px', borderRadius: '10px' }}>YOU</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
            <Badge variant={isAdmin ? 'primary' : 'default'}>{user.role}</Badge>
          </div>
        </div>
      </div>

      {/* Info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
          <Mail size={14} style={{ color: 'var(--color-text-light)', flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</span>
        </div>
        {user.phone && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            <Phone size={14} style={{ color: 'var(--color-text-light)', flexShrink: 0 }} />
            <span>{user.phone}</span>
          </div>
        )}
        {user.subject && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            <BookOpen size={14} style={{ color: 'var(--color-text-light)', flexShrink: 0 }} />
            <span>{user.subject}</span>
          </div>
        )}
        {user.classes && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            <Shield size={14} style={{ color: 'var(--color-text-light)', flexShrink: 0 }} />
            <span>{user.classes}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      {!isCurrentUser && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid var(--color-border-light)' }}>
          <button
            onClick={() => onDelete(user)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'none', border: '1px solid var(--color-border)',
              borderRadius: '8px', padding: '7px 14px', cursor: 'pointer',
              fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)',
              fontFamily: 'var(--font-family)', transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#DC2626'; e.currentTarget.style.borderColor = '#FECACA'; e.currentTarget.style.backgroundColor = '#FEF2F2'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-secondary)'; e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <Trash2 size={13} /> Delete
          </button>
        </div>
      )}
    </div>
  );
};

const CreateAccountModal = ({ isOpen, onClose, onCreated }) => {
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'teacher',
    subject: '', phone: '', classes: '', responsibilities: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!form.name || !form.email || !form.password) {
      setError('Name, email, and password are required');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/register', form);
      setSuccess(true);
      setForm({ name: '', email: '', password: '', role: 'teacher', subject: '', phone: '', classes: '', responsibilities: '' });
      onCreated();
      setTimeout(() => { setSuccess(false); onClose(); }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const inputStyle = {
    width: '100%', padding: '11px 14px', border: '1px solid var(--color-border)',
    borderRadius: '10px', fontSize: '14px', fontFamily: 'var(--font-family)',
    color: 'var(--color-text)', outline: 'none', backgroundColor: 'white',
  };
  const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' };
  const selectStyle = { ...inputStyle, cursor: 'pointer', appearance: 'none' };
  const inputGroup = { marginBottom: '16px' };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--color-text)' }}>Create New Account</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: '4px' }}><X size={20} /></button>
        </div>

        {error && (
          <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', marginBottom: '16px' }}>{error}</div>
        )}
        {success && (
          <div style={{ backgroundColor: '#ECFDF5', border: '1px solid #D1FAE5', color: '#059669', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={16} /> Account created successfully!
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={inputGroup}>
              <label style={labelStyle}>Full Name *</label>
              <input style={inputStyle} placeholder="e.g. Mrs. Sarah Johnson" value={form.name} onChange={(e) => handleChange('name', e.target.value)} />
            </div>
            <div style={inputGroup}>
              <label style={labelStyle}>Role *</label>
              <div style={{ position: 'relative' }}>
                <select style={{ ...selectStyle, paddingRight: '36px' }} value={form.role} onChange={(e) => handleChange('role', e.target.value)}>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
                <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--color-text-secondary)', fontSize: '12px' }}>&#9662;</div>
              </div>
            </div>
          </div>
          <div style={inputGroup}>
            <label style={labelStyle}>Email *</label>
            <input style={inputStyle} type="email" placeholder="e.g. sarah@school.com" value={form.email} onChange={(e) => handleChange('email', e.target.value)} />
          </div>
          <div style={inputGroup}>
            <label style={labelStyle}>Password *</label>
            <input style={inputStyle} type="password" placeholder="Min 6 characters" value={form.password} onChange={(e) => handleChange('password', e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={inputGroup}>
              <label style={labelStyle}>Subject</label>
              <input style={inputStyle} placeholder="e.g. Mathematics" value={form.subject} onChange={(e) => handleChange('subject', e.target.value)} />
            </div>
            <div style={inputGroup}>
              <label style={labelStyle}>Phone</label>
              <input style={inputStyle} placeholder="e.g. 555-1234" value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} />
            </div>
          </div>
          <div style={inputGroup}>
            <label style={labelStyle}>Assigned Classes</label>
            <input style={inputStyle} placeholder="e.g. 10A, 10B, 11A" value={form.classes} onChange={(e) => handleChange('classes', e.target.value)} />
          </div>
          <div style={inputGroup}>
            <label style={labelStyle}>Responsibilities</label>
            <input style={inputStyle} placeholder="e.g. Math instruction, Exam coordination" value={form.responsibilities} onChange={(e) => handleChange('responsibilities', e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button type="button" onClick={onClose} style={{
              flex: 1, padding: '12px', backgroundColor: 'var(--color-border-light)', color: 'var(--color-text)',
              border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-family)',
            }}>Cancel</button>
            <button type="submit" disabled={loading} style={{
              flex: 1, padding: '12px', backgroundColor: '#004493', color: 'white', border: 'none', borderRadius: '10px',
              fontSize: '14px', fontWeight: 600, cursor: loading ? 'wait' : 'pointer', fontFamily: 'var(--font-family)', opacity: loading ? 0.7 : 1,
            }}>{loading ? 'Creating...' : 'Create Account'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ManageUsers = () => {
  const { isAdmin, user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleDelete = async (u) => {
    if (!window.confirm(`Are you sure you want to delete "${u.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/users/${u.id}`);
      setUsers(users.filter((x) => x.id !== u.id));
    } catch (err) {
      alert(err.message || 'Failed to delete user');
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await api.get('/admin/users');
      setUsers(data || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const filtered = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.role?.toLowerCase().includes(q);
  });

  if (!isAdmin) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Access denied. Admin only.</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--color-text)' }}>All Accounts</h2>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-secondary)' }}>{users.length} user{users.length !== 1 ? 's' : ''} registered</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 20px', backgroundColor: '#004493', color: 'white',
            border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600,
            cursor: 'pointer', fontFamily: 'var(--font-family)',
          }}
        >
          <Plus size={16} /> New Account
        </button>
      </div>

      {/* Search */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 16px',
        backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)',
        borderRadius: '10px', maxWidth: '400px',
      }}>
        <Search size={16} color="var(--color-text-light)" />
        <input
          type="text" placeholder="Search by name, email, or role..."
          value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: 1, border: 'none', outline: 'none', fontSize: '14px', color: 'var(--color-text)', backgroundColor: 'transparent', fontFamily: 'var(--font-family)' }}
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-light)', padding: '2px', display: 'flex' }}>
            <X size={14} />
          </button>
        )}
      </div>

      {/* User Cards Grid */}
      {loading ? (
        <p style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-secondary)' }}>Loading...</p>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--color-text-secondary)', fontSize: '14px' }}>
          {searchQuery ? 'No users match your search.' : 'No users found.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {filtered.map((u) => (
            <UserCard key={u.id} user={u} currentUser={currentUser} onDelete={handleDelete} />
          ))}
        </div>
      )}

      <CreateAccountModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onCreated={fetchUsers}
      />
    </div>
  );
};

export default ManageUsers;

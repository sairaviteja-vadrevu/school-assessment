import React, { useState, useEffect } from 'react';
import {
  Plus,
  X,
  Mail,
  Lock,
  User,
  BookOpen,
  Phone,
  Shield,
  CheckCircle,
} from 'lucide-react';
import { Card, Badge, Button } from '../components';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

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

  const overlayStyles = {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    backdropFilter: 'blur(4px)',
  };

  const modalStyles = {
    backgroundColor: 'white', borderRadius: '16px', padding: '32px',
    width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto',
    position: 'relative',
  };

  const inputGroup = { marginBottom: '16px' };

  const labelStyle = {
    display: 'block', fontSize: '13px', fontWeight: 600,
    color: 'var(--color-text)', marginBottom: '6px',
  };

  const inputStyle = {
    width: '100%', padding: '11px 14px', border: '1px solid var(--color-border)',
    borderRadius: '10px', fontSize: '14px', fontFamily: 'var(--font-family)',
    color: 'var(--color-text)', outline: 'none', backgroundColor: 'white',
    transition: 'border-color 0.2s',
  };

  const selectStyle = { ...inputStyle, cursor: 'pointer', appearance: 'none' };

  return (
    <div style={overlayStyles} onClick={onClose}>
      <div style={modalStyles} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--color-text)' }}>Create New Account</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', marginBottom: '16px' }}>
            {error}
          </div>
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
              <select style={selectStyle} value={form.role} onChange={(e) => handleChange('role', e.target.value)}>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
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
              flex: 1, padding: '12px', backgroundColor: 'var(--color-border-light)',
              color: 'var(--color-text)', border: 'none', borderRadius: '10px',
              fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-family)',
            }}>Cancel</button>
            <button type="submit" disabled={loading} style={{
              flex: 1, padding: '12px', backgroundColor: '#1A1A2E',
              color: 'white', border: 'none', borderRadius: '10px',
              fontSize: '14px', fontWeight: 600, cursor: loading ? 'wait' : 'pointer',
              fontFamily: 'var(--font-family)', opacity: loading ? 0.7 : 1,
            }}>{loading ? 'Creating...' : 'Create Account'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ManageUsers = () => {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchUsers = async () => {
    try {
      const data = await api.get('/teachers');
      setUsers(data || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

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
            padding: '10px 20px', backgroundColor: '#1A1A2E', color: 'white',
            border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600,
            cursor: 'pointer', fontFamily: 'var(--font-family)',
          }}
        >
          <Plus size={16} /> New Account
        </button>
      </div>

      {/* Users Table */}
      <Card>
        {loading ? (
          <p style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-secondary)' }}>Loading...</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Name', 'Email', 'Subject', 'Classes', 'Phone'].map((h) => (
                    <th key={h} style={{
                      textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: 600,
                      color: 'var(--color-text-secondary)', textTransform: 'uppercase',
                      letterSpacing: '0.5px', borderBottom: '1px solid var(--color-border)',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#1A1A2E',
                          color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '13px', fontWeight: 700, flexShrink: 0,
                        }}>
                          {u.name?.substring(0, 2).toUpperCase()}
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>{u.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>{u.email}</td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>{u.subject || '—'}</td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>{u.classes || '—'}</td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>{u.phone || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <CreateAccountModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onCreated={fetchUsers}
      />
    </div>
  );
};

export default ManageUsers;

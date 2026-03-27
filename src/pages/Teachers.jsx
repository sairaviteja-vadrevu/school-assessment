import React, { useState, useEffect } from 'react';
import { Mail, Phone, BookOpen, Edit2, Plus, Search, X } from 'lucide-react';
import { Card, Badge, Modal, Input, Select } from '../components';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const TeacherCard = ({ teacher, isAdmin, onEdit, onView }) => (
  <div
    onClick={() => onView(teacher)}
    style={{
      backgroundColor: 'var(--color-surface)',
      borderRadius: '14px',
      border: '1px solid var(--color-border)',
      padding: '24px',
      cursor: 'pointer',
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
        width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#1A1A2E',
        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '15px', fontWeight: 700, flexShrink: 0,
      }}>
        {teacher.name?.substring(0, 2).toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--color-text)' }}>{teacher.name}</p>
        <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--color-text-light)' }}>{teacher.subject}</p>
      </div>
    </div>

    {/* Contact info */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
      {teacher.email && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
          <Mail size={14} style={{ color: 'var(--color-text-light)', flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{teacher.email}</span>
        </div>
      )}
      {teacher.phone && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
          <Phone size={14} style={{ color: 'var(--color-text-light)', flexShrink: 0 }} />
          <span>{teacher.phone}</span>
        </div>
      )}
      {teacher.classes && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
          <BookOpen size={14} style={{ color: 'var(--color-text-light)', flexShrink: 0 }} />
          <span>{teacher.classes}</span>
        </div>
      )}
    </div>

    {/* Footer */}
    {isAdmin && (
      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid var(--color-border-light)' }}>
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(teacher); }}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'none', border: '1px solid var(--color-border)',
            borderRadius: '8px', padding: '7px 14px', cursor: 'pointer',
            fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)',
            fontFamily: 'var(--font-family)', transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-border-light)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
          <Edit2 size={13} /> Edit
        </button>
      </div>
    )}
  </div>
);

const Teachers = () => {
  const { isAdmin } = useAuth();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', subject: '', role: 'teacher', email: '', phone: '', classes: '' });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const data = await api.get('/teachers');
        setTeachers(data || []);
      } catch (err) {
        setError(err.message || 'Failed to load teachers');
      } finally {
        setLoading(false);
      }
    };
    fetchTeachers();
  }, []);

  const filtered = teachers.filter((t) => {
    const q = searchQuery.toLowerCase();
    return t.name?.toLowerCase().includes(q) || t.subject?.toLowerCase().includes(q) || t.email?.toLowerCase().includes(q);
  });

  const resetForm = () => {
    setFormData({ name: '', subject: '', role: 'teacher', email: '', phone: '', classes: '' });
    setFormErrors({});
  };

  const handleEdit = (teacher) => {
    setFormData({ name: teacher.name, subject: teacher.subject, role: teacher.role || 'teacher', email: teacher.email, phone: teacher.phone || '', classes: teacher.classes || '' });
    setSelectedTeacher(teacher);
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.subject.trim()) errors.subject = 'Subject is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      if (selectedTeacher && isEditModalOpen) {
        await api.put(`/teachers/${selectedTeacher.id}`, formData);
        setTeachers(teachers.map((t) => t.id === selectedTeacher.id ? { ...t, ...formData } : t));
      } else {
        const newTeacher = await api.post('/teachers', formData);
        setTeachers([...teachers, newTeacher]);
      }
      setIsModalOpen(false);
      setIsEditModalOpen(false);
      setSelectedTeacher(null);
      resetForm();
    } catch (err) {
      setFormErrors({ submit: err.message || 'Failed to save' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '11px 14px', border: '1px solid var(--color-border)',
    borderRadius: '10px', fontSize: '14px', fontFamily: 'var(--font-family)',
    color: 'var(--color-text)', outline: 'none', backgroundColor: 'white',
  };
  const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' };

  const renderForm = () => (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={labelStyle}>Full Name *</label>
          <input style={inputStyle} placeholder="e.g. Mrs. Sarah Johnson" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          {formErrors.name && <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#DC2626' }}>{formErrors.name}</p>}
        </div>
        <div>
          <label style={labelStyle}>Subject *</label>
          <input style={inputStyle} placeholder="e.g. Mathematics" value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} />
          {formErrors.subject && <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#DC2626' }}>{formErrors.subject}</p>}
        </div>
      </div>
      <div>
        <label style={labelStyle}>Email *</label>
        <input style={inputStyle} type="email" placeholder="e.g. sarah@school.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
        {formErrors.email && <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#DC2626' }}>{formErrors.email}</p>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={labelStyle}>Phone</label>
          <input style={inputStyle} placeholder="e.g. 555-1234" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
        </div>
        <div>
          <label style={labelStyle}>Classes</label>
          <input style={inputStyle} placeholder="e.g. 10A, 10B" value={formData.classes} onChange={(e) => setFormData({ ...formData, classes: e.target.value })} />
        </div>
      </div>
      {formErrors.submit && (
        <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', padding: '10px 14px', borderRadius: '10px', fontSize: '13px' }}>{formErrors.submit}</div>
      )}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
        <button type="button" onClick={() => { setIsModalOpen(false); setIsEditModalOpen(false); resetForm(); }} style={{
          padding: '10px 20px', backgroundColor: 'var(--color-border-light)', color: 'var(--color-text)',
          border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-family)',
        }}>Cancel</button>
        <button type="submit" disabled={isSubmitting} style={{
          padding: '10px 20px', backgroundColor: '#1A1A2E', color: 'white',
          border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600,
          cursor: isSubmitting ? 'wait' : 'pointer', fontFamily: 'var(--font-family)', opacity: isSubmitting ? 0.7 : 1,
        }}>{isSubmitting ? 'Saving...' : (isEditModalOpen ? 'Save Changes' : 'Add Teacher')}</button>
      </div>
    </form>
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Loading teachers...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-secondary)' }}>{teachers.length} teacher{teachers.length !== 1 ? 's' : ''} registered</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => { resetForm(); setSelectedTeacher(null); setIsModalOpen(true); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
              backgroundColor: '#1A1A2E', color: 'white', border: 'none', borderRadius: '10px',
              fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-family)',
            }}
          >
            <Plus size={16} /> Add Teacher
          </button>
        )}
      </div>

      {/* Search */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 16px',
        backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)',
        borderRadius: '10px', maxWidth: '400px',
      }}>
        <Search size={16} color="var(--color-text-light)" />
        <input
          type="text" placeholder="Search by name, subject, or email..."
          value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: 1, border: 'none', outline: 'none', fontSize: '14px', color: 'var(--color-text)', backgroundColor: 'transparent', fontFamily: 'var(--font-family)' }}
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-light)', padding: '2px', display: 'flex' }}>
            <X size={14} />
          </button>
        )}
      </div>

      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: '#FEF2F2', color: '#DC2626', borderRadius: '10px', fontSize: '14px' }}>{error}</div>
      )}

      {/* Teacher Grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--color-text-light)', fontSize: '14px' }}>
          {searchQuery ? 'No teachers match your search.' : 'No teachers found.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {filtered.map((teacher) => (
            <TeacherCard
              key={teacher.id}
              teacher={teacher}
              isAdmin={isAdmin}
              onEdit={handleEdit}
              onView={(t) => setSelectedTeacher(t)}
            />
          ))}
        </div>
      )}

      {/* Add Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}
          onClick={() => { setIsModalOpen(false); resetForm(); }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '520px' }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>Add Teacher</h2>
              <button onClick={() => { setIsModalOpen(false); resetForm(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}><X size={20} /></button>
            </div>
            {renderForm()}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}
          onClick={() => { setIsEditModalOpen(false); resetForm(); }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '520px' }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>Edit Teacher</h2>
              <button onClick={() => { setIsEditModalOpen(false); resetForm(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}><X size={20} /></button>
            </div>
            {renderForm()}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedTeacher && !isEditModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}
          onClick={() => setSelectedTeacher(null)}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '440px' }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>{selectedTeacher.name}</h2>
              <button onClick={() => setSelectedTeacher(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid var(--color-border-light)' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#1A1A2E', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 700 }}>
                {selectedTeacher.name?.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--color-text)' }}>{selectedTeacher.name}</p>
                <p style={{ margin: '2px 0 0', fontSize: '14px', color: 'var(--color-text-light)' }}>{selectedTeacher.subject}</p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {selectedTeacher.email && <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: 'var(--color-text-secondary)' }}><Mail size={16} color="var(--color-text-light)" /> {selectedTeacher.email}</div>}
              {selectedTeacher.phone && <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: 'var(--color-text-secondary)' }}><Phone size={16} color="var(--color-text-light)" /> {selectedTeacher.phone}</div>}
              {selectedTeacher.classes && <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: 'var(--color-text-secondary)' }}><BookOpen size={16} color="var(--color-text-light)" /> {selectedTeacher.classes}</div>}
            </div>
            {isAdmin && (
              <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--color-border-light)', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button onClick={() => setSelectedTeacher(null)} style={{ padding: '10px 20px', backgroundColor: 'var(--color-border-light)', color: 'var(--color-text)', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-family)' }}>Close</button>
                <button onClick={() => { const t = selectedTeacher; setSelectedTeacher(null); handleEdit(t); }} style={{ padding: '10px 20px', backgroundColor: '#1A1A2E', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-family)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Edit2 size={14} /> Edit
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Teachers;

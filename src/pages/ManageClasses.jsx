import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const ClassCard = ({ cls, isAdmin, onEdit, onSelect, isSelected }) => (
  <div
    onClick={() => onSelect(cls)}
    style={{
      backgroundColor: isSelected ? '#1A1A2E' : 'var(--color-surface)',
      color: isSelected ? 'white' : 'var(--color-text)',
      borderRadius: 'var(--border-radius)',
      border: isSelected ? 'none' : '1px solid var(--color-border)',
      padding: '20px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      boxShadow: isSelected ? 'var(--shadow-md)' : 'none',
    }}
    onMouseEnter={(e) => {
      if (!isSelected) {
        e.currentTarget.style.boxShadow = 'var(--shadow-card)';
      }
    }}
    onMouseLeave={(e) => {
      if (!isSelected) {
        e.currentTarget.style.boxShadow = 'none';
      }
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '12px' }}>
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>{cls.name}</p>
        <p style={{ margin: '4px 0 0', fontSize: '13px', opacity: 0.7 }}>{cls.section || 'No section'}</p>
        <p style={{ margin: '2px 0 0', fontSize: '13px', opacity: 0.7 }}>Grade {cls.grade}</p>
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : 'var(--color-background)',
        padding: '6px 12px', borderRadius: 'var(--border-radius-sm)',
        fontSize: '13px', fontWeight: 600,
      }}>
        <Users size={14} /> {cls.studentCount || 0}
      </div>
    </div>
    {isAdmin && isSelected && (
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(cls); }}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'rgba(255,255,255,0.1)', border: 'none',
            borderRadius: 'var(--border-radius-sm)', padding: '6px 12px', cursor: 'pointer',
            fontSize: '12px', fontWeight: 600, color: 'white',
            fontFamily: 'var(--font-family)', transition: 'all 0.15s ease',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; }}
        >
          <Edit2 size={12} /> Edit
        </button>
      </div>
    )}
  </div>
);

const ManageClasses = () => {
  const { isAdmin } = useAuth();
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [classFormData, setClassFormData] = useState({ name: '', section: '', grade: '' });
  const [studentFormData, setStudentFormData] = useState({ name: '', roll_number: '' });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const data = await api.get('/classes');
        setClasses(data || []);
      } catch (err) {
        setError(err.message || 'Failed to load classes');
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      const fetchStudents = async () => {
        try {
          const data = await api.get(`/classes/${selectedClass.id}/students`);
          setStudents(data || []);
        } catch (err) {
          console.error('Failed to load students');
          setStudents([]);
        }
      };
      fetchStudents();
    }
  }, [selectedClass]);

  const resetClassForm = () => {
    setClassFormData({ name: '', section: '', grade: '' });
    setFormErrors({});
  };

  const resetStudentForm = () => {
    setStudentFormData({ name: '', roll_number: '' });
    setFormErrors({});
  };

  const handleEditClass = (cls) => {
    setClassFormData({ name: cls.name, section: cls.section || '', grade: cls.grade || '' });
    setIsEditMode(true);
    setFormErrors({});
    setIsClassModalOpen(true);
  };

  const validateClassForm = () => {
    const errors = {};
    if (!classFormData.name.trim()) errors.name = 'Class name is required';
    if (!classFormData.grade.trim()) errors.grade = 'Grade is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStudentForm = () => {
    const errors = {};
    if (!studentFormData.name.trim()) errors.name = 'Student name is required';
    if (!studentFormData.roll_number.trim()) errors.roll_number = 'Roll number is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitClass = async (e) => {
    e?.preventDefault();
    if (!validateClassForm()) return;
    setIsSubmitting(true);
    try {
      if (isEditMode && selectedClass) {
        await api.put(`/classes/${selectedClass.id}`, classFormData);
        const updated = { ...selectedClass, ...classFormData };
        setClasses(classes.map((c) => c.id === selectedClass.id ? updated : c));
        setSelectedClass(updated);
      } else {
        const newClass = await api.post('/classes', classFormData);
        setClasses([...classes, newClass]);
      }
      setIsClassModalOpen(false);
      setIsEditMode(false);
      resetClassForm();
    } catch (err) {
      setFormErrors({ submit: err.message || 'Failed to save' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitStudent = async (e) => {
    e?.preventDefault();
    if (!validateStudentForm() || !selectedClass) return;
    setIsSubmitting(true);
    try {
      const payload = { ...studentFormData, class_id: selectedClass.id };
      const newStudent = await api.post('/students', payload);
      setStudents([...students, newStudent]);
      setIsStudentModalOpen(false);
      resetStudentForm();
    } catch (err) {
      setFormErrors({ submit: err.message || 'Failed to save' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;
    try {
      await api.delete(`/students/${studentId}`);
      setStudents(students.filter((s) => s.id !== studentId));
    } catch (err) {
      setError('Failed to delete student');
    }
  };

  const inputStyle = {
    width: '100%', padding: '11px 14px', border: '1px solid var(--color-border)',
    borderRadius: 'var(--border-radius-sm)', fontSize: '14px', fontFamily: 'var(--font-family)',
    color: 'var(--color-text)', outline: 'none', backgroundColor: 'white',
  };
  const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' };

  const renderClassForm = () => (
    <form onSubmit={handleSubmitClass} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={labelStyle}>Class Name *</label>
          <input style={inputStyle} placeholder="e.g. 10A" value={classFormData.name} onChange={(e) => setClassFormData({ ...classFormData, name: e.target.value })} />
          {formErrors.name && <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#DC2626' }}>{formErrors.name}</p>}
        </div>
        <div>
          <label style={labelStyle}>Grade *</label>
          <input style={inputStyle} placeholder="e.g. 10" value={classFormData.grade} onChange={(e) => setClassFormData({ ...classFormData, grade: e.target.value })} />
          {formErrors.grade && <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#DC2626' }}>{formErrors.grade}</p>}
        </div>
      </div>
      <div>
        <label style={labelStyle}>Section</label>
        <input style={inputStyle} placeholder="e.g. A, B, C" value={classFormData.section} onChange={(e) => setClassFormData({ ...classFormData, section: e.target.value })} />
      </div>
      {formErrors.submit && (
        <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', padding: '10px 14px', borderRadius: 'var(--border-radius-sm)', fontSize: '13px' }}>{formErrors.submit}</div>
      )}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
        <button type="button" onClick={() => { setIsClassModalOpen(false); setIsEditMode(false); resetClassForm(); }} style={{
          padding: '10px 20px', backgroundColor: 'var(--color-border-light)', color: 'var(--color-text)',
          border: 'none', borderRadius: 'var(--border-radius-sm)', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-family)',
          whiteSpace: 'nowrap',
        }}>Cancel</button>
        <button type="submit" disabled={isSubmitting} style={{
          padding: '10px 20px', backgroundColor: '#1A1A2E', color: 'white',
          border: 'none', borderRadius: 'var(--border-radius-sm)', fontSize: '14px', fontWeight: 600,
          cursor: isSubmitting ? 'wait' : 'pointer', fontFamily: 'var(--font-family)', opacity: isSubmitting ? 0.7 : 1,
          whiteSpace: 'nowrap',
        }}>{isSubmitting ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Class')}</button>
      </div>
    </form>
  );

  const renderStudentForm = () => (
    <form onSubmit={handleSubmitStudent} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={labelStyle}>Student Name *</label>
          <input style={inputStyle} placeholder="e.g. John Doe" value={studentFormData.name} onChange={(e) => setStudentFormData({ ...studentFormData, name: e.target.value })} />
          {formErrors.name && <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#DC2626' }}>{formErrors.name}</p>}
        </div>
        <div>
          <label style={labelStyle}>Roll Number *</label>
          <input style={inputStyle} placeholder="e.g. 1" value={studentFormData.roll_number} onChange={(e) => setStudentFormData({ ...studentFormData, roll_number: e.target.value })} />
          {formErrors.roll_number && <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#DC2626' }}>{formErrors.roll_number}</p>}
        </div>
      </div>
      {formErrors.submit && (
        <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', padding: '10px 14px', borderRadius: 'var(--border-radius-sm)', fontSize: '13px' }}>{formErrors.submit}</div>
      )}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
        <button type="button" onClick={() => { setIsStudentModalOpen(false); resetStudentForm(); }} style={{
          padding: '10px 20px', backgroundColor: 'var(--color-border-light)', color: 'var(--color-text)',
          border: 'none', borderRadius: 'var(--border-radius-sm)', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-family)',
          whiteSpace: 'nowrap',
        }}>Cancel</button>
        <button type="submit" disabled={isSubmitting} style={{
          padding: '10px 20px', backgroundColor: '#1A1A2E', color: 'white',
          border: 'none', borderRadius: 'var(--border-radius-sm)', fontSize: '14px', fontWeight: 600,
          cursor: isSubmitting ? 'wait' : 'pointer', fontFamily: 'var(--font-family)', opacity: isSubmitting ? 0.7 : 1,
          whiteSpace: 'nowrap',
        }}>{isSubmitting ? 'Saving...' : 'Add Student'}</button>
      </div>
    </form>
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Loading classes...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700, color: 'var(--color-text)' }}>Classes & Students</h1>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-secondary)' }}>{classes.length} class{classes.length !== 1 ? 'es' : ''} registered</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => { resetClassForm(); setIsEditMode(false); setIsClassModalOpen(true); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
              backgroundColor: '#1A1A2E', color: 'white', border: 'none', borderRadius: 'var(--border-radius-sm)',
              fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-family)',
              whiteSpace: 'nowrap',
            }}
          >
            <Plus size={16} /> New Class
          </button>
        )}
      </div>

      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: '#FEF2F2', color: '#DC2626', borderRadius: 'var(--border-radius-sm)', fontSize: '14px' }}>{error}</div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--color-text)' }}>Classes</h2>
          {classes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-text-light)', fontSize: '14px', backgroundColor: 'var(--color-background)', borderRadius: 'var(--border-radius)', border: '1px dashed var(--color-border)' }}>
              No classes yet. Create one to get started.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
              {classes.map((cls) => (
                <ClassCard
                  key={cls.id}
                  cls={cls}
                  isAdmin={isAdmin}
                  isSelected={selectedClass?.id === cls.id}
                  onEdit={handleEditClass}
                  onSelect={setSelectedClass}
                />
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--color-text)' }}>Students</h2>
            {isAdmin && selectedClass && (
              <button
                onClick={() => { resetStudentForm(); setIsStudentModalOpen(true); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
                  backgroundColor: '#1A1A2E', color: 'white', border: 'none', borderRadius: 'var(--border-radius-sm)',
                  fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-family)',
                  whiteSpace: 'nowrap',
                }}
              >
                <Plus size={14} /> Add Student
              </button>
            )}
          </div>

          {!selectedClass ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-text-light)', fontSize: '14px', backgroundColor: 'var(--color-background)', borderRadius: 'var(--border-radius)', border: '1px dashed var(--color-border)' }}>
              Select a class to view students
            </div>
          ) : students.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-text-light)', fontSize: '14px', backgroundColor: 'var(--color-background)', borderRadius: 'var(--border-radius)', border: '1px dashed var(--color-border)' }}>
              No students in this class
            </div>
          ) : (
            <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-background)', borderBottom: '1px solid var(--color-border)' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text)', fontSize: '13px' }}>Roll</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text)', fontSize: '13px' }}>Name</th>
                    {isAdmin && <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: 'var(--color-text)', fontSize: '13px' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background-color 0.15s ease' }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-background)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                      <td style={{ padding: '12px 16px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>{student.roll_number}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--color-text)' }}>{student.name}</td>
                      {isAdmin && (
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <button
                            onClick={() => handleDeleteStudent(student.id)}
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626',
                              padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px',
                              fontSize: '12px', fontFamily: 'var(--font-family)', transition: 'all 0.15s ease',
                              whiteSpace: 'nowrap',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.7'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                            title="Delete student"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {isClassModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}
          onClick={() => { setIsClassModalOpen(false); resetClassForm(); }}>
          <div style={{ backgroundColor: 'white', borderRadius: 'var(--border-radius)', padding: '32px', width: '100%', maxWidth: '520px' }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>{isEditMode ? 'Edit Class' : 'Create New Class'}</h2>
              <button onClick={() => { setIsClassModalOpen(false); resetClassForm(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: 0 }}><X size={20} /></button>
            </div>
            {renderClassForm()}
          </div>
        </div>
      )}

      {isStudentModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}
          onClick={() => { setIsStudentModalOpen(false); resetStudentForm(); }}>
          <div style={{ backgroundColor: 'white', borderRadius: 'var(--border-radius)', padding: '32px', width: '100%', maxWidth: '520px' }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>Add Student</h2>
              <button onClick={() => { setIsStudentModalOpen(false); resetStudentForm(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: 0 }}><X size={20} /></button>
            </div>
            {renderStudentForm()}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageClasses;

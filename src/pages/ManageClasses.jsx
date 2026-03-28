import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Users, GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

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

  const resetClassForm = () => { setClassFormData({ name: '', section: '', grade: '' }); setFormErrors({}); };
  const resetStudentForm = () => { setStudentFormData({ name: '', roll_number: '' }); setFormErrors({}); };

  const handleEditClass = (cls) => {
    setClassFormData({ name: cls.name, section: cls.section || '', grade: cls.grade || '' });
    setIsEditMode(true);
    setFormErrors({});
    setIsClassModalOpen(true);
  };

  const validateClassForm = () => {
    const errors = {};
    if (!classFormData.name.trim()) errors.name = 'Class name is required';
    if (!classFormData.grade.toString().trim()) errors.grade = 'Grade is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStudentForm = () => {
    const errors = {};
    if (!studentFormData.name.trim()) errors.name = 'Student name is required';
    if (!studentFormData.roll_number.toString().trim()) errors.roll_number = 'Roll number is required';
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
    borderRadius: '10px', fontSize: '14px', fontFamily: 'var(--font-family)',
    color: 'var(--color-text)', outline: 'none', backgroundColor: 'white',
  };
  const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Loading classes...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            {classes.length} class{classes.length !== 1 ? 'es' : ''} registered
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => { resetClassForm(); setIsEditMode(false); setIsClassModalOpen(true); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
              backgroundColor: '#1A1A2E', color: 'white', border: 'none', borderRadius: '10px',
              fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-family)',
            }}
          >
            <Plus size={16} /> New Class
          </button>
        )}
      </div>

      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: '#FEF2F2', color: '#DC2626', borderRadius: '10px', fontSize: '14px' }}>{error}</div>
      )}

      {/* Main Content */}
      <div style={{ display: 'flex', gap: '24px', minHeight: '500px' }}>
        {/* Classes List - Left Sidebar */}
        <div style={{
          width: '280px', flexShrink: 0,
          backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: '14px', overflow: 'hidden', display: 'flex', flexDirection: 'column',
        }}>
          <div style={{
            padding: '16px 20px', borderBottom: '1px solid var(--color-border)',
            fontSize: '13px', fontWeight: 700, color: 'var(--color-text-secondary)',
            textTransform: 'uppercase', letterSpacing: '0.5px',
          }}>
            Classes
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {classes.length === 0 ? (
              <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '13px' }}>
                <GraduationCap size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
                <p style={{ margin: 0 }}>No classes yet</p>
              </div>
            ) : (
              classes.map((cls) => {
                const isSelected = selectedClass?.id === cls.id;
                return (
                  <div
                    key={cls.id}
                    onClick={() => setSelectedClass(cls)}
                    style={{
                      padding: '14px 20px', cursor: 'pointer',
                      backgroundColor: isSelected ? '#1A1A2E' : 'transparent',
                      color: isSelected ? 'white' : 'var(--color-text)',
                      borderBottom: '1px solid var(--color-border-light)',
                      transition: 'all 0.15s ease',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--color-border-light)'; }}
                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 700 }}>{cls.name}</div>
                      <div style={{ fontSize: '12px', opacity: 0.6, marginTop: '2px' }}>
                        Grade {cls.grade}{cls.section ? ` · ${cls.section}` : ''}
                      </div>
                    </div>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '4px',
                      fontSize: '12px', fontWeight: 600, opacity: 0.7,
                    }}>
                      <Users size={13} /> {cls.studentCount || 0}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Students Panel - Right */}
        <div style={{
          flex: 1, backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: '14px', overflow: 'hidden', display: 'flex', flexDirection: 'column',
        }}>
          {!selectedClass ? (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: '12px',
              color: 'var(--color-text-secondary)',
            }}>
              <Users size={40} style={{ opacity: 0.2 }} />
              <p style={{ margin: 0, fontSize: '15px', fontWeight: 500 }}>Select a class to view students</p>
              <p style={{ margin: 0, fontSize: '13px', opacity: 0.6 }}>Choose a class from the left panel</p>
            </div>
          ) : (
            <>
              {/* Students Header */}
              <div style={{
                padding: '16px 20px', borderBottom: '1px solid var(--color-border)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    backgroundColor: '#1A1A2E', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: 'white', fontSize: '14px', fontWeight: 800,
                  }}>
                    {selectedClass.name?.substring(0, 2)}
                  </div>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)' }}>
                      {selectedClass.name}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      {students.length} student{students.length !== 1 ? 's' : ''}
                      {selectedClass.section ? ` · Section ${selectedClass.section}` : ''}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {isAdmin && (
                    <>
                      <button
                        onClick={() => handleEditClass(selectedClass)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
                          backgroundColor: 'var(--color-border-light)', color: 'var(--color-text)',
                          border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                          cursor: 'pointer', fontFamily: 'var(--font-family)',
                        }}
                      >
                        <Edit2 size={13} /> Edit
                      </button>
                      <button
                        onClick={() => { resetStudentForm(); setIsStudentModalOpen(true); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
                          backgroundColor: '#1A1A2E', color: 'white', border: 'none', borderRadius: '8px',
                          fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-family)',
                        }}
                      >
                        <Plus size={13} /> Add Student
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Students List */}
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {students.length === 0 ? (
                  <div style={{
                    padding: '48px 20px', textAlign: 'center',
                    color: 'var(--color-text-secondary)',
                  }}>
                    <GraduationCap size={40} style={{ opacity: 0.2, marginBottom: '12px' }} />
                    <p style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 500 }}>No students yet</p>
                    <p style={{ margin: 0, fontSize: '13px', opacity: 0.6 }}>Add students to this class to get started</p>
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Roll</th>
                        <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Student Name</th>
                        {isAdmin && <th style={{ padding: '12px 20px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student, idx) => (
                        <tr
                          key={student.id}
                          style={{ borderBottom: '1px solid var(--color-border-light)', transition: 'background-color 0.15s' }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-border-light)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                        >
                          <td style={{ padding: '12px 20px', fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 600, width: '60px' }}>
                            {student.roll_number}
                          </td>
                          <td style={{ padding: '12px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{
                                width: '30px', height: '30px', borderRadius: '50%',
                                backgroundColor: `hsl(${(idx * 47) % 360}, 45%, 55%)`,
                                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '11px', fontWeight: 700, flexShrink: 0,
                              }}>
                                {student.name?.substring(0, 2).toUpperCase()}
                              </div>
                              <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text)' }}>{student.name}</span>
                            </div>
                          </td>
                          {isAdmin && (
                            <td style={{ padding: '12px 20px', textAlign: 'right' }}>
                              <button
                                onClick={() => handleDeleteStudent(student.id)}
                                title="Delete student"
                                style={{
                                  background: 'none', border: 'none', cursor: 'pointer',
                                  color: 'var(--color-text-secondary)', padding: '6px',
                                  borderRadius: '6px', transition: 'all 0.15s',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.color = '#DC2626'; e.currentTarget.style.backgroundColor = '#FEF2F2'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-secondary)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                              >
                                <Trash2 size={15} />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Class Modal */}
      {isClassModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}
          onClick={() => { setIsClassModalOpen(false); setIsEditMode(false); resetClassForm(); }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '480px' }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>{isEditMode ? 'Edit Class' : 'Create New Class'}</h2>
              <button onClick={() => { setIsClassModalOpen(false); setIsEditMode(false); resetClassForm(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: '4px' }}><X size={20} /></button>
            </div>
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
                <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', padding: '10px 14px', borderRadius: '10px', fontSize: '13px' }}>{formErrors.submit}</div>
              )}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" onClick={() => { setIsClassModalOpen(false); setIsEditMode(false); resetClassForm(); }} style={{
                  padding: '10px 20px', backgroundColor: 'var(--color-border-light)', color: 'var(--color-text)',
                  border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-family)',
                }}>Cancel</button>
                <button type="submit" disabled={isSubmitting} style={{
                  padding: '10px 20px', backgroundColor: '#1A1A2E', color: 'white',
                  border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600,
                  cursor: isSubmitting ? 'wait' : 'pointer', fontFamily: 'var(--font-family)', opacity: isSubmitting ? 0.7 : 1,
                }}>{isSubmitting ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Class')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Modal */}
      {isStudentModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}
          onClick={() => { setIsStudentModalOpen(false); resetStudentForm(); }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '480px' }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>Add Student to {selectedClass?.name}</h2>
              <button onClick={() => { setIsStudentModalOpen(false); resetStudentForm(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: '4px' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmitStudent} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
              {formErrors.submit && (
                <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', padding: '10px 14px', borderRadius: '10px', fontSize: '13px' }}>{formErrors.submit}</div>
              )}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" onClick={() => { setIsStudentModalOpen(false); resetStudentForm(); }} style={{
                  padding: '10px 20px', backgroundColor: 'var(--color-border-light)', color: 'var(--color-text)',
                  border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-family)',
                }}>Cancel</button>
                <button type="submit" disabled={isSubmitting} style={{
                  padding: '10px 20px', backgroundColor: '#1A1A2E', color: 'white',
                  border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600,
                  cursor: isSubmitting ? 'wait' : 'pointer', fontFamily: 'var(--font-family)', opacity: isSubmitting ? 0.7 : 1,
                }}>{isSubmitting ? 'Saving...' : 'Add Student'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageClasses;

import React, { useState, useEffect } from 'react';
import { AlertCircle, TrendingUp, Edit2, Check, X as XIcon, Trash2 } from 'lucide-react';
import {
  Card,
  Select,
  Input,
  Button,
  Table,
  StatCard,
  Badge,
  Modal,
} from '../components';
import { ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const ComboBox = ({ label, value, onChange, options = [], placeholder, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || '');
  const containerRef = React.useRef(null);

  React.useEffect(() => { setInputValue(value || ''); }, [value]);

  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = options.filter((opt) =>
    opt.toLowerCase().includes((inputValue || '').toLowerCase())
  );

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', position: 'relative' }}>
      {label && <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>{label}</label>}
      <div style={{
        display: 'flex', alignItems: 'center',
        border: `1px solid ${isOpen ? 'var(--color-primary)' : 'var(--color-border)'}`,
        borderRadius: 'var(--border-radius-sm)',
        backgroundColor: disabled ? 'var(--color-border-light)' : 'var(--color-surface)',
        opacity: disabled ? 0.6 : 1,
        overflow: 'hidden',
      }}>
        <input
          type="text"
          value={inputValue}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => {
            setInputValue(e.target.value);
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          style={{
            flex: 1, padding: '10px 16px', border: 'none', outline: 'none',
            fontSize: '14px', color: 'var(--color-text)', backgroundColor: 'transparent',
            fontFamily: 'var(--font-family)',
          }}
        />
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          style={{
            background: 'none', border: 'none', padding: '10px 12px', cursor: disabled ? 'not-allowed' : 'pointer',
            color: 'var(--color-text-light)', display: 'flex', alignItems: 'center',
          }}
        >
          <ChevronDown size={16} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
        </button>
      </div>
      {isOpen && filtered.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px',
          backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: 'var(--border-radius-sm)', boxShadow: 'var(--shadow-lg)',
          maxHeight: '200px', overflowY: 'auto', zIndex: 10,
        }}>
          {filtered.map((opt) => (
            <div
              key={opt}
              onClick={() => { onChange(opt); setInputValue(opt); setIsOpen(false); }}
              style={{
                padding: '10px 16px', cursor: 'pointer', fontSize: '14px',
                backgroundColor: value === opt ? 'var(--color-background)' : 'transparent',
                fontWeight: value === opt ? 600 : 400,
                borderBottom: '1px solid var(--color-border-light)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-background)'; }}
              onMouseLeave={(e) => { if (value !== opt) e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Helper: Calculate grade from mark
const getGrade = (mark) => {
  const m = parseFloat(mark) || 0;
  if (m >= 90) return 'A+';
  if (m >= 80) return 'A';
  if (m >= 70) return 'B';
  if (m >= 60) return 'C';
  if (m >= 50) return 'D';
  return 'F';
};

// Helper: Get grade badge variant
const getGradeVariant = (grade) => {
  if (grade === 'A+' || grade === 'A') return 'success';
  if (grade === 'F') return 'danger';
  return 'info';
};

const AssessmentRow = ({ record, onUpdated, onDeleted }) => {
  const [editing, setEditing] = useState(false);
  const [editMarks, setEditMarks] = useState(record.marks);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const newMarks = parseFloat(editMarks);
    if (isNaN(newMarks) || newMarks < 0 || newMarks > record.total_marks) {
      alert(`Marks must be between 0 and ${record.total_marks}`);
      return;
    }
    setSaving(true);
    try {
      const updated = await api.put(`/assessments/${record.id}`, { marks: newMarks });
      onUpdated(updated);
      setEditing(false);
    } catch (err) {
      alert(err.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditMarks(record.marks);
    setEditing(false);
  };

  const tdStyle = { padding: '12px 16px', fontSize: '14px', borderBottom: '1px solid var(--color-border-light)' };

  return (
    <tr>
      <td style={tdStyle}>
        <a href={`/student/${record.student_id}`} style={{ color: '#004493', textDecoration: 'none', fontWeight: 600 }}
          onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
          onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
        >{record.student_name}</a>
      </td>
      <td style={tdStyle}>
        {editing ? (
          <input
            type="number"
            value={editMarks}
            onChange={(e) => setEditMarks(e.target.value)}
            min="0"
            max={record.total_marks}
            style={{
              width: '80px', padding: '6px 10px', border: '1px solid var(--color-primary)',
              borderRadius: '6px', fontSize: '14px', outline: 'none', fontFamily: 'var(--font-family)',
            }}
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel(); }}
          />
        ) : (
          `${record.marks}/${record.total_marks}`
        )}
      </td>
      <td style={tdStyle}>
        <Badge variant={getGradeVariant(record.grade)}>{record.grade}</Badge>
      </td>
      <td style={{ ...tdStyle, textAlign: 'right' }}>
        {editing ? (
          <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
            <button
              onClick={handleSave}
              disabled={saving}
              title="Save"
              style={{
                background: 'none', border: '1px solid #059669', borderRadius: '6px',
                cursor: 'pointer', padding: '5px 8px', color: '#059669', display: 'flex', alignItems: 'center',
              }}
            >
              <Check size={14} />
            </button>
            <button
              onClick={handleCancel}
              title="Cancel"
              style={{
                background: 'none', border: '1px solid var(--color-border)', borderRadius: '6px',
                cursor: 'pointer', padding: '5px 8px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center',
              }}
            >
              <XIcon size={14} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setEditing(true)}
              title="Edit marks"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--color-text-secondary)', padding: '6px', borderRadius: '6px',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-border-light)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={async () => {
                if (!window.confirm(`Delete ${record.student_name}'s marks?`)) return;
                try {
                  await api.delete(`/assessments/${record.id}`);
                  onDeleted(record.id);
                } catch (err) {
                  alert(err.message || 'Failed to delete');
                }
              }}
              title="Delete"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--color-text-secondary)', padding: '6px', borderRadius: '6px',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#DC2626'; e.currentTarget.style.backgroundColor = '#FEF2F2'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-secondary)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </td>
    </tr>
  );
};

const Assessments = () => {
  const { user, isAdmin } = useAuth();
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [examType, setExamType] = useState('Midterm');
  const [totalMarks, setTotalMarks] = useState(100);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({});
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [classAverage, setClassAverage] = useState(0);
  const [passRate, setPassRate] = useState(0);
  const [weakStudents, setWeakStudents] = useState([]);
  const [studentFilter, setStudentFilter] = useState('');
  const [examTypeOptions, setExamTypeOptions] = useState(['Midterm', 'Final', 'Quiz', 'Assignment', 'Unit Test', 'Half Yearly', 'Annual']);

  useEffect(() => {
    api.get('/classes').then((data) => setClasses(data || [])).catch((e) => console.error('Failed to fetch classes:', e));
    // Fetch saved exam types and merge with defaults
    api.get('/assessments/exam-types').then((data) => {
      const defaults = ['Midterm', 'Final', 'Quiz', 'Assignment', 'Unit Test', 'Half Yearly', 'Annual'];
      const all = [...new Set([...defaults, ...(data || [])])];
      setExamTypeOptions(all);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    api.get(`/classes/${selectedClass}/subjects`)
      .then((data) => {
        setSubjects(data || []);
        setSelectedSubject('');
      })
      .catch((e) => console.error('Failed to fetch subjects:', e));
  }, [selectedClass]);

  // Fetch students and all assessments when class changes
  useEffect(() => {
    if (!selectedClass) return;
    setLoading(true);
    Promise.all([
      api.get(`/classes/${selectedClass}/students`),
      api.get(`/assessments?class=${selectedClass}`),
    ])
      .then(([studentsData, assessmentsData]) => {
        setStudents(studentsData || []);
        setAssessments(assessmentsData || []);
        setMarks({});
      })
      .catch((e) => console.error('Failed to fetch data:', e))
      .finally(() => setLoading(false));
  }, [selectedClass]);

  // Re-fetch assessments filtered by subject when subject changes
  useEffect(() => {
    if (!selectedClass) return;
    const url = selectedSubject
      ? `/assessments?class=${selectedClass}&subject=${selectedSubject}`
      : `/assessments?class=${selectedClass}`;
    api.get(url)
      .then((data) => setAssessments(data || []))
      .catch((e) => console.error('Failed to fetch assessments:', e));
  }, [selectedSubject]);

  useEffect(() => {
    const markValues = Object.values(marks).filter(v => v !== '' && v !== undefined).map(m => parseFloat(m)).filter(m => !isNaN(m) && m > 0);
    if (markValues.length === 0) { setClassAverage(0); setPassRate(0); setWeakStudents([]); return; }
    const percentages = markValues.map(m => (m / totalMarks) * 100);
    const avg = (percentages.reduce((a, b) => a + b, 0) / percentages.length).toFixed(2);
    const pass = ((percentages.filter((p) => p >= 40).length / percentages.length) * 100).toFixed(1);
    setClassAverage(avg);
    setPassRate(pass);
    setWeakStudents(students.filter((s) => {
      const m = parseFloat(marks[s.id]);
      return !isNaN(m) && m > 0 && (m / totalMarks) * 100 < 40;
    }));
  }, [marks, students, totalMarks]);

  const handleSubmitMarks = async () => {
    if (Object.keys(marks).length === 0) {
      alert('Please enter marks for at least one student');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/assessments', {
        subject: selectedSubject,
        total_marks: totalMarks,
        exam_type: examType,
        date: new Date().toISOString().split('T')[0],
        assessment_data: Object.entries(marks)
          .filter(([, mark]) => mark !== '' && mark !== undefined && !isNaN(parseFloat(mark)) && parseFloat(mark) > 0)
          .map(([studentId, mark]) => ({
            student_id: parseInt(studentId),
            marks: parseFloat(mark),
          })),
      });
      setMarks({});
      setShowSubmitModal(false);
      alert('Marks submitted successfully');
      const [assessData, typesData] = await Promise.all([
        api.get(`/assessments?class=${selectedClass}&subject=${selectedSubject}`),
        api.get('/assessments/exam-types'),
      ]);
      setAssessments(assessData || []);
      const defaults = ['Midterm', 'Final', 'Quiz', 'Assignment', 'Unit Test', 'Half Yearly', 'Annual'];
      setExamTypeOptions([...new Set([...defaults, ...(typesData || [])])]);
    } catch (error) {
      console.error('Failed to submit marks:', error);
      alert('Failed to submit marks');
    } finally {
      setSubmitting(false);
    }
  };

  const containerStyles = { padding: '24px', width: '100%' };
  const headerStyles = { marginBottom: '32px' };
  const titleStyles = { fontSize: '28px', fontWeight: 700, color: 'var(--color-text)', margin: '0 0 8px 0' };
  const subtitleStyles = { fontSize: '14px', color: 'var(--color-text-light)', margin: 0 };
  const selectorsStyles = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' };
  const gridStyles = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' };
  const sectionStyles = { marginTop: '32px' };
  const sectionTitleStyles = { fontSize: '18px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' };
  const tableContainerStyles = { overflowX: 'auto' };
  const marksInputStyles = { width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)', fontSize: '14px', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' };
  const weakStudentRowStyles = { backgroundColor: '#FFF3CD' };
  const assessmentTableContainerStyles = { marginTop: '16px' };

  return (
    <div style={containerStyles}>
      <div style={headerStyles}>
        <h1 style={titleStyles}>Student Assessments</h1>
        <p style={subtitleStyles}>Manage marks and track student performance</p>
      </div>

      {/* Selectors */}
      <div style={selectorsStyles}>
        <Select
          label="Class"
          value={selectedClass}
          onChange={setSelectedClass}
          placeholder="Select Class"
          options={classes.map((cls) => ({ label: cls.name, value: cls.id }))}
        />

        <ComboBox
          label="Subject"
          value={selectedSubject}
          onChange={setSelectedSubject}
          disabled={!selectedClass}
          placeholder="Select or type a subject"
          options={subjects}
        />

        <ComboBox
          label="Exam Type"
          value={examType}
          onChange={setExamType}
          placeholder="Select or type exam type"
          options={examTypeOptions}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
          <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>Total Marks</label>
          <select
            value={totalMarks}
            onChange={(e) => setTotalMarks(parseInt(e.target.value))}
            style={{ padding: '10px 16px', fontSize: '14px', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)', cursor: 'pointer', appearance: 'none' }}
          >
            {[25, 50, 80, 100].map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
      </div>

      {/* Performance Summary */}
      {Object.keys(marks).length > 0 && (
        <div style={gridStyles}>
          <StatCard
            icon={TrendingUp}
            label="Class Average"
            value={`${classAverage}%`}
            trend="up"
            trendValue={`${passRate}% pass rate`}
          />
          <StatCard
            label="Total Students"
            value={Object.keys(marks).length}
          />
          <StatCard
            label="Students Below 40%"
            value={weakStudents.length}
            variant="warning"
          />
        </div>
      )}

      {/* Marks Entry Table */}
      {selectedClass && selectedSubject && (
        <Card header="Enter Marks" style={{ marginBottom: '32px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-light)' }}>
              Loading...
            </div>
          ) : students.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-light)' }}>
              No students found for this class
            </div>
          ) : (
            <>
              <div style={tableContainerStyles}>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                  }}
                >
                  <thead>
                    <tr style={{ backgroundColor: 'var(--color-background)' }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: 600 }}>
                        Roll No
                      </th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: 600 }}>
                        Name
                      </th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: 600 }}>
                        Marks (out of {totalMarks})
                      </th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: 600 }}>
                        Grade
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => {
                      const rawMark = marks[student.id];
                      const mark = rawMark !== '' && rawMark !== undefined ? parseFloat(rawMark) : 0;
                      const hasMark = rawMark !== '' && rawMark !== undefined && !isNaN(mark);
                      const pct = hasMark && totalMarks > 0 ? (mark / totalMarks) * 100 : 0;
                      const grade = getGrade(pct);
                      const isWeak = hasMark && pct < 40 && mark > 0;
                      return (
                        <tr key={student.id} style={{ borderBottom: '1px solid var(--color-border-light)', ...(isWeak && weakStudentRowStyles) }}>
                          <td style={{ padding: '12px', fontSize: '14px' }}>{student.roll_number || '-'}</td>
                          <td style={{ padding: '12px', fontSize: '14px' }}>{student.name}</td>
                          <td style={{ padding: '12px' }}>
                            <input
                              type="number"
                              min="0"
                              max={totalMarks}
                              value={marks[student.id] ?? ''}
                              onChange={(e) => {
                                const raw = e.target.value;
                                if (raw === '') {
                                  setMarks((prev) => ({ ...prev, [student.id]: '' }));
                                } else {
                                  const v = Math.max(0, Math.min(totalMarks, parseFloat(raw)));
                                  setMarks((prev) => ({ ...prev, [student.id]: isNaN(v) ? '' : v }));
                                }
                              }}
                              placeholder="0"
                              style={marksInputStyles}
                            />
                          </td>
                          <td style={{ padding: '12px' }}>
                            {hasMark && mark > 0 && <Badge variant={getGradeVariant(grade)}>{grade}</Badge>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Weak Students Alert */}
              {weakStudents.length > 0 && (
                <div
                  style={{
                    marginTop: '20px',
                    padding: '12px 16px',
                    backgroundColor: '#FFF3CD',
                    border: '1px solid #FFEAA7',
                    borderRadius: 'var(--border-radius-sm)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                  }}
                >
                  <AlertCircle size={20} style={{ color: '#856404', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontWeight: 600, color: '#856404', marginBottom: '4px' }}>
                      {weakStudents.length} Student(s) Below 40%
                    </div>
                    <div style={{ fontSize: '13px', color: '#856404' }}>
                      {weakStudents.map((s) => s.name).join(', ')}
                    </div>
                  </div>
                </div>
              )}

              <div style={{ marginTop: '20px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <Button
                  variant="secondary"
                  onClick={() => setMarks({})}
                >
                  Clear All
                </Button>
                <Button
                  onClick={() => setShowSubmitModal(true)}
                  disabled={Object.keys(marks).length === 0}
                >
                  Submit Marks
                </Button>
              </div>
            </>
          )}
        </Card>
      )}

      {/* Existing Assessments */}
      {selectedClass && (
        <div style={sectionStyles}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <h2 style={{ ...sectionTitleStyles, marginBottom: 0 }}>
              <TrendingUp size={20} />
              Assessment History {selectedSubject ? `— ${selectedSubject}` : '(All Subjects)'}
            </h2>
            <input
              type="text"
              placeholder="Filter by student name..."
              value={studentFilter}
              onChange={(e) => setStudentFilter(e.target.value)}
              style={{ padding: '8px 14px', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '13px', fontFamily: 'var(--font-family)', color: 'var(--color-text)', outline: 'none', minWidth: '200px' }}
            />
          </div>
          {assessments.length === 0 ? (
            <Card>
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-light)' }}>
                No assessments recorded yet
              </div>
            </Card>
          ) : (
            <div style={assessmentTableContainerStyles}>
              {Object.entries(
                assessments.reduce((groups, a) => {
                  // Filter by student name
                  if (studentFilter && !a.student_name?.toLowerCase().includes(studentFilter.toLowerCase())) return groups;
                  const key = `${a.exam_type || 'exam'}-${a.subject || ''}-${a.date || 'unknown'}`;
                  if (!groups[key]) groups[key] = { exam_type: a.exam_type, date: a.date, subject: a.subject, records: [] };
                  groups[key].records.push(a);
                  return groups;
                }, {})
              ).map(([key, group]) => {
                const markValues = group.records.map((r) => (r.marks / r.total_marks) * 100);
                const avg = markValues.length > 0 ? (markValues.reduce((a, b) => a + b, 0) / markValues.length) : 0;
                const passRate = markValues.length > 0 ? (markValues.filter((m) => m >= 40).length / markValues.length) * 100 : 0;
                return (
                  <Card key={key} style={{ marginBottom: '16px' }}>
                    <div style={{ marginBottom: '12px' }}>
                      <h3 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 700, color: 'var(--color-text)' }}>
                        <span style={{ textTransform: 'capitalize' }}>{group.exam_type || 'Exam'}</span> — {group.subject || ''} — {group.date ? new Date(group.date).toLocaleDateString() : ''}
                      </h3>
                      <div style={{ fontSize: '13px', color: 'var(--color-text-light)' }}>
                        Average: <strong>{avg.toFixed(1)}%</strong> | Pass Rate: <strong>{passRate.toFixed(1)}%</strong>
                      </div>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                            <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Student</th>
                            <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Marks</th>
                            <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Grade</th>
                            <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.records.map((record) => (
                            <AssessmentRow key={record.id} record={record}
                              onUpdated={(updated) => {
                                setAssessments(assessments.map((a) => a.id === updated.id ? { ...a, marks: updated.marks, total_marks: updated.total_marks, grade: updated.grade } : a));
                              }}
                              onDeleted={(id) => {
                                setAssessments(assessments.filter((a) => a.id !== id));
                              }}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Submit Modal */}
      <Modal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title="Confirm Marks Submission"
        size="sm"
        footer={
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <Button
              variant="secondary"
              onClick={() => setShowSubmitModal(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitMarks}
              loading={submitting}
            >
              Submit Marks
            </Button>
          </div>
        }
      >
        <div style={{ marginBottom: '16px' }}>
          <p style={{ marginBottom: '12px' }}>
            You are about to submit marks for <strong>{Object.keys(marks).length}</strong> students.
          </p>
          <p style={{ fontSize: '13px', color: 'var(--color-text-light)' }}>
            Exam Type: <strong>{examType.charAt(0).toUpperCase() + examType.slice(1)}</strong>
          </p>
          <p style={{ fontSize: '13px', color: 'var(--color-text-light)' }}>
            Class Average: <strong>{classAverage}%</strong>
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default Assessments;

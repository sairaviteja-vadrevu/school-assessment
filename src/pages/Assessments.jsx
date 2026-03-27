import React, { useState, useEffect } from 'react';
import { AlertCircle, TrendingUp } from 'lucide-react';
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
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

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

const Assessments = () => {
  const { user } = useAuth();
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [examType, setExamType] = useState('midterm');
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

  useEffect(() => {
    api.get('/classes').then((data) => setClasses(data || [])).catch((e) => console.error('Failed to fetch classes:', e));
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

  useEffect(() => {
    if (!selectedClass || !selectedSubject) return;
    setLoading(true);
    Promise.all([
      api.get(`/classes/${selectedClass}/students`),
      api.get(`/assessments?class=${selectedClass}&subject=${selectedSubject}`),
    ])
      .then(([studentsData, assessmentsData]) => {
        setStudents(studentsData || []);
        setAssessments(assessmentsData || []);
        setMarks({});
      })
      .catch((e) => console.error('Failed to fetch data:', e))
      .finally(() => setLoading(false));
  }, [selectedClass, selectedSubject]);

  useEffect(() => {
    if (Object.keys(marks).length === 0) return;
    const markValues = Object.values(marks).map((m) => parseFloat(m)).filter((m) => !isNaN(m));
    if (markValues.length === 0) return;
    const avg = (markValues.reduce((a, b) => a + b, 0) / markValues.length).toFixed(2);
    const pass = ((markValues.filter((m) => m >= 40).length / markValues.length) * 100).toFixed(1);
    setClassAverage(avg);
    setPassRate(pass);
    setWeakStudents(students.filter((s) => {
      const m = parseFloat(marks[s.id]);
      return !isNaN(m) && m < 40;
    }));
  }, [marks, students]);

  const handleSubmitMarks = async () => {
    if (Object.keys(marks).length === 0) {
      alert('Please enter marks for at least one student');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/assessments', {
        class: selectedClass,
        subject: selectedSubject,
        examType,
        marks: Object.entries(marks).map(([studentId, mark]) => ({
          studentId,
          mark: parseFloat(mark),
        })),
      });
      setMarks({});
      setShowSubmitModal(false);
      alert('Marks submitted successfully');
      const data = await api.get(`/assessments?class=${selectedClass}&subject=${selectedSubject}`);
      setAssessments(data || []);
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
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          placeholder="Select Class"
        >
          {classes.map((cls) => (
            <option key={cls.id} value={cls.id}>
              {cls.name}
            </option>
          ))}
        </Select>

        <Select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          disabled={!selectedClass}
          placeholder="Select Subject"
        >
          {subjects.map((subj) => (
            <option key={subj.id} value={subj.id}>
              {subj.name}
            </option>
          ))}
        </Select>

        <Select
          value={examType}
          onChange={(e) => setExamType(e.target.value)}
          placeholder="Exam Type"
        >
          <option value="midterm">Midterm</option>
          <option value="final">Final</option>
          <option value="quiz">Quiz</option>
          <option value="assignment">Assignment</option>
        </Select>
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
                        Marks (out of 100)
                      </th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: 600 }}>
                        Grade
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => {
                      const mark = parseFloat(marks[student.id]) || 0;
                      const grade = getGrade(mark);
                      const isWeak = mark < 40 && mark > 0;
                      return (
                        <tr key={student.id} style={{ borderBottom: '1px solid var(--color-border-light)', ...(isWeak && weakStudentRowStyles) }}>
                          <td style={{ padding: '12px', fontSize: '14px' }}>{student.rollNo || '-'}</td>
                          <td style={{ padding: '12px', fontSize: '14px' }}>{student.name}</td>
                          <td style={{ padding: '12px' }}>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={marks[student.id] || ''}
                              onChange={(e) => {
                                const v = Math.max(0, Math.min(100, parseFloat(e.target.value) || 0));
                                setMarks((prev) => ({ ...prev, [student.id]: v }));
                              }}
                              placeholder="0"
                              style={marksInputStyles}
                            />
                          </td>
                          <td style={{ padding: '12px' }}>
                            {mark > 0 && <Badge variant={getGradeVariant(grade)}>{grade}</Badge>}
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
      {selectedClass && selectedSubject && (
        <div style={sectionStyles}>
          <h2 style={sectionTitleStyles}>
            <TrendingUp size={20} />
            Assessment History
          </h2>
          {assessments.length === 0 ? (
            <Card>
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-light)' }}>
                No assessments recorded yet
              </div>
            </Card>
          ) : (
            <div style={assessmentTableContainerStyles}>
              {assessments.map((assessment, idx) => (
                <Card key={idx} header={`${assessment.examType.toUpperCase()} - ${assessment.date}`} style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-light)', marginBottom: '12px' }}>
                    Average: <strong>{assessment.average?.toFixed(2) || 0}%</strong> | Pass Rate: <strong>{assessment.passRate?.toFixed(1) || 0}%</strong>
                  </div>
                  <Table columns={[{ key: 'studentName', label: 'Student' }, { key: 'mark', label: 'Marks', render: (m) => `${m}/100` }, { key: 'grade', label: 'Grade', render: (_, row) => <Badge variant={getGradeVariant(getGrade(row.mark))}>{getGrade(row.mark)}</Badge> }]} data={assessment.marks || []} sortable />
                </Card>
              ))}
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

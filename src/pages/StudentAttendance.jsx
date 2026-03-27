import React, { useState, useEffect } from 'react';
import { Check, X, Clock } from 'lucide-react';
import { Button, Card, Table, Input, Select, Badge } from '../components';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const StudentAttendance = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const attendanceStatusOptions = ['present', 'absent', 'late'];

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchStudents(selectedClass);
      fetchAttendanceHistory(selectedClass);
    }
  }, [selectedClass, selectedDate]);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const data = await api.get('/classes');
      setClasses(data || []);
      if (data?.length > 0) {
        setSelectedClass(data[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async (classId) => {
    try {
      const data = await api.get(`/classes/${classId}/students`);
      setStudents(data || []);
      const initialAttendance = {};
      data?.forEach((student) => {
        initialAttendance[student.id] = 'present';
      });
      setAttendance(initialAttendance);
    } catch (error) {
      console.error('Failed to fetch students:', error);
    }
  };

  const fetchAttendanceHistory = async (classId) => {
    try {
      const data = await api.get(
        `/attendance/students/history?classId=${classId}&date=${selectedDate}`
      );
      setAttendanceHistory(data || []);
    } catch (error) {
      console.error('Failed to fetch attendance history:', error);
    }
  };

  const handleAttendanceChange = (studentId, status) => {
    setAttendance({
      ...attendance,
      [studentId]: status,
    });
  };

  const handleMarkAllPresent = () => {
    const allPresent = {};
    students.forEach((student) => {
      allPresent[student.id] = 'present';
    });
    setAttendance(allPresent);
  };

  const handleSubmitAttendance = async () => {
    if (!selectedClass) return;

    try {
      setSubmitting(true);
      const attendanceData = students.map((student) => ({
        studentId: student.id,
        status: attendance[student.id] || 'present',
        date: selectedDate,
      }));

      await api.post(`/attendance/submit`, {
        classId: selectedClass,
        date: selectedDate,
        attendance: attendanceData,
      });

      // Refresh history
      await fetchAttendanceHistory(selectedClass);
      alert('Attendance submitted successfully!');
    } catch (error) {
      console.error('Failed to submit attendance:', error);
      alert('Failed to submit attendance');
    } finally {
      setSubmitting(false);
    }
  };

  const containerStyles = {
    padding: '24px',
    backgroundColor: 'var(--color-background)',
    minHeight: '100vh',
  };

  const titleStyles = {
    fontSize: '28px',
    fontWeight: 700,
    margin: '0 0 24px 0',
    color: 'var(--color-text)',
  };

  const gridStyles = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginBottom: '24px',
  };

  const controlsStyles = {
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-end',
    marginBottom: '24px',
    flexWrap: 'wrap',
  };

  const inputWrapper = {
    minWidth: '200px',
  };

  const buttonsGroupStyles = {
    display: 'flex',
    gap: '8px',
  };

  const studentTableStyles = {
    marginBottom: '24px',
  };

  const studentRowStyles = (status) => ({
    display: 'flex',
    alignItems: 'center',
    padding: '12px',
    borderRadius: 'var(--border-radius-sm)',
    marginBottom: '8px',
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    gap: '12px',
  });

  const studentNameStyles = {
    flex: 1,
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--color-text)',
  };

  const statusButtonGroupStyles = {
    display: 'flex',
    gap: '4px',
  };

  const statusButtonStyles = (isActive, type) => ({
    padding: '6px 12px',
    borderRadius: 'var(--border-radius-sm)',
    border: isActive ? '2px solid' : '1px solid var(--color-border)',
    backgroundColor: isActive ? getStatusColor(type) : 'transparent',
    color: isActive ? 'white' : 'var(--color-text)',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: 600,
    transition: 'var(--transition)',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    borderColor: isActive ? getStatusColor(type) : 'var(--color-border)',
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'present':
        return '#28A745';
      case 'absent':
        return '#DC3545';
      case 'late':
        return '#FFC107';
      default:
        return '#6C757D';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present':
        return Check;
      case 'absent':
        return X;
      case 'late':
        return Clock;
      default:
        return null;
    }
  };

  const sectionTitleStyles = {
    fontSize: '18px',
    fontWeight: 600,
    marginBottom: '12px',
    color: 'var(--color-text)',
  };

  const absenteeSectionStyles = {
    padding: '16px',
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--border-radius)',
    border: '1px solid var(--color-border)',
  };

  const absenteeListStyles = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  };

  const absenteeItemStyles = {
    padding: '8px 12px',
    backgroundColor: '#F8D7DA',
    color: '#721C24',
    borderRadius: 'var(--border-radius-sm)',
    fontSize: '13px',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  if (loading) {
    return (
      <div style={containerStyles}>
        <h1 style={titleStyles}>Student Attendance</h1>
        <div style={{ color: 'var(--color-text-light)' }}>Loading...</div>
      </div>
    );
  }

  const absentStudents = students.filter((s) => attendance[s.id] === 'absent');
  const lateStudents = students.filter((s) => attendance[s.id] === 'late');
  const presentStudents = students.filter((s) => attendance[s.id] === 'present');

  const classOptions = classes.map((cls) => ({
    value: cls.id,
    label: `${cls.name} (${cls.section || 'N/A'})`,
  }));

  return (
    <div style={containerStyles}>
      <h1 style={titleStyles}>Student Attendance</h1>

      {/* Controls */}
      <div style={controlsStyles}>
        <div style={inputWrapper}>
          <Select
            label="Select Class"
            options={classOptions}
            value={selectedClass}
            onChange={setSelectedClass}
          />
        </div>
        <div style={inputWrapper}>
          <Input
            type="date"
            label="Date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
        <div style={buttonsGroupStyles}>
          <Button
            variant="secondary"
            size="md"
            onClick={handleMarkAllPresent}
          >
            Mark All Present
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleSubmitAttendance}
            loading={submitting}
          >
            Submit Attendance
          </Button>
        </div>
      </div>

      {students.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-light)' }}>
            No students found for this class
          </div>
        </Card>
      ) : (
        <>
          {/* Students List */}
          <div style={studentTableStyles}>
            <h2 style={sectionTitleStyles}>
              Mark Attendance ({students.length} students)
            </h2>
            <div>
              {students.map((student) => (
                <div key={student.id} style={studentRowStyles(attendance[student.id])}>
                  <div style={studentNameStyles}>
                    <div style={{ fontWeight: 600 }}>{student.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-light)' }}>
                      Roll No: {student.rollNumber}
                    </div>
                  </div>
                  <div style={statusButtonGroupStyles}>
                    {attendanceStatusOptions.map((status) => {
                      const Icon = getStatusIcon(status);
                      const isActive = attendance[student.id] === status;
                      return (
                        <button
                          key={status}
                          style={statusButtonStyles(isActive, status)}
                          onClick={() => handleAttendanceChange(student.id, status)}
                          title={status}
                        >
                          {Icon && <Icon size={14} />}
                          <span style={{ textTransform: 'capitalize' }}>
                            {status[0].toUpperCase()}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '24px' }}>
            <Card>
              <div style={{ textAlign: 'center', padding: '8px' }}>
                <div style={{ fontSize: '12px', color: 'var(--color-text-light)', marginBottom: '4px' }}>
                  Present
                </div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#28A745' }}>
                  {presentStudents.length}
                </div>
              </div>
            </Card>
            <Card>
              <div style={{ textAlign: 'center', padding: '8px' }}>
                <div style={{ fontSize: '12px', color: 'var(--color-text-light)', marginBottom: '4px' }}>
                  Absent
                </div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#DC3545' }}>
                  {absentStudents.length}
                </div>
              </div>
            </Card>
            <Card>
              <div style={{ textAlign: 'center', padding: '8px' }}>
                <div style={{ fontSize: '12px', color: 'var(--color-text-light)', marginBottom: '4px' }}>
                  Late
                </div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#FFC107' }}>
                  {lateStudents.length}
                </div>
              </div>
            </Card>
          </div>

          {/* Absentee Summary */}
          {absentStudents.length > 0 && (
            <div style={absenteeSectionStyles}>
              <h2 style={sectionTitleStyles}>Absent Students Summary</h2>
              <div style={absenteeListStyles}>
                {absentStudents.map((student) => (
                  <div key={student.id} style={absenteeItemStyles}>
                    <X size={16} />
                    <span>{student.name}</span>
                    <span style={{ fontSize: '11px', marginLeft: 'auto' }}>
                      Roll: {student.rollNumber}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attendance History */}
          {attendanceHistory.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <h2 style={sectionTitleStyles}>Recent Attendance History</h2>
              <div style={{ overflowX: 'auto' }}>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    backgroundColor: 'var(--color-surface)',
                    borderRadius: 'var(--border-radius)',
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow-md)',
                  }}
                >
                  <thead
                    style={{
                      backgroundColor: 'var(--color-background)',
                      borderBottom: '2px solid var(--color-border)',
                    }}
                  >
                    <tr>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, fontSize: '13px' }}>
                        Date
                      </th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, fontSize: '13px' }}>
                        Present
                      </th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, fontSize: '13px' }}>
                        Absent
                      </th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, fontSize: '13px' }}>
                        Late
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceHistory.map((record, idx) => (
                      <tr
                        key={idx}
                        style={{
                          borderBottom: '1px solid var(--color-border-light)',
                        }}
                      >
                        <td style={{ padding: '12px', fontSize: '13px' }}>
                          {new Date(record.date).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '12px', fontSize: '13px', color: '#28A745' }}>
                          {record.presentCount}
                        </td>
                        <td style={{ padding: '12px', fontSize: '13px', color: '#DC3545' }}>
                          {record.absentCount}
                        </td>
                        <td style={{ padding: '12px', fontSize: '13px', color: '#FFC107' }}>
                          {record.lateCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StudentAttendance;

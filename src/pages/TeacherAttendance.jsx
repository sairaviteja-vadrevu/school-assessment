import React, { useState, useEffect } from 'react';
import { LogIn, LogOut, Calendar } from 'lucide-react';
import { Button, Card, Table, Input, StatCard } from '../components';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const TeacherAttendance = () => {
  const { user, isAdmin } = useAuth();
  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [todayStatus, setTodayStatus] = useState(null);
  const [monthlyStats, setMonthlyStats] = useState(null);
  const [allTeachersAttendance, setAllTeachersAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  useEffect(() => {
    if (isAdmin) {
      fetchAdminAttendance();
    } else {
      fetchTeacherAttendance();
    }
  }, [isAdmin, selectedDate]);

  const fetchTeacherAttendance = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const [todayData, monthlyData] = await Promise.all([
        api.get(`/attendance/teacher/today`),
        api.get('/attendance/teacher/monthly'),
      ]);
      setTodayStatus(todayData);
      setMonthlyStats(monthlyData);
    } catch (error) {
      console.error('Failed to fetch teacher attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminAttendance = async () => {
    try {
      setLoading(true);
      const data = await api.get(`/attendance/teachers?date=${selectedDate}`);
      setAllTeachersAttendance(data || []);
    } catch (error) {
      console.error('Failed to fetch admin attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      setCheckingIn(true);
      const result = await api.post('/attendance/teacher/check-in', {});
      setTodayStatus(result);
    } catch (error) {
      console.error('Failed to check in:', error);
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setCheckingIn(true);
      const result = await api.post('/attendance/teacher/check-out', {});
      setTodayStatus(result);
    } catch (error) {
      console.error('Failed to check out:', error);
    } finally {
      setCheckingIn(false);
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  };

  const sectionStyles = {
    marginBottom: '32px',
  };

  const sectionTitleStyles = {
    fontSize: '20px',
    fontWeight: 600,
    marginBottom: '16px',
    color: 'var(--color-text)',
  };

  const statusCardStyles = {
    padding: '24px',
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--border-radius)',
    border: '1px solid var(--color-border)',
    textAlign: 'center',
  };

  const statusLabelStyles = {
    fontSize: '14px',
    color: 'var(--color-text-light)',
    marginBottom: '8px',
  };

  const statusValueStyles = {
    fontSize: '24px',
    fontWeight: 700,
    color: 'var(--color-primary)',
    marginBottom: '16px',
  };

  const buttonGroupStyles = {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
  };

  const dateInputStyles = {
    marginBottom: '16px',
    maxWidth: '200px',
  };

  const statsContainerStyles = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '12px',
  };

  const calendarGridStyles = {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '8px',
    padding: '16px',
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--border-radius)',
    border: '1px solid var(--color-border)',
  };

  const calendarDayStyles = (status) => ({
    padding: '8px',
    textAlign: 'center',
    borderRadius: 'var(--border-radius-sm)',
    fontSize: '12px',
    fontWeight: 600,
    backgroundColor: status === 'present' ? '#D4EDDA' : status === 'absent' ? '#F8D7DA' : 'var(--color-border-light)',
    color: status === 'present' ? '#155724' : status === 'absent' ? '#721C24' : 'var(--color-text)',
    border: '1px solid',
    borderColor: status === 'present' ? '#C3E6CB' : status === 'absent' ? '#F5C6CB' : 'var(--color-border)',
  });

  // Teacher View
  if (!isAdmin) {
    if (loading) {
      return (
        <div style={containerStyles}>
          <h1 style={titleStyles}>Teacher Attendance</h1>
          <div style={{ color: 'var(--color-text-light)' }}>Loading...</div>
        </div>
      );
    }

    return (
      <div style={containerStyles}>
        <h1 style={titleStyles}>My Attendance</h1>

        {/* Today's Status Section */}
        <div style={sectionStyles}>
          <h2 style={sectionTitleStyles}>Today's Status</h2>
          <div style={statusCardStyles}>
            <div style={statusLabelStyles}>Current Status</div>
            <div style={statusValueStyles}>
              {todayStatus?.checkedInAt && !todayStatus?.checkedOutAt
                ? 'Checked In'
                : todayStatus?.checkedOutAt
                ? 'Checked Out'
                : 'Not Checked In'}
            </div>

            {todayStatus?.checkedInAt && (
              <div style={{ marginBottom: '12px', fontSize: '12px', color: 'var(--color-text-light)' }}>
                Checked in at {new Date(todayStatus.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}

            <div style={buttonGroupStyles}>
              {!todayStatus?.checkedInAt ? (
                <Button
                  variant="primary"
                  icon={LogIn}
                  loading={checkingIn}
                  onClick={handleCheckIn}
                >
                  Check In
                </Button>
              ) : !todayStatus?.checkedOutAt ? (
                <Button
                  variant="danger"
                  icon={LogOut}
                  loading={checkingIn}
                  onClick={handleCheckOut}
                >
                  Check Out
                </Button>
              ) : (
                <div style={{ fontSize: '12px', color: 'var(--color-text-light)' }}>
                  Checked out at {new Date(todayStatus.checkedOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Monthly Statistics */}
        {monthlyStats && (
          <div style={sectionStyles}>
            <h2 style={sectionTitleStyles}>Monthly Summary</h2>
            <div style={statsContainerStyles}>
              <StatCard
                label="Present"
                value={monthlyStats.presentDays || 0}
                variant="success"
              />
              <StatCard
                label="Absent"
                value={monthlyStats.absentDays || 0}
                variant="danger"
              />
              <StatCard
                label="Late"
                value={monthlyStats.lateDays || 0}
                variant="warning"
              />
              <StatCard
                label="On Time"
                value={monthlyStats.onTimeDays || 0}
                variant="info"
              />
            </div>
          </div>
        )}

        {/* Monthly Calendar */}
        {monthlyStats?.calendar && (
          <div style={sectionStyles}>
            <h2 style={sectionTitleStyles}>Attendance Calendar</h2>
            <div style={{ ...calendarGridStyles, backgroundColor: 'var(--color-background)', border: 'none', padding: '0' }}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} style={{ ...calendarDayStyles(), backgroundColor: 'var(--color-surface)' }}>
                  {day}
                </div>
              ))}
            </div>
            <div style={calendarGridStyles}>
              {monthlyStats.calendar.map((day, idx) => (
                <div key={idx} style={calendarDayStyles(day.status)}>
                  {day.date}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Admin View
  if (loading) {
    return (
      <div style={containerStyles}>
        <h1 style={titleStyles}>Teacher Attendance Overview</h1>
        <div style={{ color: 'var(--color-text-light)' }}>Loading...</div>
      </div>
    );
  }

  const presentCount = allTeachersAttendance.filter((t) => t.status === 'present').length;
  const absentCount = allTeachersAttendance.filter((t) => t.status === 'absent').length;
  const lateCount = allTeachersAttendance.filter((t) => t.status === 'late').length;

  const columns = [
    { key: 'name', label: 'Teacher Name', sortable: true },
    { key: 'department', label: 'Department', sortable: true },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => {
        const statusColors = {
          present: '#D4EDDA',
          absent: '#F8D7DA',
          late: '#FFF3CD',
        };
        const statusTexts = {
          present: '#155724',
          absent: '#721C24',
          late: '#856404',
        };
        return (
          <span
            style={{
              backgroundColor: statusColors[value] || 'transparent',
              color: statusTexts[value] || 'inherit',
              padding: '4px 8px',
              borderRadius: 'var(--border-radius-sm)',
              fontSize: '12px',
              fontWeight: 600,
              textTransform: 'capitalize',
            }}
          >
            {value}
          </span>
        );
      },
    },
    {
      key: 'checkInTime',
      label: 'Check In Time',
      sortable: true,
      render: (value) => (value ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'),
    },
    {
      key: 'checkOutTime',
      label: 'Check Out Time',
      sortable: true,
      render: (value) => (value ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'),
    },
  ];

  return (
    <div style={containerStyles}>
      <h1 style={titleStyles}>Teacher Attendance Overview</h1>

      {/* Date Picker */}
      <div style={dateInputStyles}>
        <Input
          type="date"
          label="Select Date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      </div>

      {/* Statistics */}
      <div style={gridStyles}>
        <StatCard label="Present" value={presentCount} variant="success" />
        <StatCard label="Absent" value={absentCount} variant="danger" />
        <StatCard label="Late" value={lateCount} variant="warning" />
        <StatCard
          label="Total"
          value={allTeachersAttendance.length}
          variant="info"
        />
      </div>

      {/* Attendance Table */}
      <div style={sectionStyles}>
        <h2 style={sectionTitleStyles}>Detailed Attendance</h2>
        <Table
          columns={columns}
          data={allTeachersAttendance}
          emptyMessage="No attendance records for this date"
        />
      </div>
    </div>
  );
};

export default TeacherAttendance;

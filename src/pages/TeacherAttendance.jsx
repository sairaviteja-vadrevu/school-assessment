import { useState, useEffect } from 'react';
import { LogIn, LogOut, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Card, Badge } from '../components';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const TeacherAttendance = () => {
  const { user, isAdmin } = useAuth();
  const [todayStatus, setTodayStatus] = useState(null);
  const [monthlyStats, setMonthlyStats] = useState(null);
  const [allTeachersAttendance, setAllTeachersAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

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
      const [todayData, monthlyData] = await Promise.all([
        api.get('/attendance/teacher/today'),
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
      // Refresh monthly stats after check-in
      const monthlyData = await api.get('/attendance/teacher/monthly');
      setMonthlyStats(monthlyData);
    } catch (error) {
      const msg = error?.message || 'Failed to check in';
      alert(msg);
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setCheckingIn(true);
      const result = await api.put('/attendance/teacher/check-out', {});
      setTodayStatus(result);
      // Refresh monthly stats after check-out
      const monthlyData = await api.get('/attendance/teacher/monthly');
      setMonthlyStats(monthlyData);
    } catch (error) {
      alert(error?.message || 'Failed to check out');
    } finally {
      setCheckingIn(false);
    }
  };

  const isCheckedIn = todayStatus?.checkedInAt && !todayStatus?.checkedOutAt;
  const isCheckedOut = todayStatus?.checkedOutAt;
  const isLate = todayStatus?.status === 'late';
  const notCheckedIn = !todayStatus?.checkedInAt;

  // ===================== TEACHER VIEW =====================
  if (!isAdmin) {
    if (loading) {
      return <div style={{ textAlign: 'center', padding: '48px', color: 'var(--color-text-secondary)' }}>Loading...</div>;
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Check-in Card */}
        <div style={{
          backgroundColor: 'var(--color-surface)', borderRadius: '16px',
          border: '1px solid var(--color-border)', padding: '32px',
          textAlign: 'center',
        }}>
          {/* Status Icon */}
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: isCheckedOut ? '#ECFDF5' : isCheckedIn ? (isLate ? '#FFF7ED' : '#ECFDF5') : '#F3F4F6',
          }}>
            {isCheckedOut ? (
              <CheckCircle size={36} color="#059669" />
            ) : isCheckedIn ? (
              isLate ? <AlertTriangle size={36} color="#D97706" /> : <CheckCircle size={36} color="#059669" />
            ) : (
              <Clock size={36} color="#9CA3AF" />
            )}
          </div>

          {/* Status Text */}
          <h2 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 700, color: 'var(--color-text)' }}>
            {isCheckedOut ? 'Day Complete' : isCheckedIn ? (isLate ? 'Checked In (Late)' : 'Checked In') : 'Not Checked In'}
          </h2>
          <p style={{ margin: '0 0 8px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          {/* Time Info */}
          {todayStatus?.checkedInAt && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', margin: '16px 0', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              <div>
                <span style={{ fontWeight: 600 }}>Check In: </span>
                {new Date(todayStatus.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {isLate && <Badge variant="warning" style={{ marginLeft: '6px' }}>Late</Badge>}
              </div>
              {todayStatus.checkedOutAt && (
                <div>
                  <span style={{ fontWeight: 600 }}>Check Out: </span>
                  {new Date(todayStatus.checkedOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>
          )}

          {/* Expected time note */}
          {notCheckedIn && (
            <p style={{ margin: '0 0 20px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              Expected check-in time: <strong>7:45 AM</strong>. After this you'll be marked as late.
            </p>
          )}

          {/* Action Button */}
          {notCheckedIn ? (
            <button
              onClick={handleCheckIn}
              disabled={checkingIn}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '10px',
                padding: '14px 40px', backgroundColor: '#059669', color: 'white',
                border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 700,
                cursor: checkingIn ? 'wait' : 'pointer', fontFamily: 'var(--font-family)',
                transition: 'all 0.2s', opacity: checkingIn ? 0.7 : 1,
              }}
            >
              <LogIn size={20} /> {checkingIn ? 'Checking In...' : 'Check In'}
            </button>
          ) : isCheckedIn ? (
            <button
              onClick={handleCheckOut}
              disabled={checkingIn}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '10px',
                padding: '14px 40px', backgroundColor: '#DC2626', color: 'white',
                border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 700,
                cursor: checkingIn ? 'wait' : 'pointer', fontFamily: 'var(--font-family)',
                transition: 'all 0.2s', opacity: checkingIn ? 0.7 : 1,
              }}
            >
              <LogOut size={20} /> {checkingIn ? 'Checking Out...' : 'Check Out'}
            </button>
          ) : null}
        </div>

        {/* Monthly Stats */}
        {monthlyStats && (
          <div>
            <h2 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 700, color: 'var(--color-text)' }}>Monthly Summary</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
              {[
                { label: 'Present', value: monthlyStats.presentDays || 0, color: '#059669', bg: '#ECFDF5' },
                { label: 'Late', value: monthlyStats.lateDays || 0, color: '#D97706', bg: '#FFF7ED' },
                { label: 'Absent', value: monthlyStats.absentDays || 0, color: '#DC2626', bg: '#FEF2F2' },
              ].map((stat) => (
                <div key={stat.label} style={{
                  backgroundColor: 'var(--color-surface)', borderRadius: '12px',
                  border: '1px solid var(--color-border)', padding: '20px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: stat.color }}>{stat.value}</div>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Calendar */}
        {monthlyStats?.calendar && (
          <div>
            <h2 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 700, color: 'var(--color-text)' }}>Attendance Calendar</h2>
            <div style={{
              backgroundColor: 'var(--color-surface)', borderRadius: '14px',
              border: '1px solid var(--color-border)', padding: '20px',
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                  <div key={d} style={{ textAlign: 'center', fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', padding: '8px 0' }}>{d}</div>
                ))}
                {monthlyStats.calendar.map((day, idx) => {
                  const bg = day.status === 'present' ? '#ECFDF5' : day.status === 'late' ? '#FFF7ED' : day.status === 'absent' ? '#FEF2F2' : 'transparent';
                  const color = day.status === 'present' ? '#059669' : day.status === 'late' ? '#D97706' : day.status === 'absent' ? '#DC2626' : 'var(--color-text-secondary)';
                  return (
                    <div key={idx} style={{
                      textAlign: 'center', padding: '8px 0', borderRadius: '8px',
                      fontSize: '13px', fontWeight: day.status ? 700 : 400,
                      backgroundColor: bg, color: color,
                    }}>
                      {day.date || ''}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ===================== ADMIN VIEW =====================
  if (loading) {
    return <div style={{ textAlign: 'center', padding: '48px', color: 'var(--color-text-secondary)' }}>Loading...</div>;
  }

  const presentCount = allTeachersAttendance.filter((t) => t.status === 'present').length;
  const lateCount = allTeachersAttendance.filter((t) => t.status === 'late').length;
  const absentCount = allTeachersAttendance.filter((t) => t.status === 'absent').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Date Picker */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-secondary)' }}>
          {allTeachersAttendance.length} teachers
        </p>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={{
            padding: '8px 14px', border: '1px solid var(--color-border)',
            borderRadius: '10px', fontSize: '14px', fontFamily: 'var(--font-family)',
            color: 'var(--color-text)', outline: 'none',
          }}
        />
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
        {[
          { label: 'Present', value: presentCount, color: '#059669', bg: '#ECFDF5' },
          { label: 'Late', value: lateCount, color: '#D97706', bg: '#FFF7ED' },
          { label: 'Absent', value: absentCount, color: '#DC2626', bg: '#FEF2F2' },
          { label: 'Total', value: allTeachersAttendance.length, color: '#004493', bg: '#F3F4F6' },
        ].map((stat) => (
          <div key={stat.label} style={{
            backgroundColor: 'var(--color-surface)', borderRadius: '12px',
            border: '1px solid var(--color-border)', padding: '20px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '28px', fontWeight: 800, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Teacher List */}
      <div style={{
        backgroundColor: 'var(--color-surface)', borderRadius: '14px',
        border: '1px solid var(--color-border)', overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
              {['Teacher', 'Subject', 'Status', 'Check In', 'Check Out'].map((h) => (
                <th key={h} style={{
                  padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 600,
                  color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allTeachersAttendance.map((t) => (
              <tr key={t.id} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                <td style={{ padding: '14px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '34px', height: '34px', borderRadius: '50%', backgroundColor: '#004493',
                      color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '12px', fontWeight: 700, flexShrink: 0,
                    }}>{t.name?.substring(0, 2).toUpperCase()}</div>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>{t.name}</span>
                  </div>
                </td>
                <td style={{ padding: '14px 20px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>{t.department || '—'}</td>
                <td style={{ padding: '14px 20px' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700,
                    backgroundColor: t.status === 'present' ? '#ECFDF5' : t.status === 'late' ? '#FFF7ED' : '#FEF2F2',
                    color: t.status === 'present' ? '#059669' : t.status === 'late' ? '#D97706' : '#DC2626',
                  }}>
                    {t.status === 'present' && <CheckCircle size={12} />}
                    {t.status === 'late' && <AlertTriangle size={12} />}
                    {t.status === 'absent' && <XCircle size={12} />}
                    {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                  </span>
                </td>
                <td style={{ padding: '14px 20px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  {t.checkInTime ? new Date(t.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                </td>
                <td style={{ padding: '14px 20px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  {t.checkOutTime ? new Date(t.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TeacherAttendance;

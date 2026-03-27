import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ArrowUpRight,
} from 'lucide-react';
import { Card, Badge, BarChart } from '../components';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const StatCard = ({ label, value }) => (
  <div style={{
    backgroundColor: 'var(--color-surface)', borderRadius: '14px',
    border: '1px solid var(--color-border)', padding: '24px',
    display: 'flex', flexDirection: 'column', gap: '8px',
    boxShadow: 'var(--shadow-card)',
  }}>
    <p style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>{label}</p>
    <p style={{ margin: 0, fontSize: '32px', fontWeight: 800, color: 'var(--color-text)', lineHeight: 1 }}>{value}</p>
  </div>
);

const MiniCalendar = () => {
  const [currentDate] = useState(new Date());
  const monthName = currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const today = currentDate.getDate();
  const dayOfWeek = currentDate.getDay();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const startOfWeek = today - dayOfWeek;
  const weekDates = weekDays.map((_, i) => startOfWeek + i);

  return (
    <div style={{
      backgroundColor: 'var(--color-surface)', borderRadius: '14px',
      border: '1px solid var(--color-border)', padding: '24px',
      boxShadow: 'var(--shadow-card)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: '4px' }}>
          <ChevronLeft size={18} />
        </button>
        <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)' }}>{monthName}</span>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: '4px' }}>
          <ChevronRight size={18} />
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center' }}>
        {weekDays.map((day) => (
          <div key={day} style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-light)', padding: '8px 0' }}>{day}</div>
        ))}
        {weekDates.map((date, i) => {
          const isToday = date === today;
          return (
            <div key={i} style={{
              fontSize: '14px', fontWeight: isToday ? 700 : 500,
              color: isToday ? 'white' : 'var(--color-text)',
              backgroundColor: isToday ? '#1A1A2E' : 'transparent',
              borderRadius: '10px', padding: '10px 0', cursor: 'pointer',
            }}>
              {date > 0 ? date : ''}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const TaskTable = ({ tasks, title, showAssignee }) => (
  <Card>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--color-text)' }}>{title}</h3>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '6px 8px', cursor: 'pointer', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center' }}>
          <RefreshCw size={14} />
        </button>
        <button style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '6px 8px', cursor: 'pointer', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center' }}>
          <ArrowUpRight size={14} />
        </button>
      </div>
    </div>
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['Task Name', ...(showAssignee ? ['Assigned To'] : []), 'Priority', 'Status'].map((h) => (
              <th key={h} style={{
                textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: 600,
                color: 'var(--color-text-secondary)', textTransform: 'uppercase',
                letterSpacing: '0.5px', borderBottom: '1px solid var(--color-border)',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tasks.slice(0, 5).map((task) => (
            <tr key={task.id}>
              <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>{task.title}</td>
              {showAssignee && (
                <td style={{ padding: '14px 16px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>{task.assigned_to_name || 'Unassigned'}</td>
              )}
              <td style={{ padding: '14px 16px' }}>
                <Badge variant={task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'neutral'}>{task.priority || 'medium'}</Badge>
              </td>
              <td style={{ padding: '14px 16px' }}>
                <Badge variant={task.status === 'completed' ? 'success' : task.status === 'in_progress' ? 'info' : 'warning'}>
                  {task.status === 'in_progress' ? 'In Progress' : task.status === 'completed' ? 'Completed' : 'Pending'}
                </Badge>
              </td>
            </tr>
          ))}
          {tasks.length === 0 && (
            <tr><td colSpan={showAssignee ? 4 : 3} style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--color-text-light)', fontSize: '14px' }}>No tasks found</td></tr>
          )}
        </tbody>
      </table>
    </div>
  </Card>
);

// Build chart data from real tasks grouped by status
const buildTaskChartData = (tasks) => {
  const pending = tasks.filter((t) => t.status === 'pending').length;
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
  const completed = tasks.filter((t) => t.status === 'completed').length;

  return [
    { label: 'Pending', value: pending, color: '#D1D5DB' },
    { label: 'In Progress', value: inProgress, color: '#1A1A2E' },
    { label: 'Completed', value: completed, color: '#9CA3AF' },
  ];
};

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const promises = [api.get('/tasks')];
        if (isAdmin) promises.push(api.get('/teachers'));
        const results = await Promise.all(promises);
        setTasks(results[0] || []);
        if (isAdmin) setTeachers(results[1] || []);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAdmin]);

  const pendingCount = tasks.filter((t) => t.status === 'pending').length;
  const inProgressCount = tasks.filter((t) => t.status === 'in_progress').length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const chartData = buildTaskChartData(tasks);
  const maxChartValue = Math.max(...chartData.map((d) => d.value), 1);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '36px', height: '36px', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-text)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-secondary)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  // ─── TEACHER DASHBOARD ────────────────────────────────
  if (!isAdmin) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Welcome */}
        <div style={{
          background: 'linear-gradient(135deg, #1A1A2E 0%, #2D2D44 100%)',
          borderRadius: '16px', padding: '28px 32px', color: 'white',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <h2 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: 700 }}>
              Welcome back, {user?.name?.split(' ')[0]}!
            </h2>
            <p style={{ margin: 0, fontSize: '14px', opacity: 0.7 }}>
              You have {pendingCount} pending task{pendingCount !== 1 ? 's' : ''} and {inProgressCount} in progress.
            </p>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
          <StatCard label="My Tasks" value={tasks.length} />
          <StatCard label="Pending" value={pendingCount} />
          <StatCard label="In Progress" value={inProgressCount} />
          <StatCard label="Completed" value={completedCount} />
        </div>

        {/* Chart + Calendar */}
        <div className="chart-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px' }}>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--color-text)' }}>Task Summary</h3>
            </div>
            {tasks.length > 0 ? (
              <BarChart data={chartData} maxValue={maxChartValue} height={200} />
            ) : (
              <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-light)', fontSize: '14px' }}>
                No task data yet
              </div>
            )}
          </Card>
          <MiniCalendar />
        </div>

        {/* My Tasks Table */}
        <TaskTable tasks={tasks} title="My Tasks" showAssignee={false} />
      </div>
    );
  }

  // ─── ADMIN DASHBOARD ──────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
        <StatCard label="Total Teachers" value={teachers.length} />
        <StatCard label="All Tasks" value={tasks.length} />
        <StatCard label="Pending Tasks" value={pendingCount} />
        <StatCard label="Completed" value={completedCount} />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px' }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--color-text)' }}>Task Overview</h3>
            <button style={{
              background: 'none', border: '1px solid var(--color-border)', borderRadius: '8px',
              padding: '6px 8px', cursor: 'pointer', color: 'var(--color-text-secondary)',
              display: 'flex', alignItems: 'center',
            }}><ArrowUpRight size={14} /></button>
          </div>
          {tasks.length > 0 ? (
            <BarChart data={chartData} maxValue={maxChartValue} height={220} />
          ) : (
            <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-light)', fontSize: '14px' }}>
              No task data yet
            </div>
          )}
        </Card>

        <MiniCalendar />
      </div>

      {/* Recent Tasks Table */}
      <TaskTable tasks={tasks} title="All Tasks" showAssignee={true} />
    </div>
  );
};

export default Dashboard;

import React, { useState, useEffect } from 'react';
import {
  Users,
  BookOpen,
  CheckCircle,
  BarChart3,
  AlertTriangle,
  Activity,
} from 'lucide-react';
import {
  Card,
  StatCard,
  Badge,
  Table,
  Button,
} from '../components';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const AdminPanel = () => {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState({
    totalTeachers: 0,
    totalStudents: 0,
    taskCompletionRate: 0,
    attendanceRate: 0,
  });
  const [teacherProgress, setTeacherProgress] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState([]);
  const [weakStudents, setWeakStudents] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [campaignSummary, setCampaignSummary] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    planned: 0,
  });
  const [loading, setLoading] = useState(false);

  // Redirect non-admin users
  useEffect(() => {
    if (!isAdmin && !loading) {
      window.location.href = '/';
    }
  }, [isAdmin, loading]);

  // Fetch admin dashboard data
  useEffect(() => {
    const fetchAdminData = async () => {
      setLoading(true);
      try {
        const [statsData, teachersData, attendanceData, weakStudentsData, activityData, campaignsData] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/teacher-progress'),
          api.get('/admin/attendance-summary'),
          api.get('/admin/weak-students'),
          api.get('/admin/recent-activity'),
          api.get('/admin/campaign-summary'),
        ]);

        setStats(statsData || {});
        setTeacherProgress(teachersData || []);
        setAttendanceSummary(attendanceData || []);
        setWeakStudents(weakStudentsData || []);
        setRecentActivity(activityData || []);
        setCampaignSummary(campaignsData || {});
      } catch (error) {
        console.error('Failed to fetch admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin) {
      fetchAdminData();
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-light)' }}>
        Redirecting...
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-light)' }}>
        Loading admin dashboard...
      </div>
    );
  }

  const containerStyles = {
    padding: '24px',
    width: '100%',
  };

  const headerStyles = {
    marginBottom: '32px',
  };

  const titleStyles = {
    fontSize: '28px',
    fontWeight: 700,
    color: 'var(--color-text)',
    margin: '0 0 8px 0',
  };

  const subtitleStyles = {
    fontSize: '14px',
    color: 'var(--color-text-light)',
    margin: 0,
  };

  const gridStyles = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '32px',
  };

  const sectionStyles = {
    marginBottom: '32px',
  };

  const sectionTitleStyles = {
    fontSize: '18px',
    fontWeight: 600,
    color: 'var(--color-text)',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const progressBarContainerStyles = {
    marginBottom: '20px',
  };

  const progressLabelStyles = {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '6px',
    fontSize: '13px',
  };

  const progressBarStyles = {
    width: '100%',
    height: '8px',
    backgroundColor: 'var(--color-border-light)',
    borderRadius: '4px',
    overflow: 'hidden',
  };

  const progressFillStyles = (percentage) => ({
    height: '100%',
    backgroundColor: percentage >= 80 ? '#28A745' : percentage >= 60 ? '#FFC107' : '#DC3545',
    width: `${percentage}%`,
    transition: 'width 0.3s ease',
  });

  const activityItemStyles = {
    padding: '12px',
    borderBottom: '1px solid var(--color-border-light)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '13px',
  };

  const activityIndicatorStyles = {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: 'var(--color-accent)',
    flexShrink: 0,
  };

  return (
    <div style={containerStyles}>
      {/* Header */}
      <div style={headerStyles}>
        <h1 style={titleStyles}>Admin Dashboard</h1>
        <p style={subtitleStyles}>School-wide overview and management</p>
      </div>

      {/* Key Stats */}
      <div style={gridStyles}>
        <StatCard
          icon={Users}
          label="Total Teachers"
          value={stats.totalTeachers || 0}
        />
        <StatCard
          icon={BookOpen}
          label="Total Students"
          value={stats.totalStudents || 0}
        />
        <StatCard
          icon={CheckCircle}
          label="Task Completion Rate"
          value={`${Math.round(stats.taskCompletionRate || 0)}%`}
        />
        <StatCard
          icon={BarChart3}
          label="Attendance Rate"
          value={`${Math.round(stats.attendanceRate || 0)}%`}
        />
      </div>

      {/* Campaign Summary */}
      <div style={sectionStyles}>
        <h2 style={sectionTitleStyles}>
          <Activity size={20} />
          Campaign Overview
        </h2>
        <Card>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '20px',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-text)' }}>
                {campaignSummary.total}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--color-text-light)' }}>
                Total Campaigns
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#28A745' }}>
                {campaignSummary.completed}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--color-text-light)' }}>
                Completed
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#FFC107' }}>
                {campaignSummary.inProgress}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--color-text-light)' }}>
                In Progress
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#6C757D' }}>
                {campaignSummary.planned}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--color-text-light)' }}>
                Planned
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Teacher Task Progress */}
      <div style={sectionStyles}>
        <h2 style={sectionTitleStyles}>
          <Users size={20} />
          Teacher Task Progress
        </h2>
        <Card>
          {teacherProgress.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-light)' }}>
              No teacher data available
            </div>
          ) : (
            <div>
              {teacherProgress.map((teacher) => (
                <div key={teacher.id} style={progressBarContainerStyles}>
                  <div style={progressLabelStyles}>
                    <span style={{ fontWeight: 600 }}>{teacher.name}</span>
                    <span>{Math.round(teacher.completionRate)}% completed</span>
                  </div>
                  <div style={progressBarStyles}>
                    <div style={progressFillStyles(teacher.completionRate)} />
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-light)', marginTop: '4px' }}>
                    {teacher.tasksCompleted} of {teacher.totalTasks} tasks
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Attendance Summary */}
      <div style={sectionStyles}>
        <h2 style={sectionTitleStyles}>
          <BarChart3 size={20} />
          Class Attendance Summary
        </h2>
        <Card>
          {attendanceSummary.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-light)' }}>
              No attendance data available
            </div>
          ) : (
            <Table
              columns={[
                { key: 'className', label: 'Class' },
                {
                  key: 'attendanceRate',
                  label: 'Attendance Rate',
                  render: (rate) => `${Math.round(rate)}%`,
                },
                {
                  key: 'presentCount',
                  label: 'Present',
                },
                {
                  key: 'absentCount',
                  label: 'Absent',
                },
              ]}
              data={attendanceSummary}
              sortable
            />
          )}
        </Card>
      </div>

      {/* Students Below 40% */}
      <div style={sectionStyles}>
        <h2 style={sectionTitleStyles}>
          <AlertTriangle size={20} style={{ color: '#DC3545' }} />
          Students Below 40% (Academic Concern)
        </h2>
        <Card>
          {weakStudents.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-light)' }}>
              No students below 40% threshold
            </div>
          ) : (
            <Table
              columns={[
                { key: 'studentName', label: 'Student' },
                { key: 'className', label: 'Class' },
                {
                  key: 'averageScore',
                  label: 'Average Score',
                  render: (score) => (
                    <Badge variant="danger">
                      {Math.round(score)}%
                    </Badge>
                  ),
                },
                { key: 'subjectsBelow40', label: 'Weak Subjects' },
              ]}
              data={weakStudents}
              sortable
            />
          )}
        </Card>
      </div>

      {/* Recent Activity */}
      <div style={sectionStyles}>
        <h2 style={sectionTitleStyles}>
          <Activity size={20} />
          Recent Collaboration Activity
        </h2>
        <Card>
          {recentActivity.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-light)' }}>
              No recent activity
            </div>
          ) : (
            <div>
              {recentActivity.slice(0, 10).map((activity, idx) => (
                <div key={idx} style={activityItemStyles}>
                  <div style={activityIndicatorStyles} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, marginBottom: '2px' }}>
                      {activity.title}
                    </div>
                    <div style={{ color: 'var(--color-text-light)', fontSize: '12px' }}>
                      {activity.description}
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-light)', whiteSpace: 'nowrap' }}>
                    {activity.timeAgo}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Management Actions */}
      <div style={sectionStyles}>
        <h2 style={sectionTitleStyles}>
          <CheckCircle size={20} />
          Management Actions
        </h2>
        <Card>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
            }}
          >
            <Button variant="primary">Generate Reports</Button>
            <Button variant="secondary">Manage Users</Button>
            <Button variant="secondary">View Logs</Button>
            <Button variant="secondary">Export Data</Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminPanel;

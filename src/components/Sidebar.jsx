import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  MessageSquare,
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  MapPin,
  Shield,
  UserPlus,
  LogOut,
  X,
  GraduationCap,
} from 'lucide-react';

const Sidebar = ({ user, onLogout, isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = user?.role === 'admin';

  const commonItems = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { label: 'Tasks', icon: CheckSquare, href: '/tasks' },
    { label: 'Collaboration', icon: MessageSquare, href: '/collaboration' },
    { label: 'Student Attendance', icon: CalendarDays, href: '/attendance/students' },
    { label: 'Assessments', icon: ClipboardList, href: '/assessments' },
  ];

  const allItems = isAdmin
    ? [
        { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
        { label: 'Teachers', icon: Users, href: '/teachers' },
        { label: 'Tasks', icon: CheckSquare, href: '/tasks' },
        { label: 'Collaboration', icon: MessageSquare, href: '/collaboration' },
        { label: 'Teacher Attendance', icon: CalendarCheck, href: '/attendance/teachers' },
        { label: 'Student Attendance', icon: CalendarDays, href: '/attendance/students' },
        { label: 'Assessments', icon: ClipboardList, href: '/assessments' },
        { label: 'Campaigns', icon: MapPin, href: '/campaigns' },
        { label: 'Admin Panel', icon: Shield, href: '/admin' },
        { label: 'Manage Users', icon: UserPlus, href: '/manage-users' },
        { label: 'Classes & Students', icon: GraduationCap, href: '/manage-classes' },
      ]
    : commonItems;

  const isActive = (href) => location.pathname === href;

  const handleNav = (href) => {
    navigate(href);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)',
            zIndex: 998, display: 'none',
          }}
          className="sidebar-overlay"
        />
      )}

      <nav
        style={{
          position: 'fixed', left: 0, top: 0, height: '100vh', width: '240px',
          backgroundColor: 'white', borderRight: '1px solid var(--color-border)',
          display: 'flex', flexDirection: 'column', zIndex: 999, overflow: 'hidden',
          transition: 'transform 0.25s ease',
        }}
        className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}
      >
        <div style={{
          padding: '24px 20px', borderBottom: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div
            onClick={() => handleNav('/dashboard')}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <div style={{
              width: '34px', height: '34px', borderRadius: '10px',
              backgroundColor: '#1A1A2E', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: 'white', fontSize: '16px', fontWeight: 800,
            }}>B</div>
            <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text)', whiteSpace: 'nowrap' }}>
              Bhaskar School
            </span>
          </div>
          {/* Close button — only visible on mobile via CSS */}
          <button
            onClick={onClose}
            className="sidebar-close-btn"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--color-text-secondary)', padding: '4px',
              display: 'none',
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
          {allItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                onClick={() => handleNav(item.href)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px 16px', margin: '4px 0',
                  borderRadius: 'var(--border-radius-sm)', cursor: 'pointer',
                  transition: 'var(--transition-fast)',
                  backgroundColor: active ? 'var(--color-border-light)' : 'transparent',
                  color: 'var(--color-text)', fontSize: '14px',
                  fontWeight: active ? 700 : 500,
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.backgroundColor = 'var(--color-border-light)';
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Icon size={18} style={{ flexShrink: 0 }} />
                <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>
              </div>
            );
          })}
        </div>

        <div style={{
          padding: '16px 12px', borderTop: '1px solid var(--color-border)',
          display: 'flex', flexDirection: 'column', gap: '8px',
        }}>
          <button
            onClick={onLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '10px 16px', color: 'var(--color-text-secondary)',
              fontSize: '13px', fontFamily: "'Urbanist', sans-serif", fontWeight: 500,
              cursor: 'pointer', transition: 'var(--transition-fast)',
              backgroundColor: 'transparent', border: 'none', textAlign: 'left', width: '100%',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-border-light)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <LogOut size={16} /> Log out
          </button>
        </div>
      </nav>
    </>
  );
};

export default Sidebar;

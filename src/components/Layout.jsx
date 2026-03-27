import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import Avatar from './Avatar';

const Layout = ({
  children,
  pageTitle,
  user,
  onLogout,
  headerAction,
  className = '',
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--color-background)' }} className={className}>
      <Sidebar
        user={user}
        onLogout={onLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="main-content" style={{
        flex: 1, marginLeft: '240px', display: 'flex', flexDirection: 'column',
      }}>
        <header className="app-header" style={{
          backgroundColor: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
          padding: '24px 32px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
            {/* Hamburger — hidden on desktop via CSS */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="hamburger-btn"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--color-text)', padding: '4px', display: 'none',
              }}
            >
              <Menu size={24} />
            </button>
            {pageTitle && (
              <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
                {pageTitle}
              </h1>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {headerAction && <div>{headerAction}</div>}
            {user && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <Avatar name={user.name} size="sm" />
              </div>
            )}
          </div>
        </header>

        <main className="page-content" style={{ flex: 1, padding: '24px 32px', overflow: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;

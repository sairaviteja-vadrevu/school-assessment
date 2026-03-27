import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, BookOpen, Users, CalendarCheck, ClipboardList } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    if (!email) { setValidationError('Email is required'); return; }
    if (!password) { setValidationError('Password is required'); return; }
    try {
      await login(email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) { /* context handles error */ }
  };

  const displayError = validationError || error;

  const features = [
    { icon: BookOpen, label: 'Assessments & Grading' },
    { icon: Users, label: 'Staff Collaboration' },
    { icon: CalendarCheck, label: 'Attendance Tracking' },
    { icon: ClipboardList, label: 'Task Management' },
  ];

  return (
    <div className="login-container" style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Urbanist', sans-serif" }}>
      {/* Left Panel — Black & White with branding */}
      <div className="login-left" style={{
        flex: 1, background: '#111111',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        padding: '60px', position: 'relative', overflow: 'hidden',
      }}>
        {/* Subtle grid pattern */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.03,
          backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }} />

        {/* Soft glow behind logo */}
        <div style={{
          position: 'absolute', width: '300px', height: '300px',
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)',
          top: '50%', left: '50%', transform: 'translate(-50%, -55%)',
        }} />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: '380px' }}>
          {/* Logo mark */}
          <div style={{
            width: '64px', height: '64px', borderRadius: '18px',
            backgroundColor: 'white', display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 28px',
            boxShadow: '0 4px 24px rgba(255,255,255,0.1)',
          }}>
            <span style={{ fontSize: '30px', fontWeight: 900, color: '#111' }}>B</span>
          </div>

          <h1 style={{
            fontSize: '34px', fontWeight: 800, margin: '0 0 12px',
            letterSpacing: '-0.5px', color: 'white',
          }}>
            Bhaskar School
          </h1>
          <p style={{
            fontSize: '15px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.7,
            margin: '0 0 48px', fontWeight: 400,
          }}>
            A connected workspace for teachers and administrators to collaborate and manage school operations.
          </p>

          {/* Feature pills */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px',
          }}>
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '12px 16px', borderRadius: '12px',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}>
                  <Icon size={16} color="rgba(255,255,255,0.5)" />
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
                    {f.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Panel — Clean white */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px', backgroundColor: '#FAFAFA',
      }}>
        <div style={{ width: '100%', maxWidth: '380px' }}>
          <h2 style={{
            margin: '0 0 8px', fontSize: '28px', fontWeight: 800, color: '#111',
          }}>
            Welcome back
          </h2>
          <p style={{ margin: '0 0 36px', fontSize: '15px', color: '#9CA3AF' }}>
            Sign in to continue to your dashboard
          </p>

          {displayError && (
            <div style={{
              backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626',
              padding: '12px 16px', borderRadius: '12px', fontSize: '14px', marginBottom: '20px',
            }}>
              {displayError}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block', fontSize: '13px', fontWeight: 600,
                color: '#111', marginBottom: '8px',
              }}>
                Email
              </label>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '14px 16px', backgroundColor: 'white', border: '1px solid #E5E7EB',
                borderRadius: '12px', transition: 'border-color 0.2s, box-shadow 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#111';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(17,17,17,0.06)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.03)';
                }}
              >
                <Mail size={18} color="#9CA3AF" />
                <input
                  type="email" placeholder="Enter your email"
                  value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading}
                  style={{
                    flex: 1, border: 'none', outline: 'none', fontSize: '15px',
                    color: '#111', backgroundColor: 'transparent',
                    fontFamily: "'Urbanist', sans-serif",
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '28px' }}>
              <label style={{
                display: 'block', fontSize: '13px', fontWeight: 600,
                color: '#111', marginBottom: '8px',
              }}>
                Password
              </label>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '14px 16px', backgroundColor: 'white', border: '1px solid #E5E7EB',
                borderRadius: '12px', transition: 'border-color 0.2s, box-shadow 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#111';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(17,17,17,0.06)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.03)';
                }}
              >
                <Lock size={18} color="#9CA3AF" />
                <input
                  type="password" placeholder="Enter your password"
                  value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading}
                  style={{
                    flex: 1, border: 'none', outline: 'none', fontSize: '15px',
                    color: '#111', backgroundColor: 'transparent',
                    fontFamily: "'Urbanist', sans-serif",
                  }}
                />
              </div>
            </div>

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '15px 24px', backgroundColor: '#111', color: 'white',
              border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 700,
              cursor: loading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '8px', opacity: loading ? 0.7 : 1,
              fontFamily: "'Urbanist', sans-serif", transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            }}
              onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.backgroundColor = '#333'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.18)'; }}}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#111'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)'; }}
            >
              {loading ? 'Signing in...' : <>Sign In <ArrowRight size={18} /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;

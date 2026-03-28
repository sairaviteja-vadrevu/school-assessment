import { useState, useEffect, useRef } from 'react';
import { Plus, MapPin, Calendar, Edit2, X, Users, Play, CheckCircle, Clock, Navigation, ExternalLink, MessageSquare } from 'lucide-react';
import { Badge } from '../components';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const getStatusVariant = (s) => ({ completed: 'success', in_progress: 'info', planned: 'neutral' }[s] || 'neutral');
const getStatusLabel = (s) => ({ completed: 'Completed', in_progress: 'In Progress', planned: 'Planned' }[s] || s);
const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Not set';

const timeAgo = (dt) => {
  if (!dt) return '';
  const diff = Date.now() - new Date(dt).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return 'Just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

// ─── Campaign Detail Panel (Admin) ─────────────────────
const CampaignDetailPanel = ({ campaign, onClose }) => {
  const [locationLogs, setLocationLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  const hasLocation = campaign.live_lat && campaign.live_lng;
  const notes = campaign.notes ? campaign.notes.split('\n').filter(n => n.trim()) : [];
  const mapEmbedUrl = hasLocation
    ? `https://maps.google.com/maps?q=${campaign.live_lat},${campaign.live_lng}&z=15&output=embed`
    : null;

  useEffect(() => {
    api.get(`/campaigns/${campaign.id}/location-logs`)
      .then(data => setLocationLogs(data || []))
      .catch(() => {})
      .finally(() => setLoadingLogs(false));

    // Poll location logs every 30s for live campaigns
    if (campaign.status === 'in_progress') {
      const interval = setInterval(() => {
        api.get(`/campaigns/${campaign.id}/location-logs`).then(data => setLocationLogs(data || [])).catch(() => {});
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [campaign.id, campaign.status]);

  const formatTime = (dt) => {
    if (!dt) return '';
    return new Date(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '720px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}
        onClick={(e) => e.stopPropagation()}>

        {/* Close button */}
        <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: hasLocation ? 'rgba(0,0,0,0.4)' : 'var(--color-border-light)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', color: hasLocation ? 'white' : 'var(--color-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
          <X size={16} />
        </button>

        {/* Map */}
        {hasLocation ? (
          <div style={{ position: 'relative', borderRadius: '16px 16px 0 0', overflow: 'hidden', height: '280px', backgroundColor: '#E8F0FE' }}>
            <iframe src={mapEmbedUrl} style={{ width: '100%', height: '100%', border: 'none' }} loading="lazy" title="Location" />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.75))', padding: '20px 24px', color: 'white' }}>
              <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 800 }}>{campaign.title}</h2>
              <div style={{ fontSize: '13px', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={13} /> {campaign.location}
                {campaign.assigned_to_name && <> · <Users size={13} /> {campaign.assigned_to_name}</>}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: '24px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 800, color: 'var(--color-text)' }}>{campaign.title}</h2>
              <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={13} /> {campaign.location}</div>
            </div>
            <Badge variant={getStatusVariant(campaign.status)}>{getStatusLabel(campaign.status)}</Badge>
          </div>
        )}

        <div style={{ padding: '24px' }}>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '24px' }}>
            {[
              { label: 'Status', value: getStatusLabel(campaign.status), color: campaign.status === 'in_progress' ? '#004493' : campaign.status === 'completed' ? '#059669' : '#6B7280' },
              { label: 'Visit Date', value: formatDate(campaign.visit_date), color: 'var(--color-text)' },
              { label: 'Locations Logged', value: locationLogs.length, color: '#004493' },
              { label: 'Last Seen', value: campaign.live_updated_at ? timeAgo(campaign.live_updated_at) : '—', color: campaign.live_updated_at ? '#004493' : 'var(--color-text-secondary)' },
            ].map(s => (
              <div key={s.label} style={{ backgroundColor: 'var(--color-background)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>{s.label}</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Current Location */}
          {hasLocation && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#E8F0FE', borderRadius: '10px', padding: '14px 18px', marginBottom: '24px' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#004493', textTransform: 'uppercase', marginBottom: '2px' }}>Current Location</div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{campaign.live_lat.toFixed(6)}, {campaign.live_lng.toFixed(6)}</div>
              </div>
              <a href={`https://www.google.com/maps?q=${campaign.live_lat},${campaign.live_lng}`} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', backgroundColor: '#004493', color: 'white', borderRadius: '8px', fontSize: '13px', fontWeight: 700, textDecoration: 'none', flexShrink: 0 }}>
                <ExternalLink size={14} /> Open in Maps
              </a>
            </div>
          )}

          {/* Location Timeline */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Navigation size={14} /> Location Timeline ({locationLogs.length} check-ins)
            </div>
            {loadingLogs ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-secondary)', fontSize: '13px' }}>Loading...</div>
            ) : locationLogs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-secondary)', fontSize: '13px', backgroundColor: 'var(--color-background)', borderRadius: '10px' }}>
                No location check-ins recorded yet
              </div>
            ) : (
              <div style={{ position: 'relative', paddingLeft: '28px' }}>
                <div style={{ position: 'absolute', left: '9px', top: '8px', bottom: '8px', width: '2px', backgroundColor: 'var(--color-border)' }} />
                {locationLogs.map((log, i) => {
                  const isLatest = i === locationLogs.length - 1;
                  return (
                    <div key={log.id} style={{ position: 'relative', marginBottom: '12px' }}>
                      <div style={{ position: 'absolute', left: '-22px', top: '10px', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: isLatest ? '#004493' : 'var(--color-border)', border: '2px solid white', zIndex: 1 }} />
                      <div style={{
                        backgroundColor: isLatest ? '#E8F0FE' : 'var(--color-background)', borderRadius: '10px',
                        padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        border: isLatest ? '1px solid #B8D4F0' : '1px solid transparent',
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '2px' }}>{log.place_name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{formatTime(log.logged_at)}</div>
                        </div>
                        <a href={`https://www.google.com/maps?q=${log.lat},${log.lng}`} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: '11px', color: '#004493', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                          <MapPin size={11} /> View
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Activity Notes */}
          {notes.length > 0 && (
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MessageSquare size={14} /> Activity Notes ({notes.length})
              </div>
              <div style={{ position: 'relative', paddingLeft: '28px' }}>
                <div style={{ position: 'absolute', left: '9px', top: '8px', bottom: '8px', width: '2px', backgroundColor: 'var(--color-border)' }} />
                {notes.map((note, i) => (
                  <div key={i} style={{ position: 'relative', marginBottom: '12px' }}>
                    <div style={{ position: 'absolute', left: '-22px', top: '8px', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: i === notes.length - 1 ? '#059669' : 'var(--color-border)', border: '2px solid white', zIndex: 1 }} />
                    <div style={{ backgroundColor: i === notes.length - 1 ? '#ECFDF5' : 'var(--color-background)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: 'var(--color-text)', lineHeight: 1.5, fontWeight: i === notes.length - 1 ? 600 : 400 }}>
                      {note}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────
const Campaigns = () => {
  const { user, isAdmin } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [formData, setFormData] = useState({ title: '', description: '', location: '', visit_date: '', assigned_to: '', status: 'planned', notes: '' });
  const [liveUpdate, setLiveUpdate] = useState('');
  const [detailCampaign, setDetailCampaign] = useState(null);
  const geoWatchRef = useRef(null);

  const fetchCampaigns = async () => {
    try {
      const data = await api.get('/campaigns');
      setCampaigns(data || []);
      // Update detail panel if open
      if (detailCampaign) {
        const updated = (data || []).find(c => c.id === detailCampaign.id);
        if (updated) setDetailCampaign(updated);
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    const promises = [api.get('/campaigns')];
    if (isAdmin) promises.push(api.get('/teachers'));
    Promise.all(promises)
      .then((r) => { setCampaigns(r[0] || []); if (isAdmin) setTeachers(r[1] || []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    const i = setInterval(fetchCampaigns, 15000);
    return () => clearInterval(i);
  }, [isAdmin, detailCampaign]);

  // Teacher GPS tracking: update live location every 30s, log with place name every 15min
  const lastLogRef = useRef(0);
  useEffect(() => {
    if (isAdmin) return;
    const active = campaigns.find(c => c.status === 'in_progress');
    if (active && navigator.geolocation) {
      if (geoWatchRef.current) navigator.geolocation.clearWatch(geoWatchRef.current);
      const LOG_INTERVAL = 15 * 60 * 1000; // 15 minutes

      geoWatchRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const now = Date.now();
          const shouldLog = now - lastLogRef.current >= LOG_INTERVAL;
          api.post(`/campaigns/${active.id}/location`, {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            log: shouldLog,
          }).then(() => { if (shouldLog) lastLogRef.current = now; }).catch(() => {});
        },
        () => {}, { enableHighAccuracy: true, maximumAge: 30000, timeout: 10000 }
      );

      // Log immediately on start if not logged yet
      if (lastLogRef.current === 0) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            api.post(`/campaigns/${active.id}/location`, { lat: pos.coords.latitude, lng: pos.coords.longitude, log: true })
              .then(() => { lastLogRef.current = Date.now(); }).catch(() => {});
          },
          () => {}, { enableHighAccuracy: true }
        );
      }
    } else if (geoWatchRef.current) {
      navigator.geolocation.clearWatch(geoWatchRef.current);
      geoWatchRef.current = null;
    }
    return () => { if (geoWatchRef.current) navigator.geolocation.clearWatch(geoWatchRef.current); };
  }, [isAdmin, campaigns]);

  const resetForm = () => setFormData({ title: '', description: '', location: '', visit_date: '', assigned_to: '', status: 'planned', notes: '' });

  const handleSave = async () => {
    if (!formData.title || !formData.location || !formData.visit_date) { alert('Fill title, location, date'); return; }
    setSubmitting(true);
    try {
      const p = { title: formData.title, description: formData.description, location: formData.location, visit_date: formData.visit_date, assigned_to: formData.assigned_to || null, status: formData.status, notes: formData.notes };
      if (editingCampaign) await api.put(`/campaigns/${editingCampaign.id}`, p);
      else await api.post('/campaigns', p);
      setShowModal(false); resetForm(); setEditingCampaign(null); await fetchCampaigns();
    } catch (e) { alert('Failed to save'); }
    finally { setSubmitting(false); }
  };

  const handleStartCampaign = async (c) => {
    try {
      const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      await api.put(`/campaigns/${c.id}`, { status: 'in_progress', notes: `[${ts}] Campaign started` });
      await fetchCampaigns();
    } catch (e) { alert('Failed to start'); }
  };

  const handlePostUpdate = async (id) => {
    if (!liveUpdate.trim()) return;
    try {
      const c = campaigns.find(x => x.id === id);
      const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const notes = c?.notes ? `${c.notes}\n[${ts}] ${liveUpdate}` : `[${ts}] ${liveUpdate}`;
      await api.put(`/campaigns/${id}`, { notes });
      setLiveUpdate(''); await fetchCampaigns();
    } catch (e) { alert('Failed'); }
  };

  const handleCompleteCampaign = async (c) => {
    try {
      const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const notes = c.notes ? `${c.notes}\n[${ts}] Campaign completed` : `[${ts}] Campaign completed`;
      await api.put(`/campaigns/${c.id}`, { status: 'completed', notes });
      await fetchCampaigns();
    } catch (e) { alert('Failed'); }
  };

  const filteredCampaigns = filterStatus ? campaigns.filter(c => c.status === filterStatus) : campaigns;
  const plannedCount = campaigns.filter(c => c.status === 'planned').length;
  const inProgressCount = campaigns.filter(c => c.status === 'in_progress').length;
  const completedCount = campaigns.filter(c => c.status === 'completed').length;

  const inputStyle = { width: '100%', padding: '11px 14px', border: '1px solid var(--color-border)', borderRadius: '10px', fontSize: '14px', fontFamily: 'var(--font-family)', color: 'var(--color-text)', outline: 'none', backgroundColor: 'white' };
  const selectStyle = { ...inputStyle, cursor: 'pointer', appearance: 'none' };
  const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' };

  if (loading) return <div style={{ textAlign: 'center', padding: '48px', color: 'var(--color-text-secondary)' }}>Loading...</div>;

  // =================== TEACHER VIEW ===================
  if (!isAdmin) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-secondary)' }}>{campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''} assigned to you</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {[{ label: 'Planned', value: plannedCount, color: '#6B7280' }, { label: 'In Progress', value: inProgressCount, color: '#004493' }, { label: 'Completed', value: completedCount, color: '#059669' }].map(s => (
            <div key={s.label} style={{ backgroundColor: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)', padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {campaigns.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--color-text-secondary)' }}>No campaigns assigned.</div>
        ) : campaigns.map(c => {
          const isActive = c.status === 'in_progress';
          return (
            <div key={c.id} style={{ backgroundColor: 'var(--color-surface)', borderRadius: '14px', border: isActive ? '2px solid #004493' : '1px solid var(--color-border)', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 700, color: 'var(--color-text)' }}>{c.title}</h3>
                  <Badge variant={getStatusVariant(c.status)}>{getStatusLabel(c.status)}</Badge>
                </div>
                {isActive && <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#ECFDF5', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, color: '#059669' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#059669', animation: 'pulse 1.5s infinite' }} />LIVE</div>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-text-secondary)' }}><MapPin size={14} style={{ flexShrink: 0, color: 'var(--color-text-light)' }} />{c.location}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-text-secondary)' }}><Calendar size={14} style={{ flexShrink: 0, color: 'var(--color-text-light)' }} />{formatDate(c.visit_date)}</div>
                {isActive && c.live_lat && <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#004493' }}><Navigation size={14} /><span style={{ fontWeight: 600 }}>Live location is being shared</span></div>}
              </div>
              {c.notes && (
                <div style={{ backgroundColor: 'var(--color-background)', borderRadius: '10px', padding: '14px', marginBottom: '16px', maxHeight: '150px', overflowY: 'auto' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>Activity Log</div>
                  {c.notes.split('\n').map((line, i) => <div key={i} style={{ fontSize: '13px', color: 'var(--color-text)', marginBottom: '4px' }}>{line}</div>)}
                </div>
              )}
              {c.status === 'planned' && <button onClick={() => handleStartCampaign(c)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', backgroundColor: '#004493', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-family)', width: '100%', justifyContent: 'center' }}><Play size={16} />Start Campaign</button>}
              {isActive && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', gap: '8px', backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '6px 6px 6px 14px' }}>
                    <input type="text" placeholder="Post update..." value={liveUpdate} onChange={(e) => setLiveUpdate(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handlePostUpdate(c.id); }}
                      style={{ flex: 1, border: 'none', outline: 'none', fontSize: '13px', color: 'var(--color-text)', backgroundColor: 'transparent', fontFamily: 'var(--font-family)' }} />
                    <button onClick={() => handlePostUpdate(c.id)} disabled={!liveUpdate.trim()} style={{ padding: '8px 16px', backgroundColor: liveUpdate.trim() ? '#004493' : 'var(--color-border-light)', color: liveUpdate.trim() ? 'white' : 'var(--color-text-secondary)', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: liveUpdate.trim() ? 'pointer' : 'default', fontFamily: 'var(--font-family)' }}>Post</button>
                  </div>
                  <button onClick={() => handleCompleteCampaign(c)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-family)', width: '100%', justifyContent: 'center' }}><CheckCircle size={16} />Mark as Completed</button>
                </div>
              )}
              {c.status === 'completed' && <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', backgroundColor: '#ECFDF5', borderRadius: '10px', color: '#059669', fontSize: '14px', fontWeight: 600, justifyContent: 'center' }}><CheckCircle size={16} />Campaign Completed</div>}
            </div>
          );
        })}
        <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
      </div>
    );
  }

  // =================== ADMIN VIEW ===================
  const inProgressCampaigns = campaigns.filter(c => c.status === 'in_progress');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-secondary)' }}>{campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''}</p>
        <button onClick={() => { resetForm(); setEditingCampaign(null); setShowModal(true); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: '#004493', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-family)' }}><Plus size={16} />New Campaign</button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
        {[{ label: 'Planned', value: plannedCount, color: '#6B7280', icon: Clock }, { label: 'In Progress', value: inProgressCount, color: '#004493', icon: Play }, { label: 'Completed', value: completedCount, color: '#059669', icon: CheckCircle }, { label: 'Total', value: campaigns.length, color: '#004493', icon: MapPin }].map(s => (
          <div key={s.label} style={{ backgroundColor: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)', padding: '20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><s.icon size={20} color={s.color} /></div>
            <div><div style={{ fontSize: '24px', fontWeight: 800, color: s.color }}>{s.value}</div><div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{s.label}</div></div>
          </div>
        ))}
      </div>

      {/* Live Tracker */}
      {inProgressCampaigns.length > 0 && (
        <div style={{ backgroundColor: '#004493', borderRadius: '14px', padding: '20px 24px', color: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#22C55E', animation: 'pulse 1.5s infinite' }} />
            <span style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Live Tracker ({inProgressCampaigns.length})</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {inProgressCampaigns.map(c => {
              const lastNote = c.notes ? c.notes.split('\n').filter(n => n.trim()).pop() : null;
              return (
                <div key={c.id} style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: '10px', padding: '16px 18px', cursor: 'pointer' }}
                  onClick={() => setDetailCampaign(c)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '15px', fontWeight: 700 }}>{c.title}</div>
                      <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <MapPin size={12} />{c.location}{c.assigned_to_name && <> · <Users size={12} />{c.assigned_to_name}</>}
                      </div>
                      {lastNote && <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '6px', fontStyle: 'italic' }}>Latest: {lastNote}</div>}
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setDetailCampaign(c); }} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', color: 'white', fontSize: '12px', fontWeight: 700, fontFamily: 'var(--font-family)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Navigation size={14} /> Track
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {['', 'planned', 'in_progress', 'completed'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, border: '1px solid', cursor: 'pointer', fontFamily: 'var(--font-family)', backgroundColor: filterStatus === s ? '#004493' : 'transparent', color: filterStatus === s ? 'white' : 'var(--color-text)', borderColor: filterStatus === s ? '#004493' : 'var(--color-border)' }}>
            {s === '' ? 'All' : getStatusLabel(s)}
          </button>
        ))}
      </div>

      {/* Cards */}
      {filteredCampaigns.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--color-text-secondary)' }}>No campaigns found.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
          {filteredCampaigns.map(c => (
            <div key={c.id} style={{ backgroundColor: 'var(--color-surface)', borderRadius: '14px', border: c.status === 'in_progress' ? '2px solid #004493' : '1px solid var(--color-border)', padding: '24px', display: 'flex', flexDirection: 'column', transition: 'all 0.2s', cursor: 'pointer' }}
              onClick={() => setDetailCampaign(c)}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--color-text)', flex: 1 }}>{c.title}</h3>
                <Badge variant={getStatusVariant(c.status)}>{getStatusLabel(c.status)}</Badge>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={13} />{c.location}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={13} />{formatDate(c.visit_date)}</div>
                {c.assigned_to_name && <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Users size={13} />{c.assigned_to_name}</div>}
              </div>
              {c.live_lat && c.status === 'in_progress' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#004493', fontWeight: 600, marginBottom: '12px' }}>
                  <Navigation size={12} /> Live location available · {timeAgo(c.live_updated_at)}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '12px', borderTop: '1px solid var(--color-border-light)', marginTop: 'auto', gap: '8px' }}>
                <button onClick={(e) => { e.stopPropagation(); setEditingCampaign(c); setFormData({ title: c.title || '', description: c.description || '', location: c.location || '', visit_date: c.visit_date || '', assigned_to: c.assigned_to || '', status: c.status || 'planned', notes: c.notes || '' }); setShowModal(true); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '7px 14px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', fontFamily: 'var(--font-family)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-border-light)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                ><Edit2 size={13} />Edit</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Panel */}
      {detailCampaign && <CampaignDetailPanel campaign={detailCampaign} onClose={() => setDetailCampaign(null)} />}

      {/* Create/Edit Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }} onClick={() => { setShowModal(false); setEditingCampaign(null); }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>{editingCampaign ? 'Edit Campaign' : 'Create Campaign'}</h2>
              <button onClick={() => { setShowModal(false); setEditingCampaign(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: '4px' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div><label style={labelStyle}>Title *</label><input style={inputStyle} placeholder="e.g. Sector 12 Outreach" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} /></div>
              <div><label style={labelStyle}>Description</label><textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} placeholder="Details..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div><label style={labelStyle}>Location *</label><input style={inputStyle} placeholder="Area/locality" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} /></div>
                <div><label style={labelStyle}>Visit Date *</label><input style={inputStyle} type="date" value={formData.visit_date} onChange={(e) => setFormData({ ...formData, visit_date: e.target.value })} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div><label style={labelStyle}>Assign Teacher</label><div style={{ position: 'relative' }}><select style={{ ...selectStyle, paddingRight: '36px' }} value={formData.assigned_to} onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}><option value="">Select</option>{teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select><div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: '12px', color: 'var(--color-text-secondary)' }}>&#9662;</div></div></div>
                {editingCampaign && <div><label style={labelStyle}>Status</label><div style={{ position: 'relative' }}><select style={{ ...selectStyle, paddingRight: '36px' }} value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}><option value="planned">Planned</option><option value="in_progress">In Progress</option><option value="completed">Completed</option></select><div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: '12px', color: 'var(--color-text-secondary)' }}>&#9662;</div></div></div>}
              </div>
              {editingCampaign && <div><label style={labelStyle}>Activity Notes</label><textarea style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} /></div>}
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button onClick={() => { setShowModal(false); setEditingCampaign(null); }} style={{ padding: '10px 20px', backgroundColor: 'var(--color-border-light)', color: 'var(--color-text)', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-family)' }}>Cancel</button>
              <button onClick={handleSave} disabled={submitting} style={{ padding: '10px 20px', backgroundColor: '#004493', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: submitting ? 'wait' : 'pointer', fontFamily: 'var(--font-family)', opacity: submitting ? 0.7 : 1 }}>{submitting ? 'Saving...' : (editingCampaign ? 'Update' : 'Create')}</button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
    </div>
  );
};

export default Campaigns;

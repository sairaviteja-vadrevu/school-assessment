import { useState, useEffect } from 'react';
import { Plus, MapPin, Calendar, Edit2, CheckCircle, Clock, AlertCircle, X, Users } from 'lucide-react';
import { Card, Badge } from '../components';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const getStatusVariant = (status) => {
  const variants = { completed: 'success', in_progress: 'info', planned: 'neutral' };
  return variants[status] || 'neutral';
};

const Campaigns = () => {
  const { user, isAdmin } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [formData, setFormData] = useState({ title: '', description: '', location: '', visit_date: '', assigned_to: '', status: 'planned', notes: '' });

  const fetchCampaigns = async () => {
    try {
      const data = await api.get('/campaigns');
      setCampaigns(data || []);
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
    }
  };

  useEffect(() => {
    Promise.all([api.get('/campaigns'), api.get('/teachers')])
      .then(([cdata, tdata]) => {
        setCampaigns(cdata || []);
        setTeachers(tdata || []);
      })
      .catch((e) => console.error('Failed to fetch data:', e))
      .finally(() => setLoading(false));
  }, []);

  const resetForm = () => setFormData({ title: '', description: '', location: '', visit_date: '', assigned_to: '', status: 'planned', notes: '' });

  const handleCreate = async () => {
    if (!formData.title || !formData.location || !formData.visit_date) {
      alert('Please fill in title, location, and date');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/campaigns', {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        visit_date: formData.visit_date,
        assigned_to: formData.assigned_to || null,
      });
      resetForm();
      setShowNewModal(false);
      await fetchCampaigns();
    } catch (error) {
      console.error('Failed to create campaign:', error);
      alert('Failed to create campaign');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (campaign) => {
    setSelectedCampaign(campaign);
    setFormData({
      title: campaign.title || '',
      description: campaign.description || '',
      location: campaign.location || '',
      visit_date: campaign.visit_date || '',
      assigned_to: campaign.assigned_to || '',
      status: campaign.status || 'planned',
      notes: campaign.notes || '',
    });
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    setSubmitting(true);
    try {
      await api.put(`/campaigns/${selectedCampaign.id}`, {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        visit_date: formData.visit_date,
        assigned_to: formData.assigned_to || null,
        status: formData.status,
        notes: formData.notes,
      });
      setShowEditModal(false);
      setSelectedCampaign(null);
      resetForm();
      await fetchCampaigns();
    } catch (error) {
      console.error('Failed to update campaign:', error);
      alert('Failed to update campaign');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return 'Not set';
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const filteredCampaigns = filterStatus ? campaigns.filter((c) => c.status === filterStatus) : campaigns;

  const inputStyle = {
    width: '100%', padding: '11px 14px', border: '1px solid var(--color-border)',
    borderRadius: '10px', fontSize: '14px', fontFamily: 'var(--font-family)',
    color: 'var(--color-text)', outline: 'none', backgroundColor: 'white',
  };
  const selectStyle = { ...inputStyle, cursor: 'pointer', appearance: 'none' };
  const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' };

  const renderForm = (isEdit) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <label style={labelStyle}>Campaign Title *</label>
        <input style={inputStyle} placeholder="e.g. Environmental Awareness Drive" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
      </div>
      <div>
        <label style={labelStyle}>Description</label>
        <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} placeholder="Campaign description..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={labelStyle}>Location *</label>
          <input style={inputStyle} placeholder="Campaign location" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
        </div>
        <div>
          <label style={labelStyle}>Date *</label>
          <input style={inputStyle} type="date" value={formData.visit_date} onChange={(e) => setFormData({ ...formData, visit_date: e.target.value })} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={labelStyle}>Assign Teacher</label>
          <div style={{ position: 'relative' }}>
            <select style={{ ...selectStyle, paddingRight: '36px' }} value={formData.assigned_to} onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}>
              <option value="">Select a teacher</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--color-text-secondary)', fontSize: '12px' }}>&#9662;</div>
          </div>
        </div>
        {isEdit && (
          <div>
            <label style={labelStyle}>Status</label>
            <div style={{ position: 'relative' }}>
              <select style={{ ...selectStyle, paddingRight: '36px' }} value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                <option value="planned">Planned</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
              <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--color-text-secondary)', fontSize: '12px' }}>&#9662;</div>
            </div>
          </div>
        )}
      </div>
      {isEdit && (
        <div>
          <label style={labelStyle}>Notes</label>
          <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} placeholder="Add notes about the campaign..." value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
        </div>
      )}
    </div>
  );

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '48px', color: 'var(--color-text-secondary)' }}>Loading campaigns...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            {campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => { resetForm(); setShowNewModal(true); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
              backgroundColor: '#1A1A2E', color: 'white', border: 'none', borderRadius: '10px',
              fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-family)',
            }}
          >
            <Plus size={16} /> New Campaign
          </button>
        )}
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {['', 'planned', 'in_progress', 'completed'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            style={{
              padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
              border: '1px solid', cursor: 'pointer', fontFamily: 'var(--font-family)',
              backgroundColor: filterStatus === status ? '#1A1A2E' : 'transparent',
              color: filterStatus === status ? 'white' : 'var(--color-text)',
              borderColor: filterStatus === status ? '#1A1A2E' : 'var(--color-border)',
              transition: 'all 0.15s',
            }}
          >
            {status === '' ? 'All' : status === 'in_progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Campaign Cards */}
      {filteredCampaigns.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--color-text-secondary)', fontSize: '14px' }}>
          No campaigns found.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
          {filteredCampaigns.map((campaign) => (
            <div
              key={campaign.id}
              style={{
                backgroundColor: 'var(--color-surface)', borderRadius: '14px',
                border: '1px solid var(--color-border)', padding: '24px',
                display: 'flex', flexDirection: 'column', transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--color-text)', flex: 1 }}>{campaign.title}</h3>
                <Badge variant={getStatusVariant(campaign.status)}>
                  {(campaign.status || '').replace('_', ' ')}
                </Badge>
              </div>

              {campaign.description && (
                <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                  {campaign.description}
                </p>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  <MapPin size={14} style={{ color: 'var(--color-text-light)', flexShrink: 0 }} />
                  {campaign.location || 'No location'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  <Calendar size={14} style={{ color: 'var(--color-text-light)', flexShrink: 0 }} />
                  {formatDate(campaign.visit_date)}
                </div>
                {campaign.assigned_to_name && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                    <Users size={14} style={{ color: 'var(--color-text-light)', flexShrink: 0 }} />
                    {campaign.assigned_to_name}
                  </div>
                )}
              </div>

              {campaign.notes && (
                <p style={{ margin: '0 0 16px', fontSize: '12px', fontStyle: 'italic', color: 'var(--color-text-secondary)', padding: '8px 12px', backgroundColor: 'var(--color-border-light)', borderRadius: '8px' }}>
                  {campaign.notes}
                </p>
              )}

              {isAdmin && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid var(--color-border-light)', marginTop: 'auto' }}>
                  <button
                    onClick={() => handleEdit(campaign)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      background: 'none', border: '1px solid var(--color-border)',
                      borderRadius: '8px', padding: '7px 14px', cursor: 'pointer',
                      fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)',
                      fontFamily: 'var(--font-family)', transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-border-light)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <Edit2 size={13} /> Edit
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showNewModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}
          onClick={() => setShowNewModal(false)}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>Create New Campaign</h2>
              <button onClick={() => setShowNewModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: '4px' }}><X size={20} /></button>
            </div>
            {renderForm(false)}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button onClick={() => setShowNewModal(false)} style={{ padding: '10px 20px', backgroundColor: 'var(--color-border-light)', color: 'var(--color-text)', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-family)' }}>Cancel</button>
              <button onClick={handleCreate} disabled={submitting} style={{ padding: '10px 20px', backgroundColor: '#1A1A2E', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: submitting ? 'wait' : 'pointer', fontFamily: 'var(--font-family)', opacity: submitting ? 0.7 : 1 }}>{submitting ? 'Creating...' : 'Create Campaign'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}
          onClick={() => { setShowEditModal(false); setSelectedCampaign(null); }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>Edit Campaign</h2>
              <button onClick={() => { setShowEditModal(false); setSelectedCampaign(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: '4px' }}><X size={20} /></button>
            </div>
            {renderForm(true)}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button onClick={() => { setShowEditModal(false); setSelectedCampaign(null); }} style={{ padding: '10px 20px', backgroundColor: 'var(--color-border-light)', color: 'var(--color-text)', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-family)' }}>Cancel</button>
              <button onClick={handleUpdate} disabled={submitting} style={{ padding: '10px 20px', backgroundColor: '#1A1A2E', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: submitting ? 'wait' : 'pointer', fontFamily: 'var(--font-family)', opacity: submitting ? 0.7 : 1 }}>{submitting ? 'Updating...' : 'Update Campaign'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Campaigns;

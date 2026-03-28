import React, { useState, useEffect } from 'react';
import { Plus, MapPin, Calendar, Edit2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Card, Button, Modal, Input, Textarea, Select, Badge, Table } from '../components';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

// Helpers
const getStatusVariant = (status) => {
  const variants = { completed: 'success', in_progress: 'info', planned: 'neutral' };
  return variants[status] || 'neutral';
};

const getStatusIcon = (status) => {
  const icons = { completed: CheckCircle, in_progress: Clock, planned: AlertCircle };
  const Icon = icons[status];
  return Icon ? <Icon size={16} /> : null;
};

const Campaigns = () => {
  const { user, isAdmin } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [filterStatus, setFilterStatus] = useState('');
  const [showNewCampaignModal, setShowNewCampaignModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [newCampaignData, setNewCampaignData] = useState({ title: '', description: '', location: '', date: '', assignedTeacher: '', status: 'planned' });
  const [teachers, setTeachers] = useState([]);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const data = await api.get('/campaigns');
      setCampaigns(data || []);
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
    } finally {
      setLoading(false);
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

  const handleCreateCampaign = async () => {
    if (!newCampaignData.title || !newCampaignData.location || !newCampaignData.date) {
      alert('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/campaigns', {
        title: newCampaignData.title,
        description: newCampaignData.description,
        location: newCampaignData.location,
        visit_date: newCampaignData.date,
        assigned_to: newCampaignData.assignedTeacher || null,
      });
      setNewCampaignData({ title: '', description: '', location: '', date: '', assignedTeacher: '', status: 'planned' });
      setShowNewCampaignModal(false);
      await fetchCampaigns();
    } catch (error) {
      console.error('Failed to create campaign:', error);
      alert('Failed to create campaign');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditCampaign = (campaign) => {
    setSelectedCampaign(campaign);
    setEditFormData({ title: campaign.title, description: campaign.description, location: campaign.location, date: campaign.date, assignedTeacher: campaign.assignedTeacherId, status: campaign.status, notes: campaign.notes || '' });
    setShowEditModal(true);
  };

  const handleUpdateCampaign = async () => {
    setSubmitting(true);
    try {
      await api.put(`/campaigns/${selectedCampaign.id}`, {
        title: editFormData.title,
        description: editFormData.description,
        location: editFormData.location,
        visit_date: editFormData.date,
        assigned_to: editFormData.assignedTeacher || null,
        status: editFormData.status,
        notes: editFormData.notes,
      });
      setShowEditModal(false);
      setSelectedCampaign(null);
      await fetchCampaigns();
    } catch (error) {
      console.error('Failed to update campaign:', error);
      alert('Failed to update campaign');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const filteredCampaigns = filterStatus ? campaigns.filter((c) => c.status === filterStatus) : campaigns;

  const containerStyles = { padding: '24px', width: '100%' };
  const headerStyles = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' };
  const titleStyles = { fontSize: '28px', fontWeight: 700, color: 'var(--color-text)', margin: 0 };
  const controlsStyles = { display: 'flex', gap: '12px', alignItems: 'center' };
  const filterStyles = { display: 'flex', gap: '16px', marginBottom: '24px', alignItems: 'center' };
  const cardGridStyles = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginBottom: '32px' };
  const campaignCardStyles = { display: 'flex', flexDirection: 'column', height: '100%' };
  const cardHeaderStyles = { marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--color-border-light)' };
  const campaignTitleStyles = { fontSize: '16px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px' };
  const detailStyles = { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-text-light)', marginBottom: '8px' };
  const descriptionStyles = { fontSize: '13px', color: 'var(--color-text-light)', marginBottom: '12px', flex: 1 };
  const badgeContainerStyles = { display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' };
  const actionButtonsStyles = { display: 'flex', gap: '8px', marginTop: 'auto' };

  return (
    <div style={containerStyles}>
      {/* Header */}
      <div style={headerStyles}>
        <h1 style={titleStyles}>Campaigns</h1>
        {isAdmin && (
          <div style={controlsStyles}>
            <Select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              style={{ minWidth: '120px' }}
            >
              <option value="list">List View</option>
              <option value="cards">Card View</option>
            </Select>
            <Button
              icon={Plus}
              onClick={() => setShowNewCampaignModal(true)}
            >
              New Campaign
            </Button>
          </div>
        )}
      </div>

      {/* Filter */}
      <div style={filterStyles}>
        <Select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{ minWidth: '160px' }}
        >
          <option value="">All Status</option>
          <option value="planned">Planned</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </Select>
        <span style={{ fontSize: '13px', color: 'var(--color-text-light)', whiteSpace: 'nowrap' }}>
          Showing {filteredCampaigns.length} campaign{filteredCampaigns.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Loading State */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--color-text-light)' }}>
          Loading campaigns...
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--color-text-light)' }}>
            No campaigns found
          </div>
        </Card>
      ) : viewMode === 'cards' ? (
        // Card View
        <div style={cardGridStyles}>
          {filteredCampaigns.map((campaign) => (
            <Card key={campaign.id} style={campaignCardStyles} hoverable>
              <div style={cardHeaderStyles}>
                <div style={campaignTitleStyles}>{campaign.title}</div>
                <div style={badgeContainerStyles}>
                  <Badge variant={getStatusVariant(campaign.status)}>
                    {campaign.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
              <p style={descriptionStyles}>{campaign.description}</p>
              <div style={detailStyles}>
                <MapPin size={14} />
                {campaign.location}
              </div>
              <div style={detailStyles}>
                <Calendar size={14} />
                {formatDate(campaign.date)}
              </div>
              {campaign.assignedTeacherName && (
                <div style={detailStyles}>
                  <strong>Teacher:</strong> {campaign.assignedTeacherName}
                </div>
              )}
              {campaign.notes && (
                <div style={{ fontSize: '13px', fontStyle: 'italic', color: 'var(--color-text-light)', marginBottom: '12px' }}>
                  Notes: {campaign.notes.substring(0, 50)}...
                </div>
              )}
              {isAdmin && (
                <div style={actionButtonsStyles}>
                  <Button size="sm" variant="ghost" icon={Edit2} onClick={() => handleEditCampaign(campaign)}>
                    Edit
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        // List View
        <Card>
          <Table
            columns={[
              { key: 'title', label: 'Title' },
              { key: 'location', label: 'Location' },
              { key: 'date', label: 'Date', render: (date) => formatDate(date) },
              { key: 'assignedTeacherName', label: 'Assigned Teacher', render: (name) => name || '-' },
              { key: 'status', label: 'Status', render: (status) => <Badge variant={getStatusVariant(status)}>{status.replace('_', ' ')}</Badge> },
              { key: 'id', label: 'Actions', sortable: false, render: (id, row) => <Button size="sm" variant="ghost" icon={Edit2} onClick={() => handleEditCampaign(row)}>Edit</Button> },
            ]}
            data={filteredCampaigns}
            sortable
          />
        </Card>
      )}

      {/* New Campaign Modal */}
      <Modal isOpen={showNewCampaignModal} onClose={() => { setShowNewCampaignModal(false); setNewCampaignData({ title: '', description: '', location: '', date: '', assignedTeacher: '', status: 'planned' }); }} title="Create New Campaign" size="md" footer={<div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}><Button variant="secondary" onClick={() => setShowNewCampaignModal(false)} disabled={submitting}>Cancel</Button><Button onClick={handleCreateCampaign} loading={submitting}>Create Campaign</Button></div>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text)' }}>Campaign Title *</label>
            <Input value={newCampaignData.title} onChange={(e) => setNewCampaignData({ ...newCampaignData, title: e.target.value })} placeholder="e.g., Environmental Awareness Drive" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text)' }}>Description</label>
            <Textarea value={newCampaignData.description} onChange={(e) => setNewCampaignData({ ...newCampaignData, description: e.target.value })} placeholder="Campaign description..." rows={4} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text)' }}>Location *</label>
            <Input value={newCampaignData.location} onChange={(e) => setNewCampaignData({ ...newCampaignData, location: e.target.value })} placeholder="Campaign location" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text)' }}>Date *</label>
            <Input type="date" value={newCampaignData.date} onChange={(e) => setNewCampaignData({ ...newCampaignData, date: e.target.value })} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text)' }}>Assign Teacher</label>
            <Select value={newCampaignData.assignedTeacher} onChange={(e) => setNewCampaignData({ ...newCampaignData, assignedTeacher: e.target.value })}>
              <option value="">Select a teacher</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
              ))}
            </Select>
          </div>
        </div>
      </Modal>

      {/* Edit Campaign Modal */}
      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setSelectedCampaign(null); }} title="Edit Campaign" size="md" footer={<div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}><Button variant="secondary" onClick={() => setShowEditModal(false)} disabled={submitting}>Cancel</Button><Button onClick={handleUpdateCampaign} loading={submitting}>Update Campaign</Button></div>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text)' }}>Campaign Title</label>
            <Input value={editFormData.title || ''} onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text)' }}>Location</label>
            <Input value={editFormData.location || ''} onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text)' }}>Date</label>
            <Input type="date" value={editFormData.date || ''} onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text)' }}>Status</label>
            <Select value={editFormData.status || 'planned'} onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}>
              <option value="planned">Planned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </Select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text)' }}>Visit Notes</label>
            <Textarea value={editFormData.notes || ''} onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })} placeholder="Add notes about the campaign..." rows={4} />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Campaigns;

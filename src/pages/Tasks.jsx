import React, { useState, useEffect } from 'react';
import { Plus, Check, Clock, AlertCircle, Trash2 } from 'lucide-react';
import {
  Card,
  Button,
  Badge,
  Modal,
  Input,
  Textarea,
  Select,
  SearchBar,
} from '../components';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const Tasks = () => {
  const { isAdmin, user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    deadline: '',
    priority: 'medium',
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch tasks and teachers on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [tasksData, teachersData] = await Promise.all([
          api.get('/tasks'),
          api.get('/teachers'),
        ]);
        setTasks(tasksData || []);
        setTeachers(teachersData || []);
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to load tasks');
        setTasks([]);
        setTeachers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getFilteredTasks = () => {
    return tasks.filter((task) => {
      const matchesStatus =
        filterStatus === 'all' || task.status === filterStatus;
      const matchesPriority =
        filterPriority === 'all' || task.priority === filterPriority;
      const matchesAssignee =
        filterAssignee === 'all' || task.assigned_to === filterAssignee;
      const matchesSearch = searchQuery === '' ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase());

      return (
        matchesStatus &&
        matchesPriority &&
        matchesAssignee &&
        matchesSearch
      );
    });
  };

  const groupTasksByStatus = () => {
    const filtered = getFilteredTasks();
    return {
      pending: filtered.filter((t) => t.status === 'pending'),
      inProgress: filtered.filter((t) => t.status === 'in_progress'),
      completed: filtered.filter((t) => t.status === 'completed'),
    };
  };

  const handleCreateTask = () => {
    setFormData({
      title: '',
      description: '',
      assignedTo: '',
      deadline: '',
      priority: 'medium',
    });
    setFormErrors({});
    setIsCreateModalOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) errors.title = 'Title is required';
    if (!formData.assignedTo) errors.assignedTo = 'Assignee is required';
    if (!formData.deadline) errors.deadline = 'Deadline is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitTask = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      const newTask = await api.post('/tasks', {
        title: formData.title,
        description: formData.description,
        assigned_to: formData.assignedTo,
        deadline: formData.deadline,
        priority: formData.priority,
      });
      setTasks([...tasks, newTask]);
      setIsCreateModalOpen(false);
      setFormData({
        title: '',
        description: '',
        assignedTo: '',
        deadline: '',
        priority: 'medium',
      });
    } catch (err) {
      setFormErrors({
        submit: err.message || 'Failed to create task',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      setTasks(
        tasks.map((t) =>
          t.id === taskId ? { ...t, status: newStatus } : t
        )
      );
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask({ ...selectedTask, status: newStatus });
      }
    } catch (err) {
      setError(err.message || 'Failed to update task status');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(tasks.filter((t) => t.id !== taskId));
      if (selectedTask && selectedTask.id === taskId) {
        setIsDetailModalOpen(false);
        setSelectedTask(null);
      }
    } catch (err) {
      setError(err.message || 'Failed to delete task');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'danger';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'neutral';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'info';
      case 'pending':
        return 'warning';
      default:
        return 'neutral';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  const containerStyles = {
    padding: '32px 24px',
    backgroundColor: 'var(--color-background)',
    minHeight: '100vh',
  };

  const headerStyles = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
  };

  const titleStyles = {
    fontSize: '28px',
    fontWeight: 700,
    color: 'var(--color-text)',
    margin: 0,
  };

  const controlsContainerStyles = {
    display: 'flex',
    gap: '16px',
    marginBottom: '32px',
    flexWrap: 'wrap',
    alignItems: 'center',
  };

  const filterSelectStyles = {
    minWidth: '150px',
  };

  const kanbanContainerStyles = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: '24px',
  };

  const columnHeaderStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '2px solid var(--color-border)',
  };

  const columnTitleStyles = {
    fontSize: '16px',
    fontWeight: 600,
    color: 'var(--color-text)',
    margin: 0,
  };

  const taskCountStyles = {
    backgroundColor: 'var(--color-border)',
    color: 'var(--color-text-light)',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 600,
  };

  const tasksColumnStyles = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    minHeight: '400px',
    backgroundColor: 'var(--color-border-light)',
    borderRadius: 'var(--border-radius)',
    padding: '16px',
  };

  const taskCardStyles = {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--border-radius-sm)',
    padding: '16px',
    cursor: 'pointer',
    transition: 'var(--transition-fast)',
  };

  const taskTitleStyles = {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--color-text)',
    margin: '0 0 8px 0',
  };

  const taskDescriptionStyles = {
    fontSize: '12px',
    color: 'var(--color-text-light)',
    margin: '0 0 12px 0',
    lineHeight: 1.4,
  };

  const taskMetaStyles = {
    display: 'flex',
    gap: '8px',
    marginBottom: '12px',
    flexWrap: 'wrap',
  };

  const taskFooterStyles = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '12px',
    borderTop: '1px solid var(--color-border-light)',
  };

  const emptyColumnStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--color-text-light)',
    fontSize: '14px',
    minHeight: '200px',
    fontStyle: 'italic',
  };

  const modalFormStyles = {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  };

  const { pending, inProgress, completed } = groupTasksByStatus();

  if (loading) {
    return (
      <div style={containerStyles}>
        <div style={{ textAlign: 'center', padding: '48px 24px' }}>
          <p>Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={containerStyles}>
        <div style={headerStyles}>
          <h1 style={titleStyles}>Tasks</h1>
          {isAdmin && (
            <Button
              icon={Plus}
              onClick={handleCreateTask}
              variant="primary"
              size="md"
            >
              Create Task
            </Button>
          )}
        </div>

        <div style={controlsContainerStyles}>
          <div style={{ flex: 1, minWidth: '250px' }}>
            <SearchBar
              placeholder="Search tasks..."
              onSearch={setSearchQuery}
            />
          </div>

          <Select
            label="Status"
            options={[
              { label: 'All Statuses', value: 'all' },
              { label: 'Pending', value: 'pending' },
              { label: 'In Progress', value: 'in_progress' },
              { label: 'Completed', value: 'completed' },
            ]}
            value={filterStatus}
            onChange={setFilterStatus}
            style={filterSelectStyles}
          />

          <Select
            label="Priority"
            options={[
              { label: 'All Priorities', value: 'all' },
              { label: 'High', value: 'high' },
              { label: 'Medium', value: 'medium' },
              { label: 'Low', value: 'low' },
            ]}
            value={filterPriority}
            onChange={setFilterPriority}
            style={filterSelectStyles}
          />

          <Select
            label="Assignee"
            options={[
              { label: 'All Assignees', value: 'all' },
              ...teachers.map((t) => ({ label: t.name, value: t.id })),
            ]}
            value={filterAssignee}
            onChange={setFilterAssignee}
            style={filterSelectStyles}
          />
        </div>

        {error && (
          <div
            style={{
              marginBottom: '24px',
              padding: '12px 16px',
              backgroundColor: '#F8D7DA',
              color: '#721C24',
              borderRadius: 'var(--border-radius-sm)',
              borderLeft: '4px solid var(--color-danger)',
            }}
          >
            {error}
          </div>
        )}

        <div style={kanbanContainerStyles}>
          {/* Pending Column */}
          <div>
            <div style={columnHeaderStyles}>
              <Clock size={20} style={{ color: 'var(--color-warning)' }} />
              <h2 style={columnTitleStyles}>Pending</h2>
              <span style={taskCountStyles}>{pending.length}</span>
            </div>
            <div style={tasksColumnStyles}>
              {pending.length === 0 ? (
                <div style={emptyColumnStyles}>No pending tasks</div>
              ) : (
                pending.map((task) => (
                  <div
                    key={task.id}
                    style={taskCardStyles}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                    onClick={() => {
                      setSelectedTask(task);
                      setIsDetailModalOpen(true);
                    }}
                  >
                    <h3 style={taskTitleStyles}>{task.title}</h3>
                    {task.description && (
                      <p style={taskDescriptionStyles}>{task.description}</p>
                    )}
                    <div style={taskMetaStyles}>
                      <Badge variant={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                    </div>
                    {task.deadline && (
                      <div
                        style={{
                          fontSize: '12px',
                          color: 'var(--color-text-light)',
                          marginBottom: '12px',
                        }}
                      >
                        Due: {new Date(task.deadline).toLocaleDateString()}
                      </div>
                    )}
                    <div style={taskFooterStyles}>
                      <span
                        style={{
                          fontSize: '12px',
                          color: 'var(--color-text-light)',
                        }}
                      >
                        {task.assigned_to_name || 'Unassigned'}
                      </span>
                      {!isAdmin &&
                        user?.id === task.assigned_to && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateTaskStatus(
                                task.id,
                                'in_progress'
                              );
                            }}
                          >
                            Start
                          </Button>
                        )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* In Progress Column */}
          <div>
            <div style={columnHeaderStyles}>
              <AlertCircle
                size={20}
                style={{ color: 'var(--color-info)' }}
              />
              <h2 style={columnTitleStyles}>In Progress</h2>
              <span style={taskCountStyles}>{inProgress.length}</span>
            </div>
            <div style={tasksColumnStyles}>
              {inProgress.length === 0 ? (
                <div style={emptyColumnStyles}>No tasks in progress</div>
              ) : (
                inProgress.map((task) => (
                  <div
                    key={task.id}
                    style={taskCardStyles}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                    onClick={() => {
                      setSelectedTask(task);
                      setIsDetailModalOpen(true);
                    }}
                  >
                    <h3 style={taskTitleStyles}>{task.title}</h3>
                    {task.description && (
                      <p style={taskDescriptionStyles}>{task.description}</p>
                    )}
                    <div style={taskMetaStyles}>
                      <Badge variant={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                    </div>
                    {task.deadline && (
                      <div
                        style={{
                          fontSize: '12px',
                          color: 'var(--color-text-light)',
                          marginBottom: '12px',
                        }}
                      >
                        Due: {new Date(task.deadline).toLocaleDateString()}
                      </div>
                    )}
                    <div style={taskFooterStyles}>
                      <span
                        style={{
                          fontSize: '12px',
                          color: 'var(--color-text-light)',
                        }}
                      >
                        {task.assigned_to_name || 'Unassigned'}
                      </span>
                      {!isAdmin &&
                        user?.id === task.assigned_to && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateTaskStatus(
                                task.id,
                                'completed'
                              );
                            }}
                          >
                            Complete
                          </Button>
                        )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Completed Column */}
          <div>
            <div style={columnHeaderStyles}>
              <Check size={20} style={{ color: 'var(--color-success)' }} />
              <h2 style={columnTitleStyles}>Completed</h2>
              <span style={taskCountStyles}>{completed.length}</span>
            </div>
            <div style={tasksColumnStyles}>
              {completed.length === 0 ? (
                <div style={emptyColumnStyles}>No completed tasks</div>
              ) : (
                completed.map((task) => (
                  <div
                    key={task.id}
                    style={{
                      ...taskCardStyles,
                      opacity: 0.7,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                    onClick={() => {
                      setSelectedTask(task);
                      setIsDetailModalOpen(true);
                    }}
                  >
                    <h3
                      style={{
                        ...taskTitleStyles,
                        textDecoration: 'line-through',
                      }}
                    >
                      {task.title}
                    </h3>
                    {task.description && (
                      <p style={taskDescriptionStyles}>{task.description}</p>
                    )}
                    <div style={taskMetaStyles}>
                      <Badge variant={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                    </div>
                    {task.deadline && (
                      <div
                        style={{
                          fontSize: '12px',
                          color: 'var(--color-text-light)',
                          marginBottom: '12px',
                        }}
                      >
                        Due: {new Date(task.deadline).toLocaleDateString()}
                      </div>
                    )}
                    <div style={taskFooterStyles}>
                      <span
                        style={{
                          fontSize: '12px',
                          color: 'var(--color-text-light)',
                        }}
                      >
                        {task.assigned_to_name || 'Unassigned'}
                      </span>
                      {isAdmin && (
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={Trash2}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTask(task.id);
                          }}
                        />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Task Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Task"
        size="md"
        footer={
          <div
            style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
            }}
          >
            <Button
              variant="ghost"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmitTask}
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              Create Task
            </Button>
          </div>
        }
      >
        <form style={modalFormStyles} onSubmit={handleSubmitTask}>
          <Input
            label="Task Title"
            placeholder="Enter task title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            error={formErrors.title}
            required
          />
          <Textarea
            label="Description"
            placeholder="Enter task description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            rows={4}
          />
          <Select
            label="Assign To"
            options={teachers.map((t) => ({ label: t.name, value: t.id }))}
            value={formData.assignedTo}
            onChange={(value) =>
              setFormData({ ...formData, assignedTo: value })
            }
            error={formErrors.assignedTo}
            required
          />
          <Input
            label="Deadline"
            type="date"
            value={formData.deadline}
            onChange={(e) =>
              setFormData({ ...formData, deadline: e.target.value })
            }
            error={formErrors.deadline}
            required
          />
          <Select
            label="Priority"
            options={[
              { label: 'Low', value: 'low' },
              { label: 'Medium', value: 'medium' },
              { label: 'High', value: 'high' },
            ]}
            value={formData.priority}
            onChange={(value) =>
              setFormData({ ...formData, priority: value })
            }
          />
          {formErrors.submit && (
            <div
              style={{
                padding: '12px',
                backgroundColor: '#F8D7DA',
                color: '#721C24',
                borderRadius: 'var(--border-radius-sm)',
                fontSize: '14px',
              }}
            >
              {formErrors.submit}
            </div>
          )}
        </form>
      </Modal>

      {/* Task Detail Modal */}
      {selectedTask && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedTask(null);
          }}
          title={selectedTask.title}
          size="md"
          footer={
            <div
              style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end',
              }}
            >
              <Button
                variant="ghost"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedTask(null);
                }}
              >
                Close
              </Button>
              {!isAdmin &&
                user?.id === selectedTask.assigned_to &&
                selectedTask.status !== 'completed' && (
                  <Button
                    variant="primary"
                    onClick={() => {
                      const nextStatus =
                        selectedTask.status === 'pending'
                          ? 'in_progress'
                          : 'completed';
                      handleUpdateTaskStatus(selectedTask.id, nextStatus);
                    }}
                  >
                    {selectedTask.status === 'pending'
                      ? 'Start Task'
                      : 'Complete Task'}
                  </Button>
                )}
              {isAdmin && (
                <Button
                  variant="danger"
                  icon={Trash2}
                  onClick={() => {
                    handleDeleteTask(selectedTask.id);
                  }}
                >
                  Delete
                </Button>
              )}
            </div>
          }
        >
          <div style={modalFormStyles}>
            {selectedTask.description && (
              <div>
                <h4 style={{ color: 'var(--color-text)', marginBottom: '8px' }}>
                  Description
                </h4>
                <p
                  style={{
                    color: 'var(--color-text-light)',
                    margin: 0,
                    lineHeight: 1.6,
                  }}
                >
                  {selectedTask.description}
                </p>
              </div>
            )}

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
              }}
            >
              <div>
                <h4 style={{ color: 'var(--color-text)', marginBottom: '8px' }}>
                  Status
                </h4>
                <Badge variant={getStatusColor(selectedTask.status)}>
                  {getStatusLabel(selectedTask.status)}
                </Badge>
              </div>

              <div>
                <h4 style={{ color: 'var(--color-text)', marginBottom: '8px' }}>
                  Priority
                </h4>
                <Badge variant={getPriorityColor(selectedTask.priority)}>
                  {selectedTask.priority}
                </Badge>
              </div>

              {selectedTask.deadline && (
                <div>
                  <h4
                    style={{
                      color: 'var(--color-text)',
                      marginBottom: '8px',
                    }}
                  >
                    Due Date
                  </h4>
                  <p
                    style={{
                      color: 'var(--color-text-light)',
                      margin: 0,
                    }}
                  >
                    {new Date(selectedTask.deadline).toLocaleDateString()}
                  </p>
                </div>
              )}

              <div>
                <h4
                  style={{
                    color: 'var(--color-text)',
                    marginBottom: '8px',
                  }}
                >
                  Assigned To
                </h4>
                <p
                  style={{
                    color: 'var(--color-text-light)',
                    margin: 0,
                  }}
                >
                  {selectedTask.assigned_to_name || 'Unassigned'}
                </p>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default Tasks;

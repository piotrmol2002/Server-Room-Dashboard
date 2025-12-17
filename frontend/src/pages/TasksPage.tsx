import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi, serversApi } from '../services/api';
import { ScheduledTask, TaskStatus, TaskType, UserRole, TaskCompletionHistory } from '../types';
import { useAuthStore } from '../store/authStore';
import { format } from 'date-fns';

const OPERATOR_TASK_TYPES: TaskType[] = [TaskType.BACKUP, TaskType.RESTART, TaskType.UPDATE];
const TECHNICIAN_TASK_TYPES: TaskType[] = [TaskType.MAINTENANCE, TaskType.DIAGNOSTIC];

const roleColors: Record<string, { bg: string; color: string }> = {
  [UserRole.OPERATOR]: { bg: '#dbeafe', color: '#1e40af' },
  [UserRole.TECHNICIAN]: { bg: '#fef3c7', color: '#92400e' },
};

export default function TasksPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [showModal, setShowModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<ScheduledTask | null>(null);
  const [completionComment, setCompletionComment] = useState('');
  const [taskHistory, setTaskHistory] = useState<TaskCompletionHistory[]>([]);
  const [editingTask, setEditingTask] = useState<ScheduledTask | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    task_type: 'backup' as TaskType,
    target_server: '',
    scheduled_time: '',
    is_recurring: false,
    recurrence_days: 1,
    assigned_role: '' as UserRole | '',
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const response = await tasksApi.getAll();
      return response.data;
    },
  });

  const { data: servers } = useQuery({
    queryKey: ['servers'],
    queryFn: async () => {
      const response = await serversApi.getAll();
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => tasksApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setShowModal(false);
      resetForm();
      alert('Task created successfully');
    },
    onError: (error: any) => {
      alert(`Failed to create: ${error.response?.data?.detail || error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => tasksApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setShowModal(false);
      setEditingTask(null);
      resetForm();
      alert('Task updated successfully');
    },
    onError: (error: any) => {
      alert(`Failed to update: ${error.response?.data?.detail || error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => tasksApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      alert('Task deleted successfully');
    },
    onError: (error: any) => {
      alert(`Failed to delete: ${error.response?.data?.detail || error.message}`);
    },
  });

  const executeMutation = useMutation({
    mutationFn: (id: number) => tasksApi.execute(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      alert('Task execution started');
    },
    onError: (error: any) => {
      alert(`Failed to execute: ${error.response?.data?.detail || error.message}`);
    },
  });

  const completeMutation = useMutation({
    mutationFn: ({ id, comment }: { id: number; comment?: string }) => tasksApi.complete(id, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setShowCompleteModal(false);
      setSelectedTask(null);
      setCompletionComment('');
      alert('Task marked as completed');
    },
    onError: (error: any) => {
      alert(`Failed to complete: ${error.response?.data?.detail || error.message}`);
    },
  });

  const filteredTasks = tasks?.filter((task) => {
    return statusFilter === 'all' || task.status === statusFilter;
  });

  const getAvailableTaskTypes = (role: UserRole | ''): TaskType[] => {
    if (!role) return [...OPERATOR_TASK_TYPES, ...TECHNICIAN_TASK_TYPES];
    if (role === UserRole.OPERATOR) return OPERATOR_TASK_TYPES;
    if (role === UserRole.TECHNICIAN) return TECHNICIAN_TASK_TYPES;
    return [...OPERATOR_TASK_TYPES, ...TECHNICIAN_TASK_TYPES];
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      task_type: 'backup' as TaskType,
      target_server: '',
      scheduled_time: '',
      is_recurring: false,
      recurrence_days: 1,
      assigned_role: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      scheduled_time: new Date(formData.scheduled_time).toISOString(),
      target_server: formData.target_server || null,
      description: formData.description || null,
      recurrence_days: formData.is_recurring ? formData.recurrence_days : null,
      assigned_role: formData.assigned_role || null,
    };

    if (editingTask) {
      updateMutation.mutate({ id: editingTask.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleEdit = (task: ScheduledTask) => {
    setEditingTask(task);
    setFormData({
      name: task.name,
      description: task.description || '',
      task_type: task.task_type,
      target_server: task.target_server || '',
      scheduled_time: format(new Date(task.scheduled_time), "yyyy-MM-dd'T'HH:mm"),
      is_recurring: task.is_recurring,
      recurrence_days: task.recurrence_days || 1,
      assigned_role: task.assigned_role || '',
    });
    setShowModal(true);
  };

  const handleDelete = (task: ScheduledTask) => {
    if (confirm(`Are you sure you want to delete "${task.name}"?`)) {
      deleteMutation.mutate(task.id);
    }
  };

  const handleExecute = (task: ScheduledTask) => {
    if (confirm(`Execute "${task.name}" now?`)) {
      executeMutation.mutate(task.id);
    }
  };

  const handleComplete = (task: ScheduledTask) => {
    setSelectedTask(task);
    setCompletionComment('');
    setShowCompleteModal(true);
  };

  const submitComplete = () => {
    if (selectedTask) {
      completeMutation.mutate({ id: selectedTask.id, comment: completionComment || undefined });
    }
  };

  const handleShowHistory = async (task: ScheduledTask) => {
    try {
      const response = await tasksApi.getHistory(task.id);
      setTaskHistory(response.data);
      setSelectedTask(task);
      setShowHistoryModal(true);
    } catch (error: any) {
      alert(`Failed to load history: ${error.response?.data?.detail || error.message}`);
    }
  };

  const handleAdd = () => {
    setEditingTask(null);
    resetForm();
    setShowModal(true);
  };

  const canModify =
    user?.role === UserRole.ADMIN ||
    user?.role === UserRole.OPERATOR ||
    user?.role === UserRole.TECHNICIAN;

  if (tasksLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div style={{ fontSize: '1.25rem', color: '#64748b' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
            Scheduled Tasks
          </h1>
          <p style={{ color: '#64748b' }}>Manage automated tasks and maintenance schedules</p>
        </div>
        {canModify && (
          <button
            onClick={handleAdd}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#3b82f6',
              color: 'white',
              borderRadius: '4px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            + Add Task
          </button>
        )}
      </div>

      <div
        style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ marginBottom: '1.5rem' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TaskStatus | 'all')}
            style={{
              padding: '0.5rem',
              border: '1px solid #e2e8f0',
              borderRadius: '4px',
              fontSize: '0.875rem',
            }}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="running">Running</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Task Name</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', maxWidth: '200px' }}>Description</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Type</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Assigned To</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Target</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Scheduled</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Status</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Recurring</th>
              {canModify && (
                <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600' }}>Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {filteredTasks?.map((task) => (
              <tr key={task.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '0.75rem', fontWeight: '500' }}>{task.name}</td>
                <td style={{ padding: '0.75rem', color: '#64748b', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={task.description || ''}>{task.description || '-'}</td>
                <td style={{ padding: '0.75rem' }}>
                  <span
                    style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      background: '#e0e7ff',
                      color: '#3730a3',
                    }}
                  >
                    {task.task_type}
                  </span>
                </td>
                <td style={{ padding: '0.75rem' }}>
                  {task.assigned_role ? (
                    <span
                      style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        background: roleColors[task.assigned_role]?.bg || '#f3f4f6',
                        color: roleColors[task.assigned_role]?.color || '#374151',
                      }}
                    >
                      {task.assigned_role}
                    </span>
                  ) : (
                    <span style={{ color: '#64748b' }}>-</span>
                  )}
                </td>
                <td style={{ padding: '0.75rem', color: '#64748b' }}>{task.target_server || 'All'}</td>
                <td style={{ padding: '0.75rem', color: '#64748b' }}>
                  {format(new Date(task.scheduled_time), 'MMM dd, yyyy HH:mm')}
                </td>
                <td style={{ padding: '0.75rem' }}>
                  <span
                    style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      background: task.status === 'completed' ? '#d1fae5' : task.status === 'running' ? '#dbeafe' : task.status === 'failed' ? '#fee2e2' : task.status === 'overdue' ? '#fef3c7' : '#f3f4f6',
                      color: task.status === 'completed' ? '#065f46' : task.status === 'running' ? '#1e40af' : task.status === 'failed' ? '#991b1b' : task.status === 'overdue' ? '#92400e' : '#374151',
                    }}
                  >
                    {task.status}
                  </span>
                </td>
                <td style={{ padding: '0.75rem' }}>
                  {task.is_recurring ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem' }}>
                        {task.recurrence_days === 1 ? 'Daily' :
                         task.recurrence_days === 7 ? 'Weekly' :
                         task.recurrence_days === 14 ? 'Bi-weekly' :
                         task.recurrence_days === 30 ? 'Monthly' :
                         `Every ${task.recurrence_days} days`}
                      </span>
                      <button
                        onClick={() => handleShowHistory(task)}
                        style={{
                          padding: '0.125rem 0.375rem',
                          background: '#f3f4f6',
                          color: '#374151',
                          borderRadius: '4px',
                          fontSize: '0.625rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        History
                      </button>
                    </div>
                  ) : (
                    'No'
                  )}
                </td>
                {canModify && (
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                    {(task.is_recurring || task.status === 'pending') && (
                      <button
                        onClick={() => handleComplete(task)}
                        style={{
                          padding: '0.25rem 0.75rem',
                          background: '#10b981',
                          color: 'white',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          marginRight: '0.5rem',
                          cursor: 'pointer',
                        }}
                      >
                        Complete
                      </button>
                    )}
                    {user?.role === UserRole.ADMIN && (
                      <>
                        <button
                          onClick={() => handleEdit(task)}
                          style={{
                            padding: '0.25rem 0.75rem',
                            background: '#3b82f6',
                            color: 'white',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            marginRight: '0.5rem',
                            cursor: 'pointer',
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(task)}
                          style={{
                            padding: '0.25rem 0.75rem',
                            background: '#ef4444',
                            color: 'white',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            cursor: 'pointer',
                          }}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {filteredTasks?.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
            No tasks found
          </div>
        )}
      </div>

      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            overflowY: 'auto',
            padding: '2rem',
          }}
        >
          <div
            style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '8px',
              width: '600px',
              maxWidth: '90%',
            }}
          >
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem' }}>
              {editingTask ? 'Edit Task' : 'Add New Task'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Task Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '4px',
                    fontSize: '1rem',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '4px',
                    fontSize: '1rem',
                  }}
                />
              </div>

              {user?.role === UserRole.ADMIN && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Assign to Role
                  </label>
                  <select
                    value={formData.assigned_role}
                    onChange={(e) => {
                      const role = e.target.value as UserRole | '';
                      const availableTypes = getAvailableTaskTypes(role);
                      const newTaskType = availableTypes.includes(formData.task_type as TaskType)
                        ? formData.task_type
                        : availableTypes[0];
                      setFormData({ ...formData, assigned_role: role, task_type: newTaskType });
                    }}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '4px',
                      fontSize: '1rem',
                    }}
                  >
                    <option value="">No specific role</option>
                    <option value={UserRole.OPERATOR}>Operator (backup, restart, update)</option>
                    <option value={UserRole.TECHNICIAN}>Technician (maintenance, diagnostic)</option>
                  </select>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Task Type *
                  </label>
                  <select
                    required
                    value={formData.task_type}
                    onChange={(e) => setFormData({ ...formData, task_type: e.target.value as TaskType })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '4px',
                      fontSize: '1rem',
                    }}
                  >
                    {getAvailableTaskTypes(formData.assigned_role).map((type) => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Target Server
                  </label>
                  <select
                    value={formData.target_server}
                    onChange={(e) => setFormData({ ...formData, target_server: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '4px',
                      fontSize: '1rem',
                    }}
                  >
                    <option value="">All Servers</option>
                    {servers?.map((server) => (
                      <option key={server.id} value={server.name}>
                        {server.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Scheduled Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.scheduled_time}
                  onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '4px',
                    fontSize: '1rem',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_recurring}
                    onChange={(e) =>
                      setFormData({ ...formData, is_recurring: e.target.checked, recurrence_days: 1 })
                    }
                    style={{ width: '1rem', height: '1rem' }}
                  />
                  <span style={{ fontWeight: '500' }}>Recurring Task</span>
                </label>
              </div>

              {formData.is_recurring && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Repeat Every
                  </label>
                  <select
                    value={formData.recurrence_days}
                    onChange={(e) => setFormData({ ...formData, recurrence_days: parseInt(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '4px',
                      fontSize: '1rem',
                    }}
                  >
                    <option value={1}>Daily (every day)</option>
                    <option value={7}>Weekly (every 7 days)</option>
                    <option value={14}>Bi-weekly (every 14 days)</option>
                    <option value={30}>Monthly (every 30 days)</option>
                  </select>
                  <small style={{ color: '#64748b' }}>
                    First occurrence: {formData.scheduled_time ? format(new Date(formData.scheduled_time), 'MMM dd, yyyy HH:mm') : 'select scheduled time'}
                  </small>
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: '#3b82f6',
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    fontWeight: '500',
                    cursor: createMutation.isPending || updateMutation.isPending ? 'not-allowed' : 'pointer',
                    opacity: createMutation.isPending || updateMutation.isPending ? 0.5 : 1,
                  }}
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Saving...'
                    : editingTask
                    ? 'Update'
                    : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingTask(null);
                    resetForm();
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#64748b',
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCompleteModal && selectedTask && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '8px',
              width: '500px',
              maxWidth: '90%',
            }}
          >
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem' }}>
              Complete Task
            </h2>
            <p style={{ marginBottom: '1rem', color: '#64748b' }}>
              Mark "{selectedTask.name}" as completed
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Comment (optional)
              </label>
              <textarea
                value={completionComment}
                onChange={(e) => setCompletionComment(e.target.value)}
                placeholder="Add any notes about task completion..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px',
                  fontSize: '1rem',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={submitComplete}
                disabled={completeMutation.isPending}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: '#10b981',
                  color: 'white',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: completeMutation.isPending ? 'not-allowed' : 'pointer',
                  opacity: completeMutation.isPending ? 0.5 : 1,
                }}
              >
                {completeMutation.isPending ? 'Completing...' : 'Complete Task'}
              </button>
              <button
                onClick={() => {
                  setShowCompleteModal(false);
                  setSelectedTask(null);
                  setCompletionComment('');
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#64748b',
                  color: 'white',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showHistoryModal && selectedTask && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '8px',
              width: '700px',
              maxWidth: '90%',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
          >
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem' }}>
              Completion History
            </h2>
            <p style={{ marginBottom: '1.5rem', color: '#64748b' }}>
              History for "{selectedTask.name}"
            </p>

            {taskHistory.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Date</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Completed By</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Comment</th>
                  </tr>
                </thead>
                <tbody>
                  {taskHistory.map((record) => (
                    <tr key={record.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '0.75rem' }}>
                        {format(new Date(record.completed_at), 'MMM dd, yyyy HH:mm')}
                      </td>
                      <td style={{ padding: '0.75rem', color: '#64748b' }}>
                        {record.completed_by_email}
                      </td>
                      <td style={{ padding: '0.75rem', color: '#64748b' }}>
                        {record.completion_comment || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                No completion history yet
              </p>
            )}

            <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
              <button
                onClick={() => {
                  setShowHistoryModal(false);
                  setSelectedTask(null);
                  setTaskHistory([]);
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#64748b',
                  color: 'white',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

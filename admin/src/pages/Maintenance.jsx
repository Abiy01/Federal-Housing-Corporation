import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import apiClient from '../services/apiClient';

const STATUS_STYLES = {
  open: 'bg-amber-50 text-amber-700 border border-amber-200',
  assigned: 'bg-blue-50 text-blue-700 border border-blue-200',
  in_progress: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
  completed: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  cancelled: 'bg-red-50 text-red-700 border border-red-200',
};

const PRIORITY_STYLES = {
  low: 'bg-slate-100 text-slate-700',
  medium: 'bg-amber-100 text-amber-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-700',
};

const Maintenance = () => {
  const [requests, setRequests] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [assigningId, setAssigningId] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState({});

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/api/maintenance/all', {
        params: { status: statusFilter },
      });
      setRequests(data?.requests || []);
    } catch (error) {
      console.error('Failed to load maintenance requests:', error);
      toast.error('Failed to load maintenance requests.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const fetchStaff = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/api/maintenance/staff');
      setStaff(data?.staff || []);
    } catch (error) {
      console.error('Failed to load maintenance staff:', error);
      toast.error('Failed to load maintenance staff list.');
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleAssign = async (requestId) => {
    const staffUserId = selectedStaff[requestId];
    if (!staffUserId) {
      toast.error('Please select maintenance staff first.');
      return;
    }

    setAssigningId(requestId);
    try {
      const { data } = await apiClient.put(`/api/maintenance/${requestId}/assign`, { staffUserId });
      if (!data?.success) {
        throw new Error(data?.message || 'Assignment failed');
      }
      toast.success('Maintenance request assigned successfully.');
      setRequests((prev) =>
        prev.map((item) => (item._id === requestId ? data.request : item))
      );
    } catch (err) {
      console.error('Failed to assign maintenance request:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Failed to assign request.');
    } finally {
      setAssigningId(null);
    }
  };

  const counts = useMemo(
    () => ({
      total: requests.length,
      open: requests.filter((item) => item.status === 'open').length,
      assigned: requests.filter((item) => item.status === 'assigned').length,
      inProgress: requests.filter((item) => item.status === 'in_progress').length,
      completed: requests.filter((item) => item.status === 'completed').length,
    }),
    [requests]
  );

  return (
    <div className="min-h-screen pt-8 pb-12 px-4 bg-[#FAF8F4]">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1C1B1A] mb-1">Maintenance Requests</h1>
          <p className="text-[#5A5856]">Review, assign, and track maintenance workflow.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <StatCard label="Total" value={counts.total} />
          <StatCard label="Open" value={counts.open} />
          <StatCard label="Assigned" value={counts.assigned} />
          <StatCard label="In Progress" value={counts.inProgress} />
          <StatCard label="Completed" value={counts.completed} />
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#E6D5C3] shadow-card mb-6">
          <label className="text-sm font-medium text-[#374151] mr-3">Filter Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-[#E6D5C3] rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="all">All</option>
            <option value="open">Open</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="bg-white rounded-2xl border border-[#E6D5C3] shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#1C1B1A]">
                  {['Issue', 'Property', 'Requested By', 'Priority', 'Status', 'Assigned To', 'Assign'].map((head) => (
                    <th
                      key={head}
                      className="px-4 py-3 text-left text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider"
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F1E8]">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-sm text-[#6B7280]">
                      Loading maintenance requests...
                    </td>
                  </tr>
                ) : requests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-sm text-[#6B7280]">
                      No maintenance requests found.
                    </td>
                  </tr>
                ) : (
                  requests.map((request) => (
                    <tr key={request._id} className="hover:bg-[#FAF8F4] transition-colors">
                      <td className="px-4 py-4">
                        <p className="text-sm font-semibold text-[#1C1B1A]">{request.title}</p>
                        <p className="text-xs text-[#6B7280] mt-1 line-clamp-2">{request.description}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm font-medium text-[#1C1B1A]">{request.property?.title || '—'}</p>
                        <p className="text-xs text-[#9CA3AF]">{request.property?.location || '—'}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm font-medium text-[#1C1B1A]">{request.requestedBy?.name || '—'}</p>
                        <p className="text-xs text-[#9CA3AF]">{request.requestedBy?.email || '—'}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${PRIORITY_STYLES[request.priority] || PRIORITY_STYLES.medium}`}>
                          {(request.priority || 'medium').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[request.status] || STATUS_STYLES.open}`}>
                          {(request.status || 'open').replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm font-medium text-[#1C1B1A]">{request.assignedTo?.name || 'Not assigned'}</p>
                        <p className="text-xs text-[#9CA3AF]">{request.assignedTo?.email || '—'}</p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 min-w-[260px]">
                          <select
                            value={selectedStaff[request._id] || request.assignedTo?._id || ''}
                            onChange={(e) =>
                              setSelectedStaff((prev) => ({
                                ...prev,
                                [request._id]: e.target.value,
                              }))
                            }
                            className="flex-1 border border-[#E6D5C3] rounded-lg px-2.5 py-2 text-xs bg-white"
                          >
                            <option value="">Select staff</option>
                            {staff.map((member) => (
                              <option key={member._id} value={member._id}>
                                {member.name} ({member.email})
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleAssign(request._id)}
                            disabled={assigningId === request._id || ['completed', 'cancelled'].includes(request.status)}
                            className="px-3 py-2 text-xs font-semibold text-white bg-[#D4755B] rounded-lg hover:bg-[#C05E44] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {assigningId === request._id ? 'Assigning...' : 'Assign'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value }) => (
  <div className="bg-white border border-[#E6D5C3] rounded-xl p-4 shadow-card">
    <p className="text-xs text-[#6B7280]">{label}</p>
    <p className="text-2xl font-bold text-[#1C1B1A] mt-1">{value}</p>
  </div>
);

export default Maintenance;

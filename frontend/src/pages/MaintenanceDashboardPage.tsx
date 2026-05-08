import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import { useAuth } from '../contexts/AuthContext';
import { maintenanceAPI } from '../services/api';

type MaintenanceStatus = 'assigned' | 'in_progress' | 'completed';

interface AssignedRequest {
  _id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: MaintenanceStatus;
  createdAt: string;
  property?: {
    title: string;
    location: string;
  };
  requestedBy?: {
    name: string;
    email: string;
  };
  auditStatus?: 'pending' | 'approved' | 'rejected';
  materialsTotal?: number;
}

const STATUS_STYLES: Record<MaintenanceStatus, string> = {
  assigned: 'bg-blue-50 text-blue-700 border border-blue-200',
  in_progress: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
  completed: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
};

const AUDIT_STYLES: Record<'pending' | 'approved' | 'rejected', string> = {
  pending: 'bg-amber-100 text-amber-800 border border-amber-200',
  approved: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  rejected: 'bg-red-100 text-red-700 border border-red-200',
};

const MaintenanceDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, user } = useAuth();

  const [requests, setRequests] = useState<AssignedRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | MaintenanceStatus>('all');
  const [activeCompletionForm, setActiveCompletionForm] = useState<string | null>(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [completionCost, setCompletionCost] = useState('');
  const [materialsDescription, setMaterialsDescription] = useState('');
  const [materialsReceiptFile, setMaterialsReceiptFile] = useState<File | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast.error('Please sign in to continue.');
      navigate('/signin', { replace: true });
      return;
    }
    if (!isLoading && user?.role !== 'maintenance') {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, user?.role]);

  const fetchAssignedRequests = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await maintenanceAPI.getAssigned({
        page: 1,
        limit: 100,
        status: statusFilter === 'all' ? 'all' : statusFilter,
      });
      setRequests(data?.requests ?? []);
    } catch (error) {
      console.error('Failed to fetch assigned requests:', error);
      toast.error('Failed to load assigned requests.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'maintenance') {
      fetchAssignedRequests();
    }
  }, [fetchAssignedRequests, isAuthenticated, user?.role]);

  const startWork = async (requestId: string) => {
    setUpdatingId(requestId);
    try {
      const { data } = await maintenanceAPI.updateStatus(requestId, { status: 'in_progress' });
      if (!data?.success) {
        throw new Error(data?.message || 'Unable to start work');
      }
      toast.success('Request moved to in progress.');
      setRequests((prev) =>
        prev.map((item) => (item._id === requestId ? { ...item, status: 'in_progress' } : item))
      );
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to update status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const completeWork = async (requestId: string) => {
    setUpdatingId(requestId);
    try {
      if (!materialsDescription.trim()) {
        toast.error('Please add purchased material details.');
        return;
      }
      if (!materialsReceiptFile) {
        toast.error('Please upload the materials receipt.');
        return;
      }

      const amount = Number(completionCost || '0');
      const payload = new FormData();
      payload.append('status', 'completed');
      if (completionNotes.trim()) payload.append('completionNotes', completionNotes.trim());
      if (!Number.isNaN(amount) && amount >= 0) {
        payload.append('completionCost', String(amount));
      }
      payload.append(
        'materials',
        JSON.stringify([
          {
            item: materialsDescription.trim(),
            quantity: 1,
            unitCost: !Number.isNaN(amount) && amount >= 0 ? amount : 0,
            totalCost: !Number.isNaN(amount) && amount >= 0 ? amount : 0,
          },
        ])
      );
      payload.append('materialsReceipt', materialsReceiptFile);

      const { data } = await maintenanceAPI.updateStatus(requestId, payload);
      if (!data?.success) {
        throw new Error(data?.message || 'Unable to complete request');
      }

      toast.success('Request marked as completed.');
      setRequests((prev) =>
        prev.map((item) => (item._id === requestId ? { ...item, status: 'completed' } : item))
      );
      setActiveCompletionForm(null);
      setCompletionNotes('');
      setCompletionCost('');
      setMaterialsDescription('');
      setMaterialsReceiptFile(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to complete request.');
    } finally {
      setUpdatingId(null);
    }
  };

  const counts = useMemo(
    () => ({
      assigned: requests.filter((r) => r.status === 'assigned').length,
      inProgress: requests.filter((r) => r.status === 'in_progress').length,
      completed: requests.filter((r) => r.status === 'completed').length,
    }),
    [requests]
  );

  return (
    <div className="min-h-screen bg-[#FAF8F4]">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="font-fraunces text-4xl font-bold text-[#221410]">Maintenance Dashboard</h1>
          <p className="font-manrope text-[#6B7280] mt-1">
            Manage your assigned requests and update repair progress.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white border border-[#E6E0DA] rounded-xl p-4">
            <p className="font-manrope text-xs text-[#6B7280]">Assigned</p>
            <p className="font-fraunces text-2xl text-[#221410]">{counts.assigned}</p>
          </div>
          <div className="bg-white border border-[#E6E0DA] rounded-xl p-4">
            <p className="font-manrope text-xs text-[#6B7280]">In Progress</p>
            <p className="font-fraunces text-2xl text-[#221410]">{counts.inProgress}</p>
          </div>
          <div className="bg-white border border-[#E6E0DA] rounded-xl p-4">
            <p className="font-manrope text-xs text-[#6B7280]">Completed</p>
            <p className="font-fraunces text-2xl text-[#221410]">{counts.completed}</p>
          </div>
          <div className="bg-white border border-[#E6E0DA] rounded-xl p-4">
            <p className="font-manrope text-xs text-[#6B7280]">Total</p>
            <p className="font-fraunces text-2xl text-[#221410]">{requests.length}</p>
          </div>
        </div>

        <div className="bg-white border border-[#E6E0DA] rounded-xl p-4 mb-6">
          <label className="font-manrope text-sm font-medium text-[#374151] mr-3">Filter Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | MaintenanceStatus)}
            className="border border-[#E6E0DA] rounded-lg px-3 py-2 text-sm font-manrope bg-white"
          >
            <option value="all">All</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="bg-white border border-[#E6E0DA] rounded-xl p-6 font-manrope text-sm text-[#6B7280]">
              Loading assigned requests...
            </div>
          ) : requests.length === 0 ? (
            <div className="bg-white border border-[#E6E0DA] rounded-xl p-6 font-manrope text-sm text-[#6B7280]">
              No assigned maintenance requests.
            </div>
          ) : (
            requests.map((request) => (
              <div key={request._id} className="bg-white border border-[#E6E0DA] rounded-2xl p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div>
                    <h2 className="font-manrope font-semibold text-lg text-[#221410]">{request.title}</h2>
                    <p className="font-manrope text-sm text-[#6B7280] mt-1">
                      {request.property?.title || 'Property'} · {request.property?.location || 'Unknown location'}
                    </p>
                    <p className="font-manrope text-sm text-[#4B5563] mt-3">{request.description}</p>
                    <p className="font-manrope text-xs text-[#9CA3AF] mt-3">
                      Requested by {request.requestedBy?.name || 'Unknown'} ({request.requestedBy?.email || 'No email'})
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                      {request.priority.toUpperCase()}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[request.status]}`}>
                      {request.status.replace('_', ' ')}
                    </span>
                    {request.status === 'completed' && request.auditStatus && (
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${AUDIT_STYLES[request.auditStatus]}`}>
                        audit {request.auditStatus}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  {request.status === 'assigned' && (
                    <button
                      onClick={() => startWork(request._id)}
                      disabled={updatingId === request._id}
                      className="bg-indigo-600 text-white text-sm font-manrope font-semibold px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-60"
                    >
                      {updatingId === request._id ? 'Updating...' : 'Start Work'}
                    </button>
                  )}

                  {request.status === 'in_progress' && (
                    <>
                      <button
                        onClick={() =>
                          setActiveCompletionForm((current) =>
                            current === request._id ? null : request._id
                          )
                        }
                        className="bg-emerald-600 text-white text-sm font-manrope font-semibold px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                      >
                        Mark Completed
                      </button>
                    </>
                  )}
                </div>

                {activeCompletionForm === request._id && request.status === 'in_progress' && (
                  <div className="mt-4 bg-[#FAF8F4] border border-[#E6E0DA] rounded-xl p-4 space-y-3">
                    <div>
                      <label className="block font-manrope text-sm text-[#374151] mb-1">Completion Notes</label>
                      <textarea
                        value={completionNotes}
                        onChange={(e) => setCompletionNotes(e.target.value)}
                        rows={3}
                        placeholder="Describe the work done..."
                        className="w-full border border-[#E6E0DA] rounded-lg px-3 py-2 text-sm font-manrope resize-none"
                      />
                    </div>
                    <div>
                      <label className="block font-manrope text-sm text-[#374151] mb-1">Cost (ETB)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={completionCost}
                        onChange={(e) => setCompletionCost(e.target.value)}
                        placeholder="Optional"
                        className="w-full md:w-60 border border-[#E6E0DA] rounded-lg px-3 py-2 text-sm font-manrope"
                      />
                    </div>
                    <div>
                      <label className="block font-manrope text-sm text-[#374151] mb-1">Purchased Materials</label>
                      <textarea
                        value={materialsDescription}
                        onChange={(e) => setMaterialsDescription(e.target.value)}
                        rows={2}
                        placeholder="List purchased items for repair..."
                        className="w-full border border-[#E6E0DA] rounded-lg px-3 py-2 text-sm font-manrope resize-none"
                      />
                    </div>
                    <div>
                      <label className="block font-manrope text-sm text-[#374151] mb-1">Materials Receipt</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setMaterialsReceiptFile(e.target.files?.[0] || null)}
                        className="w-full md:w-80 border border-[#E6E0DA] rounded-lg px-3 py-2 text-sm font-manrope bg-white"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => completeWork(request._id)}
                        disabled={updatingId === request._id}
                        className="bg-[#D4755B] text-white text-sm font-manrope font-semibold px-4 py-2 rounded-lg hover:bg-[#B86851] transition-colors disabled:opacity-60"
                      >
                        {updatingId === request._id ? 'Saving...' : 'Confirm Completion'}
                      </button>
                      <button
                        onClick={() => setActiveCompletionForm(null)}
                        className="text-sm font-manrope font-medium text-[#6B7280] hover:text-[#374151]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default MaintenanceDashboardPage;

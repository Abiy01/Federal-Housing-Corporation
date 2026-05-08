import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import { useAuth } from '../contexts/AuthContext';
import { leasesAPI, maintenanceAPI } from '../services/api';
import { formatPrice } from '../utils/formatPrice';

type Priority = 'low' | 'medium' | 'high' | 'urgent';
type MaintenanceStatus = 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';

interface PropertyOption {
  _id: string;
  title: string;
  location: string;
}

interface LeaseItem {
  _id: string;
  status: 'active' | 'renewal_pending' | 'ending_pending' | 'ended';
  property?: PropertyOption;
}

interface MaintenanceRequest {
  _id: string;
  title: string;
  description: string;
  priority: Priority;
  status: MaintenanceStatus;
  createdAt: string;
  property?: {
    _id: string;
    title: string;
    location: string;
  };
  assignedTo?: {
    name: string;
    email: string;
  };
  completionNotes?: string;
  completionCost?: number;
  auditStatus?: 'pending' | 'approved' | 'rejected';
}

const STATUS_STYLES: Record<MaintenanceStatus, string> = {
  open: 'bg-amber-50 text-amber-700 border border-amber-200',
  assigned: 'bg-blue-50 text-blue-700 border border-blue-200',
  in_progress: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
  completed: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  cancelled: 'bg-red-50 text-red-700 border border-red-200',
};

const PRIORITY_STYLES: Record<Priority, string> = {
  low: 'bg-slate-100 text-slate-700',
  medium: 'bg-amber-100 text-amber-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-700',
};

const MyMaintenanceRequestsPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, user } = useAuth();

  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'medium' as Priority,
    propertyId: '',
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast.error('Please sign in to manage maintenance requests.');
      navigate('/signin', { replace: true });
      return;
    }
    if (!isLoading && user?.role === 'maintenance') {
      navigate('/maintenance-dashboard', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, user?.role]);

  const fetchData = useCallback(async () => {
    setLoadingData(true);
    try {
      const [leasesRes, requestsRes] = await Promise.all([
        leasesAPI.getMyLeases(),
        maintenanceAPI.getMy({ page: 1, limit: 100 }),
      ]);

      const fetchedLeases: LeaseItem[] = leasesRes.data?.leases ?? [];
      const activeLeaseProperties = fetchedLeases
        .filter((lease) => lease.status === 'active' && lease.property?._id)
        .map((lease) => lease.property as PropertyOption);

      const uniqueActiveLeaseProperties = activeLeaseProperties.filter(
        (property, index, arr) => arr.findIndex((item) => item._id === property._id) === index
      );

      setProperties(uniqueActiveLeaseProperties);
      if (uniqueActiveLeaseProperties.length > 0) {
        setForm((prev) => ({
          ...prev,
          propertyId: prev.propertyId || uniqueActiveLeaseProperties[0]._id,
        }));
      } else {
        setForm((prev) => ({ ...prev, propertyId: '' }));
      }

      setRequests(requestsRes.data?.requests ?? []);
    } catch (error) {
      console.error('Failed to fetch maintenance data:', error);
      toast.error('Failed to load maintenance requests.');
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && user?.role !== 'maintenance') {
      fetchData();
    }
  }, [fetchData, isAuthenticated, user?.role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.propertyId) {
      toast.error('Please select a property.');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await maintenanceAPI.create(form);
      if (!data?.success) {
        throw new Error(data?.message || 'Unable to submit request');
      }
      toast.success('Maintenance request submitted.');
      setForm((prev) => ({ ...prev, title: '', description: '', priority: 'medium' }));
      setRequests((prev) => [data.request, ...prev]);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  const statusCounts = useMemo(
    () => ({
      total: requests.length,
      open: requests.filter((r) => r.status === 'open').length,
      inProgress: requests.filter((r) => r.status === 'in_progress').length,
      completed: requests.filter((r) => r.status === 'completed').length,
    }),
    [requests]
  );

  return (
    <div className="min-h-screen bg-[#FAF8F4]">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-8">
          <div>
            <h1 className="font-fraunces text-4xl font-bold text-[#221410]">My Maintenance Requests</h1>
            <p className="font-manrope text-[#6B7280] mt-1">
              Track issues for your listings and see repair progress.
            </p>
          </div>
          <Link
            to="/properties"
            className="inline-flex items-center justify-center border border-[#D4755B] text-[#D4755B] font-manrope font-semibold px-4 py-2 rounded-lg hover:bg-[#D4755B] hover:text-white transition-colors"
          >
            Back to Properties
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          <div className="bg-white border border-[#E6E0DA] rounded-xl p-4">
            <p className="font-manrope text-xs text-[#6B7280]">Total</p>
            <p className="font-fraunces text-2xl text-[#221410]">{statusCounts.total}</p>
          </div>
          <div className="bg-white border border-[#E6E0DA] rounded-xl p-4">
            <p className="font-manrope text-xs text-[#6B7280]">Open</p>
            <p className="font-fraunces text-2xl text-[#221410]">{statusCounts.open}</p>
          </div>
          <div className="bg-white border border-[#E6E0DA] rounded-xl p-4">
            <p className="font-manrope text-xs text-[#6B7280]">In Progress</p>
            <p className="font-fraunces text-2xl text-[#221410]">{statusCounts.inProgress}</p>
          </div>
          <div className="bg-white border border-[#E6E0DA] rounded-xl p-4">
            <p className="font-manrope text-xs text-[#6B7280]">Completed</p>
            <p className="font-fraunces text-2xl text-[#221410]">{statusCounts.completed}</p>
          </div>
        </div>

        <div className="bg-white border border-[#E6E0DA] rounded-2xl p-6 mb-8">
          <h2 className="font-fraunces text-2xl font-semibold text-[#221410] mb-4">Submit New Request</h2>

          {properties.length === 0 ? (
            <p className="font-manrope text-sm text-[#6B7280]">
              No active rent lease properties are currently available for maintenance requests.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block font-manrope text-sm font-medium text-[#374151] mb-1">Property</label>
                <select
                  value={form.propertyId}
                  onChange={(e) => setForm((prev) => ({ ...prev, propertyId: e.target.value }))}
                  className="w-full border border-[#E6E0DA] rounded-lg px-3 py-2.5 font-manrope text-sm bg-white"
                  required
                >
                  {properties.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.title} - {item.location}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-manrope text-sm font-medium text-[#374151] mb-1">Issue Title</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Water leakage in kitchen"
                  className="w-full border border-[#E6E0DA] rounded-lg px-3 py-2.5 font-manrope text-sm"
                  required
                />
              </div>

              <div>
                <label className="block font-manrope text-sm font-medium text-[#374151] mb-1">Priority</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value as Priority }))}
                  className="w-full border border-[#E6E0DA] rounded-lg px-3 py-2.5 font-manrope text-sm bg-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block font-manrope text-sm font-medium text-[#374151] mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  placeholder="Describe the issue in detail..."
                  className="w-full border border-[#E6E0DA] rounded-lg px-3 py-2.5 font-manrope text-sm resize-none"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#D4755B] text-white font-manrope font-semibold px-6 py-2.5 rounded-lg hover:bg-[#B86851] transition-colors disabled:opacity-60"
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="bg-white border border-[#E6E0DA] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#F3EDE8]">
            <h3 className="font-fraunces text-xl text-[#221410]">Request History</h3>
          </div>

          {loadingData ? (
            <div className="p-6 font-manrope text-sm text-[#6B7280]">Loading requests...</div>
          ) : requests.length === 0 ? (
            <div className="p-6 font-manrope text-sm text-[#6B7280]">No maintenance requests found.</div>
          ) : (
            <div className="divide-y divide-[#F3EDE8]">
              {requests.map((request) => (
                <div key={request._id} className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div>
                      <h4 className="font-manrope font-semibold text-[#221410]">{request.title}</h4>
                      <p className="font-manrope text-sm text-[#6B7280] mt-1">
                        {request.property?.title || 'Property'} · {request.property?.location || 'Location unavailable'}
                      </p>
                      <p className="font-manrope text-sm text-[#4B5563] mt-3">{request.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${PRIORITY_STYLES[request.priority]}`}>
                        {request.priority.toUpperCase()}
                      </span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[request.status]}`}>
                        {request.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs font-manrope text-[#9CA3AF]">
                    <span>Created {new Date(request.createdAt).toLocaleString()}</span>
                    <span>
                      Assigned to:{' '}
                      <span className="text-[#6B7280]">
                        {request.assignedTo?.name || 'Not assigned'}
                      </span>
                    </span>
                  </div>

                  {request.status === 'completed' &&
                    (request.completionNotes || typeof request.completionCost === 'number') && (
                    <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                      {request.completionNotes && (
                        <p className="font-manrope text-sm text-emerald-800">{request.completionNotes}</p>
                      )}
                      {typeof request.completionCost === 'number' && (
                        <p className="font-manrope text-xs text-emerald-700 mt-1">
                          Completion cost:{' '}
                          {typeof request.completionCost === 'number'
                            ? formatPrice(request.completionCost)
                            : request.completionCost}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default MyMaintenanceRequestsPage;

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import { financeAuditAPI, maintenanceAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

type AuditStatus = 'pending' | 'approved' | 'rejected';
type TabKey = 'maintenance' | 'payments' | 'leases' | 'transactions';

const badgeClass: Record<AuditStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-700',
};

const FinanceAuditPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [tab, setTab] = useState<TabKey>('maintenance');
  const [summary, setSummary] = useState({ pendingPayments: 0, pendingLeases: 0, pendingTransactions: 0 });
  const [maintenanceAudits, setMaintenanceAudits] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [leases, setLeases] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate('/signin', { replace: true });
    if (!isLoading && user?.role !== 'finance') navigate('/', { replace: true });
  }, [isAuthenticated, isLoading, navigate, user?.role]);

  const load = async () => {
    setLoading(true);
    try {
      const [summaryRes, maintenanceRes, paymentsRes, leasesRes, transactionsRes] = await Promise.all([
        financeAuditAPI.getSummary(),
        maintenanceAPI.getAudits({ auditStatus: 'pending' }),
        financeAuditAPI.getPayments({ auditStatus: 'pending' }),
        financeAuditAPI.getLeases({ auditStatus: 'pending' }),
        financeAuditAPI.getTransactions({ auditStatus: 'pending' }),
      ]);
      setSummary(summaryRes.data?.summary || summary);
      setMaintenanceAudits(maintenanceRes.data?.requests || []);
      setPayments(paymentsRes.data?.payments || []);
      setLeases(leasesRes.data?.leases || []);
      setTransactions(transactionsRes.data?.transactions || []);
    } catch {
      toast.error('Failed to load finance audit queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.role === 'finance') load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.role]);

  const review = async (
    target: TabKey,
    id: string,
    auditStatus: 'approved' | 'rejected',
    note = ''
  ) => {
    try {
      if (target === 'maintenance') await maintenanceAPI.reviewAudit(id, { auditStatus, note });
      if (target === 'payments') await financeAuditAPI.reviewPayment(id, { auditStatus, note });
      if (target === 'leases') await financeAuditAPI.reviewLease(id, { auditStatus, note });
      if (target === 'transactions') await financeAuditAPI.reviewTransaction(id, { auditStatus, note });
      toast.success(`Marked as ${auditStatus}.`);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update audit status.');
    }
  };

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: 'maintenance', label: 'Maintenance', count: maintenanceAudits.length },
    { key: 'payments', label: 'Payments', count: summary.pendingPayments || payments.length },
    { key: 'leases', label: 'Leases', count: summary.pendingLeases || leases.length },
    { key: 'transactions', label: 'Transactions', count: summary.pendingTransactions || transactions.length },
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F4]">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="font-fraunces text-4xl font-bold text-[#221410]">Finance Audit Queue</h1>
        <p className="font-manrope text-[#6B7280] mt-1">Review maintenance costs and financial audit items.</p>

        <div className="mt-6 flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-manrope font-semibold border ${
                tab === t.key
                  ? 'bg-[#D4755B] text-white border-[#D4755B]'
                  : 'bg-white text-[#374151] border-[#E6E0DA] hover:border-[#D4755B]'
              }`}
            >
              {t.label} ({t.count})
            </button>
          ))}
        </div>

        <div className="mt-6 bg-white border border-[#E6E0DA] rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-6 font-manrope text-sm text-[#6B7280]">Loading audit queue...</div>
          ) : (
            <div className="divide-y divide-[#F3EDE8]">
              {tab === 'maintenance' &&
                maintenanceAudits.map((item) => (
                  <AuditRow
                    key={item._id}
                    title={item.title}
                    subtitle={`${item.property?.title || 'Property'} · Materials total ${item.materialsTotal || 0} ETB`}
                    status={item.auditStatus || 'pending'}
                    onApprove={() => review('maintenance', item._id, 'approved')}
                    onReject={() => review('maintenance', item._id, 'rejected')}
                  />
                ))}
              {tab === 'payments' &&
                payments.map((item) => (
                  <AuditRow
                    key={item._id}
                    title={`${item.user?.name || 'User'} payment`}
                    subtitle={`${item.property?.title || 'Property'} · ${item.amount || 0} ETB`}
                    status={item.auditStatus || 'pending'}
                    onApprove={() => review('payments', item._id, 'approved')}
                    onReject={() => review('payments', item._id, 'rejected')}
                  />
                ))}
              {tab === 'leases' &&
                leases.map((item) => (
                  <AuditRow
                    key={item._id}
                    title={`${item.user?.name || 'User'} lease`}
                    subtitle={`${item.property?.title || 'Property'} · ${item.status}`}
                    status={item.auditStatus || 'pending'}
                    onApprove={() => review('leases', item._id, 'approved')}
                    onReject={() => review('leases', item._id, 'rejected')}
                  />
                ))}
              {tab === 'transactions' &&
                transactions.map((item) => (
                  <AuditRow
                    key={item._id}
                    title={`${item.requestType?.toUpperCase() || 'Transaction'} request`}
                    subtitle={`${item.property?.title || 'Property'} · ${item.status}`}
                    status={item.auditStatus || 'pending'}
                    onApprove={() => review('transactions', item._id, 'approved')}
                    onReject={() => review('transactions', item._id, 'rejected')}
                  />
                ))}

              {((tab === 'maintenance' && maintenanceAudits.length === 0) ||
                (tab === 'payments' && payments.length === 0) ||
                (tab === 'leases' && leases.length === 0) ||
                (tab === 'transactions' && transactions.length === 0)) && (
                <div className="p-6 font-manrope text-sm text-[#6B7280]">No pending audit items.</div>
              )}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

const AuditRow = ({
  title,
  subtitle,
  status,
  onApprove,
  onReject,
}: {
  title: string;
  subtitle: string;
  status: AuditStatus;
  onApprove: () => void;
  onReject: () => void;
}) => (
  <div className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
    <div>
      <p className="font-manrope font-semibold text-[#221410]">{title}</p>
      <p className="font-manrope text-sm text-[#6B7280] mt-1">{subtitle}</p>
    </div>
    <div className="flex items-center gap-2">
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${badgeClass[status]}`}>{status}</span>
      <button onClick={onApprove} className="px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700">
        Approve
      </button>
      <button onClick={onReject} className="px-3 py-2 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-700">
        Reject
      </button>
    </div>
  </div>
);

export default FinanceAuditPage;

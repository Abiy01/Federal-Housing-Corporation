import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import apiClient from "../services/apiClient";
import { formatDate, formatPrice } from "../lib/utils";

const TYPE_STYLES = {
  rent: "bg-indigo-50 text-indigo-700 border border-indigo-200",
  buy: "bg-purple-50 text-purple-700 border border-purple-200",
};

const STATUS_STYLES = {
  approved: "bg-emerald-50 text-emerald-700 border border-emerald-200",
};

const REPORT_TABS = [
  { key: "inventory", label: "Inventory + Transactions" },
  { key: "funnel", label: "Demand Funnel" },
  { key: "payments", label: "Payment Verification" },
  { key: "operations", label: "Lease & Maintenance Ops" },
  { key: "finance", label: "Finance Audits" },
  { key: "risk", label: "Risk & Moderation" },
];

const StatCard = ({ label, value, hint }) => (
  <div className="bg-white border border-[#E6D5C3] rounded-xl p-5 shadow-card">
    <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">{label}</p>
    <p className="text-2xl sm:text-3xl font-bold text-[#1C1B1A] mt-2 tabular-nums break-words">{value ?? "—"}</p>
    {hint ? <p className="text-xs text-[#9CA3AF] mt-2">{hint}</p> : null}
  </div>
);

const Reports = () => {
  const [activeTab, setActiveTab] = useState("inventory");
  const [stats, setStats] = useState({ totalAvailable: 0, totalRented: 0, totalSold: 0, totalTransactions: 0 });
  const [revenue, setRevenue] = useState({
    allTime: { total: 0, rent: 0, buy: 0 },
    filtered: { total: 0, rent: 0, buy: 0 },
  });
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [requestType, setRequestType] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: pagination.limit };
      if (requestType === "rent" || requestType === "buy") params.requestType = requestType;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      const [transactionsRes, summaryRes] = await Promise.all([
        apiClient.get("/api/admin/reports/transactions", { params }),
        apiClient.get("/api/admin/reports/summary", { params }),
      ]);

      if (!transactionsRes.data?.success) throw new Error(transactionsRes.data?.message || "Failed to load reports");
      if (!summaryRes.data?.success) throw new Error(summaryRes.data?.message || "Failed to load report summary");

      setStats(transactionsRes.data.stats || {});
      setRevenue(
        transactionsRes.data.revenue || {
          allTime: { total: 0, rent: 0, buy: 0 },
          filtered: { total: 0, rent: 0, buy: 0 },
        }
      );
      setTransactions(transactionsRes.data.transactions || []);
      setPagination((prev) => ({ ...prev, ...(transactionsRes.data.pagination || {}) }));
      setSummary(summaryRes.data.summary || null);
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || error?.message || "Failed to load reports.");
    } finally {
      setLoading(false);
    }
  }, [requestType, dateFrom, dateTo, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [requestType, dateFrom, dateTo]);

  const clearDates = () => {
    setDateFrom("");
    setDateTo("");
  };

  const funnel = summary?.funnel || {};
  const paymentVerification = summary?.paymentVerification || {};
  const leaseHealth = summary?.leaseHealth || {};
  const maintenanceOps = summary?.maintenanceOps || {};
  const financeAudit = summary?.financeAudit || {};
  const riskModeration = summary?.riskModeration || {};

  const showFilteredRevenue = useMemo(
    () => requestType !== "all" || dateFrom || dateTo,
    [requestType, dateFrom, dateTo]
  );

  return (
    <div className="min-h-screen pt-8 pb-12 px-4 bg-[#FAF8F4]">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1C1B1A] mb-1">Reports</h1>
          <p className="text-[#5A5856]">Admin reporting hub across inventory, demand, operations, finance, and risk.</p>
        </div>

        <div className="bg-white rounded-2xl p-3 border border-[#E6D5C3] shadow-card mb-6 flex flex-wrap gap-2">
          {REPORT_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                activeTab === tab.key ? "bg-[#1C1B1A] text-white" : "text-[#5A5856] hover:bg-[#F5F1E8]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#E6D5C3] shadow-card mb-6 flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1">Type</label>
            <select
              value={requestType}
              onChange={(e) => setRequestType(e.target.value)}
              className="border border-[#E6D5C3] rounded-lg px-3 py-2 text-sm bg-white min-w-[140px]"
            >
              <option value="all">All</option>
              <option value="rent">Rent</option>
              <option value="buy">Buy</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border border-[#E6D5C3] rounded-lg px-3 py-2 text-sm bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="border border-[#E6D5C3] rounded-lg px-3 py-2 text-sm bg-white"
            />
          </div>
          <button
            type="button"
            onClick={clearDates}
            className="text-sm font-semibold text-[#D4755B] hover:text-[#C05E44] px-2 py-2"
          >
            Clear dates
          </button>
        </div>

        {activeTab === "inventory" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
              <StatCard label="Total available properties" value={stats.totalAvailable} />
              <StatCard label="Total rented properties" value={stats.totalRented} />
              <StatCard label="Total sold properties" value={stats.totalSold} />
              <StatCard label="Total transactions (approved)" value={stats.totalTransactions} />
            </div>

            <h2 className="text-lg font-bold text-[#1C1B1A] mb-3">Deal value (revenue)</h2>
            <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 ${showFilteredRevenue ? "mb-4" : "mb-8"}`}>
              <StatCard label="All time — total" value={formatPrice(revenue.allTime?.total ?? 0)} hint="Approved rent + buy" />
              <StatCard label="All time — rent" value={formatPrice(revenue.allTime?.rent ?? 0)} />
              <StatCard label="All time — buy" value={formatPrice(revenue.allTime?.buy ?? 0)} />
            </div>
            {showFilteredRevenue && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <StatCard label="Matching filters — total" value={formatPrice(revenue.filtered?.total ?? 0)} hint="Same scope as table" />
                <StatCard label="Matching filters — rent" value={formatPrice(revenue.filtered?.rent ?? 0)} />
                <StatCard label="Matching filters — buy" value={formatPrice(revenue.filtered?.buy ?? 0)} />
              </div>
            )}

            <div className="bg-white rounded-2xl border border-[#E6D5C3] shadow-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#1C1B1A]">
                      {["Property", "User", "Type", "Status", "Deal value", "Date"].map((head) => (
                        <th key={head} className="px-4 py-3 text-left text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
                          {head}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F5F1E8]">
                    {loading ? (
                      <tr><td colSpan={6} className="px-4 py-8 text-sm text-[#6B7280]">Loading report…</td></tr>
                    ) : transactions.length === 0 ? (
                      <tr><td colSpan={6} className="px-4 py-8 text-sm text-[#6B7280]">No approved transactions match these filters.</td></tr>
                    ) : (
                      transactions.map((row) => (
                        <tr key={row._id} className="hover:bg-[#FAF8F4] transition-colors">
                          <td className="px-4 py-4"><p className="text-sm font-semibold text-[#1C1B1A]">{row.property?.title || "—"}</p><p className="text-xs text-[#9CA3AF]">{row.property?.location || "—"}</p></td>
                          <td className="px-4 py-4"><p className="text-sm font-medium text-[#1C1B1A]">{row.user?.name || "—"}</p><p className="text-xs text-[#9CA3AF]">{row.user?.email || "—"}</p></td>
                          <td className="px-4 py-4"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${TYPE_STYLES[row.requestType] || TYPE_STYLES.rent}`}>{(row.requestType || "rent").toUpperCase()}</span></td>
                          <td className="px-4 py-4"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[row.status] || STATUS_STYLES.approved}`}>{(row.status || "approved").toUpperCase()}</span></td>
                          <td className="px-4 py-4"><p className="text-sm font-semibold text-[#1C1B1A]">{formatPrice(row.amount ?? 0)}</p></td>
                          <td className="px-4 py-4"><p className="text-sm text-[#5A5856]">{formatDate(row.date)}</p></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-[#F5F1E8] px-4 py-3 flex items-center justify-between">
                <p className="text-sm text-[#6B7280]">Page {pagination.page} of {Math.max(pagination.totalPages || 1, 1)} ({pagination.total || 0} rows)</p>
                <div className="flex items-center gap-2">
                  <button type="button" disabled={pagination.page <= 1} onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(prev.page - 1, 1) }))} className="px-3 py-1.5 text-sm rounded-lg border border-[#E6D5C3] disabled:opacity-50">Previous</button>
                  <button type="button" disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination((prev) => ({ ...prev, page: Math.min(prev.page + 1, prev.totalPages || prev.page + 1) }))} className="px-3 py-1.5 text-sm rounded-lg border border-[#E6D5C3] disabled:opacity-50">Next</button>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === "funnel" && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Property views" value={funnel.views || 0} />
            <StatCard label="Appointment requests" value={funnel.appointmentRequests || 0} />
            <StatCard label="Transaction requests" value={funnel.transactionRequests || 0} />
            <StatCard label="Payment proofs submitted" value={funnel.paymentProofsSubmitted || 0} />
            <StatCard label="Approved transactions" value={funnel.approvedTransactions || 0} />
            <StatCard label="Rented + Sold closes" value={funnel.closedDeals || 0} />
            <StatCard label="Views → Appointments" value={`${funnel.conversion?.viewsToAppointmentsPct || 0}%`} />
            <StatCard label="Appointments → Transactions" value={`${funnel.conversion?.appointmentsToTransactionsPct || 0}%`} />
            <StatCard label="Transactions → Approvals" value={`${funnel.conversion?.transactionsToApprovalsPct || 0}%`} />
          </div>
        )}

        {activeTab === "payments" && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Pending payments" value={paymentVerification.pending?.total || 0} />
            <StatCard label="Pending <24h" value={paymentVerification.pending?.lt24h || 0} />
            <StatCard label="Pending 24-72h" value={paymentVerification.pending?.h24to72 || 0} />
            <StatCard label="Pending >72h" value={paymentVerification.pending?.gt72h || 0} />
            <StatCard label="Approved payments" value={paymentVerification.successful || 0} />
            <StatCard label="Rejected payments" value={paymentVerification.failed || 0} />
            <StatCard label="Approval rate" value={`${paymentVerification.approvalRatePct || 0}%`} />
            <StatCard label="Average review time" value={`${paymentVerification.avgReviewHours || 0} h`} />
          </div>
        )}

        {activeTab === "operations" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-[#1C1B1A] mb-3">Lease Health</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard label="Active leases" value={leaseHealth.active || 0} />
                <StatCard label="Renewal pending" value={leaseHealth.renewalPending || 0} />
                <StatCard label="Ending pending" value={leaseHealth.endingPending || 0} />
                <StatCard label="Ended leases" value={leaseHealth.ended || 0} />
                <StatCard label="Due in next 7 days" value={leaseHealth.dueIn7Days || 0} />
                <StatCard label="Overdue rent dues" value={leaseHealth.overdue || 0} />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1C1B1A] mb-3">Maintenance Operations</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard label="Open requests" value={maintenanceOps.open || 0} />
                <StatCard label="Assigned requests" value={maintenanceOps.assigned || 0} />
                <StatCard label="In progress" value={maintenanceOps.inProgress || 0} />
                <StatCard label="Completed" value={maintenanceOps.completed || 0} />
                <StatCard label="Avg assignment lag" value={`${maintenanceOps.avgAssignHours || 0} h`} />
                <StatCard label="Avg completion time" value={`${maintenanceOps.avgCompletionHours || 0} h`} />
                <StatCard label="Materials total cost" value={formatPrice(maintenanceOps.materialsTotal || 0)} />
                <StatCard label="Audit pending" value={maintenanceOps.auditMix?.pending || 0} />
                <StatCard label="Audit approved / rejected" value={`${maintenanceOps.auditMix?.approved || 0} / ${maintenanceOps.auditMix?.rejected || 0}`} />
              </div>
            </div>
          </div>
        )}

        {activeTab === "finance" && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Pending maintenance audits" value={financeAudit.pendingMaintenance || 0} />
            <StatCard label="Pending payment audits" value={financeAudit.pendingPayments || 0} />
            <StatCard label="Pending lease audits" value={financeAudit.pendingLeases || 0} />
            <StatCard label="Pending transaction audits" value={financeAudit.pendingTransactions || 0} />
            <StatCard label="Total pending audits" value={financeAudit.pendingTotal || 0} />
            <StatCard label="Avg finance turnaround" value={`${financeAudit.avgTurnaroundHours || 0} h`} />
          </div>
        )}

        {activeTab === "risk" && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Suspended users" value={riskModeration.suspendedUsers || 0} />
            <StatCard label="Banned users" value={riskModeration.bannedUsers || 0} />
            <StatCard label="Flagged users total" value={riskModeration.flaggedUsersTotal || 0} />
            <StatCard label="Moderation actions (last 30d)" value={riskModeration.moderationActionsLast30Days || 0} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;

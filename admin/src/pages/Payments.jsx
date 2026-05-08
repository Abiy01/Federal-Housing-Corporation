import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import apiClient from "../services/apiClient";
import { formatPrice } from "../lib/utils";

const STATUS_STYLES = {
  pending: "bg-amber-50 text-amber-700 border border-amber-200",
  successful: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  failed: "bg-red-50 text-red-700 border border-red-200",
};

const METHOD_STYLES = {
  telebirr: "bg-indigo-50 text-indigo-700 border border-indigo-200",
  cbebirr: "bg-purple-50 text-purple-700 border border-purple-200",
};

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [actingId, setActingId] = useState(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get("/api/payments/all", {
        params: { status: statusFilter, method: methodFilter },
      });
      setPayments(data?.payments || []);
    } catch (error) {
      console.error("Failed to fetch payments:", error);
      toast.error("Failed to load payments.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, methodFilter]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleStatusUpdate = async (id, status) => {
    setActingId(`${id}-${status}`);
    try {
      const { data } = await apiClient.put(`/api/payments/${id}/status`, { status });
      if (!data?.success) throw new Error(data?.message || "Failed to update payment");
      toast.success(`Payment marked ${status}.`);
      fetchPayments();
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || "Failed to update payment.");
    } finally {
      setActingId(null);
    }
  };

  const summary = useMemo(() => {
    const successful = payments.filter((p) => p.status === "successful");
    return {
      total: payments.length,
      successful: successful.length,
      pending: payments.filter((p) => p.status === "pending").length,
      failed: payments.filter((p) => p.status === "failed").length,
      revenue: successful.reduce((sum, p) => sum + (Number(p.amount) || 0), 0),
    };
  }, [payments]);

  return (
    <div className="min-h-screen pt-8 pb-12 px-4 bg-[#FAF8F4]">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1C1B1A] mb-1">Payments</h1>
          <p className="text-[#5A5856]">Ledger for transaction payments (simulation).</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <StatCard label="Total" value={summary.total} />
          <StatCard label="Successful" value={summary.successful} />
          <StatCard label="Pending" value={summary.pending} />
          <StatCard label="Failed" value={summary.failed} />
          <StatCard label="Revenue" value={formatPrice(summary.revenue)} />
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#E6D5C3] shadow-card mb-6 flex flex-wrap gap-3">
          <div>
            <label className="text-sm font-medium text-[#374151] mr-2">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-[#E6D5C3] rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="successful">Successful</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-[#374151] mr-2">Method:</label>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="border border-[#E6D5C3] rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="all">All</option>
              <option value="telebirr">telebirr</option>
              <option value="cbebirr">cbebirr</option>
              <option value="cbe">cbe</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E6D5C3] shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#1C1B1A]">
                  {["User", "Property", "Type", "Method", "Amount", "Reference", "Receipt", "Status", "Date", "Actions"].map((head) => (
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
                    <td colSpan={10} className="px-4 py-8 text-sm text-[#6B7280]">
                      Loading payments...
                    </td>
                  </tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-sm text-[#6B7280]">
                      No payments found.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p._id} className="hover:bg-[#FAF8F4] transition-colors">
                      <td className="px-4 py-4">
                        <p className="text-sm font-medium text-[#1C1B1A]">{p.user?.name || "—"}</p>
                        <p className="text-xs text-[#9CA3AF]">{p.user?.email || "—"}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm font-semibold text-[#1C1B1A]">
                          {p.property?.title || p.transaction?.property?.title || "—"}
                        </p>
                        <p className="text-xs text-[#9CA3AF]">
                          {p.property?.location || p.transaction?.property?.location || "—"}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F3EDE8] text-[#5A5856] border border-[#E6D5C3]">
                          {(p.requestType || p.transaction?.requestType || "—").toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${METHOD_STYLES[p.method] || METHOD_STYLES.telebirr}`}>
                          {(p.method || "telebirr").toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm font-semibold text-[#1C1B1A]">{formatPrice(p.amount || 0)}</td>
                      <td className="px-4 py-4 text-sm text-[#374151]">{p.reference || "—"}</td>
                      <td className="px-4 py-4 text-sm text-[#374151]">
                        {p.receiptUrl ? (
                          <a
                            href={p.receiptUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#D4755B] hover:text-[#B86851] font-semibold"
                          >
                            View
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[p.status] || STATUS_STYLES.pending}`}>
                          {(p.status || "pending").toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-[#5A5856]">
                        {new Date(p.paidAt || p.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleStatusUpdate(p._id, "successful")}
                            disabled={actingId === `${p._id}-successful`}
                            className="px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 rounded hover:bg-emerald-700 disabled:opacity-60"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(p._id, "failed")}
                            disabled={actingId === `${p._id}-failed`}
                            className="px-2.5 py-1 text-xs font-semibold text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-60"
                          >
                            Reject
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

export default Payments;

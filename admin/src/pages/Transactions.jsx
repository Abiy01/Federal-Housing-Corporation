import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import apiClient from "../services/apiClient";

const STATUS_STYLES = {
  pending: "bg-amber-50 text-amber-700 border border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  rejected: "bg-red-50 text-red-700 border border-red-200",
};

const TYPE_STYLES = {
  rent: "bg-indigo-50 text-indigo-700 border border-indigo-200",
  buy: "bg-purple-50 text-purple-700 border border-purple-200",
};

const Transactions = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [actingId, setActingId] = useState(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get("/api/transactions/all", {
        params: { status: statusFilter },
      });
      setRequests(data?.requests || []);
    } catch (error) {
      console.error("Failed to fetch transaction requests:", error);
      toast.error("Failed to load transaction requests.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApprove = async (requestId) => {
    setActingId(`approve-${requestId}`);
    try {
      const { data } = await apiClient.put(`/api/transactions/${requestId}/approve`, {});
      if (!data?.success) {
        throw new Error(data?.message || "Failed to approve request");
      }
      toast.success("Transaction request approved.");
      fetchRequests();
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || "Failed to approve request.");
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async (requestId) => {
    setActingId(`reject-${requestId}`);
    try {
      const { data } = await apiClient.put(`/api/transactions/${requestId}/reject`, {});
      if (!data?.success) {
        throw new Error(data?.message || "Failed to reject request");
      }
      toast.success("Transaction request rejected.");
      fetchRequests();
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || "Failed to reject request.");
    } finally {
      setActingId(null);
    }
  };

  const counts = useMemo(
    () => ({
      total: requests.length,
      pending: requests.filter((r) => r.status === "pending").length,
      approved: requests.filter((r) => r.status === "approved").length,
      rejected: requests.filter((r) => r.status === "rejected").length,
    }),
    [requests]
  );

  return (
    <div className="min-h-screen pt-8 pb-12 px-4 bg-[#FAF8F4]">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1C1B1A] mb-1">Transaction Requests</h1>
          <p className="text-[#5A5856]">
            Approve or reject property rent/buy requests.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard label="Total" value={counts.total} />
          <StatCard label="Pending" value={counts.pending} />
          <StatCard label="Approved" value={counts.approved} />
          <StatCard label="Rejected" value={counts.rejected} />
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#E6D5C3] shadow-card mb-6">
          <label className="text-sm font-medium text-[#374151] mr-3">Filter Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-[#E6D5C3] rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="bg-white rounded-2xl border border-[#E6D5C3] shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#1C1B1A]">
                  {["Property", "Requester", "Type", "Status", "Message", "Requested At", "Actions"].map((head) => (
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
                      Loading transaction requests...
                    </td>
                  </tr>
                ) : requests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-sm text-[#6B7280]">
                      No transaction requests found.
                    </td>
                  </tr>
                ) : (
                  requests.map((request) => (
                    <tr key={request._id} className="hover:bg-[#FAF8F4] transition-colors">
                      <td className="px-4 py-4">
                        <p className="text-sm font-semibold text-[#1C1B1A]">{request.property?.title || "—"}</p>
                        <p className="text-xs text-[#9CA3AF]">{request.property?.location || "—"}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm font-medium text-[#1C1B1A]">{request.requestedBy?.name || "—"}</p>
                        <p className="text-xs text-[#9CA3AF]">{request.requestedBy?.email || "—"}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${TYPE_STYLES[request.requestType] || TYPE_STYLES.rent}`}>
                          {(request.requestType || "rent").toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[request.status] || STATUS_STYLES.pending}`}>
                          {(request.status || "pending").toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-[#374151] max-w-xs line-clamp-2">
                          {request.message || "—"}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-[#5A5856]">
                          {new Date(request.createdAt).toLocaleString()}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        {request.status === "pending" ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleApprove(request._id)}
                              disabled={actingId === `approve-${request._id}` || actingId === `reject-${request._id}`}
                              className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-60"
                            >
                              {actingId === `approve-${request._id}` ? "Approving..." : "Approve"}
                            </button>
                            <button
                              onClick={() => handleReject(request._id)}
                              disabled={actingId === `approve-${request._id}` || actingId === `reject-${request._id}`}
                              className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60"
                            >
                              {actingId === `reject-${request._id}` ? "Rejecting..." : "Reject"}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-[#9CA3AF]">No actions</span>
                        )}
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

export default Transactions;

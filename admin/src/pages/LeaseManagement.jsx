import { useEffect, useState } from "react";
import { toast } from "sonner";
import apiClient from "../services/apiClient";

const LeaseManagement = () => {
  const [leases, setLeases] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get("/api/leases/all");
      setLeases(data?.leases || []);
    } catch {
      toast.error("Failed to load leases.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id, action) => {
    try {
      await apiClient.put(`/api/leases/${id}/status`, { action });
      toast.success("Lease updated.");
      load();
    } catch {
      toast.error("Failed to update lease.");
    }
  };

  return (
    <div className="min-h-screen pt-8 pb-12 px-4 bg-[#FAF8F4]">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-[#1C1B1A] mb-6">Lease Management</h1>
        <div className="bg-white rounded-2xl border border-[#E6D5C3] overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#1C1B1A]">
              <tr>
                {["User", "Property", "Status", "Next Due", "End Date", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs text-[#9CA3AF] uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-6 text-sm text-[#6B7280]">Loading...</td></tr>
              ) : leases.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-6 text-sm text-[#6B7280]">No leases.</td></tr>
              ) : leases.map((lease) => (
                <tr key={lease._id} className="border-t border-[#F5F1E8]">
                  <td className="px-4 py-3 text-sm">{lease.user?.name || "—"}</td>
                  <td className="px-4 py-3 text-sm">{lease.property?.title || "—"}</td>
                  <td className="px-4 py-3 text-sm">{lease.status}</td>
                  <td className="px-4 py-3 text-sm">{new Date(lease.nextDueDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-sm">{new Date(lease.endDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex gap-2">
                      <button onClick={() => updateStatus(lease._id, "approve_renewal")} className="px-2 py-1 rounded bg-emerald-600 text-white text-xs">Approve Renewal</button>
                      <button onClick={() => updateStatus(lease._id, "reject_renewal")} className="px-2 py-1 rounded bg-amber-600 text-white text-xs">Reject Renewal</button>
                      <button onClick={() => updateStatus(lease._id, "approve_end")} className="px-2 py-1 rounded bg-red-600 text-white text-xs">Approve End</button>
                      <button onClick={() => updateStatus(lease._id, "reject_end")} className="px-2 py-1 rounded bg-slate-600 text-white text-xs">Reject End</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LeaseManagement;


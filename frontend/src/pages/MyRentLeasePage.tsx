import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import { leasesAPI } from '../services/api';
import { formatPrice } from '../utils/formatPrice';

const MyRentLeasePage: React.FC = () => {
  const [leases, setLeases] = useState<any[]>([]);
  const [dues, setDues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteByLease, setNoteByLease] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    try {
      const [lRes, dRes] = await Promise.all([leasesAPI.getMyLeases(), leasesAPI.getMyDues()]);
      setLeases(lRes.data?.leases || []);
      setDues(dRes.data?.dues || []);
    } catch {
      toast.error('Failed to load lease data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const duesByLease = useMemo(
    () =>
      dues.reduce<Record<string, any[]>>((acc, due) => {
        const id = due.lease?._id || due.lease;
        if (!id) return acc;
        acc[id] = acc[id] || [];
        acc[id].push(due);
        return acc;
      }, {}),
    [dues]
  );

  const onEndContract = async (leaseId: string) => {
    try {
      await leasesAPI.requestEndContract({ leaseId, note: noteByLease[leaseId] || '' });
      toast.success('End-contract request sent to admin.');
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to request end contract.');
    }
  };

  const onRenew = async (lease: any, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append('leaseId', lease._id);
    form.append('method', 'cbe');
    form.append('reference', `LEASE-${lease._id.slice(-6).toUpperCase()}`);
    form.append('receipt', file);
    try {
      await leasesAPI.requestRenewal(form);
      toast.success('Renewal receipt uploaded for admin review.');
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to submit renewal.');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F4]">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="font-fraunces text-4xl text-[#221410] mb-6">My Rent Leases</h1>
        {loading ? (
          <p className="font-manrope text-[#6B7280]">Loading...</p>
        ) : leases.length === 0 ? (
          <p className="font-manrope text-[#6B7280]">No rent leases found.</p>
        ) : (
          <div className="space-y-5">
            {leases.map((lease) => {
              const isEnded = lease.status === 'ended';
              return (
                <div key={lease._id} className="bg-white border border-[#E6E0DA] rounded-2xl p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="font-fraunces text-2xl text-[#221410]">{lease.property?.title || 'Property'}</h2>
                    <p className="font-manrope text-sm text-[#6B7280]">{lease.property?.location || '—'}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[#F3EDE8] text-[#5A5856] text-xs font-semibold uppercase">
                    {lease.status}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm font-manrope">
                  <p>Monthly rent: <span className="font-semibold">{formatPrice(lease.monthlyRent || 0)}</span></p>
                  <p>Next due: <span className="font-semibold">{new Date(lease.nextDueDate).toLocaleDateString()}</span></p>
                  <p>Ends: <span className="font-semibold">{new Date(lease.endDate).toLocaleDateString()}</span></p>
                </div>
                {isEnded ? (
                  <div className="mt-4 border border-[#E6E0DA] rounded-lg px-3 py-2 bg-[#FAF8F4]">
                    <p className="font-manrope text-sm text-[#6B7280]">
                      Contract ended. No further actions are available for this lease.
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <label className="bg-[#D4755B] text-white font-manrope font-semibold px-4 py-2 rounded-lg cursor-pointer hover:bg-[#B86851]">
                      Renew Contract (Upload Receipt)
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => onRenew(lease, e)} />
                    </label>
                    <input
                      value={noteByLease[lease._id] || ''}
                      onChange={(e) => setNoteByLease((prev) => ({ ...prev, [lease._id]: e.target.value }))}
                      placeholder="Reason for ending (optional)"
                      className="border border-[#E6E0DA] rounded-lg px-3 py-2 text-sm flex-1 min-w-[220px]"
                    />
                    <button
                      onClick={() => onEndContract(lease._id)}
                      className="border border-red-300 text-red-700 font-manrope font-semibold px-4 py-2 rounded-lg hover:bg-red-50"
                    >
                      End Contract
                    </button>
                  </div>
                )}
                {duesByLease[lease._id]?.length > 0 && (
                  <div className="mt-4 border-t border-[#F3EDE8] pt-3">
                    <p className="font-manrope text-xs uppercase tracking-wide text-[#6B7280] mb-2">Due History</p>
                    <div className="space-y-1">
                      {duesByLease[lease._id].slice(0, 4).map((due) => (
                        <p key={due._id} className="font-manrope text-sm text-[#374151]">
                          {new Date(due.dueDate).toLocaleDateString()} · {formatPrice(due.amount)} · {due.status}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default MyRentLeasePage;


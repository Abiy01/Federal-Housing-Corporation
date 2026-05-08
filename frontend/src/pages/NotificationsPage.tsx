import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import { useAuth } from '../contexts/AuthContext';
import { notificationsAPI } from '../services/api';

interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast.error('Please sign in to view notifications.');
      navigate('/signin', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await notificationsAPI.getMyNotifications();
      setNotifications(data?.notifications || []);
    } catch {
      toast.error('Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchNotifications();
  }, [isAuthenticated, fetchNotifications]);

  const markOneRead = async (id: string) => {
    try {
      await notificationsAPI.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
    } catch {
      toast.error('Failed to mark notification as read.');
    }
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    try {
      await notificationsAPI.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success('All notifications marked as read.');
    } catch {
      toast.error('Failed to mark all notifications as read.');
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F4]">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white border border-[#E6E0DA] rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-[#F3EDE8] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="font-fraunces text-3xl text-[#221410]">Notifications</h1>
              <p className="font-manrope text-sm text-[#6B7280] mt-1">
                Stay updated on requests, payments, leases, and maintenance.
              </p>
            </div>
            <button
              type="button"
              onClick={markAllRead}
              disabled={markingAll || notifications.length === 0}
              className="self-start sm:self-auto bg-[#D4755B] text-white font-manrope font-semibold text-sm px-4 py-2 rounded-lg hover:bg-[#B86851] transition-colors disabled:opacity-60"
            >
              {markingAll ? 'Marking…' : 'Mark all as read'}
            </button>
          </div>

          <div className="divide-y divide-[#F3EDE8]">
            {loading ? (
              <div className="px-6 py-10 font-manrope text-sm text-[#6B7280]">Loading notifications…</div>
            ) : notifications.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="font-manrope text-[#6B7280] mb-4">You have no notifications yet.</p>
                <Link
                  to="/properties"
                  className="inline-flex items-center bg-[#D4755B] text-white font-manrope font-semibold text-sm px-4 py-2 rounded-lg hover:bg-[#B86851] transition-colors"
                >
                  Browse Properties
                </Link>
              </div>
            ) : (
              notifications.map((item) => (
                <div key={item._id} className="px-6 py-5 flex items-start gap-4">
                  <span
                    className={`mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                      item.read ? 'bg-[#D1D5DB]' : 'bg-[#D4755B]'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <h3 className="font-manrope font-semibold text-[#221410]">{item.title}</h3>
                      <span className="font-manrope text-xs text-[#9CA3AF]">
                        {new Date(item.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="font-manrope text-sm text-[#4B5563] mt-1 leading-relaxed">{item.message}</p>
                    {!item.read && (
                      <button
                        type="button"
                        onClick={() => markOneRead(item._id)}
                        className="mt-3 text-sm font-manrope font-semibold text-[#D4755B] hover:text-[#B86851] transition-colors"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotificationsPage;

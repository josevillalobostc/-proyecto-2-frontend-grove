import { Bell, Check, Trash2 } from 'lucide-react';
import { getNotifications, markNotificationRead, deleteNotification } from '../api';
import type { NotificationResponse } from '../types';
import { useFetch } from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/ui/Spinner';
import toast from 'react-hot-toast';
import { useState } from 'react';

export default function NotificationsPage() {
  const { user } = useAuth();
  const { data, loading, refetch } = useFetch<NotificationResponse[]>(
    () => getNotifications(user?.id || ''),
    [user?.id]
  );
  const [processing, setProcessing] = useState<string | null>(null);

  const handleMarkRead = async (id: string) => {
    setProcessing(id);
    try {
      await markNotificationRead(id);
      refetch();
    } catch {
      toast.error('Failed to mark as read');
    } finally {
      setProcessing(null);
    }
  };

  const handleDelete = async (id: string) => {
    setProcessing(id);
    try {
      await deleteNotification(id);
      refetch();
    } catch {
      toast.error('Failed to delete notification');
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Bell className="w-6 h-6 text-grove-green" />
        <h1 className="text-2xl font-bold text-white">Notifications</h1>
        {data && (
          <span className="text-xs text-gray-500 bg-grove-surface border border-grove-border px-2 py-0.5 rounded-full">
            {data.filter((n) => !n.read).length} unread
          </span>
        )}
      </div>

      {loading ? (
        <Spinner />
      ) : !data || data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <Bell className="w-12 h-12 text-gray-700" />
          <p className="text-gray-400">No notifications</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((notification) => (
            <div
              key={notification.id}
              className={`bg-grove-surface border rounded-xl p-4 flex items-start gap-3 transition-all ${
                notification.read ? 'border-grove-border opacity-60' : 'border-grove-green/20'
              }`}
            >
              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${notification.read ? 'bg-gray-600' : 'bg-grove-green'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-gray-300 text-sm">{notification.message}</p>
                <p className="text-gray-600 text-xs mt-1">{new Date(notification.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {!notification.read && (
                  <button
                    onClick={() => handleMarkRead(notification.id)}
                    disabled={processing === notification.id}
                    className="p-1.5 rounded hover:bg-grove-border transition-colors"
                    title="Mark as read"
                  >
                    <Check className="w-3.5 h-3.5 text-grove-green" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(notification.id)}
                  disabled={processing === notification.id}
                  className="p-1.5 rounded hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

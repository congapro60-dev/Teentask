import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit, updateDoc, doc } from 'firebase/firestore';
import { db, auth } from './FirebaseProvider';
import { Bell, CheckCircle2, Briefcase, Star, GraduationCap, MoreHorizontal } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'job_approval' | 'application_success' | 'new_job' | 'system' | 'review';
  read: boolean;
  createdAt: number;
  link?: string;
  metadata?: any;
  senderAvatar?: string;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
      setNotifications(notifData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching notifications:", error);
      setLoading(false);
      
      // Fallback to mock data if collection doesn't exist or permissions fail
      if (notifications.length === 0) {
        const mockNotifs: Notification[] = [
          {
            id: '1',
            userId: auth.currentUser?.uid || '',
            title: 'Đơn ứng tuyển thành công',
            message: 'Bạn đã nộp đơn xin việc thành công vào vị trí Thực tập sinh Marketing tại VinFast.',
            type: 'application_success',
            read: false,
            createdAt: Date.now() - 1000 * 60 * 30, // 30 mins ago
            senderAvatar: 'https://picsum.photos/seed/vinfast/100/100'
          },
          {
            id: '2',
            userId: auth.currentUser?.uid || '',
            title: 'Công việc mới từ doanh nghiệp bạn quan tâm',
            message: 'FPT Software vừa đăng tải công việc mới: Lập trình viên Java Junior.',
            type: 'new_job',
            read: true,
            createdAt: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
            senderAvatar: 'https://picsum.photos/seed/fpt/100/100'
          },
          {
            id: '3',
            userId: auth.currentUser?.uid || '',
            title: 'Phê duyệt công việc',
            message: 'Công việc "Trợ lý sự kiện" của bạn đã được phê duyệt và đang hiển thị trên hệ thống.',
            type: 'job_approval',
            read: false,
            createdAt: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
            senderAvatar: 'https://picsum.photos/seed/admin/100/100'
          }
        ];
        setNotifications(mockNotifs);
      }
    });

    return () => unsubscribe();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      // Update local state for mock data
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    }
  };

  const getBadgeIcon = (type: Notification['type']) => {
    switch (type) {
      case 'job_approval': return <div className="bg-emerald-500 p-1 rounded-full text-white"><CheckCircle2 size={12} /></div>;
      case 'application_success': return <div className="bg-blue-500 p-1 rounded-full text-white"><Briefcase size={12} /></div>;
      case 'new_job': return <div className="bg-amber-500 p-1 rounded-full text-white"><Star size={12} /></div>;
      case 'review': return <div className="bg-purple-500 p-1 rounded-full text-white"><GraduationCap size={12} /></div>;
      default: return <div className="bg-gray-500 p-1 rounded-full text-white"><Bell size={12} /></div>;
    }
  };

  const filteredNotifications = filter === 'all' 
    ? notifications 
    : notifications.filter(n => !n.read);

  if (loading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1877F2]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20 pt-4 px-2 sm:px-4 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-2">
        <h1 className="text-2xl font-bold text-gray-900">Thông báo</h1>
        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600">
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 px-2">
        <button 
          onClick={() => setFilter('all')}
          className={`px-4 py-1.5 rounded-full text-[15px] font-semibold transition-colors ${
            filter === 'all' ? 'bg-blue-50 text-[#1877F2]' : 'bg-transparent text-gray-900 hover:bg-gray-100'
          }`}
        >
          Tất cả
        </button>
        <button 
          onClick={() => setFilter('unread')}
          className={`px-4 py-1.5 rounded-full text-[15px] font-semibold transition-colors ${
            filter === 'unread' ? 'bg-blue-50 text-[#1877F2]' : 'bg-transparent text-gray-900 hover:bg-gray-100'
          }`}
        >
          Chưa đọc
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-1">
        <div className="px-2 mb-2">
          <h2 className="text-[17px] font-semibold text-gray-900">Mới</h2>
        </div>

        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => {
                if (!notif.read) markAsRead(notif.id);
                if (notif.link) navigate(notif.link);
              }}
              className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer relative"
            >
              {/* Avatar & Badge */}
              <div className="relative shrink-0 mt-1">
                <img 
                  src={notif.senderAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(notif.title)}&background=random`} 
                  alt="" 
                  className="w-14 h-14 rounded-full object-cover border border-gray-100"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute -bottom-1 -right-1 border-2 border-white rounded-full">
                  {getBadgeIcon(notif.type)}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pr-6">
                <p className="text-[15px] text-gray-900 leading-tight mb-1">
                  <span className="font-semibold">{notif.title}</span> {notif.message}
                </p>
                <span className={`text-[13px] ${notif.read ? 'text-gray-500' : 'text-[#1877F2] font-semibold'}`}>
                  {formatDistanceToNow(notif.createdAt, { addSuffix: true, locale: vi })}
                </span>
              </div>

              {/* Unread Dot */}
              {!notif.read && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 bg-[#1877F2] rounded-full"></div>
              )}
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Bell size={48} className="text-gray-300 mb-4" />
            <p className="text-[15px] font-semibold text-gray-900">Bạn không có thông báo mới</p>
          </div>
        )}
      </div>
    </div>
  );
}

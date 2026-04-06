import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit, updateDoc, doc } from 'firebase/firestore';
import { db, auth } from './FirebaseProvider';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, CheckCircle2, Clock, Briefcase, GraduationCap, Star, Search, Filter, MoreHorizontal, Trash2, Check } from 'lucide-react';
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
          },
          {
            id: '2',
            userId: auth.currentUser?.uid || '',
            title: 'Công việc mới từ doanh nghiệp bạn quan tâm',
            message: 'FPT Software vừa đăng tải công việc mới: Lập trình viên Java Junior.',
            type: 'new_job',
            read: true,
            createdAt: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
          },
          {
            id: '3',
            userId: auth.currentUser?.uid || '',
            title: 'Phê duyệt công việc',
            message: 'Công việc "Trợ lý sự kiện" của bạn đã được phê duyệt và đang hiển thị trên hệ thống.',
            type: 'job_approval',
            read: false,
            createdAt: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
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

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.read);
    for (const n of unread) {
      markAsRead(n.id);
    }
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'job_approval': return <CheckCircle2 className="text-emerald-500" size={20} />;
      case 'application_success': return <Briefcase className="text-blue-500" size={20} />;
      case 'new_job': return <Star className="text-amber-500" size={20} />;
      case 'review': return <GraduationCap className="text-purple-500" size={20} />;
      default: return <Bell className="text-slate-400" size={20} />;
    }
  };

  const filteredNotifications = filter === 'all' 
    ? notifications 
    : notifications.filter(n => !n.read);

  if (loading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-24">
      {/* Header */}
      <div className="bg-slate-900/50 p-8 pb-12 rounded-b-[64px] border-b border-white/5 sticky top-0 z-30 backdrop-blur-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -z-10"></div>
        
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-2 h-5 bg-primary rounded-full shadow-[0_0_15px_rgba(79,70,229,0.5)]"></div>
            <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">Cập nhật mới nhất</span>
          </div>
          <button 
            onClick={markAllAsRead}
            className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
          >
            Đánh dấu tất cả đã đọc
          </button>
        </div>

        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-black tracking-tighter text-white">Thông báo</h1>
          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
            <button 
              onClick={() => setFilter('all')}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                filter === 'all' ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Tất cả
            </button>
            <button 
              onClick={() => setFilter('unread')}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                filter === 'unread' ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Chưa đọc
            </button>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="px-4 sm:px-8 py-10 space-y-4">
        {filteredNotifications.length > 0 ? (
          <AnimatePresence mode="popLayout">
            {filteredNotifications.map((notif, i) => (
              <motion.div
                key={notif.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
                className={`group relative p-6 rounded-[32px] border transition-all cursor-pointer overflow-hidden ${
                  notif.read 
                    ? 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05]' 
                    : 'bg-primary/5 border-primary/20 hover:bg-primary/10 ring-1 ring-primary/10'
                }`}
                onClick={() => {
                  markAsRead(notif.id);
                  if (notif.link) navigate(notif.link);
                }}
              >
                <div className="flex gap-6 items-start relative z-10">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border shadow-inner ${
                    notif.read ? 'bg-slate-900 border-white/5' : 'bg-primary/20 border-primary/20'
                  }`}>
                    {getIcon(notif.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className={`font-black tracking-tight text-base ${notif.read ? 'text-slate-300' : 'text-white'}`}>
                        {notif.title}
                      </h3>
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest pt-1 whitespace-nowrap">
                        {formatDistanceToNow(notif.createdAt, { addSuffix: true, locale: vi })}
                      </span>
                    </div>
                    <p className={`text-sm leading-relaxed mb-3 ${notif.read ? 'text-slate-500' : 'text-slate-400 font-medium'}`}>
                      {notif.message}
                    </p>
                    
                    {!notif.read && (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                        <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">Mới</span>
                      </div>
                    )}
                  </div>

                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-3 text-slate-600 hover:text-white hover:bg-white/10 rounded-xl transition-all">
                      <MoreHorizontal size={18} />
                    </button>
                  </div>
                </div>

                {/* Hover Glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/0 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-slate-600">
            <div className="w-32 h-32 bg-white/5 rounded-[48px] flex items-center justify-center mb-8 border border-white/5 shadow-inner">
              <Bell size={48} strokeWidth={1.5} className="opacity-20" />
            </div>
            <p className="text-sm font-black uppercase tracking-[0.3em]">Không có thông báo nào</p>
            <p className="text-[10px] font-bold mt-3 uppercase tracking-widest text-slate-700">Bạn sẽ nhận được thông báo khi có cập nhật mới</p>
          </div>
        )}
      </div>
    </div>
  );
}

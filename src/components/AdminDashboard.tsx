import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, UserCheck, UserX, Search, Filter, Clock, CheckCircle2, XCircle, AlertCircle, Eye, X, Briefcase, MessageSquare, Megaphone, Send, UserCog, Zap } from 'lucide-react';
import { collection, query, where, getDocs, doc, updateDoc, onSnapshot, addDoc, orderBy, limit, getDoc, setDoc } from 'firebase/firestore';
import { db, useFirebase } from './FirebaseProvider';
import { Job, Advertisement } from '../types';
import { cn } from '../lib/utils';

export default function AdminDashboard() {
  const { profile, loading: firebaseLoading } = useFirebase();
  const [activeTab, setActiveTab] = useState<'users' | 'jobs' | 'messages' | 'ads' | 'transactions' | 'name_changes'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [nameChangeRequests, setNameChangeRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'rejected' | 'approved'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedAd, setSelectedAd] = useState<Advertisement | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [selectedNameChange, setSelectedNameChange] = useState<any>(null);
  const [replyText, setReplyText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [autoApprove, setAutoApprove] = useState(false);

  const BOSS_EMAIL = "congapro60@gmail.com";
  const ADMIN_EMAIL = "cuong.vuviet@thedeweyschools.edu.vn";
  const userEmailLower = profile?.email?.toLowerCase();
  const isBoss = userEmailLower === BOSS_EMAIL.toLowerCase();
  const isAdmin = profile?.role === 'admin' || userEmailLower === ADMIN_EMAIL.toLowerCase() || isBoss;

  useEffect(() => {
    if (firebaseLoading || !isAdmin) return;
    
    // Fetch settings
    const unsubSettings = onSnapshot(doc(db, 'settings', 'admin'), (doc) => {
      if (doc.exists()) {
        setAutoApprove(doc.data().autoApprove || false);
      }
    });

    setLoading(true);
    const unsubUsers = onSnapshot(query(collection(db, 'users')), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Error in users listener:", error);
    });

    const unsubJobs = onSnapshot(query(collection(db, 'jobs')), (snapshot) => {
      setJobs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job)));
    }, (error) => {
      console.error("Error in jobs listener:", error);
    });

    const unsubAds = onSnapshot(query(collection(db, 'advertisements')), (snapshot) => {
      setAds(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Advertisement)));
    }, (error) => {
      console.error("Error in ads listener:", error);
    });

    const unsubMessages = onSnapshot(query(collection(db, 'support_messages'), orderBy('createdAt', 'desc')), (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Error in messages listener:", error);
    });

    const unsubTransactions = onSnapshot(query(collection(db, 'transactions'), orderBy('createdAt', 'desc')), (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Error in transactions listener:", error);
    });

    const unsubNameChanges = onSnapshot(query(collection(db, 'name_change_requests'), orderBy('createdAt', 'desc')), (snapshot) => {
      const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNameChangeRequests(requests);
      
      // Auto-approve logic
      if (autoApprove) {
        requests.forEach(async (req: any) => {
          if (req.status === 'pending') {
            await handleApproveNameChange(req.id, 'approved', req.newName, req.userId);
          }
        });
      }
    }, (error) => {
      console.error("Error in name changes listener:", error);
    });

    setLoading(false);
    return () => {
      unsubSettings();
      unsubUsers();
      unsubJobs();
      unsubAds();
      unsubMessages();
      unsubTransactions();
      unsubNameChanges();
    };
  }, [firebaseLoading, isAdmin, autoApprove]);

  const toggleAutoApprove = async () => {
    try {
      await setDoc(doc(db, 'settings', 'admin'), { autoApprove: !autoApprove }, { merge: true });
    } catch (error) {
      console.error("Error toggling auto-approve:", error);
    }
  };

  const handleVerify = async (userId: string, status: 'verified' | 'rejected') => {
    setActionLoading(true);
    try {
      await updateDoc(doc(db, 'users', userId), {
        verificationStatus: status,
        isVerified: status === 'verified'
      });
      setSelectedUser(null);
    } catch (error) {
      console.error("Error updating verification status:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveJob = async (jobId: string, status: boolean) => {
    setActionLoading(true);
    try {
      await updateDoc(doc(db, 'jobs', jobId), { isApproved: status });
      setSelectedJob(null);
    } catch (error) {
      console.error("Error approving job:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveAd = async (adId: string, status: 'approved' | 'rejected') => {
    setActionLoading(true);
    try {
      await updateDoc(doc(db, 'advertisements', adId), { status });
      setSelectedAd(null);
    } catch (error) {
      console.error("Error approving ad:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveNameChange = async (requestId: string, status: 'approved' | 'rejected', newName: string, userId: string) => {
    setActionLoading(true);
    try {
      await updateDoc(doc(db, 'name_change_requests', requestId), { 
        status,
        reviewedAt: Date.now()
      });
      
      if (status === 'approved') {
        await updateDoc(doc(db, 'users', userId), { displayName: newName });
        
        // Send notification
        await addDoc(collection(db, 'notifications'), {
          userId,
          title: 'Yêu cầu đổi tên đã được phê duyệt',
          message: `Tên hiển thị của bạn đã được đổi thành "${newName}".`,
          type: 'system',
          read: false,
          createdAt: Date.now()
        });
      } else {
        // Send notification for rejection
        await addDoc(collection(db, 'notifications'), {
          userId,
          title: 'Yêu cầu đổi tên bị từ chối',
          message: 'Yêu cầu đổi tên của bạn không được phê duyệt. Vui lòng kiểm tra lại minh chứng.',
          type: 'system',
          read: false,
          createdAt: Date.now()
        });
      }
      setSelectedNameChange(null);
    } catch (error) {
      console.error("Error approving name change:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!selectedMessage || !replyText.trim()) return;
    setActionLoading(true);
    try {
      await addDoc(collection(db, 'notifications'), {
        userId: selectedMessage.userId,
        title: 'Phản hồi từ quản trị viên',
        message: replyText,
        type: 'message',
        read: false,
        createdAt: Date.now()
      });
      await updateDoc(doc(db, 'support_messages', selectedMessage.id), {
        replied: true,
        replyText: replyText,
        repliedAt: Date.now()
      });
      setReplyText('');
      setSelectedMessage(null);
      alert('Đã gửi phản hồi!');
    } catch (error) {
      console.error("Error sending reply:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredData = () => {
    if (activeTab === 'users') {
      return users.filter(user => {
        const matchesFilter = filter === 'all' || user.verificationStatus === filter;
        const matchesSearch = !searchQuery || 
                             ((user.displayName?.toLowerCase() || '').includes(searchQuery.toLowerCase())) ||
                             ((user.email?.toLowerCase() || '').includes(searchQuery.toLowerCase()));
        return matchesFilter && matchesSearch;
      });
    } else if (activeTab === 'jobs') {
      return jobs.filter(job => {
        const matchesFilter = filter === 'all' || (filter === 'pending' ? !job.isApproved : job.isApproved);
        const matchesSearch = !searchQuery || job.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
      });
    } else if (activeTab === 'ads') {
      return ads.filter(ad => {
        const matchesFilter = filter === 'all' || ad.status === filter;
        const matchesSearch = !searchQuery || ad.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
      });
    } else if (activeTab === 'name_changes') {
      return nameChangeRequests.filter(req => {
        const matchesFilter = filter === 'all' || req.status === filter;
        const matchesSearch = !searchQuery || 
                             req.newName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             req.currentName.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
      });
    } else {
      return messages.filter(msg => {
        const matchesFilter = filter === 'all' || (filter === 'pending' ? !msg.replied : msg.replied);
        const matchesSearch = !searchQuery || msg.message.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
      });
    }
  };

  if (firebaseLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="w-12 h-12 border-4 border-[#4F46E5] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-6">
        <div className="text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-gray-900 mb-2">Truy cập bị từ chối</h2>
          <p className="text-gray-500">Bạn không có quyền truy cập vào trang quản trị này.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck size={16} className="text-[#4F46E5]" />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Hệ thống quản trị</span>
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-gray-900">Bảng điều khiển</h1>
          </div>

          <div className="flex bg-white p-2 rounded-2xl shadow-sm border border-gray-100 gap-1 overflow-x-auto">
            {[
              { id: 'users', label: 'Người dùng', icon: UserCheck },
              { id: 'jobs', label: 'Công việc', icon: Briefcase },
              { id: 'messages', label: 'Tin nhắn', icon: MessageSquare },
              { id: 'ads', label: 'Quảng cáo', icon: Megaphone },
              { id: 'name_changes', label: 'Đổi tên', icon: UserCog },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); setFilter('pending'); }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === tab.id 
                  ? 'bg-[#4F46E5] text-white shadow-lg shadow-indigo-100' 
                  : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8 items-center">
          <div className="relative flex-1 group w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#4F46E5] transition-colors" size={20} />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border-2 border-transparent rounded-[24px] text-sm font-medium focus:border-[#4F46E5]/20 focus:ring-4 focus:ring-[#4F46E5]/5 outline-none transition-all shadow-sm"
            />
          </div>
          
          <div className="flex bg-white p-2 rounded-2xl shadow-sm border border-gray-100 gap-2 shrink-0">
            <button
              onClick={toggleAutoApprove}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
                autoApprove 
                  ? "bg-green-600 text-white shadow-lg shadow-green-100" 
                  : "bg-gray-100 text-gray-400 hover:bg-gray-200"
              )}
            >
              <Zap size={14} fill={autoApprove ? "currentColor" : "none"} />
              {autoApprove ? "Duyệt tự động: ON" : "Duyệt thủ công: ON"}
            </button>
          </div>

          <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex gap-1 shrink-0">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'pending', label: 'Chờ duyệt' },
              { id: 'verified', label: 'Đã duyệt/Phê duyệt' },
              { id: 'rejected', label: 'Từ chối' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  filter === f.id 
                  ? 'bg-gray-900 text-white' 
                  : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {activeTab === 'users' && filteredData().map((user: any) => (
              <motion.div
                key={user.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-indigo-100/50 transition-all group"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex gap-4">
                    <img src={user.photoURL} alt={user.displayName} className="w-12 h-12 rounded-2xl object-cover border border-gray-100" referrerPolicy="no-referrer" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900">{user.displayName}</h3>
                        {user.isVip && (
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[8px] font-black rounded-full uppercase tracking-widest border border-yellow-200">
                            VIP
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{user.role}</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                    user.verificationStatus === 'verified' ? 'bg-green-50 text-green-600 border-green-100' :
                    user.verificationStatus === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                    user.verificationStatus === 'rejected' ? 'bg-red-50 text-red-600 border-red-100' :
                    'bg-gray-50 text-gray-500 border-gray-100'
                  }`}>
                    {user.verificationStatus === 'verified' ? 'Đã duyệt' :
                     user.verificationStatus === 'pending' ? 'Chờ duyệt' :
                     user.verificationStatus === 'rejected' ? 'Từ chối' : 'Chưa gửi'}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setSelectedUser(user)}
                    className="flex-1 py-3 bg-gray-50 text-gray-600 rounded-2xl text-xs font-bold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <Eye size={14} /> Chi tiết
                  </button>
                </div>
              </motion.div>
            ))}

            {activeTab === 'jobs' && filteredData().map((job: any) => (
              <motion.div
                key={job.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-indigo-100/50 transition-all group"
              >
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="font-bold text-gray-900 line-clamp-1">{job.title}</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{job.businessName}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                    job.isApproved ? 'bg-green-50 text-green-600 border-green-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                  }`}>
                    {job.isApproved ? 'Đã duyệt' : 'Chờ duyệt'}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setSelectedJob(job)}
                    className="flex-1 py-3 bg-gray-50 text-gray-600 rounded-2xl text-xs font-bold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <Eye size={14} /> Chi tiết
                  </button>
                </div>
              </motion.div>
            ))}

            {activeTab === 'ads' && filteredData().map((ad: any) => (
              <motion.div
                key={ad.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-indigo-100/50 transition-all group"
              >
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="font-bold text-gray-900 line-clamp-1">{ad.title}</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{ad.businessName}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                    ad.status === 'approved' ? 'bg-green-50 text-green-600 border-green-100' :
                    ad.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                    'bg-red-50 text-red-600 border-red-100'
                  }`}>
                    {ad.status === 'approved' ? 'Đã duyệt' : ad.status === 'pending' ? 'Chờ duyệt' : 'Từ chối'}
                  </div>
                </div>
                <img src={ad.imageUrl} className="w-full h-32 object-cover rounded-2xl mb-4" alt="" referrerPolicy="no-referrer" />
                <div className="flex gap-3">
                  <button 
                    onClick={() => setSelectedAd(ad)}
                    className="flex-1 py-3 bg-gray-50 text-gray-600 rounded-2xl text-xs font-bold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <Eye size={14} /> Chi tiết
                  </button>
                </div>
              </motion.div>
            ))}

            {activeTab === 'messages' && filteredData().map((msg: any) => (
              <motion.div
                key={msg.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-indigo-100/50 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-gray-900">{msg.userName}</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{new Date(msg.createdAt).toLocaleString()}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                    msg.replied ? 'bg-green-50 text-green-600 border-green-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                  }`}>
                    {msg.replied ? 'Đã trả lời' : 'Chưa trả lời'}
                  </div>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2 mb-4">{msg.message}</p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setSelectedMessage(msg)}
                    className="flex-1 py-3 bg-gray-50 text-gray-600 rounded-2xl text-xs font-bold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <MessageSquare size={14} /> {msg.replied ? 'Xem lại' : 'Trả lời'}
                  </button>
                </div>
              </motion.div>
            ))}

            {activeTab === 'name_changes' && filteredData().map((req: any) => (
              <motion.div
                key={req.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-indigo-100/50 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-gray-900">{req.currentName} → {req.newName}</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{new Date(req.createdAt).toLocaleString()}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                    req.status === 'approved' ? 'bg-green-50 text-green-600 border-green-100' : 
                    req.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                    'bg-red-50 text-red-600 border-red-100'
                  }`}>
                    {req.status === 'approved' ? 'Đã duyệt' : req.status === 'pending' ? 'Chờ duyệt' : 'Từ chối'}
                  </div>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2 mb-4">Lí do: {req.reason}</p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setSelectedNameChange(req)}
                    className="flex-1 py-3 bg-gray-50 text-gray-600 rounded-2xl text-xs font-bold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <Eye size={14} /> Chi tiết
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredData().length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <CheckCircle2 size={48} className="mx-auto mb-4 opacity-20" />
            <p className="font-bold">Không có mục nào cần xử lý</p>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-2xl bg-white rounded-[40px] p-8 shadow-2xl relative overflow-hidden"
            >
              <button onClick={() => setSelectedUser(null)} className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
              <div className="flex items-start gap-6 mb-8">
                <img src={selectedUser.photoURL} alt="" className="w-20 h-20 rounded-3xl object-cover border-4 border-gray-50" referrerPolicy="no-referrer" />
                <div>
                  <h2 className="text-3xl font-black tracking-tighter text-gray-900">{selectedUser.displayName}</h2>
                  <p className="text-gray-500 font-medium">{selectedUser.email}</p>
                  <div className="flex gap-2 mt-3">
                    <span className="px-3 py-1 bg-indigo-50 text-[#4F46E5] rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                      {selectedUser.role}
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Thông tin xác thực</h3>
                  <div className="bg-gray-50 p-4 rounded-2xl space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Họ tên:</span>
                      <span className="font-bold text-gray-900">{selectedUser.fullName || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Số CMT/CCCD:</span>
                      <span className="font-bold text-gray-900">{selectedUser.idNumber || 'N/A'}</span>
                    </div>
                    {/* ... other fields ... */}
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Ảnh giấy tờ</h3>
                  <div className="aspect-[3/2] bg-gray-100 rounded-2xl overflow-hidden border border-gray-200">
                    {selectedUser.idCardPhoto && <img src={selectedUser.idCardPhoto} alt="ID Card" className="w-full h-full object-cover" referrerPolicy="no-referrer" />}
                  </div>
                </div>
              </div>
              {selectedUser.verificationStatus === 'pending' && (
                <div className="flex gap-4">
                  <button onClick={() => handleVerify(selectedUser.id, 'rejected')} className="flex-1 py-4 bg-red-50 text-red-600 rounded-2xl font-black">TỪ CHỐI</button>
                  <button onClick={() => handleVerify(selectedUser.id, 'verified')} className="flex-[2] py-4 bg-green-600 text-white rounded-2xl font-black">PHÊ DUYỆT</button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Job Detail Modal */}
      <AnimatePresence>
        {selectedJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-2xl bg-white rounded-[40px] p-8 shadow-2xl relative">
              <button onClick={() => setSelectedJob(null)} className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full text-gray-400 hover:text-gray-600"><X size={20} /></button>
              <h2 className="text-2xl font-black mb-4">{selectedJob.title}</h2>
              <p className="text-gray-500 mb-6">{selectedJob.description}</p>
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-gray-50 p-4 rounded-2xl">
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Lương</p>
                  <p className="font-bold">{selectedJob.salary.toLocaleString()}đ</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl">
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Địa điểm</p>
                  <p className="font-bold">{selectedJob.location}</p>
                </div>
              </div>
              {!selectedJob.isApproved && (
                <div className="flex gap-4">
                  <button onClick={() => handleApproveJob(selectedJob.id, false)} className="flex-1 py-4 bg-red-50 text-red-600 rounded-2xl font-black">TỪ CHỐI</button>
                  <button onClick={() => handleApproveJob(selectedJob.id, true)} className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black">PHÊ DUYỆT CÔNG VIỆC</button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Ad Detail Modal */}
      <AnimatePresence>
        {selectedAd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-2xl bg-white rounded-[40px] p-8 shadow-2xl relative">
              <button onClick={() => setSelectedAd(null)} className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full text-gray-400 hover:text-gray-600"><X size={20} /></button>
              <h2 className="text-2xl font-black mb-4">{selectedAd.title}</h2>
              <img src={selectedAd.imageUrl} className="w-full h-64 object-cover rounded-3xl mb-6" alt="" referrerPolicy="no-referrer" />
              <p className="text-gray-500 mb-8">{selectedAd.description}</p>
              {selectedAd.status === 'pending' && (
                <div className="flex gap-4">
                  <button onClick={() => handleApproveAd(selectedAd.id, 'rejected')} className="flex-1 py-4 bg-red-50 text-red-600 rounded-2xl font-black">TỪ CHỐI</button>
                  <button onClick={() => handleApproveAd(selectedAd.id, 'approved')} className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black">PHÊ DUYỆT QUẢNG CÁO</button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Message Reply Modal */}
      <AnimatePresence>
        {selectedMessage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-2xl bg-white rounded-[40px] p-8 shadow-2xl relative">
              <button onClick={() => setSelectedMessage(null)} className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full text-gray-400 hover:text-gray-600"><X size={20} /></button>
              <h2 className="text-2xl font-black mb-2">Tin nhắn từ {selectedMessage.userName}</h2>
              <p className="text-gray-400 text-xs mb-6">{new Date(selectedMessage.createdAt).toLocaleString()}</p>
              <div className="bg-gray-50 p-6 rounded-3xl mb-6">
                <p className="text-gray-700">{selectedMessage.message}</p>
              </div>
              {selectedMessage.replied ? (
                <div className="bg-indigo-50 p-6 rounded-3xl">
                  <p className="text-[10px] font-black text-[#4F46E5] uppercase mb-2">Phản hồi của bạn</p>
                  <p className="text-gray-700">{selectedMessage.replyText}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Nhập nội dung phản hồi..."
                    className="w-full h-32 p-4 bg-gray-50 border-2 border-transparent rounded-3xl focus:border-indigo-100 outline-none transition-all"
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={actionLoading}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black flex items-center justify-center gap-2"
                  >
                    <Send size={20} /> GỬI PHẢN HỒI
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Name Change Detail Modal */}
      <AnimatePresence>
        {selectedNameChange && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-2xl bg-white rounded-[40px] p-8 shadow-2xl relative">
              <button onClick={() => setSelectedNameChange(null)} className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full text-gray-400 hover:text-gray-600"><X size={20} /></button>
              <h2 className="text-2xl font-black mb-2">Yêu cầu đổi tên</h2>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-2xl">
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Tên hiện tại</p>
                  <p className="font-bold">{selectedNameChange.currentName}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl">
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Tên mới</p>
                  <p className="font-bold text-indigo-600">{selectedNameChange.newName}</p>
                </div>
              </div>
              <div className="mb-6">
                <p className="text-[10px] text-gray-400 font-bold uppercase mb-2">Lí do đổi tên</p>
                <div className="bg-gray-50 p-4 rounded-2xl">
                  <p className="text-gray-700">{selectedNameChange.reason}</p>
                </div>
              </div>
              <div className="mb-8">
                <p className="text-[10px] text-gray-400 font-bold uppercase mb-2">Minh chứng xác thực</p>
                <div className="aspect-video bg-gray-100 rounded-3xl overflow-hidden border border-gray-200">
                  <img src={selectedNameChange.proofUrl} className="w-full h-full object-cover" alt="Proof" referrerPolicy="no-referrer" />
                </div>
              </div>
              {selectedNameChange.status === 'pending' && (
                <div className="flex gap-4">
                  <button 
                    onClick={() => handleApproveNameChange(selectedNameChange.id, 'rejected', selectedNameChange.newName, selectedNameChange.userId)} 
                    className="flex-1 py-4 bg-red-50 text-red-600 rounded-2xl font-black"
                  >
                    TỪ CHỐI
                  </button>
                  <button 
                    onClick={() => handleApproveNameChange(selectedNameChange.id, 'approved', selectedNameChange.newName, selectedNameChange.userId)} 
                    className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black"
                  >
                    PHÊ DUYỆT ĐỔI TÊN
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

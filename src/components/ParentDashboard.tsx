import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, Clock, CheckCircle2, XCircle, 
  Plus, Briefcase, Search, Filter, MapPin, 
  DollarSign, Calendar, Users, X, MessageSquare, 
  Zap, Bell, ArrowRight, Info, User, ExternalLink 
} from 'lucide-react';
import { 
  collection, query, where, onSnapshot, doc, 
  updateDoc, addDoc, getDocs, getDoc, orderBy, limit 
} from 'firebase/firestore';
import { db, auth, useFirebase } from './FirebaseProvider';
import { useNavigate } from 'react-router-dom';
import { Application, Job, UserProfile } from '../types';
import JobDetail from './JobDetail';

type TabType = 'monitoring' | 'post-job' | 'find-jobs';

export default function ParentDashboard() {
  const { profile } = useFirebase();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('monitoring');
  const [pendingApplications, setPendingApplications] = useState<(Application & { jobTitle?: string; jobDeadline?: number })[]>([]);
  const [parentJobs, setParentJobs] = useState<Job[]>([]);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [children, setChildren] = useState<UserProfile[]>([]);
  const [isSelectChildModalOpen, setIsSelectChildModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Job Posting State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    salary: '',
    salaryValue: 0,
    deadline: '',
    location: '',
    type: 'online' as 'online' | 'offline',
    category: 'Household',
    slotsTotal: 1,
    tags: ''
  });

  // Job Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    if (!profile?.email || !auth.currentUser) return;

    // 0. Fetch children
    const qChildren = query(
      collection(db, 'users'),
      where('parentEmail', '==', profile.email),
      where('role', '==', 'student')
    );

    const unsubChildren = onSnapshot(qChildren, (snapshot) => {
      const childrenData = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
      setChildren(childrenData);
    }, (error) => {
      console.error("Error in children listener:", error);
    });

    // 1. Fetch pending applications for their children
    const qApps = query(
      collection(db, 'applications'),
      where('parentEmail', '==', profile.email),
      where('parentStatus', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    const unsubApps = onSnapshot(qApps, async (snapshot) => {
      const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application));
      
      // Fetch job titles and deadlines for each application
      const appsWithDetails = await Promise.all(apps.map(async (app) => {
        try {
          const jobRef = doc(db, 'jobs', app.jobId);
          const jobSnap = await getDoc(jobRef);
          if (jobSnap.exists()) {
            const jobData = jobSnap.data();
            return { 
              ...app, 
              jobTitle: jobData.title,
              jobDeadline: jobData.deadline
            };
          }
        } catch (e) {
          console.error("Error fetching job details:", e);
        }
        return { ...app, jobTitle: 'Công việc không xác định', jobDeadline: undefined };
      }));

      // Sort by deadline (urgency) - closest deadline first
      const sortedApps = appsWithDetails.sort((a, b) => {
        if (!a.jobDeadline) return 1;
        if (!b.jobDeadline) return -1;
        return a.jobDeadline - b.jobDeadline;
      });

      setPendingApplications(sortedApps);
      setLoading(false);
    }, (error) => {
      console.error("Error in applications listener:", error);
      setLoading(false);
    });

    // 2. Fetch jobs posted by this parent
    const qParentJobs = query(
      collection(db, 'jobs'),
      where('businessId', '==', auth.currentUser.uid)
    );

    const unsubParentJobs = onSnapshot(qParentJobs, (snapshot) => {
      const jobs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
      setParentJobs(jobs);
    }, (error) => {
      console.error("Error in parent jobs listener:", error);
    });

    // 3. Fetch all active jobs for browsing
    const qAllJobs = query(
      collection(db, 'jobs'),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubAllJobs = onSnapshot(qAllJobs, (snapshot) => {
      const jobs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setAllJobs(jobs);
    }, (error) => {
      console.error("Error in all jobs listener:", error);
    });

    return () => {
      unsubChildren();
      unsubApps();
      unsubParentJobs();
      unsubAllJobs();
    };
  }, [profile?.email]);

  const handleAction = async (appId: string, status: 'approved' | 'rejected') => {
    try {
      const appRef = doc(db, 'applications', appId);
      await updateDoc(appRef, { parentStatus: status });
    } catch (error) {
      console.error('Error updating application:', error);
    }
  };

  const handleSaveJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !profile) return;

    const jobData = {
      businessId: auth.currentUser.uid,
      businessName: profile.displayName || 'Phụ huynh',
      businessLogo: profile.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.displayName || 'P')}&background=random`,
      title: formData.title,
      description: formData.description,
      salary: formData.salary,
      salaryValue: Number(formData.salaryValue),
      slotsTotal: Number(formData.slotsTotal),
      slotsFilled: 0,
      deadline: new Date(formData.deadline).getTime(),
      location: formData.location,
      type: formData.type,
      category: formData.category,
      status: 'active',
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      createdAt: Date.now(),
      isParentTask: true
    };

    try {
      await addDoc(collection(db, 'jobs'), jobData);
      setIsCreateModalOpen(false);
      resetForm();
      alert('Đã đăng công việc thành công!');
    } catch (error) {
      console.error("Error saving job:", error);
      alert('Có lỗi xảy ra khi lưu công việc.');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      salary: '',
      salaryValue: 0,
      deadline: '',
      location: '',
      type: 'online',
      category: 'Household',
      slotsTotal: 1,
      tags: ''
    });
  };

  const [viewingApplicationsFor, setViewingApplicationsFor] = useState<string | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);

  useEffect(() => {
    if (!viewingApplicationsFor) {
      setApplications([]);
      return;
    }

    const q = query(
      collection(db, 'applications'),
      where('jobId', '==', viewingApplicationsFor)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      setApplications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application)));
    });

    return () => unsub();
  }, [viewingApplicationsFor]);

  const updateApplicationStatus = async (appId: string, status: 'accepted' | 'rejected' | 'completed') => {
    try {
      await updateDoc(doc(db, 'applications', appId), { finalStatus: status });
    } catch (error) {
      console.error("Error updating application status:", error);
    }
  };

  const filteredJobs = allJobs.filter(job => 
    (job.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (job.businessName?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Header */}
      <div className="bg-white border-b border-black/5 px-6 pt-8 pb-4 sticky top-0 z-30">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-2xl">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">TeenTask Parent</h1>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Bảng điều khiển Phụ huynh</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 bg-gray-50 text-gray-400 rounded-xl">
              <Bell size={20} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl">
          {[
            { id: 'monitoring', label: 'Xác thực', icon: ShieldCheck },
            { id: 'post-job', label: 'Đăng việc', icon: Plus },
            { id: 'find-jobs', label: 'Tìm việc cho con', icon: Search },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all ${
                activeTab === tab.id 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'monitoring' && (
            <motion.div
              key="monitoring"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black flex items-center gap-2">
                  <Clock className="text-amber-500" size={20} />
                  Yêu cầu đang chờ ({pendingApplications.length})
                </h2>
                <span className="text-xs font-bold text-gray-400">Sắp xếp theo: Độ khẩn cấp</span>
              </div>

              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : pendingApplications.length === 0 ? (
                <div className="bg-white rounded-[32px] p-12 text-center border border-black/5 shadow-sm">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="text-gray-300" size={32} />
                  </div>
                  <p className="text-gray-500 font-bold">Không có yêu cầu nào cần xử lý</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {pendingApplications.map((app) => (
                    <motion.div
                      key={app.id}
                      className="bg-white rounded-[32px] p-6 border border-black/5 shadow-sm"
                    >
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-xl">
                            {app.studentName[0]}
                          </div>
                          <div>
                            <h3 className="font-black text-lg">{app.studentName}</h3>
                            <div className="flex items-center gap-2 text-xs text-gray-500 font-bold">
                              <Calendar size={12} />
                              {new Date(app.createdAt).toLocaleDateString('vi-VN')}
                            </div>
                          </div>
                        </div>
                        <div className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                          Đang chờ
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Ứng tuyển vào vị trí</p>
                        <p className="font-bold text-gray-800">{app.jobTitle || `Công việc ID: ${app.jobId}`}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center gap-2 text-xs text-red-500 font-bold">
                            <Info size={14} />
                            Cần phê duyệt trước khi con bắt đầu làm việc
                          </div>
                          {app.jobDeadline && app.jobDeadline - Date.now() < 86400000 * 3 && (
                            <div className="px-2 py-0.5 bg-red-50 text-red-600 rounded-lg text-[10px] font-black uppercase animate-pulse">
                              Khẩn cấp
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => handleAction(app.id, 'rejected')}
                          className="flex-1 py-4 bg-red-50 text-red-600 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
                        >
                          <XCircle size={18} />
                          Từ chối
                        </button>
                        <button
                          onClick={() => handleAction(app.id, 'approved')}
                          className="flex-1 py-4 bg-green-600 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-green-100 hover:bg-green-700 transition-colors"
                        >
                          <CheckCircle2 size={18} />
                          Đồng ý
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'post-job' && (
            <motion.div
              key="post-job"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black">Công việc bạn đã đăng</h2>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-lg shadow-indigo-100"
                >
                  <Plus size={16} />
                  Đăng việc mới
                </button>
              </div>

              {parentJobs.length === 0 ? (
                <div className="bg-white rounded-[32px] p-12 text-center border border-black/5 shadow-sm">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Briefcase className="text-gray-300" size={32} />
                  </div>
                  <p className="text-gray-500 font-bold mb-4">Bạn chưa đăng công việc nào cho con</p>
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="text-indigo-600 text-sm font-black"
                  >
                    Bắt đầu ngay
                  </button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {parentJobs.map((job) => (
                    <div key={job.id} className="bg-white rounded-[32px] p-6 border border-black/5 shadow-sm">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-bold text-gray-900">{job.title}</h3>
                          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{job.category}</span>
                        </div>
                        <span className="px-2 py-1 bg-green-50 text-green-600 rounded-lg text-[10px] font-black uppercase">
                          {job.status === 'active' ? 'Đang tuyển' : 'Đã đóng'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-gray-500 font-bold">
                          <div className="flex items-center gap-1">
                            <DollarSign size={14} /> {job.salary}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users size={14} /> {job.slotsFilled}/{job.slotsTotal}
                          </div>
                        </div>
                        <button
                          onClick={() => setViewingApplicationsFor(job.id)}
                          className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-black flex items-center gap-2"
                        >
                          Ứng viên
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'find-jobs' && (
            <motion.div
              key="find-jobs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Tìm việc làm phù hợp cho con..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white border border-black/5 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                />
              </div>

              <div className="grid gap-4">
                {filteredJobs.map((job) => (
                  <div 
                    key={job.id} 
                    onClick={() => {
                      setSelectedJob(job);
                      setIsDetailOpen(true);
                    }}
                    className="bg-white rounded-[32px] p-6 border border-black/5 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex gap-4 mb-4">
                      <div className="w-12 h-12 bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
                        <img src={job.businessLogo} alt={job.businessName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{job.title}</h3>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{job.businessName}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {job.tags.slice(0, 3).map((tag: string) => (
                        <span key={tag} className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                          #{tag.toUpperCase()}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-black text-indigo-600">{job.salary}</div>
                      <button className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-black flex items-center gap-2">
                        Xem chi tiết
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Create Job Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="w-full max-w-md bg-white rounded-t-[40px] p-6 max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black">Đăng việc cho con</h2>
                <button onClick={() => setIsCreateModalOpen(false)} className="p-2 bg-gray-100 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveJob} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Tiêu đề công việc</label>
                  <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl font-medium outline-none focus:ring-2 focus:ring-indigo-500" placeholder="VD: Dọn dẹp nhà cửa, Học tiếng Anh..." />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Mô tả chi tiết</label>
                  <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl font-medium outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px]" placeholder="Mô tả các bước cần làm..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Phần thưởng (Hiển thị)</label>
                    <input required type="text" value={formData.salary} onChange={e => setFormData({...formData, salary: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl font-medium outline-none focus:ring-2 focus:ring-indigo-500" placeholder="VD: 50.000đ" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Giá trị (Số)</label>
                    <input required type="number" value={formData.salaryValue} onChange={e => setFormData({...formData, salaryValue: Number(e.target.value)})} className="w-full p-4 bg-gray-50 rounded-2xl font-medium outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Hạn chót</label>
                    <input required type="date" value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl font-medium outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Hình thức</label>
                    <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})} className="w-full p-4 bg-gray-50 rounded-2xl font-medium outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="online">Online / Tại nhà</option>
                      <option value="offline">Offline / Ra ngoài</option>
                    </select>
                  </div>
                </div>
                
                <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black mt-4 shadow-lg shadow-indigo-100">
                  ĐĂNG VIỆC NGAY
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Job Detail Modal */}
      <JobDetail 
        job={selectedJob} 
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)} 
        onApply={() => {
          // Logic for parent registering for child
          alert('Tính năng đăng ký cho con đang được phát triển!');
          setIsDetailOpen(false);
        }}
        onChat={(job) => {
          // Parent chat logic
          alert('Tính năng chat với doanh nghiệp đang được phát triển!');
        }}
        isParentView={true}
      />
      {/* Applications Modal */}
      <AnimatePresence>
        {viewingApplicationsFor && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="w-full max-w-md bg-white rounded-t-[40px] p-6 max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black">Danh sách ứng viên</h2>
                <button onClick={() => setViewingApplicationsFor(null)} className="p-2 bg-gray-100 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                {applications.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Chưa có ứng viên nào.</p>
                ) : (
                  applications.map(app => (
                    <div key={app.id} className="p-4 border border-gray-100 rounded-2xl space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden">
                            {app.studentPhoto ? <img src={app.studentPhoto} className="w-full h-full object-cover" /> : <User className="w-full h-full p-2 text-gray-400" />}
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900">{app.studentName}</h4>
                            <p className="text-[10px] text-gray-500">{app.studentSchool} - {app.studentClass}</p>
                            <button 
                              onClick={() => navigate(`/student/${app.studentId}`)}
                              className="text-[10px] font-bold text-indigo-600 flex items-center gap-1 mt-1 hover:underline"
                            >
                              Xem hồ sơ <ExternalLink size={10} />
                            </button>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                          app.parentStatus === 'approved' ? 'bg-green-50 text-green-600 border-green-100' :
                          app.parentStatus === 'rejected' ? 'bg-red-50 text-red-600 border-red-100' :
                          'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>
                          PH: {app.parentStatus === 'approved' ? 'Đã duyệt' : app.parentStatus === 'rejected' ? 'Từ chối' : 'Đang chờ'}
                        </span>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          <ShieldCheck size={12} className="text-indigo-600" />
                          Người bảo lãnh
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-[10px] text-gray-400">Họ tên</p>
                            <p className="text-xs font-bold text-gray-700">{app.guardianName || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400">Quan hệ</p>
                            <p className="text-xs font-bold text-gray-700">{app.guardianRelation || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400">SĐT</p>
                            <p className="text-xs font-bold text-gray-700">{app.guardianPhone || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400">Email</p>
                            <p className="text-xs font-bold text-gray-700 truncate">{app.parentEmail || 'N/A'}</p>
                          </div>
                        </div>
                        {app.guardianAddress && (
                          <div>
                            <p className="text-[10px] text-gray-400">Địa chỉ</p>
                            <p className="text-xs font-bold text-gray-700">{app.guardianAddress}</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        {app.finalStatus === 'pending' ? (
                          <>
                            <button 
                              onClick={() => updateApplicationStatus(app.id, 'accepted')}
                              className="flex-1 py-2 bg-green-50 text-green-600 rounded-xl text-xs font-bold hover:bg-green-100"
                            >
                              Chấp nhận
                            </button>
                            <button 
                              onClick={() => updateApplicationStatus(app.id, 'rejected')}
                              className="flex-1 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100"
                            >
                              Từ chối
                            </button>
                          </>
                        ) : app.finalStatus === 'accepted' ? (
                          <button 
                            onClick={() => updateApplicationStatus(app.id, 'completed')}
                            className="w-full py-2 bg-indigo-50 text-[#4F46E5] rounded-xl text-xs font-bold hover:bg-indigo-100"
                          >
                            Đánh dấu hoàn thành
                          </button>
                        ) : (
                          <div className={`w-full py-2 text-center rounded-xl text-xs font-bold ${
                            app.finalStatus === 'completed' ? 'bg-indigo-100 text-indigo-700' :
                            app.finalStatus === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {app.finalStatus === 'completed' ? 'Đã hoàn thành' : 
                             app.finalStatus === 'rejected' ? 'Đã từ chối' : 'Không xác định'}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}


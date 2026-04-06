import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Edit2, Trash2, Users, Briefcase, MapPin, DollarSign, Clock, X, CheckCircle2, User, ShieldCheck, ExternalLink } from 'lucide-react';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db, auth, useFirebase } from './FirebaseProvider';
import { useNavigate } from 'react-router-dom';
import { Job, Application } from '../types';

export default function ManageJobs() {
  const { profile } = useFirebase();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [viewingApplicationsFor, setViewingApplicationsFor] = useState<string | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    salary: '',
    salaryValue: 0,
    deadline: '',
    location: '',
    type: 'online' as 'online' | 'offline',
    category: 'Design',
    slotsTotal: 1,
    tags: ''
  });

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'jobs'),
      where('businessId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedJobs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
      setJobs(fetchedJobs);
      setLoading(false);
    }, (error) => {
      console.error("Error in manage jobs listener:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSaveJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !profile) return;

    const jobData = {
      businessId: auth.currentUser.uid,
      businessName: profile.displayName || 'Doanh nghiệp',
      businessLogo: profile.photoURL || 'https://picsum.photos/seed/business/100/100',
      title: formData.title,
      description: formData.description,
      salary: formData.salary,
      salaryValue: Number(formData.salaryValue),
      slotsTotal: Number(formData.slotsTotal),
      slotsFilled: editingJob ? editingJob.slotsFilled : 0,
      deadline: new Date(formData.deadline).getTime(),
      location: formData.location,
      type: formData.type,
      category: formData.category,
      status: editingJob ? editingJob.status : 'active',
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      createdAt: editingJob ? editingJob.createdAt : Date.now(),
    };

    try {
      if (editingJob) {
        await updateDoc(doc(db, 'jobs', editingJob.id), jobData);
      } else {
        await addDoc(collection(db, 'jobs'), jobData);
      }
      setIsCreateModalOpen(false);
      setEditingJob(null);
      resetForm();
    } catch (error) {
      console.error("Error saving job:", error);
      alert('Có lỗi xảy ra khi lưu công việc.');
    }
  };

  const handleToggleStatus = async (jobId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'closed' : 'active';
      await updateDoc(doc(db, 'jobs', jobId), { status: newStatus });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleDelete = async (jobId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa công việc này?')) return;
    try {
      await deleteDoc(doc(db, 'jobs', jobId));
    } catch (error) {
      console.error("Error deleting job:", error);
    }
  };

  const openEditModal = (job: Job) => {
    setEditingJob(job);
    setFormData({
      title: job.title,
      description: job.description,
      salary: job.salary.toString(),
      salaryValue: (job as any).salaryValue || 0,
      deadline: new Date(job.deadline).toISOString().split('T')[0],
      location: job.location,
      type: job.type,
      category: job.category,
      slotsTotal: job.slotsTotal,
      tags: job.tags.join(', ')
    });
    setIsCreateModalOpen(true);
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
      category: 'Design',
      slotsTotal: 1,
      tags: ''
    });
  };

  const viewApplications = async (jobId: string) => {
    if (!auth.currentUser) return;
    setViewingApplicationsFor(jobId);
    const q = query(
      collection(db, 'applications'), 
      where('jobId', '==', jobId),
      where('businessId', '==', auth.currentUser.uid)
    );
    const snapshot = await getDocs(q);
    setApplications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application)));
  };

  const updateApplicationStatus = async (appId: string, status: 'accepted' | 'rejected' | 'completed') => {
    try {
      await updateDoc(doc(db, 'applications', appId), { finalStatus: status });
      setApplications(prev => prev.map(app => app.id === appId ? { ...app, finalStatus: status } : app));
    } catch (error) {
      console.error("Error updating application:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      <div className="bg-white p-6 pb-10 rounded-b-[40px] shadow-sm border-b border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Briefcase size={14} className="text-[#4F46E5]" />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Doanh nghiệp</span>
            </div>
            <h1 className="text-3xl font-black tracking-tighter text-gray-900">Quản lý tin đăng</h1>
          </div>
          <button
            onClick={() => {
              resetForm();
              setEditingJob(null);
              setIsCreateModalOpen(true);
            }}
            className="w-12 h-12 bg-[#4F46E5] text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-200 hover:bg-[#4338CA] transition-colors"
          >
            <Plus size={24} />
          </button>
        </div>
      </div>

      <div className="p-6 grid gap-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-[#4F46E5] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : jobs.length > 0 ? (
          jobs.map((job) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-6 bg-white border border-gray-100 rounded-[32px] shadow-sm ${job.status === 'closed' ? 'opacity-75' : ''}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg mb-1">{job.title}</h3>
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                    job.status === 'active' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-gray-50 text-gray-500 border-gray-100'
                  }`}>
                    {job.status === 'active' ? 'Đang tuyển' : 'Đã đóng'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEditModal(job)} className="p-2 text-gray-400 hover:text-[#4F46E5] bg-gray-50 rounded-xl transition-colors">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(job.id)} className="p-2 text-gray-400 hover:text-red-500 bg-gray-50 rounded-xl transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                  <MapPin size={14} className="text-gray-400" /> {job.location}
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-[#4F46E5]">
                  <DollarSign size={14} /> {job.salary}
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                  <Clock size={14} className="text-gray-400" /> {new Date(job.deadline).toLocaleDateString('vi-VN')}
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                  <Users size={14} className="text-gray-400" /> {job.slotsFilled}/{job.slotsTotal} ứng viên
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => viewApplications(job.id)}
                  className="flex-1 py-3 bg-indigo-50 text-[#4F46E5] rounded-2xl text-sm font-black hover:bg-indigo-100 transition-colors"
                >
                  Xem ứng viên
                </button>
                <button
                  onClick={() => handleToggleStatus(job.id, job.status)}
                  className={`flex-1 py-3 rounded-2xl text-sm font-black transition-colors ${
                    job.status === 'active' 
                    ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' 
                    : 'bg-green-50 text-green-600 hover:bg-green-100'
                  }`}
                >
                  {job.status === 'active' ? 'Đóng tin' : 'Mở lại tin'}
                </button>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase size={32} className="text-gray-300" />
            </div>
            <p className="text-gray-500 font-bold mb-4">Bạn chưa đăng tin tuyển dụng nào</p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-6 py-3 bg-[#4F46E5] text-white rounded-full text-sm font-black shadow-lg shadow-indigo-200"
            >
              Đăng tin ngay
            </button>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
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
                <h2 className="text-2xl font-black">{editingJob ? 'Sửa tin đăng' : 'Đăng tin mới'}</h2>
                <button onClick={() => setIsCreateModalOpen(false)} className="p-2 bg-gray-100 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveJob} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Tiêu đề công việc</label>
                  <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl font-medium outline-none focus:ring-2 focus:ring-[#4F46E5]" placeholder="VD: Thiết kế Poster" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Mô tả công việc</label>
                  <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl font-medium outline-none focus:ring-2 focus:ring-[#4F46E5] min-h-[100px]" placeholder="Mô tả chi tiết..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Mức lương (Hiển thị)</label>
                    <input required type="text" value={formData.salary} onChange={e => setFormData({...formData, salary: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl font-medium outline-none focus:ring-2 focus:ring-[#4F46E5]" placeholder="VD: 500.000đ" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Giá trị lương (Số)</label>
                    <input required type="number" value={formData.salaryValue} onChange={e => setFormData({...formData, salaryValue: Number(e.target.value)})} className="w-full p-4 bg-gray-50 rounded-2xl font-medium outline-none focus:ring-2 focus:ring-[#4F46E5]" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Hạn chót</label>
                    <input required type="date" value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl font-medium outline-none focus:ring-2 focus:ring-[#4F46E5]" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Số lượng tuyển</label>
                    <input required type="number" min="1" value={formData.slotsTotal} onChange={e => setFormData({...formData, slotsTotal: Number(e.target.value)})} className="w-full p-4 bg-gray-50 rounded-2xl font-medium outline-none focus:ring-2 focus:ring-[#4F46E5]" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Địa điểm</label>
                  <input required type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl font-medium outline-none focus:ring-2 focus:ring-[#4F46E5]" placeholder="VD: Quận 1, TP.HCM hoặc Toàn quốc" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Hình thức</label>
                    <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})} className="w-full p-4 bg-gray-50 rounded-2xl font-medium outline-none focus:ring-2 focus:ring-[#4F46E5]">
                      <option value="online">Online</option>
                      <option value="offline">Offline</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Danh mục</label>
                    <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl font-medium outline-none focus:ring-2 focus:ring-[#4F46E5]">
                      <option value="Design">Design</option>
                      <option value="Content">Content</option>
                      <option value="Event">Event</option>
                      <option value="Writing">Writing</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Tags (cách nhau bằng dấu phẩy)</label>
                  <input type="text" value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl font-medium outline-none focus:ring-2 focus:ring-[#4F46E5]" placeholder="VD: Design, Micro-task" />
                </div>
                
                <button type="submit" className="w-full py-4 bg-[#4F46E5] text-white rounded-2xl font-black mt-4 shadow-lg shadow-indigo-200">
                  {editingJob ? 'CẬP NHẬT' : 'ĐĂNG TIN'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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

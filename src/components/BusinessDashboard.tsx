import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Users, Briefcase, TrendingUp, ChevronRight, Megaphone, X, Send, Image as ImageIcon } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db, useFirebase } from './FirebaseProvider';

export default function BusinessDashboard() {
  const { profile } = useFirebase();
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);
  const [adData, setAdData] = useState({ title: '', description: '', imageUrl: '', linkUrl: '' });
  const [submitting, setSubmitting] = useState(false);

  const stats = [
    { label: 'Tin đang đăng', value: '3', icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Đơn ứng tuyển', value: '12', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Lượt xem tin', value: '450', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
  ];

  const handleCreateAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'advertisements'), {
        ...adData,
        businessId: profile.uid,
        businessName: profile.businessName || profile.displayName,
        status: 'pending',
        createdAt: Date.now()
      });
      setIsAdModalOpen(false);
      setAdData({ title: '', description: '', imageUrl: '', linkUrl: '' });
      alert('Yêu cầu quảng cáo đã được gửi và đang chờ phê duyệt!');
    } catch (error) {
      console.error("Error creating ad:", error);
      alert('Có lỗi xảy ra khi gửi yêu cầu quảng cáo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 pb-24 bg-slate-950 min-h-screen relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[80%] h-[80%] bg-primary rounded-full blur-[150px] opacity-10"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[80%] h-[80%] bg-secondary rounded-full blur-[150px] opacity-10"></div>
      </div>

      <div className="flex justify-between items-end mb-10 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-4 bg-primary rounded-full"></div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Quản trị hệ thống</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-white leading-none">Dashboard</h1>
        </div>
        <div className="flex gap-3">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAdModalOpen(true)}
            className="px-6 h-16 bg-white/5 backdrop-blur-xl text-white rounded-[24px] border border-white/10 flex items-center justify-center gap-3 font-black uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all"
          >
            <Megaphone size={20} className="text-primary" />
            Liên hệ quảng cáo
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-16 h-16 bg-primary text-white rounded-[24px] shadow-2xl shadow-primary/30 flex items-center justify-center border border-white/10"
          >
            <Plus size={32} strokeWidth={3} />
          </motion.button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 mb-10 relative z-10">
        {stats.map((stat, i) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white/5 backdrop-blur-3xl rounded-[32px] p-5 flex flex-col items-center text-center border border-white/10 shadow-2xl"
          >
            <div className={`w-12 h-12 rounded-2xl ${stat.bg.replace('bg-', 'bg-opacity-10 bg-')} flex items-center justify-center mb-3 shadow-inner`}>
              <stat.icon className={stat.color} size={24} strokeWidth={2.5} />
            </div>
            <span className="text-2xl font-black text-white tracking-tighter">{stat.value}</span>
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1 leading-tight">{stat.label}</span>
          </motion.div>
        ))}
      </div>

      {/* Recent Applications & Active Jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
        {/* Recent Applications */}
        <section className="mb-10">
          <div className="flex justify-between items-center mb-6 px-2">
            <h3 className="text-lg font-black text-white tracking-tight uppercase tracking-widest">Đơn ứng tuyển mới</h3>
            <button className="text-xs font-black text-primary uppercase tracking-widest">Xem tất cả</button>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="p-5 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[32px] flex items-center justify-between hover:bg-white/10 transition-all cursor-pointer group shadow-2xl"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-slate-900 rounded-[20px] border-2 border-white/5 overflow-hidden shadow-inner group-hover:scale-110 transition-transform">
                    <img src={`https://i.pravatar.cc/100?u=student_${i}`} alt="student" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-white tracking-tight">Nguyễn Văn {i}</h4>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Ứng tuyển: Thiết kế Poster</p>
                  </div>
                </div>
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-500 group-hover:text-white group-hover:bg-primary transition-all">
                  <ChevronRight size={20} strokeWidth={3} />
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Active Jobs */}
        <section>
          <div className="flex justify-between items-center mb-6 px-2">
            <h3 className="text-lg font-black text-white tracking-tight uppercase tracking-widest">Tin đang đăng</h3>
            <button className="text-xs font-black text-primary uppercase tracking-widest">Quản lý</button>
          </div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="p-8 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[40px] shadow-2xl"
          >
            <div className="flex justify-between items-start mb-8">
              <div>
                <h4 className="text-xl font-black text-white tracking-tight">Thiết kế Poster Sự kiện</h4>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-2">Đăng ngày: 12/07/2025</p>
              </div>
              <span className="text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-4 py-1.5 rounded-full uppercase tracking-widest border border-emerald-400/20">
                Đang tuyển
              </span>
            </div>
            <div className="w-full bg-white/5 h-4 rounded-full overflow-hidden mb-4 p-1 shadow-inner">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '80%' }}
                transition={{ duration: 1, delay: 0.8 }}
                className="bg-primary h-full rounded-full shadow-[0_0_15px_rgba(79,70,229,0.5)]"
              ></motion.div>
            </div>
            <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest">
              <span className="text-slate-500">Đã tuyển <span className="text-white">4/5</span> người</span>
              <span className="text-primary">80%</span>
            </div>
          </motion.div>
        </section>
      </div>

      {/* Ad Modal */}
      <AnimatePresence>
        {isAdModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-slate-900 border border-white/10 rounded-[40px] w-full max-w-lg overflow-hidden shadow-2xl"
            >
              <div className="p-8 border-b border-white/5 flex justify-between items-center">
                <h3 className="text-2xl font-black text-white tracking-tight">Liên hệ Quảng cáo</h3>
                <button onClick={() => setIsAdModalOpen(false)} className="p-2 hover:bg-white/5 rounded-xl text-slate-500">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleCreateAd} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tiêu đề quảng cáo</label>
                  <input
                    required
                    type="text"
                    value={adData.title}
                    onChange={(e) => setAdData({ ...adData, title: e.target.value })}
                    placeholder="Ví dụ: Job Shadowing tại Vinamilk"
                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-primary transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Mô tả ngắn</label>
                  <textarea
                    required
                    value={adData.description}
                    onChange={(e) => setAdData({ ...adData, description: e.target.value })}
                    placeholder="Mô tả quyền lợi hấp dẫn..."
                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white h-24 focus:outline-none focus:border-primary transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Link ảnh banner</label>
                  <div className="relative">
                    <ImageIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                    <input
                      required
                      type="url"
                      value={adData.imageUrl}
                      onChange={(e) => setAdData({ ...adData, imageUrl: e.target.value })}
                      placeholder="https://example.com/banner.jpg"
                      className="w-full pl-14 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-primary transition-all"
                    />
                  </div>
                </div>
                <button
                  disabled={submitting}
                  type="submit"
                  className="w-full py-5 bg-primary text-white rounded-[24px] font-black uppercase tracking-widest shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all"
                >
                  <Send size={20} />
                  {submitting ? 'Đang gửi...' : 'Gửi yêu cầu phê duyệt'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

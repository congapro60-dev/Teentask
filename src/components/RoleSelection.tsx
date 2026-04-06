import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Briefcase, Building2, Sparkles, ArrowRight, ShieldCheck, UserCircle, ShieldAlert } from 'lucide-react';
import { UserRole } from '../types';

export default function RoleSelection({ onSelect }: { onSelect: (role: UserRole) => void }) {
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowIntro(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-[#0F0C29] relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] bg-[#4F46E5] rounded-full blur-[120px] opacity-20"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[60%] h-[60%] bg-[#DB2777] rounded-full blur-[120px] opacity-20"></div>
      </div>

      <AnimatePresence mode="wait">
        {showIntro ? (
          <motion.div
            key="intro"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
            className="text-center relative z-10"
          >
            <motion.div 
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-24 h-24 bg-gradient-to-br from-[#4F46E5] to-[#DB2777] rounded-[32px] mx-auto mb-8 flex items-center justify-center shadow-2xl shadow-indigo-500/40"
            >
              <Sparkles className="text-white" size={48} />
            </motion.div>
            <h1 className="text-4xl font-black text-white tracking-tighter mb-2">
              CHÀO MỪNG BẠN ĐẾN VỚI
            </h1>
            <h2 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#4F46E5] to-[#DB2777] tracking-tighter">
              TEENTASK
            </h2>
          </motion.div>
        ) : (
          <motion.div
            key="selection"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm relative z-10"
          >
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-md rounded-full border border-white/10 mb-6">
                <UserCircle className="text-[#4F46E5]" size={16} />
                <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Xác định vai trò</span>
              </div>
              <h1 className="text-3xl font-black text-white mb-3 tracking-tight">
                Bạn là ai?
              </h1>
              <p className="text-white/50 text-sm leading-relaxed">
                Chọn vai trò phù hợp để bắt đầu hành trình cùng TeenTask.
              </p>
            </div>

            <div className="grid gap-4">
              <motion.button
                whileHover={{ scale: 1.02, x: 5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelect('student')}
                className="group flex items-center gap-4 p-5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[24px] text-left hover:bg-white/10 transition-all hover:border-[#4F46E5]/50"
              >
                <div className="p-3 bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] rounded-xl">
                  <Briefcase className="text-white" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white group-hover:text-[#4F46E5] transition-colors">Học sinh</h3>
                  <p className="text-white/40 text-[10px]">Tìm việc & Kiến tập</p>
                </div>
                <ArrowRight className="text-white/20 group-hover:text-white transition-colors" size={18} />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02, x: 5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelect('parent')}
                className="group flex items-center gap-4 p-5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[24px] text-left hover:bg-white/10 transition-all hover:border-[#10B981]/50"
              >
                <div className="p-3 bg-gradient-to-br from-[#10B981] to-[#059669] rounded-xl">
                  <ShieldCheck className="text-white" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white group-hover:text-[#10B981] transition-colors">Phụ huynh</h3>
                  <p className="text-white/40 text-[10px]">Xác thực & Giám sát</p>
                </div>
                <ArrowRight className="text-white/20 group-hover:text-white transition-colors" size={18} />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02, x: 5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelect('business')}
                className="group flex items-center gap-4 p-5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[24px] text-left hover:bg-white/10 transition-all hover:border-[#DB2777]/50"
              >
                <div className="p-3 bg-gradient-to-br from-[#DB2777] to-[#7C3AED] rounded-xl">
                  <Building2 className="text-white" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white group-hover:text-[#DB2777] transition-colors">Doanh nghiệp</h3>
                  <p className="text-white/40 text-[10px]">Tuyển dụng & Mentor</p>
                </div>
                <ArrowRight className="text-white/20 group-hover:text-white transition-colors" size={18} />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02, x: 5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelect('admin')}
                className="group flex items-center gap-4 p-5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[24px] text-left hover:bg-white/10 transition-all hover:border-amber-500/50"
              >
                <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl">
                  <ShieldAlert className="text-white" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white group-hover:text-amber-500 transition-colors">Quản trị viên</h3>
                  <p className="text-white/40 text-[10px]">Hệ thống & Phê duyệt</p>
                </div>
                <ArrowRight className="text-white/20 group-hover:text-white transition-colors" size={18} />
              </motion.button>
            </div>

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-10 text-center text-[10px] text-white/20 uppercase font-bold tracking-widest"
            >
              Bảo mật • An toàn • Pháp lý
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

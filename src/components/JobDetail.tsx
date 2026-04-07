import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { X, MapPin, Clock, DollarSign, Briefcase, CheckCircle2, ShieldCheck, MessageSquare, Heart } from 'lucide-react';

interface JobDetailProps {
  job: any;
  isOpen: boolean;
  onClose: () => void;
  onApply: (job: any) => void;
  onChat: (job: any) => void;
  isSaved?: boolean;
  onToggleSave?: (e: React.MouseEvent) => void;
  applicationStatus?: 'pending' | 'accepted' | 'rejected' | null;
  parentStatus?: 'pending' | 'approved' | 'rejected' | null;
  onWithdraw?: (jobId: string) => void;
  applicationCount?: number;
  isParentView?: boolean;
}

export default function JobDetail({ 
  job, 
  isOpen, 
  onClose, 
  onApply, 
  onChat, 
  isSaved, 
  onToggleSave,
  applicationStatus,
  parentStatus,
  onWithdraw,
  applicationCount,
  isParentView
}: JobDetailProps) {
  const navigate = useNavigate();

  if (!job) return null;

  const handleCompanyClick = () => {
    onClose();
    navigate(`/company/${job.businessId}`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-x-0 bottom-0 top-10 max-w-md mx-auto bg-white rounded-t-[40px] overflow-hidden z-[70] flex flex-col shadow-2xl"
          >
            {/* Status Banner */}
            {job.jobStatus !== 'Active' && (
              <div className={`py-2 px-8 flex items-center justify-center gap-2 ${
                job.jobStatus === 'Expired' ? 'bg-red-500 text-white' : 'bg-gray-500 text-white'
              }`}>
                <Clock size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {job.jobStatus === 'Expired' ? 'Công việc này đã hết hạn' : 'Công việc này đã đóng'}
                </span>
              </div>
            )}

            {/* Header */}
            <div className="relative p-8 pb-4 shrink-0">
              <div className="absolute top-6 right-6 flex gap-2">
                {onToggleSave && (
                  <button
                    onClick={onToggleSave}
                    className={`p-2 rounded-full transition-colors border shadow-sm ${
                      isSaved 
                      ? 'bg-red-50 text-red-500 border-red-100' 
                      : 'bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-100'
                    }`}
                  >
                    <Heart size={20} fill={isSaved ? "currentColor" : "none"} />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 bg-gray-100 rounded-full text-gray-400 hover:bg-gray-200 transition-colors border border-gray-100 shadow-sm"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex gap-4 mb-6">
                <div 
                  onClick={handleCompanyClick}
                  className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center overflow-hidden border border-gray-100 shadow-inner cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <img src={job.logo} alt={job.company} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tighter text-gray-900 leading-tight">{job.title}</h2>
                  <div className="flex flex-wrap items-center gap-3 mt-1">
                    <p 
                      onClick={handleCompanyClick}
                      className="text-sm text-gray-400 font-bold uppercase tracking-wider cursor-pointer hover:text-[#4F46E5] transition-colors"
                    >
                      {job.company}
                    </p>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                      job.jobStatus === 'Active' ? 'bg-green-50 text-green-600 border-green-100' :
                      job.jobStatus === 'Closed' ? 'bg-gray-50 text-gray-500 border-gray-100' :
                      'bg-red-50 text-red-600 border-red-100'
                    }`}>
                      {job.jobStatus === 'Active' ? 'Đang tuyển' :
                       job.jobStatus === 'Closed' ? 'Đã đóng' :
                       'Hết hạn'}
                    </span>
                    {applicationCount !== undefined && (
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full text-[10px] font-black uppercase tracking-widest">
                        {applicationCount} lượt ứng tuyển
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {applicationStatus && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`mb-6 p-5 rounded-3xl flex flex-col gap-3 border shadow-sm ${
                    applicationStatus === 'accepted' ? 'bg-green-50 border-green-100' :
                    applicationStatus === 'rejected' ? 'bg-red-50 border-red-100' :
                    'bg-amber-50 border-amber-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full animate-pulse ${
                        applicationStatus === 'accepted' ? 'bg-green-500' :
                        applicationStatus === 'rejected' ? 'bg-red-500' :
                        'bg-amber-500'
                      }`} />
                      <span className={`text-xs font-black uppercase tracking-[0.15em] ${
                        applicationStatus === 'accepted' ? 'text-green-700' :
                        applicationStatus === 'rejected' ? 'text-red-700' :
                        'text-amber-700'
                      }`}>
                        Trạng thái ứng tuyển
                      </span>
                    </div>
                    <span className={`text-lg font-black tracking-tight ${
                      applicationStatus === 'accepted' ? 'text-green-800' :
                      applicationStatus === 'rejected' ? 'text-red-800' :
                      'text-amber-800'
                    }`}>
                      {applicationStatus === 'accepted' ? 'Đã chấp nhận' :
                       applicationStatus === 'rejected' ? 'Đã từ chối' :
                       'Đang chờ duyệt'}
                    </span>
                  </div>

                  {parentStatus && (
                    <div className="flex items-center justify-between pt-3 border-t border-black/5">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Xác thực phụ huynh</span>
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          parentStatus === 'approved' ? 'bg-green-500' :
                          parentStatus === 'rejected' ? 'bg-red-500' :
                          'bg-amber-500'
                        }`} />
                        <span className={`text-xs font-black ${
                          parentStatus === 'approved' ? 'text-green-700' :
                          parentStatus === 'rejected' ? 'text-red-700' :
                          'text-amber-700'
                        }`}>
                          {parentStatus === 'approved' ? 'Đã đồng ý' :
                           parentStatus === 'rejected' ? 'Đã từ chối' :
                           'Đang chờ'}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {applicationStatus === 'pending' && onWithdraw && (
                    <button
                      onClick={() => onWithdraw(job.id)}
                      className="w-full py-2.5 bg-white/50 hover:bg-white text-amber-700 text-xs font-black uppercase tracking-widest rounded-xl transition-all border border-amber-200/50"
                    >
                      Rút đơn ứng tuyển
                    </button>
                  )}
                </motion.div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <MapPin size={16} className="text-[#4F46E5]" />
                  <span className="text-[11px] font-bold text-gray-600">{job.location}</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <DollarSign size={16} className="text-[#4F46E5]" />
                  <span className="text-[11px] font-bold text-gray-600">{job.salary}</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <Clock size={16} className="text-[#4F46E5]" />
                  <span className="text-[11px] font-bold text-gray-600">Hạn: {job.deadlineDisplay}</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <Briefcase size={16} className="text-[#4F46E5]" />
                  <span className="text-[11px] font-bold text-gray-600">{job.type}</span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 pt-4 no-scrollbar">
              <div className="space-y-8">
                {/* Responsibilities */}
                <section className="space-y-4">
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-[#4F46E5] rounded-full"></div>
                    Trách nhiệm công việc
                  </h3>
                  <ul className="space-y-3">
                    {job.responsibilities?.map((item: string, i: number) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-gray-600 leading-relaxed group">
                        <div className="mt-2 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0 group-hover:scale-125 transition-transform" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>

                {/* Qualifications */}
                <section className="space-y-4">
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-amber-500 rounded-full"></div>
                    Yêu cầu ứng viên
                  </h3>
                  <ul className="space-y-3">
                    {job.qualifications?.map((item: string, i: number) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-gray-600 leading-relaxed group">
                        <div className="mt-2 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 group-hover:scale-125 transition-transform" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>

                {/* Benefits */}
                <section className="space-y-4">
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-green-500 rounded-full"></div>
                    Quyền lợi & Đãi ngộ
                  </h3>
                  <div className="bg-green-50/30 p-6 rounded-3xl border border-green-100/50">
                    <ul className="space-y-3">
                      {job.benefits?.map((item: string, i: number) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-gray-700 leading-relaxed group">
                          <div className="mt-2 w-1.5 h-1.5 rounded-full bg-green-500 shrink-0 group-hover:scale-125 transition-transform" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>

                {/* Map View */}
                <section>
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-[#4F46E5] rounded-full"></div>
                    Bản đồ & Chỉ đường
                  </h3>
                  <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                    <div className="aspect-video w-full bg-gray-100 relative">
                      <iframe
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        style={{ border: 0 }}
                        src={`https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${encodeURIComponent(job.location)}`}
                        allowFullScreen
                        title="Job Location"
                        className="grayscale hover:grayscale-0 transition-all duration-500"
                        // Fallback if no API key is provided - using a simple search link or a placeholder
                        onError={(e) => {
                          (e.target as any).src = `https://maps.google.com/maps?q=${encodeURIComponent(job.location)}&output=embed`;
                        }}
                      />
                      {/* Overlay to prevent accidental scrolling while navigating the modal */}
                      <div className="absolute inset-0 pointer-events-none border-4 border-white/20 rounded-3xl"></div>
                    </div>
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-[#4F46E5]" />
                        <span className="text-xs font-bold text-gray-600 truncate max-w-[180px]">{job.location}</span>
                      </div>
                      <button 
                        onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(job.location)}`, '_blank')}
                        className="px-4 py-2 bg-indigo-50 text-[#4F46E5] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all"
                      >
                        Chỉ đường
                      </button>
                    </div>
                  </div>
                </section>
              </div>
            </div>

            {/* Footer */}
            <div className="p-8 bg-white border-t border-gray-100 flex gap-3">
              {applicationStatus ? (
                <div className="flex-1 py-4 bg-gray-50 text-gray-400 rounded-[24px] text-sm font-black text-center border border-gray-100">
                  ĐÃ NỘP ĐƠN ỨNG TUYỂN
                </div>
              ) : job.jobStatus !== 'Active' ? (
                <div className="flex-1 py-4 bg-gray-50 text-gray-400 rounded-[24px] text-sm font-black text-center border border-gray-100">
                  KHÔNG THỂ ỨNG TUYỂN
                </div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onApply(job)}
                  className="flex-1 py-4 bg-[#4F46E5] text-white rounded-[24px] text-sm font-black shadow-lg shadow-indigo-100 hover:bg-[#4338CA] transition-all"
                >
                  {isParentView ? 'ĐĂNG KÝ CHO CON' : 'ỨNG TUYỂN NGAY'}
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onChat(job)}
                className="w-14 h-14 flex items-center justify-center bg-indigo-50 text-[#4F46E5] rounded-[24px] hover:bg-indigo-100 transition-all border border-indigo-100"
              >
                <MessageSquare size={20} />
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

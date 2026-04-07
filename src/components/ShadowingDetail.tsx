import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, MapPin, Users, Star, ShieldCheck, ChevronRight, Heart } from 'lucide-react';
import React, { useState } from 'react';
import { useFirebase } from './FirebaseProvider';
import { cn } from '../lib/utils';

interface ShadowingDetailProps {
  event: any;
  isOpen: boolean;
  onClose: () => void;
  onChat: (e: React.MouseEvent) => void;
}

export default function ShadowingDetail({ event, isOpen, onClose, onChat }: ShadowingDetailProps) {
  const [step, setStep] = useState<'detail' | 'booking' | 'success'>('detail');
  const { profile, toggleSaveShadowing, bookShadowing } = useFirebase();

  if (!event) return null;

  const handleConfirm = async () => {
    await bookShadowing(event);
    setStep('success');
  };

  const isSaved = profile?.savedShadowing?.includes(event.id);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[60]"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 top-10 max-w-md mx-auto bg-slate-950 rounded-t-[48px] overflow-hidden z-[70] flex flex-col border-t border-white/10 shadow-2xl"
          >
            {/* Header Image */}
            <div className="relative h-80 shrink-0">
              <img
                src={event.image}
                alt={event.title}
                className="w-full h-full object-cover opacity-50"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
              <div className="absolute top-8 right-8 flex items-center gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSaveShadowing(event.id);
                  }}
                  className={cn(
                    "p-3 backdrop-blur-2xl rounded-2xl border transition-all active:scale-90",
                    isSaved 
                    ? "bg-red-500 text-white border-red-500" 
                    : "bg-white/10 text-white border-white/10 hover:bg-white/20"
                  )}
                >
                  <Heart size={20} strokeWidth={3} fill={isSaved ? "currentColor" : "none"} />
                </button>
                <button
                  onClick={onClose}
                  className="p-3 bg-white/10 backdrop-blur-2xl rounded-2xl text-white border border-white/10 hover:bg-white/20 transition-all active:scale-90"
                >
                  <X size={20} strokeWidth={3} />
                </button>
              </div>
              <div className="absolute bottom-8 left-10 right-10">
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] bg-gradient-to-r ${event.color} px-4 py-1.5 rounded-full text-white mb-4 inline-block shadow-2xl border border-white/10`}>
                  {event.category}
                </span>
                <h2 className="text-3xl font-black text-white leading-tight tracking-tighter">{event.title}</h2>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-10 no-scrollbar text-slate-400">
              {step === 'detail' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="flex items-center gap-5 mb-10 p-6 bg-white/5 rounded-[32px] border border-white/10 shadow-inner">
                    <div className="w-16 h-16 bg-slate-900 rounded-[24px] border-4 border-white/5 overflow-hidden shadow-2xl">
                      <img src={`https://i.pravatar.cc/100?u=${event.mentor}`} alt={event.mentor} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div>
                      <h4 className="text-white font-black text-lg tracking-tight leading-tight">{event.mentor}</h4>
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">{event.role} @ {event.company}</p>
                      <div className="flex items-center gap-1.5 mt-2">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} size={12} fill={s <= 4 ? '#fbbf24' : 'none'} className={s <= 4 ? 'text-amber-400' : 'text-white/10'} strokeWidth={2.5} />
                        ))}
                        <span className="text-[10px] text-slate-500 font-black ml-2 uppercase tracking-widest">(42 đánh giá)</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 mb-10">
                    <div className="p-5 bg-white/5 rounded-[28px] border border-white/5 shadow-inner">
                      <div className="w-10 h-10 bg-secondary/10 rounded-2xl flex items-center justify-center mb-4">
                        <Calendar className="text-secondary" size={20} strokeWidth={2.5} />
                      </div>
                      <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1.5">Thời gian</p>
                      <p className="text-xs font-black text-white uppercase tracking-widest">{event.date}</p>
                    </div>
                    <div className="p-5 bg-white/5 rounded-[28px] border border-white/5 shadow-inner">
                      <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                        <MapPin className="text-primary" size={20} strokeWidth={2.5} />
                      </div>
                      <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1.5">Địa điểm</p>
                      <p className="text-xs font-black text-white uppercase tracking-widest">{event.company}</p>
                    </div>
                  </div>

                  <h3 className="text-white font-black text-lg tracking-tight mb-4">Mô tả chương trình</h3>
                  <p className="text-sm leading-relaxed mb-10 font-bold text-slate-400">
                    Trải nghiệm một ngày làm việc thực thụ tại {event.company}. Bạn sẽ được tham gia vào các buổi họp team, quan sát quy trình làm việc chuyên nghiệp và nhận được sự hướng dẫn trực tiếp từ Mentor {event.mentor}.
                  </p>

                  <div className="bg-white/5 p-8 rounded-[40px] border border-white/10 mb-10 shadow-inner">
                    <h4 className="text-white font-black text-base tracking-tight mb-6 flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                        <ShieldCheck className="text-emerald-500" size={18} strokeWidth={2.5} />
                      </div>
                      Quyền lợi độc quyền
                    </h4>
                    <ul className="space-y-4 text-sm">
                      <li className="flex items-start gap-4">
                        <div className="w-2 h-2 bg-primary rounded-full mt-1.5 shadow-[0_0_10px_rgba(79,70,229,0.5)]"></div>
                        <span className="font-bold text-slate-300">Chứng nhận kinh nghiệm từ {event.company}</span>
                      </li>
                      <li className="flex items-start gap-4">
                        <div className="w-2 h-2 bg-primary rounded-full mt-1.5 shadow-[0_0_10px_rgba(79,70,229,0.5)]"></div>
                        <span className="font-bold text-slate-300">Ăn trưa cùng chuyên gia</span>
                      </li>
                      <li className="flex items-start gap-4">
                        <div className="w-2 h-2 bg-primary rounded-full mt-1.5 shadow-[0_0_10px_rgba(79,70,229,0.5)]"></div>
                        <span className="font-bold text-slate-300">Tư vấn định hướng nghề nghiệp 1-1</span>
                      </li>
                    </ul>
                  </div>
                </motion.div>
              )}

              {step === 'booking' && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                  <h3 className="text-2xl font-black text-white mb-8 tracking-tighter">Xác nhận đặt vé</h3>
                  <div className="bg-white/5 p-8 rounded-[40px] border border-white/10 mb-10 shadow-inner">
                    <div className="flex justify-between mb-5">
                      <span className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Suất kiến tập</span>
                      <span className="text-white font-black">{event.price}</span>
                    </div>
                    <div className="flex justify-between mb-5">
                      <span className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Phí dịch vụ</span>
                      <span className="text-white font-black">10.000đ</span>
                    </div>
                    <div className="pt-6 border-t border-white/10 flex justify-between items-end">
                      <span className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Tổng cộng</span>
                      <span className="text-3xl font-black text-amber-400 tracking-tighter">{event.price}</span>
                    </div>
                  </div>

                  <div className="p-6 bg-amber-400/5 rounded-[32px] border border-amber-400/10 mb-10">
                    <p className="text-xs text-amber-400/80 font-bold leading-relaxed">Phương thức thanh toán sẽ được gửi đến email phụ huynh để phê duyệt trước khi hoàn tất.</p>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Footer Action */}
            <div className="p-10 bg-slate-950 border-t border-white/10 pb-12">
              {step === 'detail' && (
                <div className="flex gap-4">
                  <button
                    onClick={onChat}
                    className="flex-1 py-5 bg-white/5 text-white rounded-[28px] font-black text-sm uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95 border border-white/10 flex items-center justify-center"
                  >
                    Chat
                  </button>
                  <button
                    onClick={() => setStep('booking')}
                    className="flex-[2] py-5 bg-white text-slate-950 rounded-[28px] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-100 transition-all active:scale-95 shadow-2xl shadow-white/5"
                  >
                    Đặt vé ngay
                    <ChevronRight size={20} strokeWidth={3} />
                  </button>
                </div>
              )}
              {step === 'booking' && (
                <div className="flex gap-4">
                  <button
                    onClick={() => setStep('detail')}
                    className="flex-1 py-5 bg-white/5 text-white rounded-[28px] font-black text-sm uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95 border border-white/10"
                  >
                    Quay lại
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="flex-[2] py-5 bg-primary text-white rounded-[28px] font-black text-sm uppercase tracking-widest hover:bg-primary/90 transition-all active:scale-95 shadow-2xl shadow-primary/30"
                  >
                    Xác nhận
                  </button>
                </div>
              )}
              {step === 'success' && (
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
                    <ShieldCheck className="text-emerald-500" size={40} strokeWidth={2.5} />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-2 tracking-tighter">Đăng ký thành công!</h3>
                  <p className="text-slate-400 text-sm font-bold mb-8">Buổi kiến tập đã được thêm vào lịch trình của bạn.</p>
                  <button
                    onClick={onClose}
                    className="w-full py-5 bg-white text-slate-950 rounded-[28px] font-black text-sm uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-95 shadow-2xl shadow-white/5"
                  >
                    Đóng
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

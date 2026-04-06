import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, TrendingUp, TrendingDown, Info, Star, Award, Zap, ChevronRight, ArrowLeft, History, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFirebase } from './FirebaseProvider';
import { cn } from '../lib/utils';

export default function TrustScore() {
  const navigate = useNavigate();
  const { profile } = useFirebase();
  const score = profile?.trustScore ?? 0; // Default score to 0

  const getScoreLevel = (s: number) => {
    if (s >= 900) return { label: 'Xuất sắc', color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100' };
    if (s >= 750) return { label: 'Tốt', color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100' };
    if (s >= 500) return { label: 'Trung bình', color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100' };
    return { label: 'Cần cải thiện', color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100' };
  };

  const level = getScoreLevel(score);

  const history = [
    { id: 1, action: 'Hoàn thành thiết kế Poster', date: '02/04/2026', change: '+25', type: 'up' },
    { id: 2, action: 'Đánh giá 5 sao từ The Coffee House', date: '01/04/2026', change: '+10', type: 'up' },
    { id: 3, action: 'Xác thực phụ huynh thành công', date: '28/03/2026', change: '+100', type: 'up' },
    { id: 4, action: 'Hủy công việc muộn', date: '20/03/2026', change: '-30', type: 'down' },
  ];

  const rules = [
    { icon: Zap, label: 'Hoàn thành công việc', desc: '+20 đến +50 điểm tùy theo đánh giá của doanh nghiệp.', color: 'text-blue-500', bg: 'bg-blue-50' },
    { icon: Star, label: 'Đánh giá 5 sao', desc: '+10 điểm thưởng cho mỗi lần nhận đánh giá tối đa.', color: 'text-amber-500', bg: 'bg-amber-50' },
    { icon: ShieldCheck, label: 'Xác thực danh tính', desc: '+100 điểm khi hoàn tất xác thực qua phụ huynh.', color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { icon: Info, label: 'Vi phạm quy định', desc: '-50 đến -100 điểm nếu hủy việc muộn hoặc bị báo cáo.', color: 'text-red-500', bg: 'bg-red-50' },
  ];

  const benefits = [
    { title: 'Ưu tiên ứng tuyển', desc: 'Hồ sơ của bạn sẽ được đẩy lên đầu danh sách chờ của doanh nghiệp.' },
    { title: 'Mở khóa việc làm VIP', desc: 'Tiếp cận các công việc có thù lao cao chỉ dành cho người dùng uy tín.' },
    { title: 'Huy hiệu tin cậy', desc: 'Hiển thị huy hiệu đặc biệt trên trang cá nhân để gây ấn tượng.' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-50 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-slate-600" />
        </button>
        <h1 className="text-xl font-black text-slate-900 tracking-tight">Điểm uy tín</h1>
      </div>

      <div className="max-w-2xl mx-auto p-6 space-y-8">
        {/* Score Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[40px] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-slate-100">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${(score / 1000) * 100}%` }}
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600"
            />
          </div>

          <div className="mb-6 inline-flex items-center justify-center w-32 h-32 rounded-full border-8 border-slate-50 relative">
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-slate-100"
              />
              <motion.circle
                cx="64"
                cy="64"
                r="56"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray="351.85"
                initial={{ strokeDashoffset: 351.85 }}
                animate={{ strokeDashoffset: 351.85 - (351.85 * score) / 1000 }}
                className="text-[#1877F2]"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-slate-900 tracking-tighter">{score}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">/ 1000</span>
            </div>
          </div>

          <div className={cn("inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4", level.bg, level.color, "border", level.border)}>
            <Award size={14} />
            Hạng: {level.label}
          </div>

          <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-xs mx-auto">
            Điểm uy tín phản ánh sự chuyên nghiệp và tin cậy của bạn trên hệ thống TeenTask.
          </p>
        </motion.div>

        {/* Benefits Section */}
        <section>
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <Zap size={14} className="text-amber-500" /> Đặc quyền của bạn
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {benefits.map((benefit, i) => (
              <div key={i} className="bg-white p-5 rounded-3xl border border-slate-100 flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 flex-shrink-0">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1">{benefit.title}</h4>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">{benefit.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <HelpCircle size={14} className="text-blue-500" /> Cơ chế tính điểm
            </h3>
          </div>
          <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden">
            {rules.map((rule, i) => (
              <div key={i} className={cn("p-5 flex items-start gap-4", i !== rules.length - 1 && "border-b border-slate-50")}>
                <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0", rule.bg, rule.color)}>
                  <rule.icon size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1">{rule.label}</h4>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">{rule.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* History */}
        <section>
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <History size={14} className="text-slate-400" /> Lịch sử biến động
          </h3>
          <div className="space-y-3">
            {history.map((item) => (
              <div key={item.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center",
                    item.type === 'up' ? "bg-emerald-50 text-emerald-500" : "bg-red-50 text-red-500"
                  )}>
                    {item.type === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{item.action}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{item.date}</p>
                  </div>
                </div>
                <span className={cn(
                  "text-sm font-black tracking-tight",
                  item.type === 'up' ? "text-emerald-500" : "text-red-500"
                )}>
                  {item.change}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Footer Info */}
        <div className="bg-slate-900 rounded-3xl p-6 text-center">
          <p className="text-white/60 text-xs font-medium mb-4 leading-relaxed">
            Hệ thống TrustScore được vận hành tự động để đảm bảo tính công bằng và minh bạch cho cộng đồng TeenTask.
          </p>
          <button className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors">
            Tìm hiểu thêm về quy định cộng đồng
          </button>
        </div>
      </div>
    </div>
  );
}

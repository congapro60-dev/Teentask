import React from 'react';
import { motion } from 'motion/react';
import { Star, ShieldCheck, Zap, Award, Crown, Check, ArrowLeft, Sparkles, TrendingUp, Gift, MessageSquare, Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFirebase } from './FirebaseProvider';
import { cn } from '../lib/utils';

export default function Vip() {
  const navigate = useNavigate();
  const { profile, updateProfile } = useFirebase();
  const [selectedPlan, setSelectedPlan] = React.useState(1); // Default to 'Năm'

  const benefits = [
    {
      icon: Briefcase,
      title: 'Tiếp cận việc làm VIP',
      desc: 'Mở khóa các công việc có thù lao cao và yêu cầu chuyên môn từ các đối tác lớn.',
      color: 'text-blue-500',
      bg: 'bg-blue-50'
    },
    {
      icon: TrendingUp,
      title: 'Ưu tiên ứng tuyển',
      desc: 'Hồ sơ của bạn luôn được hiển thị ở vị trí đầu tiên trong danh sách chờ của doanh nghiệp.',
      color: 'text-emerald-500',
      bg: 'bg-emerald-50'
    },
    {
      icon: ShieldCheck,
      title: 'Huy hiệu xác thực VIP',
      desc: 'Hiển thị huy hiệu vương miện vàng trên trang cá nhân và trong các cuộc hội thoại.',
      color: 'text-amber-500',
      bg: 'bg-amber-50'
    },
    {
      icon: MessageSquare,
      title: 'Hỗ trợ 24/7',
      desc: 'Đội ngũ hỗ trợ riêng biệt giúp bạn giải quyết mọi vấn đề nhanh chóng nhất.',
      color: 'text-purple-500',
      bg: 'bg-purple-50'
    },
    {
      icon: Gift,
      title: 'Quà tặng độc quyền',
      desc: 'Nhận các bộ tài liệu hướng dẫn nghề nghiệp và voucher từ các đối tác đào tạo.',
      color: 'text-pink-500',
      bg: 'bg-pink-50'
    }
  ];

  const plans = [
    {
      name: 'Tháng',
      price: '199.000đ',
      priceValue: 199000,
      period: '/tháng',
      popular: false,
    },
    {
      name: 'Năm',
      price: '1.490.000đ',
      priceValue: 1490000,
      period: '/năm',
      popular: true,
      save: 'Tiết kiệm 40%'
    },
    {
      name: 'Vĩnh viễn',
      price: '4.990.000đ',
      priceValue: 4990000,
      period: '',
      popular: false,
    }
  ];

  const handleUpgrade = async () => {
    if (profile?.isVip) {
      alert('Bạn đã là thành viên VIP!');
      return;
    }

    const plan = plans[selectedPlan];
    if ((profile?.balance || 0) < plan.priceValue) {
      alert(`Số dư không đủ để mua gói ${plan.name}. Vui lòng nạp thêm tiền.`);
      return;
    }

    try {
      await updateProfile({
        balance: (profile?.balance || 0) - plan.priceValue,
        isVip: true
      });
      alert(`Chúc mừng! Bạn đã nâng cấp thành công gói VIP ${plan.name}.`);
    } catch (error) {
      console.error("Error upgrading VIP:", error);
      alert('Có lỗi xảy ra khi nâng cấp VIP.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-50 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-slate-600" />
        </button>
        <h1 className="text-xl font-black text-slate-900 tracking-tight">Đặc quyền VIP</h1>
      </div>

      <div className="max-w-2xl mx-auto p-6 space-y-10">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-[40px] p-10 text-white overflow-hidden text-center">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-10 left-10 w-32 h-32 bg-amber-400 rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-10 w-32 h-32 bg-blue-400 rounded-full blur-3xl" />
          </div>
          
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-amber-400 rounded-[28px] mb-6 shadow-2xl shadow-amber-400/20"
          >
            <Crown size={40} className="text-slate-900" fill="currentColor" />
          </motion.div>
          
          <h2 className="text-3xl font-black mb-3 tracking-tight">Nâng tầm sự nghiệp</h2>
          <p className="text-white/60 text-sm font-medium leading-relaxed max-w-xs mx-auto">
            Trở thành thành viên VIP để mở khóa những cơ hội nghề nghiệp tốt nhất.
          </p>

          {profile?.isVip && (
            <div className="mt-8 inline-flex items-center gap-2 px-6 py-2 bg-amber-400/20 border border-amber-400/30 rounded-full text-amber-400 text-xs font-black uppercase tracking-widest">
              <Check size={14} /> Bạn đang là thành viên VIP
            </div>
          )}
        </div>

        {/* Benefits Grid */}
        <section>
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
            <Sparkles size={14} className="text-amber-500" /> Đặc quyền thành viên
          </h3>
          <div className="space-y-4">
            {benefits.map((benefit, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-6 rounded-[32px] border border-slate-100 flex items-start gap-5 hover:shadow-xl hover:shadow-slate-200/50 transition-all"
              >
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0", benefit.bg, benefit.color)}>
                  <benefit.icon size={24} />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 mb-1">{benefit.title}</h4>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">{benefit.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Pricing Plans */}
        <section>
          <div className="flex justify-between items-end mb-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <Award size={14} className="text-blue-500" /> Gói thành viên
            </h3>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Số dư hiện tại</p>
              <p className="text-sm font-black text-[#1877F2]">{profile?.balance?.toLocaleString('vi-VN')}đ</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {plans.map((plan, i) => (
              <div 
                key={i}
                onClick={() => setSelectedPlan(i)}
                className={cn(
                  "relative bg-white p-6 rounded-[32px] border-2 transition-all cursor-pointer flex items-center justify-between group",
                  selectedPlan === i ? "border-amber-400 shadow-xl shadow-amber-100" : "border-slate-100 hover:border-slate-200"
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-amber-400 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">
                    Phổ biến nhất
                  </div>
                )}
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center",
                    selectedPlan === i ? "bg-amber-400 text-white" : "bg-slate-100 text-slate-400"
                  )}>
                    <Star size={24} fill={selectedPlan === i ? "currentColor" : "none"} />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-900">Gói {plan.name}</h4>
                    {plan.save && <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{plan.save}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-slate-900 tracking-tighter">{plan.price}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{plan.period}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Call to Action */}
        <div className="pt-4">
          <button 
            onClick={handleUpgrade}
            disabled={profile?.isVip}
            className={cn(
              "w-full py-5 rounded-[24px] font-black text-sm shadow-2xl transition-all active:scale-95",
              profile?.isVip 
                ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                : "bg-slate-900 text-white shadow-slate-200 hover:bg-slate-800"
            )}
          >
            {profile?.isVip ? 'BẠN ĐÃ LÀ THÀNH VIÊN VIP' : 'NÂNG CẤP NGAY'}
          </button>
          <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-4">
            Thanh toán an toàn qua cổng VNPay / MoMo
          </p>
        </div>
      </div>
    </div>
  );
}

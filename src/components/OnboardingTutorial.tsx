import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MousePointer2, X, ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { useFirebase } from './FirebaseProvider';

interface Step {
  targetId: string;
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

const ROLE_STEPS: Record<string, Step[]> = {
  student: [
    { targetId: 'nav-home', title: 'Trang chủ', content: 'Nơi cập nhật những tin tức và việc làm mới nhất dành cho bạn.', position: 'bottom' },
    { targetId: 'nav-jobs', title: 'Việc làm', content: 'Khám phá hàng ngàn công việc Micro-tasking để kiếm thêm thu nhập và xây dựng CV.', position: 'bottom' },
    { targetId: 'nav-messages', title: 'Tin nhắn', content: 'Trao đổi trực tiếp với nhà tuyển dụng và bạn bè tại đây.', position: 'bottom' },
    { targetId: 'nav-about', title: 'Thông tin dự án', content: 'Tìm hiểu kỹ hơn về sứ mệnh và cách hoạt động của TeenTask.', position: 'bottom' },
    { targetId: 'user-profile-btn', title: 'Trang cá nhân', content: 'Quản lý hồ sơ, kỹ năng và xem TrustScore của bạn.', position: 'bottom' },
  ],
  parent: [
    { targetId: 'nav-home', title: 'Trang chủ', content: 'Theo dõi các hoạt động cộng đồng và tin tức giáo dục.', position: 'bottom' },
    { targetId: 'nav-monitoring', title: 'Giám sát', content: 'Phê duyệt các đơn ứng tuyển của con và theo dõi tiến độ công việc.', position: 'bottom' },
    { targetId: 'nav-messages', title: 'Tin nhắn', content: 'Liên lạc với con và các đối tác trong mạng lưới Parent-Swap.', position: 'bottom' },
    { targetId: 'user-profile-btn', title: 'Trang cá nhân', content: 'Cập nhật thông tin phụ huynh và quản lý tài khoản.', position: 'bottom' },
  ],
  business: [
    { targetId: 'nav-home', title: 'Trang chủ', content: 'Tổng quan về các hoạt động tuyển dụng của doanh nghiệp.', position: 'bottom' },
    { targetId: 'nav-jobs-manage', title: 'Quản lý việc làm', content: 'Đăng tin tuyển dụng mới và quản lý các đơn ứng tuyển từ học sinh.', position: 'bottom' },
    { targetId: 'nav-shadowing-manage', title: 'Quản lý kiến tập', position: 'bottom', content: 'Tổ chức các buổi Job Shadowing để quảng bá thương hiệu doanh nghiệp.' },
    { targetId: 'nav-messages', title: 'Tin nhắn', content: 'Phỏng vấn và trao đổi với các ứng viên tiềm năng.', position: 'bottom' },
    { targetId: 'user-profile-btn', title: 'Trang cá nhân', content: 'Cập nhật thông tin doanh nghiệp và hồ sơ mentor.', position: 'bottom' },
  ],
  admin: [
    { targetId: 'nav-home', title: 'Trang chủ', content: 'Bảng điều khiển tổng quan dành cho quản trị viên.', position: 'bottom' },
    { targetId: 'nav-admin', title: 'Quản trị', content: 'Duyệt các yêu cầu đổi tên, xác thực người dùng và quản lý hệ thống.', position: 'bottom' },
    { targetId: 'nav-surveys', title: 'Khảo sát', content: 'Xem kết quả khảo sát từ người dùng để cải thiện ứng dụng.', position: 'bottom' },
  ]
};

export default function OnboardingTutorial() {
  const { profile, updateProfile } = useFirebase();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const role = profile?.role || 'student';
  const steps = ROLE_STEPS[role] || ROLE_STEPS.student;

  useEffect(() => {
    setCurrentStep(0);
    setTargetRect(null);
  }, [role]);

  useEffect(() => {
    if (profile && (!profile.tutorialCompleted || !profile.tutorialCompleted[role])) {
      // Small delay to ensure elements are rendered
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [profile, role]);

  useEffect(() => {
    if (isVisible && steps[currentStep]) {
      const updatePosition = () => {
        const element = document.getElementById(steps[currentStep].targetId);
        if (element) {
          setTargetRect(element.getBoundingClientRect());
        }
      };

      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition);
      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition);
      };
    }
  }, [isVisible, currentStep, steps]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    setIsVisible(false);
    if (profile) {
      const tutorialCompleted = profile.tutorialCompleted || {};
      await updateProfile({
        tutorialCompleted: {
          ...tutorialCompleted,
          [role]: true
        }
      });
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  if (!isVisible || !targetRect || !steps[currentStep]) return null;

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {/* Backdrop with hole */}
      <div 
        className="absolute inset-0 bg-black/60 pointer-events-auto"
        style={{
          clipPath: `polygon(
            0% 0%, 0% 100%, 
            ${targetRect.left - 8}px 100%, 
            ${targetRect.left - 8}px ${targetRect.top - 8}px, 
            ${targetRect.right + 8}px ${targetRect.top - 8}px, 
            ${targetRect.right + 8}px ${targetRect.bottom + 8}px, 
            ${targetRect.left - 8}px ${targetRect.bottom + 8}px, 
            ${targetRect.left - 8}px 100%, 
            100% 100%, 100% 0%
          )`
        }}
      />

      {/* Finger Pointer */}
      <motion.div
        animate={{ 
          x: targetRect.left + targetRect.width / 2 - 20,
          y: targetRect.bottom + 20,
          scale: [1, 1.1, 1]
        }}
        transition={{ 
          scale: { duration: 1, repeat: Infinity },
          x: { type: 'spring', damping: 20 },
          y: { type: 'spring', damping: 20 }
        }}
        className="absolute text-white drop-shadow-2xl"
      >
        <MousePointer2 size={48} fill="currentColor" className="rotate-[-45deg]" />
      </motion.div>

      {/* Message Box */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ 
          opacity: 1, 
          scale: 1, 
          y: 0,
          x: Math.min(window.innerWidth - 340, Math.max(20, targetRect.left + targetRect.width / 2 - 160)),
          top: targetRect.bottom + 80
        }}
        className="absolute w-[320px] bg-white rounded-[32px] p-6 shadow-2xl pointer-events-auto border border-indigo-100"
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
              <CheckCircle2 size={18} />
            </div>
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Bước {currentStep + 1}/{steps.length}</span>
          </div>
          <button onClick={handleSkip} className="text-gray-400 hover:text-gray-600 p-1">
            <X size={20} />
          </button>
        </div>

        <h3 className="text-lg font-black text-gray-900 mb-2">{step.title}</h3>
        <p className="text-sm text-gray-500 font-medium leading-relaxed mb-6">
          {step.content}
        </p>

        <div className="flex items-center justify-between">
          <button 
            onClick={handlePrev}
            disabled={currentStep === 0}
            className={`p-2 rounded-xl transition-colors ${currentStep === 0 ? 'text-gray-200' : 'text-gray-400 hover:bg-gray-100'}`}
          >
            <ChevronLeft size={24} />
          </button>
          
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all ${i === currentStep ? 'w-6 bg-indigo-600' : 'w-1.5 bg-gray-200'}`} 
              />
            ))}
          </div>

          <button 
            onClick={handleNext}
            className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
          >
            {currentStep === steps.length - 1 ? <CheckCircle2 size={24} /> : <ChevronRight size={24} />}
          </button>
        </div>

        {currentStep === steps.length - 1 && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[10px] font-bold text-indigo-600 text-center mt-4 uppercase tracking-widest"
          >
            Tuyệt vời! Bạn đã sẵn sàng khám phá.
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}

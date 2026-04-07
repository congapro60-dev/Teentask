import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Award, CheckCircle2, Star, Zap, Trophy, ArrowLeft, ChevronRight, Clock, Target, Gift, MessageSquare, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFirebase, db } from './FirebaseProvider';
import { doc, updateDoc, increment, arrayUnion, addDoc, collection } from 'firebase/firestore';
import { cn } from '../lib/utils';

interface Task {
  id: string;
  title: string;
  desc: string;
  reward: number;
  type: 'daily' | 'achievement';
  status: 'available' | 'completed' | 'claimed';
  progress?: { current: number; total: number };
  path: string;
  icon: any;
}

export default function Tasks() {
  const navigate = useNavigate();
  const { profile } = useFirebase();
  const [activeTab, setActiveTab] = useState<'daily' | 'achievement'>('daily');
  const [claiming, setClaiming] = useState<string | null>(null);

  const tasks: Task[] = [
    { 
      id: 'daily-1', 
      title: 'Điểm danh hàng ngày', 
      desc: 'Đăng nhập vào ứng dụng mỗi ngày để nhận thưởng', 
      reward: 10, 
      type: 'daily', 
      status: profile?.lastCheckIn === new Date().toDateString() ? 'claimed' : 'completed',
      path: '/',
      icon: Clock
    },
    { 
      id: 'daily-2', 
      title: 'Khám phá việc làm', 
      desc: 'Xem ít nhất 5 tin tuyển dụng mới trong ngày', 
      reward: 20, 
      type: 'daily', 
      status: 'available',
      path: '/jobs',
      icon: Zap
    },
    { 
      id: 'daily-3', 
      title: 'Chia sẻ dự án', 
      desc: 'Chia sẻ thông tin dự án TeenTask lên mạng xã hội', 
      reward: 50, 
      type: 'daily', 
      status: 'available',
      path: '/about',
      icon: Target
    },
    { 
      id: 'daily-4', 
      title: 'Tham gia khảo sát', 
      desc: 'Hoàn thành khảo sát đóng góp ý kiến cho dự án', 
      reward: 100, 
      type: 'daily', 
      status: 'available',
      path: '/survey',
      icon: MessageSquare
    },
    { 
      id: 'daily-5', 
      title: 'Tìm hiểu phần mềm', 
      desc: 'Đọc hướng dẫn sử dụng các tính năng chính', 
      reward: 30, 
      type: 'daily', 
      status: 'available',
      path: '/about',
      icon: Info
    },
    { 
      id: 'ach-1', 
      title: 'Người mới năng nổ', 
      desc: 'Hoàn thành hồ sơ cá nhân đạt 100%', 
      reward: 100, 
      type: 'achievement', 
      status: profile?.bio ? 'completed' : 'available',
      progress: { current: profile?.bio ? 100 : 50, total: 100 },
      path: '/profile',
      icon: Trophy
    },
    { 
      id: 'ach-2', 
      title: 'Chiến binh kiến tập', 
      desc: 'Hoàn thành 3 khóa kiến tập cao cấp', 
      reward: 200, 
      type: 'achievement', 
      status: 'available', 
      progress: { current: 1, total: 3 },
      path: '/shadowing',
      icon: Award
    },
    { 
      id: 'ach-3', 
      title: 'Người dùng tích cực', 
      desc: 'Nhận 10 đánh giá 5 sao từ doanh nghiệp', 
      reward: 500, 
      type: 'achievement', 
      status: 'available', 
      progress: { current: 4, total: 10 },
      path: '/jobs',
      icon: Star
    },
  ];

  const filteredTasks = tasks.filter(t => t.type === activeTab);

  const handleClaimReward = async (task: Task) => {
    if (!profile || claiming) return;
    setClaiming(task.id);
    try {
      const userRef = doc(db, 'users', profile.uid);
      const updates: any = {
        trustScore: increment(task.reward),
        claimedTasks: arrayUnion(task.id)
      };

      if (task.id === 'daily-1') {
        updates.lastCheckIn = new Date().toDateString();
      }

      await updateDoc(userRef, updates);

      await addDoc(collection(db, 'notifications'), {
        userId: profile.uid,
        title: 'Nhận thưởng thành công',
        message: `Bạn đã nhận được ${task.reward} điểm từ nhiệm vụ: ${task.title}`,
        type: 'reward',
        read: false,
        createdAt: Date.now()
      });
    } catch (error) {
      console.error("Error claiming reward:", error);
    } finally {
      setClaiming(null);
    }
  };

  const handlePerformTask = (task: Task) => {
    navigate(task.path);
  };

  const getUserLevelInfo = (score: number) => {
    if (score < 100) return { title: 'Tân binh', min: 0, max: 100 };
    if (score < 300) return { title: 'Thực tập sinh', min: 100, max: 300 };
    if (score < 600) return { title: 'Nhân viên', min: 300, max: 600 };
    if (score < 1000) return { title: 'Chuyên gia', min: 600, max: 1000 };
    return { title: 'Bậc thầy', min: 1000, max: 2000 };
  };

  const score = profile?.trustScore ?? 0;
  const levelInfo = getUserLevelInfo(score);
  const progressPercent = Math.min(100, Math.max(0, ((score - levelInfo.min) / (levelInfo.max - levelInfo.min)) * 100));

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft size={24} className="text-slate-600" />
          </button>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Nhiệm vụ</h1>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-full border border-amber-100">
          <Star size={14} className="text-amber-500" fill="currentColor" />
          <span className="text-xs font-black text-amber-600">{score}</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-6 space-y-8">
        {/* Progress Overview */}
        <div className="bg-slate-900 rounded-[40px] p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center">
                <Trophy size={20} className="text-amber-400" />
              </div>
              <div>
                <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">Cấp độ hiện tại</p>
                <h2 className="text-lg font-black tracking-tight">{levelInfo.title}</h2>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-white/60">Tiến trình cấp độ ({score}/{levelInfo.max})</span>
                <span>{Math.round(progressPercent)}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  className="h-full bg-gradient-to-r from-amber-400 to-orange-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-slate-100 rounded-2xl">
          {(['daily', 'achievement'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                activeTab === tab 
                  ? "bg-white text-slate-900 shadow-sm" 
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              {tab === 'daily' ? 'Hàng ngày' : 'Thành tựu'}
            </button>
          ))}
        </div>

        {/* Task List */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredTasks.map((task, i) => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  "bg-white p-5 rounded-[32px] border transition-all flex items-center gap-4",
                  task.status === 'claimed' ? "opacity-60 grayscale" : "border-slate-100 hover:shadow-xl hover:shadow-slate-200/50"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0",
                  task.status === 'claimed' ? "bg-slate-100 text-slate-400" : "bg-blue-50 text-blue-500"
                )}>
                  <task.icon size={24} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-bold text-slate-900 truncate">{task.title}</h4>
                    <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">
                      +{task.reward}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium line-clamp-1">{task.desc}</p>
                  
                  {task.progress && (
                    <div className="mt-2 space-y-1">
                      <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500" 
                          style={{ width: `${(task.progress.current / task.progress.total) * 100}%` }}
                        />
                      </div>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                        {task.progress.current} / {task.progress.total} Hoàn thành
                      </p>
                    </div>
                  )}
                </div>

                <button
                  disabled={task.status === 'claimed' || claiming === task.id}
                  onClick={() => task.status === 'completed' ? handleClaimReward(task) : handlePerformTask(task)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    task.status === 'available' ? "bg-slate-900 text-white hover:bg-slate-800" :
                    task.status === 'completed' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-100" :
                    "bg-slate-100 text-slate-400"
                  )}
                >
                  {claiming === task.id ? 'Đang xử lý...' : 
                   task.status === 'available' ? 'Thực hiện' :
                   task.status === 'completed' ? 'Nhận quà' :
                   'Đã nhận'}
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Footer Info */}
        <div className="text-center space-y-2">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Làm mới sau 12:00:00</p>
          <div className="flex items-center justify-center gap-1 text-blue-500 text-xs font-bold cursor-pointer hover:underline">
            <Target size={14} />
            Xem bảng xếp hạng tuần
          </div>
        </div>
      </div>
    </div>
  );
}

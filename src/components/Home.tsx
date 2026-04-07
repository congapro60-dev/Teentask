import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Bell, TrendingUp, Star, Zap, Clock, CheckCircle2, ChevronRight, ChevronLeft, Briefcase, GraduationCap, Building2, Users, Award, Rocket, Sparkles, MessageSquare, Heart } from 'lucide-react';
import { useFirebase } from './FirebaseProvider';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, limit, addDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from './FirebaseProvider';
import { cn } from '../lib/utils';
import { Advertisement, Job, ShadowingEvent } from '../types';
import JobDetail from './JobDetail';
import ShadowingDetail from './ShadowingDetail';
import { MOCK_JOBS, MOCK_SHADOWING } from '../mockData';
import ParentVerificationModal from './ParentVerificationModal';

export default function Home() {
  const { profile, toggleSaveJob, toggleSaveShadowing } = useFirebase();
  const navigate = useNavigate();
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [shadowingEvents, setShadowingEvents] = useState<ShadowingEvent[]>([]);
  
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [isJobDetailOpen, setIsJobDetailOpen] = useState(false);
  const [selectedShadowing, setSelectedShadowing] = useState<any>(null);
  const [isShadowingDetailOpen, setIsShadowingDetailOpen] = useState(false);
  const [isParentModalOpen, setIsParentModalOpen] = useState(false);

  useEffect(() => {
    const qAds = query(collection(db, 'advertisements'), where('status', '==', 'approved'), limit(10));
    const unsubAds = onSnapshot(qAds, (snapshot) => {
      setAds(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Advertisement)));
    }, (error) => console.error("Ads listener error:", error));

    const qJobs = query(collection(db, 'jobs'), where('status', '==', 'active'), limit(10));
    const unsubJobs = onSnapshot(qJobs, (snapshot) => {
      setJobs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job)));
    }, (error) => console.error("Jobs listener error:", error));

    const qShadowing = query(collection(db, 'shadowing_events'), limit(10));
    const unsubShadowing = onSnapshot(qShadowing, (snapshot) => {
      if (!snapshot.empty) {
        setShadowingEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
      } else {
        setShadowingEvents(MOCK_SHADOWING as any);
      }
    }, (error) => {
      console.error("Shadowing listener error:", error);
      // Silent fallback for guests or permission issues
      setShadowingEvents(MOCK_SHADOWING as any);
    });

    return () => {
      unsubAds();
      unsubJobs();
      unsubShadowing();
    };
  }, []);

  const handleJobClick = (job: any) => {
    // Ensure job has all fields needed for detail view
    const fullJob = {
      ...job,
      company: job.companyName || job.company,
      logo: job.businessLogo || job.logo,
      jobStatus: job.status === 'active' ? 'Active' : (job.jobStatus || 'Active'),
      responsibilities: job.responsibilities || [job.description],
      qualifications: job.qualifications || [],
      benefits: job.benefits || []
    };
    setSelectedJob(fullJob);
    setIsJobDetailOpen(true);
  };

  const handleShadowingClick = (event: any) => {
    setSelectedShadowing(event);
    setIsShadowingDetailOpen(true);
  };

  const handleApplyJob = async (job: any) => {
    if (!profile) {
      navigate('/profile');
      return;
    }

    if (profile.role === 'student' && profile.parentEmail && profile.parentalVerification !== 'verified') {
      setIsParentModalOpen(true);
      return;
    }

    try {
      await addDoc(collection(db, 'applications'), {
        jobId: job.id,
        businessId: job.businessId,
        studentId: auth.currentUser?.uid,
        studentName: profile.displayName,
        studentPhoto: profile.photoURL,
        parentEmail: profile.parentEmail || null,
        parentStatus: profile.parentEmail ? 'pending' : 'approved',
        finalStatus: 'pending',
        createdAt: Date.now()
      });
      alert('Ứng tuyển thành công!');
      setIsJobDetailOpen(false);
    } catch (error) {
      console.error("Error applying:", error);
    }
  };

  const handleChat = async (item: any, type: 'job' | 'shadowing') => {
    if (!auth.currentUser) {
      navigate('/profile');
      return;
    }

    const businessId = type === 'job' ? item.businessId : item.mentorId;
    const participants = [auth.currentUser.uid, businessId].sort();
    const chatId = participants.join('_');

    try {
      const chatRef = doc(db, 'chats', chatId);
      const chatDoc = await getDoc(chatRef);

      if (!chatDoc.exists()) {
        await setDoc(chatRef, {
          id: chatId,
          participants,
          participantDetails: {
            [auth.currentUser.uid]: {
              displayName: profile?.displayName || 'Học sinh',
              photoURL: profile?.photoURL,
              role: profile?.role || 'student'
            },
            [businessId]: {
              displayName: type === 'job' ? item.businessName : item.mentorName,
              photoURL: type === 'job' ? item.businessLogo : (item.mentorPhoto || `https://i.pravatar.cc/100?u=${item.mentorId}`),
              role: 'business'
            }
          },
          relatedTo: {
            type,
            id: item.id,
            title: item.title
          },
          createdAt: Date.now(),
          lastMessageAt: Date.now()
        });
      }

      navigate(`/messages/${chatId}`);
    } catch (error) {
      console.error("Error starting chat:", error);
    }
  };

  const CarouselSection = ({ title, icon: Icon, items, renderItem, viewAllPath }: any) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
      if (scrollRef.current) {
        const { scrollLeft, clientWidth } = scrollRef.current;
        const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
        scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
      }
    };

    return (
      <section className="py-6 border-b border-gray-100 bg-white mb-4">
        <div className="px-4 sm:px-6 flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-[#1877F2]">
              <Icon size={18} />
            </div>
            <h2 className="text-lg font-black text-gray-900 tracking-tight">{title}</h2>
          </div>
          <button 
            onClick={() => navigate(viewAllPath)}
            className="text-[#1877F2] text-xs font-bold hover:underline flex items-center gap-1"
          >
            Xem tất cả <ChevronRight size={14} />
          </button>
        </div>
        
        <div className="relative group">
          <button 
            onClick={() => scroll('left')}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 backdrop-blur shadow-lg rounded-full flex items-center justify-center text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex"
          >
            <ChevronLeft size={20} />
          </button>
          
          <div 
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto px-4 sm:px-6 no-scrollbar snap-x snap-mandatory"
          >
            {items.map((item: any, index: number) => (
              <div key={item.id || index} className="snap-start">
                {renderItem(item)}
              </div>
            ))}
          </div>

          <button 
            onClick={() => scroll('right')}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 backdrop-blur shadow-lg rounded-full flex items-center justify-center text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </section>
    );
  };

  const getUserLevel = (score: number) => {
    if (score < 100) return { title: 'Tân binh', color: 'bg-gray-100 text-gray-600 border-gray-200' };
    if (score < 300) return { title: 'Thực tập sinh', color: 'bg-blue-50 text-[#1877F2] border-blue-200' };
    if (score < 600) return { title: 'Nhân viên', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' };
    if (score < 1000) return { title: 'Chuyên gia', color: 'bg-purple-50 text-purple-600 border-purple-200' };
    return { title: 'Bậc thầy', color: 'bg-amber-50 text-amber-600 border-amber-200' };
  };

  return (
    <div className="pb-20">
      {/* Guest Welcome Hero */}
      {!profile && (
        <section className="px-4 sm:px-6 py-12 bg-gradient-to-br from-[#1877F2] via-[#4F46E5] to-[#7C3AED] mb-6 relative overflow-hidden rounded-b-[64px] shadow-2xl shadow-blue-100">
          <div className="relative z-10 max-w-2xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 mb-6">
                <Sparkles size={14} className="text-amber-300" />
                <span className="text-white text-[10px] font-black uppercase tracking-[0.2em]">Khám phá tương lai của bạn</span>
              </div>
              
              <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tighter mb-6 leading-[1.1]">
                Nơi khởi đầu <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-400">sự nghiệp</span> cho Gen Z
              </h1>
              
              <p className="text-white/80 text-base sm:text-lg mb-10 leading-relaxed max-w-lg mx-auto font-medium">
                TeenTask kết nối hàng ngàn học sinh với các cơ hội việc làm và kiến tập thực tế từ những doanh nghiệp hàng đầu.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button 
                  onClick={() => navigate('/profile')}
                  className="w-full sm:w-auto px-10 py-5 bg-white text-[#1877F2] rounded-[24px] font-black uppercase tracking-widest text-sm shadow-[0_20px_40px_-12px_rgba(255,255,255,0.3)] hover:scale-105 transition-all active:scale-95 flex items-center justify-center gap-3 group"
                >
                  Đăng nhập ngay
                  <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <button 
                  onClick={() => navigate('/about')}
                  className="w-full sm:w-auto px-10 py-5 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-[24px] font-black uppercase tracking-widest text-sm hover:bg-white/20 transition-all"
                >
                  Tìm hiểu thêm
                </button>
              </div>
            </motion.div>
          </div>
          
          {/* Decorative Elements */}
          <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-white/10 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] left-[-5%] w-64 h-64 bg-blue-400/20 rounded-full blur-[100px]"></div>
          
          {/* Floating Icons */}
          <motion.div 
            animate={{ y: [0, -20, 0], rotate: [12, 15, 12] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute right-10 top-20 hidden lg:block opacity-20"
          >
            <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 flex items-center justify-center">
              <Rocket size={40} className="text-white" />
            </div>
          </motion.div>
          
          <motion.div 
            animate={{ y: [0, 20, 0], rotate: [-12, -15, -12] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-10 bottom-20 hidden lg:block opacity-20"
          >
            <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 flex items-center justify-center">
              <Award size={32} className="text-white" />
            </div>
          </motion.div>
        </section>
      )}

      {/* Welcome & Quick Stats */}
      {profile && (
        <section className="px-4 sm:px-6 py-6 bg-white border-b border-gray-100 mb-4">
          <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
            <div className="flex-1 min-w-[200px]">
              <h2 className="text-xs text-gray-400 font-black uppercase tracking-[0.2em] mb-1">Chào buổi sáng,</h2>
              <h1 className="text-3xl font-black text-gray-900 tracking-tighter flex items-center gap-2 flex-wrap">
                <span className="truncate max-w-full">{profile?.displayName || 'TeenTasker'}</span>
                {profile?.isVip && <Star size={24} className="text-amber-500 shrink-0" fill="currentColor" />}
                <span className="text-[#1877F2] shrink-0">👋</span>
              </h1>
              {profile?.isVip && (
                <div className="mt-1 flex items-center gap-1 px-2 py-0.5 bg-amber-50 border border-amber-200 rounded-full text-amber-600 text-[8px] font-black uppercase tracking-widest w-fit">
                  <Star size={10} fill="currentColor" />
                  VIP Member
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Cấp độ</span>
                <div className={`px-3 py-1.5 rounded-xl border font-bold text-xs shadow-sm ${getUserLevel(profile.trustScore).color}`}>
                  {getUserLevel(profile.trustScore).title}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-blue-50 p-3 rounded-2xl border border-blue-100">
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-wider mb-1">Việc làm</p>
              <p className="text-xl font-black text-[#1877F2]">24</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-2xl border border-purple-100">
              <p className="text-[10px] font-black text-purple-400 uppercase tracking-wider mb-1">Kiến tập</p>
              <p className="text-xl font-black text-purple-600">12</p>
            </div>
            <div 
              onClick={() => navigate('/trust-score')}
              className="bg-amber-50 p-3 rounded-2xl border border-amber-100 cursor-pointer hover:bg-amber-100 transition-colors"
            >
              <p className="text-[10px] font-black text-amber-400 uppercase tracking-wider mb-1">Điểm</p>
              <p className="text-xl font-black text-amber-600">{profile?.trustScore ?? 0}</p>
            </div>
          </div>
        </section>
      )}

      {/* Quick Actions */}
      <section className="px-4 sm:px-6 mb-6">
        <div className="grid grid-cols-4 gap-4">
          {[
            { icon: Award, label: 'Nhiệm vụ', color: 'bg-amber-500', path: '/tasks' },
            { icon: Building2, label: 'Công ty', color: 'bg-blue-500', path: '/companies' },
            { icon: Star, label: 'VIP', color: 'bg-purple-500', path: '/vip' },
            { icon: Heart, label: 'Đã lưu', color: 'bg-red-500', path: '/saved' },
          ].map((action, i) => (
            <button 
              key={i}
              onClick={() => navigate(action.path)}
              className="flex flex-col items-center gap-2 group"
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110 group-active:scale-95 ${action.color}`}>
                <action.icon size={24} />
              </div>
              <span className="text-[10px] font-bold text-gray-600">{action.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Featured News Carousel */}
      <CarouselSection 
        title="Tin tức nổi bật" 
        icon={Zap}
        items={[
          { id: 'news-info', title: 'Thông tin dự án & Hướng dẫn sử dụng', image: 'https://picsum.photos/seed/project/400/250', date: 'Mới nhất', path: '/about' },
          { id: 'news-survey', title: 'Tham gia khảo sát dự án TeenTask', image: 'https://picsum.photos/seed/survey/400/250', date: 'Mới nhất', path: '/survey' },
          { id: 1, title: 'TeenTask ra mắt tính năng mới', image: 'https://picsum.photos/seed/news1/400/250', date: '2 giờ trước', path: '/news' },
          { id: 2, title: 'Top 10 công việc mùa hè cho học sinh', image: 'https://picsum.photos/seed/news2/400/250', date: '5 giờ trước', path: '/news' },
          { id: 3, title: 'Kỹ năng cần thiết trong kỷ nguyên AI', image: 'https://picsum.photos/seed/news3/400/250', date: '1 ngày trước', path: '/news' },
        ]}
        renderItem={(item: any) => (
          <div 
            onClick={() => navigate(item.path || '/news')}
            className="w-[280px] bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          >
            <img src={item.image} alt={item.title} className="w-full h-40 object-cover" referrerPolicy="no-referrer" />
            <div className="p-4">
              <span className="text-[10px] font-bold text-[#1877F2] uppercase tracking-wider">{item.date}</span>
              <h4 className="font-bold text-gray-900 mt-1 line-clamp-2">{item.title}</h4>
            </div>
          </div>
        )}
        viewAllPath="/news"
      />

      {/* Sponsored Ads Carousel */}
      <CarouselSection 
        title="Quảng cáo tài trợ" 
        icon={Star}
        items={ads.length >= 5 ? ads : [
          { id: 'd1', title: 'Khóa học IELTS cấp tốc', businessName: 'British Council', imageUrl: 'https://picsum.photos/seed/ad1/400/250' },
          { id: 'd2', title: 'Ưu đãi trà sữa 50%', businessName: 'Gong Cha', imageUrl: 'https://picsum.photos/seed/ad2/400/250' },
          { id: 'd3', title: 'Giảm giá 30% khóa học lập trình', businessName: 'FPT Academy', imageUrl: 'https://picsum.photos/seed/ad3/400/250' },
          { id: 'd4', title: 'Vé xem phim cuối tuần 1k', businessName: 'CGV Cinemas', imageUrl: 'https://picsum.photos/seed/ad4/400/250' },
          { id: 'd5', title: 'Tặng voucher 100k mua sách', businessName: 'Fahasa', imageUrl: 'https://picsum.photos/seed/ad5/400/250' },
        ]}
        renderItem={(ad: any) => (
          <div className="w-[320px] relative rounded-3xl overflow-hidden aspect-[16/9] shadow-lg group">
            <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-5 flex flex-col justify-end">
              <span className="w-fit px-2 py-1 bg-amber-400 text-white text-[8px] font-black uppercase rounded-md mb-2">Tài trợ</span>
              <h4 className="text-white font-bold text-lg line-clamp-1">{ad.title}</h4>
              <p className="text-white/70 text-xs">{ad.businessName}</p>
            </div>
          </div>
        )}
        viewAllPath="/ads"
      />

      {/* Jobs Carousel */}
      <CarouselSection 
        title="Việc làm mới nhất" 
        icon={Briefcase}
        items={jobs.length > 0 ? jobs : MOCK_JOBS}
        renderItem={(job: any) => {
          const isSaved = profile?.savedJobs?.includes(job.id);
          return (
            <div 
              onClick={() => handleJobClick(job)}
              className="w-[240px] p-5 bg-white border border-gray-100 rounded-3xl shadow-sm hover:border-[#1877F2] transition-all relative group cursor-pointer hover:shadow-md"
            >
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSaveJob(job.id);
                }}
                className={cn(
                  "absolute top-4 right-4 p-2 rounded-full transition-all z-10",
                  isSaved ? "bg-red-50 text-red-500" : "bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500"
                )}
              >
                <Heart size={16} fill={isSaved ? "currentColor" : "none"} />
              </button>
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-[#1877F2] mb-4">
                {job.businessLogo || job.logo ? (
                  <img src={job.businessLogo || job.logo} alt={job.businessName || job.company} className="w-full h-full object-cover rounded-2xl" referrerPolicy="no-referrer" />
                ) : (
                  <Briefcase size={24} />
                )}
              </div>
              <h4 className="font-bold text-gray-900 line-clamp-1 mb-1">{job.title}</h4>
              <p className="text-xs text-gray-500 mb-4">{job.businessName || job.company}</p>
              <div className="flex justify-between items-center">
                <span className="text-sm font-black text-[#1877F2]">{typeof job.salary === 'number' ? `${job.salary.toLocaleString('vi-VN')}đ` : job.salary}</span>
                <span className="text-[10px] font-bold text-gray-400">{job.location}</span>
              </div>
            </div>
          );
        }}
        viewAllPath="/jobs"
      />

      {/* Shadowing Carousel */}
      <CarouselSection 
        title="Kiến tập cao cấp" 
        icon={GraduationCap}
        items={shadowingEvents.length > 0 ? shadowingEvents : MOCK_SHADOWING}
        renderItem={(item: any) => {
          const isSaved = profile?.savedShadowing?.includes(item.id.toString());
          return (
            <div 
              onClick={() => handleShadowingClick(item)}
              className="w-[280px] relative rounded-3xl overflow-hidden aspect-[4/3] shadow-md group cursor-pointer hover:shadow-xl transition-all"
            >
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSaveShadowing(item.id.toString());
                }}
                className={cn(
                  "absolute top-4 right-4 p-2 rounded-full transition-all z-10",
                  isSaved ? "bg-red-500 text-white" : "bg-white/20 backdrop-blur-md text-white hover:bg-red-500"
                )}
              >
                <Heart size={16} fill={isSaved ? "currentColor" : "none"} />
              </button>
              <img src={item.imageUrl || item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-5 flex flex-col justify-end">
                <h4 className="text-white font-bold text-lg leading-tight mb-2">{item.title}</h4>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-md overflow-hidden">
                    <img src={item.mentorPhoto || `https://i.pravatar.cc/100?u=${item.mentorId || item.mentor}`} alt={item.mentorName || item.mentor} referrerPolicy="no-referrer" />
                  </div>
                  <p className="text-white/80 text-[10px] font-medium">{item.mentorName || item.mentor} @ {item.companyName || item.company}</p>
                </div>
              </div>
            </div>
          );
        }}
        viewAllPath="/shadowing"
      />

      {/* Businesses Carousel */}
      <CarouselSection 
        title="Doanh nghiệp tiêu biểu" 
        icon={Building2}
        items={[
          { id: 1, name: 'FPT Software', logo: 'https://picsum.photos/seed/fpt/100/100', jobs: 15 },
          { id: 2, name: 'Vinamilk', logo: 'https://picsum.photos/seed/vinamilk/100/100', jobs: 8 },
          { id: 3, name: 'Viettel', logo: 'https://picsum.photos/seed/viettel/100/100', jobs: 12 },
          { id: 4, name: 'Grab', logo: 'https://picsum.photos/seed/grab/100/100', jobs: 20 },
          { id: 5, name: 'Shopee', logo: 'https://picsum.photos/seed/shopee/100/100', jobs: 25 },
        ]}
        renderItem={(item: any) => (
          <div className="w-[140px] p-4 bg-white border border-gray-100 rounded-3xl text-center shadow-sm hover:shadow-md transition-all">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl mx-auto mb-3 overflow-hidden border border-gray-50">
              <img src={item.logo} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <h4 className="font-bold text-gray-900 text-xs mb-1 line-clamp-1">{item.name}</h4>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{item.jobs} công việc</p>
          </div>
        )}
        viewAllPath="/companies"
      />

      {/* TopCV Section */}
      <section className="px-4 sm:px-6 py-6 bg-white border-b border-gray-100 mb-4">
        <div className="bg-gradient-to-br from-[#1877F2] to-[#4F46E5] rounded-[32px] p-6 text-white relative overflow-hidden shadow-xl shadow-blue-100">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <Award className="text-amber-400" size={24} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">TeenTask TopCV</span>
            </div>
            <h3 className="text-2xl font-black mb-2 tracking-tight">Tạo CV chuyên nghiệp trong 5 phút</h3>
            <p className="text-white/80 text-xs mb-6 max-w-[200px]">Mẫu CV được thiết kế riêng cho học sinh, sinh viên.</p>
            <button 
              onClick={() => navigate('/cv-builder')}
              className="bg-white text-[#1877F2] px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-transform active:scale-95"
            >
              Tạo CV ngay
            </button>
          </div>
          <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-10%] left-[-5%] w-20 h-20 bg-white/10 rounded-full blur-2xl"></div>
        </div>
      </section>

      {/* Business Owners Carousel */}
      <CarouselSection 
        title="Chủ doanh nghiệp" 
        icon={Users}
        items={[
          { id: 1, name: 'Shark Hưng', role: 'CEN Group', image: 'https://i.pravatar.cc/150?u=sharkhung' },
          { id: 2, name: 'Shark Liên', role: 'Green Insurance', image: 'https://i.pravatar.cc/150?u=sharklien' },
          { id: 3, name: 'Shark Bình', role: 'NextTech', image: 'https://i.pravatar.cc/150?u=sharkbinh' },
          { id: 4, name: 'Shark Linh', role: 'VinaCapital', image: 'https://i.pravatar.cc/150?u=sharklinh' },
          { id: 5, name: 'Shark Phú', role: 'Sunhouse', image: 'https://i.pravatar.cc/150?u=sharkphu' },
        ]}
        renderItem={(item: any) => (
          <div className="w-[160px] text-center">
            <div className="w-24 h-24 rounded-full mx-auto mb-3 p-1 bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg">
              <div className="w-full h-full rounded-full bg-white p-1">
                <img src={item.image} alt={item.name} className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
              </div>
            </div>
            <h4 className="font-bold text-gray-900 text-sm">{item.name}</h4>
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{item.role}</p>
          </div>
        )}
        viewAllPath="/mentors"
      />

      {/* New Section: Trending Skills */}
      <section className="px-4 sm:px-6 py-6 bg-white border-b border-gray-100 mb-4">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center text-orange-500">
            <Rocket size={18} />
          </div>
          <h2 className="text-lg font-black text-gray-900 tracking-tight">Kỹ năng đang hot</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {['Thiết kế Canva', 'Video Editing', 'Content Writing', 'Public Speaking', 'Data Entry', 'Social Media', 'Python Basic', 'UI/UX Design', 'Digital Marketing'].map((skill, i) => (
            <div key={i} className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-600 hover:border-[#1877F2] hover:text-[#1877F2] transition-all cursor-pointer">
              {skill}
            </div>
          ))}
        </div>
      </section>

      {/* New Section: Success Stories */}
      <section className="px-4 sm:px-6 py-6 bg-white mb-4">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-pink-50 rounded-lg flex items-center justify-center text-pink-500">
            <Sparkles size={18} />
          </div>
          <h2 className="text-lg font-black text-gray-900 tracking-tight">Câu chuyện thành công</h2>
        </div>
        <div className="space-y-4">
          <div className="bg-pink-50/50 rounded-[32px] p-6 border border-pink-100">
            <div className="flex items-center gap-4 mb-4">
              <img src="https://i.pravatar.cc/100?u=success1" alt="student" className="w-12 h-12 rounded-2xl object-cover shadow-md" referrerPolicy="no-referrer" />
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Minh Anh, 17 tuổi</h4>
                <p className="text-[10px] text-pink-600 font-black uppercase tracking-wider">Học sinh THPT Phan Đình Phùng</p>
              </div>
            </div>
            <p className="text-xs text-gray-600 italic leading-relaxed">
              "Nhờ TeenTask, mình đã tìm được công việc kiến tập tại một Agency Marketing. Trải nghiệm thực tế giúp mình định hướng nghề nghiệp rõ ràng hơn rất nhiều!"
            </p>
          </div>
          <div className="bg-blue-50/50 rounded-[32px] p-6 border border-blue-100">
            <div className="flex items-center gap-4 mb-4">
              <img src="https://i.pravatar.cc/100?u=success2" alt="student" className="w-12 h-12 rounded-2xl object-cover shadow-md" referrerPolicy="no-referrer" />
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Đức Huy, 16 tuổi</h4>
                <p className="text-[10px] text-blue-600 font-black uppercase tracking-wider">Học sinh THPT Chu Văn An</p>
              </div>
            </div>
            <p className="text-xs text-gray-600 italic leading-relaxed">
              "Mình đã kiếm được thu nhập đầu tiên từ việc thiết kế Canva cho một shop quần áo. Cảm ơn TeenTask đã kết nối mình với những cơ hội tuyệt vời."
            </p>
          </div>
        </div>
      </section>

      <JobDetail 
        job={selectedJob}
        isOpen={isJobDetailOpen}
        onClose={() => setIsJobDetailOpen(false)}
        onApply={handleApplyJob}
        onChat={(job) => handleChat(job, 'job')}
        isSaved={profile?.savedJobs?.includes(selectedJob?.id)}
        onToggleSave={(e) => {
          e.stopPropagation();
          toggleSaveJob(selectedJob.id);
        }}
      />

      <ShadowingDetail 
        event={selectedShadowing}
        isOpen={isShadowingDetailOpen}
        onClose={() => setIsShadowingDetailOpen(false)}
        onChat={(event) => handleChat(event, 'shadowing')}
      />

      <ParentVerificationModal 
        isOpen={isParentModalOpen}
        onClose={() => setIsParentModalOpen(false)}
        onSuccess={() => setIsParentModalOpen(false)}
      />
    </div>
  );
}

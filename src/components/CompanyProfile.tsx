import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, MapPin, Globe, Mail, Phone, Star, ShieldCheck, Briefcase, User } from 'lucide-react';
import { collection, query, where, getDocs, doc, getDoc, orderBy, setDoc, onSnapshot } from 'firebase/firestore';
import { db, useFirebase } from './FirebaseProvider';
import { Job, Rating, UserProfile, Relationship } from '../types';

// Import MOCK_JOBS to display them for mock companies
const MOCK_JOBS = [
  {
    id: '1',
    businessId: 'business_1',
    businessName: 'The Coffee House',
    title: 'Thiết kế Poster Sự kiện',
    company: 'The Coffee House',
    location: 'Quận 1, TP.HCM',
    salary: '500.000đ',
    salaryValue: 500000,
    deadline: '2025-07-24',
    deadlineDisplay: '24/07',
    type: 'Online',
    tags: ['Design', 'Micro-task'],
    hot: true,
    logo: 'https://picsum.photos/seed/coffee/100/100',
    color: 'bg-orange-50 text-orange-600 border-orange-100',
    jobStatus: 'Active',
    status: 'active',
  },
  {
    id: '2',
    businessId: 'business_2',
    businessName: 'Kênh 14',
    title: 'Cộng tác viên Viết bài',
    company: 'Kênh 14',
    location: 'Toàn quốc',
    salary: '200.000đ/bài',
    salaryValue: 200000,
    deadline: '2025-07-30',
    deadlineDisplay: '30/07',
    type: 'Online',
    tags: ['Content', 'Writing'],
    hot: false,
    logo: 'https://picsum.photos/seed/news/100/100',
    color: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    jobStatus: 'Closed',
    status: 'closed',
  },
  {
    id: '3',
    businessId: 'business_3',
    businessName: 'FPT Software',
    title: 'Hỗ trợ Sự kiện Workshop',
    company: 'FPT Software',
    location: 'Quận 9, TP.HCM',
    salary: '300.000đ/buổi',
    salaryValue: 300000,
    deadline: '2025-08-15',
    deadlineDisplay: '15/08',
    type: 'Offline',
    tags: ['Event', 'Support'],
    hot: false,
    logo: 'https://picsum.photos/seed/fpt/100/100',
    color: 'bg-blue-50 text-blue-600 border-blue-100',
    jobStatus: 'Expired',
    status: 'closed',
  },
];

export default function CompanyProfile() {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();
  const { profile: currentUserProfile, toggleFollowUser, createChat } = useFirebase();
  const [activeTab, setActiveTab] = useState<'jobs' | 'reviews' | 'about'>('jobs');
  const [loading, setLoading] = useState(true);
  const [companyInfo, setCompanyInfo] = useState<UserProfile | null>(null);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [relationships, setRelationships] = useState<Relationship[]>([]);

  const isFollowing = currentUserProfile?.following?.includes(businessId || '');

  const handleFollowAction = async () => {
    if (!businessId) return;
    try {
      await toggleFollowUser(businessId);
    } catch (error) {
      console.error("Error follow action:", error);
    }
  };

  const handleMessage = async () => {
    if (!companyInfo) return;
    try {
      const chatId = await createChat(businessId!, {
        displayName: companyInfo.displayName,
        photoURL: companyInfo.photoURL,
        role: companyInfo.role
      });
      navigate(`/messages/${chatId}`);
    } catch (error) {
      console.error("Error starting chat:", error);
    }
  };

  const BOSS_EMAIL = "congapro60@gmail.com";
  const isCurrentUserBoss = currentUserProfile?.email === BOSS_EMAIL;

  const toggleAdminRole = async () => {
    if (!businessId || !companyInfo) return;
    setIsUpdatingRole(true);
    try {
      const newRole = companyInfo.role === 'admin' ? 'business' : 'admin';
      await setDoc(doc(db, 'users', businessId), { 
        role: newRole,
        isVip: newRole === 'admin' ? true : companyInfo.isVip 
      }, { merge: true });
      setCompanyInfo(prev => prev ? { ...prev, role: newRole, isVip: newRole === 'admin' ? true : prev.isVip } : null);
      alert(newRole === 'admin' ? 'Đã bổ nhiệm làm Quản trị viên' : 'Đã gỡ quyền Quản trị viên');
    } catch (error) {
      console.error("Error updating role:", error);
      alert('Có lỗi xảy ra khi cập nhật vai trò.');
    } finally {
      setIsUpdatingRole(false);
    }
  };
  const [companyJobs, setCompanyJobs] = useState<Job[]>([]);
  const [companyReviews, setCompanyReviews] = useState<Rating[]>([]);
  const [averageRating, setAverageRating] = useState<number>(0);

  // Mock reviews for demonstration
  const mockReviews = [
    { id: 'm1', studentName: 'Nguyễn Văn A', role: 'Thực tập sinh Design', rating: 5, comment: 'Môi trường làm việc rất năng động, các anh chị hướng dẫn nhiệt tình.', createdAt: Date.now() - 86400000 * 20 },
    { id: 'm2', studentName: 'Trần Thị B', role: 'Cộng tác viên Content', rating: 4, comment: 'Công việc linh hoạt, phù hợp với lịch học. Tuy nhiên đôi khi task hơi gấp.', createdAt: Date.now() - 86400000 * 50 },
  ];

  useEffect(() => {
    const fetchCompanyData = async () => {
      if (!businessId) return;
      setLoading(true);

      try {
        // Try to fetch business profile from users collection
        const userDoc = await getDoc(doc(db, 'users', businessId));
        let info = null;
        
        if (userDoc.exists()) {
          info = userDoc.data();
        }

        // Fetch jobs posted by this business
        const q = query(collection(db, 'jobs'), where('businessId', '==', businessId));
        const querySnapshot = await getDocs(q);
        const jobs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
        
        const mockJobs = MOCK_JOBS.filter(job => job.businessId === businessId) as any[];
        const allCompanyJobs = [...jobs, ...mockJobs];
        
        setCompanyJobs(allCompanyJobs);

        // Fetch real ratings
        const ratingsQuery = query(
          collection(db, 'ratings'), 
          where('toId', '==', businessId),
          orderBy('createdAt', 'desc')
        );
        const ratingsSnapshot = await getDocs(ratingsQuery);
        const fetchedRatings = ratingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Rating));
        setCompanyReviews(fetchedRatings);

        if (fetchedRatings.length > 0) {
          const avg = fetchedRatings.reduce((acc, r) => acc + r.score, 0) / fetchedRatings.length;
          setAverageRating(Number(avg.toFixed(1)));
        } else {
          setAverageRating(info?.trustScore ?? 0);
        }

        // If no user profile found, extract info from their first job posting
        if (!info && allCompanyJobs.length > 0) {
          info = {
            displayName: allCompanyJobs[0].businessName,
            photoURL: allCompanyJobs[0].businessLogo || allCompanyJobs[0].logo,
            role: 'business',
            trustScore: 4.8 // Mock score
          };
        }

        // Fetch confirmed relationships (Representatives)
        const qRels = query(
          collection(db, 'relationships'),
          where('relatedUserId', '==', businessId),
          where('status', '==', 'accepted'),
          where('type', '==', 'Professional')
        );
        const relSnap = await getDocs(qRels);
        setRelationships(relSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Relationship)));

        setCompanyInfo(info || {
          displayName: 'Doanh nghiệp ẩn danh',
          photoURL: 'https://picsum.photos/seed/business/200/200',
          trustScore: 0
        });

      } catch (error) {
        console.error("Error fetching company data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyData();
  }, [businessId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="w-12 h-12 border-4 border-[#4F46E5] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Cover & Header */}
      <div className="bg-white rounded-b-[40px] shadow-sm overflow-hidden">
        <div className="h-48 bg-gradient-to-r from-[#4F46E5] to-[#DB2777] relative">
          <button 
            onClick={() => navigate(-1)}
            className="absolute top-6 left-6 p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
        </div>
        
        <div className="px-6 pb-8 relative">
          <div className="flex justify-between items-end -mt-12 mb-4">
            <div className="w-24 h-24 bg-white rounded-3xl p-1 shadow-xl">
              <div className="w-full h-full rounded-[20px] overflow-hidden bg-gray-50">
                <img 
                  src={companyInfo?.photoURL || 'https://picsum.photos/seed/business/200/200'} 
                  alt={companyInfo?.displayName} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleMessage}
                className="px-4 py-2.5 bg-white border-2 border-gray-100 text-gray-700 text-sm font-bold rounded-full hover:bg-gray-50 transition-all"
              >
                Nhắn tin
              </button>
              <button 
                onClick={handleFollowAction}
                className={`px-6 py-2.5 text-sm font-bold rounded-full shadow-lg transition-all ${
                  isFollowing 
                  ? 'bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-none' 
                  : 'bg-[#4F46E5] text-white shadow-indigo-200'
                }`}
              >
                {isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
              </button>
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2 flex-wrap">
              {companyInfo?.displayName}
              {companyInfo?.email === BOSS_EMAIL && <span className="bg-red-100 text-red-600 text-[10px] px-2 py-0.5 rounded-md font-black uppercase tracking-tighter">Boss</span>}
              {companyInfo?.role === 'admin' && companyInfo?.email !== BOSS_EMAIL && <span className="bg-indigo-100 text-indigo-600 text-[10px] px-2 py-0.5 rounded-md font-black uppercase tracking-tighter">Admin</span>}
              {companyInfo?.trustScore >= 4 && <ShieldCheck size={20} className="text-[#4F46E5]" />}
            </h1>
            <p className="text-sm text-gray-500 font-medium mt-1">Công ty Công nghệ • 50-100 nhân viên</p>
            
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-1 text-sm font-bold text-gray-700">
                <Star size={16} className="text-amber-400 fill-amber-400" />
                {averageRating}
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <MapPin size={16} />
                TP. Hồ Chí Minh
              </div>
            </div>

            {isCurrentUserBoss && companyInfo?.email !== BOSS_EMAIL && (
              <div className="mt-6">
                <button 
                  onClick={toggleAdminRole}
                  disabled={isUpdatingRole}
                  className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-sm ${
                    companyInfo?.role === 'admin' 
                    ? 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'
                  }`}
                >
                  <ShieldCheck size={18} />
                  {isUpdatingRole ? 'Đang xử lý...' : (companyInfo?.role === 'admin' ? 'Gỡ quyền Admin' : 'Bổ nhiệm Admin')}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex px-6 border-t border-gray-100">
          {[
            { id: 'jobs', label: 'Tin tuyển dụng' },
            { id: 'reviews', label: 'Đánh giá' },
            { id: 'about', label: 'Giới thiệu' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-4 text-sm font-bold text-center border-b-2 transition-colors ${
                activeTab === tab.id 
                ? 'border-[#4F46E5] text-[#4F46E5]' 
                : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'jobs' && (
              <div className="space-y-4">
                {companyJobs.length > 0 ? (
                  companyJobs.map(job => (
                    <div key={job.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex gap-4 items-center">
                      <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-[#4F46E5]">
                        <Briefcase size={20} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900">{job.title}</h3>
                        <div className="flex gap-3 mt-1 text-xs text-gray-500">
                          <span>{job.type === 'online' ? 'Online' : 'Offline'}</span>
                          <span>•</span>
                          <span className="text-[#4F46E5] font-bold">{job.salary}</span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                        job.status === 'active' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-gray-50 text-gray-500 border-gray-100'
                      }`}>
                        {job.status === 'active' ? 'Đang tuyển' : 'Đã đóng'}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-8">Chưa có tin tuyển dụng nào.</p>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-4">
                {companyReviews.length > 0 ? (
                  companyReviews.map(review => (
                    <div key={review.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden">
                            <div className="w-full h-full flex items-center justify-center text-gray-400">👨‍🎓</div>
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900">{review.fromName}</h4>
                            <p className="text-xs text-gray-500">Đánh giá hệ thống</p>
                          </div>
                        </div>
                        <div className="flex text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={14} className={i < review.score ? 'fill-amber-400' : 'text-gray-200'} />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
                      <p className="text-xs text-gray-400 mt-3">{new Date(review.createdAt).toLocaleDateString('vi-VN')}</p>
                    </div>
                  ))
                ) : (
                  mockReviews.map(review => (
                    <div key={review.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm opacity-60">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-bold text-gray-900">{review.studentName}</h4>
                          <p className="text-xs text-gray-500">{review.role}</p>
                        </div>
                        <div className="flex text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={14} className={i < review.rating ? 'fill-amber-400' : 'text-gray-200'} />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
                      <p className="text-xs text-gray-400 mt-3">{new Date(review.createdAt).toLocaleDateString('vi-VN')}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'about' && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">Về chúng tôi</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {companyInfo?.displayName} là một trong những công ty hàng đầu trong lĩnh vực công nghệ và truyền thông. Chúng tôi luôn tìm kiếm những tài năng trẻ, đặc biệt là các bạn học sinh, sinh viên có đam mê và nhiệt huyết để cùng xây dựng những sản phẩm đột phá.
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <Globe size={18} className="text-gray-400" />
                      <a href="#" className="text-[#4F46E5] hover:underline">www.{companyInfo?.displayName?.toLowerCase().replace(/\s+/g, '')}.com</a>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <Mail size={18} className="text-gray-400" />
                      <span>contact@{companyInfo?.displayName?.toLowerCase().replace(/\s+/g, '')}.com</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <Phone size={18} className="text-gray-400" />
                      <span>0123 456 789</span>
                    </div>
                  </div>
                </div>

                {relationships.length > 0 && (
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <ShieldCheck size={18} className="text-indigo-600" />
                      Người đại diện đã xác thực
                    </h3>
                    <div className="space-y-3">
                      {relationships.map(rel => (
                        <div key={rel.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white overflow-hidden border border-gray-100">
                              {rel.userPhoto ? (
                                <img src={rel.userPhoto} alt={rel.userName} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                  <User size={20} />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900">{rel.userName}</p>
                              <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">{rel.title}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

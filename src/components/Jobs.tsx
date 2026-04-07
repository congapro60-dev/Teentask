import { Search, Filter, MapPin, Clock, DollarSign, Building2, Sparkles, Briefcase, MessageSquare, Heart, Bell, X, Zap, Check, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, addDoc, doc, getDoc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db, auth, useFirebase } from './FirebaseProvider';
import ParentVerificationModal from './ParentVerificationModal';
import JobDetail from './JobDetail';
import { PREDEFINED_SKILLS } from '../constants';

import { MOCK_JOBS } from '../mockData';

export default function Jobs() {
  const navigate = useNavigate();
  const { profile, toggleSaveJob } = useFirebase();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [selectedJobAppCount, setSelectedJobAppCount] = useState<number>(0);
  const [firestoreJobs, setFirestoreJobs] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  
  // Filter states
  const [jobType, setJobType] = useState<'All' | 'Online' | 'Offline'>('All');
  const [salaryRange, setSalaryRange] = useState<[number, number]>([0, 1000000]);
  const [deadlineFilter, setDeadlineFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  // Initialize skills from profile
  useEffect(() => {
    if (profile?.skills && selectedSkills.length === 0) {
      setSelectedSkills(profile.skills);
    }
  }, [profile?.skills]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const jobId = params.get('id');
    if (jobId && firestoreJobs.length > 0) {
      const job = firestoreJobs.find(j => j.id === jobId) || MOCK_JOBS.find(j => j.id === jobId);
      if (job) {
        setSelectedJob(job);
        setIsDetailOpen(true);
      }
    }
  }, [firestoreJobs, window.location.search]);

  useEffect(() => {
    // For guests and students, only show active jobs
    const q = query(collection(db, 'jobs'), where('status', '==', 'active'));
    let isInitialLoad = true;

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedJobs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          businessId: data.businessId,
          businessName: data.businessName,
          title: data.title,
          company: data.businessName,
          location: data.location,
          salary: data.salary,
          salaryValue: data.salaryValue,
          deadline: new Date(data.deadline).toISOString().split('T')[0],
          deadlineDisplay: new Date(data.deadline).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
          type: data.type === 'online' ? 'Online' : 'Offline',
          tags: data.tags || [],
          hot: false,
          logo: data.businessLogo,
          color: 'bg-indigo-50 text-indigo-600 border-indigo-100',
          jobStatus: data.status === 'active' ? 'Active' : 'Closed',
          responsibilities: [data.description],
          qualifications: [],
          benefits: []
        };
      });
      
      setFirestoreJobs(loadedJobs);

      if (isInitialLoad) {
        isInitialLoad = false;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          const newJob = loadedJobs.find(j => j.id === change.doc.id) || data;
          
          // Check preferences
          const userSkills = profile?.skills || ['Design', 'Content', 'Event', 'Writing'];
          const jobTags = data.tags || [];
          const jobCategory = data.category;
          
          const matches = jobTags.some((tag: string) => userSkills.includes(tag)) || userSkills.includes(jobCategory);
          
          if (matches && data.businessId !== auth.currentUser?.uid) {
            const notification = {
              id: Date.now().toString() + Math.random(),
              title: 'Việc làm mới phù hợp với bạn!',
              message: `${data.title} tại ${data.businessName}`,
              job: newJob
            };
            setNotifications(prev => [...prev, notification]);
            setTimeout(() => {
              setNotifications(prev => prev.filter(n => n.id !== notification.id));
            }, 5000);
          }
        }
      });
    }, (error) => {
      console.error("Error in jobs listener:", error);
    });

    return () => unsubscribe();
  }, [profile]);

  useEffect(() => {
    const fetchApplications = async () => {
      if (!auth.currentUser) return;
      const q = query(collection(db, 'applications'), where('studentId', '==', auth.currentUser.uid));
      const querySnapshot = await getDocs(q);
      const apps = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setApplications(apps);
    };

    fetchApplications();
  }, [profile]);

  const handleApply = (job: any) => {
    if (!auth.currentUser) {
      navigate('/profile');
      return;
    }
    setSelectedJob(job);
    setIsDetailOpen(false);
    setIsModalOpen(true);
  };

  const handleOpenDetail = async (job: any) => {
    setSelectedJob(job);
    setIsDetailOpen(true);
    
    // Fetch total application count for this job
    try {
      const q = query(collection(db, 'applications'), where('jobId', '==', job.id));
      const querySnapshot = await getDocs(q);
      setSelectedJobAppCount(querySnapshot.size);
    } catch (error) {
      console.error("Error fetching application count:", error);
    }
  };

  const handleToggleSave = async (e: React.MouseEvent, jobId: string) => {
    e.stopPropagation();
    if (!auth.currentUser) {
      navigate('/profile');
      return;
    }
    if (!profile) return;
    await toggleSaveJob(jobId);
  };

  const handleChat = async (job: any) => {
    if (!auth.currentUser) {
      navigate('/profile');
      return;
    }

    const participants = [auth.currentUser.uid, job.businessId].sort();
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
              displayName: auth.currentUser.displayName || 'Học sinh',
              photoURL: auth.currentUser.photoURL,
              role: 'student'
            },
            [job.businessId]: {
              displayName: job.businessName,
              photoURL: job.logo,
              role: 'business'
            }
          },
          relatedTo: {
            type: 'job',
            id: job.id,
            title: job.title
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

  const handleApplicationSuccess = async (guardianData: any) => {
    if (!auth.currentUser || !selectedJob) return;

    try {
      const newApp = {
        jobId: selectedJob.id,
        businessId: selectedJob.businessId,
        studentId: auth.currentUser.uid,
        studentName: profile?.displayName || auth.currentUser.displayName || 'Học sinh',
        studentPhoto: profile?.photoURL || '',
        studentEmail: profile?.email || auth.currentUser.email || '',
        studentPhone: profile?.idNumber || '', // Assuming idNumber is used for phone or similar in this context, or add a phone field
        studentSchool: profile?.school || '',
        studentClass: profile?.class || '',
        ...guardianData,
        parentStatus: 'pending',
        finalStatus: 'pending',
        createdAt: Date.now()
      };

      const docRef = await addDoc(collection(db, 'applications'), newApp);
      setApplications(prev => [...prev, { id: docRef.id, ...newApp } as any]);
      setSelectedJobAppCount(prev => prev + 1);
      setIsModalOpen(false);
      alert('Đơn ứng tuyển đã được gửi! Đang chờ phụ huynh phê duyệt.');
    } catch (error) {
      console.error("Error submitting application:", error);
      alert('Có lỗi xảy ra khi nộp đơn. Vui lòng thử lại.');
    }
  };

  const handleWithdraw = async (jobId: string) => {
    if (!auth.currentUser) return;

    const confirmWithdraw = window.confirm('Bạn có chắc chắn muốn rút đơn ứng tuyển này?');
    if (!confirmWithdraw) return;

    try {
      const appToWithdraw = applications.find(app => app.jobId === jobId);
      if (appToWithdraw) {
        await deleteDoc(doc(db, 'applications', appToWithdraw.id));
        setApplications(prev => prev.filter(app => app.id !== appToWithdraw.id));
        setSelectedJobAppCount(prev => Math.max(0, prev - 1));
        alert('Đã rút đơn ứng tuyển thành công.');
      }
    } catch (error) {
      console.error("Error withdrawing application:", error);
      alert('Có lỗi xảy ra khi rút đơn. Vui lòng thử lại.');
    }
  };

  const allJobs = [...firestoreJobs, ...MOCK_JOBS];
  useEffect(() => {
    const saved = localStorage.getItem('recent_job_searches');
    if (saved) setRecentSearches(JSON.parse(saved));
  }, []);

  const saveSearch = (term: string) => {
    if (!term.trim()) return;
    const newRecent = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
    setRecentSearches(newRecent);
    localStorage.setItem('recent_job_searches', JSON.stringify(newRecent));
  };

  const filteredJobs = allJobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         job.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'Tất cả' || job.tags.includes(activeCategory);
    const matchesType = jobType === 'All' || job.type === jobType;
    const matchesSalary = job.salaryValue >= salaryRange[0] && job.salaryValue <= salaryRange[1];
    const matchesDeadline = !deadlineFilter || job.deadline <= deadlineFilter;
    const matchesLocation = !locationFilter || job.location.toLowerCase().includes(locationFilter.toLowerCase());
    const matchesSkills = selectedSkills.length === 0 || selectedSkills.some(skill => 
      job.tags.includes(skill) || 
      (job.qualifications && job.qualifications.some((q: string) => q.toLowerCase().includes(skill.toLowerCase()))) ||
      (job.responsibilities && job.responsibilities.some((r: string) => r.toLowerCase().includes(skill.toLowerCase())))
    );

    return matchesSearch && matchesCategory && matchesType && matchesSalary && matchesDeadline && matchesLocation && matchesSkills;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Notifications Toast */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        <AnimatePresence>
          {notifications.map(notif => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className="bg-white rounded-2xl p-4 shadow-xl border border-indigo-100 flex items-start gap-4 max-w-sm cursor-pointer"
              onClick={() => {
                handleOpenDetail(notif.job);
                setNotifications(prev => prev.filter(n => n.id !== notif.id));
              }}
            >
              <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center flex-shrink-0">
                <Bell size={20} className="text-[#4F46E5]" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-gray-900">{notif.title}</h4>
                <p className="text-xs text-gray-500 mt-1">{notif.message}</p>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setNotifications(prev => prev.filter(n => n.id !== notif.id));
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Header Section */}
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-black text-gray-900">Việc làm</h1>
          <button 
            onClick={() => setIsFilterOpen(true)}
            className={`p-3 rounded-2xl transition-colors border shadow-sm ${
              isFilterOpen || jobType !== 'All' || deadlineFilter || locationFilter || salaryRange[0] > 0 || salaryRange[1] < 1000000 || selectedSkills.length > 0 || activeCategory !== 'Tất cả'
              ? 'bg-[#1877F2] text-white border-[#1877F2]' 
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Filter size={20} />
          </button>
        </div>

        <div className="relative mb-6 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#1877F2] transition-colors" size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm công việc, công ty..."
            value={searchQuery}
            onFocus={() => setShowSearchSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSearchSuggestions(false), 200)}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && saveSearch(searchQuery)}
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-medium focus:border-[#1877F2] outline-none transition-all shadow-sm"
          />

          <AnimatePresence>
            {showSearchSuggestions && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-3xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
              >
                {!searchQuery && recentSearches.length > 0 && (
                  <div className="p-4 border-b border-gray-50">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Tìm kiếm gần đây</h3>
                    <div className="space-y-1">
                      {recentSearches.map((term, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setSearchQuery(term);
                            setShowSearchSuggestions(false);
                          }}
                          className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl text-sm text-gray-600 transition-colors"
                        >
                          <Clock size={14} className="text-gray-300" />
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="p-4">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Gợi ý cho bạn</h3>
                  <div className="flex flex-wrap gap-2">
                    {['Thiết kế Poster', 'Viết bài Online', 'IT Support', 'Marketing'].map((tag) => (
                      <button
                        key={tag}
                        onClick={() => {
                          setSearchQuery(tag);
                          saveSearch(tag);
                          setShowSearchSuggestions(false);
                        }}
                        className="px-3 py-1.5 bg-indigo-50 text-[#4F46E5] rounded-xl text-[11px] font-bold hover:bg-indigo-100 transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex gap-3 overflow-x-auto no-scrollbar mb-6">
          {['Tất cả', 'Design', 'Content', 'Event', 'Writing', 'IT', 'Marketing'].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                activeCategory === cat 
                  ? 'bg-[#1877F2] text-white border-[#1877F2]' 
                  : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Quick Filters Bar */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {/* Salary Quick Filter */}
          <div className="flex gap-2">
            {[
              { label: 'Dưới 200k', range: [0, 200000] },
              { label: '200k - 500k', range: [200000, 500000] },
              { label: 'Trên 500k', range: [500000, 5000000] },
            ].map((s) => {
              const isSelected = salaryRange[0] === s.range[0] && salaryRange[1] === s.range[1];
              return (
                <button
                  key={s.label}
                  onClick={() => setSalaryRange(isSelected ? [0, 1000000] : s.range as [number, number])}
                  className={`px-4 py-2 rounded-xl text-[10px] font-bold whitespace-nowrap border transition-all flex items-center gap-1.5 ${
                    isSelected 
                    ? 'bg-indigo-50 text-[#4F46E5] border-indigo-200' 
                    : 'bg-gray-50 text-gray-500 border-transparent hover:border-gray-200'
                  }`}
                >
                  <DollarSign size={12} />
                  {s.label}
                </button>
              );
            })}
          </div>

          <div className="w-px h-6 bg-gray-100 mx-1 self-center"></div>

          {/* Type Quick Filter */}
          <div className="flex gap-2">
            {['Online', 'Offline'].map((type) => {
              const isSelected = jobType === type;
              return (
                <button
                  key={type}
                  onClick={() => setJobType(isSelected ? 'All' : type as any)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-bold whitespace-nowrap border transition-all flex items-center gap-1.5 ${
                    isSelected 
                    ? 'bg-indigo-50 text-[#4F46E5] border-indigo-200' 
                    : 'bg-gray-50 text-gray-500 border-transparent hover:border-gray-200'
                  }`}
                >
                  {type === 'Online' ? <Zap size={12} /> : <MapPin size={12} />}
                  {type}
                </button>
              );
            })}
          </div>

          <div className="w-px h-6 bg-gray-100 mx-1 self-center"></div>

          {/* Location Quick Filter */}
          <div className="flex gap-2">
            {['TP.HCM', 'Hà Nội', 'Đà Nẵng'].map((loc) => {
              const isSelected = locationFilter === loc;
              return (
                <button
                  key={loc}
                  onClick={() => setLocationFilter(isSelected ? '' : loc)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-bold whitespace-nowrap border transition-all flex items-center gap-1.5 ${
                    isSelected 
                    ? 'bg-indigo-50 text-[#4F46E5] border-indigo-200' 
                    : 'bg-gray-50 text-gray-500 border-transparent hover:border-gray-200'
                  }`}
                >
                  <MapPin size={12} />
                  {loc}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Jobs List */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredJobs.length > 0 ? (
          filteredJobs.map((job, i) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => handleOpenDetail(job)}
              className={`p-6 bg-white border border-gray-100 rounded-[32px] shadow-sm hover:shadow-xl hover:shadow-indigo-100/50 transition-all group cursor-pointer relative overflow-hidden ${
                job.jobStatus !== 'Active' ? 'opacity-75' : ''
              }`}
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-transparent group-hover:bg-[#4F46E5] transition-all" />
              
              <div className={`flex justify-between items-start mb-6 ${job.jobStatus !== 'Active' ? 'grayscale' : ''}`}>
                <div className="flex gap-4">
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/company/${job.businessId}`);
                    }}
                    className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center overflow-hidden border border-gray-100 shadow-inner cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <img src={job.logo} alt={job.company} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-base group-hover:text-[#4F46E5] transition-colors leading-tight">{job.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <p 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/company/${job.businessId}`);
                        }}
                        className="text-[10px] text-gray-400 font-black uppercase tracking-widest cursor-pointer hover:text-[#4F46E5] transition-colors"
                      >
                        {job.company}
                      </p>
                      <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                        job.jobStatus === 'Active' ? 'bg-green-50 text-green-600 border-green-100' :
                        job.jobStatus === 'Closed' ? 'bg-gray-50 text-gray-500 border-gray-100' :
                        'bg-red-50 text-red-600 border-red-100'
                      }`}>
                        {job.jobStatus === 'Active' ? 'Đang tuyển' :
                         job.jobStatus === 'Closed' ? 'Đã đóng' :
                         'Hết hạn'}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => handleToggleSave(e, job.id)}
                  className={`p-2.5 rounded-full transition-all border shadow-sm ${
                    profile?.savedJobs?.includes(job.id)
                    ? 'bg-red-50 text-red-500 border-red-100 scale-110'
                    : 'bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-100 hover:scale-110'
                  }`}
                >
                  <Heart size={18} fill={profile?.savedJobs?.includes(job.id) ? "currentColor" : "none"} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="flex items-center gap-2 text-[11px] font-bold text-gray-500 bg-gray-50/50 p-2 rounded-xl border border-gray-50">
                  <MapPin size={14} className="text-gray-400" />
                  <span className="truncate">{job.location}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-bold text-[#4F46E5] bg-indigo-50/50 p-2 rounded-xl border border-indigo-50">
                  <DollarSign size={14} />
                  <span className="truncate">{job.salary}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-1.5">
                  {job.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                      #{tag.toUpperCase()}
                    </span>
                  ))}
                  {job.tags.length > 2 && (
                    <span className="text-[9px] font-black text-gray-400 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                      +{job.tags.length - 2}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Xem chi tiết
                  <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="col-span-full flex flex-col items-center justify-center py-20 px-6 text-center"
          >
            <div className="w-48 h-48 bg-indigo-50 rounded-full flex items-center justify-center mb-8 relative">
              <Search size={64} className="text-indigo-200" />
              <motion.div 
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0]
                }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -top-2 -right-2 w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center border border-indigo-50"
              >
                <X size={24} className="text-red-400" />
              </motion.div>
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Không tìm thấy công việc phù hợp</h3>
            <p className="text-sm text-gray-500 max-w-xs mb-8">
              Thử thay đổi từ khóa tìm kiếm hoặc xóa bớt các bộ lọc để có nhiều kết quả hơn nhé!
            </p>
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('Tất cả');
                  setJobType('All');
                  setSalaryRange([0, 1000000]);
                  setDeadlineFilter('');
                  setLocationFilter('');
                  setSelectedSkills([]);
                }}
                className="w-full py-4 bg-[#4F46E5] text-white rounded-2xl text-sm font-black shadow-lg shadow-indigo-100 hover:bg-[#4338CA] transition-all"
              >
                XÓA TẤT CẢ BỘ LỌC
              </button>
              <button 
                onClick={() => setSearchQuery('')}
                className="w-full py-4 bg-white text-gray-600 rounded-2xl text-sm font-black border border-gray-200 hover:bg-gray-50 transition-all"
              >
                THỬ TỪ KHÓA KHÁC
              </button>
            </div>
            
            <div className="mt-12 grid grid-cols-2 gap-4 w-full max-w-md">
              <div className="p-4 bg-white rounded-2xl border border-gray-100 text-left">
                <Sparkles size={20} className="text-amber-400 mb-2" />
                <h4 className="text-xs font-bold text-gray-900 mb-1">Gợi ý 1</h4>
                <p className="text-[10px] text-gray-500 leading-relaxed">Sử dụng các từ khóa ngắn gọn như "Design", "IT", "Viết lách".</p>
              </div>
              <div className="p-4 bg-white rounded-2xl border border-gray-100 text-left">
                <MapPin size={20} className="text-indigo-400 mb-2" />
                <h4 className="text-xs font-bold text-gray-900 mb-1">Gợi ý 2</h4>
                <p className="text-[10px] text-gray-500 leading-relaxed">Thử tìm kiếm ở các khu vực lân cận hoặc chọn "Toàn quốc".</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Filter Modal */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            className="w-full max-w-md bg-white rounded-t-[40px] p-8 pb-12 max-h-[90vh] overflow-y-auto no-scrollbar"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black tracking-tighter">Bộ lọc</h2>
              <button 
                onClick={() => setIsFilterOpen(false)}
                className="p-2 bg-gray-100 rounded-full text-gray-400"
              >
                <Clock className="rotate-45" size={20} />
              </button>
            </div>

            <div className="space-y-8">
              {/* Category */}
              <div>
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Danh mục</h3>
                <div className="flex flex-wrap gap-2">
                  {['Tất cả', 'Design', 'Content', 'Event', 'Writing', 'IT', 'Marketing'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                        activeCategory === cat 
                        ? 'bg-[#4F46E5] text-white border-[#4F46E5]' 
                        : 'bg-white text-gray-500 border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Skills */}
              <div>
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Kỹ năng</h3>
                <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto no-scrollbar p-1">
                  {PREDEFINED_SKILLS.map((skill) => {
                    const isSelected = selectedSkills.includes(skill);
                    return (
                      <button
                        key={skill}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedSkills(selectedSkills.filter(s => s !== skill));
                          } else {
                            setSelectedSkills([...selectedSkills, skill]);
                          }
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${
                          isSelected 
                          ? 'bg-indigo-600 text-white border-indigo-600' 
                          : 'bg-white text-gray-500 border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        {skill}
                        {isSelected && <Check size={12} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Location */}
              <div>
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Địa điểm</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {['TP.HCM', 'Hà Nội', 'Đà Nẵng', 'Toàn quốc'].map((loc) => (
                    <button
                      key={loc}
                      onClick={() => setLocationFilter(loc)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                        locationFilter === loc 
                        ? 'bg-[#4F46E5] text-white border-[#4F46E5]' 
                        : 'bg-white text-gray-500 border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Hoặc nhập địa điểm cụ thể..."
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#4F46E5] outline-none"
                  />
                </div>
              </div>

              {/* Job Type */}
              <div>
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Loại công việc</h3>
                <div className="flex gap-3">
                  {['All', 'Online', 'Offline'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setJobType(type as any)}
                      className={`flex-1 py-3 rounded-2xl text-xs font-bold border transition-all ${
                        jobType === type 
                        ? 'bg-[#4F46E5] text-white border-[#4F46E5]' 
                        : 'bg-white text-gray-500 border-gray-100'
                      }`}
                    >
                      {type === 'All' ? 'Tất cả' : type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Salary Range */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Mức lương</h3>
                  <span className="text-xs font-bold text-[#4F46E5]">
                    {salaryRange[0].toLocaleString()}đ - {salaryRange[1] >= 1000000 ? '1.000.000đ+' : salaryRange[1].toLocaleString() + 'đ'}
                  </span>
                </div>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Tối thiểu</label>
                    <input
                      type="range"
                      min="0"
                      max="1000000"
                      step="50000"
                      value={salaryRange[0]}
                      onChange={(e) => setSalaryRange([parseInt(e.target.value), Math.max(parseInt(e.target.value), salaryRange[1])])}
                      className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[#4F46E5]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Tối đa</label>
                    <input
                      type="range"
                      min="0"
                      max="1000000"
                      step="50000"
                      value={salaryRange[1]}
                      onChange={(e) => setSalaryRange([Math.min(parseInt(e.target.value), salaryRange[0]), parseInt(e.target.value)])}
                      className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[#4F46E5]"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  {[
                    { label: 'Dưới 200k', range: [0, 200000] },
                    { label: '200k-500k', range: [200000, 500000] },
                    { label: 'Trên 500k', range: [500000, 1000000] }
                  ].map(p => (
                    <button
                      key={p.label}
                      onClick={() => setSalaryRange(p.range as [number, number])}
                      className="flex-1 py-2 bg-gray-50 rounded-xl text-[10px] font-bold text-gray-600 border border-transparent hover:border-indigo-200 hover:bg-indigo-50 transition-all"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Deadline */}
              <div>
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Hạn chót</h3>
                <div className="flex gap-2 mb-4">
                  {[
                    { label: '3 ngày tới', days: 3 },
                    { label: '7 ngày tới', days: 7 },
                    { label: 'Tháng này', days: 30 }
                  ].map(d => {
                    const date = new Date();
                    date.setDate(date.getDate() + d.days);
                    const dateStr = date.toISOString().split('T')[0];
                    const isSelected = deadlineFilter === dateStr;
                    return (
                      <button
                        key={d.label}
                        onClick={() => setDeadlineFilter(isSelected ? '' : dateStr)}
                        className={`flex-1 py-2 rounded-xl text-[10px] font-bold border transition-all ${
                          isSelected 
                          ? 'bg-indigo-50 text-[#4F46E5] border-indigo-200' 
                          : 'bg-gray-50 text-gray-600 border-transparent'
                        }`}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="date"
                    value={deadlineFilter}
                    onChange={(e) => setDeadlineFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#4F46E5] outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => {
                    setJobType('All');
                    setSalaryRange([0, 1000000]);
                    setDeadlineFilter('');
                    setLocationFilter('');
                    setSelectedSkills([]);
                    setActiveCategory('Tất cả');
                  }}
                  className="flex-1 py-4 bg-gray-50 text-gray-500 rounded-[20px] text-sm font-black"
                >
                  LÀM MỚI
                </button>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="flex-1 py-4 bg-[#4F46E5] text-white rounded-[20px] text-sm font-black shadow-lg shadow-indigo-100"
                >
                  ÁP DỤNG
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <JobDetail
        job={selectedJob}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onApply={handleApply}
        onChat={handleChat}
        isSaved={profile?.savedJobs?.includes(selectedJob?.id)}
        onToggleSave={(e) => handleToggleSave(e, selectedJob?.id)}
        applicationStatus={applications.find(app => app.jobId === selectedJob?.id)?.finalStatus}
        parentStatus={applications.find(app => app.jobId === selectedJob?.id)?.parentStatus}
        onWithdraw={handleWithdraw}
        applicationCount={selectedJobAppCount}
      />

      <ParentVerificationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleApplicationSuccess}
      />
    </div>
  );
}

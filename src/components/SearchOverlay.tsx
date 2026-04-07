import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, User, Briefcase, Building2, GraduationCap, Clock, TrendingUp, ChevronRight, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db, useFirebase } from './FirebaseProvider';
import { cn } from '../lib/utils';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { profile, toggleSaveJob } = useFirebase();
  const [results, setResults] = useState<{
    users: any[];
    jobs: any[];
    companies: any[];
  }>({ users: [], jobs: [], companies: [] });
  const [allData, setAllData] = useState<{
    users: any[];
    jobs: any[];
  }>({ users: [], jobs: [] });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Pre-fetch data for better search experience
  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersSnap = await getDocs(query(collection(db, 'users'), limit(1000)));
        const jobsSnap = await getDocs(query(collection(db, 'jobs'), limit(1000)));
        
        setAllData({
          users: usersSnap.docs.map(d => ({ id: d.id, ...d.data() })),
          jobs: jobsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
        });
      } catch (error) {
        console.error("Error pre-fetching search data:", error);
      }
    };
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const categories = [
    { id: 'all', label: 'Tất cả', icon: Search },
    { id: 'users', label: 'Người dùng', icon: User },
    { id: 'jobs', label: 'Công việc', icon: Briefcase },
    { id: 'companies', label: 'Công ty', icon: Building2 },
    { id: 'shadowing', label: 'Kiến tập', icon: GraduationCap },
  ];

  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults({ users: [], jobs: [], companies: [] });
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      setLoading(true);
      try {
        const queryLower = searchQuery.toLowerCase();
        
        const filteredUsers = allData.users.filter(u => 
          u.displayName?.toLowerCase().includes(queryLower) ||
          u.role?.toLowerCase().includes(queryLower) ||
          u.email?.toLowerCase().includes(queryLower)
        );

        const filteredJobs = allData.jobs.filter(j => 
          j.title?.toLowerCase().includes(queryLower) ||
          j.companyName?.toLowerCase().includes(queryLower) ||
          j.description?.toLowerCase().includes(queryLower)
        );

        setResults({
          users: filteredUsers.filter((u: any) => u.role !== 'business').slice(0, 20),
          jobs: filteredJobs.slice(0, 20),
          companies: filteredUsers.filter((u: any) => u.role === 'business').slice(0, 20)
        });
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, allData]);

  const handleCategoryClick = (id: string) => {
    if (id === 'jobs') {
      onClose();
      navigate('/jobs');
    } else if (id === 'shadowing') {
      onClose();
      navigate('/shadowing');
    } else {
      setActiveCategory(id);
    }
  };

  const handleResultClick = (type: string, id: string) => {
    onClose();
    if (type === 'user') navigate(`/profile/${id}`);
    if (type === 'job') navigate(`/jobs`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-white flex flex-col"
        >
          {/* Search Header */}
          <div className="p-4 border-b border-gray-100 flex items-center gap-3">
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={24} className="text-gray-600" />
            </button>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                autoFocus
                type="text"
                placeholder="Tìm kiếm người dùng, công việc, công ty..."
                className="w-full bg-gray-100 rounded-full py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#1877F2] transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Categories */}
          <div className="flex gap-2 p-4 overflow-x-auto no-scrollbar border-b border-gray-50">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  activeCategory === cat.id
                    ? 'bg-[#1877F2] text-white shadow-lg shadow-blue-100'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <cat.icon size={14} />
                {cat.label}
              </button>
            ))}
          </div>

          {/* Results Area */}
          <div className="flex-1 overflow-y-auto p-4">
            {!searchQuery ? (
              <div className="space-y-8">
                {/* Quick Navigation */}
                <div>
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <TrendingUp size={14} /> Truy cập nhanh
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => { onClose(); navigate('/jobs'); }}
                      className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100 hover:bg-blue-100 transition-all group"
                    >
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#1877F2] shadow-sm group-hover:scale-110 transition-transform">
                        <Briefcase size={20} />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-gray-900">Công việc</p>
                        <p className="text-[10px] text-gray-500 font-medium">Tìm việc làm</p>
                      </div>
                    </button>
                    <button 
                      onClick={() => { onClose(); navigate('/shadowing'); }}
                      className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100 hover:bg-amber-100 transition-all group"
                    >
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-amber-500 shadow-sm group-hover:scale-110 transition-transform">
                        <GraduationCap size={20} />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-gray-900">Kiến tập</p>
                        <p className="text-[10px] text-gray-500 font-medium">Trải nghiệm thực tế</p>
                      </div>
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Clock size={14} /> Tìm kiếm gần đây
                  </h3>
                  <div className="space-y-2">
                    {['Lập trình viên React', 'Thiết kế đồ họa', 'FPT Software'].map((term, i) => (
                      <button 
                        key={i}
                        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-2xl transition-colors group"
                        onClick={() => setSearchQuery(term)}
                      >
                        <div className="flex items-center gap-3">
                          <Clock size={16} className="text-gray-400" />
                          <span className="text-sm font-medium text-gray-700">{term}</span>
                        </div>
                        <X size={14} className="text-gray-300 opacity-0 group-hover:opacity-100" />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <TrendingUp size={14} /> Xu hướng tìm kiếm
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {['Kiến tập Marketing', 'Việc làm bán thời gian', 'TopCV', 'TeenTask VIP'].map((tag, i) => (
                      <button 
                        key={i}
                        className="px-4 py-2 bg-blue-50 text-[#1877F2] rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors"
                        onClick={() => setSearchQuery(tag)}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-8 h-8 border-4 border-[#1877F2] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-gray-500 font-medium">Đang tìm kiếm...</p>
                  </div>
                ) : (
                  <>
                    {results.users.length > 0 && (activeCategory === 'all' || activeCategory === 'users') && (
                      <div>
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 px-2">Người dùng</h3>
                        <div className="space-y-2">
                          {results.users.map(user => (
                            <button 
                              key={user.id}
                              onClick={() => handleResultClick('user', user.id)}
                              className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-2xl transition-colors"
                            >
                              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 border border-gray-100">
                                {user.photoURL ? (
                                  <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                                ) : (
                                  <User className="w-full h-full p-3 text-gray-400" />
                                )}
                              </div>
                              <div className="flex-1 text-left">
                                <p className="text-sm font-bold text-gray-900">{user.displayName}</p>
                                <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{user.role}</p>
                              </div>
                              <ChevronRight size={16} className="text-gray-300" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {results.jobs.length > 0 && (activeCategory === 'all' || activeCategory === 'jobs') && (
                      <div>
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 px-2">Công việc</h3>
                        <div className="space-y-2">
                          {results.jobs.map(job => {
                            const isSaved = profile?.savedJobs?.includes(job.id);
                            return (
                              <div 
                                key={job.id}
                                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-2xl transition-colors group relative"
                              >
                                <div 
                                  onClick={() => handleResultClick('job', job.id)}
                                  className="flex-1 flex items-center gap-3 cursor-pointer"
                                >
                                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                    <Briefcase size={24} />
                                  </div>
                                  <div className="flex-1 text-left">
                                    <p className="text-sm font-bold text-gray-900 line-clamp-1">{job.title}</p>
                                    <p className="text-[10px] text-gray-500 font-medium">{job.companyName}</p>
                                  </div>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleSaveJob(job.id);
                                  }}
                                  className={cn(
                                    "p-2 rounded-full transition-all",
                                    isSaved ? "text-red-500 bg-red-50" : "text-gray-300 hover:text-red-500"
                                  )}
                                >
                                  <Heart size={16} fill={isSaved ? "currentColor" : "none"} />
                                </button>
                                <ChevronRight size={16} className="text-gray-300" />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {results.companies.length > 0 && (activeCategory === 'all' || activeCategory === 'companies') && (
                      <div>
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 px-2">Doanh nghiệp</h3>
                        <div className="space-y-2">
                          {results.companies.map(company => (
                            <button 
                              key={company.id}
                              onClick={() => handleResultClick('user', company.id)}
                              className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-2xl transition-colors"
                            >
                              <div className="w-12 h-12 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100">
                                {company.photoURL ? (
                                  <img src={company.photoURL} alt={company.displayName} className="w-full h-full object-cover" />
                                ) : (
                                  <Building2 className="w-full h-full p-3 text-gray-400" />
                                )}
                              </div>
                              <div className="flex-1 text-left">
                                <p className="text-sm font-bold text-gray-900">{company.displayName}</p>
                                <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Doanh nghiệp</p>
                              </div>
                              <ChevronRight size={16} className="text-gray-300" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {results.users.length === 0 && results.jobs.length === 0 && results.companies.length === 0 && (
                      <div className="text-center py-20">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Search size={32} className="text-gray-300" />
                        </div>
                        <p className="text-gray-900 font-bold">Không tìm thấy kết quả</p>
                        <p className="text-sm text-gray-500">Thử tìm kiếm với từ khóa khác</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

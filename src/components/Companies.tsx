import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Building2, MapPin, Users, Star, ArrowLeft, Search, SlidersHorizontal, Globe, Briefcase, GraduationCap, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

const MOCK_COMPANIES = [
  {
    id: 'business_1',
    name: 'The Coffee House',
    industry: 'F&B / Dịch vụ',
    location: 'Quận 1, TP.HCM',
    employees: '1000+',
    rating: 4.8,
    reviews: 124,
    jobsCount: 12,
    shadowingCount: 3,
    logo: 'https://picsum.photos/seed/coffee/200/200',
    banner: 'https://picsum.photos/seed/coffee-shop/800/400',
    desc: 'Chuỗi cửa hàng cà phê hàng đầu Việt Nam, nơi kết nối và chia sẻ những câu chuyện thú vị.',
    isVip: true,
  },
  {
    id: 'business_2',
    name: 'Kênh 14',
    industry: 'Media / Truyền thông',
    location: 'Quận 3, TP.HCM',
    employees: '500+',
    rating: 4.5,
    reviews: 89,
    jobsCount: 8,
    shadowingCount: 1,
    logo: 'https://picsum.photos/seed/news/200/200',
    banner: 'https://picsum.photos/seed/media/800/400',
    desc: 'Trang tin tức giải trí dành cho giới trẻ lớn nhất Việt Nam.',
    isVip: false,
  },
  {
    id: 'business_3',
    name: 'FPT Software',
    industry: 'Công nghệ / Phần mềm',
    location: 'Quận 9, TP.HCM',
    employees: '20,000+',
    rating: 4.9,
    reviews: 450,
    jobsCount: 45,
    shadowingCount: 10,
    logo: 'https://picsum.photos/seed/fpt/200/200',
    banner: 'https://picsum.photos/seed/tech/800/400',
    desc: 'Công ty xuất khẩu phần mềm hàng đầu Việt Nam, môi trường làm việc chuyên nghiệp chuẩn quốc tế.',
    isVip: true,
  },
  {
    id: 'business_4',
    name: 'VinGroup',
    industry: 'Đa ngành',
    location: 'Quận Long Biên, Hà Nội',
    employees: '40,000+',
    rating: 4.7,
    reviews: 320,
    jobsCount: 30,
    shadowingCount: 5,
    logo: 'https://picsum.photos/seed/vin/200/200',
    banner: 'https://picsum.photos/seed/vin-banner/800/400',
    desc: 'Tập đoàn kinh tế tư nhân đa ngành lớn nhất Việt Nam.',
    isVip: true,
  },
];

const INDUSTRIES = ['Tất cả', 'Công nghệ', 'F&B', 'Media', 'Đa ngành', 'Giáo dục'];

export default function Companies() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeIndustry, setActiveIndustry] = useState('Tất cả');

  const filteredCompanies = useMemo(() => {
    return MOCK_COMPANIES.filter(company => {
      const matchesSearch = company.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           company.industry.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesIndustry = activeIndustry === 'Tất cả' || company.industry.includes(activeIndustry);
      return matchesSearch && matchesIndustry;
    });
  }, [searchQuery, activeIndustry]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Header Section */}
      <div className="bg-white border-b border-slate-200 px-6 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <ArrowLeft size={24} className="text-slate-600" />
              </button>
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Đối tác doanh nghiệp</h1>
                <p className="text-slate-500 text-sm mt-1 font-medium">Kết nối với những môi trường làm việc hàng đầu.</p>
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Tìm kiếm công ty, lĩnh vực..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-2xl text-sm font-medium transition-all outline-none"
              />
            </div>
            <button className="px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl flex items-center justify-center gap-2 text-slate-600 hover:bg-slate-50 transition-colors">
              <SlidersHorizontal size={20} />
              <span className="text-sm font-bold">Bộ lọc</span>
            </button>
          </div>

          {/* Industries */}
          <div className="flex gap-2 mt-6 overflow-x-auto no-scrollbar pb-2">
            {INDUSTRIES.map((ind) => (
              <button
                key={ind}
                onClick={() => setActiveIndustry(ind)}
                className={cn(
                  "px-5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all",
                  activeIndustry === ind
                    ? "bg-slate-900 text-white shadow-lg shadow-slate-200"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {ind}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="max-w-5xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredCompanies.map((company, i) => (
              <motion.div
                key={company.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2, delay: i * 0.05 }}
                onClick={() => navigate(`/company/${company.id}`)}
                className="group bg-white rounded-[40px] overflow-hidden border border-slate-200 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5 transition-all cursor-pointer flex flex-col"
              >
                <div className="aspect-[16/8] relative overflow-hidden">
                  <img
                    src={company.banner}
                    alt={company.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent"></div>
                  
                  <div className="absolute top-6 right-6">
                    {company.isVip && (
                      <span className="px-4 py-2 bg-amber-400 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest shadow-xl flex items-center gap-2">
                        <Star size={12} fill="currentColor" /> Đối tác VIP
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-6 left-8 right-8 flex items-center gap-4">
                    <div className="w-16 h-16 bg-white rounded-2xl p-2 shadow-2xl group-hover:scale-110 transition-transform">
                      <img src={company.logo} alt={company.name} className="w-full h-full object-contain rounded-lg" referrerPolicy="no-referrer" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white leading-tight group-hover:text-amber-400 transition-colors">
                        {company.name}
                      </h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">{company.industry}</span>
                        <div className="flex items-center gap-1 text-amber-400 text-xs font-black">
                          <Star size={12} fill="currentColor" />
                          {company.rating}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-8 space-y-6">
                  <p className="text-slate-500 text-sm leading-relaxed line-clamp-2 font-medium">
                    {company.desc}
                  </p>

                  <div className="grid grid-cols-3 gap-4 py-6 border-y border-slate-100">
                    <div className="text-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Việc làm</p>
                      <p className="text-lg font-black text-slate-900">{company.jobsCount}</p>
                    </div>
                    <div className="text-center border-x border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Kiến tập</p>
                      <p className="text-lg font-black text-slate-900">{company.shadowingCount}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nhân sự</p>
                      <p className="text-lg font-black text-slate-900">{company.employees}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
                      <MapPin size={14} className="text-primary" />
                      {company.location}
                    </div>
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all">
                      <ArrowRight size={18} />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

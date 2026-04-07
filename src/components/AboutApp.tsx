import { Info, ArrowRight, Target, Rocket, Users, ShieldCheck, GraduationCap, BookOpen, Search, MessageSquare, Star, Briefcase, Award, Zap, Shield, Heart, Globe, TrendingUp, CheckCircle2, Eye, Clock, Building2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';

export default function AboutApp() {
  const navigate = useNavigate();

  const pillars = [
    {
      icon: Zap,
      title: 'Sàn Giao Dịch Kỹ Năng',
      subtitle: 'Micro-Tasking Platform',
      desc: 'Nơi kết nối các CLB, shop online, quán cafe với học sinh có kỹ năng (Thiết kế, Video, Content, Fanpage...).',
      points: [
        'Trả công linh hoạt: Tiền mặt (giá sàn bảo vệ) hoặc Chứng chỉ/Thư giới thiệu.',
        'Bảo vệ 100%: Nền tảng KHÔNG thu chiết khấu từ học sinh.',
        'Làm đẹp CV: Tích lũy kinh nghiệm thực tế ngay từ khi đi học.'
      ],
      color: 'bg-blue-50 text-blue-600'
    },
    {
      icon: Globe,
      title: 'Mạng Lưới Trải Nghiệm Nghề Nghiệp',
      subtitle: 'Career Experience Network',
      desc: 'Khai thác tài nguyên từ chính các bậc phụ huynh là chủ doanh nghiệp, quản lý cấp cao.',
      points: [
        'Job Shadowing: 1 ngày "bám càng" chuyên gia tại công sở.',
        'Summer Apprentice: Thực tập sinh mùa hè với dự án thực tế.',
        'Parent-Swap: Mạng lưới trao đổi cơ hội thực tập chéo an toàn.'
      ],
      color: 'bg-indigo-50 text-indigo-600'
    }
  ];

  const roadmap = [
    {
      phase: 'Giai đoạn 1',
      title: 'Triển khai Trường học',
      desc: 'Tập trung thu hút người dùng, xây dựng thói quen với mô hình Freemium.',
      tags: ['Viral nhanh', 'Ghim tin phí nhỏ', 'Miễn phí giao dịch']
    },
    {
      phase: 'Giai đoạn 2',
      title: 'Mở rộng Ngoại khu',
      desc: 'Kết nối với các doanh nghiệp, shop thời trang, quán cafe bên ngoài.',
      tags: ['Phí dịch vụ 10%', 'Gói hội viên B2B', 'Bảo vệ giao dịch']
    }
  ];

  const roles = [
    {
      role: 'Học sinh',
      icon: GraduationCap,
      color: 'bg-blue-50 text-blue-600',
      desc: 'Dành cho các bạn từ 14-18 tuổi muốn trải nghiệm thực tế.',
      features: [
        { title: 'Tìm việc làm', desc: 'Khám phá các công việc Micro-tasking như thiết kế, viết lách, quản lý fanpage.' },
        { title: 'Kiến tập nghề nghiệp', desc: 'Tham gia Job Shadowing hoặc Summer Apprentice để định hướng tương lai.' },
        { title: 'Xây dựng CV', desc: 'Tự động tạo hồ sơ năng lực từ những công việc đã hoàn thành.' },
        { title: 'Tích lũy TrustScore', desc: 'Xây dựng uy tín cá nhân thông qua các đánh giá từ nhà tuyển dụng.' }
      ]
    },
    {
      role: 'Phụ huynh',
      icon: ShieldCheck,
      color: 'bg-green-50 text-green-600',
      desc: 'Đồng hành và giám sát lộ trình phát triển của con em.',
      features: [
        { title: 'Xác thực ứng tuyển', desc: 'Phê duyệt các yêu cầu công việc của con để đảm bảo an toàn.' },
        { title: 'Theo dõi tiến độ', desc: 'Xem báo cáo về các kỹ năng con đang phát triển và kết quả công việc.' },
        { title: 'Mạng lưới Parent-Swap', desc: 'Kết nối với các phụ huynh khác để trao đổi cơ hội thực tập cho con.' },
        { title: 'Quản lý tài chính', desc: 'Giám sát thu nhập và các giao dịch trong ví của con.' }
      ]
    },
    {
      role: 'Doanh nghiệp',
      icon: Building2,
      color: 'bg-purple-50 text-purple-600',
      desc: 'Tìm kiếm nhân tài trẻ và đóng góp cho cộng đồng.',
      features: [
        { title: 'Đăng tin tuyển dụng', desc: 'Tiếp cận nguồn nhân lực trẻ năng động với chi phí tối ưu.' },
        { title: 'Quản lý ứng viên', desc: 'Hệ thống lọc và quản lý đơn ứng tuyển chuyên nghiệp.' },
        { title: 'Tổ chức kiến tập', desc: 'Xây dựng hình ảnh thương hiệu thông qua các chương trình hướng nghiệp.' },
        { title: 'Thanh toán an toàn', desc: 'Hệ thống thanh toán minh bạch và bảo vệ quyền lợi hai bên.' }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Hero Section */}
      <div className="relative h-[500px] bg-gradient-to-br from-[#1877F2] to-[#4F46E5] overflow-hidden flex items-center justify-center text-white text-center px-6">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-white rounded-full translate-x-1/2 translate-y-1/2 blur-[150px]" />
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 max-w-4xl"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-xs font-black uppercase tracking-[0.3em] mb-8">
            <Rocket size={14} />
            Hệ sinh thái kỹ năng & hướng nghiệp Gen Z
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9]">
            TEENTASK <br/>
            <span className="text-white/60">PROJECT</span>
          </h1>
          <p className="text-xl md:text-2xl font-bold opacity-90 leading-relaxed max-w-2xl mx-auto">
            Nền tảng an toàn 100% giúp học sinh 14-18 tuổi kiến tạo tương lai qua trải nghiệm thực tế.
          </p>
        </motion.div>
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-20 relative z-20">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24">
          {[
            { label: 'Độ tuổi mục tiêu', value: '14 - 18', sub: 'Học sinh THPT toàn quốc', icon: Users },
            { label: 'Mức độ an toàn', value: '100%', sub: 'Môi trường được kiểm chứng', icon: ShieldCheck },
            { label: 'Mục tiêu cốt lõi', value: 'CV & Thu nhập', sub: 'Làm đẹp hồ sơ du học', icon: Award }
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-8 rounded-[40px] shadow-xl shadow-blue-900/5 border border-gray-100 flex flex-col items-center text-center"
            >
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
                <stat.icon size={24} />
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <h4 className="text-3xl font-black text-gray-900 mb-1">{stat.value}</h4>
              <p className="text-xs font-bold text-gray-500">{stat.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Roles & Functions Section */}
        <section className="space-y-16 mb-32">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-4xl font-black text-gray-900 tracking-tight">Vai trò & Chức năng</h2>
            <p className="text-gray-500 font-bold">TeenTask được thiết kế tối ưu cho từng nhóm người dùng trong hệ sinh thái.</p>
          </div>

          <div className="grid grid-cols-1 gap-12">
            {roles.map((r, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-white rounded-[48px] border border-gray-100 shadow-xl p-8 md:p-12"
              >
                <div className="flex flex-col md:flex-row gap-12">
                  <div className="md:w-1/3 space-y-6">
                    <div className={`w-20 h-20 ${r.color} rounded-[2rem] flex items-center justify-center shadow-lg`}>
                      <r.icon size={40} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h3 className="text-3xl font-black text-gray-900 mb-2">{r.role}</h3>
                      <p className="text-gray-500 font-medium leading-relaxed">{r.desc}</p>
                    </div>
                  </div>
                  <div className="md:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {r.features.map((f, idx) => (
                      <div key={idx} className="p-6 bg-gray-50 rounded-3xl border border-gray-100 hover:bg-white hover:shadow-lg transition-all group">
                        <h4 className="font-black text-gray-900 mb-2 flex items-center gap-2">
                          <div className="w-1.5 h-4 bg-blue-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          {f.title}
                        </h4>
                        <p className="text-xs text-gray-500 font-medium leading-relaxed">{f.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Mission Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center mb-32">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-[#1877F2] rounded-full text-xs font-black uppercase tracking-widest">
              <Target size={16} />
              Sứ mệnh của chúng tôi
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight tracking-tighter">
              Thu hẹp khoảng cách giữa <span className="text-blue-600">Lý thuyết</span> và <span className="text-indigo-600">Thực tiễn</span>.
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed font-medium">
              TeenTask không chỉ là một ứng dụng, mà là một hệ sinh thái giúp các bạn trẻ khám phá đam mê, rèn luyện kỹ năng và định hướng nghề nghiệp thông qua những công việc thực tế và mạng lưới kết nối uy tín.
            </p>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-blue-600 font-black text-sm">
                  <CheckCircle2 size={18} />
                  An toàn tuyệt đối
                </div>
                <p className="text-xs text-gray-500 font-bold">Quy trình xác thực nghiêm ngặt từ phụ huynh & doanh nghiệp.</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-indigo-600 font-black text-sm">
                  <CheckCircle2 size={18} />
                  Giá trị bền vững
                </div>
                <p className="text-xs text-gray-500 font-bold">Tập trung vào việc xây dựng Portfolio và kỹ năng mềm.</p>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-blue-600/5 rounded-[60px] -rotate-6 scale-105" />
            <div className="bg-gray-50 rounded-[60px] p-12 aspect-square flex items-center justify-center relative overflow-hidden border border-gray-100 shadow-inner">
              <div className="grid grid-cols-2 gap-6">
                <motion.div animate={{ y: [0, -20, 0] }} transition={{ duration: 4, repeat: Infinity }} className="w-32 h-32 bg-blue-600 rounded-3xl shadow-2xl flex items-center justify-center text-white"><Rocket size={48} /></motion.div>
                <motion.div animate={{ y: [0, 20, 0] }} transition={{ duration: 5, repeat: Infinity }} className="w-32 h-32 bg-indigo-500 rounded-full shadow-2xl flex items-center justify-center text-white"><Users size={48} /></motion.div>
                <motion.div animate={{ y: [0, 20, 0] }} transition={{ duration: 3, repeat: Infinity }} className="w-32 h-32 bg-blue-400 rounded-[2rem] shadow-2xl flex items-center justify-center text-white"><Star size={48} /></motion.div>
                <motion.div animate={{ y: [0, -20, 0] }} transition={{ duration: 6, repeat: Infinity }} className="w-32 h-32 bg-indigo-300 rounded-2xl shadow-2xl flex items-center justify-center text-white"><ShieldCheck size={48} /></motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* Two Pillars */}
        <section className="space-y-16 mb-32">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-4xl font-black text-gray-900 tracking-tight">Hai trụ cột cốt lõi</h2>
            <p className="text-gray-500 font-bold">Hệ thống tương hỗ giúp học sinh phát triển toàn diện từ kỹ năng đến định hướng.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {pillars.map((p, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -10 }}
                className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-xl shadow-gray-200/50 relative overflow-hidden group"
              >
                <div className={`w-16 h-16 ${p.color} rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500`}>
                  <p.icon size={32} strokeWidth={2.5} />
                </div>
                <div className="space-y-4 relative z-10">
                  <div>
                    <h3 className="text-2xl font-black text-gray-900">{p.title}</h3>
                    <p className="text-xs font-black text-blue-600 uppercase tracking-widest mt-1">{p.subtitle}</p>
                  </div>
                  <p className="text-gray-600 font-medium leading-relaxed">{p.desc}</p>
                  <ul className="space-y-3 pt-4">
                    {p.points.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm font-bold text-gray-700">
                        <div className="w-5 h-5 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCircle2 size={12} strokeWidth={3} />
                        </div>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-gray-50 rounded-full blur-3xl group-hover:bg-blue-50 transition-colors" />
              </motion.div>
            ))}
          </div>
        </section>

        {/* Detailed Modules */}
        <section className="space-y-20 mb-32">
          <div className="bg-gray-50 rounded-[64px] p-12 md:p-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              <div className="space-y-10">
                <h3 className="text-3xl font-black text-gray-900">Mô hình trải nghiệm <br/>độc đáo</h3>
                <div className="space-y-8">
                  {[
                    { title: 'Job Shadowing', desc: '1 ngày "bám càng" chuyên gia để quan sát thực tế công việc.', icon: Eye },
                    { title: 'Summer Apprentice', desc: 'Dự án thực tập hè 1-2 tháng, nhận Certificate uy tín.', icon: Clock },
                    { title: 'Parent-Swap Network', desc: 'Mạng lưới trao đổi cơ hội thực tập chéo an toàn cho con em.', icon: Heart }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-6 group">
                      <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-blue-600 shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                        <item.icon size={24} />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-black text-gray-900">{item.title}</h4>
                        <p className="text-sm text-gray-500 font-medium leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-[48px] p-10 shadow-xl shadow-gray-200/50 border border-gray-100">
                <h3 className="text-2xl font-black text-gray-900 mb-8 flex items-center gap-3">
                  <TrendingUp className="text-blue-600" />
                  Lộ trình phát triển
                </h3>
                <div className="space-y-12 relative">
                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-100" />
                  {roadmap.map((step, i) => (
                    <div key={i} className="relative pl-16">
                      <div className="absolute left-0 top-0 w-12 h-12 bg-white border-4 border-blue-50 rounded-2xl flex items-center justify-center z-10 shadow-sm">
                        <span className="text-blue-600 font-black">{i + 1}</span>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">{step.phase}</p>
                          <h4 className="text-lg font-black text-gray-900">{step.title}</h4>
                        </div>
                        <p className="text-sm text-gray-500 font-medium leading-relaxed">{step.desc}</p>
                        <div className="flex flex-wrap gap-2">
                          {step.tags.map((tag, idx) => (
                            <span key={idx} className="px-3 py-1 bg-gray-50 text-gray-400 text-[9px] font-black uppercase tracking-widest rounded-full border border-gray-100">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* User Guide Section */}
        <section className="space-y-16 mb-32">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-3 bg-blue-50 text-[#1877F2] rounded-2xl">
              <BookOpen size={24} />
            </div>
            <h2 className="text-4xl font-black text-gray-900">Bắt đầu hành trình</h2>
            <p className="text-gray-500 font-bold">4 bước đơn giản để kiến tạo tương lai của bạn</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Users, title: 'Đăng ký', desc: 'Tạo tài khoản và chọn vai trò phù hợp (Học sinh, Phụ huynh hoặc Doanh nghiệp).' },
              { icon: Search, title: 'Tìm kiếm', desc: 'Khám phá hàng ngàn cơ hội việc làm và kiến tập phù hợp với sở thích.' },
              { icon: MessageSquare, title: 'Kết nối', desc: 'Trò chuyện trực tiếp với nhà tuyển dụng và nhận tư vấn từ chuyên gia.' },
              { icon: Star, title: 'Phát triển', desc: 'Hoàn thành công việc, tích lũy TrustScore và xây dựng hồ sơ năng lực.' }
            ].map((step, i) => (
              <div key={i} className="relative p-8 bg-white border border-gray-100 rounded-[40px] shadow-sm hover:shadow-xl transition-all group">
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg group-hover:rotate-12 transition-transform">
                  {i + 1}
                </div>
                <div className="w-14 h-14 bg-blue-50 text-[#1877F2] rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <step.icon size={28} />
                </div>
                <h3 className="text-lg font-black text-gray-900 mb-3">{step.title}</h3>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Survey CTA */}
        <section className="bg-gradient-to-br from-gray-900 to-blue-900 rounded-[64px] p-12 md:p-24 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-[150px] opacity-20" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500 rounded-full blur-[150px] opacity-20" />
          
          <div className="relative z-10 max-w-3xl mx-auto space-y-10">
            <h2 className="text-4xl md:text-5xl font-black leading-tight tracking-tighter">
              Ý kiến của bạn là <span className="text-blue-400">chìa khóa</span> để chúng tôi hoàn thiện.
            </h2>
            <p className="text-gray-400 text-lg font-medium leading-relaxed">
              Hãy dành 2 phút tham gia khảo sát để giúp TeenTask trở thành nền tảng tốt nhất cho thế hệ trẻ Việt Nam.
            </p>
            
            <button 
              onClick={() => navigate('/survey')}
              className="group inline-flex items-center gap-4 px-12 py-6 bg-white text-gray-900 rounded-full font-black text-xl shadow-2xl hover:bg-blue-50 hover:scale-105 transition-all active:scale-95"
            >
              Tham gia khảo sát ngay
              <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
            </button>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="mt-32 py-12 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
              <GraduationCap size={20} className="text-white" />
            </div>
            <span className="font-black text-gray-900 text-xl tracking-tighter">TEENTASK</span>
          </div>
          <div className="flex gap-8 text-xs font-black text-gray-400 uppercase tracking-widest">
            <a href="#" className="hover:text-blue-600 transition-colors">Điều khoản</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Bảo mật</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Liên hệ</a>
          </div>
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">© 2026 TeenTask Project. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

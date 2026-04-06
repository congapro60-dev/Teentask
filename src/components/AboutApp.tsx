import { Info, ArrowRight, Target, Rocket, Users, ShieldCheck, GraduationCap } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';

export default function AboutApp() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Rocket,
      title: 'Khởi đầu sự nghiệp',
      desc: 'TeenTask giúp học sinh tiếp cận với các cơ hội kiến tập (shadowing) và việc làm bán thời gian phù hợp với lứa tuổi.'
    },
    {
      icon: Target,
      title: 'Định hướng tương lai',
      desc: 'Thông qua trải nghiệm thực tế, các bạn trẻ có thể khám phá đam mê và năng lực của bản thân để chọn ngành nghề đúng đắn.'
    },
    {
      icon: Users,
      title: 'Kết nối cộng đồng',
      desc: 'Xây dựng mạng lưới liên kết giữa Học sinh - Phụ huynh - Doanh nghiệp, tạo ra một hệ sinh thái hỗ trợ phát triển toàn diện.'
    },
    {
      icon: ShieldCheck,
      title: 'Hệ thống TrustScore',
      desc: 'Mỗi công việc hoàn thành giúp xây dựng uy tín cá nhân, là minh chứng cho thái độ làm việc chuyên nghiệp từ khi còn ngồi trên ghế nhà trường.'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative h-[400px] bg-[#1877F2] overflow-hidden flex items-center justify-center text-white text-center px-6">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2 blur-3xl" />
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 max-w-3xl"
        >
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6">TEENTASK</h1>
          <p className="text-xl md:text-2xl font-medium opacity-90 leading-relaxed">
            Nền tảng kết nối cơ hội thực tế cho thế hệ trẻ Việt Nam.
          </p>
        </motion.div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-16 space-y-24">
        {/* About Project */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-[#1877F2] rounded-full text-sm font-bold uppercase tracking-wider">
              <Info size={18} />
              Về dự án
            </div>
            <h2 className="text-4xl font-black text-gray-900 leading-tight">
              Kiến tạo tương lai từ những bước chân đầu tiên.
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Dự án <strong>TeenTask</strong> ra đời với sứ mệnh thu hẹp khoảng cách giữa lý thuyết học đường và thực tiễn nghề nghiệp. Chúng tôi tin rằng, việc tiếp xúc sớm với môi trường làm việc chuyên nghiệp sẽ giúp học sinh hình thành tư duy trách nhiệm, kỹ năng mềm và sự tự tin cần thiết cho tương lai.
            </p>
          </div>
          <div className="bg-gray-50 rounded-[40px] p-8 aspect-square flex items-center justify-center">
            <div className="grid grid-cols-2 gap-4">
              <div className="w-32 h-32 bg-[#1877F2] rounded-3xl shadow-lg" />
              <div className="w-32 h-32 bg-blue-400 rounded-full shadow-lg translate-y-8" />
              <div className="w-32 h-32 bg-blue-200 rounded-2xl shadow-lg -translate-y-8" />
              <div className="w-32 h-32 bg-blue-600 rounded-[2rem] shadow-lg" />
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl font-black text-gray-900">Tại sao chọn TeenTask?</h2>
            <p className="text-gray-500">Chúng tôi cung cấp các công cụ mạnh mẽ để hỗ trợ hành trình phát triển của bạn.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((f, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -5 }}
                className="p-8 bg-gray-50 rounded-[32px] border border-transparent hover:border-blue-100 hover:bg-white hover:shadow-xl transition-all group"
              >
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-[#1877F2] shadow-sm mb-6 group-hover:bg-[#1877F2] group-hover:text-white transition-colors">
                  <f.icon size={28} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{f.title}</h3>
                <p className="text-gray-600 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* About App */}
        <section className="bg-gray-900 rounded-[48px] p-8 md:p-16 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-[120px] opacity-20" />
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h2 className="text-4xl font-black leading-tight">Ứng dụng TeenTask - Người bạn đồng hành số.</h2>
              <p className="text-gray-400 text-lg leading-relaxed">
                Được thiết kế với giao diện hiện đại, tối ưu trải nghiệm người dùng, ứng dụng TeenTask cho phép bạn quản lý hồ sơ năng lực, theo dõi tiến độ công việc và kết nối trực tiếp với các nhà tuyển dụng uy tín chỉ bằng vài thao tác chạm.
              </p>
              <ul className="space-y-4">
                {['Tìm kiếm việc làm & kiến tập thông minh', 'Hệ thống tin nhắn thời gian thực', 'Giám sát an toàn từ phụ huynh', 'Hồ sơ năng lực điện tử'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-300">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-[32px] p-4 shadow-2xl rotate-3">
                <div className="bg-white rounded-[24px] aspect-[9/16] overflow-hidden">
                  <img 
                    src="https://picsum.photos/seed/teentask/400/700" 
                    alt="App Preview" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Survey CTA */}
        <section className="text-center py-12 space-y-8">
          <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl font-black text-gray-900">Ý kiến của bạn rất quan trọng!</h2>
            <p className="text-gray-600">
              Hãy giúp chúng tôi hoàn thiện dự án bằng cách dành 2 phút tham gia khảo sát ngắn này.
            </p>
          </div>
          
          <button 
            onClick={() => navigate('/survey')}
            className="inline-flex items-center gap-3 px-10 py-5 bg-[#1877F2] text-white rounded-full font-black text-lg shadow-xl shadow-blue-200 hover:bg-[#166FE5] hover:scale-105 transition-all active:scale-95"
          >
            Khảo sát dự án TeenTask
            <ArrowRight size={24} />
          </button>
        </section>
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 py-12 border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#1877F2] rounded-full flex items-center justify-center">
              <GraduationCap size={16} className="text-white" />
            </div>
            <span className="font-black text-[#1877F2] tracking-tighter">TEENTASK</span>
          </div>
          <p className="text-gray-400 text-sm">© 2026 TeenTask Project. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

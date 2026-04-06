import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Send, Trash2, CheckCircle2, Loader2, Star } from 'lucide-react';
import { cn } from '../lib/utils';
import { db, handleFirestoreError, OperationType } from './FirebaseProvider';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function SurveyForm() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    ageGroup: '',
    userRole: '',
    platform: '',
    easeOfUse: 0,
    designStyle: 0,
    technicalIssues: '',
    usefulFeature: '',
    isLookingFor: '',
    recommendScore: 0,
    improvement: '',
    email: ''
  });

  const ageGroups = [
    'Từ 10 đến 17 tuổi / From 10 to 17 years old',
    'Từ 18 đến 25 tuổi / From 18 to 25 years old',
    'Từ 26 đến 40 tuổi / From 26 to 40 years old',
    'Từ 41 tuổi trở lên / 41 years old and above'
  ];

  const userRoles = [
    'Học sinh / Student',
    'Phụ huynh / Parent',
    'Doanh nghiệp / Mentor / Business / Mentor',
    'Người dùng thông thường / General user'
  ];

  const platforms = [
    'Ứng dụng di động / Mobile app',
    'Giao diện web / Web interface',
    'Cả hai / Both'
  ];

  const technicalIssuesOptions = [
    'Không gặp lỗi nào / No issues at all',
    'Gặp 1–2 lỗi nhỏ / Encountered 1–2 minor bugs',
    'Gặp nhiều lỗi, ảnh hưởng đến trải nghiệm / Encountered many bugs affecting my experience',
    'Không thể sử dụng được do lỗi / Could not use due to errors'
  ];

  const features7A = [
    'Feed việc làm theo thẻ card, có badge HOT / Job feed with card display and HOT badges',
    'Thanh tiến độ slot tuyển dụng (FOMO effect) / Recruitment slot progress bar (FOMO effect)',
    'Bộ lọc tìm việc theo kỹ năng và khu vực / Job filter by skill and location',
    'Đặt vé kiến tập Job Shadowing / Job Shadowing booking',
    'Hệ thống huy hiệu và điểm uy tín / Badge and trust score system'
  ];

  const features7B = [
    'Nhận email xác nhận trước khi con ứng tuyển / Receiving confirmation email before child applies',
    'Nút Đồng ý / Từ chối đơn ứng tuyển của con / Approve/Reject button for child\'s applications',
    'Thông tin doanh nghiệp được xác minh / Verified business information',
    'Theo dõi tiến độ công việc của con / Tracking child\'s job progress'
  ];

  const features7C = [
    'Đăng tin tuyển dụng nhanh / Quick job posting',
    'Xem và duyệt hồ sơ ứng viên (Teen CV) / View and review applicant profiles (Teen CV)',
    'Bán suất kiến tập Job Shadowing / Selling Job Shadowing slots',
    'Thống kê số lượt xem và ứng tuyển / View and application analytics',
    'Banner quảng cáo trên trang chủ / Homepage advertising banner'
  ];

  const lookingForOptions = [
    'Có, đúng thứ tôi cần / Yes, exactly what I need',
    'Có, nhưng cần cải thiện thêm / Yes, but needs improvement',
    'Chưa chắc / Not sure',
    'Không phù hợp với nhu cầu của tôi / Does not meet my needs'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'survey_responses'), {
        ...formData,
        surveyName: 'Khảo sát Dự án "Teen Task"',
        submittedAt: serverTimestamp()
      });
      setSubmitted(true);
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'survey_responses');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      ageGroup: '',
      userRole: '',
      platform: '',
      easeOfUse: 0,
      designStyle: 0,
      technicalIssues: '',
      usefulFeature: '',
      isLookingFor: '',
      recommendScore: 0,
      improvement: '',
      email: ''
    });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F0EBF8] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-2xl shadow-xl p-12 text-center space-y-6"
        >
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 size={48} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Cảm ơn bạn!</h2>
          <p className="text-gray-600 leading-relaxed">
            Câu trả lời của bạn đã được ghi lại. Chúng tôi sẽ quay lại trang chủ trong giây lát...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0EBF8] pb-12 font-sans">
      {/* Header Banner */}
      <div className="h-3 bg-[#673AB7] w-full sticky top-0 z-50" />
      
      <div className="max-w-3xl mx-auto px-4 pt-8 space-y-4">
        {/* Title Card */}
        <div className="bg-white rounded-xl shadow-sm border-t-[10px] border-[#673AB7] overflow-hidden">
          <div className="p-6 space-y-4">
            <h1 className="text-3xl font-bold text-gray-900">Khảo sát Dự án "Teen Task" / Teen Task Project Survey</h1>
            <p className="text-gray-600">Chỉ mất khoảng 2 phút để hoàn thành! / Only takes about 2 minutes to complete!</p>
            <div className="h-[1px] bg-gray-200 w-full" />
            <p className="text-sm text-red-600 font-medium">* Biểu thị câu hỏi bắt buộc</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Q1: Age Group */}
          <QuestionCard 
            title="Câu 1: Hiện tại, bạn nằm trong lứa tuổi nào? / Which age group do you fall into?" 
            required
          >
            <div className="space-y-3">
              {ageGroups.map((option) => (
                <label key={option} className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="radio" 
                    name="ageGroup" 
                    required
                    checked={formData.ageGroup === option}
                    onChange={() => setFormData({...formData, ageGroup: option})}
                    className="w-5 h-5 text-[#673AB7] focus:ring-[#673AB7]" 
                  />
                  <span className="text-sm text-gray-700 group-hover:text-black transition-colors">{option}</span>
                </label>
              ))}
            </div>
          </QuestionCard>

          {/* Q2: User Role */}
          <QuestionCard 
            title="Câu 2: Bạn là? / You are a?" 
            required
          >
            <div className="space-y-3">
              {userRoles.map((option) => (
                <label key={option} className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="radio" 
                    name="userRole" 
                    required
                    checked={formData.userRole === option}
                    onChange={() => {
                      setFormData({...formData, userRole: option, usefulFeature: ''});
                    }}
                    className="w-5 h-5 text-[#673AB7] focus:ring-[#673AB7]" 
                  />
                  <span className="text-sm text-gray-700 group-hover:text-black transition-colors">{option}</span>
                </label>
              ))}
            </div>
          </QuestionCard>

          {/* Q3: Platform */}
          <QuestionCard 
            title="Câu 3: Bạn đã trải nghiệm TeenTask trên nền tảng nào? / Which platform did you use to experience TeenTask?" 
            required
          >
            <div className="space-y-3">
              {platforms.map((option) => (
                <label key={option} className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="radio" 
                    name="platform" 
                    required
                    checked={formData.platform === option}
                    onChange={() => setFormData({...formData, platform: option})}
                    className="w-5 h-5 text-[#673AB7] focus:ring-[#673AB7]" 
                  />
                  <span className="text-sm text-gray-700 group-hover:text-black transition-colors">{option}</span>
                </label>
              ))}
            </div>
          </QuestionCard>

          {/* Q4: Ease of Use */}
          <QuestionCard 
            title="Câu 4: Giao diện TeenTask có dễ sử dụng không? / How easy is the TeenTask interface to use?" 
            required
            description="(1 = Rất khó / Very difficult — 5 = Rất dễ / Very easy)"
          >
            <div className="flex items-center gap-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFormData({...formData, easeOfUse: star})}
                  className={cn(
                    "flex flex-col items-center gap-1 p-2 rounded-lg transition-all",
                    formData.easeOfUse === star ? "bg-purple-50 text-[#673AB7]" : "text-gray-400 hover:text-purple-400"
                  )}
                >
                  <Star size={24} fill={formData.easeOfUse >= star ? "currentColor" : "none"} />
                  <span className="text-xs font-bold">{star}</span>
                </button>
              ))}
            </div>
          </QuestionCard>

          {/* Q5: Design Style */}
          <QuestionCard 
            title="Câu 5: Màu sắc và phong cách thiết kế của TeenTask có phù hợp với bạn không? / Do the colors and design style of TeenTask suit you?" 
            required
            description="(1 = Hoàn toàn không phù hợp / Not suitable at all — 5 = Rất phù hợp / Very suitable)"
          >
            <div className="flex items-center gap-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFormData({...formData, designStyle: star})}
                  className={cn(
                    "flex flex-col items-center gap-1 p-2 rounded-lg transition-all",
                    formData.designStyle === star ? "bg-purple-50 text-[#673AB7]" : "text-gray-400 hover:text-purple-400"
                  )}
                >
                  <Star size={24} fill={formData.designStyle >= star ? "currentColor" : "none"} />
                  <span className="text-xs font-bold">{star}</span>
                </button>
              ))}
            </div>
          </QuestionCard>

          {/* Q6: Technical Issues */}
          <QuestionCard 
            title="Câu 6: Bạn có gặp lỗi hoặc sự cố kỹ thuật khi sử dụng không? / Did you encounter any bugs or technical issues?" 
            required
          >
            <div className="space-y-3">
              {technicalIssuesOptions.map((option) => (
                <label key={option} className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="radio" 
                    name="technicalIssues" 
                    required
                    checked={formData.technicalIssues === option}
                    onChange={() => setFormData({...formData, technicalIssues: option})}
                    className="w-5 h-5 text-[#673AB7] focus:ring-[#673AB7]" 
                  />
                  <span className="text-sm text-gray-700 group-hover:text-black transition-colors">{option}</span>
                </label>
              ))}
            </div>
          </QuestionCard>

          {/* Q7: Conditional Features */}
          <AnimatePresence mode="wait">
            {formData.userRole && (
              <motion.div
                key={formData.userRole}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {/* 7A: Students & General Users */}
                {(formData.userRole === 'Học sinh / Student' || formData.userRole === 'Người dùng thông thường / General user') && (
                  <QuestionCard 
                    title="Câu 7A — Dành cho Học sinh & Người dùng thông thường / For Students & General users: Tính năng nào bạn thấy hữu ích nhất? / Which feature did you find most useful?" 
                    required
                  >
                    <div className="space-y-3">
                      {features7A.map((option) => (
                        <label key={option} className="flex items-center gap-3 cursor-pointer group">
                          <input 
                            type="radio" 
                            name="usefulFeature" 
                            required
                            checked={formData.usefulFeature === option}
                            onChange={() => setFormData({...formData, usefulFeature: option})}
                            className="w-5 h-5 text-[#673AB7] focus:ring-[#673AB7]" 
                          />
                          <span className="text-sm text-gray-700 group-hover:text-black transition-colors">{option}</span>
                        </label>
                      ))}
                    </div>
                  </QuestionCard>
                )}

                {/* 7B: Parents */}
                {formData.userRole === 'Phụ huynh / Parent' && (
                  <QuestionCard 
                    title="Câu 7B — Dành cho Phụ huynh / For Parents: Tính năng nào khiến bạn an tâm nhất khi con sử dụng TeenTask? / Which feature made you feel most reassured about your child using TeenTask?" 
                    required
                  >
                    <div className="space-y-3">
                      {features7B.map((option) => (
                        <label key={option} className="flex items-center gap-3 cursor-pointer group">
                          <input 
                            type="radio" 
                            name="usefulFeature" 
                            required
                            checked={formData.usefulFeature === option}
                            onChange={() => setFormData({...formData, usefulFeature: option})}
                            className="w-5 h-5 text-[#673AB7] focus:ring-[#673AB7]" 
                          />
                          <span className="text-sm text-gray-700 group-hover:text-black transition-colors">{option}</span>
                        </label>
                      ))}
                    </div>
                  </QuestionCard>
                )}

                {/* 7C: Businesses */}
                {formData.userRole === 'Doanh nghiệp / Mentor / Business / Mentor' && (
                  <QuestionCard 
                    title="Câu 7C — Dành cho Doanh nghiệp / For Businesses: Tính năng nào hữu ích nhất với bạn khi tuyển dụng trên TeenTask? / Which feature was most useful for recruiting on TeenTask?" 
                    required
                  >
                    <div className="space-y-3">
                      {features7C.map((option) => (
                        <label key={option} className="flex items-center gap-3 cursor-pointer group">
                          <input 
                            type="radio" 
                            name="usefulFeature" 
                            required
                            checked={formData.usefulFeature === option}
                            onChange={() => setFormData({...formData, usefulFeature: option})}
                            className="w-5 h-5 text-[#673AB7] focus:ring-[#673AB7]" 
                          />
                          <span className="text-sm text-gray-700 group-hover:text-black transition-colors">{option}</span>
                        </label>
                      ))}
                    </div>
                  </QuestionCard>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Q8: Looking For */}
          <QuestionCard 
            title="Câu 8: Dịch vụ của TeenTask có phải là thứ bạn đang tìm kiếm không? / Is TeenTask's service something you have been looking for?" 
            required
          >
            <div className="space-y-3">
              {lookingForOptions.map((option) => (
                <label key={option} className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="radio" 
                    name="isLookingFor" 
                    required
                    checked={formData.isLookingFor === option}
                    onChange={() => setFormData({...formData, isLookingFor: option})}
                    className="w-5 h-5 text-[#673AB7] focus:ring-[#673AB7]" 
                  />
                  <span className="text-sm text-gray-700 group-hover:text-black transition-colors">{option}</span>
                </label>
              ))}
            </div>
          </QuestionCard>

          {/* Q9: NPS */}
          <QuestionCard 
            title="Câu 9: Trên thang điểm từ 0 đến 10, bạn có sẵn sàng giới thiệu TeenTask cho bạn bè không? / On a scale of 0 to 10, how likely are you to recommend TeenTask to a friend?" 
            required
            description="(0 = Chắc chắn không / Definitely not — 10 = Chắc chắn có / Definitely yes)"
          >
            <div className="flex flex-wrap gap-2 justify-between">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                <button
                  key={score}
                  type="button"
                  onClick={() => setFormData({...formData, recommendScore: score})}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                    formData.recommendScore === score ? "bg-[#673AB7] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  {score}
                </button>
              ))}
            </div>
          </QuestionCard>

          {/* Q10: Improvement */}
          <QuestionCard 
            title="Câu 10: Điều bạn muốn TeenTask cải thiện nhất là gì? / What do you most want TeenTask to improve?" 
            required
          >
            <textarea 
              required
              value={formData.improvement}
              onChange={(e) => setFormData({...formData, improvement: e.target.value})}
              placeholder="Câu trả lời của bạn / Your answer"
              className="w-full border-b border-gray-300 focus:border-[#673AB7] focus:border-b-2 outline-none py-2 text-sm transition-all resize-none bg-transparent"
              rows={1}
            />
          </QuestionCard>

          {/* Q11: Optional Email */}
          <QuestionCard 
            title="Câu 11 (Không bắt buộc / Optional): Để lại gmail của bạn tại đây nếu bạn muốn nhận thông báo khi Teentask ra mắt chính thức / Leave your Gmail here if you want to be notified when Teentask officially launches"
          >
            <input 
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              placeholder="Câu trả lời của bạn / Your answer"
              className="w-full border-b border-gray-300 focus:border-[#673AB7] focus:border-b-2 outline-none py-2 text-sm transition-all bg-transparent"
            />
          </QuestionCard>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center gap-4">
              <button 
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-[#673AB7] text-white rounded font-bold hover:bg-[#5E35B1] shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    Đang gửi...
                    <Loader2 size={16} className="animate-spin" />
                  </>
                ) : (
                  <>
                    Gửi
                    <Send size={16} />
                  </>
                )}
              </button>
              <button 
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-[#673AB7] font-bold hover:bg-purple-50 rounded transition-all flex items-center gap-2"
              >
                Xóa hết câu trả lời
                <Trash2 size={16} />
              </button>
            </div>
            
            <button 
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 text-gray-500 hover:text-gray-900 transition-all flex items-center gap-2 text-sm"
            >
              <ArrowLeft size={16} />
              Quay lại
            </button>
          </div>
        </form>

        <div className="text-center py-8 space-y-2">
          <p className="text-xs text-gray-500">Nội dung này không phải do Google tạo ra hay xác nhận.</p>
          <p className="text-sm font-bold text-gray-600">Google Biểu mẫu</p>
        </div>
      </div>
    </div>
  );
}

function QuestionCard({ title, children, required, description }: { title: string, children: React.ReactNode, required?: boolean, description?: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
      <div className="space-y-2">
        <h3 className="text-base text-gray-900 leading-relaxed">
          {title} {required && <span className="text-red-500">*</span>}
        </h3>
        {description && <p className="text-xs text-gray-500">{description}</p>}
      </div>
      {children}
    </div>
  );
}

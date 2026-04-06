import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from './FirebaseProvider';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { ShieldCheck, BarChart3, PieChart, MessageSquare, Loader2, Sparkles, ChevronRight, ArrowLeft, Users, Calendar, Download, Copy, CheckCircle2, FileText, LayoutDashboard, Target, Lightbulb, Megaphone, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from "@google/genai";
import { getGeminiApiKey } from "../lib/gemini";
import Markdown from 'react-markdown';
import { cn } from '../lib/utils';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart as RePieChart, Pie, Cell, Legend 
} from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface SurveyResponse {
  id: string;
  surveyName: string;
  ageGroup: string;
  userRole: string;
  platform: string;
  easeOfUse: number;
  designStyle: number;
  technicalIssues: string;
  usefulFeature: string;
  isLookingFor: string;
  recommendScore: number;
  improvement: string;
  email?: string;
  submittedAt: any;
}

interface AIAnalysis {
  summary: string;
  quantitative: string;
  qualitative: string;
  recommendations: string;
  mediaHighlights: string[];
  mediaQuote: string;
}

export default function SurveyAdmin() {
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSurvey, setSelectedSurvey] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [showPresentation, setShowPresentation] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    fetchResponses();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showPresentation) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        setActiveSlide(prev => Math.min(prev + 1, 4));
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        setActiveSlide(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Escape') {
        setShowPresentation(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPresentation]);

  const fetchResponses = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'survey_responses'), orderBy('submittedAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SurveyResponse));
      setResponses(data);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'survey_responses');
    } finally {
      setLoading(false);
    }
  };

  const analyzeWithAI = async () => {
    if (responses.length === 0) return;
    setIsAnalyzing(true);
    setAnalysis(null);
    setActiveSlide(0);
    try {
      const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });
      
      const analysisData = responses.slice(0, 50).map(r => ({
        age: r.ageGroup,
        role: r.userRole,
        platform: r.platform,
        easeOfUse: r.easeOfUse,
        designStyle: r.designStyle,
        issues: r.technicalIssues,
        feature: r.usefulFeature,
        lookingFor: r.isLookingFor,
        nps: r.recommendScore,
        improvement: r.improvement
      }));

      const prompt = `
        Bạn là một chuyên gia phân tích dữ liệu và chiến lược truyền thông cao cấp. 
        Hãy phân tích các kết quả khảo sát cho dự án "Teen Task".
        
        Dữ liệu khảo sát (${analysisData.length} phản hồi):
        ${JSON.stringify(analysisData)}

        Hãy trả về kết quả dưới dạng JSON với cấu trúc sau:
        {
          "summary": "Tóm tắt điều hành ngắn gọn",
          "quantitative": "Phân tích sâu về các con số và xu hướng",
          "qualitative": "Phấu hiểu về tâm lý và nhu cầu người dùng",
          "recommendations": "Các đề xuất chiến lược cụ thể",
          "mediaHighlights": ["Điểm nhấn 1", "Điểm nhấn 2", "Điểm nhấn 3"],
          "mediaQuote": "Câu trích dẫn đắt giá nhất"
        }

        Yêu cầu:
        - Nội dung chuyên nghiệp, khách quan, sẵn sàng cho báo cáo truyền thông.
        - Sử dụng Markdown trong các trường text để định dạng đẹp.
        - Trả về DUY NHẤT đối tượng JSON, không có văn bản thừa.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              quantitative: { type: Type.STRING },
              qualitative: { type: Type.STRING },
              recommendations: { type: Type.STRING },
              mediaHighlights: { type: Type.ARRAY, items: { type: Type.STRING } },
              mediaQuote: { type: Type.STRING }
            },
            required: ["summary", "quantitative", "qualitative", "recommendations", "mediaHighlights", "mediaQuote"]
          }
        }
      });

      const result = JSON.parse(response.text || "{}");
      setAnalysis(result);
    } catch (error: any) {
      console.error("AI Analysis Error:", error);
      // Fallback to simple error display if JSON parsing fails
      setAnalysis({
        summary: "Đã có lỗi xảy ra khi phân tích dữ liệu với AI. Vui lòng thử lại sau.",
        quantitative: "",
        qualitative: "",
        recommendations: "",
        mediaHighlights: [],
        mediaQuote: ""
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const surveyNames = Array.from(new Set(responses.map(r => r.surveyName)));

  const handleCopy = () => {
    if (!analysis) return;
    const textToCopy = `
      BÁO CÁO CHIẾN LƯỢC TEEN TASK
      
      I. TÓM TẮT ĐIỀU HÀNH
      ${analysis.summary}
      
      II. PHÂN TÍCH ĐỊNH LƯỢNG
      ${analysis.quantitative}
      
      III. THẤU HIỂU ĐỊNH TÍNH
      ${analysis.qualitative}
      
      IV. ĐỀ XUẤT CHIẾN LƯỢC
      ${analysis.recommendations}
      
      V. ĐIỂM NHẤN TRUYỀN THÔNG
      ${analysis.mediaHighlights.join('\n')}
      
      TRÍCH DẪN: "${analysis.mediaQuote}"
    `;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadPDF = async () => {
    if (!analysis) return;
    setIsDownloading(true);
    try {
      const pdf = new jsPDF('l', 'mm', 'a4');
      const slides = document.querySelectorAll('.presentation-slide');
      
      for (let i = 0; i < slides.length; i++) {
        const canvas = await html2canvas(slides[i] as HTMLElement, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });
        
        const imgData = canvas.toDataURL('image/png');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      }
      
      pdf.save(`Bao-cao-TeenTask-${selectedSurvey}.pdf`);
    } catch (error) {
      console.error("PDF Export Error:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  // Stats Calculation for Charts
  const getRoleData = () => {
    const roles: any = {};
    responses.forEach(r => {
      const role = r.userRole?.split('/')[0] || 'Khác';
      roles[role] = (roles[role] || 0) + 1;
    });
    return Object.entries(roles).map(([name, value]) => ({ name, value }));
  };

  const getAgeData = () => {
    const ages: any = {};
    responses.forEach(r => {
      const age = r.ageGroup?.split('/')[0] || 'Khác';
      ages[age] = (ages[age] || 0) + 1;
    });
    return Object.entries(ages).map(([name, value]) => ({ name, value }));
  };

  const getSatisfactionData = () => {
    return [
      { name: 'Dễ sử dụng', value: (responses.reduce((acc, r) => acc + (r.easeOfUse || 0), 0) / responses.length).toFixed(1) },
      { name: 'Thiết kế', value: (responses.reduce((acc, r) => acc + (r.designStyle || 0), 0) / responses.length).toFixed(1) },
      { name: 'NPS (x10)', value: (responses.reduce((acc, r) => acc + (r.recommendScore || 0), 0) / responses.length).toFixed(1) },
    ];
  };

  const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="animate-spin text-[#1877F2]" size={40} />
        <p className="text-gray-500 font-medium">Đang tải dữ liệu khảo sát...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-2 sm:p-6 space-y-4 sm:space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-100 rounded-2xl text-purple-600">
            <PieChart size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">KẾT QUẢ KHẢO SÁT</h1>
            <p className="text-gray-500 text-sm">Theo dõi và phân tích ý kiến người dùng</p>
          </div>
        </div>
      </div>

      {!selectedSurvey ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {surveyNames.length === 0 ? (
            <div className="col-span-full bg-white rounded-3xl p-12 text-center border border-dashed border-gray-300">
              <MessageSquare className="mx-auto text-gray-300 mb-4" size={48} />
              <p className="text-gray-500">Chưa có dữ liệu khảo sát nào được gửi.</p>
            </div>
          ) : (
            surveyNames.map(name => (
              <motion.button
                key={name}
                whileHover={{ y: -5 }}
                onClick={() => setSelectedSurvey(name)}
                className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 text-left space-y-4 hover:shadow-xl transition-all group"
              >
                <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <BarChart3 size={24} />
                </div>
                <h3 className="font-bold text-gray-900 leading-tight">{name}</h3>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Users size={14} />
                    {responses.filter(r => r.surveyName === name).length} phản hồi
                  </span>
                  <ChevronRight size={16} />
                </div>
              </motion.button>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-8">
          <button 
            onClick={() => { setSelectedSurvey(null); setAnalysis(null); }}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-bold transition-colors"
          >
            <ArrowLeft size={20} />
            Quay lại danh sách
          </button>

          <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-gray-900">{selectedSurvey}</h2>
                <p className="text-gray-500">Tổng hợp kết quả chi tiết</p>
              </div>
              <button
                onClick={analyzeWithAI}
                disabled={isAnalyzing}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-purple-100 hover:scale-105 transition-all active:scale-95 disabled:opacity-50"
              >
                {isAnalyzing ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                Phân tích kết quả với AI
              </button>
            </div>

            <div className="p-4 sm:p-8">
              <AnimatePresence mode="wait">
                {analysis ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                  >
                    {/* Presentation Header */}
                    <div className="flex items-center justify-between bg-slate-900 p-8 rounded-[40px] border border-white/10 shadow-2xl">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-primary rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-primary/30">
                          <LayoutDashboard size={32} strokeWidth={2.5} />
                        </div>
                        <div>
                          <h3 className="text-2xl font-black text-white m-0 tracking-tight">BÁO CÁO CHIẾN LƯỢC TEEN TASK</h3>
                          <p className="text-slate-400 text-xs font-black uppercase tracking-[0.3em] mt-2">Media & Executive Presentation Mode</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setShowPresentation(true)}
                          className="flex items-center gap-3 px-6 py-3 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20"
                        >
                          <LayoutDashboard size={18} />
                          Trình chiếu Slide
                        </button>
                        <button
                          onClick={handleCopy}
                          className="flex items-center gap-3 px-6 py-3 bg-white/5 text-white rounded-2xl font-black text-xs uppercase tracking-widest border border-white/10 hover:bg-white/10 transition-all active:scale-95"
                        >
                          {copied ? <CheckCircle2 size={18} className="text-emerald-500" /> : <Copy size={18} />}
                          {copied ? "Đã sao chép" : "Sao chép"}
                        </button>
                        <button
                          onClick={() => setAnalysis(null)}
                          className="px-6 py-3 bg-white/5 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest border border-white/10 hover:bg-white/10 transition-all active:scale-95"
                        >
                          Đóng
                        </button>
                      </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex items-center gap-2 bg-white/5 p-2 rounded-[32px] border border-white/5 overflow-x-auto no-scrollbar">
                      {[
                        { icon: FileText, label: 'Tóm tắt' },
                        { icon: BarChart3, label: 'Số liệu' },
                        { icon: Lightbulb, label: 'Thấu hiểu' },
                        { icon: Target, label: 'Chiến lược' },
                        { icon: Megaphone, label: 'Truyền thông' }
                      ].map((tab, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveSlide(idx)}
                          className={cn(
                            "flex items-center gap-3 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap",
                            activeSlide === idx 
                              ? "bg-primary text-white shadow-xl shadow-primary/20" 
                              : "text-slate-500 hover:text-white hover:bg-white/5"
                          )}
                        >
                          <tab.icon size={16} strokeWidth={3} />
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Slide Content */}
                    <div className="min-h-[500px] bg-white p-12 rounded-[48px] border border-slate-100 shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[120px] -z-10"></div>
                      <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/5 rounded-full blur-[100px] -z-10"></div>

                      <AnimatePresence mode="wait">
                        <motion.div
                          key={activeSlide}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="h-full"
                        >
                          {activeSlide === 0 && (
                            <div className="space-y-10">
                              <div className="space-y-4">
                                <span className="px-5 py-2 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.3em] rounded-full">Executive Summary</span>
                                <h4 className="text-4xl font-black text-slate-900 tracking-tighter leading-tight">Tổng quan chiến lược</h4>
                              </div>
                              <div className="markdown-body prose prose-slate max-w-none prose-p:text-lg prose-p:text-slate-600 prose-p:leading-relaxed prose-strong:text-primary text-slate-600">
                                <Markdown>{analysis.summary}</Markdown>
                              </div>
                            </div>
                          )}

                          {activeSlide === 1 && (
                            <div className="space-y-12">
                              <div className="space-y-4">
                                <span className="px-5 py-2 bg-emerald-100 text-emerald-600 text-[10px] font-black uppercase tracking-[0.3em] rounded-full">Quantitative Analysis</span>
                                <h4 className="text-4xl font-black text-slate-900 tracking-tighter leading-tight">Dữ liệu & Thống kê</h4>
                              </div>
                              
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                <div className="space-y-6">
                                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Phân bổ đối tượng</p>
                                  <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                      <RePieChart>
                                        <Pie
                                          data={getRoleData()}
                                          innerRadius={60}
                                          outerRadius={100}
                                          paddingAngle={5}
                                          dataKey="value"
                                        >
                                          {getRoleData().map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                          ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                      </RePieChart>
                                    </ResponsiveContainer>
                                  </div>
                                </div>
                                <div className="space-y-6">
                                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Chỉ số hài lòng trung bình</p>
                                  <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                      <BarChart data={getSatisfactionData()}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900 }} />
                                        <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900 }} />
                                        <Tooltip cursor={{ fill: '#f8fafc' }} />
                                        <Bar dataKey="value" fill="#4F46E5" radius={[10, 10, 0, 0]} barSize={40} />
                                      </BarChart>
                                    </ResponsiveContainer>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100">
                                <div className="markdown-body prose prose-slate max-w-none text-slate-600">
                                  <Markdown>{analysis.quantitative}</Markdown>
                                </div>
                              </div>
                            </div>
                          )}

                          {activeSlide === 2 && (
                            <div className="space-y-10">
                              <div className="space-y-4">
                                <span className="px-5 py-2 bg-amber-100 text-amber-600 text-[10px] font-black uppercase tracking-[0.3em] rounded-full">Qualitative Insights</span>
                                <h4 className="text-4xl font-black text-slate-900 tracking-tighter leading-tight">Thấu hiểu người dùng</h4>
                              </div>
                              <div className="markdown-body prose prose-slate max-w-none prose-p:text-lg prose-p:text-slate-600 prose-p:leading-relaxed prose-strong:text-amber-600 text-slate-600">
                                <Markdown>{analysis.qualitative}</Markdown>
                              </div>
                            </div>
                          )}

                          {activeSlide === 3 && (
                            <div className="space-y-10">
                              <div className="space-y-4">
                                <span className="px-5 py-2 bg-purple-100 text-purple-600 text-[10px] font-black uppercase tracking-[0.3em] rounded-full">Strategic Recommendations</span>
                                <h4 className="text-4xl font-black text-slate-900 tracking-tighter leading-tight">Đề xuất & Hành động</h4>
                              </div>
                              <div className="markdown-body prose prose-slate max-w-none prose-p:text-lg prose-p:text-slate-600 prose-p:leading-relaxed prose-strong:text-purple-600 text-slate-600">
                                <Markdown>{analysis.recommendations}</Markdown>
                              </div>
                            </div>
                          )}

                          {activeSlide === 4 && (
                            <div className="space-y-12">
                              <div className="space-y-4">
                                <span className="px-5 py-2 bg-rose-100 text-rose-600 text-[10px] font-black uppercase tracking-[0.3em] rounded-full">Media & PR Highlights</span>
                                <h4 className="text-4xl font-black text-slate-900 tracking-tighter leading-tight">Điểm nhấn truyền thông</h4>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {analysis.mediaHighlights.map((highlight, idx) => (
                                  <div key={idx} className="p-8 bg-rose-50 rounded-[32px] border border-rose-100 space-y-4">
                                    <div className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-200">
                                      <span className="font-black text-xl">{idx + 1}</span>
                                    </div>
                                    <p className="font-black text-slate-900 leading-snug">{highlight}</p>
                                  </div>
                                ))}
                              </div>

                              <div className="relative p-12 bg-slate-950 rounded-[48px] overflow-hidden text-center">
                                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 opacity-50"></div>
                                <div className="relative z-10 space-y-6">
                                  <p className="text-rose-500 text-[10px] font-black uppercase tracking-[0.5em]">Key Quote</p>
                                  <h5 className="text-3xl font-black text-white italic tracking-tight leading-tight">
                                    "{analysis.mediaQuote}"
                                  </h5>
                                </div>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      </AnimatePresence>

                      {/* Pagination Controls */}
                      <div className="mt-16 flex items-center justify-between border-t border-slate-100 pt-8">
                        <button
                          disabled={activeSlide === 0}
                          onClick={() => setActiveSlide(prev => prev - 1)}
                          className="flex items-center gap-3 px-6 py-3 text-slate-400 hover:text-primary disabled:opacity-20 transition-all font-black text-[10px] uppercase tracking-widest"
                        >
                          <ChevronLeft size={20} strokeWidth={3} />
                          Trang trước
                        </button>
                        <div className="flex gap-2">
                          {[0, 1, 2, 3, 4].map(i => (
                            <div key={i} className={cn("w-2 h-2 rounded-full transition-all", activeSlide === i ? "bg-primary w-8" : "bg-slate-200")} />
                          ))}
                        </div>
                        <button
                          disabled={activeSlide === 4}
                          onClick={() => setActiveSlide(prev => prev + 1)}
                          className="flex items-center gap-3 px-6 py-3 text-slate-400 hover:text-primary disabled:opacity-20 transition-all font-black text-[10px] uppercase tracking-widest"
                        >
                          Trang sau
                          <ChevronRight size={20} strokeWidth={3} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="space-y-8">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                      <StatCard label="Tổng phản hồi" value={responses.length} icon={Users} color="blue" />
                      <StatCard 
                        label="Điểm NPS TB" 
                        value={(responses.reduce((acc, r) => acc + (r.recommendScore || 0), 0) / responses.length).toFixed(1)} 
                        icon={PieChart} 
                        color="green" 
                      />
                      <StatCard 
                        label="Dễ sử dụng (TB)" 
                        value={(responses.reduce((acc, r) => acc + (r.easeOfUse || 0), 0) / responses.length).toFixed(1)} 
                        icon={BarChart3} 
                        color="purple" 
                      />
                      <StatCard 
                        label="Phản hồi mới nhất" 
                        value={responses[0]?.submittedAt?.toDate().toLocaleDateString('vi-VN') || 'N/A'} 
                        icon={Calendar} 
                        color="orange" 
                      />
                    </div>

                    {/* Detailed Responses Table */}
                    <div className="overflow-x-auto rounded-2xl border border-gray-100 -mx-2 sm:mx-0">
                      <div className="min-w-[600px]">
                        <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="p-4 font-bold text-xs text-gray-500 uppercase">Vai trò</th>
                            <th className="p-4 font-bold text-xs text-gray-500 uppercase">Độ tuổi</th>
                            <th className="p-4 font-bold text-xs text-gray-500 uppercase">Tính năng hữu ích</th>
                            <th className="p-4 font-bold text-xs text-gray-500 uppercase">Cải thiện</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {responses.map(r => (
                            <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                              <td className="p-4">
                                <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold uppercase">
                                  {r.userRole?.split('/')[0]}
                                </span>
                              </td>
                              <td className="p-4 text-sm text-gray-600">{r.ageGroup?.split('/')[0]}</td>
                              <td className="p-4 text-sm text-gray-600 max-w-xs truncate">{r.usefulFeature}</td>
                              <td className="p-4 text-sm text-gray-600 max-w-xs truncate">{r.improvement}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}

      {/* Presentation Mode Overlay */}
      <AnimatePresence>
        {showPresentation && analysis && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-950 flex flex-col"
          >
            {/* Presentation Toolbar */}
            <div className="flex items-center justify-between p-6 bg-slate-900/50 backdrop-blur-xl border-b border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white">
                  <LayoutDashboard size={20} />
                </div>
                <div>
                  <h4 className="text-white font-black text-sm tracking-tight uppercase">Teen Task Presentation</h4>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Slide {activeSlide + 1} / 5</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={downloadPDF}
                  disabled={isDownloading}
                  className="flex items-center gap-2 px-6 py-2.5 bg-white/10 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white/20 transition-all disabled:opacity-50"
                >
                  {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                  {isDownloading ? "Đang tạo PDF..." : "Tải PDF"}
                </button>
                <button
                  onClick={() => setShowPresentation(false)}
                  className="px-6 py-2.5 bg-rose-500/10 text-rose-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-500/20 transition-all"
                >
                  Thoát trình chiếu
                </button>
              </div>
            </div>

            {/* Presentation Canvas */}
            <div className="flex-1 overflow-hidden relative flex items-center justify-center p-12">
              <div className="w-full max-w-6xl aspect-[16/9] bg-white rounded-[40px] shadow-2xl shadow-black/50 overflow-hidden relative presentation-slide">
                {/* Slide Background Elements */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10"></div>
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[100px] -z-10"></div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeSlide}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="h-full p-20 flex flex-col"
                  >
                    {activeSlide === 0 && (
                      <div className="flex-1 flex flex-col justify-center items-center text-center space-y-8">
                        <motion.span 
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.2 }}
                          className="px-6 py-2 bg-primary/10 text-primary text-xs font-black uppercase tracking-[0.4em] rounded-full"
                        >
                          Strategic Pitch Deck
                        </motion.span>
                        <motion.h2 
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.3 }}
                          className="text-7xl font-black text-slate-900 tracking-tighter leading-[1.1]"
                        >
                          Teen Task: <br />
                          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Tương lai của Kiến tập</span>
                        </motion.h2 >
                        <motion.p 
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.4 }}
                          className="text-2xl text-slate-500 font-medium max-w-2xl"
                        >
                          Báo cáo phân tích thị trường và thấu hiểu người dùng dựa trên dữ liệu thực tế.
                        </motion.p>
                      </div>
                    )}

                    {activeSlide === 1 && (
                      <div className="h-full flex flex-col space-y-12">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <span className="text-emerald-500 text-xs font-black uppercase tracking-widest">Slide 02</span>
                            <h3 className="text-5xl font-black text-slate-900 tracking-tight">Số liệu & Thống kê</h3>
                          </div>
                          <div className="flex gap-4">
                            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 text-center min-w-[140px]">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tổng phản hồi</p>
                              <p className="text-3xl font-black text-primary">{responses.length}</p>
                            </div>
                            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 text-center min-w-[140px]">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">NPS Score</p>
                              <p className="text-3xl font-black text-emerald-500">{(responses.reduce((acc, r) => acc + (r.recommendScore || 0), 0) / responses.length).toFixed(1)}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex-1 grid grid-cols-2 gap-12">
                          <div className="bg-slate-50/50 p-8 rounded-[32px] border border-slate-100">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Phân bổ đối tượng</p>
                            <ResponsiveContainer width="100%" height="80%">
                              <RePieChart>
                                <Pie data={getRoleData()} innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                                  {getRoleData().map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip />
                                <Legend />
                              </RePieChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="bg-slate-50/50 p-8 rounded-[32px] border border-slate-100">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Chỉ số hài lòng</p>
                            <ResponsiveContainer width="100%" height="80%">
                              <BarChart data={getSatisfactionData()}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900 }} />
                                <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900 }} />
                                <Tooltip cursor={{ fill: '#f8fafc' }} />
                                <Bar dataKey="value" fill="#4F46E5" radius={[10, 10, 0, 0]} barSize={40} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeSlide === 2 && (
                      <div className="h-full flex flex-col space-y-12">
                        <div className="space-y-2">
                          <span className="text-amber-500 text-xs font-black uppercase tracking-widest">Slide 03</span>
                          <h3 className="text-5xl font-black text-slate-900 tracking-tight">Thấu hiểu người dùng</h3>
                        </div>
                        <div className="flex-1 bg-amber-50/30 p-12 rounded-[40px] border border-amber-100 overflow-y-auto">
                          <div className="markdown-body prose prose-slate max-w-none prose-p:text-2xl prose-p:text-slate-600 prose-p:leading-relaxed prose-strong:text-amber-600">
                            <Markdown>{analysis.qualitative}</Markdown>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeSlide === 3 && (
                      <div className="h-full flex flex-col space-y-12">
                        <div className="space-y-2">
                          <span className="text-purple-500 text-xs font-black uppercase tracking-widest">Slide 04</span>
                          <h3 className="text-5xl font-black text-slate-900 tracking-tight">Chiến lược & Hành động</h3>
                        </div>
                        <div className="flex-1 bg-purple-50/30 p-12 rounded-[40px] border border-purple-100 overflow-y-auto">
                          <div className="markdown-body prose prose-slate max-w-none prose-p:text-2xl prose-p:text-slate-600 prose-p:leading-relaxed prose-strong:text-purple-600">
                            <Markdown>{analysis.recommendations}</Markdown>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeSlide === 4 && (
                      <div className="h-full flex flex-col space-y-12">
                        <div className="space-y-2">
                          <span className="text-rose-500 text-xs font-black uppercase tracking-widest">Slide 05</span>
                          <h3 className="text-5xl font-black text-slate-900 tracking-tight">Điểm nhấn Truyền thông</h3>
                        </div>
                        <div className="flex-1 grid grid-cols-3 gap-8">
                          {analysis.mediaHighlights.map((highlight, idx) => (
                            <div key={idx} className="p-10 bg-rose-50 rounded-[40px] border border-rose-100 flex flex-col justify-center space-y-6">
                              <div className="w-16 h-16 bg-rose-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-rose-200">
                                <span className="font-black text-3xl">{idx + 1}</span>
                              </div>
                              <p className="text-2xl font-black text-slate-900 leading-tight">{highlight}</p>
                            </div>
                          ))}
                        </div>
                        <div className="p-10 bg-slate-900 rounded-[40px] text-center">
                          <p className="text-rose-500 text-[10px] font-black uppercase tracking-[0.5em] mb-4">Key Message</p>
                          <h4 className="text-3xl font-black text-white italic">"{analysis.mediaQuote}"</h4>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Slide Navigation Controls */}
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-8 bg-white/80 backdrop-blur-md px-8 py-4 rounded-full border border-slate-200 shadow-xl">
                  <button
                    disabled={activeSlide === 0}
                    onClick={() => setActiveSlide(prev => prev - 1)}
                    className="p-2 text-slate-400 hover:text-primary disabled:opacity-20 transition-all"
                  >
                    <ChevronLeft size={32} strokeWidth={3} />
                  </button>
                  <div className="flex gap-3">
                    {[0, 1, 2, 3, 4].map(i => (
                      <button
                        key={i}
                        onClick={() => setActiveSlide(i)}
                        className={cn("w-3 h-3 rounded-full transition-all", activeSlide === i ? "bg-primary w-12" : "bg-slate-200 hover:bg-slate-300")}
                      />
                    ))}
                  </div>
                  <button
                    disabled={activeSlide === 4}
                    onClick={() => setActiveSlide(prev => prev + 1)}
                    className="p-2 text-slate-400 hover:text-primary disabled:opacity-20 transition-all"
                  >
                    <ChevronRight size={32} strokeWidth={3} />
                  </button>
                </div>
              </div>
            </div>

            {/* Keyboard Shortcuts Hint */}
            <div className="p-6 text-center text-slate-500 text-[10px] font-bold uppercase tracking-widest">
              Sử dụng phím mũi tên để chuyển slide • Nhấn ESC để thoát
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string, value: string | number, icon: any, color: string }) {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600'
  };

  return (
    <div className="p-6 bg-gray-50 rounded-3xl space-y-2">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", colors[color])}>
        <Icon size={20} />
      </div>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className="text-2xl font-black text-gray-900">{value}</p>
    </div>
  );
}

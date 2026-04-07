import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Save, Download, Plus, Trash2, 
  User, Mail, Phone, MapPin, Briefcase, 
  GraduationCap, Award, Globe, Languages, 
  CheckCircle2, Loader2, FileText, Sparkles,
  Camera, Upload, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFirebase } from './FirebaseProvider';
import { CV } from '../types';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function CVBuilder() {
  const navigate = useNavigate();
  const { profile, saveCV, getCV } = useFirebase();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const cvRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<CV>>({
    fullName: profile?.displayName || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    address: profile?.location || '',
    summary: '',
    education: [],
    experience: [],
    skills: profile?.skills || [],
    projects: [],
    languages: [],
    photoURL: profile?.photoURL || ''
  });

  useEffect(() => {
    const fetchCV = async () => {
      if (profile?.cvId) {
        const data = await getCV(profile.cvId);
        if (data) {
          setFormData(data);
        }
      }
      setLoading(false);
    };
    fetchCV();
  }, [profile?.cvId, getCV]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveCV(formData);
      alert('Đã lưu CV thành công!');
    } catch (error) {
      console.error('Error saving CV:', error);
      alert('Có lỗi xảy ra khi lưu CV.');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!cvRef.current) return;
    
    setSaving(true);
    try {
      const canvas = await html2canvas(cvRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`CV_${formData.fullName?.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Có lỗi xảy ra khi tải PDF.');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit
        alert('Dung lượng ảnh không được vượt quá 1MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photoURL: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const addEducation = () => {
    setFormData(prev => ({
      ...prev,
      education: [...(prev.education || []), { school: '', degree: '', startDate: '', endDate: '', description: '' }]
    }));
  };

  const removeEducation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education?.filter((_, i) => i !== index)
    }));
  };

  const addExperience = () => {
    setFormData(prev => ({
      ...prev,
      experience: [...(prev.experience || []), { company: '', position: '', startDate: '', endDate: '', description: '' }]
    }));
  };

  const removeExperience = (index: number) => {
    setFormData(prev => ({
      ...prev,
      experience: prev.experience?.filter((_, i) => i !== index)
    }));
  };

  const addProject = () => {
    setFormData(prev => ({
      ...prev,
      projects: [...(prev.projects || []), { title: '', description: '', link: '' }]
    }));
  };

  const removeProject = (index: number) => {
    setFormData(prev => ({
      ...prev,
      projects: prev.projects?.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="w-8 h-8 text-[#1877F2] animate-spin" />
      </div>
    );
  }

  const SectionTitle = ({ icon: Icon, title }: { icon: any, title: string }) => (
    <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-[#1877F2]">
        <Icon size={18} />
      </div>
      <h3 className="text-lg font-black text-gray-900 tracking-tight">{title}</h3>
    </div>
  );

  const InputField = ({ label, value, onChange, placeholder, type = "text", multiline = false }: any) => (
    <div className="mb-4">
      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:bg-white focus:border-[#1877F2] focus:ring-4 focus:ring-blue-50 transition-all outline-none min-h-[100px] resize-none"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:bg-white focus:border-[#1877F2] focus:ring-4 focus:ring-blue-50 transition-all outline-none"
        />
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">Trình tạo CV</h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowPreview(!showPreview)}
            className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-colors"
          >
            {showPreview ? 'Chỉnh sửa' : 'Xem trước'}
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-[#1877F2] text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-100 hover:scale-105 transition-transform active:scale-95 disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Lưu
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {!showPreview ? (
          <div className="space-y-8">
            {/* Basic Info */}
            <section className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
              <SectionTitle icon={User} title="Thông tin cơ bản" />
              
              {/* Photo Upload */}
              <div className="mb-8 flex flex-col items-center">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-[40px] bg-gray-50 border-2 border-dashed border-gray-200 overflow-hidden flex items-center justify-center transition-all group-hover:border-primary/50">
                    {formData.photoURL ? (
                      <img src={formData.photoURL} alt="CV Portrait" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        <Camera size={24} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Ảnh chân dung</span>
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary text-white rounded-2xl shadow-lg flex items-center justify-center hover:scale-110 transition-transform active:scale-95"
                  >
                    <Upload size={18} />
                  </button>
                  {formData.photoURL && (
                    <button 
                      onClick={() => setFormData(prev => ({ ...prev, photoURL: '' }))}
                      className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-xl shadow-lg flex items-center justify-center hover:scale-110 transition-transform active:scale-95"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handlePhotoUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-4">Tải lên ảnh chân dung chuyên nghiệp (Tối đa 1MB)</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                <InputField label="Họ và tên" value={formData.fullName} onChange={(v: string) => setFormData({...formData, fullName: v})} placeholder="Nguyễn Văn A" />
                <InputField label="Email" value={formData.email} onChange={(v: string) => setFormData({...formData, email: v})} placeholder="example@gmail.com" type="email" />
                <InputField label="Số điện thoại" value={formData.phone} onChange={(v: string) => setFormData({...formData, phone: v})} placeholder="0123 456 789" />
                <InputField label="Địa chỉ" value={formData.address} onChange={(v: string) => setFormData({...formData, address: v})} placeholder="Hà Nội, Việt Nam" />
              </div>
              <InputField label="Giới thiệu bản thân" value={formData.summary} onChange={(v: string) => setFormData({...formData, summary: v})} placeholder="Tóm tắt ngắn gọn về bản thân, mục tiêu nghề nghiệp..." multiline />
            </section>

            {/* Education */}
            <section className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <SectionTitle icon={GraduationCap} title="Học vấn" />
                <button onClick={addEducation} className="p-2 bg-blue-50 text-[#1877F2] rounded-xl hover:bg-blue-100 transition-colors">
                  <Plus size={18} />
                </button>
              </div>
              <div className="space-y-6">
                {formData.education?.map((edu, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 rounded-2xl relative group">
                    <button 
                      onClick={() => removeEducation(idx)}
                      className="absolute top-4 right-4 p-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                      <InputField label="Trường học" value={edu.school} onChange={(v: string) => {
                        const newEdu = [...(formData.education || [])];
                        newEdu[idx].school = v;
                        setFormData({...formData, education: newEdu});
                      }} placeholder="THPT Phan Đình Phùng" />
                      <InputField label="Bằng cấp / Khối lớp" value={edu.degree} onChange={(v: string) => {
                        const newEdu = [...(formData.education || [])];
                        newEdu[idx].degree = v;
                        setFormData({...formData, education: newEdu});
                      }} placeholder="Lớp 11A1" />
                      <InputField label="Ngày bắt đầu" value={edu.startDate} onChange={(v: string) => {
                        const newEdu = [...(formData.education || [])];
                        newEdu[idx].startDate = v;
                        setFormData({...formData, education: newEdu});
                      }} placeholder="09/2022" />
                      <InputField label="Ngày kết thúc" value={edu.endDate} onChange={(v: string) => {
                        const newEdu = [...(formData.education || [])];
                        newEdu[idx].endDate = v;
                        setFormData({...formData, education: newEdu});
                      }} placeholder="Hiện tại" />
                    </div>
                    <InputField label="Mô tả thêm" value={edu.description} onChange={(v: string) => {
                      const newEdu = [...(formData.education || [])];
                      newEdu[idx].description = v;
                      setFormData({...formData, education: newEdu});
                    }} placeholder="Thành tích học tập, các môn học tiêu biểu..." multiline />
                  </div>
                ))}
              </div>
            </section>

            {/* Experience */}
            <section className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <SectionTitle icon={Briefcase} title="Kinh nghiệm làm việc" />
                <button onClick={addExperience} className="p-2 bg-blue-50 text-[#1877F2] rounded-xl hover:bg-blue-100 transition-colors">
                  <Plus size={18} />
                </button>
              </div>
              <div className="space-y-6">
                {formData.experience?.map((exp, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 rounded-2xl relative group">
                    <button 
                      onClick={() => removeExperience(idx)}
                      className="absolute top-4 right-4 p-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                      <InputField label="Công ty / Tổ chức" value={exp.company} onChange={(v: string) => {
                        const newExp = [...(formData.experience || [])];
                        newExp[idx].company = v;
                        setFormData({...formData, experience: newExp});
                      }} placeholder="The Coffee House" />
                      <InputField label="Vị trí" value={exp.position} onChange={(v: string) => {
                        const newExp = [...(formData.experience || [])];
                        newExp[idx].position = v;
                        setFormData({...formData, experience: newExp});
                      }} placeholder="Nhân viên phục vụ" />
                      <InputField label="Ngày bắt đầu" value={exp.startDate} onChange={(v: string) => {
                        const newExp = [...(formData.experience || [])];
                        newExp[idx].startDate = v;
                        setFormData({...formData, experience: newExp});
                      }} placeholder="06/2023" />
                      <InputField label="Ngày kết thúc" value={exp.endDate} onChange={(v: string) => {
                        const newExp = [...(formData.experience || [])];
                        newExp[idx].endDate = v;
                        setFormData({...formData, experience: newExp});
                      }} placeholder="08/2023" />
                    </div>
                    <InputField label="Mô tả công việc" value={exp.description} onChange={(v: string) => {
                      const newExp = [...(formData.experience || [])];
                      newExp[idx].description = v;
                      setFormData({...formData, experience: newExp});
                    }} placeholder="Các nhiệm vụ chính, kết quả đạt được..." multiline />
                  </div>
                ))}
              </div>
            </section>

            {/* Skills */}
            <section className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
              <SectionTitle icon={Award} title="Kỹ năng" />
              <div className="flex flex-wrap gap-2 mb-4">
                {formData.skills?.map((skill, idx) => (
                  <div key={idx} className="px-3 py-1.5 bg-blue-50 text-[#1877F2] text-xs font-bold rounded-xl flex items-center gap-2">
                    {skill}
                    <button onClick={() => setFormData({...formData, skills: formData.skills?.filter((_, i) => i !== idx)})}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Thêm kỹ năng mới..." 
                  className="flex-1 px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:border-[#1877F2]"
                  onKeyDown={(e: any) => {
                    if (e.key === 'Enter' && e.target.value) {
                      setFormData({...formData, skills: [...(formData.skills || []), e.target.value]});
                      e.target.value = '';
                    }
                  }}
                />
              </div>
            </section>

            {/* Projects */}
            <section className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <SectionTitle icon={Globe} title="Dự án cá nhân" />
                <button onClick={addProject} className="p-2 bg-blue-50 text-[#1877F2] rounded-xl hover:bg-blue-100 transition-colors">
                  <Plus size={18} />
                </button>
              </div>
              <div className="space-y-6">
                {formData.projects?.map((proj, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 rounded-2xl relative group">
                    <button 
                      onClick={() => removeProject(idx)}
                      className="absolute top-4 right-4 p-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={16} />
                    </button>
                    <InputField label="Tên dự án" value={proj.title} onChange={(v: string) => {
                      const newProj = [...(formData.projects || [])];
                      newProj[idx].title = v;
                      setFormData({...formData, projects: newProj});
                    }} placeholder="Website bán hàng cá nhân" />
                    <InputField label="Link dự án (nếu có)" value={proj.link} onChange={(v: string) => {
                      const newProj = [...(formData.projects || [])];
                      newProj[idx].link = v;
                      setFormData({...formData, projects: newProj});
                    }} placeholder="https://github.com/..." />
                    <InputField label="Mô tả dự án" value={proj.description} onChange={(v: string) => {
                      const newProj = [...(formData.projects || [])];
                      newProj[idx].description = v;
                      setFormData({...formData, projects: newProj});
                    }} placeholder="Công nghệ sử dụng, vai trò của bạn..." multiline />
                  </div>
                ))}
              </div>
            </section>
          </div>
        ) : (
          <div className="space-y-6">
            {/* CV Preview Section */}
            <div className="bg-white shadow-2xl rounded-none md:rounded-lg overflow-hidden border border-gray-200" ref={cvRef}>
              <div className="flex flex-col md:flex-row min-h-[1123px]">
                {/* Sidebar */}
                <div className="w-full md:w-1/3 bg-[#1e293b] text-white p-8">
                  <div className="mb-8">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/20 mx-auto mb-4 bg-gray-700">
                      <img src={formData.photoURL || 'https://i.pravatar.cc/300'} alt="avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <h2 className="text-xl font-bold text-center uppercase tracking-wider">{formData.fullName}</h2>
                    <p className="text-center text-blue-400 text-sm font-medium mt-1">Học sinh / Sinh viên</p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] border-b border-white/10 pb-2 mb-4 text-white/50">Liên hệ</h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-xs">
                          <Mail size={14} className="text-blue-400 shrink-0" />
                          <span className="break-all">{formData.email}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <Phone size={14} className="text-blue-400 shrink-0" />
                          <span>{formData.phone}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <MapPin size={14} className="text-blue-400 shrink-0" />
                          <span>{formData.address}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] border-b border-white/10 pb-2 mb-4 text-white/50">Kỹ năng</h3>
                      <div className="flex flex-wrap gap-2">
                        {formData.skills?.map((skill, i) => (
                          <span key={i} className="px-2 py-1 bg-white/10 rounded text-[10px] font-medium">{skill}</span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] border-b border-white/10 pb-2 mb-4 text-white/50">Ngoại ngữ</h3>
                      <div className="space-y-2">
                        {formData.languages?.map((lang, i) => (
                          <div key={i} className="text-xs flex justify-between">
                            <span>{lang}</span>
                            <span className="text-blue-400">Thành thạo</span>
                          </div>
                        ))}
                        {(!formData.languages || formData.languages.length === 0) && (
                          <p className="text-[10px] text-white/30 italic">Chưa cập nhật</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 bg-white p-10 text-gray-800">
                  <div className="mb-10">
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[#1877F2] mb-4 flex items-center gap-2">
                      <User size={18} />
                      Giới thiệu bản thân
                    </h3>
                    <p className="text-sm leading-relaxed text-gray-600">{formData.summary || 'Chưa có thông tin giới thiệu.'}</p>
                  </div>

                  <div className="mb-10">
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[#1877F2] mb-6 flex items-center gap-2">
                      <GraduationCap size={18} />
                      Học vấn
                    </h3>
                    <div className="space-y-6">
                      {formData.education?.map((edu, i) => (
                        <div key={i} className="relative pl-6 border-l-2 border-gray-100">
                          <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-[#1877F2]"></div>
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-bold text-gray-900">{edu.school}</h4>
                            <span className="text-[10px] font-bold text-gray-400 uppercase">{edu.startDate} - {edu.endDate}</span>
                          </div>
                          <p className="text-xs font-bold text-[#1877F2] mb-2">{edu.degree}</p>
                          <p className="text-xs text-gray-600 leading-relaxed">{edu.description}</p>
                        </div>
                      ))}
                      {(!formData.education || formData.education.length === 0) && (
                        <p className="text-xs text-gray-400 italic">Chưa cập nhật thông tin học vấn.</p>
                      )}
                    </div>
                  </div>

                  <div className="mb-10">
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[#1877F2] mb-6 flex items-center gap-2">
                      <Briefcase size={18} />
                      Kinh nghiệm làm việc
                    </h3>
                    <div className="space-y-6">
                      {formData.experience?.map((exp, i) => (
                        <div key={i} className="relative pl-6 border-l-2 border-gray-100">
                          <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-[#1877F2]"></div>
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-bold text-gray-900">{exp.company}</h4>
                            <span className="text-[10px] font-bold text-gray-400 uppercase">{exp.startDate} - {exp.endDate}</span>
                          </div>
                          <p className="text-xs font-bold text-[#1877F2] mb-2">{exp.position}</p>
                          <p className="text-xs text-gray-600 leading-relaxed">{exp.description}</p>
                        </div>
                      ))}
                      {(!formData.experience || formData.experience.length === 0) && (
                        <p className="text-xs text-gray-400 italic">Chưa cập nhật kinh nghiệm làm việc.</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[#1877F2] mb-6 flex items-center gap-2">
                      <Globe size={18} />
                      Dự án tiêu biểu
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      {formData.projects?.map((proj, i) => (
                        <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                          <h4 className="font-bold text-gray-900 text-sm mb-1">{proj.title}</h4>
                          {proj.link && <a href={proj.link} target="_blank" rel="noreferrer" className="text-[10px] text-blue-500 hover:underline mb-2 block">{proj.link}</a>}
                          <p className="text-xs text-gray-600 leading-relaxed">{proj.description}</p>
                        </div>
                      ))}
                      {(!formData.projects || formData.projects.length === 0) && (
                        <p className="text-xs text-gray-400 italic">Chưa cập nhật dự án.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-4 pt-8">
              <button 
                onClick={handleDownloadPDF}
                disabled={saving}
                className="px-8 py-4 bg-[#1877F2] text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-100 hover:scale-105 transition-transform active:scale-95 flex items-center gap-3"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                Tải xuống PDF
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Floating Save Indicator */}
      <AnimatePresence>
        {saving && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 px-6 py-3 bg-gray-900 text-white rounded-full shadow-2xl flex items-center gap-3 z-50"
          >
            <Loader2 size={16} className="animate-spin" />
            <span className="text-xs font-bold">Đang xử lý...</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

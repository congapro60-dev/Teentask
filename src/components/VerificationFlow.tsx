import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Camera, Upload, CheckCircle2, ArrowRight, User, Calendar, GraduationCap, Building2, Briefcase, MapPin, X as CloseIcon, Check } from 'lucide-react';
import { useFirebase } from './FirebaseProvider';
import { PREDEFINED_SKILLS } from '../constants';

interface VerificationFlowProps {
  onClose?: () => void;
}

export default function VerificationFlow({ onClose }: VerificationFlowProps) {
  const { profile, updateProfile } = useFirebase();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Common fields
  const [fullName, setFullName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [dob, setDob] = useState('');
  const [idPhoto, setIdPhoto] = useState<string | null>(null);

  // Student specific
  const [studentClass, setStudentClass] = useState('');
  const [school, setSchool] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  // Parent specific
  const [occupation, setOccupation] = useState('');
  const [workplaceName, setWorkplaceName] = useState('');
  const [workplaceAddress, setWorkplaceAddress] = useState('');

  // Business specific
  const [representativeName, setRepresentativeName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [businessField, setBusinessField] = useState('');

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setIdPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!idPhoto) return;
    setSubmitting(true);
    try {
      const verificationData: any = {
        idCardPhoto: idPhoto,
        verificationStatus: 'pending',
        isVerified: false,
        verificationSubmittedAt: Date.now()
      };

      if (profile?.role === 'student') {
        Object.assign(verificationData, { 
          fullName, 
          dob, 
          class: studentClass, 
          school, 
          idNumber,
          skills: selectedSkills 
        });
      } else if (profile?.role === 'parent') {
        Object.assign(verificationData, { occupation, dob, workplaceName, workplaceAddress });
      } else if (profile?.role === 'business') {
        Object.assign(verificationData, { representativeName, businessName, businessAddress, businessField });
      }

      await updateProfile(verificationData);
      setStep(3);
    } catch (error) {
      console.error("Error submitting verification:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const isStep1Valid = () => {
    if (profile?.role === 'student') {
      return fullName && dob && studentClass && school && idNumber;
    } else if (profile?.role === 'parent') {
      return occupation && dob && workplaceName && workplaceAddress;
    } else if (profile?.role === 'business') {
      return representativeName && businessName && businessAddress && businessField;
    }
    return false;
  };

  return (
    <div className="min-h-screen bg-white p-6 flex flex-col relative">
      {onClose && (
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 bg-gray-50 text-gray-400 rounded-full hover:bg-gray-100 transition-colors z-50"
        >
          <CloseIcon size={24} />
        </button>
      )}
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col justify-center">
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <ShieldCheck size={32} className="text-indigo-600" />
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-2">Thông tin xác thực</h2>
              <p className="text-gray-500">Vui lòng cung cấp thông tin chính xác để đảm bảo an toàn cho cộng đồng.</p>
            </div>

            <div className="space-y-4">
              {profile?.role === 'student' && (
                <>
                  <InputField label="Họ và tên" value={fullName} onChange={setFullName} icon={User} placeholder="Nguyễn Văn A" />
                  <InputField label="Ngày tháng năm sinh" value={dob} onChange={setDob} icon={Calendar} type="date" />
                  <InputField label="Lớp" value={studentClass} onChange={setStudentClass} icon={GraduationCap} placeholder="12A1" />
                  <InputField label="Trường đang theo học" value={school} onChange={setSchool} icon={Building2} placeholder="THPT Chu Văn An" />
                  <InputField label="Số căn cước" value={idNumber} onChange={setIdNumber} icon={ShieldCheck} placeholder="0123456789" />
                  
                  <div className="pt-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Kỹ năng của bạn</label>
                    <div className="flex flex-wrap gap-2 max-h-[150px] overflow-y-auto p-2 bg-gray-50 rounded-2xl no-scrollbar">
                      {PREDEFINED_SKILLS.map(skill => {
                        const isSelected = selectedSkills.includes(skill);
                        return (
                          <button
                            key={skill}
                            onClick={() => {
                              setSelectedSkills(prev => 
                                prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
                              );
                            }}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all flex items-center gap-1 border ${
                              isSelected 
                                ? 'bg-indigo-600 text-white border-indigo-600' 
                                : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-200'
                            }`}
                          >
                            {skill}
                            {isSelected && <Check size={10} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {profile?.role === 'parent' && (
                <>
                  <InputField label="Nghề nghiệp" value={occupation} onChange={setOccupation} icon={Briefcase} placeholder="Kỹ sư" />
                  <InputField label="Ngày tháng năm sinh" value={dob} onChange={setDob} icon={Calendar} type="date" />
                  <InputField label="Tên nơi công tác" value={workplaceName} onChange={setWorkplaceName} icon={Building2} placeholder="Công ty ABC" />
                  <InputField label="Địa chỉ nơi công tác" value={workplaceAddress} onChange={setWorkplaceAddress} icon={MapPin} placeholder="123 Đường Láng, Hà Nội" />
                </>
              )}

              {profile?.role === 'business' && (
                <>
                  <InputField label="Tên người đại diện" value={representativeName} onChange={setRepresentativeName} icon={User} placeholder="Nguyễn Văn B" />
                  <InputField label="Tên doanh nghiệp" value={businessName} onChange={setBusinessName} icon={Building2} placeholder="Công ty TNHH TeenTask" />
                  <InputField label="Địa chỉ doanh nghiệp" value={businessAddress} onChange={setBusinessAddress} icon={MapPin} placeholder="456 Cầu Giấy, Hà Nội" />
                  <InputField label="Lĩnh vực kinh doanh" value={businessField} onChange={setBusinessField} icon={Briefcase} placeholder="Công nghệ thông tin" />
                </>
              )}
            </div>

            <button
              disabled={!isStep1Valid()}
              onClick={() => setStep(2)}
              className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-100 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              Tiếp theo
              <ArrowRight size={20} />
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="text-center">
              <h2 className="text-3xl font-black text-gray-900 mb-2">Ảnh chụp CMT/CCCD</h2>
              <p className="text-gray-500">Chụp mặt trước của giấy tờ tùy thân của bạn.</p>
            </div>

            <div className="relative aspect-[3/2] bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center overflow-hidden">
              {idPhoto ? (
                <>
                  <img src={idPhoto} alt="ID Card" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <button 
                    onClick={() => setIdPhoto(null)}
                    className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full backdrop-blur-md"
                  >
                    <Camera size={20} />
                  </button>
                </>
              ) : (
                <label className="cursor-pointer flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center">
                    <Upload size={24} className="text-gray-400" />
                  </div>
                  <span className="text-sm font-bold text-gray-400">Tải ảnh lên hoặc chụp ảnh</span>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
              )}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-5 bg-gray-100 text-gray-600 rounded-2xl font-bold"
              >
                Quay lại
              </button>
              <button
                disabled={!idPhoto || submitting}
                onClick={handleSubmit}
                className="flex-[2] py-5 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-100 disabled:opacity-50"
              >
                {submitting ? 'Đang gửi...' : 'Hoàn tất'}
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6"
          >
            <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={48} className="text-green-500" />
            </div>
            <h2 className="text-3xl font-black text-gray-900">Gửi thành công!</h2>
            <p className="text-gray-500">Thông tin của bạn đã được gửi. Bạn có thể bắt đầu sử dụng ứng dụng ngay bây giờ.</p>
            <button
              onClick={() => {
                if (onClose) {
                  onClose();
                } else {
                  window.location.reload();
                }
              }}
              className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-100"
            >
              Vào ứng dụng
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, icon: Icon, placeholder, type = "text" }: any) {
  return (
    <div>
      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">{label}</label>
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
          <Icon size={18} />
        </div>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full p-4 pl-12 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600/20 outline-none transition-all"
        />
      </div>
    </div>
  );
}

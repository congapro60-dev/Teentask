import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Award, MapPin, ExternalLink, ChevronRight, ShieldCheck, Star, User, GraduationCap, Mail, Phone, Briefcase, UserPlus, UserCheck, Clock, MessageSquare, Heart } from 'lucide-react';
import { doc, getDoc, setDoc, onSnapshot, query, collection, where, getDocs } from 'firebase/firestore';
import { db, useFirebase } from './FirebaseProvider';
import { UserProfile, FriendRequest, Relationship } from '../types';

export default function StudentProfile() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const { profile: currentUserProfile, sendFriendRequest, toggleFollowUser, createChat, unfriendUser } = useFirebase();
  const [loading, setLoading] = useState(true);
  const [studentInfo, setStudentInfo] = useState<UserProfile | null>(null);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [friendRequestStatus, setFriendRequestStatus] = useState<'none' | 'pending' | 'accepted' | 'rejected'>('none');
  const [requestId, setRequestId] = useState<string | null>(null);
  const [relationships, setRelationships] = useState<Relationship[]>([]);

  const BOSS_EMAIL = "congapro60@gmail.com";
  const isCurrentUserBoss = currentUserProfile?.email === BOSS_EMAIL;

  const isFollowing = currentUserProfile?.following?.includes(studentId || '');
  const isFriend = currentUserProfile?.friends?.includes(studentId || '');

  useEffect(() => {
    if (!studentId || !currentUserProfile) return;

    const q = query(
      collection(db, 'friend_requests'),
      where('fromId', '==', currentUserProfile.uid),
      where('toId', '==', studentId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const request = snapshot.docs[0].data() as FriendRequest;
        setFriendRequestStatus(request.status);
        setRequestId(request.id);
      } else {
        // Check reverse request
        const q2 = query(
          collection(db, 'friend_requests'),
          where('fromId', '==', studentId),
          where('toId', '==', currentUserProfile.uid)
        );
        onSnapshot(q2, (snapshot2) => {
          if (!snapshot2.empty) {
            const request = snapshot2.docs[0].data() as FriendRequest;
            setFriendRequestStatus(request.status);
            setRequestId(request.id);
          } else {
            setFriendRequestStatus('none');
            setRequestId(null);
          }
        });
      }
    });

    return () => unsubscribe();
  }, [studentId, currentUserProfile]);

  const handleFriendAction = async () => {
    if (!studentId) return;
    try {
      if (isFriend) {
        if (window.confirm('Bạn có chắc chắn muốn hủy kết bạn?')) {
          await unfriendUser(studentId);
        }
      } else if (friendRequestStatus === 'pending') {
        alert('Yêu cầu kết bạn đang chờ xử lý.');
      } else {
        await sendFriendRequest(studentId);
        alert('Đã gửi yêu cầu kết bạn!');
      }
    } catch (error) {
      console.error("Error friend action:", error);
    }
  };

  const handleFollowAction = async () => {
    if (!studentId) return;
    try {
      await toggleFollowUser(studentId);
    } catch (error) {
      console.error("Error follow action:", error);
    }
  };

  const handleMessage = async () => {
    if (!studentInfo) return;
    try {
      const chatId = await createChat(studentInfo.uid, {
        displayName: studentInfo.displayName,
        photoURL: studentInfo.photoURL,
        role: studentInfo.role
      });
      navigate(`/messages/${chatId}`);
    } catch (error) {
      console.error("Error starting chat:", error);
    }
  };

  const toggleAdminRole = async () => {
    if (!studentId || !studentInfo) return;
    setIsUpdatingRole(true);
    try {
      const newRole = studentInfo.role === 'admin' ? 'student' : 'admin';
      await setDoc(doc(db, 'users', studentId), { 
        role: newRole,
        isVip: newRole === 'admin' ? true : studentInfo.isVip 
      }, { merge: true });
      setStudentInfo(prev => prev ? { ...prev, role: newRole, isVip: newRole === 'admin' ? true : prev.isVip } : null);
      alert(newRole === 'admin' ? 'Đã bổ nhiệm làm Quản trị viên' : 'Đã gỡ quyền Quản trị viên');
    } catch (error) {
      console.error("Error updating role:", error);
      alert('Có lỗi xảy ra khi cập nhật vai trò.');
    } finally {
      setIsUpdatingRole(false);
    }
  };

  useEffect(() => {
    const fetchStudentData = async () => {
      if (!studentId) return;
      setLoading(true);

      try {
        const userDoc = await getDoc(doc(db, 'users', studentId));
        if (userDoc.exists()) {
          setStudentInfo({ uid: userDoc.id, ...userDoc.data() } as UserProfile);
        }

        // Fetch confirmed relationships (e.g. Parents)
        const qRels = query(
          collection(db, 'relationships'),
          where('relatedUserId', '==', studentId),
          where('status', '==', 'accepted'),
          where('type', '==', 'Family')
        );
        const relSnap = await getDocs(qRels);
        setRelationships(relSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Relationship)));
      } catch (error) {
        console.error("Error fetching student data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [studentId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="w-12 h-12 border-4 border-[#4F46E5] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!studentInfo) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] p-6">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <User size={40} className="text-gray-300" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Không tìm thấy hồ sơ</h2>
        <button onClick={() => navigate(-1)} className="mt-4 text-indigo-600 font-bold flex items-center gap-2">
          <ArrowLeft size={18} /> Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Header */}
      <div className="bg-white rounded-b-[40px] shadow-sm overflow-hidden border-b border-gray-100">
        <div className="h-32 bg-gradient-to-r from-[#4F46E5] to-[#DB2777] relative">
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
                  src={studentInfo.photoURL || 'https://picsum.photos/seed/student/200/200'} 
                  alt={studentInfo.displayName} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            {studentInfo.isVerified && (
              <div className="px-4 py-2 bg-green-50 text-green-600 text-xs font-black rounded-full border border-green-100 flex items-center gap-2">
                <ShieldCheck size={14} />
                ĐÃ XÁC MINH
              </div>
            )}
          </div>

          <div>
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2 flex-wrap">
              {studentInfo.displayName}
              {studentInfo.email === BOSS_EMAIL && <span className="bg-red-100 text-red-600 text-[10px] px-2 py-0.5 rounded-md font-black uppercase tracking-tighter">Boss</span>}
              {studentInfo.role === 'admin' && studentInfo.email !== BOSS_EMAIL && <span className="bg-indigo-100 text-indigo-600 text-[10px] px-2 py-0.5 rounded-md font-black uppercase tracking-tighter">Admin</span>}
              {studentInfo.isVip && <Star size={20} className="text-amber-500 fill-amber-500" />}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <GraduationCap size={16} className="text-gray-400" />
              <p className="text-sm text-gray-500 font-medium">
                {studentInfo.school || 'Chưa cập nhật trường'} • {studentInfo.class || 'Lớp'}
              </p>
            </div>
            
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-1 text-sm font-bold text-gray-700">
                <Star size={16} className="text-amber-400 fill-amber-400" />
                {studentInfo.trustScore ?? 0}
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <MapPin size={16} />
                {studentInfo.location || 'Việt Nam'}
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <User size={16} />
                {studentInfo.followers?.length || 0} người theo dõi
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-6">
              <div className="bg-gray-50 rounded-2xl p-4 text-center border border-gray-100">
                <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest mb-1">Bạn bè</p>
                <p className="text-lg font-black text-gray-900">{studentInfo.friends?.length || 0}</p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4 text-center border border-gray-100">
                <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest mb-1">Kỹ năng</p>
                <p className="text-lg font-black text-gray-900">{studentInfo.skills?.length || 0}</p>
              </div>
            </div>

            {currentUserProfile?.uid !== studentId && (
              <div className="grid grid-cols-2 gap-3 mt-6">
                <button
                  onClick={handleFriendAction}
                  className={`py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                    isFriend 
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                    : friendRequestStatus === 'pending'
                    ? 'bg-amber-50 text-amber-600 border border-amber-100'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100'
                  }`}
                >
                  {isFriend ? (
                    <><UserCheck size={18} /> Bạn bè</>
                  ) : friendRequestStatus === 'pending' ? (
                    <><Clock size={18} /> Đã gửi</>
                  ) : (
                    <><UserPlus size={18} /> Kết bạn</>
                  )}
                </button>
                <button
                  onClick={handleFollowAction}
                  className={`py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                    isFollowing
                    ? 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
                </button>
                <button
                  onClick={handleMessage}
                  className="col-span-2 py-3 bg-white border-2 border-gray-100 text-gray-700 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-50 transition-all"
                >
                  <MessageSquare size={18} className="text-indigo-600" />
                  Nhắn tin
                </button>
              </div>
            )}

            {isCurrentUserBoss && studentInfo.email !== BOSS_EMAIL && (
              <div className="mt-6">
                <button 
                  onClick={toggleAdminRole}
                  disabled={isUpdatingRole}
                  className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-sm ${
                    studentInfo.role === 'admin' 
                    ? 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'
                  }`}
                >
                  <ShieldCheck size={18} />
                  {isUpdatingRole ? 'Đang xử lý...' : (studentInfo.role === 'admin' ? 'Gỡ quyền Admin' : 'Bổ nhiệm Admin')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 max-w-2xl mx-auto space-y-6">
        {/* Relationships Section (Verified by) */}
        {relationships.length > 0 && (
          <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-6">
              <Heart size={18} className="text-red-500" />
              Xác thực bởi Phụ huynh
            </h3>
            <div className="space-y-3">
              {relationships.map(rel => (
                <div key={rel.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white overflow-hidden border border-gray-100">
                      {rel.userPhoto ? (
                        <img src={rel.userPhoto} alt={rel.userName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <User size={24} />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{rel.userName}</p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                        Mối quan hệ: <span className="text-indigo-600">{rel.title}</span>
                      </p>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-black rounded-full border border-green-100 flex items-center gap-1">
                    <ShieldCheck size={12} />
                    ĐÃ XÁC THỰC
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Personal Info Section */}
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-6">
            <User size={18} className="text-[#4F46E5]" />
            Thông tin cá nhân
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
              <User size={16} className="text-gray-400" />
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase">Giới tính</p>
                <p className="text-sm font-medium text-gray-700">{studentInfo.gender || 'Chưa cập nhật'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
              <Clock size={16} className="text-gray-400" />
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase">Ngày sinh</p>
                <p className="text-sm font-medium text-gray-700">{studentInfo.dob ? new Date(studentInfo.dob).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
              <MapPin size={16} className="text-gray-400" />
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase">Nơi ở</p>
                <p className="text-sm font-medium text-gray-700">{studentInfo.location || 'Chưa cập nhật'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
              <Briefcase size={16} className="text-gray-400" />
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase">Vai trò</p>
                <p className="text-sm font-medium text-gray-700">{studentInfo.role === 'student' ? 'Học sinh' : studentInfo.role === 'business' ? 'Doanh nghiệp' : studentInfo.role === 'parent' ? 'Phụ huynh' : 'Quản trị viên'}</p>
              </div>
            </div>
          </div>
          {studentInfo.bio && (
            <div className="mt-4 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
              <p className="text-sm text-gray-600 leading-relaxed italic">"{studentInfo.bio}"</p>
            </div>
          )}
        </div>

        {/* Teen CV Section */}
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-6">
            <Award size={18} className="text-[#4F46E5]" />
            Teen CV
          </h3>

          <div className="space-y-6">
            {/* Skills */}
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Kỹ năng</h4>
              <div className="flex flex-wrap gap-2">
                {(studentInfo.skills || []).length > 0 ? (
                  studentInfo.skills.map((skill) => (
                    <span key={skill} className="px-3 py-1.5 bg-indigo-50 text-[#4F46E5] text-xs font-medium rounded-lg">
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 italic">Chưa cập nhật kỹ năng</p>
                )}
              </div>
            </div>

            {/* Achievements */}
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Thành tích học tập</h4>
              <div className="space-y-2">
                {(studentInfo.achievements || []).length > 0 ? (
                  studentInfo.achievements.map((ach, idx) => (
                    <div key={idx} className="flex gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="w-1 h-auto bg-green-500 rounded-full"></div>
                      <p className="text-sm font-medium text-gray-700">{ach}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 italic">Chưa có thành tích nào</p>
                )}
              </div>
            </div>

            {/* Portfolio */}
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Portfolio & Dự án</h4>
              <div className="space-y-2">
                {(studentInfo.portfolioLinks || []).length > 0 ? (
                  studentInfo.portfolioLinks.map((link, idx) => (
                    <a 
                      key={idx} 
                      href={link.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-gray-100 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <ExternalLink size={14} className="text-indigo-500" />
                        <span className="text-sm font-bold text-gray-700">{link.title}</span>
                      </div>
                      <ChevronRight size={14} className="text-gray-300 group-hover:text-indigo-500" />
                    </a>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 italic">Chưa có portfolio</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Contact Info (Only if needed or verified) */}
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
            <Mail size={18} className="text-indigo-600" />
            Thông tin liên hệ
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
              <Mail size={16} className="text-gray-400" />
              <span className="text-sm text-gray-600">{studentInfo.email}</span>
            </div>
            {studentInfo.phone && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                <Phone size={16} className="text-gray-400" />
                <span className="text-sm text-gray-600">{studentInfo.phone}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

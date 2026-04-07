import React, { useState, useEffect } from 'react';
import { Settings, Shield, Award, MapPin, ExternalLink, Download, ShieldCheck, Clock, XCircle, ChevronRight, Star, X, Bell, AlertTriangle, Check, Plus, Building2, UserPlus, UserCheck, Users, Heart, Briefcase as BriefcaseIcon, User, LogOut, Edit2, Trash2, Calendar, Phone, Mail, Globe, GraduationCap, Languages, FileText, CalendarDays } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useFirebase } from './FirebaseProvider';
import { collection, query, where, getDocs, onSnapshot, addDoc, doc, getDoc, updateDoc, deleteDoc, orderBy, setDoc } from 'firebase/firestore';
import { db, auth } from './FirebaseProvider';
import { Application, Job, Review, Notification, FriendRequest, Relationship, UserProfile, Rating } from '../types';
import { PREDEFINED_SKILLS } from '../constants';

export default function Profile() {
  const navigate = useNavigate();
  const { 
    profile, logout, updateProfile, 
    acceptFriendRequest, rejectFriendRequest, 
    addRelationship, acceptRelationship, rejectRelationship,
    submitRating, submitNameChangeRequest 
  } = useFirebase();
  const [applications, setApplications] = useState<(Application & { job?: Job })[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [relationshipRequests, setRelationshipRequests] = useState<Relationship[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isSkillsModalOpen, setIsSkillsModalOpen] = useState(false);
  const [isStudentEditModalOpen, setIsStudentEditModalOpen] = useState(false);
  const [isBusinessEditModalOpen, setIsBusinessEditModalOpen] = useState(false);
  const [isNameChangeModalOpen, setIsNameChangeModalOpen] = useState(false);
  const [isPersonalInfoModalOpen, setIsPersonalInfoModalOpen] = useState(false);
  const [isRelationshipModalOpen, setIsRelationshipModalOpen] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<UserProfile | null>(null);
  const [relationshipType, setRelationshipType] = useState<'Family' | 'Professional'>('Family');
  const [relationshipTitle, setRelationshipTitle] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedApp, setSelectedApp] = useState<(Application & { job?: Job }) | null>(null);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [tempSkills, setTempSkills] = useState<string[]>([]);
  const [studentEditData, setStudentEditData] = useState({
    achievements: [] as string[],
    portfolioLinks: [] as { title: string; url: string }[]
  });
  const [businessEditData, setBusinessEditData] = useState({
    industry: '',
    website: '',
    companySize: '',
    foundedYear: 2024
  });
  const [personalInfoData, setPersonalInfoData] = useState({
    fullName: '',
    dob: '',
    gender: 'Nam' as 'Nam' | 'Nữ' | 'Khác',
    phone: '',
    location: '',
    school: '',
    class: '',
    bio: ''
  });
  const [nameChangeData, setNameChangeData] = useState({
    newName: '',
    reason: '',
    proofUrl: ''
  });
  const [submittingNameChange, setSubmittingNameChange] = useState(false);

  useEffect(() => {
    if (profile) {
      setStudentEditData({
        achievements: profile.achievements || [],
        portfolioLinks: profile.portfolioLinks || []
      });
      setBusinessEditData({
        industry: profile.industry || '',
        website: profile.website || '',
        companySize: profile.companySize || '',
        foundedYear: profile.foundedYear || 2024
      });
      setPersonalInfoData({
        fullName: profile.fullName || '',
        dob: profile.dob || '',
        gender: profile.gender || 'Nam',
        phone: profile.phone || '',
        location: profile.location || '',
        school: profile.school || '',
        class: profile.class || '',
        bio: profile.bio || ''
      });
    }
  }, [profile]);

  const badges = [
    { icon: '⭐', label: 'Người mới', color: 'bg-blue-50 text-blue-600' },
    { icon: '🔥', label: 'Chuyên cần', color: 'bg-orange-50 text-orange-600' },
    { icon: '🏆', label: 'Xuất sắc', color: 'bg-yellow-50 text-yellow-600' },
  ];

  // Mock parental verification status
  const parentalVerification = profile?.parentalVerification || {
    status: 'approved', // can be 'pending', 'approved', 'rejected'
    lastUpdated: '15/03/2026'
  };

  const renderVerificationStatus = () => {
    const status = profile?.verificationStatus || 'unverified';
    const isVerified = profile?.isVerified;

    if (isVerified) {
      return {
        icon: <ShieldCheck size={20} />,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        badgeColor: 'bg-green-50 text-green-600 border-green-100',
        label: 'Đã kiểm duyệt',
        statusText: 'Verified'
      };
    }

    switch (status) {
      case 'pending':
        return {
          icon: <Clock size={20} />,
          color: 'text-orange-600',
          bgColor: 'bg-orange-100',
          badgeColor: 'bg-orange-50 text-orange-600 border-orange-100',
          label: 'Chưa kiểm duyệt',
          statusText: 'Pending'
        };
      case 'rejected':
        return {
          icon: <XCircle size={20} />,
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          badgeColor: 'bg-red-50 text-red-600 border-red-100',
          label: 'Từ chối kiểm duyệt',
          statusText: 'Rejected'
        };
      default:
        return {
          icon: <AlertTriangle size={20} />,
          color: 'text-gray-400',
          bgColor: 'bg-gray-100',
          badgeColor: 'bg-gray-50 text-gray-400 border-gray-100',
          label: 'Chưa xác minh',
          statusText: 'Unverified'
        };
    }
  };

  const verificationUI = renderVerificationStatus();

  useEffect(() => {
    if (!auth.currentUser || profile?.role !== 'student') {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'applications'),
      where('studentId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application));
      
      // Fetch job details for each application
      const appsWithJobs = await Promise.all(apps.map(async (app) => {
        const jobDoc = await getDoc(doc(db, 'jobs', app.jobId));
        return { ...app, job: jobDoc.exists() ? { id: jobDoc.id, ...jobDoc.data() } as Job : undefined };
      }));

      setApplications(appsWithJobs);
      setLoading(false);
    }, (error) => {
      console.error("Error in applications listener:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile?.role]);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedNotifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
      setNotifications(fetchedNotifications);
    }, (error) => {
      console.error("Error in notifications listener:", error);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!auth.currentUser) return;

    // Listen to friend requests
    const qRequests = query(
      collection(db, 'friend_requests'),
      where('toId', '==', auth.currentUser.uid),
      where('status', '==', 'pending')
    );
    const unsubRequests = onSnapshot(qRequests, (snapshot) => {
      setFriendRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FriendRequest)));
    }, (error) => {
      console.error("Error in friend requests listener:", error);
    });

    // Listen to outgoing relationships
    const qRels = query(
      collection(db, 'relationships'),
      where('userId', '==', auth.currentUser.uid)
    );
    const unsubRels = onSnapshot(qRels, (snapshot) => {
      setRelationships(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Relationship)));
    }, (error) => {
      console.error("Error in relationships listener:", error);
    });

    // Listen to incoming relationship requests
    const qRelRequests = query(
      collection(db, 'relationships'),
      where('relatedUserId', '==', auth.currentUser.uid),
      where('status', '==', 'pending')
    );
    const unsubRelRequests = onSnapshot(qRelRequests, (snapshot) => {
      setRelationshipRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Relationship)));
    }, (error) => {
      console.error("Error in relationship requests listener:", error);
    });

    return () => {
      unsubRequests();
      unsubRels();
      unsubRelRequests();
    };
  }, []);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'ratings'),
      where('toId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRatings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Rating)));
    }, (error) => {
      console.error("Error in ratings listener:", error);
    });

    return () => unsubscribe();
  }, []);

  const averageRating = ratings.length > 0 
    ? (ratings.reduce((acc, r) => acc + r.score, 0) / ratings.length).toFixed(1)
    : profile?.trustScore?.toFixed(1) || '0.0';

  useEffect(() => {
    if (!profile?.friends || profile.friends.length === 0) {
      setFriends([]);
      return;
    }

    const fetchFriends = async () => {
      const friendProfiles = await Promise.all(
        profile.friends.map(async (friendId) => {
          const friendDoc = await getDoc(doc(db, 'users', friendId));
          return friendDoc.exists() ? { uid: friendDoc.id, ...friendDoc.data() } as UserProfile : null;
        })
      );
      setFriends(friendProfiles.filter(f => f !== null) as UserProfile[]);
    };

    fetchFriends();
  }, [profile?.friends]);

  const handleAddRelationship = async () => {
    if (!selectedFriend || !relationshipTitle) return;
    try {
      await addRelationship(
        selectedFriend.uid,
        selectedFriend.displayName || 'Người dùng',
        selectedFriend.photoURL,
        relationshipType,
        relationshipTitle
      );
      setIsRelationshipModalOpen(false);
      setSelectedFriend(null);
      setRelationshipTitle('');
      alert('Đã thêm mối quan hệ!');
    } catch (error) {
      console.error("Error adding relationship:", error);
    }
  };

  const markNotificationAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp || !selectedApp.job || !auth.currentUser || !profile) return;

    setSubmittingReview(true);
    try {
      await submitRating(
        selectedApp.job.businessId,
        reviewData.rating,
        reviewData.comment,
        selectedApp.jobId
      );
      
      // Update application to mark as reviewed
      await updateDoc(doc(db, 'applications', selectedApp.id), { reviewed: true });
      
      setIsReviewModalOpen(false);
      setSelectedApp(null);
      setReviewData({ rating: 5, comment: '' });
      alert('Cảm ơn bạn đã đánh giá!');
    } catch (error) {
      console.error("Error submitting review:", error);
      alert('Có lỗi xảy ra khi gửi đánh giá.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isFinancialModalOpen, setIsFinancialModalOpen] = useState(false);
  const [financialAction, setFinancialAction] = useState<'deposit' | 'bank' | 'vip' | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [bankInfo, setBankInfo] = useState({ bankName: '', accountNumber: '', accountHolder: '' });

  const handleRoleChange = async (newRole: 'student' | 'parent' | 'business') => {
    if (newRole === 'student' && (profile?.role === 'parent' || profile?.role === 'business')) {
      alert('Phụ huynh và doanh nghiệp không thể chuyển thành vai trò học sinh.');
      return;
    }
    try {
      await updateProfile({ role: newRole });
      setIsRoleModalOpen(false);
    } catch (error) {
      console.error("Error changing role:", error);
      alert('Có lỗi xảy ra khi chuyển đổi vai trò.');
    }
  };

  const handleNameChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameChangeData.newName || !nameChangeData.reason || !nameChangeData.proofUrl) {
      alert('Vui lòng điền đầy đủ thông tin và tải lên minh chứng.');
      return;
    }
    setSubmittingNameChange(true);
    try {
      await submitNameChangeRequest(nameChangeData.newName, nameChangeData.reason, nameChangeData.proofUrl);
      setIsNameChangeModalOpen(false);
      setNameChangeData({ newName: '', reason: '', proofUrl: '' });
      alert('Yêu cầu đổi tên đã được gửi và đang chờ phê duyệt.');
    } catch (error) {
      console.error("Error submitting name change request:", error);
      alert('Có lỗi xảy ra khi gửi yêu cầu.');
    } finally {
      setSubmittingNameChange(false);
    }
  };

  const handleProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNameChangeData(prev => ({ ...prev, proofUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeposit = async () => {
    if (!depositAmount || isNaN(Number(depositAmount))) return;
    try {
      await updateProfile({ balance: (profile?.balance || 0) + Number(depositAmount) });
      setIsFinancialModalOpen(false);
      setDepositAmount('');
      alert('Nạp tiền thành công!');
    } catch (error) {
      console.error("Error depositing:", error);
    }
  };

  const handleLinkBank = async () => {
    if (!bankInfo.bankName || !bankInfo.accountNumber || !bankInfo.accountHolder) return;
    try {
      await updateProfile({ bankAccount: bankInfo });
      setIsFinancialModalOpen(false);
      alert('Liên kết ngân hàng thành công!');
    } catch (error) {
      console.error("Error linking bank:", error);
    }
  };

  const handleBuyVip = async () => {
    const VIP_PRICE = 100000;
    if ((profile?.balance || 0) < VIP_PRICE) {
      alert('Số dư không đủ để mua VIP (100,000đ)');
      return;
    }
    try {
      await updateProfile({ 
        balance: (profile?.balance || 0) - VIP_PRICE,
        isVip: true 
      });
      setIsFinancialModalOpen(false);
      alert('Chúc mừng! Bạn đã trở thành thành viên VIP.');
    } catch (error) {
      console.error("Error buying VIP:", error);
    }
  };

  const handleOpenSkillsModal = () => {
    setTempSkills(profile?.skills || []);
    setIsSkillsModalOpen(true);
  };

  const toggleSkill = (skill: string) => {
    setTempSkills(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill) 
        : [...prev, skill]
    );
  };

  const saveSkills = async () => {
    try {
      await updateProfile({ skills: tempSkills });
      setIsSkillsModalOpen(false);
    } catch (error) {
      console.error("Error updating skills:", error);
      alert('Có lỗi xảy ra khi cập nhật kỹ năng.');
    }
  };

  const saveStudentProfile = async () => {
    try {
      await updateProfile(studentEditData);
      setIsStudentEditModalOpen(false);
      alert('Cập nhật hồ sơ thành công!');
    } catch (error) {
      console.error("Error updating student profile:", error);
      alert('Có lỗi xảy ra khi cập nhật hồ sơ.');
    }
  };

  const saveBusinessProfile = async () => {
    try {
      await updateProfile(businessEditData);
      setIsBusinessEditModalOpen(false);
      alert('Cập nhật hồ sơ thành công!');
    } catch (error) {
      console.error("Error updating business profile:", error);
      alert('Có lỗi xảy ra khi cập nhật hồ sơ.');
    }
  };

  const savePersonalInfo = async () => {
    try {
      await updateProfile(personalInfoData);
      setIsPersonalInfoModalOpen(false);
      alert('Cập nhật thông tin cá nhân thành công!');
    } catch (error) {
      console.error("Error updating personal info:", error);
      alert('Có lỗi xảy ra khi cập nhật thông tin.');
    }
  };

  return (
    <div className="min-h-screen pb-24 bg-[#F8FAFC]">
      {/* Profile Header Section */}
      <div className="relative pt-12 pb-8 px-6 bg-white border-b border-gray-100">
        <div className="flex flex-col items-center">
          <div className="relative mb-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`w-28 h-28 rounded-[40px] p-1 shadow-2xl ${profile?.isVip ? 'bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600' : 'bg-gradient-to-br from-[#1877F2] to-[#4F46E5]'}`}
            >
              <div className="w-full h-full bg-white rounded-[36px] flex items-center justify-center text-4xl overflow-hidden border-4 border-white relative">
                {profile?.photoURL ? (
                  <img src={profile.photoURL} alt={profile.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full bg-gray-50 flex items-center justify-center">
                    <User size={48} className="text-gray-300" />
                  </div>
                )}
              </div>
            </motion.div>
            <div className={`absolute -bottom-2 -right-2 p-2.5 rounded-2xl shadow-xl border-4 border-white flex items-center justify-center transition-transform hover:scale-110 ${profile?.isVip ? 'bg-amber-500 text-white' : 'bg-[#1877F2] text-white'}`}>
              {profile?.isVip ? (
                <Star size={18} fill="currentColor" />
              ) : (
                <ShieldCheck size={18} />
              )}
            </div>
          </div>
          
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-black text-gray-900 flex items-center justify-center gap-2">
              {profile?.displayName}
              <button 
                onClick={() => setIsNameChangeModalOpen(true)}
                className="p-1.5 bg-gray-50 rounded-lg text-gray-400 hover:text-indigo-600 transition-colors"
                title="Đổi tên hiển thị"
              >
                <Edit2 size={14} />
              </button>
              {profile?.email === "congapro60@gmail.com" && <span className="bg-red-100 text-red-600 text-[10px] px-2 py-0.5 rounded-md font-black uppercase tracking-tighter">Boss</span>}
              {profile?.role === 'admin' && profile?.email !== "congapro60@gmail.com" && <span className="bg-indigo-100 text-indigo-600 text-[10px] px-2 py-0.5 rounded-md font-black uppercase tracking-tighter">Admin</span>}
              {profile?.isVip && <Star size={20} className="text-amber-500" fill="currentColor" />}
            </h2>
            <div className="flex items-center justify-center gap-2">
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                profile?.email === "congapro60@gmail.com" ? 'bg-red-50 text-red-600 border-red-100' :
                profile?.role === 'admin' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                profile?.role === 'student' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                profile?.role === 'parent' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                'bg-purple-50 text-purple-600 border-purple-100'
              }`}>
                {profile?.email === "congapro60@gmail.com" ? 'Boss' : 
                 profile?.role === 'admin' ? 'Quản trị viên' :
                 profile?.role === 'student' ? 'Học sinh' : 
                 profile?.role === 'parent' ? 'Phụ huynh' : 
                 profile?.role === 'business' ? 'Doanh nghiệp' : 'Người dùng'}
              </span>
              {profile?.isVip && (
                <span className="px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-amber-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                  <Star size={10} fill="currentColor" />
                  VIP
                </span>
              )}
            </div>
            <p className="text-xs font-bold text-gray-400 mt-2">{profile?.email}</p>
            
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="text-center">
                <p className="text-lg font-black text-gray-900">{profile?.friends?.length || 0}</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Bạn bè</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-black text-gray-900">{profile?.following?.length || 0}</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Đang theo dõi</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-black text-gray-900">{profile?.followers?.length || 0}</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Người theo dõi</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full max-w-md mt-8">
            <div className="bg-gray-50 rounded-3xl p-4 text-center border border-gray-100">
              <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest mb-1">Số dư ví</p>
              <p className="text-lg font-black text-[#1877F2]">{profile?.balance?.toLocaleString('vi-VN') || 0}đ</p>
            </div>
            <div className="bg-gray-50 rounded-3xl p-4 text-center border border-gray-100">
              <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest mb-1">Tín nhiệm</p>
              <div className="flex items-center justify-center gap-1">
                <Star size={14} className="fill-yellow-400 text-yellow-400" />
                <p className="text-lg font-black text-gray-900">{averageRating}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="px-6 -mt-6">
        <div className="bg-white rounded-[32px] p-2 shadow-xl shadow-blue-900/5 border border-gray-100 grid grid-cols-3 gap-1">
          <button 
            onClick={() => { setFinancialAction('deposit'); setIsFinancialModalOpen(true); }}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl hover:bg-gray-50 transition-all group"
          >
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus size={24} />
            </div>
            <span className="text-[11px] font-bold text-gray-600">Nạp tiền</span>
          </button>
          <button 
            onClick={() => { setFinancialAction('bank'); setIsFinancialModalOpen(true); }}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl hover:bg-gray-50 transition-all group border-x border-gray-50"
          >
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Building2 size={24} />
            </div>
            <span className="text-[11px] font-bold text-gray-600">Ngân hàng</span>
          </button>
          <button 
            onClick={() => navigate('/vip')}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl hover:bg-gray-50 transition-all group"
          >
            <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Award size={24} />
            </div>
            <span className="text-[11px] font-bold text-gray-600">Mua VIP</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-5xl mx-auto px-6 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left Column: Social & Identity */}
          <div className="space-y-6">
            {/* CV Management */}
            {profile?.role === 'student' && (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-[#1877F2] to-[#4F46E5] rounded-[32px] p-6 text-white shadow-xl shadow-blue-100 relative overflow-hidden group">
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                      <FileText className="text-amber-400" size={24} />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em]">Hồ sơ chuyên nghiệp</span>
                    </div>
                    <h3 className="text-xl font-black mb-2 tracking-tight">Trình tạo CV TeenTask</h3>
                    <p className="text-white/80 text-xs mb-6 max-w-[200px]">Tạo và quản lý CV chuyên nghiệp để ứng tuyển việc làm & kiến tập.</p>
                    <button 
                      onClick={() => navigate('/cv-builder')}
                      className="bg-white text-[#1877F2] px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-transform active:scale-95 flex items-center gap-2"
                    >
                      <Edit2 size={14} />
                      {profile?.cvId ? 'Chỉnh sửa CV' : 'Tạo CV mới'}
                    </button>
                  </div>
                  <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform"></div>
                  <div className="absolute bottom-[-10%] left-[-5%] w-20 h-20 bg-white/10 rounded-full blur-2xl"></div>
                </div>

                <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 flex items-center justify-between group cursor-pointer hover:border-primary/30 transition-all" onClick={() => navigate('/schedule')}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                      <CalendarDays size={24} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">Lịch trình kiến tập</h4>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Xem các buổi đã đăng ký</p>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-slate-300 group-hover:text-primary transition-all" />
                </div>
              </div>
            )}

            {/* Friend Requests */}
            {friendRequests.length > 0 && (
              <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                  <UserPlus size={18} className="text-indigo-600" />
                  Yêu cầu kết bạn ({friendRequests.length})
                </h3>
                <div className="space-y-3">
                  {friendRequests.map(req => (
                    <div key={req.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white overflow-hidden border border-gray-100">
                          {req.fromPhoto ? (
                            <img src={req.fromPhoto} alt={req.fromName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <Users size={20} />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{req.fromName}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{req.fromRole}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => acceptFriendRequest(req.id)}
                          className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
                        >
                          <Check size={16} />
                        </button>
                        <button 
                          onClick={() => rejectFriendRequest(req.id)}
                          className="p-2 bg-white text-gray-400 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Relationship Requests */}
            {relationshipRequests.length > 0 && (
              <div className="bg-white rounded-[32px] p-6 shadow-sm border border-amber-100 bg-amber-50/30">
                <h3 className="font-bold text-amber-900 flex items-center gap-2 mb-4">
                  <Heart size={18} className="text-amber-500" />
                  Yêu cầu mối quan hệ ({relationshipRequests.length})
                </h3>
                <div className="space-y-3">
                  {relationshipRequests.map(rel => (
                    <div key={rel.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-amber-100 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gray-50 overflow-hidden border border-gray-100">
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
                            Muốn xác nhận là: <span className="text-indigo-600">{rel.title}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => rejectRelationship(rel.id)}
                          className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                        >
                          <X size={18} />
                        </button>
                        <button 
                          onClick={() => acceptRelationship(rel.id)}
                          className="p-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors shadow-sm"
                        >
                          <Check size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Relationships */}
            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                <Heart size={18} className="text-red-500" />
                Mối quan hệ ({relationships.filter(r => r.status === 'accepted').length})
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {relationships.filter(r => r.status === 'accepted').length > 0 ? (
                  relationships.filter(r => r.status === 'accepted').map(rel => (
                    <div key={rel.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-2xl">
                      <div className="w-12 h-12 rounded-2xl bg-white overflow-hidden border border-gray-100">
                        {rel.relatedUserPhoto ? (
                          <img src={rel.relatedUserPhoto} alt={rel.relatedUserName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Users size={24} />
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">{rel.relatedUserName}</h4>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            rel.type === 'Family' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                          }`}>
                            {rel.type === 'Family' ? 'Gia đình' : 'Công việc'}
                          </span>
                          <span className="text-[10px] text-gray-400 font-bold">• {rel.title}</span>
                          <span className="text-[10px] text-green-600 font-black uppercase tracking-widest ml-auto">Đã xác thực</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="space-y-4">
                    {relationships.filter(r => r.status === 'pending').length > 0 && (
                      <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100">
                        <p className="text-[10px] text-amber-700 font-bold flex items-center gap-2">
                          <Clock size={12} />
                          Bạn có {relationships.filter(r => r.status === 'pending').length} yêu cầu đang chờ phản hồi
                        </p>
                      </div>
                    )}
                    <p className="text-center text-xs text-gray-400 py-4">Chưa có mối quan hệ nào được xác thực.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Friends List */}
            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                <Users size={18} className="text-indigo-600" />
                Bạn bè ({friends.length})
              </h3>
              <div className="space-y-3">
                {friends.length > 0 ? (
                  friends.map(friend => (
                    <div key={friend.uid} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white overflow-hidden border border-gray-100">
                          {friend.photoURL ? (
                            <img src={friend.photoURL} alt={friend.displayName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <Users size={20} />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{friend.displayName}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{friend.role}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          setSelectedFriend(friend);
                          setIsRelationshipModalOpen(true);
                        }}
                        className="p-2 bg-white text-indigo-600 border border-indigo-50 rounded-xl hover:bg-indigo-50 transition-colors"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-xs text-gray-400 py-4">Bạn chưa có người bạn nào.</p>
                )}
              </div>
            </div>

            {/* Teen CV (if student) */}
            {profile?.role === 'student' && (
              <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <Award size={18} className="text-[#4F46E5]" />
                    Teen CV
                  </h3>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setIsStudentEditModalOpen(true)}
                      className="p-2 bg-gray-50 rounded-xl text-gray-400 hover:text-[#4F46E5] transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button className="p-2 bg-gray-50 rounded-xl text-gray-400 hover:text-[#4F46E5] transition-colors">
                      <Download size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Kỹ năng</h4>
                      <button 
                        onClick={handleOpenSkillsModal}
                        className="text-[10px] font-bold text-indigo-600 flex items-center gap-1"
                      >
                        <Plus size={12} /> Chỉnh sửa
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(profile?.skills || []).length > 0 ? (
                        profile?.skills.map((skill) => (
                          <span key={skill} className="px-3 py-1.5 bg-indigo-50 text-[#4F46E5] text-xs font-medium rounded-lg">
                            {skill}
                          </span>
                        ))
                      ) : (
                        <p className="text-xs text-gray-400 italic">Chưa có kỹ năng nào được chọn</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Thành tích học tập</h4>
                    <div className="space-y-2">
                      {(profile?.achievements || []).length > 0 ? (
                        profile?.achievements.map((ach, idx) => (
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

                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Portfolio & Dự án</h4>
                    <div className="space-y-2">
                      {(profile?.portfolioLinks || []).length > 0 ? (
                        profile?.portfolioLinks.map((link, idx) => (
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
                        <p className="text-xs text-gray-400 italic">Chưa có liên kết portfolio nào</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Huy hiệu</h4>
                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                      {badges.map((badge) => (
                        <div key={badge.label} className={`flex flex-col items-center gap-1 p-3 rounded-2xl ${badge.color} min-w-[80px] shadow-sm`}>
                          <span className="text-2xl">{badge.icon}</span>
                          <span className="text-[10px] font-bold text-center">{badge.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Business Profile (if business) */}
            {profile?.role === 'business' && (
              <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <Building2 size={18} className="text-indigo-600" />
                    Hồ sơ doanh nghiệp
                  </h3>
                  <button 
                    onClick={() => setIsBusinessEditModalOpen(true)}
                    className="p-2 bg-gray-50 rounded-xl text-gray-400 hover:text-indigo-600 transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Lĩnh vực</p>
                      <p className="text-sm font-bold text-gray-700">{profile?.industry || profile?.businessField || 'Chưa cập nhật'}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Quy mô</p>
                      <p className="text-sm font-bold text-gray-700">{profile?.companySize || 'Chưa cập nhật'}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Năm thành lập</p>
                      <p className="text-sm font-bold text-gray-700">{profile?.foundedYear || 'Chưa cập nhật'}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Website</p>
                      {profile?.website ? (
                        <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-indigo-600 flex items-center gap-1">
                          Truy cập <ExternalLink size={12} />
                        </a>
                      ) : (
                        <p className="text-sm font-bold text-gray-700">Chưa cập nhật</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Giới thiệu doanh nghiệp</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {profile?.bio || 'Chưa có mô tả giới thiệu doanh nghiệp.'}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Trạng thái xác minh</h4>
                    <div className={`p-4 rounded-2xl border flex items-center gap-4 ${verificationUI.bgColor} ${verificationUI.badgeColor}`}>
                      <div className={`w-10 h-10 rounded-full bg-white flex items-center justify-center ${verificationUI.color}`}>
                        {verificationUI.icon}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{verificationUI.label}</p>
                        <p className="text-[10px] opacity-70 font-medium">Hồ sơ doanh nghiệp đã được TeenTask kiểm duyệt.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {verificationUI && (
              <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Trạng thái hồ sơ</h4>
                <div 
                  onClick={() => {
                    if (profile?.verificationStatus !== 'verified') {
                      navigate('/verify');
                    }
                  }}
                  className={cn(
                    "bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-4 transition-all",
                    profile?.verificationStatus !== 'verified' && "cursor-pointer hover:bg-gray-100 hover:border-indigo-200 active:scale-[0.98]"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${verificationUI.bgColor} flex items-center justify-center ${verificationUI.color}`}>
                        {verificationUI.icon}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{verificationUI.label}</p>
                        <p className="text-xs text-gray-500">
                          {profile?.verificationSubmittedAt 
                            ? `Cập nhật: ${new Date(profile.verificationSubmittedAt).toLocaleDateString('vi-VN')}`
                            : 'Chưa gửi xác minh'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider border ${verificationUI.badgeColor}`}>
                        {verificationUI.statusText}
                      </span>
                      {profile?.verificationStatus !== 'verified' && (
                        <ChevronRight size={16} className="text-gray-400" />
                      )}
                    </div>
                  </div>

                  {profile?.verificationStatus !== 'verified' && (
                    <div className="pt-2 flex items-center gap-2 text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
                      <Edit2 size={12} />
                      Nhấn để xác minh lại
                    </div>
                  )}

                  {profile?.verificationStatus === 'pending' && profile?.role === 'student' && (
                    <div className="pt-4 border-t border-gray-200 space-y-2">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Thông tin đã gửi:</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white p-2 rounded-xl border border-gray-100">
                          <p className="text-[8px] text-gray-400 font-bold uppercase">Họ tên</p>
                          <p className="text-xs font-bold text-gray-700">{profile.fullName}</p>
                        </div>
                        <div className="bg-white p-2 rounded-xl border border-gray-100">
                          <p className="text-[8px] text-gray-400 font-bold uppercase">Ngày sinh</p>
                          <p className="text-xs font-bold text-gray-700">{profile.dob}</p>
                        </div>
                        <div className="bg-white p-2 rounded-xl border border-gray-100">
                          <p className="text-[8px] text-gray-400 font-bold uppercase">Lớp</p>
                          <p className="text-xs font-bold text-gray-700">{profile.class}</p>
                        </div>
                        <div className="bg-white p-2 rounded-xl border border-gray-100">
                          <p className="text-[8px] text-gray-400 font-bold uppercase">Trường</p>
                          <p className="text-xs font-bold text-gray-700">{profile.school}</p>
                        </div>
                      </div>
                      {profile.idCardPhoto && (
                        <div className="mt-2">
                          <p className="text-[8px] text-gray-400 font-bold uppercase mb-1">Ảnh CCCD/Thẻ HS</p>
                          <img src={profile.idCardPhoto} alt="ID" className="w-full h-24 object-cover rounded-xl border border-gray-100" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Applications & Settings */}
          <div className="space-y-6">
            {/* My Applications (if student) */}
            {profile?.role === 'student' && (
              <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-6">
                  <Briefcase size={18} className="text-[#4F46E5]" />
                  Việc làm của tôi
                </h3>

                <div className="space-y-4">
                  {loading ? (
                    <div className="flex justify-center py-4">
                      <div className="w-6 h-6 border-2 border-[#4F46E5] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : applications.length > 0 ? (
                    applications.map(app => {
                      const isPendingLong = app.parentStatus === 'pending' && (Date.now() - app.createdAt > 48 * 60 * 60 * 1000);
                      
                      return (
                        <div key={app.id} className={`p-4 bg-gray-50 rounded-2xl border ${isPendingLong ? 'border-amber-200 bg-amber-50/30' : 'border-gray-100'}`}>
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-bold text-sm text-gray-900">{app.job?.title || 'Công việc đã xóa'}</h4>
                              <p className="text-[10px] text-gray-500">{app.job?.businessName}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                              app.finalStatus === 'completed' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                              app.finalStatus === 'accepted' ? 'bg-green-50 text-green-600 border-green-100' :
                              app.finalStatus === 'rejected' ? 'bg-red-50 text-red-600 border-red-100' :
                              'bg-amber-50 text-amber-600 border-amber-100'
                            }`}>
                              {app.finalStatus === 'completed' ? 'Hoàn thành' :
                               app.finalStatus === 'accepted' ? 'Đã nhận' :
                               app.finalStatus === 'rejected' ? 'Từ chối' : 'Đang chờ'}
                            </span>
                          </div>
                          
                          {isPendingLong && (
                            <div className="mt-2 flex items-center gap-2 p-2 bg-amber-100/50 rounded-xl text-[10px] font-bold text-amber-700 border border-amber-200">
                              <AlertTriangle size={12} />
                              <span>Phụ huynh chưa duyệt sau 48h.</span>
                            </div>
                          )}

                          {app.finalStatus === 'completed' && !(app as any).reviewed && (
                            <button 
                              onClick={() => {
                                setSelectedApp(app);
                                setIsReviewModalOpen(true);
                              }}
                              className="mt-3 w-full py-2 bg-white text-[#4F46E5] border border-indigo-100 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-indigo-50 transition-colors"
                            >
                              <Star size={14} /> Đánh giá
                            </button>
                          )}
                          {app.finalStatus === 'completed' && (app as any).reviewed && (
                            <div className="mt-3 w-full py-2 bg-gray-50 text-gray-400 border border-gray-100 rounded-xl text-[10px] font-bold flex items-center justify-center gap-2">
                              <Check size={14} /> Đã đánh giá
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-center text-xs text-gray-400 py-4">Bạn chưa ứng tuyển công việc nào.</p>
                  )}
                </div>
              </div>
            )}

            {/* Account Settings */}
            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Settings size={18} className="text-gray-400" />
                Cài đặt tài khoản
              </h3>
              <div className="space-y-1">
                <button 
                  onClick={() => setIsPersonalInfoModalOpen(true)}
                  className="w-full flex justify-between items-center p-3 hover:bg-gray-50 rounded-2xl transition-colors text-sm text-gray-600 group"
                >
                  <span className="font-medium group-hover:text-gray-900">Thông tin cá nhân</span>
                  <ChevronRight size={16} className="text-gray-300" />
                </button>
                {(profile?.role === 'business' || profile?.role === 'parent') && (
                  <button 
                    onClick={() => setIsRoleModalOpen(true)}
                    className="w-full flex justify-between items-center p-3 hover:bg-indigo-50 rounded-2xl transition-colors text-sm text-indigo-600 group"
                  >
                    <span className="font-bold">Chuyển đổi vai trò</span>
                    <ChevronRight size={16} className="text-indigo-300" />
                  </button>
                )}
                <button 
                  onClick={logout}
                  className="w-full flex justify-between items-center p-3 hover:bg-red-50 rounded-2xl transition-colors text-sm text-red-500 group mt-2"
                >
                  <span className="font-bold">Đăng xuất</span>
                  <LogOut size={16} className="text-red-300" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Info Modal */}
      <AnimatePresence>
        {isPersonalInfoModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[40px] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <User size={20} />
                  </div>
                  <h3 className="text-xl font-black text-gray-900">Thông tin cá nhân</h3>
                </div>
                <button onClick={() => setIsPersonalInfoModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 space-y-8 overflow-y-auto no-scrollbar">
                {/* Basic Info Section */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Thông tin cơ bản</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 ml-1">Họ và tên</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                          type="text"
                          value={personalInfoData.fullName}
                          onChange={(e) => setPersonalInfoData({ ...personalInfoData, fullName: e.target.value })}
                          placeholder="Ví dụ: Nguyễn Văn A"
                          className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600/20 outline-none transition-all text-sm font-medium"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 ml-1">Ngày sinh</label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                          type="date"
                          value={personalInfoData.dob}
                          onChange={(e) => setPersonalInfoData({ ...personalInfoData, dob: e.target.value })}
                          className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600/20 outline-none transition-all text-sm font-medium"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 ml-1">Giới tính</label>
                      <div className="flex gap-2">
                        {['Nam', 'Nữ', 'Khác'].map((g) => (
                          <button
                            key={g}
                            onClick={() => setPersonalInfoData({ ...personalInfoData, gender: g as any })}
                            className={`flex-1 py-3 rounded-2xl text-sm font-bold border-2 transition-all ${
                              personalInfoData.gender === g 
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-600' 
                              : 'border-transparent bg-gray-50 text-gray-400 hover:bg-gray-100'
                            }`}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 ml-1">Số điện thoại</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                          type="tel"
                          value={personalInfoData.phone}
                          onChange={(e) => setPersonalInfoData({ ...personalInfoData, phone: e.target.value })}
                          placeholder="Nhập số điện thoại..."
                          className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600/20 outline-none transition-all text-sm font-medium"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Location & Social Section */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Vị trí & Liên hệ</h4>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 ml-1">Địa chỉ / Vị trí hiện tại</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="text"
                        value={personalInfoData.location}
                        onChange={(e) => setPersonalInfoData({ ...personalInfoData, location: e.target.value })}
                        placeholder="Ví dụ: Hà Nội, Việt Nam"
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600/20 outline-none transition-all text-sm font-medium"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 ml-1">Email liên hệ</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="email"
                        value={profile?.email}
                        disabled
                        className="w-full pl-12 pr-4 py-3 bg-gray-100 border-2 border-transparent rounded-2xl text-sm font-medium text-gray-400 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                {/* Education Section (if student) */}
                {profile?.role === 'student' && (
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Học vấn</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 ml-1">Trường học</label>
                        <div className="relative">
                          <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                          <input
                            type="text"
                            value={personalInfoData.school}
                            onChange={(e) => setPersonalInfoData({ ...personalInfoData, school: e.target.value })}
                            placeholder="Tên trường học..."
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600/20 outline-none transition-all text-sm font-medium"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 ml-1">Lớp</label>
                        <input
                          type="text"
                          value={personalInfoData.class}
                          onChange={(e) => setPersonalInfoData({ ...personalInfoData, class: e.target.value })}
                          placeholder="Ví dụ: 12A1"
                          className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600/20 outline-none transition-all text-sm font-medium"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Bio Section */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Giới thiệu</h4>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 ml-1">Mô tả bản thân</label>
                    <textarea
                      value={personalInfoData.bio}
                      onChange={(e) => setPersonalInfoData({ ...personalInfoData, bio: e.target.value })}
                      placeholder="Hãy viết vài dòng về bản thân bạn..."
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600/20 outline-none transition-all text-sm font-medium min-h-[120px] resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gray-50 border-t border-gray-100">
                <button
                  onClick={savePersonalInfo}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98]"
                >
                  LƯU THÔNG TIN
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Relationship Modal */}
      <AnimatePresence>
        {isRelationshipModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white">
                <h3 className="text-xl font-bold text-gray-900">Thiết lập mối quan hệ</h3>
                <button onClick={() => setIsRelationshipModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                  <div className="w-12 h-12 rounded-xl bg-white overflow-hidden border border-gray-100">
                    {selectedFriend?.photoURL ? (
                      <img src={selectedFriend.photoURL} alt={selectedFriend.displayName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Users size={24} />
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{selectedFriend?.displayName}</h4>
                    <p className="text-xs text-gray-500">Thêm người này vào danh sách mối quan hệ</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Loại mối quan hệ</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setRelationshipType('Family')}
                        className={`py-3 rounded-2xl text-sm font-bold border-2 transition-all flex items-center justify-center gap-2 ${
                          relationshipType === 'Family' ? 'border-red-500 bg-red-50 text-red-600' : 'border-gray-100 bg-white text-gray-400'
                        }`}
                      >
                        <Heart size={16} /> Gia đình
                      </button>
                      <button
                        onClick={() => setRelationshipType('Professional')}
                        className={`py-3 rounded-2xl text-sm font-bold border-2 transition-all flex items-center justify-center gap-2 ${
                          relationshipType === 'Professional' ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-100 bg-white text-gray-400'
                        }`}
                      >
                        <BriefcaseIcon size={16} /> Công việc
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Danh xưng / Chức danh</label>
                    <input
                      type="text"
                      value={relationshipTitle}
                      onChange={(e) => setRelationshipTitle(e.target.value)}
                      placeholder={relationshipType === 'Family' ? 'Ví dụ: Bố, Mẹ, Anh trai...' : 'Ví dụ: Đồng nghiệp, Quản lý...'}
                      className="w-full px-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600/20 outline-none transition-all text-sm font-medium"
                    />
                  </div>
                </div>

                <button
                  onClick={handleAddRelationship}
                  disabled={!relationshipTitle}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 disabled:opacity-50"
                >
                  XÁC NHẬN
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Skills Selection Modal */}
      <AnimatePresence>
        {isSkillsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="w-full max-w-md bg-white rounded-t-[40px] p-8 max-h-[90vh] flex flex-col"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black">Kỹ năng của bạn</h2>
                <button onClick={() => setIsSkillsModalOpen(false)} className="p-2 bg-gray-100 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar mb-6">
                <p className="text-sm text-gray-500 mb-4">Chọn những kỹ năng bạn đang sở hữu để nhận được gợi ý việc làm phù hợp nhất.</p>
                <div className="flex flex-wrap gap-2">
                  {PREDEFINED_SKILLS.map((skill) => {
                    const isSelected = tempSkills.includes(skill);
                    return (
                      <button
                        key={skill}
                        onClick={() => toggleSkill(skill)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 border ${
                          isSelected 
                            ? 'bg-indigo-600 text-white border-indigo-600' 
                            : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-200'
                        }`}
                      >
                        {skill}
                        {isSelected && <Check size={14} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={saveSkills}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100"
              >
                LƯU THAY ĐỔI
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Financial Modal */}
      <AnimatePresence>
        {isFinancialModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white">
                <h3 className="text-xl font-bold text-gray-900">
                  {financialAction === 'deposit' ? 'Nạp tiền' : financialAction === 'bank' ? 'Liên kết ngân hàng' : 'Mua VIP'}
                </h3>
                <button onClick={() => setIsFinancialModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6">
                {financialAction === 'deposit' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Số tiền nạp (VNĐ)</label>
                      <input
                        type="number"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        placeholder="Ví dụ: 50000"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4F46E5] transition-all"
                      />
                    </div>
                    <button
                      onClick={handleDeposit}
                      className="w-full py-4 bg-[#4F46E5] text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-[#4338CA] transition-all"
                    >
                      Xác nhận nạp tiền
                    </button>
                  </div>
                )}

                {financialAction === 'bank' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Tên ngân hàng</label>
                      <input
                        type="text"
                        value={bankInfo.bankName}
                        onChange={(e) => setBankInfo({ ...bankInfo, bankName: e.target.value })}
                        placeholder="Ví dụ: Vietcombank"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4F46E5] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Số tài khoản</label>
                      <input
                        type="text"
                        value={bankInfo.accountNumber}
                        onChange={(e) => setBankInfo({ ...bankInfo, accountNumber: e.target.value })}
                        placeholder="Nhập số tài khoản"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4F46E5] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Chủ tài khoản</label>
                      <input
                        type="text"
                        value={bankInfo.accountHolder}
                        onChange={(e) => setBankInfo({ ...bankInfo, accountHolder: e.target.value })}
                        placeholder="NGUYEN VAN A"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4F46E5] transition-all uppercase"
                      />
                    </div>
                    <button
                      onClick={handleLinkBank}
                      className="w-full py-4 bg-[#4F46E5] text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-[#4338CA] transition-all"
                    >
                      Lưu thông tin
                    </button>
                  </div>
                )}

                {financialAction === 'vip' && (
                  <div className="text-center space-y-6">
                    <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center mx-auto text-amber-500">
                      <Award size={40} />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 mb-2">Gói VIP TeenTask</h4>
                      <p className="text-sm text-gray-500">
                        Đặc quyền VIP: Ưu tiên duyệt hồ sơ, huy hiệu vàng nổi bật, và nhiều ưu đãi khác.
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-2xl">
                      <p className="text-sm text-gray-400 mb-1">Giá gói</p>
                      <p className="text-2xl font-black text-gray-900">100,000đ</p>
                    </div>
                    <button
                      onClick={() => {
                        setIsFinancialModalOpen(false);
                        navigate('/vip');
                      }}
                      disabled={profile?.isVip}
                      className={`w-full py-4 rounded-2xl font-bold shadow-lg transition-all ${
                        profile?.isVip 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-amber-400 to-amber-600 text-white shadow-amber-100 hover:from-amber-500 hover:to-amber-700'
                      }`}
                    >
                      {profile?.isVip ? 'Bạn đã là VIP' : 'Xem gói VIP'}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isRoleModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="w-full max-w-md bg-white rounded-t-[40px] p-8"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black">Chọn vai trò</h2>
                <button onClick={() => setIsRoleModalOpen(false)} className="p-2 bg-gray-100 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-3">
                {[
                  { id: 'student', label: 'Học sinh', icon: '👨‍🎓', desc: 'Tìm việc làm & kiến tập' },
                  { id: 'parent', label: 'Phụ huynh', icon: '🛡️', desc: 'Giám sát & hỗ trợ con' },
                  { id: 'business', label: 'Doanh nghiệp', icon: '🏢', desc: 'Tuyển dụng nhân tài trẻ' },
                ].map((role) => (
                  <button
                    key={role.id}
                    onClick={() => handleRoleChange(role.id as any)}
                    className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 text-left ${
                      profile?.role === role.id 
                      ? 'border-indigo-600 bg-indigo-50/50' 
                      : 'border-gray-100 bg-white hover:border-gray-200'
                    }`}
                  >
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-2xl">
                      {role.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{role.label}</h4>
                      <p className="text-[11px] text-gray-400 font-medium">{role.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Review Modal */}
      <AnimatePresence>
        {isReviewModalOpen && selectedApp && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="w-full max-w-md bg-white rounded-t-[40px] p-8"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black">Đánh giá</h2>
                <button onClick={() => setIsReviewModalOpen(false)} className="p-2 bg-gray-100 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-4 text-[#4F46E5]">
                  <Star size={40} fill="currentColor" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">Trải nghiệm của bạn tại</h3>
                <p className="text-[#4F46E5] font-black text-lg">{selectedApp.job?.businessName}</p>
              </div>

              <form onSubmit={handleSubmitReview} className="space-y-6">
                <div className="flex justify-center gap-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewData({ ...reviewData, rating: star })}
                      className={`p-2 transition-transform active:scale-90 ${reviewData.rating >= star ? 'text-amber-400' : 'text-gray-200'}`}
                    >
                      <Star size={32} fill={reviewData.rating >= star ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 text-center">Nhận xét của bạn</label>
                  <textarea
                    required
                    value={reviewData.comment}
                    onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                    className="w-full p-4 bg-gray-50 rounded-2xl font-medium outline-none focus:ring-2 focus:ring-[#4F46E5] min-h-[120px]"
                    placeholder="Chia sẻ trải nghiệm của bạn..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="w-full py-4 bg-[#4F46E5] text-white rounded-2xl font-black shadow-lg shadow-indigo-200 disabled:opacity-50"
                >
                  {submittingReview ? 'ĐANG GỬI...' : 'GỬI ĐÁNH GIÁ'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Student Profile Edit Modal */}
      <AnimatePresence>
        {isStudentEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[40px] w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-black text-gray-900">Chỉnh sửa Teen CV</h3>
                <button onClick={() => setIsStudentEditModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 space-y-6 overflow-y-auto no-scrollbar">
                {/* Achievements */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Thành tích học tập</label>
                    <button 
                      onClick={() => setStudentEditData({ ...studentEditData, achievements: [...studentEditData.achievements, ''] })}
                      className="text-[10px] font-bold text-indigo-600 flex items-center gap-1"
                    >
                      <Plus size={12} /> Thêm mới
                    </button>
                  </div>
                  {studentEditData.achievements.map((ach, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        value={ach}
                        onChange={(e) => {
                          const newAch = [...studentEditData.achievements];
                          newAch[idx] = e.target.value;
                          setStudentEditData({ ...studentEditData, achievements: newAch });
                        }}
                        placeholder="Ví dụ: Giải Nhất HSG Thành phố môn Toán"
                        className="flex-1 px-4 py-3 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600/20 outline-none transition-all text-sm font-medium"
                      />
                      <button 
                        onClick={() => {
                          const newAch = studentEditData.achievements.filter((_, i) => i !== idx);
                          setStudentEditData({ ...studentEditData, achievements: newAch });
                        }}
                        className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Portfolio Links */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Portfolio & Dự án</label>
                    <button 
                      onClick={() => setStudentEditData({ ...studentEditData, portfolioLinks: [...studentEditData.portfolioLinks, { title: '', url: '' }] })}
                      className="text-[10px] font-bold text-indigo-600 flex items-center gap-1"
                    >
                      <Plus size={12} /> Thêm mới
                    </button>
                  </div>
                  {studentEditData.portfolioLinks.map((link, idx) => (
                    <div key={idx} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Liên kết #{idx + 1}</span>
                        <button 
                          onClick={() => {
                            const newLinks = studentEditData.portfolioLinks.filter((_, i) => i !== idx);
                            setStudentEditData({ ...studentEditData, portfolioLinks: newLinks });
                          }}
                          className="text-red-400 hover:text-red-600"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={link.title}
                        onChange={(e) => {
                          const newLinks = [...studentEditData.portfolioLinks];
                          newLinks[idx].title = e.target.value;
                          setStudentEditData({ ...studentEditData, portfolioLinks: newLinks });
                        }}
                        placeholder="Tên dự án/Portfolio"
                        className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium"
                      />
                      <input
                        type="url"
                        value={link.url}
                        onChange={(e) => {
                          const newLinks = [...studentEditData.portfolioLinks];
                          newLinks[idx].url = e.target.value;
                          setStudentEditData({ ...studentEditData, portfolioLinks: newLinks });
                        }}
                        placeholder="https://..."
                        className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 bg-gray-50 border-t border-gray-100">
                <button
                  onClick={saveStudentProfile}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100"
                >
                  LƯU THÔNG TIN
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Business Profile Edit Modal */}
      <AnimatePresence>
        {isBusinessEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[40px] w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-black text-gray-900">Thông tin doanh nghiệp</h3>
                <button onClick={() => setIsBusinessEditModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 space-y-6 overflow-y-auto no-scrollbar">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Lĩnh vực</label>
                    <input
                      type="text"
                      value={businessEditData.industry}
                      onChange={(e) => setBusinessEditData({ ...businessEditData, industry: e.target.value })}
                      placeholder="Ví dụ: Công nghệ, Giáo dục..."
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600/20 outline-none transition-all text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Quy mô</label>
                    <select
                      value={businessEditData.companySize}
                      onChange={(e) => setBusinessEditData({ ...businessEditData, companySize: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600/20 outline-none transition-all text-sm font-medium"
                    >
                      <option value="">Chọn quy mô</option>
                      <option value="1-10 nhân viên">1-10 nhân viên</option>
                      <option value="11-50 nhân viên">11-50 nhân viên</option>
                      <option value="51-200 nhân viên">51-200 nhân viên</option>
                      <option value="200+ nhân viên">200+ nhân viên</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Năm thành lập</label>
                    <input
                      type="number"
                      value={businessEditData.foundedYear}
                      onChange={(e) => setBusinessEditData({ ...businessEditData, foundedYear: Number(e.target.value) })}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600/20 outline-none transition-all text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Website</label>
                    <input
                      type="url"
                      value={businessEditData.website}
                      onChange={(e) => setBusinessEditData({ ...businessEditData, website: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600/20 outline-none transition-all text-sm font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Giới thiệu doanh nghiệp</label>
                  <textarea
                    value={profile?.bio || ''}
                    onChange={(e) => updateProfile({ bio: e.target.value })}
                    placeholder="Mô tả ngắn về doanh nghiệp của bạn..."
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600/20 outline-none transition-all text-sm font-medium min-h-[120px]"
                  />
                </div>
              </div>

              <div className="p-6 bg-gray-50 border-t border-gray-100">
                <button
                  onClick={saveBusinessProfile}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100"
                >
                  CẬP NHẬT HỒ SƠ
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Name Change Request Modal */}
      <AnimatePresence>
        {isNameChangeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[40px] w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-black text-gray-900">Yêu cầu đổi tên hiển thị</h3>
                <button onClick={() => setIsNameChangeModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleNameChangeSubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-6 space-y-6 overflow-y-auto no-scrollbar">
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Tên hiển thị hiện tại</label>
                    <div className="w-full px-4 py-3 bg-gray-100 border-2 border-transparent rounded-2xl text-sm font-medium text-gray-500">
                      {profile?.displayName}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Tên hiển thị mới</label>
                    <input
                      type="text"
                      required
                      value={nameChangeData.newName}
                      onChange={(e) => setNameChangeData({ ...nameChangeData, newName: e.target.value })}
                      placeholder="Nhập tên mới muốn hiển thị..."
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600/20 outline-none transition-all text-sm font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Lí do đổi tên</label>
                    <textarea
                      required
                      value={nameChangeData.reason}
                      onChange={(e) => setNameChangeData({ ...nameChangeData, reason: e.target.value })}
                      placeholder="Giải thích lí do bạn muốn đổi tên..."
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600/20 outline-none transition-all text-sm font-medium min-h-[100px]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Minh chứng xác thực</label>
                    <div className="space-y-4">
                      <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-3xl cursor-pointer hover:bg-gray-50 transition-all">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Plus className="w-8 h-8 text-gray-400 mb-2" />
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Tải ảnh lên</p>
                          </div>
                          <input type="file" className="hidden" accept="image/*" onChange={handleProofUpload} />
                        </label>
                      </div>
                      {nameChangeData.proofUrl && (
                        <div className="relative aspect-video rounded-2xl overflow-hidden border border-gray-100">
                          <img src={nameChangeData.proofUrl} alt="Proof" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <button 
                            type="button"
                            onClick={() => setNameChangeData(prev => ({ ...prev, proofUrl: '' }))}
                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-100">
                  <button
                    type="submit"
                    disabled={submittingNameChange}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 disabled:opacity-50"
                  >
                    {submittingNameChange ? 'ĐANG GỬI...' : 'GỬI YÊU CẦU'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Briefcase(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}

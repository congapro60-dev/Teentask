import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useState, Component, ErrorInfo, ReactNode } from 'react';
import { GraduationCap, ShieldCheck, Building2, ChevronRight, ArrowLeft, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Error Boundary Component
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-red-100">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldAlert className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Đã có lỗi xảy ra</h1>
            <p className="text-gray-600 mb-6">Ứng dụng gặp sự cố không mong muốn. Vui lòng tải lại trang hoặc thử lại sau.</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 px-4 bg-[#4F46E5] text-white rounded-xl font-semibold hover:bg-[#4338CA] transition-colors"
            >
              Tải lại trang
            </button>
            {process.env.NODE_ENV === 'development' && (
              <pre className="mt-6 p-4 bg-gray-50 rounded-lg text-left text-xs text-red-500 overflow-auto max-h-40">
                {this.state.error?.toString()}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
import Layout from './components/Layout';
import Home from './components/Home';
import Jobs from './components/Jobs';
import Shadowing from './components/Shadowing';
import Profile from './components/Profile';
import RoleSelection from './components/RoleSelection';
import BusinessDashboard from './components/BusinessDashboard';
import ManageJobs from './components/ManageJobs';
import ParentDashboard from './components/ParentDashboard';
import AdminDashboard from './components/AdminDashboard';
import BossManagement from './components/BossManagement';
import AboutApp from './components/AboutApp';
import SurveyForm from './components/SurveyForm';
import SurveyAdmin from './components/SurveyAdmin';
import VerificationFlow from './components/VerificationFlow';
import ChatList from './components/ChatList';
import ChatRoom from './components/ChatRoom';
import Notifications from './components/Notifications';
import CompanyProfile from './components/CompanyProfile';
import StudentProfile from './components/StudentProfile';
import SearchUsers from './components/SearchUsers';
import TrustScore from './components/TrustScore';
import Tasks from './components/Tasks';
import Companies from './components/Companies';
import Saved from './components/Saved';
import Vip from './components/Vip';
import Wallet from './components/Wallet';
import CVBuilder from './components/CVBuilder';
import CalendarView from './components/CalendarView';
import { FirebaseProvider, useFirebase } from './components/FirebaseProvider';

function AppContent() {
  const navigate = useNavigate();
  const { user, profile, loading, login, updateProfile } = useFirebase();
  const [view, setView] = useState<'guest' | 'login'>('guest');
  const [selectedRole, setSelectedRole] = useState<'student' | 'parent' | 'business' | 'admin' | null>(null);
  const [skipVerification, setSkipVerification] = useState(() => {
    return localStorage.getItem('skipVerification') === 'true';
  });

  const handleSkipVerification = () => {
    setSkipVerification(true);
    localStorage.setItem('skipVerification', 'true');
  };

  const ADMIN_EMAIL = "cuong.vuviet@thedeweyschools.edu.vn";
  const BOSS_EMAIL = "congapro60@gmail.com";
  const userEmailLower = profile?.email?.toLowerCase();
  const isBoss = userEmailLower === BOSS_EMAIL.toLowerCase();
  const isAdmin = profile?.role === 'admin' || userEmailLower === ADMIN_EMAIL.toLowerCase() || isBoss;

  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoginError(null);
    try {
      await login(selectedRole || undefined);
    } catch (error: any) {
      if (error.message === "không thể cấp quyền đăng nhập ở vai trò này") {
        setLoginError(error.message);
      } else {
        setLoginError("Đã có lỗi xảy ra khi đăng nhập.");
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-[#4F46E5] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500 font-medium animate-pulse">Đang tải TeenTask...</p>
        </div>
      </div>
    );
  }

  const appWrapperClass = "min-h-screen bg-[#F8FAFC] relative";

  if (!user) {
    return (
      <div className="bg-[#F8FAFC] min-h-screen">
        <div className={appWrapperClass}>
          <Layout>
            <AnimatePresence mode="wait">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/jobs" element={<Jobs />} />
                  <Route path="/shadowing" element={<Shadowing />} />
                  <Route path="/profile" element={
                    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
                      <div className="w-full max-w-md mb-10 text-center md:text-left">
                        <h2 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">Chào mừng trở lại!</h2>
                        <p className="text-gray-500 font-medium">Chọn vai trò của bạn và đăng nhập để tiếp tục khám phá.</p>
                      </div>

                      <div className="w-full max-w-md grid grid-cols-2 gap-4 mb-6">
                        {[
                          { id: 'student', label: 'Học sinh', icon: GraduationCap, desc: 'Tìm việc & kiến tập' },
                          { id: 'parent', label: 'Phụ huynh', icon: ShieldCheck, desc: 'Giám sát con' },
                          { id: 'business', label: 'Doanh nghiệp', icon: Building2, desc: 'Tuyển dụng' },
                          { id: 'admin', label: 'Quản trị', icon: ShieldAlert, desc: 'Hệ thống' },
                        ].map((role) => (
                          <button
                            key={role.id}
                            onClick={() => {
                              setSelectedRole(role.id as any);
                              setLoginError(null);
                            }}
                            className={`w-full p-4 rounded-3xl border-2 transition-all flex flex-col items-center text-center gap-3 ${
                              selectedRole === role.id 
                              ? 'border-indigo-600 bg-indigo-50/50 shadow-lg shadow-indigo-100' 
                              : 'border-white bg-white hover:border-gray-200 shadow-sm'
                            }`}
                          >
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                              selectedRole === role.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'
                            }`}>
                              <role.icon size={24} />
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-900 text-sm">{role.label}</h4>
                              <p className="text-[8px] text-gray-400 font-bold uppercase tracking-wider mt-1">{role.desc}</p>
                            </div>
                          </button>
                        ))}
                      </div>

                      {loginError && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="w-full max-w-md p-4 mb-6 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600"
                        >
                          <ShieldAlert size={20} />
                          <p className="text-sm font-bold">{loginError}</p>
                        </motion.div>
                      )}

                      <button
                        onClick={handleLogin}
                        className="w-full max-w-md py-5 bg-white text-gray-900 border border-gray-200 rounded-2xl font-bold shadow-sm hover:bg-gray-50 transition-all flex items-center justify-center gap-4 text-lg"
                      >
                        <img src="https://www.google.com/favicon.ico" className="w-6 h-6" alt="Google" />
                        Đăng nhập với Google
                      </button>
                    </div>
                  } />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </motion.div>
            </AnimatePresence>
          </Layout>
        </div>
      </div>
    );
  }

  if (user && (!profile || !profile.role)) {
    return (
      <div className="bg-[#0F0C29] min-h-screen">
        <div className={appWrapperClass}>
          <RoleSelection 
            onSelect={async (role) => {
              const BOSS_EMAIL = "congapro60@gmail.com";
              const userEmailLower = user.email?.toLowerCase();
              const isAuthorizedAdmin = userEmailLower === BOSS_EMAIL.toLowerCase() || userEmailLower === ADMIN_EMAIL.toLowerCase();
              
              if (role === 'admin' && !isAuthorizedAdmin) {
                alert('Chỉ quản trị viên mới có quyền truy cập vai trò này.');
                return;
              }
              await updateProfile({ 
                role,
                verificationStatus: role === 'admin' ? 'verified' : 'pending',
                isVerified: role === 'admin'
              });
            }} 
          />
        </div>
      </div>
    );
  }

  const userRole = profile?.role || 'student';

  // Verification Check: Only show flow if user hasn't submitted yet
  const hasSubmittedVerification = profile?.verificationSubmittedAt != null;
  const needsVerification = userRole !== 'admin' && !hasSubmittedVerification && !skipVerification && !isBoss;

  if (needsVerification) {
    return (
      <div className="bg-white min-h-screen">
        <div className={appWrapperClass}>
          <VerificationFlow onClose={handleSkipVerification} />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F8FAFC] min-h-screen">
      <div className={appWrapperClass}>
        <Layout>
          <AnimatePresence mode="wait">
            <motion.div
              key={userRole}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Routes>
                <Route path="/messages" element={<ChatList />} />
                <Route path="/messages/:chatId" element={<ChatRoom />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/company/:businessId" element={<CompanyProfile />} />
                <Route path="/student/:studentId" element={<StudentProfile />} />
                <Route path="/search-users" element={<SearchUsers />} />
                <Route path="/about" element={<AboutApp />} />
                <Route path="/survey" element={<SurveyForm />} />
                <Route path="/admin" element={isAdmin ? <AdminDashboard /> : <Navigate to="/" />} />
                <Route path="/admin/surveys" element={isAdmin ? <SurveyAdmin /> : <Navigate to="/" />} />
                <Route path="/boss-manage" element={isBoss ? <BossManagement /> : <Navigate to="/" />} />
                <Route path="/" element={<Home />} />
                <Route path="/jobs" element={<Jobs />} />
                <Route path="/shadowing" element={<Shadowing />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/trust-score" element={<TrustScore />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/companies" element={<Companies />} />
                <Route path="/saved" element={<Saved />} />
                <Route path="/vip" element={<Vip />} />
                <Route path="/wallet" element={<Wallet />} />
                <Route path="/cv-builder" element={<CVBuilder />} />
                <Route path="/schedule" element={<CalendarView />} />
                <Route path="/verify" element={<VerificationFlow onClose={() => navigate('/profile')} />} />
                {userRole === 'business' ? (
                  <>
                    <Route path="/jobs-manage" element={<ManageJobs />} />
                    <Route path="/shadowing-manage" element={<div className="p-6"><h1>Quản lý Kiến tập</h1></div>} />
                  </>
                ) : userRole === 'parent' ? (
                  <>
                    <Route path="/monitoring" element={<ParentDashboard />} />
                  </>
                ) : null}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </Layout>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <FirebaseProvider>
          <AppContent />
        </FirebaseProvider>
      </Router>
    </ErrorBoundary>
  );
}

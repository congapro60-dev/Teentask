import { ReactNode, useState, useEffect } from 'react';
import { Home, Briefcase, GraduationCap, MessageSquare, User, Heart, ShieldCheck, Bell, Search, Menu, X, LogOut, Settings, HelpCircle, Star, Info, PieChart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useFirebase } from './FirebaseProvider';
import { auth, db } from './FirebaseProvider';
import { signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import SearchOverlay from './SearchOverlay';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { profile } = useFirebase();
  const BOSS_EMAIL = "congapro60@gmail.com";
  const ADMIN_EMAIL = "cuong.vuviet@thedeweyschools.edu.vn";
  const userEmailLower = profile?.email?.toLowerCase();
  const isBoss = userEmailLower === BOSS_EMAIL.toLowerCase();
  const isAdmin = profile?.role === 'admin' || userEmailLower === ADMIN_EMAIL.toLowerCase() || isBoss;
  const userRole = profile?.role || 'student';
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    if (!profile) return;
    
    // Unread notifications
    const notifsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', profile.uid),
      where('read', '==', false)
    );
    
    const unsubNotifs = onSnapshot(notifsQuery, (snapshot) => {
      setUnreadNotifications(snapshot.size);
    }, (error) => {
      console.error("Error fetching unread notifications:", error);
    });

    return () => {
      unsubNotifs();
    };
  }, [profile]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const mainNavItems = [
    { icon: Home, label: 'Trang chủ', path: '/' },
    { icon: MessageSquare, label: 'Tin nhắn', path: '/messages', badge: unreadMessages > 0 ? unreadMessages : undefined },
    { icon: Bell, label: 'Thông báo', path: '/notifications', badge: unreadNotifications > 0 ? unreadNotifications : undefined },
    { icon: Info, label: 'Thông tin dự án', path: '/about' },
  ];

  const roleSpecificItems = {
    admin: [
      { icon: PieChart, label: 'Xem khảo sát', path: '/admin/surveys' },
      { icon: ShieldCheck, label: 'Quản trị', path: '/admin' },
    ],
    boss: [
      { icon: Settings, label: 'Quản lý', path: '/boss-manage' },
      { icon: PieChart, label: 'Xem khảo sát', path: '/admin/surveys' },
      { icon: ShieldCheck, label: 'Quản trị', path: '/admin' },
    ],
    business: [
      { icon: Briefcase, label: 'QL Việc làm', path: '/jobs-manage' },
      { icon: GraduationCap, label: 'QL Kiến tập', path: '/shadowing-manage' },
    ],
    parent: [
      { icon: ShieldCheck, label: 'Giám sát', path: '/monitoring' },
    ],
    student: [
      { icon: Heart, label: 'Đã lưu', path: '/saved' },
    ]
  };

  const currentRoleItems = isBoss
    ? roleSpecificItems.boss
    : (isAdmin && userRole !== 'admin') 
      ? [...(roleSpecificItems[userRole as keyof typeof roleSpecificItems] || []), ...roleSpecificItems.admin]
      : (roleSpecificItems[userRole as keyof typeof roleSpecificItems] || []);
  const allNavItems = [...mainNavItems, ...currentRoleItems];

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex flex-col">
      {/* Top Header - Facebook Style */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-[60] px-2 sm:px-4 h-14 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div 
            onClick={() => navigate('/')}
            className="w-9 h-9 bg-[#1877F2] rounded-full flex items-center justify-center shadow-md cursor-pointer"
          >
            <GraduationCap size={20} className="text-white" />
          </div>
          <h1 
            onClick={() => navigate('/')}
            className="text-xl font-black tracking-tighter text-[#1877F2] hidden sm:block cursor-pointer"
          >
            TEENTASK
          </h1>
        </div>

        <div className="flex-1 max-w-md mx-4">
          <button 
            onClick={() => setIsSearchOpen(true)}
            className="w-full bg-[#F0F2F5] hover:bg-gray-200 rounded-full py-2 px-4 flex items-center gap-3 text-gray-500 transition-all text-sm group"
          >
            <Search size={18} className="group-hover:scale-110 transition-transform" />
            <span className="hidden md:inline">Tìm kiếm trên TeenTask</span>
            <span className="md:inline hidden">...</span>
            <span className="md:hidden">Tìm kiếm...</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {profile?.email === "congapro60@gmail.com" ? (
            <div className="hidden lg:flex items-center gap-1 px-3 py-1 bg-red-50 border border-red-200 rounded-full text-red-600 text-[10px] font-black uppercase tracking-widest mr-2">
              Boss
            </div>
          ) : profile?.role === 'admin' ? (
            <div className="hidden lg:flex items-center gap-1 px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-full text-indigo-600 text-[10px] font-black uppercase tracking-widest mr-2">
              Admin
            </div>
          ) : profile?.isVip && (
            <div className="hidden lg:flex items-center gap-1 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-amber-600 text-[10px] font-black uppercase tracking-widest mr-2">
              <Star size={12} fill="currentColor" />
              VIP Member
            </div>
          )}
          
          <div className="hidden md:flex items-center gap-2">
            <button 
              onClick={() => navigate('/search-users')}
              className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-all relative group"
              title="Tìm kiếm người dùng"
            >
              <Search size={20} />
            </button>
          </div>

          <button 
            onClick={() => navigate('/profile')}
            className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden border-2 border-transparent hover:border-gray-300 transition-all relative"
          >
            {profile?.photoURL ? (
              <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <User size={24} className="text-gray-500 m-auto" />
            )}
            {profile?.isVip && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full border-2 border-white flex items-center justify-center">
                <Star size={8} className="text-white" fill="currentColor" />
              </div>
            )}
          </button>
        </div>
      </header>

      {/* Navigation Tabs - Facebook Style */}
      <nav className="bg-white border-b border-gray-200 sticky top-14 z-50 flex justify-center px-2 sm:px-4">
        <div className="flex w-full max-w-3xl justify-between">
          {mainNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex-1 flex flex-col items-center justify-center py-2 border-b-4 transition-all relative",
                  isActive 
                    ? "border-[#1877F2] text-[#1877F2]" 
                    : "border-transparent text-gray-500 hover:bg-gray-50"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <item.icon size={26} strokeWidth={isActive ? 2.5 : 2} />
                    {item.badge && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-bold mt-1 hidden sm:block">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="flex-1 flex flex-col items-center justify-center py-2 border-b-4 border-transparent text-gray-500 hover:bg-gray-50"
          >
            <Menu size={26} />
            <span className="text-[10px] font-bold mt-1 hidden sm:block">Menu</span>
          </button>
        </div>
      </nav>

      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex justify-center py-4 px-0 sm:px-4">
        <div className="w-full max-w-7xl flex gap-0 lg:gap-6 justify-center">
          {/* Left Sidebar - Desktop only */}
          <aside className="hidden lg:block w-[280px] xl:w-[320px] shrink-0 sticky top-32 h-fit space-y-2">
            <NavLink to="/profile" className="flex items-center gap-3 p-2 hover:bg-gray-200 rounded-xl transition-colors relative group">
              <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-200 relative">
                {profile?.photoURL ? (
                  <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User size={20} className="text-gray-500 m-auto mt-2" />
                )}
                {profile?.isVip && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full border-2 border-white flex items-center justify-center">
                    <Star size={8} className="text-white" fill="currentColor" />
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm">{profile?.displayName || 'Người dùng'}</span>
                {profile?.isVip && (
                  <span className="text-[8px] font-black text-amber-600 uppercase tracking-widest">VIP Member</span>
                )}
              </div>
            </NavLink>
            {allNavItems.map((item) => (
              <NavLink 
                key={item.path} 
                to={item.path}
                className="flex items-center gap-3 p-2 hover:bg-gray-200 rounded-xl transition-colors"
              >
                <item.icon size={24} className="text-[#1877F2]" />
                <span className="font-bold text-sm">{item.label}</span>
              </NavLink>
            ))}
          </aside>

          {/* Main Feed */}
          <main className="flex-1 w-full max-w-[680px] px-2 sm:px-0">
            {children}
          </main>

          {/* Right Sidebar - Desktop only */}
          <aside className="hidden xl:block w-[280px] xl:w-[320px] shrink-0 sticky top-32 h-fit">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
              <h3 className="font-bold text-gray-500 mb-4 px-2 uppercase text-xs tracking-wider">Được tài trợ</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl cursor-pointer">
                  <img src="https://picsum.photos/seed/edu/100/100" className="w-24 h-24 rounded-xl object-cover" referrerPolicy="no-referrer" />
                  <div>
                    <h4 className="text-sm font-bold">Khóa học TeenTask Pro</h4>
                    <p className="text-xs text-gray-500">teentask.edu.vn</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Side Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-[#F0F2F5] shadow-2xl z-[101] overflow-y-auto"
            >
              <div className="p-4 flex items-center justify-between sticky top-0 bg-[#F0F2F5] z-10">
                <h2 className="text-2xl font-bold">Menu</h2>
                <button onClick={() => setIsMenuOpen(false)} className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center">
                  <X size={20} />
                </button>
              </div>

              <div className="p-4 space-y-4">
                <NavLink to="/profile" onClick={() => setIsMenuOpen(false)} className="bg-white p-4 rounded-xl shadow-sm flex items-center gap-3 hover:bg-gray-50 transition-colors relative overflow-hidden">
                  {profile?.email === "congapro60@gmail.com" ? (
                    <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
                      <div className="absolute top-2 right-[-20px] w-24 bg-red-500 text-white text-[8px] font-black uppercase tracking-widest text-center py-1 rotate-45 shadow-sm">
                        BOSS
                      </div>
                    </div>
                  ) : profile?.role === 'admin' ? (
                    <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
                      <div className="absolute top-2 right-[-20px] w-24 bg-indigo-500 text-white text-[8px] font-black uppercase tracking-widest text-center py-1 rotate-45 shadow-sm">
                        ADMIN
                      </div>
                    </div>
                  ) : profile?.isVip && (
                    <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
                      <div className="absolute top-2 right-[-20px] w-24 bg-amber-400 text-white text-[8px] font-black uppercase tracking-widest text-center py-1 rotate-45 shadow-sm">
                        VIP
                      </div>
                    </div>
                  )}
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 border border-gray-100 relative">
                    {profile?.photoURL ? (
                      <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <User size={28} className="text-gray-500 m-auto mt-2" />
                    )}
                    {profile?.isVip && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full border-2 border-white flex items-center justify-center">
                        <Star size={10} className="text-white" fill="currentColor" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{profile?.displayName || 'Người dùng'}</h3>
                    <p className="text-xs text-gray-500 font-medium">Xem trang cá nhân của bạn</p>
                  </div>
                </NavLink>

                <div className="grid grid-cols-2 gap-3">
                  {allNavItems.map((item) => (
                    <NavLink 
                      key={item.path} 
                      to={item.path}
                      onClick={() => setIsMenuOpen(false)}
                      className="bg-white p-4 rounded-xl shadow-sm flex flex-col gap-2 hover:bg-gray-50 transition-all border border-transparent hover:border-gray-200"
                    >
                      <div className="w-10 h-10 bg-[#E7F3FF] rounded-full flex items-center justify-center">
                        <item.icon size={24} className="text-[#1877F2]" />
                      </div>
                      <span className="font-bold text-sm text-gray-700">{item.label}</span>
                    </NavLink>
                  ))}
                </div>

                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                  <button className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100">
                    <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">
                      <Settings size={20} />
                    </div>
                    <span className="font-bold text-sm flex-1 text-left text-gray-700">Cài đặt & quyền riêng tư</span>
                  </button>
                  <button className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100">
                    <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">
                      <HelpCircle size={20} />
                    </div>
                    <span className="font-bold text-sm flex-1 text-left text-gray-700">Trợ giúp & hỗ trợ</span>
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="w-full p-4 flex items-center gap-3 hover:bg-red-50 transition-colors text-red-600"
                  >
                    <div className="w-9 h-9 bg-red-100 rounded-full flex items-center justify-center">
                      <LogOut size={20} />
                    </div>
                    <span className="font-bold text-sm flex-1 text-left">Đăng xuất</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

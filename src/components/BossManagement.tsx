import { useState, useEffect } from 'react';
import { ShieldCheck, UserPlus, Search, Trash2, User, Mail, ShieldAlert, CheckCircle2, XCircle, CreditCard, Star, Clock, Eye, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, useFirebase, handleFirestoreError, OperationType } from './FirebaseProvider';
import { collection, query, where, getDocs, doc, updateDoc, getDoc, limit, onSnapshot, orderBy, addDoc } from 'firebase/firestore';
import { cn } from '../lib/utils';

interface AdminUser {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  role: string;
}

export default function BossManagement() {
  const { profile } = useFirebase();
  const [activeTab, setActiveTab] = useState<'admins' | 'transactions' | 'vip'>('admins');
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [vipRequests, setVipRequests] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<AdminUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [googleId, setGoogleId] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const BOSS_EMAIL = "congapro60@gmail.com";
  const isBoss = profile?.email?.toLowerCase() === BOSS_EMAIL.toLowerCase();

  useEffect(() => {
    if (!isBoss) return;

    fetchAdmins();

    const unsubTransactions = onSnapshot(query(collection(db, 'transactions'), orderBy('createdAt', 'desc')), (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubVip = onSnapshot(query(collection(db, 'users'), where('vipRequested', '==', true)), (snapshot) => {
      setVipRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubTransactions();
      unsubVip();
    };
  }, [isBoss]);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'admin'));
      const snapshot = await getDocs(q);
      const adminList = snapshot.docs
        .map(doc => ({ uid: doc.id, ...doc.data() } as AdminUser))
        .filter(admin => admin.email.toLowerCase() !== BOSS_EMAIL.toLowerCase());
      setAdmins(adminList);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'users');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      // Simple search by display name (case sensitive in Firestore, but we'll do our best)
      const q = query(
        collection(db, 'users'), 
        where('displayName', '>=', searchQuery),
        where('displayName', '<=', searchQuery + '\uf8ff'),
        limit(10)
      );
      const snapshot = await getDocs(q);
      const results = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as AdminUser));
      setSearchResults(results);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'users');
    } finally {
      setLoading(false);
    }
  };

  const toggleAdminRole = async (user: AdminUser, makeAdmin: boolean) => {
    setActionLoading(user.uid);
    setMessage(null);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        role: makeAdmin ? 'admin' : 'student', // Default back to student if removed
        isVerified: makeAdmin ? true : user.role === 'admin' ? false : true // Keep verified if they were already verified
      });
      
      setMessage({ 
        type: 'success', 
        text: makeAdmin ? `Đã bổ nhiệm ${user.displayName} làm Admin` : `Đã gỡ quyền Admin của ${user.displayName}` 
      });
      
      fetchAdmins();
      if (searchResults.length > 0) {
        setSearchResults(prev => prev.map(u => u.uid === user.uid ? { ...u, role: makeAdmin ? 'admin' : 'student' } : u));
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Không thể cập nhật quyền hạn' });
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setActionLoading(null);
    }
  };

  const appointByEmail = async () => {
    if (!googleId.trim()) return;
    setLoading(true);
    setMessage(null);
    try {
      // Find user by email
      const q = query(collection(db, 'users'), where('email', '==', googleId.trim().toLowerCase()));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        setMessage({ type: 'error', text: 'Không tìm thấy người dùng với email này. Người dùng cần đăng nhập vào hệ thống ít nhất một lần.' });
      } else {
        const userDoc = snapshot.docs[0];
        const userData = userDoc.data() as AdminUser;
        await toggleAdminRole({ uid: userDoc.id, ...userData }, true);
        setGoogleId('');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Lỗi khi tìm kiếm người dùng' });
      handleFirestoreError(error, OperationType.LIST, 'users');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveTransaction = async (tx: any, status: 'completed' | 'failed') => {
    setActionLoading(tx.id);
    try {
      await updateDoc(doc(db, 'transactions', tx.id), { status });
      
      if (status === 'completed') {
        const userRef = doc(db, 'users', tx.userId);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const currentBalance = userDoc.data().balance || 0;
          await updateDoc(userRef, { balance: currentBalance + tx.amount });
          
          await addDoc(collection(db, 'notifications'), {
            userId: tx.userId,
            title: 'Nạp tiền thành công',
            message: `Bạn đã nạp thành công ${tx.amount.toLocaleString()}đ vào tài khoản.`,
            type: 'system',
            read: false,
            createdAt: Date.now()
          });
        }
      }
      setMessage({ type: 'success', text: status === 'completed' ? 'Đã phê duyệt giao dịch' : 'Đã từ chối giao dịch' });
    } catch (error) {
      console.error("Error approving transaction:", error);
      setMessage({ type: 'error', text: 'Lỗi khi xử lý giao dịch' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveVip = async (userId: string, status: 'approved' | 'rejected') => {
    setActionLoading(userId);
    try {
      if (status === 'approved') {
        await updateDoc(doc(db, 'users', userId), { 
          isVip: true, 
          vipRequested: false,
          vipExpiry: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
        });
        await addDoc(collection(db, 'notifications'), {
          userId,
          title: 'Nâng cấp VIP thành công',
          message: 'Chúc mừng! Bạn đã trở thành thành viên VIP của TeenTask.',
          type: 'system',
          read: false,
          createdAt: Date.now()
        });
      } else {
        await updateDoc(doc(db, 'users', userId), { vipRequested: false });
      }
      setMessage({ type: 'success', text: status === 'approved' ? 'Đã nâng cấp VIP cho người dùng' : 'Đã từ chối yêu cầu VIP' });
    } catch (error) {
      console.error("Error approving VIP:", error);
      setMessage({ type: 'error', text: 'Lỗi khi xử lý yêu cầu VIP' });
    } finally {
      setActionLoading(null);
    }
  };

  if (!isBoss) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <ShieldAlert size={64} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Truy cập bị từ chối</h2>
        <p className="text-gray-600">Chỉ Boss mới có quyền truy cập vào trang quản lý này.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-100 rounded-2xl text-red-600">
            <ShieldCheck size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Quản lý Boss</h1>
            <p className="text-gray-500 text-sm">Công cụ tối cao dành cho quản trị viên cấp cao nhất</p>
          </div>
        </div>

        <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 gap-1 overflow-x-auto">
          {[
            { id: 'admins', label: 'Admin', icon: ShieldCheck },
            { id: 'transactions', label: 'Giao dịch', icon: CreditCard },
            { id: 'vip', label: 'Duyệt VIP', icon: Star },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap",
                activeTab === tab.id 
                  ? "bg-red-600 text-white shadow-lg shadow-red-100" 
                  : "text-gray-500 hover:bg-gray-50"
              )}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {message && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "p-4 rounded-xl flex items-center gap-3 border",
            message.type === 'success' ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"
          )}
        >
          {message.type === 'success' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
          <span className="font-medium">{message.text}</span>
        </motion.div>
      )}

      {activeTab === 'admins' && (
        <div className="space-y-8">
          {/* Current Admins */}
          <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <ShieldCheck size={20} className="text-[#4F46E5]" />
                Danh sách Admin hiện tại
              </h2>
              <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-500">
                {admins.length} người
              </span>
            </div>
            <div className="divide-y divide-gray-50">
              {loading && admins.length === 0 ? (
                <div className="p-12 text-center text-gray-400">Đang tải...</div>
              ) : admins.length === 0 ? (
                <div className="p-12 text-center text-gray-400">Chưa có Admin nào được bổ nhiệm</div>
              ) : (
                admins.map(admin => (
                  <div key={admin.uid} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <img 
                        src={admin.photoURL || `https://ui-avatars.com/api/?name=${admin.displayName}&background=random`} 
                        alt={admin.displayName}
                        className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                      />
                      <div>
                        <h3 className="font-bold text-gray-900 text-sm">{admin.displayName}</h3>
                        <p className="text-xs text-gray-500">{admin.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleAdminRole(admin, false)}
                      disabled={actionLoading === admin.uid}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      title="Gỡ quyền Admin"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Appoint New Admin */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Search by Name */}
            <section className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-4">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <UserPlus size={20} className="text-[#4F46E5]" />
                Tìm theo tên
              </h2>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Nhập tên người dùng..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-[#4F46E5] transition-all"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  className="px-4 py-2.5 bg-[#4F46E5] text-white rounded-2xl font-bold text-sm hover:bg-[#4338CA] transition-all"
                >
                  Tìm
                </button>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {searchResults.map(user => (
                  <div key={user.uid} className="p-3 flex items-center justify-between bg-gray-50 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <img 
                        src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=random`} 
                        alt={user.displayName}
                        className="w-8 h-8 rounded-full"
                      />
                      <div className="min-w-0">
                        <h3 className="font-bold text-gray-900 text-xs truncate">{user.displayName}</h3>
                        <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
                      </div>
                    </div>
                    {user.role === 'admin' ? (
                      <span className="text-[10px] font-black text-[#4F46E5] uppercase">Admin</span>
                    ) : (
                      <button
                        onClick={() => toggleAdminRole(user, true)}
                        disabled={actionLoading === user.uid}
                        className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-[10px] font-bold text-gray-700 hover:bg-[#4F46E5] hover:text-white hover:border-[#4F46E5] transition-all"
                      >
                        Bổ nhiệm
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Appoint by Email */}
            <section className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-4">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <Mail size={20} className="text-[#4F46E5]" />
                Bổ nhiệm qua Google ID
              </h2>
              <p className="text-xs text-gray-500">Nhập chính xác địa chỉ email Google của người muốn bổ nhiệm.</p>
              <div className="space-y-3">
                <input
                  type="email"
                  placeholder="example@gmail.com"
                  value={googleId}
                  onChange={(e) => setGoogleId(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-[#4F46E5] transition-all"
                />
                <button
                  onClick={appointByEmail}
                  disabled={loading || !googleId.trim()}
                  className="w-full py-3 bg-[#1877F2] text-white rounded-2xl font-bold text-sm hover:bg-[#166FE5] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <UserPlus size={18} />
                  Bổ nhiệm ngay
                </button>
              </div>
            </section>
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <section className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <CreditCard size={20} className="text-[#4F46E5]" />
              Phê duyệt nạp tiền
            </h2>
            <span className="px-3 py-1 bg-amber-50 rounded-full text-xs font-bold text-amber-600">
              {transactions.filter(t => t.status === 'pending').length} chờ duyệt
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {transactions.length === 0 ? (
              <div className="p-12 text-center text-gray-400">Không có giao dịch nào</div>
            ) : (
              transactions.map(tx => (
                <div key={tx.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center",
                      tx.status === 'completed' ? "bg-green-50 text-green-600" :
                      tx.status === 'pending' ? "bg-amber-50 text-amber-600" :
                      "bg-red-50 text-red-600"
                    )}>
                      <CreditCard size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{tx.description}</h3>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Clock size={12} />
                        {new Date(tx.createdAt).toLocaleString()}
                        <span className="mx-1">•</span>
                        <span className="font-mono">{tx.id}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-6">
                    <div className="text-right">
                      <p className="text-lg font-black text-indigo-600">{tx.amount.toLocaleString()}đ</p>
                      <p className={cn(
                        "text-[10px] font-black uppercase tracking-widest",
                        tx.status === 'completed' ? "text-green-500" :
                        tx.status === 'pending' ? "text-amber-500" :
                        "text-red-500"
                      )}>
                        {tx.status === 'completed' ? 'Thành công' : tx.status === 'pending' ? 'Chờ duyệt' : 'Thất bại'}
                      </p>
                    </div>
                    {tx.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproveTransaction(tx, 'failed')}
                          disabled={actionLoading === tx.id}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <XCircle size={24} />
                        </button>
                        <button
                          onClick={() => handleApproveTransaction(tx, 'completed')}
                          disabled={actionLoading === tx.id}
                          className="p-2 text-green-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all"
                        >
                          <CheckCircle2 size={24} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {activeTab === 'vip' && (
        <section className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Star size={20} className="text-amber-500" fill="currentColor" />
              Phê duyệt nâng cấp VIP
            </h2>
            <span className="px-3 py-1 bg-amber-50 rounded-full text-xs font-bold text-amber-600">
              {vipRequests.length} yêu cầu
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {vipRequests.length === 0 ? (
              <div className="p-12 text-center text-gray-400">Không có yêu cầu VIP nào</div>
            ) : (
              vipRequests.map(user => (
                <div key={user.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <img src={user.photoURL} alt="" className="w-12 h-12 rounded-2xl object-cover" referrerPolicy="no-referrer" />
                    <div>
                      <h3 className="font-bold text-gray-900">{user.displayName}</h3>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">Số dư: {user.balance?.toLocaleString() || 0}đ</p>
                      <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Đang chờ duyệt VIP</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveVip(user.id, 'rejected')}
                        disabled={actionLoading === user.id}
                        className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-all"
                      >
                        Từ chối
                      </button>
                      <button
                        onClick={() => handleApproveVip(user.id, 'approved')}
                        disabled={actionLoading === user.id}
                        className="px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600 shadow-lg shadow-amber-100 transition-all"
                      >
                        Duyệt VIP
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}
    </div>
  );
}

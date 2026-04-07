import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './FirebaseProvider';
import { useFirebase } from './FirebaseProvider';
import { Transaction } from '../types';
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, History, QrCode, Clock, CheckCircle2, XCircle, AlertCircle, ChevronLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

export default function Wallet() {
  const { profile } = useFirebase();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'deposit' | 'withdraw'>('overview');
  const [depositAmount, setDepositAmount] = useState<number>(50000);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [depositSuccess, setDepositSuccess] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      setTransactions(txData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'transactions');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDepositRequest = async () => {
    if (!auth.currentUser || depositAmount < 10000) return;
    
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'transactions'), {
        userId: auth.currentUser.uid,
        type: 'deposit',
        amount: depositAmount,
        status: 'pending',
        description: `Nạp ${depositAmount.toLocaleString('vi-VN')}đ vào ví`,
        createdAt: Date.now()
      });
      setDepositSuccess(true);
      setTimeout(() => {
        setDepositSuccess(false);
        setActiveTab('overview');
      }, 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'transactions');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 size={16} className="text-emerald-500" />;
      case 'failed': return <XCircle size={16} className="text-red-500" />;
      case 'pending': return <Clock size={16} className="text-amber-500" />;
      default: return <AlertCircle size={16} className="text-slate-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Thành công';
      case 'failed': return 'Thất bại';
      case 'pending': return 'Đang xử lý';
      default: return status;
    }
  };

  // Bank Info for MVP
  const BANK_BIN = '970423'; // TPBank
  const ACCOUNT_NO = '03482732001';
  const ACCOUNT_NAME = 'VU VIET CUONG';
  const transferContent = `NAP ${profile?.uid?.substring(0, 6).toUpperCase()}`;
  const qrUrl = `https://img.vietqr.io/image/${BANK_BIN}-${ACCOUNT_NO}-compact2.png?amount=${depositAmount}&addInfo=${transferContent}&accountName=${ACCOUNT_NAME}`;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-4 sticky top-0 z-50 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ChevronLeft size={24} className="text-slate-700" />
        </button>
        <h1 className="text-xl font-black text-slate-900 tracking-tight">Ví của tôi</h1>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Balance Card */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[32px] p-6 text-white shadow-xl shadow-blue-900/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-6 opacity-80">
              <WalletIcon size={20} />
              <span className="text-sm font-bold uppercase tracking-widest">Số dư khả dụng</span>
            </div>
            
            <h2 className="text-4xl font-black tracking-tighter mb-8">
              {formatCurrency(profile?.balance || 0)}
            </h2>

            <div className="flex gap-3">
              <button 
                onClick={() => setActiveTab('deposit')}
                className="flex-1 bg-white text-blue-600 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors"
              >
                <ArrowDownLeft size={18} />
                Nạp tiền
              </button>
              <button 
                onClick={() => setActiveTab('withdraw')}
                className="flex-1 bg-white/20 text-white py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-white/30 transition-colors backdrop-blur-sm"
              >
                <ArrowUpRight size={18} />
                Rút tiền
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between px-2">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <History size={18} className="text-slate-400" />
                  Lịch sử giao dịch
                </h3>
              </div>

              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : transactions.length > 0 ? (
                <div className="bg-white rounded-[24px] border border-slate-100 overflow-hidden shadow-sm">
                  {transactions.map((tx, i) => (
                    <div key={tx.id} className={`p-4 flex items-center justify-between ${i !== transactions.length - 1 ? 'border-b border-slate-50' : ''}`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                          tx.type === 'deposit' ? 'bg-emerald-50 text-emerald-600' : 
                          tx.type === 'withdrawal' ? 'bg-amber-50 text-amber-600' : 
                          'bg-blue-50 text-blue-600'
                        }`}>
                          {tx.type === 'deposit' ? <ArrowDownLeft size={20} /> : 
                           tx.type === 'withdrawal' ? <ArrowUpRight size={20} /> : 
                           <WalletIcon size={20} />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm mb-0.5">{tx.description}</p>
                          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
                            <span>{formatDistanceToNow(tx.createdAt, { addSuffix: true, locale: vi })}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(tx.status)}
                              {getStatusText(tx.status)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className={`font-black text-sm ${
                        tx.type === 'deposit' || tx.type === 'reward' ? 'text-emerald-600' : 'text-slate-900'
                      }`}>
                        {tx.type === 'deposit' || tx.type === 'reward' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-[24px] border border-slate-100 p-8 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <History size={24} className="text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-medium text-sm">Chưa có giao dịch nào</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'deposit' && (
            <motion.div
              key="deposit"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-slate-900">Nạp tiền (VietQR)</h3>
                <button onClick={() => setActiveTab('overview')} className="text-sm font-bold text-blue-600 hover:underline">
                  Hủy
                </button>
              </div>

              {depositSuccess ? (
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={40} className="text-emerald-500" />
                  </div>
                  <h4 className="text-xl font-black text-slate-900 mb-2">Đã gửi yêu cầu!</h4>
                  <p className="text-slate-500 text-sm">Hệ thống đang xử lý giao dịch của bạn. Tiền sẽ được cộng vào ví trong ít phút.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Số tiền muốn nạp</label>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {[20000, 50000, 100000, 200000, 500000].map(amount => (
                        <button
                          key={amount}
                          onClick={() => setDepositAmount(amount)}
                          className={`py-2 rounded-xl text-sm font-bold transition-colors ${
                            depositAmount === amount 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {amount / 1000}k
                        </button>
                      ))}
                    </div>
                    <div className="relative">
                      <input 
                        type="number" 
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-lg font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">VNĐ</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-6 flex flex-col items-center justify-center border border-slate-100">
                    <p className="text-sm font-bold text-slate-700 mb-4 text-center">Quét mã QR bằng ứng dụng ngân hàng</p>
                    <div className="bg-white p-2 rounded-2xl shadow-sm mb-4">
                      <img src={qrUrl} alt="VietQR" className="w-48 h-48 object-contain" referrerPolicy="no-referrer" />
                    </div>
                    <div className="w-full space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Ngân hàng:</span>
                        <span className="font-bold text-slate-900">MB Bank</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Chủ tài khoản:</span>
                        <span className="font-bold text-slate-900">{ACCOUNT_NAME}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Nội dung:</span>
                        <span className="font-bold text-blue-600">{transferContent}</span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={handleDepositRequest}
                    disabled={isSubmitting || depositAmount < 10000}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white py-4 rounded-2xl font-black text-base transition-colors flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? 'Đang xử lý...' : 'Tôi đã chuyển khoản'}
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'withdraw' && (
            <motion.div
              key="withdraw"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm text-center"
            >
              <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock size={40} className="text-amber-500" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-3">Tính năng đang phát triển</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                Tính năng rút tiền và đổi thưởng (Voucher CGV, Shopee, Thẻ cào...) sẽ sớm được ra mắt trong phiên bản tiếp theo.
              </p>
              <button 
                onClick={() => setActiveTab('overview')}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 px-6 rounded-2xl font-bold text-sm transition-colors"
              >
                Quay lại ví
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

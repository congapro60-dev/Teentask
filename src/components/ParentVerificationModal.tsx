import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, ShieldCheck, AlertCircle, Search, User, Phone, MapPin, ChevronRight, Check } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from './FirebaseProvider';
import { UserProfile } from '../types';

interface ParentVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (guardianData: any) => void;
}

const RELATIONSHIPS = [
  'Bố', 'Mẹ', 'Ông', 'Bà', 'Anh', 'Chị', 'Người giám hộ khác'
];

export default function ParentVerificationModal({ isOpen, onClose, onSuccess }: ParentVerificationModalProps) {
  const [step, setStep] = useState<'selection' | 'search' | 'manual' | 'sent'>('selection');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedParent, setSelectedParent] = useState<UserProfile | null>(null);
  const [relation, setRelation] = useState(RELATIONSHIPS[0]);
  
  // Manual fields
  const [manualData, setManualData] = useState({
    name: '',
    phone: '',
    address: '',
    email: ''
  });

  const [allParents, setAllParents] = useState<UserProfile[]>([]);

  useEffect(() => {
    const fetchInitialParents = async () => {
      try {
        const q = query(
          collection(db, 'users'),
          where('role', '==', 'parent'),
          limit(50)
        );
        const snapshot = await getDocs(q);
        const parents = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
        setAllParents(parents);
        setSearchResults(parents);
      } catch (error) {
        console.error("Error fetching initial parents:", error);
      }
    };
    if (isOpen) fetchInitialParents();
  }, [isOpen]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(allParents);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = allParents.filter(p => 
      p.displayName?.toLowerCase().includes(query) || 
      p.email?.toLowerCase().includes(query)
    );
    setSearchResults(filtered);

    // If no results in local cache, we could trigger a server search for longer queries
    if (filtered.length === 0 && searchQuery.length > 3) {
      handleSearch();
    }
  }, [searchQuery, allParents]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      // Try a broader server search
      const qName = query(
        collection(db, 'users'),
        where('role', '==', 'parent'),
        where('displayName', '>=', searchQuery),
        where('displayName', '<=', searchQuery + '\uf8ff'),
        limit(20)
      );
      const snapshotName = await getDocs(qName);
      const results = snapshotName.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
      
      // Merge with existing results and remove duplicates
      setSearchResults(prev => {
        const combined = [...prev, ...results];
        return combined.filter((v, i, a) => a.findIndex(t => t.uid === v.uid) === i);
      });
    } catch (error) {
      console.error("Error searching parents:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let guardianData = {};
    if (step === 'search' && selectedParent) {
      guardianData = {
        guardianId: selectedParent.uid,
        guardianName: selectedParent.displayName,
        parentEmail: selectedParent.email,
        guardianRelation: relation,
        isManualGuardian: false
      };
    } else if (step === 'manual') {
      guardianData = {
        guardianName: manualData.name,
        guardianPhone: manualData.phone,
        guardianAddress: manualData.address,
        parentEmail: manualData.email,
        guardianRelation: relation,
        isManualGuardian: true
      };
    }

    setStep('sent');
    setTimeout(() => {
      onSuccess(guardianData);
    }, 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-[32px] p-8 z-[70] shadow-2xl overflow-y-auto max-h-[90vh] no-scrollbar"
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2 text-[#4F46E5]">
                <ShieldCheck size={24} />
                <h3 className="text-xl font-bold">Xác minh Phụ huynh</h3>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            {step !== 'sent' && (
              <div className="bg-blue-50 p-4 rounded-2xl mb-6 flex gap-3">
                <AlertCircle className="text-blue-500 shrink-0" size={20} />
                <p className="text-xs text-blue-700 leading-relaxed">
                  Theo quy định pháp luật cho người dưới 18 tuổi, bạn cần sự đồng ý của phụ huynh để ứng tuyển công việc này.
                </p>
              </div>
            )}

            {step === 'selection' && (
              <div className="space-y-3">
                <p className="text-sm font-bold text-gray-700 mb-2">Chọn phương thức xác minh:</p>
                <button
                  onClick={() => setStep('search')}
                  className="w-full p-4 bg-gray-50 rounded-2xl flex items-center justify-between group hover:bg-indigo-50 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                      <Search size={20} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-gray-900">Tìm tài khoản phụ huynh</p>
                      <p className="text-[10px] text-gray-500">Phụ huynh đã có tài khoản TeenTask</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-gray-400 group-hover:text-indigo-600" />
                </button>

                <button
                  onClick={() => setStep('manual')}
                  className="w-full p-4 bg-gray-50 rounded-2xl flex items-center justify-between group hover:bg-indigo-50 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                      <User size={20} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-gray-900">Nhập thông tin thủ công</p>
                      <p className="text-[10px] text-gray-500">Nếu phụ huynh chưa có tài khoản</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-gray-400 group-hover:text-indigo-600" />
                </button>
              </div>
            )}

            {step === 'search' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Tìm theo Tên hoặc Email</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="Nhập tên hoặc email..."
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-[#4F46E5] outline-none"
                      />
                    </div>
                    <button
                      onClick={handleSearch}
                      disabled={isSearching}
                      className="px-4 bg-indigo-600 text-white rounded-2xl font-bold text-xs disabled:opacity-50"
                    >
                      {isSearching ? '...' : 'Tìm'}
                    </button>
                  </div>
                </div>

                {searchResults.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Kết quả tìm kiếm:</p>
                    {searchResults.map(user => (
                      <button
                        key={user.uid}
                        onClick={() => setSelectedParent(user)}
                        className={`w-full p-3 rounded-xl border-2 flex items-center justify-between transition-all ${
                          selectedParent?.uid === user.uid ? 'border-indigo-600 bg-indigo-50' : 'border-gray-50 hover:border-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                            {user.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover" /> : <User className="w-full h-full p-2 text-gray-400" />}
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-bold text-gray-900">{user.displayName}</p>
                            <p className="text-[10px] text-gray-500">{user.email}</p>
                          </div>
                        </div>
                        {selectedParent?.uid === user.uid && <Check size={18} className="text-indigo-600" />}
                      </button>
                    ))}
                  </div>
                )}

                {selectedParent && (
                  <div className="space-y-4 pt-4 border-t border-gray-100">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Mối quan hệ</label>
                      <select
                        value={relation}
                        onChange={(e) => setRelation(e.target.value)}
                        className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-[#4F46E5] outline-none"
                      >
                        {RELATIONSHIPS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <button
                      onClick={handleSubmit}
                      className="w-full py-4 bg-[#4F46E5] text-white rounded-2xl font-bold shadow-lg shadow-indigo-200"
                    >
                      Gửi yêu cầu ứng tuyển
                    </button>
                  </div>
                )}

                <button onClick={() => setStep('selection')} className="text-xs font-bold text-gray-400 hover:text-indigo-600">
                  Quay lại
                </button>
              </div>
            )}

            {step === 'manual' && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Họ và tên người bảo lãnh</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      required
                      value={manualData.name}
                      onChange={(e) => setManualData({ ...manualData, name: e.target.value })}
                      placeholder="Nguyễn Văn A"
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-[#4F46E5] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Số điện thoại</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="tel"
                      required
                      value={manualData.phone}
                      onChange={(e) => setManualData({ ...manualData, phone: e.target.value })}
                      placeholder="0912345678"
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-[#4F46E5] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Địa chỉ</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      required
                      value={manualData.address}
                      onChange={(e) => setManualData({ ...manualData, address: e.target.value })}
                      placeholder="Địa chỉ thường trú"
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-[#4F46E5] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Email (Nếu có)</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="email"
                      value={manualData.email}
                      onChange={(e) => setManualData({ ...manualData, email: e.target.value })}
                      placeholder="parent@example.com"
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-[#4F46E5] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Mối quan hệ</label>
                  <select
                    value={relation}
                    onChange={(e) => setRelation(e.target.value)}
                    className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-[#4F46E5] outline-none"
                  >
                    {RELATIONSHIPS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-[#4F46E5] text-white rounded-2xl font-bold shadow-lg shadow-indigo-200"
                >
                  Gửi yêu cầu ứng tuyển
                </button>

                <button type="button" onClick={() => setStep('selection')} className="w-full text-xs font-bold text-gray-400 hover:text-indigo-600">
                  Quay lại
                </button>
              </form>
            )}

            {step === 'sent' && (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ShieldCheck size={40} />
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">Đã gửi yêu cầu!</h4>
                <p className="text-sm text-gray-500 mb-8">
                  Thông tin ứng tuyển và xác minh phụ huynh đã được gửi đi. Bạn sẽ nhận được thông báo khi có kết quả.
                </p>
                <button
                  onClick={onClose}
                  className="w-full py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                >
                  Đóng
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

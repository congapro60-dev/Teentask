import React, { useState, useEffect } from 'react';
import { Search, UserPlus, UserCheck, Clock, User, Star, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';
import { collection, query, getDocs, where, onSnapshot } from 'firebase/firestore';
import { db, useFirebase } from './FirebaseProvider';
import { UserProfile, FriendRequest } from '../types';
import { useNavigate } from 'react-router-dom';

export default function SearchUsers() {
  const { profile, sendFriendRequest, createChat } = useFirebase();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [sentRequests, setSentRequests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!profile) return;

    const q = query(
      collection(db, 'friend_requests'),
      where('fromId', '==', profile.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requests = snapshot.docs.map(doc => doc.data() as FriendRequest);
      setSentRequests(requests.map(r => r.toId));
    }, (error) => {
      console.error("Error in friend requests listener:", error);
    });

    return () => unsubscribe();
  }, [profile]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, 'users'),
        where('displayName', '>=', searchQuery),
        where('displayName', '<=', searchQuery + '\uf8ff')
      );
      const snapshot = await getDocs(q);
      const results = snapshot.docs
        .map(doc => doc.data() as UserProfile)
        .filter(u => u.uid !== profile?.uid);
      setUsers(results);
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (toId: string) => {
    try {
      await sendFriendRequest(toId);
      alert('Đã gửi yêu cầu kết bạn!');
    } catch (error) {
      console.error("Error sending friend request:", error);
    }
  };

  const handleStartChat = async (user: UserProfile) => {
    try {
      const chatId = await createChat(user.uid, {
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: user.role
      });
      navigate(`/messages/${chatId}`);
    } catch (error) {
      console.error("Error starting chat:", error);
    }
  };

  return (
    <div className="p-6 pb-24">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tighter text-gray-900 mb-2">Tìm người dùng</h1>
        <p className="text-gray-500 font-medium">Kết nối với bạn bè, phụ huynh hoặc doanh nghiệp.</p>
      </div>

      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Nhập tên người dùng..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-100 rounded-2xl text-sm font-medium focus:border-indigo-600/20 outline-none transition-all shadow-sm"
        />
        <button 
          onClick={handleSearch}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
        >
          Tìm kiếm
        </button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : users.length > 0 ? (
          users.map((user) => {
            const isFriend = profile?.friends?.includes(user.uid);
            const isSent = sentRequests.includes(user.uid);

            return (
              <motion.div
                key={user.uid}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-50 overflow-hidden border border-gray-100">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <User size={24} />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{user.displayName}</h3>
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{user.role}</p>
                      {user.trustScore !== undefined && (
                        <div className="flex items-center gap-0.5 text-amber-500 text-[10px] font-bold">
                          <Star size={10} fill="currentColor" />
                          <span>{user.trustScore.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleStartChat(user)}
                    className="p-2 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
                    title="Nhắn tin"
                  >
                    <MessageSquare size={18} />
                  </button>
                  {isFriend ? (
                    <div className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-600 rounded-xl text-xs font-bold">
                      <UserCheck size={14} />
                      Bạn bè
                    </div>
                  ) : isSent ? (
                    <div className="flex items-center gap-1 px-3 py-1.5 bg-gray-50 text-gray-400 rounded-xl text-xs font-bold">
                      <Clock size={14} />
                      Đã gửi
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSendRequest(user.uid)}
                      className="flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors"
                    >
                      <UserPlus size={14} />
                      Kết bạn
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })
        ) : searchQuery && (
          <div className="text-center py-10 text-gray-400">
            <p className="text-sm font-medium">Không tìm thấy người dùng nào.</p>
          </div>
        )}
      </div>
    </div>
  );
}

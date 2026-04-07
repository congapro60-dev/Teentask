import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db, auth } from './FirebaseProvider';
import { Chat } from '../types';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { MessageSquare, Search, Clock, ChevronRight, Sparkles, Bot } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { TEENTASK_BOT_ID } from '../lib/gemini';

export default function ChatList() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', auth.currentUser.uid),
      orderBy('lastMessageAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chat));
      setChats(chatData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching chats:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredChats = chats.filter(chat => {
    const otherParticipantUid = chat.participants.find(uid => uid !== auth.currentUser?.uid);
    const otherParticipant = chat.participantDetails[otherParticipantUid || ''];
    return (otherParticipant?.displayName?.toLowerCase() || '').includes(searchQuery.toLowerCase());
  });

  // Add virtual bot chat if not already in filteredChats
  const botChatExists = chats.some(c => c.participants.includes(TEENTASK_BOT_ID));
  const virtualBotChat = !botChatExists && searchQuery.toLowerCase().includes('bot') || searchQuery === '' ? {
    id: TEENTASK_BOT_ID,
    participants: [auth.currentUser?.uid || '', TEENTASK_BOT_ID],
    participantDetails: {
      [TEENTASK_BOT_ID]: {
        displayName: 'TeenTask Assistant',
        photoURL: null,
        role: 'bot'
      }
    },
    lastMessage: 'Chào bạn! Tôi có thể giúp gì cho bạn về TeenTask?',
    lastMessageAt: Date.now(),
    isBot: true,
    relatedTo: null
  } : null;

  const displayChats = virtualBotChat ? [virtualBotChat, ...filteredChats] : filteredChats;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4F46E5]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white p-8 pb-12 rounded-b-[64px] border-b border-gray-100 sticky top-0 z-30 backdrop-blur-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -z-10"></div>
        <div className="absolute top-20 left-0 w-48 h-48 bg-secondary/5 rounded-full blur-[80px] -z-10"></div>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-2 h-5 bg-primary rounded-full shadow-[0_0_15px_rgba(79,70,229,0.2)]"></div>
          <span className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em]">Kết nối & Trao đổi</span>
        </div>
        <h1 className="text-4xl font-black tracking-tighter text-gray-900 mb-10">Tin nhắn</h1>
        
        <div className="relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={22} strokeWidth={3} />
          <input
            type="text"
            placeholder="Tìm kiếm cuộc trò chuyện..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-16 pr-8 py-6 bg-gray-50 border-2 border-transparent rounded-[32px] text-sm font-bold text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-primary/20 focus:ring-8 focus:ring-primary/5 outline-none transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="px-8 py-10 space-y-6">
        {displayChats.length > 0 ? (
          displayChats.map((chat, i) => {
            const otherParticipantUid = chat.participants.find(uid => uid !== auth.currentUser?.uid);
            const otherParticipant = chat.participantDetails[otherParticipantUid || ''];
            const isBot = chat.participants.includes(TEENTASK_BOT_ID);

            return (
              <motion.button
                key={chat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ x: 8, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/messages/${chat.id}`)}
                className={`w-full flex items-center gap-6 p-6 rounded-[48px] border transition-all text-left relative overflow-hidden group backdrop-blur-sm ${
                  isBot 
                    ? 'bg-indigo-50 border-indigo-100 hover:bg-indigo-100/50' 
                    : 'bg-white border-gray-100 hover:bg-gray-50 hover:border-gray-200'
                }`}
              >
                {/* Background Glow */}
                <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl transition-colors ${
                  isBot ? 'bg-primary/10' : 'bg-primary/5 group-hover:bg-primary/10'
                }`}></div>

                <div className="relative z-10">
                  <div className={`w-20 h-20 rounded-[32px] flex items-center justify-center overflow-hidden border-4 shadow-xl group-hover:scale-110 transition-transform duration-500 ${
                    isBot ? 'bg-white border-indigo-200' : 'bg-white border-gray-100'
                  }`}>
                    {isBot ? (
                      <Bot size={32} className="text-primary" strokeWidth={3} />
                    ) : otherParticipant?.photoURL ? (
                      <img src={otherParticipant.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <span className="text-2xl font-black text-primary">
                        {otherParticipant?.displayName?.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-6 h-6 border-4 border-white rounded-full shadow-lg ${
                    isBot ? 'bg-primary' : 'bg-emerald-500'
                  }`}></div>
                </div>

                <div className="flex-1 min-w-0 relative z-10">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-black text-gray-900 text-lg tracking-tight truncate group-hover:text-primary transition-colors">{otherParticipant?.displayName}</h3>
                      {isBot && (
                        <span className="px-3 py-1 bg-primary/10 text-primary text-[8px] font-black uppercase tracking-widest rounded-full border border-primary/20">AI BOT</span>
                      )}
                    </div>
                    {chat.lastMessageAt && (
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap pt-1">
                        {formatDistanceToNow(chat.lastMessageAt, { addSuffix: false, locale: vi })}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate font-bold leading-relaxed mb-4">
                    {chat.lastMessage || 'Bắt đầu cuộc trò chuyện mới'}
                  </p>
                  {chat.relatedTo && (
                    <div className="inline-flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-2xl border border-gray-100 group-hover:bg-primary/10 group-hover:border-primary/10 transition-colors">
                      <Sparkles size={12} className="text-primary" strokeWidth={3} />
                      <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest truncate max-w-[150px] group-hover:text-primary transition-colors">
                        {chat.relatedTo.title}
                      </span>
                    </div>
                  )}
                </div>

                <div className={`w-12 h-12 rounded-[20px] flex items-center justify-center transition-all shadow-lg relative z-10 border ${
                  isBot 
                    ? 'bg-primary text-white border-primary/20' 
                    : 'bg-gray-50 text-gray-400 border-gray-100 group-hover:bg-primary group-hover:text-white'
                }`}>
                  <ChevronRight size={20} strokeWidth={3} />
                </div>
              </motion.button>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-gray-400">
            <div className="w-32 h-32 bg-gray-50 rounded-[48px] flex items-center justify-center mb-8 border border-gray-100 shadow-inner">
              <MessageSquare size={48} strokeWidth={1.5} className="opacity-20" />
            </div>
            <p className="text-sm font-black uppercase tracking-[0.3em]">Chưa có tin nhắn nào</p>
            <p className="text-[10px] font-bold mt-3 uppercase tracking-widest text-gray-500">Hãy bắt đầu kết nối với các doanh nghiệp!</p>
          </div>
        )}
      </div>
    </div>
  );
}

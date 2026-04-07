import { Timer, MapPin, Users, Star, Trophy, MessageSquare, Search, Filter, SlidersHorizontal, ArrowRight, Heart, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, query, collection, orderBy, onSnapshot } from 'firebase/firestore';
import { db, auth, useFirebase } from './FirebaseProvider';
import ShadowingDetail from './ShadowingDetail';
import { cn } from '../lib/utils';

import { MOCK_SHADOWING } from '../mockData';

const CATEGORIES = ['Tất cả', 'Marketing', 'Design', 'Management', 'Tech', 'Finance'];

export default function Shadowing() {
  const navigate = useNavigate();
  const { profile, toggleSaveShadowing } = useFirebase();
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tất cả');
  const [shadowingEvents, setShadowingEvents] = useState<any[]>(MOCK_SHADOWING);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'shadowing_events'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setShadowingEvents(events);
      } else {
        setShadowingEvents(MOCK_SHADOWING);
      }
      setLoading(false);
    }, (error) => {
      console.error("Shadowing listener error:", error);
      setShadowingEvents(MOCK_SHADOWING);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredEvents = useMemo(() => {
    return shadowingEvents.filter(event => {
      const title = event.title || '';
      const mentor = event.mentorName || event.mentor || '';
      const company = event.companyName || event.company || '';
      const category = event.category || '';

      const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           mentor.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           company.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'Tất cả' || category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory, shadowingEvents]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const eventId = params.get('id');
    if (eventId) {
      const event = MOCK_SHADOWING.find(e => e.id.toString() === eventId);
      if (event) {
        setSelectedEvent(event);
        setIsDetailOpen(true);
      }
    }
  }, [window.location.search]);

  const handleOpenDetail = (event: any) => {
    setSelectedEvent(event);
    setIsDetailOpen(true);
  };

  const handleChat = async (event: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!auth.currentUser) {
      navigate('/profile');
      return;
    }

    const participants = [auth.currentUser.uid, event.mentorId].sort();
    const chatId = participants.join('_');

    try {
      const chatRef = doc(db, 'chats', chatId);
      const chatDoc = await getDoc(chatRef);

      if (!chatDoc.exists()) {
        await setDoc(chatRef, {
          id: chatId,
          participants,
          participantDetails: {
            [auth.currentUser.uid]: {
              displayName: auth.currentUser.displayName || 'Học sinh',
              photoURL: auth.currentUser.photoURL,
              role: 'student'
            },
            [event.mentorId]: {
              displayName: event.mentorName,
              photoURL: `https://i.pravatar.cc/100?u=${event.mentor}`,
              role: 'business'
            }
          },
          relatedTo: {
            type: 'shadowing',
            id: event.id,
            title: event.title
          },
          createdAt: Date.now(),
          lastMessageAt: Date.now()
        });
      }

      navigate(`/messages/${chatId}`);
    } catch (error) {
      console.error("Error starting chat:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] pb-24">
      {/* Premium Header */}
      <div className="relative h-[520px] overflow-hidden">
        <div className="absolute inset-0 bg-[#0A0A0B]">
          <img 
            src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80" 
            className="w-full h-full object-cover opacity-30 scale-105"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-[#FDFCFB]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent"></div>
        </div>

        {/* Floating Premium Elements */}
        <div className="absolute top-20 right-[5%] w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute -bottom-40 -left-20 w-[700px] h-[700px] bg-primary/5 rounded-full blur-[150px]"></div>

        <div className="relative h-full max-w-7xl mx-auto px-6 flex flex-col justify-center pt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-3 px-5 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full mb-10 shadow-2xl"
          >
            <div className="w-2.5 h-2.5 bg-amber-400 rounded-full shadow-[0_0_12px_rgba(251,191,36,0.8)] animate-pulse"></div>
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-[0.5em]">TeenTask Elite Shadowing</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-7xl md:text-9xl font-black text-white tracking-tighter leading-[0.85] mb-10"
          >
            KIẾN TẬP<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-500 to-amber-200 animate-gradient-x drop-shadow-2xl">PREMIUM</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl md:text-2xl text-white/60 font-medium max-w-2xl leading-relaxed mb-14 tracking-tight"
          >
            Mở cánh cửa bước vào thế giới chuyên nghiệp cùng những người dẫn dắt xuất sắc nhất.
          </motion.p>

          {/* Premium Search Bar */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-4xl w-full flex flex-col md:flex-row gap-5"
          >
            <div className="flex-1 relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-600 rounded-[32px] blur-2xl opacity-0 group-focus-within:opacity-20 transition-opacity"></div>
              <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-amber-400 transition-colors" size={24} />
              <input
                type="text"
                placeholder="Tìm kiếm vị trí, công ty hoặc người hướng dẫn..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-20 pr-8 py-8 bg-white/5 backdrop-blur-3xl border-2 border-white/10 rounded-[32px] text-white placeholder:text-white/20 focus:bg-white/10 focus:border-amber-400/30 outline-none transition-all shadow-2xl font-bold text-lg"
              />
            </div>
            <button className="px-14 py-8 bg-gradient-to-br from-amber-300 via-amber-500 to-amber-600 text-black font-black rounded-[32px] shadow-[0_20px_40px_-12px_rgba(245,158,11,0.4)] hover:scale-105 active:scale-95 transition-all uppercase tracking-[0.2em] text-xs border border-white/20">
              Tìm kiếm ngay
            </button>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-12 relative z-10">
        {/* Categories */}
        <div className="flex gap-4 mb-16 overflow-x-auto no-scrollbar pb-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex items-center gap-3 px-8 py-5 rounded-[28px] text-sm font-black whitespace-nowrap transition-all border-2 ${
                activeCategory === cat
                  ? 'bg-slate-950 text-white border-slate-950 shadow-2xl shadow-slate-900/20 scale-105'
                  : 'bg-white text-slate-500 border-slate-100 hover:border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Search size={20} strokeWidth={3} />
              {cat}
            </button>
          ))}
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          <AnimatePresence mode="popLayout">
            {filteredEvents.map((event, i) => (
              <motion.div
                layout
                key={event.id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => handleOpenDetail(event)}
                className="group bg-white rounded-[48px] overflow-hidden border border-slate-100 hover:border-amber-200 hover:shadow-[0_32px_64px_-12px_rgba(251,191,36,0.12)] transition-all cursor-pointer flex flex-col relative"
              >
                {/* Premium Badge */}
                <div className="absolute top-6 left-6 z-20 px-4 py-2 bg-slate-950/80 backdrop-blur-md rounded-2xl border border-white/10 flex items-center gap-2">
                  <Star size={12} className="text-amber-400 fill-amber-400" />
                  <span className="text-[9px] font-black text-white uppercase tracking-widest">Elite Member</span>
                </div>

                <div className="relative h-72 overflow-hidden">
                  <img 
                    src={event.image} 
                    alt={event.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
                  
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSaveShadowing(event.id);
                    }}
                    className={cn(
                      "absolute top-6 right-6 w-12 h-12 backdrop-blur-md rounded-2xl flex items-center justify-center transition-all border border-white/20",
                      profile?.savedShadowing?.includes(event.id)
                        ? "bg-rose-500 text-white"
                        : "bg-white/10 text-white hover:bg-white hover:text-rose-500"
                    )}
                  >
                    <Heart size={20} fill={profile?.savedShadowing?.includes(event.id) ? "currentColor" : "none"} />
                  </button>

                  <div className="absolute bottom-8 left-8 right-8">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="px-3 py-1 bg-amber-400 text-slate-950 text-[9px] font-black uppercase tracking-widest rounded-lg">
                        {event.category}
                      </div>
                      <div className="flex items-center gap-1.5 text-white/80 text-[10px] font-bold">
                        <MapPin size={12} className="text-amber-400" />
                        {event.location}
                      </div>
                    </div>
                    <h3 className="text-2xl font-black text-white leading-tight tracking-tight group-hover:text-amber-400 transition-colors line-clamp-2">
                      {event.title}
                    </h3>
                  </div>
                </div>

                <div className="p-8 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-slate-50 border-2 border-slate-100 overflow-hidden shadow-sm group-hover:border-amber-100 transition-colors">
                        <img src={`https://i.pravatar.cc/100?u=${event.mentor}`} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 tracking-tight">{event.mentor}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{event.role}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Công ty</p>
                      <p className="text-xs font-black text-primary tracking-tight">{event.company}</p>
                    </div>
                  </div>

                  <div className="mt-auto pt-8 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-3">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center overflow-hidden">
                            <img src={`https://i.pravatar.cc/100?u=${event.id}${i}`} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">+12 bạn khác</span>
                    </div>
                    <div className="flex items-center gap-2 text-amber-500">
                      <TrendingUp size={16} strokeWidth={3} />
                      <span className="text-xs font-black uppercase tracking-widest">Hot</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredEvents.length === 0 && (
          <div className="text-center py-32">
            <div className="w-32 h-32 bg-slate-50 rounded-[48px] flex items-center justify-center mx-auto mb-8 border border-slate-100 shadow-inner">
              <Search size={48} className="text-slate-300" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Không tìm thấy kết quả</h3>
            <p className="text-slate-500 font-medium">Thử tìm kiếm với từ khóa khác hoặc thay đổi danh mục.</p>
          </div>
        )}
      </div>

      {selectedEvent && (
        <ShadowingDetail
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          event={selectedEvent}
          onChat={(e) => handleChat(selectedEvent, e)}
        />
      )}
    </div>
  );
}

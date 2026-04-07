import { Timer, MapPin, Users, Star, Trophy, MessageSquare, Search, Filter, SlidersHorizontal, ArrowRight, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
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

  const filteredEvents = useMemo(() => {
    return MOCK_SHADOWING.filter(event => {
      const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           event.mentor.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           event.company.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'Tất cả' || event.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory]);

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
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Header Section */}
      <div className="bg-white border-b border-slate-200 px-6 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-start mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center">
                  <Star size={12} className="text-amber-600" fill="currentColor" />
                </div>
                <span className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em]">Premium Experience</span>
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Kiến tập cao cấp</h1>
              <p className="text-slate-500 text-sm mt-1 font-medium">Trải nghiệm thực tế cùng các chuyên gia hàng đầu.</p>
            </div>
            <div className="hidden sm:flex w-14 h-14 bg-white rounded-2xl items-center justify-center shadow-xl shadow-slate-200/50 border border-slate-100">
              <Trophy className="text-amber-500" size={28} />
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Tìm kiếm chuyên gia, công ty hoặc lĩnh vực..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-2xl text-sm font-medium transition-all outline-none"
              />
            </div>
            <button className="px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl flex items-center justify-center gap-2 text-slate-600 hover:bg-slate-50 transition-colors">
              <SlidersHorizontal size={20} />
              <span className="text-sm font-bold">Bộ lọc</span>
            </button>
          </div>

          {/* Categories */}
          <div className="flex gap-2 mt-6 overflow-x-auto no-scrollbar pb-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all",
                  activeCategory === cat
                    ? "bg-slate-900 text-white shadow-lg shadow-slate-200"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="max-w-5xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredEvents.map((event, i) => (
              <motion.div
                key={event.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2, delay: i * 0.05 }}
                onClick={() => handleOpenDetail(event)}
                className="group bg-white rounded-[40px] overflow-hidden border border-slate-200 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5 transition-all cursor-pointer flex flex-col"
              >
                <div className="aspect-[16/10] relative overflow-hidden">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent"></div>
                  
                  <div className="absolute top-6 left-6 flex items-center gap-2">
                    <span className="px-4 py-2 bg-white/90 backdrop-blur-md rounded-2xl text-[10px] font-black text-slate-900 uppercase tracking-widest shadow-xl">
                      {event.category}
                    </span>
                  </div>

                  <div className="absolute top-6 right-6">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSaveShadowing(event.id);
                      }}
                      className={cn(
                        "p-3 rounded-2xl backdrop-blur-md transition-all shadow-xl",
                        profile?.savedShadowing?.includes(event.id)
                        ? "bg-red-500 text-white"
                        : "bg-white/20 text-white hover:bg-white/40"
                      )}
                    >
                      <Heart size={20} fill={profile?.savedShadowing?.includes(event.id) ? "currentColor" : "none"} />
                    </button>
                  </div>

                  <div className="absolute bottom-6 left-8 right-8">
                    <h3 className="text-2xl font-black text-white mb-3 leading-tight group-hover:text-amber-400 transition-colors">
                      {event.title}
                    </h3>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl border-2 border-white/30 overflow-hidden shadow-lg">
                        <img src={`https://i.pravatar.cc/100?u=${event.mentor}`} alt={event.mentor} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-white tracking-tight">{event.mentor}</p>
                        <p className="text-[10px] text-white/70 font-bold uppercase tracking-widest">{event.role} @ {event.company}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-8 space-y-6 flex-1 flex flex-col justify-between">
                  <p className="text-slate-500 text-sm leading-relaxed line-clamp-2 font-medium">
                    {event.description}
                  </p>

                  <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Học phí trọn gói</span>
                      <span className="text-2xl font-black text-primary tracking-tighter">{event.price}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Ngày bắt đầu</span>
                        <div className="flex items-center gap-2 text-slate-700 font-black text-sm">
                          <Timer size={16} className="text-amber-500" />
                          {event.date}
                        </div>
                      </div>
                      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all">
                        <ArrowRight size={20} />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredEvents.length === 0 && (
          <div className="text-center py-32">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search size={40} className="text-slate-200" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Không tìm thấy kết quả</h3>
            <p className="text-slate-500 font-medium">Thử tìm kiếm với từ khóa khác hoặc thay đổi bộ lọc.</p>
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

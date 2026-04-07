import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, Star, ArrowRight, X } from 'lucide-react';
import { useFirebase } from './FirebaseProvider';
import { cn } from '../lib/utils';

export default function CalendarView() {
  const { getBookings } = useFirebase();
  const [bookings, setBookings] = useState<any[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      const data = await getBookings();
      setBookings(data);
      setLoading(false);
    };
    fetchBookings();
  }, [getBookings]);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

  const monthNames = [
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
    "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
  ];

  const days = [];
  const totalDays = daysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const startDay = firstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());

  // Padding for previous month
  for (let i = 0; i < startDay; i++) {
    days.push(<div key={`prev-${i}`} className="h-14 sm:h-20 border border-slate-50 bg-slate-50/30" />);
  }

  // Current month days
  for (let d = 1; d <= totalDays; d++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), d);
    const isToday = new Date().toDateString() === date.toDateString();
    const isSelected = selectedDate?.toDateString() === date.toDateString();
    
    // Check if there are bookings on this day
    // Note: eventDate in mock is like "15/04/2026"
    const hasBooking = bookings.some(b => {
      const [day, month, year] = b.eventDate.split('/').map(Number);
      return day === d && month === (currentDate.getMonth() + 1) && year === currentDate.getFullYear();
    });

    days.push(
      <button
        key={d}
        onClick={() => setSelectedDate(date)}
        className={cn(
          "h-14 sm:h-20 border border-slate-50 flex flex-col items-center justify-center relative transition-all hover:bg-slate-50",
          isSelected ? "bg-primary/5 border-primary/20" : "bg-white",
          isToday && "text-primary font-black"
        )}
      >
        <span className={cn(
          "text-sm font-bold",
          isSelected ? "text-primary" : "text-slate-600"
        )}>
          {d}
        </span>
        {hasBooking && (
          <div className="absolute bottom-2 w-1.5 h-1.5 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
        )}
        {isSelected && (
          <motion.div
            layoutId="activeDay"
            className="absolute inset-0 border-2 border-primary rounded-lg pointer-events-none"
            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
          />
        )}
      </button>
    );
  }

  const selectedDateBookings = bookings.filter(b => {
    if (!selectedDate) return false;
    const [day, month, year] = b.eventDate.split('/').map(Number);
    return day === selectedDate.getDate() && 
           month === (selectedDate.getMonth() + 1) && 
           year === selectedDate.getFullYear();
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      <div className="bg-white border-b border-slate-200 px-6 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
              <CalendarIcon size={12} className="text-primary" />
            </div>
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Lịch trình cá nhân</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Kế hoạch kiến tập</h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">Theo dõi các buổi kiến tập và sự kiện đã đăng ký.</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <div className="flex gap-2">
                  <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                    <ChevronLeft size={20} />
                  </button>
                  <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 mb-4">
                {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(d => (
                  <div key={d} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest py-2">
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 rounded-2xl overflow-hidden border border-slate-50">
                {days}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-[32px] border border-slate-100 flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center">
                  <Star className="text-amber-600" size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đã đăng ký</p>
                  <p className="text-xl font-black text-slate-900">{bookings.length} buổi</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-[32px] border border-slate-100 flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
                  <Clock className="text-emerald-600" size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sắp tới</p>
                  <p className="text-xl font-black text-slate-900">
                    {bookings.filter(b => {
                      const [day, month, year] = b.eventDate.split('/').map(Number);
                      return new Date(year, month - 1, day) >= new Date();
                    }).length} buổi
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Schedule List Section */}
          <div className="space-y-6">
            <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 min-h-[400px]">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  {selectedDate?.toLocaleDateString('vi-VN', { day: 'numeric', month: 'long' })}
                </h3>
                <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  {selectedDateBookings.length} sự kiện
                </span>
              </div>

              <div className="space-y-4">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs font-bold text-slate-400">Đang tải lịch trình...</p>
                  </div>
                ) : selectedDateBookings.length > 0 ? (
                  selectedDateBookings.map((booking) => (
                    <motion.div
                      key={booking.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="group p-5 bg-slate-50 rounded-3xl border border-transparent hover:border-primary/20 hover:bg-white hover:shadow-xl hover:shadow-primary/5 transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                          booking.status === 'confirmed' ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                        )}>
                          {booking.status === 'confirmed' ? 'Đã xác nhận' : 'Chờ duyệt'}
                        </span>
                        <Clock size={14} className="text-slate-400" />
                      </div>
                      <h4 className="text-sm font-black text-slate-900 mb-1 group-hover:text-primary transition-colors">
                        {booking.eventTitle}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                        <MapPin size={12} />
                        {booking.company}
                      </div>
                      <button className="mt-4 w-full py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all flex items-center justify-center gap-2">
                        Chi tiết
                        <ArrowRight size={12} />
                      </button>
                    </motion.div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                      <CalendarIcon size={24} className="text-slate-200" />
                    </div>
                    <p className="text-sm font-bold text-slate-400">Không có sự kiện nào trong ngày này</p>
                    <button className="mt-4 text-xs font-black text-primary uppercase tracking-widest hover:underline">
                      Khám phá thêm
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Tips Card */}
            <div className="bg-gradient-to-br from-primary to-indigo-600 rounded-[32px] p-8 text-white shadow-xl shadow-primary/20 relative overflow-hidden group">
              <div className="relative z-10">
                <h4 className="text-lg font-black mb-2 tracking-tight">Mẹo nhỏ</h4>
                <p className="text-white/80 text-xs leading-relaxed font-medium">
                  Hãy chuẩn bị sẵn các câu hỏi cho Mentor trước buổi kiến tập để nhận được nhiều giá trị nhất nhé!
                </p>
              </div>
              <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

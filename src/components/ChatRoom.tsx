import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, auth } from './FirebaseProvider';
import { Chat, Message } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Send, ChevronLeft, MoreVertical, Phone, Video, Image, Paperclip, Smile, Sparkles, Bot } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { TEENTASK_BOT_ID, TEENTASK_BOT_SYSTEM_INSTRUCTION, getGeminiModel } from '../lib/gemini';

export default function ChatRoom() {
  const { chatId } = useParams();
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!chatId || !auth.currentUser) return;

    // Fetch Chat Details
    const isBotChat = chatId === TEENTASK_BOT_ID || chatId?.startsWith(`${TEENTASK_BOT_ID}_`);
    const actualChatId = (chatId === TEENTASK_BOT_ID && auth.currentUser) 
      ? `${TEENTASK_BOT_ID}_${auth.currentUser.uid}` 
      : chatId || '';

    const fetchChat = async () => {
      if (isBotChat) {
        // Check if bot chat doc exists in Firestore
        const botChatDoc = await getDoc(doc(db, 'chats', actualChatId));
        if (botChatDoc.exists()) {
          setChat({ id: botChatDoc.id, ...botChatDoc.data() } as Chat);
        } else {
          // Create the bot chat document immediately to avoid permission issues for messages
          const botChatData = {
            participants: [auth.currentUser?.uid || '', TEENTASK_BOT_ID],
            participantDetails: {
              [auth.currentUser?.uid || '']: {
                displayName: auth.currentUser?.displayName || 'User',
                photoURL: auth.currentUser?.photoURL || null
              },
              [TEENTASK_BOT_ID]: {
                displayName: 'TeenTask Assistant',
                photoURL: null,
                role: 'bot'
              }
            },
            lastMessage: 'Chào bạn! Tôi có thể giúp gì cho bạn về TeenTask?',
            lastMessageAt: Date.now(),
            createdAt: Date.now()
          };
          
          const { setDoc } = await import('firebase/firestore');
          await setDoc(doc(db, 'chats', actualChatId), botChatData).catch(err => console.error("Error creating bot chat:", err));
          
          setChat({ id: actualChatId, ...botChatData } as any as Chat);
        }
      } else {
        const chatDoc = await getDoc(doc(db, 'chats', actualChatId));
        if (chatDoc.exists()) {
          setChat({ id: chatDoc.id, ...chatDoc.data() } as Chat);
        }
      }
    };
    fetchChat();

    // Fetch Messages
    const q = query(
      collection(db, 'chats', actualChatId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messageData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(messageData);
      setLoading(false);
      
      // Scroll to bottom
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }, (error) => {
      // If it's a bot chat and doc doesn't exist yet, it's fine to have empty messages
      if (isBotChat && error.message.includes('insufficient permissions')) {
        setMessages([]);
        setLoading(false);
      } else {
        console.error("Error fetching messages:", error);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [chatId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatId || !auth.currentUser) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      const isBotChat = chatId === TEENTASK_BOT_ID || chatId?.startsWith(`${TEENTASK_BOT_ID}_`);
      const actualChatId = (chatId === TEENTASK_BOT_ID && auth.currentUser) 
        ? `${TEENTASK_BOT_ID}_${auth.currentUser.uid}` 
        : chatId || '';

      // Add message to subcollection
      await addDoc(collection(db, 'chats', actualChatId, 'messages'), {
        chatId: actualChatId,
        senderId: auth.currentUser.uid,
        text: messageText,
        createdAt: Date.now()
      });

      // Update last message in chat document
      await updateDoc(doc(db, 'chats', actualChatId), {
        lastMessage: messageText,
        lastMessageAt: Date.now()
      });

      // Handle Bot Response
      if (isBotChat) {
        setTimeout(async () => {
          try {
            const ai = getGeminiModel();
            const chatSession = ai.models.generateContent({
              model: "gemini-3-flash-preview",
              contents: [
                { role: 'user', parts: [{ text: `System Instruction: ${TEENTASK_BOT_SYSTEM_INSTRUCTION}` }] },
                ...messages.slice(-10).map(m => ({
                  role: m.senderId === auth.currentUser?.uid ? 'user' : 'model',
                  parts: [{ text: m.text }]
                })),
                { role: 'user', parts: [{ text: messageText }] }
              ]
            });

            const result = await chatSession;
            const botResponse = result.text || "Xin lỗi, tôi không thể trả lời lúc này.";

            await addDoc(collection(db, 'chats', actualChatId, 'messages'), {
              chatId: actualChatId,
              senderId: TEENTASK_BOT_ID,
              text: botResponse,
              createdAt: Date.now()
            });

            await updateDoc(doc(db, 'chats', actualChatId), {
              lastMessage: botResponse,
              lastMessageAt: Date.now()
            });
          } catch (aiError) {
            console.error("Bot AI Error:", aiError);
          }
        }, 500);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4F46E5]"></div>
      </div>
    );
  }

    const otherParticipantUid = chat?.participants.find(uid => uid !== auth.currentUser?.uid);
    const otherParticipant = chat?.participantDetails[otherParticipantUid || ''];
    const isBot = otherParticipantUid === TEENTASK_BOT_ID;

    return (
      <div className="flex flex-col h-screen bg-slate-950">
        {/* Header */}
        <div className="bg-slate-900/50 p-8 pt-12 rounded-b-[48px] border-b border-white/5 backdrop-blur-2xl sticky top-0 z-30">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => navigate('/messages')}
              className="p-4 bg-white/5 rounded-[24px] text-white hover:bg-white/10 transition-all border border-white/10 active:scale-90"
            >
              <ChevronLeft size={24} strokeWidth={3} className="text-white" />
            </button>
            
            <div className="flex-1 flex items-center gap-5">
              <div className="relative">
                <div className={`w-16 h-16 rounded-[28px] flex items-center justify-center overflow-hidden border-4 shadow-2xl ${
                  isBot ? 'bg-primary/20 border-primary/20' : 'bg-slate-900 border-white/5'
                }`}>
                  {isBot ? (
                    <Bot size={28} className="text-primary" strokeWidth={3} />
                  ) : otherParticipant?.photoURL ? (
                    <img src={otherParticipant.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="text-xl font-black text-primary">
                      {otherParticipant?.displayName?.charAt(0)}
                    </span>
                  )}
                </div>
                <div className={`absolute -bottom-1 -right-1 w-6 h-6 border-4 border-slate-950 rounded-full shadow-lg ${
                  isBot ? 'bg-primary' : 'bg-emerald-500'
                }`}></div>
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-black tracking-tighter text-white leading-tight">{otherParticipant?.displayName}</h3>
                  {isBot && (
                    <span className="px-3 py-1 bg-primary/20 text-primary text-[8px] font-black uppercase tracking-widest rounded-full border border-primary/20">AI BOT</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`w-2 h-2 rounded-full animate-pulse shadow-lg ${
                    isBot ? 'bg-primary shadow-primary/50' : 'bg-emerald-500 shadow-emerald-500/50'
                  }`}></div>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${
                    isBot ? 'text-primary' : 'text-emerald-500'
                  }`}>Đang hoạt động</span>
                </div>
              </div>
            </div>

          <div className="flex items-center gap-3">
            <button className="p-4 text-slate-500 hover:text-primary hover:bg-primary/10 rounded-[24px] transition-all active:scale-90 border border-transparent hover:border-primary/20">
              <Phone size={22} strokeWidth={3} />
            </button>
            <button className="p-4 text-slate-500 hover:text-primary hover:bg-primary/10 rounded-[24px] transition-all active:scale-90 border border-transparent hover:border-primary/20">
              <Video size={22} strokeWidth={3} />
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-8 space-y-10 scroll-smooth no-scrollbar">
        {chat?.relatedTo && (
          <div className="flex justify-center mb-12">
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl px-6 py-4 rounded-[32px] border border-white/5 shadow-2xl flex items-center gap-5"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shadow-inner border border-primary/10">
                <Sparkles size={20} className="text-primary" strokeWidth={3} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-1">Liên quan đến</p>
                <p className="text-sm font-black text-white tracking-tight">{chat.relatedTo.title}</p>
              </div>
            </motion.div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, index) => {
            const isMe = msg.senderId === auth.currentUser?.uid;
            const showTime = index === 0 || 
              (messages[index].createdAt - messages[index-1].createdAt > 300000); // 5 mins gap

            return (
              <div key={msg.id} className="space-y-4">
                {showTime && (
                  <div className="flex justify-center py-8">
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] bg-white/5 border border-white/5 px-6 py-2 rounded-full shadow-inner">
                      {format(msg.createdAt, 'HH:mm, dd/MM', { locale: vi })}
                    </span>
                  </div>
                )}
                <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    className={`max-w-[85%] p-6 rounded-[32px] text-sm font-bold shadow-2xl leading-relaxed tracking-tight relative overflow-hidden ${
                      isMe 
                        ? 'bg-primary text-white rounded-tr-none shadow-primary/20' 
                        : 'bg-white/5 text-slate-200 rounded-tl-none border border-white/5 backdrop-blur-sm'
                    }`}
                  >
                    {isMe && <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>}
                    <p className="relative z-10">{msg.text}</p>
                  </motion.div>
                </div>
              </div>
            );
          })}
        </AnimatePresence>
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <div className="p-8 bg-slate-950/80 backdrop-blur-2xl border-t border-white/5 pb-12">
        <form onSubmit={handleSendMessage} className="flex items-center gap-4 bg-white/5 p-3 rounded-[40px] border border-white/5 shadow-inner group focus-within:bg-white/10 focus-within:border-primary/20 focus-within:ring-8 focus-within:ring-primary/5 transition-all max-w-4xl mx-auto">
          <div className="flex items-center gap-2 pl-2">
            <button type="button" className="p-4 text-slate-500 hover:text-primary transition-all active:scale-90 hover:bg-primary/10 rounded-[28px]">
              <Image size={24} strokeWidth={3} />
            </button>
            <button type="button" className="p-4 text-slate-500 hover:text-primary transition-all active:scale-90 hover:bg-primary/10 rounded-[28px]">
              <Smile size={24} strokeWidth={3} />
            </button>
          </div>
          
          <input
            type="text"
            placeholder="Viết tin nhắn..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 py-5 px-4 bg-transparent border-none text-sm font-black text-white placeholder:text-slate-600 focus:ring-0 outline-none"
          />
          
          <motion.button
            whileTap={{ scale: 0.9 }}
            type="submit"
            disabled={!newMessage.trim()}
            className={`w-16 h-16 rounded-[28px] flex items-center justify-center transition-all active:scale-90 ${
              newMessage.trim() 
                ? 'bg-primary text-white shadow-2xl shadow-primary/30' 
                : 'bg-white/5 text-slate-600'
            }`}
          >
            <Send size={24} strokeWidth={3} />
          </motion.button>
        </form>
      </div>
    </div>
  );
}

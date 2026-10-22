import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  Loader2,
  Minimize2,
  Maximize2,
  RefreshCw,
  HelpCircle,
  Lightbulb,
} from 'lucide-react';
import {
  OBEAssessmentData,
  CPMKCalculationResult,
  CPLCalculationResult,
} from '../types/obe';

interface GeminiChatbotProps {
  courseData: OBEAssessmentData;
  cpmkResults: CPMKCalculationResult[];
  cplResults: CPLCalculationResult[];
  targetBenchmark?: number;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export const GeminiChatbot: React.FC<GeminiChatbotProps> = ({
  courseData,
  cpmkResults,
  cplResults,
  targetBenchmark = 75.0,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize greeting with course context
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'model',
          text: `Halo Bapak/Ibu Dosen Pengampu! Saya adalah **OBE Assessment Specialist & Auditor Mutu Akademik** berbasis Gemini AI. 

Saya telah memuat data mata kuliah **${courseData.courseName} (${courseData.courseCode})** dengan target benchmark **${targetBenchmark.toFixed(2)}%**. 

Ada yang dapat saya bantu terkait evaluasi CPMK, ketercapaian CPL, formulasi rubrik, atau penyusunan rekomendasi perbaikan mutu berkelanjutan (CQI) untuk akreditasi prodi?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [courseData.courseCode]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized]);

  const quickPrompts = [
    'Rekomendasi tindakan CQI untuk CPMK yang belum tercapai',
    'Analisis ketercapaian CPL untuk borang akreditasi',
    'Strategi pedagogis menutup gap target 75.00',
    'Rekomendasi metode asesmen & rubrik Bloom C4-C5',
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const historyPayload = messages.slice(-8).map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const courseContext = {
        courseCode: courseData.courseCode,
        courseName: courseData.courseName,
        credits: courseData.credits,
        semester: courseData.semester,
        academicYear: courseData.academicYear,
        studyProgram: courseData.studyProgram,
        faculty: courseData.faculty,
        targetBenchmark: targetBenchmark,
        cpmkResults: cpmkResults.map((c) => ({
          cpmkCode: c.cpmkCode,
          score: c.capaianAkhir,
          target: c.target,
          gap: c.gap,
          isAchieved: c.isAchieved,
        })),
        cplResults: cplResults.map((c) => ({
          cplCode: c.cplCode,
          category: c.category,
          score: c.capaianAkhir,
          target: c.target,
          gap: c.gap,
          isAchieved: c.isAchieved,
        })),
      };

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: historyPayload,
          courseContext,
        }),
      });

      if (!response.ok) {
        throw new Error('Gagal menghubungi layanan Gemini.');
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(text.startsWith('<') ? 'Server backend API belum aktif atau mengembalikan HTML. Silakan restart dev server.' : text);
      }

      const data = await response.json();
      const botMsg: ChatMessage = {
        id: `model-${Date.now()}`,
        role: 'model',
        text: data.reply || 'Maaf, belum dapat menghasilkan respon.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (error: any) {
      console.error('Chat error:', error);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        text: 'Mohon maaf, terjadi gangguan koneksi ke layanan AI Auditor. Silakan periksa koneksi atau coba sesaat lagi.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'model',
        text: `Sesi konsultasi telah diperbarui untuk mata kuliah **${courseData.courseName}**. Silakan ajukan pertanyaan seputar asesmen OBE Anda.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-indigo-600 via-indigo-700 to-slate-900 text-white rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all group border border-indigo-400/30 cursor-pointer"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-indigo-200" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-indigo-900 animate-pulse" />
          </div>
          <div className="text-left hidden sm:block">
            <span className="text-xs font-extrabold block tracking-tight">Konsultasi AI Auditor</span>
            <span className="text-[10px] text-indigo-200 block">OBE Specialist & CQI</span>
          </div>
        </button>
      )}

      {/* Chat Window Panel */}
      {isOpen && (
        <div
          className={`fixed bottom-6 right-4 sm:right-6 z-50 bg-white rounded-2xl shadow-2xl border border-slate-300 flex flex-col transition-all overflow-hidden ${
            isMinimized
              ? 'w-80 h-14'
              : 'w-[94vw] sm:w-[440px] h-[580px] max-h-[85vh]'
          }`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-4 py-3 flex items-center justify-between shrink-0 border-b border-indigo-900/40">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shrink-0">
                <Sparkles className="w-4 h-4 text-indigo-200" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-white">OBE Auditor Mutu AI</h4>
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                </div>
                <p className="text-[10px] text-indigo-200 truncate max-w-[200px]">
                  {courseData.courseCode} • {courseData.courseName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleResetChat}
                title="Mulai Ulang Percakapan"
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? 'Perbesar' : 'Kecilkan'}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Tutup Chat"
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Message History */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs bg-slate-50/70">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-2.5 ${
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {msg.role === 'model' && (
                      <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed shadow-2xs ${
                        msg.role === 'user'
                          ? 'bg-indigo-600 text-white rounded-tr-xs'
                          : 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.text}</div>
                      <span
                        className={`text-[9px] block text-right mt-1.5 ${
                          msg.role === 'user' ? 'text-indigo-200' : 'text-slate-400'
                        }`}
                      >
                        {msg.timestamp}
                      </span>
                    </div>

                    {msg.role === 'user' && (
                      <div className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                        <User className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-2.5 justify-start items-center">
                    <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl px-3.5 py-2 text-slate-500 text-xs flex items-center gap-2 shadow-2xs">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                      <span>Auditor AI sedang menganalisis kurikulum...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompt Chips */}
              <div className="p-2 bg-slate-100 border-t border-slate-200 overflow-x-auto scrollbar-none flex gap-1.5">
                {quickPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(prompt)}
                    disabled={isLoading}
                    className="shrink-0 px-2.5 py-1 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-lg text-[11px] text-slate-700 hover:text-indigo-700 transition-colors cursor-pointer text-left disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Input Area */}
              <div className="p-3 bg-white border-t border-slate-200">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Tanyakan analisis OBE, CQI, atau rubrik..."
                    disabled={isLoading}
                    className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 bg-slate-50/50"
                  />
                  <button
                    type="submit"
                    disabled={!inputMessage.trim() || isLoading}
                    className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
                <p className="text-[9px] text-slate-400 text-center mt-1.5">
                  Didukung Gemini AI Flash • Selalu verifikasi hasil dengan standar baku akademik prodi
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

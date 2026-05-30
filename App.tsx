import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { MOCK_ROOMS, SYSTEM_INSTRUCTION, TAGALOG_INSTRUCTION, IRATE_INSTRUCTION, VOICE_PRESETS } from './constants';
import { Room, BookingDraft, RoomStatus, ChatMessage, CallEvaluation } from './types';
import { RoomCard } from './components/RoomCard';
import { BookingForm } from './components/BookingForm';
import { PhoneInterface } from './components/PhoneInterface';
import { AgentAssistant } from './components/AgentAssistant';
import { EvaluationModal } from './components/EvaluationModal';
import { GeminiLiveClient } from './services/geminiLiveService';
import { ringtoneService } from './services/ringtoneService';

const App: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>(MOCK_ROOMS);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [rightPanelTab, setRightPanelTab] = useState<'booking' | 'assistant'>('booking');
  
  // Call State
  const [isCallActive, setIsCallActive] = useState(false);
  const [isRinging, setIsRinging] = useState(false);
  const [isCustomerSpeaking, setIsCustomerSpeaking] = useState(false);
  const [userVolume, setUserVolume] = useState(0);
  const [callError, setCallError] = useState('');
  const [isTagalog, setIsTagalog] = useState(false);
  const [isIrate, setIsIrate] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [hasBookedInSession, setHasBookedInSession] = useState(false);
  const [evaluation, setEvaluation] = useState<CallEvaluation | null>(null);

  useEffect(() => {
    if (isRinging) {
      ringtoneService.start();
    } else {
      ringtoneService.stop();
    }
    return () => {
      ringtoneService.stop();
    };
  }, [isRinging]);

  // Booking State (Lifted)
  const [bookingDraft, setBookingDraft] = useState<BookingDraft>({
    guestName: '',
    email: '',
    phone: '',
    checkIn: '',
    checkOut: '',
    guests: 1,
    notes: '',
  });

  // Copilot & Chat Log State
  const [agentSuggestions, setAgentSuggestions] = useState<string[]>(["Waiting for call to start..."]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false); // UI State
  const generatingLock = useRef(false); // Logic Lock (Ref avoids closure staleness)
  const [chatLog, setChatLog] = useState<ChatMessage[]>([]);
  
  // Service Refs
  const geminiClient = useRef<GeminiLiveClient | null>(null);
  const transcriptBuffer = useRef<string>(""); // Stores full text for AI Context

  // Copilot Generation Logic
  const generateCopilotSuggestions = async () => {
    if (generatingLock.current) return;
    
    try {
      generatingLock.current = true;
      setIsGeneratingSuggestions(true);
      const history = transcriptBuffer.current;
      
      // Instantiate fresh client for every request to ensure latest key/config usage
      const suggestionAI = new GoogleGenAI({ 
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      const response = await suggestionAI.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are an expert Hotel Reservation Coach assisting a trainee agent.
        
        Current Conversation Transcript:
        ${history}
        
        Task: Provide 3 distinct, professional, and concise phrases the Agent should say next to move the booking forward, answer questions, or be polite.
        If the customer is angry, suggest de-escalation phrases.
        Return ONLY a JSON array of strings. Example: ["Phrase 1", "Phrase 2", "Phrase 3"]`,
        config: {
           responseMimeType: "application/json",
           responseSchema: {
             type: Type.ARRAY,
             items: { type: Type.STRING }
           }
        }
      });

      if (response.text) {
        const suggestions = JSON.parse(response.text);
        setAgentSuggestions(suggestions);
      }
    } catch (e) {
      console.error("Copilot error:", e);
    } finally {
      generatingLock.current = false;
      setIsGeneratingSuggestions(false);
    }
  };

  // Post-Call Evaluation Logic
  const generateEvaluation = async () => {
    try {
       const evalAI = new GoogleGenAI({ 
         apiKey: process.env.GEMINI_API_KEY,
         httpOptions: {
           headers: {
             'User-Agent': 'aistudio-build'
           }
         }
       });
       const transcript = transcriptBuffer.current;
       const bookingDataStr = JSON.stringify(bookingDraft);

       const prompt = `
       You are a Hotel Quality Assurance Manager evaluating a trainee.
       
       TRANSCRIPT OF CALL:
       ${transcript}

       BOOKING SUBMITTED BY AGENT:
       ${bookingDataStr}

       TASK:
       Evaluate the Agent's performance. 
       1. Compare the booking details (Dates, Guests, Room) against what the customer asked for in the transcript.
       2. Rate professionalism and friendliness.
       3. Did they handle the customer's persona well?
       4. If the customer was IRATE/ANGRY, did the agent de-escalate well?

       OUTPUT JSON:
       {
         "score": number (0-100),
         "summary": "Short paragraph summary of performance",
         "strengths": ["point 1", "point 2"],
         "areasForImprovement": ["point 1", "point 2"],
         "bookingAccuracy": "Perfect" | "Good" | "Needs Work"
       }
       `;

       const response = await evalAI.models.generateContent({
         model: 'gemini-3-flash-preview',
         contents: prompt,
         config: {
           responseMimeType: "application/json",
           responseSchema: {
             type: Type.OBJECT,
             properties: {
                score: { type: Type.NUMBER },
                summary: { type: Type.STRING },
                strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                areasForImprovement: { type: Type.ARRAY, items: { type: Type.STRING } },
                bookingAccuracy: { type: Type.STRING, enum: ["Perfect", "Good", "Needs Work"] }
             }
           }
         }
       });

       if (response.text) {
         setEvaluation(JSON.parse(response.text));
       }

    } catch (e) {
      console.error("Evaluation failed", e);
    }
  };

  // Initialize Service
  useEffect(() => {
    geminiClient.current = new GeminiLiveClient({
      onOpen: () => {
        setIsCallActive(true);
        setCallError('');
        setChatLog([]);
        transcriptBuffer.current = "";
        setHasBookedInSession(false);
        setEvaluation(null);
        setIsMuted(false);
        geminiClient.current?.setMuted(false);
        setAgentSuggestions(["Greetings! Thank you for calling Grand AceReyes Hotel. How may I assist you?"]);
      },
      onClose: () => {
        setIsCallActive(false);
        setIsCustomerSpeaking(false);
        setUserVolume(0);
      },
      onError: (err) => {
        setCallError(err.message);
        setIsCallActive(false);
        setUserVolume(0);
      },
      onAudioData: (speaking) => {
        setIsCustomerSpeaking(speaking);
      },
      onUserVolume: (volume) => {
        setUserVolume(volume);
      },
      onTranscript: (speaker, text, isFinal) => {
        setChatLog(prev => {
          // Don't add empty text
          if (!text.trim()) return prev;

          const role = speaker === 'model' ? 'customer' : 'agent';
          const lastMsg = prev[prev.length - 1];

          // If the last message is from the same speaker and NOT final, update it (streaming)
          if (lastMsg && lastMsg.role === role && !lastMsg.isFinal) {
             const updated = [...prev];
             updated[updated.length - 1] = {
               ...lastMsg,
               text: text,
               isFinal: isFinal
             };
             return updated;
          } else {
             // If previous bubble was not final, finalize it visually
             let updated = [...prev];
             if (updated.length > 0) {
                updated[updated.length - 1].isFinal = true;
             }
             return [
               ...updated,
               { role, text, timestamp: Date.now(), isFinal: isFinal }
             ];
          }
        });

        // Update Context Buffer for Copilot
        if (isFinal) {
           const prefix = speaker === 'model' ? "Customer: " : "Agent: ";
           transcriptBuffer.current += `\n${prefix}${text}`;
           
           // Generate suggestions only when Customer finishes a turn
           if (speaker === 'model') {
             generateCopilotSuggestions();
           }
        }
      }
    });

    return () => {
      geminiClient.current?.disconnect();
    };
  }, []);

  const handleIncomingCall = () => {
    setIsRinging(true);
    // You could play a ringtone sound here if desired
  };

  const handleStartCall = async () => {
    try {
      setIsRinging(false);
      const randomVoice = VOICE_PRESETS[Math.floor(Math.random() * VOICE_PRESETS.length)];
      let finalInstruction = SYSTEM_INSTRUCTION;
      
      if (isTagalog) {
        finalInstruction += `\n\n${TAGALOG_INSTRUCTION}`;
      }

      if (isIrate) {
        finalInstruction += `\n\n${IRATE_INSTRUCTION}`;
      }

      console.log(`Starting call with Voice: ${randomVoice.name}, Tagalog: ${isTagalog}, Irate: ${isIrate}`);

      await geminiClient.current?.connect({
        voiceName: randomVoice.name,
        systemInstruction: finalInstruction
      });

      // The AI starts talking first (as the customer) to initiate a booking inquiry.
      // We send a hidden prompt to trigger the AI's opening line as the customer in the selected language.
      if (isTagalog) {
        geminiClient.current?.sendInitialPrompt("Simulan ang pag-uusap bilang hotel customer sa Tagalog o Taglish ngayon. Bumati sa receptionist at magtanong tungkol sa bakanteng kuwarto.");
      } else {
        geminiClient.current?.sendInitialPrompt("Gently start the conversation as the customer now. Ask about room availability or say hello to the receptionist.");
      }

    } catch (e) {
      console.error(e);
      setCallError("Failed to start call. Check API Key and Mic permissions.");
    }
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    geminiClient.current?.setMuted(nextMuted);
  };

  const handleEndCall = () => {
    geminiClient.current?.disconnect();
    // Trigger evaluation if a booking was submitted during this session
    if (hasBookedInSession) {
      generateEvaluation();
    }
  };

  const handleBookingSubmit = (booking: BookingDraft) => {
    if (booking.roomId) {
      setRooms(prevRooms => prevRooms.map(r => 
        r.id === booking.roomId 
          ? { ...r, status: RoomStatus.OCCUPIED }
          : r
      ));
      
      // Mark as booked in this session so we know to rate them later
      setHasBookedInSession(true);
      
      alert(`Reservation Confirmed for ${booking.guestName}! Don't forget to end the call to see your rating.`);
      
      // Note: We don't clear the draft immediately so the evaluator can read it
    }
  };

  const handleCloseEvaluation = () => {
    setEvaluation(null);
    // Reset Booking Draft after evaluation is closed and call is done
    setSelectedRoom(null);
    setBookingDraft({
      guestName: '',
      email: '',
      phone: '',
      checkIn: '',
      checkOut: '',
      guests: 1,
      notes: '',
    });
  };

  const filteredRooms = rooms.filter(room => {
    if (activeFilters.length === 0) return true;
    if (activeFilters.includes('Available') && room.status !== RoomStatus.AVAILABLE) return false;
    return true;
  });

  const stats = {
    available: rooms.filter(r => r.status === RoomStatus.AVAILABLE).length,
    occupied: rooms.filter(r => r.status === RoomStatus.OCCUPIED).length,
    dirty: rooms.filter(r => r.status === RoomStatus.DIRTY).length,
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-900">
      
      {/* Evaluation Modal */}
      <EvaluationModal 
        evaluation={evaluation} 
        onClose={handleCloseEvaluation} 
      />

      {/* Left Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl z-10">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-lg">H</div>
            <h1 className="text-lg font-bold tracking-wide">Grand AceReyes</h1>
          </div>
          <p className="text-slate-400 text-xs mt-2">Reservation System v2.0</p>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1">
          <div className="px-3 py-2 rounded-lg bg-blue-600 text-white font-medium flex items-center gap-3 cursor-pointer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            Dashboard
          </div>
          <div className="px-3 py-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-3 cursor-pointer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            History
          </div>
          <div className="px-3 py-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-3 cursor-pointer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Settings
          </div>
        </nav>

        <div className="p-4 bg-slate-800 text-xs text-slate-400">
          <p>User: Agent Trainee</p>
          <p className="mt-1">Status: <span className="text-green-400">Online</span></p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* Top Bar: Stats */}
        <header className="bg-white border-b border-slate-200 p-6 flex justify-between items-center shadow-sm z-10">
          <h2 className="text-2xl font-bold text-slate-800">Room Management</h2>
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-emerald-500 rounded-full"></span>
              <span className="text-sm font-medium text-slate-600">Available: <span className="text-slate-900 font-bold">{stats.available}</span></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-rose-500 rounded-full"></span>
              <span className="text-sm font-medium text-slate-600">Occupied: <span className="text-slate-900 font-bold">{stats.occupied}</span></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-amber-500 rounded-full"></span>
              <span className="text-sm font-medium text-slate-600">Cleaning: <span className="text-slate-900 font-bold">{stats.dirty}</span></span>
            </div>
          </div>
        </header>

        {/* Content Grid */}
        <div className="flex-1 flex p-6 gap-6 overflow-hidden">
          
          {/* Room Grid (Left) */}
          <div className="flex-1 flex flex-col min-w-0">
             {/* Filters */}
             <div className="flex gap-3 mb-4 overflow-x-auto pb-2">
               <button 
                onClick={() => setActiveFilters([])}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeFilters.length === 0 ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
               >
                 All Rooms
               </button>
               <button 
                onClick={() => setActiveFilters(['Available'])}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeFilters.includes('Available') ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
               >
                 Available Only
               </button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto pb-24 pr-2 custom-scrollbar">
                {filteredRooms.map(room => (
                  <RoomCard 
                    key={room.id} 
                    room={room} 
                    isSelected={selectedRoom?.id === room.id}
                    onSelect={setSelectedRoom}
                  />
                ))}
             </div>
          </div>

          {/* Right Panel with Tabs */}
          <div className="w-96 shrink-0 flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Tab Headers */}
            <div className="flex border-b border-slate-200">
              <button 
                onClick={() => setRightPanelTab('booking')}
                className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                  rightPanelTab === 'booking' 
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600' 
                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                Booking
              </button>
              <button 
                onClick={() => setRightPanelTab('assistant')}
                className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                  rightPanelTab === 'assistant' 
                  ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' 
                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                AI Copilot
              </button>
            </div>
            
            {/* Tab Content */}
            <div className="flex-1 overflow-hidden relative">
              {rightPanelTab === 'booking' ? (
                <BookingForm 
                  selectedRoom={selectedRoom} 
                  onSubmit={handleBookingSubmit} 
                  data={bookingDraft}
                  onDataChange={setBookingDraft}
                />
              ) : (
                <AgentAssistant 
                  suggestions={agentSuggestions}
                  isLoading={isGeneratingSuggestions}
                  chatLog={chatLog}
                />
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Phone Interface (Absolute Positioned) */}
      <PhoneInterface 
        isActive={isCallActive}
        isRinging={isRinging}
        isSpeaking={isCustomerSpeaking}
        userVolume={userVolume}
        onStartCall={handleStartCall}
        onIncomingCall={handleIncomingCall}
        onEndCall={handleEndCall}
        statusMessage={callError}
        isTagalog={isTagalog}
        setIsTagalog={setIsTagalog}
        isIrate={isIrate}
        setIsIrate={setIsIrate}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
      />
    </div>
  );
};

export default App;
import React, { useState, useRef, useEffect } from "react";
import { GoogleGenAI, Type } from "@google/genai";
import {
  MOCK_ROOMS,
  SYSTEM_INSTRUCTION,
  TAGALOG_INSTRUCTION,
  IRATE_INSTRUCTION,
  VOICE_PRESETS,
} from "./constants";
import {
  Room,
  BookingDraft,
  RoomStatus,
  ChatMessage,
  CallEvaluation,
} from "./types";
import { SCENARIOS } from "./scenarios";
import {
  GraduationCap,
  Sparkles,
  HelpCircle,
  Briefcase,
  GitPullRequest,
  Ban,
  ChevronRight,
  ShieldCheck,
  AlertOctagon,
  DollarSign,
  Coins
} from "lucide-react";
import { RoomCard } from "./components/RoomCard";
import { BookingForm } from "./components/BookingForm";
import { PhoneInterface } from "./components/PhoneInterface";
import { AgentAssistant } from "./components/AgentAssistant";
import { EvaluationModal } from "./components/EvaluationModal";
import { GeminiLiveClient } from "./services/geminiLiveService";
import { ringtoneService } from "./services/ringtoneService";

const checkLivePaymentConfirmation = (
  text: string,
): "GCash" | "PayMaya" | null => {
  const lowercase = text.toLowerCase();

  // GCash keywords
  const gcashKeywords = [
    "finished paying with gcash",
    "paid with gcash",
    "completed gcash",
    "sent through gcash",
    "sent gcash",
    "paid via gcash",
    "tapos na ako magbayad sa gcash",
    "nasend ko na sa gcash",
    "bayad na sa gcash",
    "nakabayad na ako sa gcash",
    "sent na ang gcash",
    "tapos na sa gcash",
    "gcash done",
    "done paying gcash",
    "done with gcash",
    "paid na sa gcash",
  ];

  // PayMaya keywords
  const mayaKeywords = [
    "finished paying with paymaya",
    "paid with paymaya",
    "completed paymaya",
    "sent through paymaya",
    "sent paymaya",
    "paid via paymaya",
    "maya payment done",
    "paid with maya",
    "sent via maya",
    "done paying paymaya",
    "tapos na ako magbayad sa paymaya",
    "nasend ko na sa paymaya",
    "bayad na sa paymaya",
    "nakabayad na ako sa paymaya",
    "sent na ang paymaya",
    "tapos na sa paymaya",
    "paymaya done",
    "nasend ko na sa maya",
    "bayad na sa maya",
    "done with maya",
    "paid na sa maya",
    "maya done",
  ];

  if (gcashKeywords.some((keyword) => lowercase.includes(keyword))) {
    return "GCash";
  }
  if (mayaKeywords.some((keyword) => lowercase.includes(keyword))) {
    return "PayMaya";
  }

  // Fallback combo
  const payWords = [
    "paid",
    "pay",
    "sent",
    "done",
    "tapos",
    "nasend",
    "complete",
    "bayad",
  ];
  const hasGcashWord = lowercase.includes("gcash");
  const hasMayaWord =
    lowercase.includes("paymaya") || lowercase.includes("maya");

  if (hasGcashWord && payWords.some((w) => lowercase.includes(w))) {
    return "GCash";
  }
  if (hasMayaWord && payWords.some((w) => lowercase.includes(w))) {
    return "PayMaya";
  }

  return null;
};

const App: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>(MOCK_ROOMS);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [rightPanelTab, setRightPanelTab] = useState<"booking" | "assistant">(
    "booking",
  );

  // Call State
  const [isCallActive, setIsCallActive] = useState(false);
  const [isRinging, setIsRinging] = useState(false);
  const [isCustomerSpeaking, setIsCustomerSpeaking] = useState(false);
  const [userVolume, setUserVolume] = useState(0);
  const [callError, setCallError] = useState("");
  const [isTagalog, setIsTagalog] = useState(false);
  const [isIrate, setIsIrate] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>("standard");
  const [hasBookedInSession, setHasBookedInSession] = useState(false);
  const [evaluation, setEvaluation] = useState<CallEvaluation | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [successToast, setSuccessToast] = useState<{
    message: string;
    subMessage: string;
  } | null>(null);

  const onCloseCallbackRef = useRef<() => void>();
  const bookingDraftRef = useRef<BookingDraft | null>(null);

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
    guestName: "",
    email: "",
    phone: "",
    checkIn: "",
    checkOut: "",
    guests: 1,
    notes: "",
    cardHolderName: "",
    cardNumber: "",
    cardExpiry: "",
    cardCvc: "",
    paymentMethod: "",
    paymentStatus: "Pending",
  });

  // Copilot & Chat Log State
  const [agentSuggestions, setAgentSuggestions] = useState<string[]>([
    "Waiting for call to start...",
  ]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false); // UI State
  const generatingLock = useRef(false); // Logic Lock (Ref avoids closure staleness)
  const evaluationLock = useRef(false); // Logic Lock for Call Evaluation
  const [chatLog, setChatLog] = useState<ChatMessage[]>([]);

  // Service Refs
  const geminiClient = useRef<GeminiLiveClient | null>(null);
  const transcriptBuffer = useRef<string>(""); // Stores full text for AI Context

  // Keep state synced in refs to bypass websocket closure staleness
  useEffect(() => {
    bookingDraftRef.current = bookingDraft;
  }, [bookingDraft]);

  useEffect(() => {
    onCloseCallbackRef.current = () => {
      generateEvaluation();
    };
  });

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
            "User-Agent": "aistudio-build",
          },
        },
      });

      const response = await suggestionAI.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `You are an expert Hotel Reservation Coach assisting a trainee agent.
        
        Current Conversation Transcript:
        ${history}
        
        Task: Provide 3 distinct, professional, and concise phrases the Agent should say next to move the booking forward, answer questions, or be polite.
        Special Directive: When the customer has selected or agreed to a room/price, make sure to suggest that the agent asks for deposit/guarantee payment details. They can ask for Card details (Cardholder Name, Card Number, Expiry, CVV/CVC) or offer online payment options such as GCash or PayMaya. Tell the agent they can say: "If you prefer, we can send you an online payment link via GCash or PayMaya to settle your deposit."
        If the customer is angry, suggest de-escalation phrases.
        Return ONLY a JSON array of strings. Example: ["Phrase 1", "Phrase 2", "Phrase 3"]`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
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
    if (evaluationLock.current) {
      console.log("Evaluation already in progress (locked). Skipping duplicate call.");
      return;
    }
    const rawTranscript = transcriptBuffer.current.trim();
    if (rawTranscript.length < 15) {
      console.log("No substantial conversation to evaluate. Length:", rawTranscript.length);
      return;
    }

    console.log("Starting QA Evaluation under lock...");
    evaluationLock.current = true;
    setIsEvaluating(true);
    setEvaluation(null);
    try {
      const evalAI = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
      const bookingDraftVal = bookingDraftRef.current || bookingDraft;
      const bookingDataStr = JSON.stringify(bookingDraftVal);

      const prompt = `
       You are an expert, highly strict and critical Hotel Quality Assurance & Audit Manager evaluating a trainee receptionist's phone performance.
       
       TRANSCRIPT OF CALL:
       ${rawTranscript}

       BOOKING FILE RECORDED BY AGENT:
       ${bookingDataStr}

       TASK:
       Perform an objective, stringent audit of the Agent's performance and output a detailed scorecard JSON.
       
       CRITICAL SCORING DIRECTIVES:
       1. Be extremely critical and strict in your evaluation. DO NOT lazy-grade or give perfect 90+ overall or communication scores unless the conversational flow is flawless and professional, showing high standard hospitality, language mastery, and accurate data gathering.
       2. If the call is extremely brief (e.g., fewer than 4-5 turns of exchanges), or if the agent failed to capture the key booking parameters (Guest Name, Dates, Room, occupants count), restrict the "score" and "communicationScore" to under 50, and give a "Needs Work" rating, commenting that the training session was terminated too early to demonstrate sufficient reservation handling.
       3. If the agent behaved unprofessionally, spoke too fast, or failed to handle an irate customer's emotions with empathy, deduct severely from the Overall score and the corresponding criteria (e.g., empathy, pacing).
       4. Securing Booking Deposits: Look for online payment options (GCash/PayMaya) or standard CC details in the transcript. Did the agent explicitly ask the customer for credit card/deposit details? Did these get recorded properly? If not, penalize both Overall and PaymentClarity scores severely.
       5. Booking Integrity: Compare the recorded details (Dates, Guest count, Room selection) against what the customer requested in the transcript. If the booking form was left blank or contains wrong dates/rooms, mark "bookingAccuracy" as "Needs Work".

       OUTPUT JSON SCHEMA:
       {
         "score": number (0-100 overall performance score),
         "summary": "Coaching/auditor summary detailing exactly what was handled well and what critical mistakes or omissions were made, specifically checking if they secured deposit options",
         "strengths": ["string", "string"],
         "areasForImprovement": ["string", "string"],
         "bookingAccuracy": "Perfect" | "Good" | "Needs Work",
         "communicationScore": number (0-100 rating specifically speech, tone, pace, politeness, active listening, and language adaptability),
         "communicationFeedback": "Direct, actionable, coaching style commentary explicitly highlighting vocal delivery, speed, greeting manners, Taglish/Eng fluidity, and empathy",
         "communicationRatings": {
            "clarity": number (1-5 range; only give 5 if dialogue was fully clear and professional),
            "pacing": number (1-5 range; deduct if too fast, robotic, or impatient),
            "empathy": number (1-5 range; deduct if cold, transactional, or failed to handle irate customer emotions),
            "politeness": number (1-5 range; inspect courteous openers, professional sign-offs, and polite requests),
            "paymentClarity": number (1-5 range; rate how accurately they disclosed booking deposits and collected CC details or digital payment links)
         }
       }
       `;

      const response = await evalAI.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER },
              summary: { type: Type.STRING },
              strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              areasForImprovement: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              bookingAccuracy: {
                type: Type.STRING,
                enum: ["Perfect", "Good", "Needs Work"],
              },
              communicationScore: { type: Type.NUMBER },
              communicationFeedback: { type: Type.STRING },
              communicationRatings: {
                type: Type.OBJECT,
                properties: {
                  clarity: { type: Type.NUMBER },
                  pacing: { type: Type.NUMBER },
                  empathy: { type: Type.NUMBER },
                  politeness: { type: Type.NUMBER },
                  paymentClarity: { type: Type.NUMBER },
                },
              },
            },
          },
        },
      });

      if (response.text) {
        let textResult = response.text.trim();
        // Robust markdown guard for JSON
        if (textResult.startsWith("```json")) {
          textResult = textResult.substring(7);
        }
        if (textResult.startsWith("```")) {
          textResult = textResult.substring(3);
        }
        if (textResult.endsWith("```")) {
          textResult = textResult.substring(0, textResult.length - 3);
        }
        textResult = textResult.trim();
        
        console.log("Parsing QA response from Gemini...");
        const parsed = JSON.parse(textResult);
        setEvaluation(parsed);
        console.log("Evaluation successfully generated and set!");
      } else {
        console.error("Empty response received from Gemini for evaluation.");
      }
    } catch (e) {
      console.error("Evaluation failed", e);
    } finally {
      setIsEvaluating(false);
      evaluationLock.current = false;
      console.log("QA Evaluation complete, lock released.");
    }
  };

  // Initialize Service
  useEffect(() => {
    geminiClient.current = new GeminiLiveClient({
      onOpen: () => {
        setIsCallActive(true);
        setCallError("");
        setChatLog([]);
        transcriptBuffer.current = "";
        setHasBookedInSession(false);
        setEvaluation(null);
        setIsMuted(false);
        geminiClient.current?.setMuted(false);
        setAgentSuggestions([
          "Greetings! Thank you for calling Grand AceReyes Hotel. How may I assist you?",
        ]);
      },
      onClose: () => {
        setIsCallActive(false);
        setIsCustomerSpeaking(false);
        setUserVolume(0);
        onCloseCallbackRef.current?.();
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
        setChatLog((prev) => {
          // Don't add empty text
          if (!text.trim()) return prev;

          const role = speaker === "model" ? "customer" : "agent";
          const lastMsg = prev[prev.length - 1];

          // If the last message is from the same speaker and NOT final, update it (streaming)
          if (lastMsg && lastMsg.role === role && !lastMsg.isFinal) {
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...lastMsg,
              text: text,
              isFinal: isFinal,
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
              { role, text, timestamp: Date.now(), isFinal: isFinal },
            ];
          }
        });

        // Update Context Buffer for Copilot
        if (isFinal) {
          const prefix = speaker === "model" ? "Customer: " : "Agent: ";
          transcriptBuffer.current += `\n${prefix}${text}`;

          // Generate suggestions only when Customer finishes a turn
          if (speaker === "model") {
            generateCopilotSuggestions();

            // Check if customer confirms online payment
            const paymentMethodDetected = checkLivePaymentConfirmation(text);
            if (paymentMethodDetected) {
              setBookingDraft((prev) => ({
                ...prev,
                paymentMethod: paymentMethodDetected,
                paymentStatus: "Paid",
              }));
            }
          }
        }
      },
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
      const randomVoice =
        VOICE_PRESETS[Math.floor(Math.random() * VOICE_PRESETS.length)];
      
      const activeScenario = SCENARIOS.find(s => s.id === selectedScenarioId) || SCENARIOS[0];
      let finalInstruction = SYSTEM_INSTRUCTION;

      finalInstruction += `\n\n=== SELECTED TRAINING SCENARIO: ${activeScenario.title} ===\n${activeScenario.systemPromptAddendum}`;

      if (isTagalog) {
        finalInstruction += `\n\n${TAGALOG_INSTRUCTION}`;
      }

      if (isIrate) {
        finalInstruction += `\n\n${IRATE_INSTRUCTION}`;
      }

      console.log(
        `Starting call with Scenario: ${activeScenario.title}, Voice: ${randomVoice.name}, Tagalog: ${isTagalog}, Irate: ${isIrate}`,
      );

      await geminiClient.current?.connect({
        voiceName: randomVoice.name,
        systemInstruction: finalInstruction,
      });

      // The AI starts talking first to initiate the booking/concierge inquiry.
      if (isTagalog) {
        geminiClient.current?.sendInitialPrompt(activeScenario.initialPromptTagalog);
      } else {
        geminiClient.current?.sendInitialPrompt(activeScenario.initialPromptEnglish);
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
      setRooms((prevRooms) =>
        prevRooms.map((r) =>
          r.id === booking.roomId ? { ...r, status: RoomStatus.OCCUPIED } : r,
        ),
      );

      // Mark as booked in this session so we know to rate them later
      setHasBookedInSession(true);

      setSuccessToast({
        message: `Reservation Confirmed for ${booking.guestName || "Guest"}!`,
        subMessage: `Excellent! Click "End Call" on the phone or hang up to instantly view your coaching evaluation scorecard.`,
      });

      // Note: We don't clear the draft immediately so the evaluator can read it
    }
  };

  const handleCloseEvaluation = () => {
    setEvaluation(null);
    // Reset Booking Draft after evaluation is closed and call is done
    setSelectedRoom(null);
    setBookingDraft({
      guestName: "",
      email: "",
      phone: "",
      checkIn: "",
      checkOut: "",
      guests: 1,
      notes: "",
      cardHolderName: "",
      cardNumber: "",
      cardExpiry: "",
      cardCvc: "",
      paymentMethod: "",
      paymentStatus: "Pending",
    });
  };

  const filteredRooms = rooms.filter((room) => {
    if (activeFilters.length === 0) return true;
    if (
      activeFilters.includes("Available") &&
      room.status !== RoomStatus.AVAILABLE
    )
      return false;
    return true;
  });

  const stats = {
    available: rooms.filter((r) => r.status === RoomStatus.AVAILABLE).length,
    occupied: rooms.filter((r) => r.status === RoomStatus.OCCUPIED).length,
    dirty: rooms.filter((r) => r.status === RoomStatus.DIRTY).length,
  };

  const activeScenario =
    SCENARIOS.find((s) => s.id === selectedScenarioId) || SCENARIOS[0];

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-900">
      {/* Evaluation Modal */}
      <EvaluationModal
        evaluation={evaluation}
        isLoading={isEvaluating}
        onClose={handleCloseEvaluation}
      />

      {/* Floating Success Toast Banner */}
      {successToast && (
        <div className="fixed top-6 right-6 z-[120] max-w-sm w-full bg-slate-900 border border-slate-700 text-white rounded-xl shadow-2xl p-4 flex flex-col gap-3 animate-in slide-in-from-top duration-300">
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg shrink-0 mt-0.5">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                {successToast.message}
              </h4>
              <p className="text-slate-300 text-[11px] mt-1 leading-relaxed">
                {successToast.subMessage}
              </p>
            </div>
            <button
              onClick={() => setSuccessToast(null)}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer text-xs"
            >
              ✕
            </button>
          </div>
          <div className="flex items-center gap-2 border-t border-slate-800 pt-3 mt-1 justify-end">
            <button
              onClick={() => {
                setSuccessToast(null);
                handleEndCall();
              }}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 hover:scale-[1.02] text-white text-[10px] font-bold uppercase tracking-wide rounded-lg transition-all"
            >
              Get Evaluation Now ➜
            </button>
          </div>
        </div>
      )}

      {/* Left Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl z-10">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-lg">
              H
            </div>
            <h1 className="text-lg font-bold tracking-wide">Grand AceReyes</h1>
          </div>
          <p className="text-slate-400 text-xs mt-2">Reservation System v2.0</p>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1">
          <div className="px-3 py-2 rounded-lg bg-blue-600 text-white font-medium flex items-center gap-3 cursor-pointer">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              />
            </svg>
            Dashboard
          </div>
          <div className="px-3 py-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-3 cursor-pointer">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            History
          </div>
          <div className="px-3 py-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-3 cursor-pointer">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Settings
          </div>
        </nav>

        <div className="p-4 bg-slate-800 text-xs text-slate-400">
          <p>User: Agent Trainee</p>
          <p className="mt-1">
            Status: <span className="text-green-400">Online</span>
          </p>
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
              <span className="text-sm font-medium text-slate-600">
                Available:{" "}
                <span className="text-slate-900 font-bold">
                  {stats.available}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-rose-500 rounded-full"></span>
              <span className="text-sm font-medium text-slate-600">
                Occupied:{" "}
                <span className="text-slate-900 font-bold">
                  {stats.occupied}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-amber-500 rounded-full"></span>
              <span className="text-sm font-medium text-slate-600">
                Cleaning:{" "}
                <span className="text-slate-900 font-bold">{stats.dirty}</span>
              </span>
            </div>
          </div>
        </header>

        {/* Content Grid */}
        <div className="flex-1 flex p-6 gap-6 overflow-hidden">
          {/* Room Grid (Left) */}
          <div className="flex-1 flex flex-col h-full min-w-0 overflow-y-auto pr-1">
            
            {/* Active Training Scenario Information Banner */}
            <div className="mb-6 bg-white border border-slate-200 rounded-xl p-5 shadow-sm relative overflow-hidden flex flex-col md:flex-row gap-5 items-start justify-between">
              
              <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600"></div>
              
              <div className="flex-1 flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                    activeScenario.category === "General Intake" 
                      ? "bg-blue-50 border-blue-200 text-blue-700"
                      : activeScenario.category === "Alterations & Special Booking"
                        ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-bold"
                        : activeScenario.category === "In-House & Concierge"
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700 font-bold"
                          : "bg-amber-50 border-amber-200 text-amber-700 font-bold"
                  }`}>
                    {activeScenario.category}
                  </span>
                  
                  {isTagalog && (
                    <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full border bg-sky-50 border-sky-200 text-sky-700">
                      🇵🇭 Taglish Mode
                    </span>
                  )}
                  
                  {isIrate && (
                    <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full border bg-rose-50 border-rose-250 text-rose-700 font-extrabold animate-pulse">
                      😡 Highly Irate Customer
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-extrabold text-slate-800 tracking-tight flex items-center gap-2 mt-1">
                  <Sparkles className="w-5 h-5 text-yellow-500 fill-yellow-500 shrink-0 animate-pulse" />
                  {activeScenario.title}
                </h3>
                
                <p className="text-slate-600 text-xs leading-relaxed max-w-2xl">
                  <strong>The Customer:</strong> {activeScenario.description}
                </p>

                <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 mt-1.5">
                  <p className="text-slate-700 text-xs leading-relaxed">
                    <span className="font-bold text-slate-800">Operational Challenge:</span> {activeScenario.challenge}
                  </p>
                </div>
              </div>

              <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-5 flex flex-col gap-2 shrink-0">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
                  <GraduationCap className="w-4 h-4 text-blue-600 shrink-0" />
                  <h4>Trainee Practice Focus</h4>
                </div>
                <div className="bg-blue-50/30 border border-blue-100/50 rounded-lg p-3">
                  <p className="text-slate-600 text-[11px] leading-relaxed font-medium">
                    {activeScenario.learningGoal}
                  </p>
                </div>
                <div className="text-[9.5px] text-slate-500 mt-1 italic flex items-center gap-1">
                  <span className="w-1 h-3 bg-slate-300 rounded-full inline-block"></span>
                  Adjust scenarios on the phone panel before simulating!
                </div>
              </div>

            </div>

            {/* Filters */}
            <div className="flex gap-3 mb-4 overflow-x-auto pb-2">
              <button
                onClick={() => setActiveFilters([])}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeFilters.length === 0 ? "bg-slate-800 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}
              >
                All Rooms
              </button>
              <button
                onClick={() => setActiveFilters(["Available"])}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeFilters.includes("Available") ? "bg-emerald-600 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}
              >
                Available Only
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto pb-24 pr-2 custom-scrollbar">
              {filteredRooms.map((room) => (
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
                onClick={() => setRightPanelTab("booking")}
                className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                  rightPanelTab === "booking"
                    ? "bg-white text-blue-600 border-b-2 border-blue-600"
                    : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                }`}
              >
                Booking
              </button>
              <button
                onClick={() => setRightPanelTab("assistant")}
                className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                  rightPanelTab === "assistant"
                    ? "bg-white text-indigo-600 border-b-2 border-indigo-600"
                    : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                }`}
              >
                AI Copilot
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden relative">
              {rightPanelTab === "booking" ? (
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
        selectedScenarioId={selectedScenarioId}
        setSelectedScenarioId={setSelectedScenarioId}
      />
    </div>
  );
};

export default App;

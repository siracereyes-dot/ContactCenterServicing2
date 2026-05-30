import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Phone, PhoneOff, Users, GripHorizontal, Award, Sparkles, AlertTriangle, ShieldCheck, CheckCircle } from 'lucide-react';
import { SCENARIOS, CallScenario } from '../scenarios';

interface PhoneInterfaceProps {
  isActive: boolean;
  isRinging: boolean;
  isSpeaking: boolean;
  userVolume: number;
  onStartCall: () => void;
  onIncomingCall: () => void;
  onEndCall: () => void;
  statusMessage: string;
  isTagalog: boolean;
  setIsTagalog: (value: boolean) => void;
  isIrate: boolean;
  setIsIrate: (value: boolean) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  selectedScenarioId: string;
  setSelectedScenarioId: (value: string) => void;
  customApiKey: string;
  setCustomApiKey: (value: string) => void;
}

export const PhoneInterface: React.FC<PhoneInterfaceProps> = ({ 
  isActive, 
  isRinging,
  isSpeaking, 
  userVolume,
  onStartCall, 
  onIncomingCall,
  onEndCall,
  statusMessage,
  isTagalog,
  setIsTagalog,
  isIrate,
  setIsIrate,
  isMuted,
  onToggleMute,
  selectedScenarioId,
  setSelectedScenarioId,
  customApiKey,
  setCustomApiKey
}) => {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [showMicTip, setShowMicTip] = useState(false);

  const [showApiSettings, setShowApiSettings] = useState(false);
  const [tempApiKey, setTempApiKey] = useState(customApiKey);
  const [isKeySaved, setIsKeySaved] = useState(false);

  useEffect(() => {
    setTempApiKey(customApiKey);
  }, [customApiKey]);

  const handleSaveKeyClick = () => {
    localStorage.setItem("CUSTOM_GEMINI_API_KEY", tempApiKey);
    setCustomApiKey(tempApiKey);
    setIsKeySaved(true);
    setTimeout(() => {
      setIsKeySaved(false);
    }, 3000);
  };

  useEffect(() => {
    if (isActive && !isMuted && (userVolume || 0) < 0.002) {
      const timer = setTimeout(() => {
        setShowMicTip(true);
      }, 4000);
      return () => clearTimeout(timer);
    } else {
      setShowMicTip(false);
    }
  }, [isActive, isMuted, userVolume]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging.current) {
        setPosition({
          x: e.clientX - dragOffset.current.x,
          y: e.clientY - dragOffset.current.y
        });
      }
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      dragOffset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
      isDragging.current = true;
      
      // Initialize position on first drag to prevent jumping
      if (!position) {
        setPosition({ x: rect.left, y: rect.top });
      }
    }
  };

  const style: React.CSSProperties = position 
    ? { left: `${position.x}px`, top: `${position.y}px` } 
    : {};

  return (
    <div 
      ref={containerRef}
      style={style}
      className={`fixed w-80 bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden z-50 ${!position ? 'bottom-6 right-6' : ''}`}
    >
      {/* Header - Draggable Area */}
      <div 
        onMouseDown={handleMouseDown}
        className="bg-slate-800 p-4 flex items-center justify-between border-b border-slate-700 cursor-move select-none active:cursor-grabbing"
      >
        <div className="flex items-center gap-2 pointer-events-none">
          <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-white font-medium">Simulated Line</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 pointer-events-none">VoIP: HD</span>
          {/* Drag Handle Icon */}
          <GripHorizontal className="h-4 w-4 text-slate-500" />
        </div>
      </div>

      {/* Main Display */}
      <div className="p-6 flex flex-col items-center justify-center min-h-[180px] bg-gradient-to-b from-slate-900 to-slate-800 relative">
        
        {isActive ? (
          <>
            {/* Avatar / Visualizer */}
            <div className="relative mb-4">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-bold transition-all duration-200 ${isSpeaking ? 'scale-110 recording-pulse' : ''} ${isIrate ? 'bg-red-600' : 'bg-blue-600'}`}>
                {isIrate ? '😡' : 'AI'}
              </div>
            </div>
            
            <div className="text-center">
              <h3 className="text-white text-lg font-semibold">Active Session</h3>
              <p className="text-slate-400 text-sm mt-1">{isSpeaking ? "Customer is speaking..." : "Customer listening..."}</p>
            </div>

            {/* Real-time Agent/User Mic Signal Meter */}
            <div className="mt-4 flex flex-col items-center gap-2 w-full max-w-[220px]">
              <div className="flex items-center gap-1 h-5 justify-center w-full">
                {[0.2, 0.45, 0.8, 0.5, 0.25].map((mul, idx) => {
                  const currentVol = userVolume || 0;
                  // Use a logarithmic-feel RMS boost scale so even low/average vocals bounce beautifully and responsively!
                  const normVol = Math.min(1, Math.max(0, (Math.log10(currentVol + 1e-4) + 4.0) / 3.0)); // maps 0.0001..0.1 to 0..1
                  const height = isMuted 
                    ? 4 
                    : 4 + normVol * 16 * mul * 1.5;
                  
                  return (
                    <div 
                      key={idx} 
                      style={{ height: `${height}px` }}
                      className={`w-1 rounded-full transition-all duration-75 ${
                        isMuted 
                          ? 'bg-slate-700' 
                          : currentVol > 0.002 
                            ? 'bg-green-400 shadow-sm shadow-green-400/30' 
                            : 'bg-emerald-600/40'
                      }`}
                    />
                  );
                })}
              </div>
              <span className={`text-[9.5px] uppercase tracking-wider font-semibold ${
                isMuted 
                  ? 'text-red-400' 
                  : (userVolume || 0) > 0.002 
                    ? 'text-green-400 animate-pulse' 
                    : 'text-slate-500'
              }`}>
                {isMuted ? "Mic Muted" : (userVolume || 0) > 0.002 ? "Mic Capturing Audio" : "Mic Live (Silence)"}
              </span>

              {/* Responsive Diagnostic Tip */}
              {showMicTip && (
                <div className="mt-1 bg-slate-800/90 border border-slate-700/60 p-2 rounded-lg text-left shadow-inner text-amber-300">
                  <p className="text-[10px] leading-relaxed">
                    💡 <span className="underline font-semibold text-amber-400">Quiet or uncaptured mic?</span> Grant microphone permission to Chrome. If nested in an iframe, try clicking <strong>"Open App in New Tab ↗"</strong> in the top-right menu!
                  </p>
                </div>
              )}
            </div>
          </>
        ) : isRinging ? (
          <div className="text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-white mb-4 recording-pulse shadow-lg shadow-green-500/20">
              <Phone className="h-10 w-10 animate-bounce" />
            </div>
            <h3 className="text-white text-xl font-bold">Incoming Call</h3>
            <p className="text-slate-400 text-sm animate-pulse">Ringing...</p>
          </div>
        ) : (
          <div className="text-center text-slate-500 w-full flex flex-col items-center">
            <p className="text-slate-400 text-xs font-semibold mb-2">Simulation Operator</p>
            
            <button 
              onClick={onIncomingCall}
              className="mb-4 w-full max-w-[240px] py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white rounded-xl shadow-lg shadow-blue-600/10 transition-all text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
            >
              <Phone className="h-4 w-4 animate-pulse fill-current" />
              Simulate Incoming Call
            </button>
            
            {/* Config Panel */}
            <div className="flex flex-col gap-3 px-4 w-full">
              {/* Scenario Selector */}
              <div className="flex flex-col text-left">
                <label className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 mb-1">Select Training Case</label>
                <select
                  value={selectedScenarioId}
                  onChange={(e) => setSelectedScenarioId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-2.5 py-2 text-xs font-semibold focus:ring-1 focus:ring-blue-500 focus:outline-none cursor-pointer"
                >
                  <optgroup label="General Intake" className="bg-slate-900 text-slate-400 font-bold">
                    <option value="standard">🛎️ Standard Booking Inquiry</option>
                  </optgroup>
                  <optgroup label="Alterations & Special Booking" className="bg-slate-900 text-slate-400 font-bold">
                    <option value="corporate">💼 Corporate/Group Coord.</option>
                    <option value="modification">🔄 Complex Modification/Extension</option>
                    <option value="cancellation">❌ Strict Cancellation Dispute</option>
                  </optgroup>
                  <optgroup label="In-House & Concierge" className="bg-slate-900 text-slate-400 font-bold">
                    <option value="vip">💎 VIP / High-Maintenance Guest</option>
                    <option value="emergency">🚨 Emergency / Maintenance Crisis</option>
                  </optgroup>
                  <optgroup label="Billing & Security" className="bg-slate-900 text-slate-400 font-bold">
                    <option value="disputed">💵 Disputed Incidental Charges</option>
                    <option value="fraud">🔒 Fraud / Double-Booking inquiry</option>
                  </optgroup>
                </select>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-2 gap-2">
                {/* Tagalog Toggle */}
                <button 
                  onClick={() => setIsTagalog(!isTagalog)}
                  className={`flex flex-col justify-between p-2 rounded-lg border text-left transition-colors cursor-pointer ${isTagalog ? 'bg-blue-900/30 border-blue-500/40 text-blue-300' : 'bg-slate-800/40 border-slate-700/60 text-slate-400'}`}
                >
                  <span className="text-[8px] font-extrabold uppercase tracking-widest leading-none text-slate-500 mt-0.5">Language</span>
                  <span className="text-xs font-bold mt-1">{isTagalog ? '🇵🇭 Taglish' : '🇺🇸 English'}</span>
                </button>

                {/* Irate Toggle */}
                <button 
                  onClick={() => setIsIrate(!isIrate)}
                  className={`flex flex-col justify-between p-2 rounded-lg border text-left transition-colors cursor-pointer ${isIrate ? 'bg-red-950/40 border-red-500/30 text-red-300' : 'bg-slate-800/40 border-slate-700/60 text-slate-400'}`}
                >
                  <span className="text-[8px] font-extrabold uppercase tracking-widest leading-none text-slate-500 mt-0.5">Caller State</span>
                  <span className="text-xs font-bold mt-1">{isIrate ? '😡 Irate' : '😊 Patient'}</span>
                </button>
              </div>

              {/* API Configuration */}
              <div className="flex flex-col text-left mt-1 border-t border-slate-800/60 pt-3">
                <button
                  type="button"
                  onClick={() => setShowApiSettings(!showApiSettings)}
                  className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 mb-1 flex items-center justify-between w-full hover:text-white transition-colors cursor-pointer focus:outline-none"
                >
                  <span className="flex items-center gap-1">🔑 {customApiKey ? 'Gemini API Key (Set)' : 'Gemini API Key (Required)'}</span>
                  <span className="text-[9px] text-blue-400 font-bold hover:underline">{showApiSettings ? 'Collapse' : 'Configure'}</span>
                </button>
                
                {showApiSettings && (
                  <div className="flex flex-col gap-1.5 bg-slate-900/40 border border-slate-800/70 p-2 rounded-lg mt-1">
                    <p className="text-[9.5px] text-slate-400 leading-normal">
                      Vercel deployment needs an API Key. Paste yours below to activate voice simulation in your browser:
                    </p>
                    <div className="flex gap-2.5 items-center">
                      <input
                        type="password"
                        placeholder="AIzaSy..."
                        value={tempApiKey}
                        onChange={(e) => setTempApiKey(e.target.value)}
                        className="flex-1 min-w-0 bg-slate-950 border border-slate-700/60 rounded px-2 py-1 text-[11px] text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleSaveKeyClick}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold text-[10px] min-w-[50px] cursor-pointer"
                      >
                        Save
                      </button>
                    </div>
                    {isKeySaved && (
                      <span className="text-[9px] text-green-400 font-semibold">✓ Key saved to browser storage!</span>
                    )}
                  </div>
                )}
              </div>
            </div>
            <p className="text-[9px] mt-4 text-slate-600 font-semibold uppercase tracking-wider">Caller voice selected automatically</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-4 bg-slate-800 grid grid-cols-3 gap-4 items-center justify-items-center border-t border-slate-700">
        <button 
          onClick={onToggleMute}
          disabled={!isActive}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${!isActive ? 'opacity-50 cursor-not-allowed' : ''} ${isMuted ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
          title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
        >
          {isMuted ? (
            <MicOff className="h-6 w-6" />
          ) : (
            <Mic className="h-6 w-6" />
          )}
        </button>

        {isRinging ? (
          <button 
           onClick={onStartCall}
           className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center text-white shadow-lg animate-bounce hover:bg-green-600 transition-all ring-4 ring-green-500/30"
           title="Answer Call"
         >
           <Phone className="h-8 w-8" fill="currentColor" />
         </button>
        ) : !isActive ? (
           <button 
           disabled
           className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center text-slate-500 cursor-not-allowed opacity-50"
         >
           <Phone className="h-8 w-8" fill="currentColor" />
         </button>
        ) : (
          <button 
            onClick={onEndCall}
            className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-white shadow-lg hover:bg-red-600 hover:scale-105 transition-all"
            title="End Call"
          >
            <PhoneOff className="h-8 w-8" fill="currentColor" />
          </button>
        )}

        <button className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 hover:bg-slate-600 transition-colors">
          <Users className="h-6 w-6" />
        </button>
      </div>
      
      {statusMessage && (
        <div className="px-4 py-2.5 bg-red-950 border-t border-red-900/50 text-red-200 text-xs text-center flex flex-col gap-1 items-center justify-center">
          <span className="font-semibold flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-red-400" /> 
            {statusMessage}
          </span>
          {!customApiKey && (
            <span className="text-[10px] text-red-300/85">
              💡 Tip: Click <strong>"Configure"</strong> under Gemini API Key above to set your API key.
            </span>
          )}
        </div>
      )}
    </div>
  );
};
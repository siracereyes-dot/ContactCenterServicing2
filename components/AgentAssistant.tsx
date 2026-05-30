import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types';

interface AgentAssistantProps {
  suggestions: string[];
  isLoading: boolean;
  chatLog: ChatMessage[];
}

export const AgentAssistant: React.FC<AgentAssistantProps> = ({ suggestions, isLoading, chatLog }) => {
  const [speakingPhrase, setSpeakingPhrase] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat log
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatLog]);

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.onstart = () => setSpeakingPhrase(text);
      utterance.onend = () => setSpeakingPhrase(null);
      utterance.onerror = () => setSpeakingPhrase(null);
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Text-to-Speech is not supported in this browser.");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full flex flex-col overflow-hidden">
      
      {/* Header */}
      <div className="p-4 border-b border-slate-100 bg-indigo-50/50 flex justify-between items-center shrink-0">
        <h2 className="text-lg font-semibold text-indigo-900 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          AI Copilot
        </h2>
        {isLoading && (
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-100"></span>
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-200"></span>
            </div>
        )}
      </div>

      {/* Live Transcript Log */}
      <div className="flex-1 overflow-y-auto bg-slate-50 p-4 space-y-3 min-h-0" ref={scrollRef}>
        {chatLog.length === 0 ? (
          <div className="text-center mt-10 text-slate-400 text-xs italic">
            <p>Live conversation log will appear here.</p>
            <p>Start the call to begin.</p>
          </div>
        ) : (
          chatLog.map((msg, idx) => (
            <div key={idx} className={`flex flex-col ${msg.role === 'agent' ? 'items-end' : 'items-start'}`}>
              <div 
                className={`max-w-[85%] px-3 py-2 rounded-xl text-sm shadow-sm ${
                  msg.role === 'agent' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none'
                } ${!msg.isFinal ? 'opacity-70' : ''}`}
              >
                {msg.text}
                {!msg.isFinal && <span className="inline-block w-1 h-3 ml-1 bg-current animate-pulse"/>}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 px-1">
                {msg.role === 'agent' ? 'You' : 'Customer'}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Copilot Suggestions */}
      <div className="h-1/3 border-t border-slate-200 bg-white flex flex-col shrink-0">
        <div className="p-2 bg-indigo-50/30 border-b border-slate-100">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">
            Suggested Responses
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          {suggestions.length === 0 ? (
             <div className="text-center p-4 text-slate-400 text-sm">
                Waiting for context...
             </div>
          ) : (
            suggestions.map((phrase, idx) => (
              <button
                key={idx}
                onClick={() => speak(phrase)}
                disabled={speakingPhrase !== null && speakingPhrase !== phrase}
                className={`w-full text-left p-3 rounded-lg border transition-all duration-200 group flex items-start gap-2 shadow-sm
                  ${speakingPhrase === phrase 
                    ? 'bg-indigo-100 border-indigo-300 ring-1 ring-indigo-300' 
                    : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5'
                  }`}
              >
                <div className={`mt-0.5 shrink-0 ${speakingPhrase === phrase ? 'text-indigo-600 animate-pulse' : 'text-indigo-300 group-hover:text-indigo-500'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className={`text-xs leading-relaxed ${speakingPhrase === phrase ? 'text-indigo-900 font-medium' : 'text-slate-700'}`}>
                  {phrase}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
      
    </div>
  );
};
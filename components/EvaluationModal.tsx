import React, { useEffect, useState } from 'react';
import { CallEvaluation } from '../types';

interface EvaluationModalProps {
  evaluation: CallEvaluation | null;
  isLoading: boolean;
  onClose: () => void;
}

export const EvaluationModal: React.FC<EvaluationModalProps> = ({ evaluation, isLoading, onClose }) => {
  const [loadingStep, setLoadingStep] = useState(0);

  useEffect(() => {
    if (isLoading) {
      setLoadingStep(0);
      const interval = setInterval(() => {
        setLoadingStep(prev => (prev < 3 ? prev + 1 : prev));
      }, 1100);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all border border-slate-150 p-8 text-center flex flex-col items-center gap-6">
          <div className="relative flex items-center justify-center">
            {/* Spinning outward rings */}
            <div className="absolute w-24 h-24 rounded-full border-4 border-blue-500/20 border-t-blue-600 animate-spin"></div>
            <div className="absolute w-18 h-18 rounded-full border-4 border-indigo-500/10 border-b-indigo-500 animate-spin [animation-direction:reverse] [animation-duration:1.5s]"></div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-650 font-bold text-xl animate-pulse">
              QA
            </div>
          </div>
          
          <div className="space-y-1.5">
            <h3 className="text-slate-800 text-lg font-bold">QA Evaluation in Progress</h3>
            <p className="text-slate-500 text-xs">Analyzing training session transcript and reservation data...</p>
          </div>

          <div className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-left space-y-3">
            {[
              { label: 'Auditing Booking details & Room integrity', check: loadingStep >= 0 },
              { label: 'Analyzing speech clarity & pacing metrics', check: loadingStep >= 1 },
              { label: 'Evaluating hospitality greeting & empathy score', check: loadingStep >= 2 },
              { label: 'Reviewing GCash, PayMaya or Card deposit processing', check: loadingStep >= 3 },
            ].map((step, idx) => (
              <div key={idx} className="flex items-center gap-3 text-xs">
                {step.check ? (
                  <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <div className="w-3 h-3 rounded-full border-2 border-slate-300 border-t-blue-500 animate-spin shrink-0"></div>
                )}
                <span className={`font-semibold ${step.check ? 'text-slate-700' : 'text-slate-400 italic animate-pulse'}`}>
                  {step.label} {step.check ? '— Checked' : '...'}
                </span>
              </div>
            ))}
          </div>

          <div className="text-[10px] text-slate-400 italic">
            Generating expert performance scorecard using Gemini...
          </div>
        </div>
      </div>
    );
  }

  if (!evaluation) return null;

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-amber-500';
    return 'text-rose-500';
  };

  const getAccuracyBadge = (accuracy: string) => {
    switch (accuracy) {
      case 'Perfect': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Good': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-rose-100 text-rose-800 border-rose-200';
    }
  };

  const getScoreBg = (score: number) => {
    if (score >= 90) return 'bg-emerald-50 border-emerald-200 text-emerald-700';
    if (score >= 75) return 'bg-blue-50 border-blue-200 text-blue-700';
    if (score >= 60) return 'bg-amber-50 border-amber-200 text-amber-700';
    return 'bg-rose-50 border-rose-200 text-rose-700';
  };

  const renderMeter = (label: string, rating: number, description: string) => {
    const percentage = (rating / 5) * 100;
    const colorClass = rating >= 4.5 ? 'bg-emerald-500' : rating >= 3.5 ? 'bg-blue-500' : rating >= 2.5 ? 'bg-amber-500' : 'bg-rose-500';
    return (
      <div className="space-y-1">
        <div className="flex justify-between items-center text-xs">
          <span className="font-semibold text-slate-700">{label}</span>
          <div className="flex items-center gap-1.5 font-bold text-slate-900">
            <span>{rating} / 5</span>
            <div className="flex text-amber-500 text-[10px]">
              {'★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating))}
            </div>
          </div>
        </div>
        <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
          <div className={`h-full ${colorClass} rounded-full transition-all duration-500`} style={{ width: `${percentage}%` }}></div>
        </div>
        <p className="text-[10px] text-slate-500 italic mt-0.5">{description}</p>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden transform transition-all scale-100 border border-slate-100">
        
        {/* Dual Score Header */}
        <div className="bg-slate-50 p-6 border-b border-slate-200">
          <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider text-center mb-4">Reservation Agent Performance Review</h3>
          
          <div className="grid grid-cols-2 gap-4 divide-x divide-slate-200">
            {/* Overall Booking Score */}
            <div className="text-center px-2">
              <span className="text-[10px] uppercase font-bold text-slate-400">Booking Integrity</span>
              <div id="overall-performance-score" className={`text-4xl sm:text-5xl font-black mt-1 ${getScoreColor(evaluation.score)}`}>
                {evaluation.score}
                <span className="text-xl text-slate-400 font-medium">/100</span>
              </div>
              <div className="mt-2.5">
                <span id="booking-accuracy-status" className={`inline-block px-2.5 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wide ${getAccuracyBadge(evaluation.bookingAccuracy)}`}>
                  {evaluation.bookingAccuracy} Accuracy
                </span>
              </div>
            </div>

            {/* Communication Score */}
            <div className="text-center px-2">
              <span className="text-[10px] uppercase font-bold text-slate-400">Communication Skills</span>
              <div id="communication-score" className={`text-4xl sm:text-5xl font-black mt-1 ${getScoreColor(evaluation.communicationScore || evaluation.score)}`}>
                {evaluation.communicationScore || evaluation.score}
                <span className="text-xl text-slate-400 font-medium">/100</span>
              </div>
              <div className="mt-2.5">
                <span id="comm-rating-status" className={`inline-block px-2.5 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wide ${
                  (evaluation.communicationScore || evaluation.score) >= 90 ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                  (evaluation.communicationScore || evaluation.score) >= 75 ? 'bg-blue-100 text-blue-800 border-blue-200' :
                  (evaluation.communicationScore || evaluation.score) >= 60 ? 'bg-amber-50 text-amber-800 border-amber-200' :
                  'bg-rose-100 text-rose-800 border-rose-200'
                }`}>
                  {(evaluation.communicationScore || evaluation.score) >= 90 ? 'Excellent Speaker' :
                   (evaluation.communicationScore || evaluation.score) >= 75 ? 'Good Command' :
                   (evaluation.communicationScore || evaluation.score) >= 60 ? 'Making Progress' :
                   'Needs Training'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[55vh] overflow-y-auto custom-scrollbar">
          
          {/* General Summary */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5 uppercase tracking-wider">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Evaluation Summary
            </h4>
            <p className="text-slate-650 text-xs leading-relaxed">
              {evaluation.summary}
            </p>
          </div>

          {/* Coach's Communication Feedback */}
          {evaluation.communicationFeedback && (
            <div className="bg-indigo-50 border border-indigo-150 p-4 rounded-xl">
              <h4 className="text-xs font-bold text-indigo-900 mb-1.5 flex items-center gap-1.5 uppercase tracking-wider">
                <svg className="w-4.5 h-4.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Coach's Communication Commentary
              </h4>
              <p className="text-indigo-850 text-xs leading-relaxed italic">
                "{evaluation.communicationFeedback}"
              </p>
            </div>
          )}

          {/* Communication Scorecard Breakdown */}
          {evaluation.communicationRatings && (
            <div className="border border-slate-200 rounded-xl p-4 space-y-4">
              <h4 id="comm-ratings-title" className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
                </svg>
                Speech & Phrasing Scorecard
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                {renderMeter('Vocal Clarity & Tone', evaluation.communicationRatings.clarity, 'Pronounced with clear syllables, appropriate volume and warm hospitality demeanor.')}
                {renderMeter('Speaking Pace / Speed', evaluation.communicationRatings.pacing, 'Maintained normal pacing, giving the customer comfortable segments to talk.')}
                {renderMeter('Hospitality Empathy', evaluation.communicationRatings.empathy, 'Attentive to specific reservation desires and emotional needs.')}
                {renderMeter('Manners & Greetings', evaluation.communicationRatings.politeness, 'Uses courteous openers, handles Tagalog/English smoothly, politely signs off.')}
                {renderMeter('Terms & Deposit Processing', evaluation.communicationRatings.paymentClarity, 'Disclosed deposits clearly and requested credit card details or digital app links properly.')}
              </div>
            </div>
          )}

          {/* Strengths and Weaknesses Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-150">
              <h4 className="text-emerald-855 text-xs font-bold uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Key Strengths
              </h4>
              <ul className="space-y-1.5">
                {evaluation.strengths.map((item, idx) => (
                  <li key={idx} className="text-emerald-800 text-[11px] flex items-start gap-1.5 leading-relaxed">
                    <span className="mt-0.5 text-emerald-500">•</span> {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-rose-50 rounded-xl p-4 border border-rose-150">
              <h4 className="text-rose-855 text-xs font-bold uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <svg className="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                Areas to Improve
              </h4>
              <ul className="space-y-1.5">
                {evaluation.areasForImprovement.map((item, idx) => (
                  <li key={idx} className="text-rose-800 text-[11px] flex items-start gap-1.5 leading-relaxed">
                    <span className="mt-0.5 text-rose-400">•</span> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-slate-900 text-white text-xs font-bold uppercase rounded-lg hover:bg-slate-800 transition-colors shadow-lg tracking-wider"
          >
            Dismiss Review
          </button>
        </div>

      </div>
    </div>
  );
};
import React from 'react';
import { CallEvaluation } from '../types';

interface EvaluationModalProps {
  evaluation: CallEvaluation | null;
  onClose: () => void;
}

export const EvaluationModal: React.FC<EvaluationModalProps> = ({ evaluation, onClose }) => {
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100">
        
        {/* Header */}
        <div className="bg-slate-50 p-6 border-b border-slate-100 text-center">
          <h3 className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Performance Review</h3>
          <div className={`text-6xl font-black mt-2 ${getScoreColor(evaluation.score)}`}>
            {evaluation.score}
            <span className="text-2xl text-slate-400 font-medium">/100</span>
          </div>
          <div className="mt-3 inline-block px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wide bg-white shadow-sm">
            Accuracy: <span className={`ml-1 px-2 py-0.5 rounded ${getAccuracyBadge(evaluation.bookingAccuracy)}`}>{evaluation.bookingAccuracy}</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
          
          <div>
            <h4 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Summary
            </h4>
            <p className="text-slate-600 text-sm leading-relaxed">
              {evaluation.summary}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
              <h4 className="text-emerald-800 text-xs font-bold uppercase tracking-wide mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Strengths
              </h4>
              <ul className="space-y-2">
                {evaluation.strengths.map((item, idx) => (
                  <li key={idx} className="text-emerald-700 text-xs flex items-start gap-1.5">
                    <span className="mt-0.5 text-emerald-400">•</span> {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-rose-50 rounded-xl p-4 border border-rose-100">
              <h4 className="text-rose-800 text-xs font-bold uppercase tracking-wide mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                Improvements
              </h4>
              <ul className="space-y-2">
                {evaluation.areasForImprovement.map((item, idx) => (
                  <li key={idx} className="text-rose-700 text-xs flex items-start gap-1.5">
                    <span className="mt-0.5 text-rose-400">•</span> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors shadow-lg"
          >
            Close Review
          </button>
        </div>

      </div>
    </div>
  );
};
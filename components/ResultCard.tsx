import React, { useState } from 'react';
import { VerificationResult } from '../types';
import { Share2, AlertTriangle, CheckCircle2, XCircle, HelpCircle, ExternalLink, Quote, Copy, Check } from 'lucide-react';

interface ResultCardProps {
  result: VerificationResult;
}

const ResultCard: React.FC<ResultCardProps> = ({ result }) => {
  const [copied, setCopied] = useState(false);

  // Enhanced color schemes for high contrast and accessibility
  const getTheme = (verdict: string) => {
    switch (verdict) {
      case 'True': 
        return { 
          headerBg: 'bg-emerald-700', 
          headerText: 'text-white',
          bodyBg: 'bg-emerald-50',
          borderColor: 'border-emerald-200', 
          icon: <CheckCircle2 className="w-10 h-10 text-emerald-100" />,
          badge: 'bg-emerald-900 text-emerald-100'
        };
      case 'False': 
        return { 
          headerBg: 'bg-rose-700', 
          headerText: 'text-white',
          bodyBg: 'bg-rose-50',
          borderColor: 'border-rose-200', 
          icon: <XCircle className="w-10 h-10 text-rose-100" />,
          badge: 'bg-rose-900 text-rose-100'
        };
      case 'Misleading': 
        return { 
          headerBg: 'bg-amber-600', 
          headerText: 'text-white',
          bodyBg: 'bg-amber-50',
          borderColor: 'border-amber-200', 
          icon: <AlertTriangle className="w-10 h-10 text-amber-100" />,
          badge: 'bg-amber-800 text-amber-100'
        };
      default: // Unverified
        return { 
          headerBg: 'bg-slate-700', 
          headerText: 'text-white',
          bodyBg: 'bg-slate-50',
          borderColor: 'border-slate-300', 
          icon: <HelpCircle className="w-10 h-10 text-slate-200" />,
          badge: 'bg-slate-900 text-slate-100'
        };
    }
  };

  const theme = getTheme(result.verdict);
  const isSensitive = ['Medical', 'Financial'].includes(result.category);

  const handleShare = () => {
    const textToShare = `🔍 *Fake-Forward Verifier*\nVerdict: ${result.verdict.toUpperCase()}\n\n${result.summary}\n\nCheck your facts!`;
    if (navigator.share) {
      navigator.share({ title: 'Fact Check Result', text: textToShare }).catch(console.error);
    } else {
      navigator.clipboard.writeText(textToShare);
      alert('Result copied to clipboard!');
    }
  };

  const handleCopyExplanation = () => {
    navigator.clipboard.writeText(result.explanation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`w-full mt-8 rounded-2xl shadow-xl border-2 ${theme.borderColor} overflow-hidden bg-white animate-fade-in-up`}>
      
      {/* Verdict Header */}
      <div className={`${theme.headerBg} p-8 flex flex-col sm:flex-row items-center justify-between gap-6`}>
        <div className="flex items-center gap-5">
          <div className="p-2 bg-white/10 rounded-full backdrop-blur-md shadow-inner">
            {theme.icon}
          </div>
          <div>
            <h2 className={`text-4xl font-black tracking-tight ${theme.headerText} drop-shadow-sm`}>{result.verdict.toUpperCase()}</h2>
            <div className={`inline-block mt-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm ${theme.badge}`}>
              {result.category}
            </div>
          </div>
        </div>
        
        {/* Confidence Meter */}
        <div className="flex flex-col items-center sm:items-end gap-2 w-full sm:w-auto">
          <span className="text-white/90 text-xs font-bold uppercase tracking-widest">AI Confidence</span>
          <div className="w-full sm:w-48 bg-black/30 rounded-full h-3 backdrop-blur-sm overflow-hidden">
             <div 
               className="h-full bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-1000 ease-out"
               style={{ width: `${result.confidence}%` }}
             />
          </div>
          <span className="text-white font-mono font-bold text-lg">{result.confidence}%</span>
        </div>
      </div>

      {/* Sensitive Warning */}
      {isSensitive && (result.verdict === 'False' || result.verdict === 'Misleading') && (
        <div className="bg-red-50 p-4 border-b border-red-200 flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-red-600 shrink-0" />
          <p className="text-sm text-red-800 font-bold leading-relaxed">
            CRITICAL WARNING: This claim involves health or money. Misinformation here can be dangerous. Always consult a doctor or certified financial advisor.
          </p>
        </div>
      )}

      <div className="p-8 space-y-8 bg-white">
        
        {/* Explanation */}
        <section>
          <div className="flex items-center justify-between mb-3">
             <h3 className="text-sm font-extrabold text-slate-400 uppercase tracking-widest">Analysis</h3>
             <button 
               onClick={handleCopyExplanation}
               className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors uppercase tracking-wide group"
               title="Copy explanation to clipboard"
             >
               {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4 group-hover:scale-110 transition-transform" />}
               {copied ? 'Copied' : 'Copy Analysis'}
             </button>
          </div>
          <p className="text-slate-900 leading-8 text-lg font-medium">{result.explanation}</p>
        </section>

        {/* Citations Grid */}
        <section>
           <h3 className="text-sm font-extrabold text-slate-400 uppercase tracking-widest mb-4">Evidence Sources</h3>
           {result.citations.length > 0 ? (
             <div className="grid grid-cols-1 gap-3">
               {result.citations.map((cite, idx) => (
                 <a 
                   key={idx} 
                   href={cite.url} 
                   target="_blank" 
                   rel="noopener noreferrer" 
                   className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:shadow-md hover:bg-blue-50/50 transition-all group bg-slate-50"
                 >
                   <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm shrink-0">
                      <ExternalLink className="w-5 h-5 text-slate-500 group-hover:text-blue-600" />
                   </div>
                   <span className="text-blue-700 font-semibold text-base truncate group-hover:underline">
                     {cite.title}
                   </span>
                 </a>
               ))}
             </div>
           ) : (
             <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 italic text-sm flex items-center gap-2">
               <HelpCircle className="w-4 h-4" />
               No direct web links found, but analysis is based on established general knowledge.
             </div>
           )}
        </section>

        {/* Share Action */}
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 border border-slate-200 shadow-inner">
          <div className="flex items-center gap-2 mb-4">
             <Quote className="w-5 h-5 text-indigo-600 fill-indigo-600" />
             <h3 className="font-bold text-slate-900">Recommended Reply</h3>
          </div>
          
          <div className="bg-white p-5 rounded-xl border border-slate-200 text-slate-800 text-lg font-medium mb-5 shadow-sm">
             "{result.summary}"
          </div>
          
          <button 
            onClick={handleShare}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl font-bold transition-all hover:shadow-xl active:scale-95"
          >
            <Share2 className="w-5 h-5" />
            Share Correction
          </button>
        </div>

      </div>
    </div>
  );
};

export default ResultCard;
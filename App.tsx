import React, { useState, useEffect } from 'react';
import { ViewState, VerificationResult, DEMO_EXAMPLES } from './types';
import { verifyText, generateSummary, performOCR } from './services/geminiService';
import ResultCard from './components/ResultCard';
import { ShieldCheck, Image as ImageIcon, FileText, Link as LinkIcon, AlertOctagon, Upload, Loader2, Home, ChevronLeft, ExternalLink, ArrowRight, Search, Globe, Sparkles, Brain } from 'lucide-react';

// Enhanced Loading Component
const VerificationLoader = ({ mode }: { mode: 'text' | 'image' }) => {
  const [msgIndex, setMsgIndex] = useState(0);
  const messages = [
    mode === 'text' ? "Analyzing linguistic patterns..." : "Scanning image for text...",
    "Querying trusted knowledge bases...",
    "Cross-referencing official sources...",
    "Synthesizing final verdict..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % messages.length);
    }, 1200);
    return () => clearInterval(interval);
  }, [mode]);

  return (
    <div className="w-full mt-8 bg-white rounded-2xl shadow-xl border border-indigo-100 p-12 flex flex-col items-center justify-center animate-fade-in-up">
      {/* Animated Visuals */}
      <div className="relative w-24 h-24 mb-8">
        {/* Outer pulsing ring */}
        <div className="absolute inset-0 border-4 border-indigo-100 rounded-full animate-ping opacity-20"></div>
        {/* Static ring */}
        <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
        {/* Spinning segment */}
        <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
        
        {/* Center Icon */}
        <div className="absolute inset-0 flex items-center justify-center bg-white rounded-full m-2 shadow-inner">
          {mode === 'text' ? (
             <Brain className="w-8 h-8 text-indigo-600 animate-pulse" />
          ) : (
             <Sparkles className="w-8 h-8 text-indigo-600 animate-pulse" />
          )}
        </div>
      </div>

      <h3 className="text-xl font-black text-slate-900 mb-3 tracking-tight">AI Verification in Progress</h3>
      
      {/* Status Pill */}
      <div className="bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100 flex items-center gap-3">
        <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
        <span className="text-indigo-700 font-bold font-mono text-sm min-w-[200px] text-center">
          {messages[msgIndex]}
        </span>
      </div>
    </div>
  );
};

function App() {
  const [view, setView] = useState<ViewState>('home');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [inputText, setInputText] = useState('');

  // Handle Text Verification
  const handleVerify = async (text: string) => {
    if (!text.trim()) return;
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // 1. Verify
      const verification = await verifyText(text);
      // 2. Summarize (Gemma 2B equivalent step)
      const summary = await generateSummary(verification.explanation, verification.verdict);
      
      setResult({ ...verification, summary });
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Image Upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // Convert to Base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove Data URL prefix for API
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // 1. OCR
      const extractedText = await performOCR(base64, file.type);
      setInputText(extractedText); // Show user what was extracted

      if (!extractedText.trim()) {
        throw new Error("Could not detect legible text in the image.");
      }

      // 2. Verify extracted text
      const verification = await verifyText(extractedText);
      // 3. Summarize
      const summary = await generateSummary(verification.explanation, verification.verdict);

      setResult({ ...verification, summary });

    } catch (err: any) {
      setError(err.message || "Failed to process image.");
    } finally {
      setIsLoading(false);
    }
  };

  // Navigation Helper
  const goHome = () => {
    setView('home');
    setResult(null);
    setInputText('');
    setError(null);
    setIsLoading(false);
  };

  // --- Views ---

  const renderHome = () => (
    <div className="flex flex-col items-center w-full">
      {/* Hero Section */}
      <div className="w-full bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-950 text-white pt-20 pb-28 px-4 text-center rounded-b-[3rem] shadow-2xl mb-12 relative overflow-hidden">
        {/* Abstract shapes */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
        
        <div className="max-w-4xl mx-auto space-y-8 relative z-10 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/80 border border-slate-600 backdrop-blur-md text-blue-200 text-xs font-bold tracking-wider uppercase mb-2 shadow-lg">
            <Globe className="w-3 h-3 text-blue-400" />
            AI Fact-Checking Engine
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight drop-shadow-lg">
            Verify the <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Truth</span><br/> 
            Before You Forward
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto font-medium leading-relaxed">
            Don't be fooled by misinformation. Instantly check WhatsApp forwards and screenshots against trusted global sources.
          </p>
        </div>
      </div>

      {/* Action Cards floating overlap */}
      <div className="max-w-5xl w-full px-4 -mt-24 z-20 grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <button onClick={() => setView('text')} className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 hover:border-indigo-500 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group text-left relative overflow-hidden">
          <div className="absolute right-0 top-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
            <FileText className="w-40 h-40 text-indigo-600" />
          </div>
          <div className="bg-indigo-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 transition-colors shadow-sm">
            <FileText className="w-8 h-8 text-indigo-600 group-hover:text-white transition-colors" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2 group-hover:text-indigo-700 transition-colors">Verify Text</h3>
          <p className="text-slate-600 text-base font-medium leading-relaxed">Paste a suspicious message or URL to cross-check with official databases.</p>
          <div className="mt-8 flex items-center text-indigo-600 font-bold text-sm group-hover:underline uppercase tracking-wide">
            Start Verification <ArrowRight className="w-4 h-4 ml-2" />
          </div>
        </button>

        <button onClick={() => setView('screenshot')} className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 hover:border-blue-500 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group text-left relative overflow-hidden">
          <div className="absolute right-0 top-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
            <ImageIcon className="w-40 h-40 text-blue-600" />
          </div>
          <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors shadow-sm">
            <ImageIcon className="w-8 h-8 text-blue-600 group-hover:text-white transition-colors" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2 group-hover:text-blue-700 transition-colors">Verify Screenshot</h3>
          <p className="text-slate-600 text-base font-medium leading-relaxed">Upload an image of a news clipping, tweet, or chat to extract and verify.</p>
          <div className="mt-8 flex items-center text-blue-600 font-bold text-sm group-hover:underline uppercase tracking-wide">
            Upload Image <ArrowRight className="w-4 h-4 ml-2" />
          </div>
        </button>
      </div>

      {/* How it works */}
      <div className="w-full max-w-6xl px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">How It Works</h2>
          <div className="h-1.5 w-20 bg-indigo-600 mx-auto rounded-full"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          <div className="flex flex-col items-center group">
            <div className="w-20 h-20 bg-white rounded-full shadow-lg border-2 border-slate-100 flex items-center justify-center text-2xl font-bold text-slate-300 mb-6 group-hover:border-indigo-500 group-hover:text-indigo-600 transition-colors">1</div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Input Data</h3>
            <p className="text-slate-600 leading-relaxed px-4">Paste text or upload a screenshot. Our advanced OCR technology extracts information instantly.</p>
          </div>
          <div className="flex flex-col items-center group">
             <div className="w-20 h-20 bg-white rounded-full shadow-lg border-2 border-slate-100 flex items-center justify-center text-2xl font-bold text-slate-300 mb-6 group-hover:border-indigo-500 group-hover:text-indigo-600 transition-colors">2</div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Deep Analysis</h3>
            <p className="text-slate-600 leading-relaxed px-4">Gemini 3 Pro cross-references the claim with Google Search and verified datasets.</p>
          </div>
          <div className="flex flex-col items-center group">
             <div className="w-20 h-20 bg-white rounded-full shadow-lg border-2 border-slate-100 flex items-center justify-center text-2xl font-bold text-slate-300 mb-6 group-hover:border-indigo-500 group-hover:text-indigo-600 transition-colors">3</div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Clear Verdict</h3>
            <p className="text-slate-600 leading-relaxed px-4">Receive a definitive True/False verdict, detailed explanation, and shareable summary.</p>
          </div>
        </div>
      </div>

      {/* Secondary Nav */}
      <div className="flex flex-wrap justify-center gap-4 mb-20 px-4">
        <button onClick={() => setView('demo')} className="px-8 py-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm flex items-center gap-3">
          <AlertOctagon className="w-5 h-5 text-orange-500" /> 
          Try Demo Examples
        </button>
        <button onClick={() => setView('sources')} className="px-8 py-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm flex items-center gap-3">
          <LinkIcon className="w-5 h-5 text-blue-500" /> 
          View Official Sources
        </button>
      </div>
    </div>
  );

  const renderVerifyText = () => (
    <div className="w-full max-w-3xl mx-auto space-y-8 animate-fade-in-up">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-black text-slate-900 tracking-tight">Verify Text</h2>
        <p className="text-slate-600 mt-3 text-lg font-medium">Paste a message to check its accuracy.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500"></div>
        <div className="p-6 md:p-8">
          <textarea 
            className="w-full h-48 p-5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 resize-none text-slate-900 placeholder-slate-400 text-lg leading-relaxed transition-all font-medium disabled:bg-slate-100 disabled:text-slate-400"
            placeholder="e.g. 'Forwarded many times: NASA just announced the sun turned green...'"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading}
          />
          <div className="mt-6 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-sm text-slate-500 font-bold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> 
              Secure & Private Analysis
            </p>
            <button 
              disabled={isLoading || !inputText.trim()}
              onClick={() => handleVerify(inputText)}
              className="w-full md:w-auto flex items-center justify-center gap-3 bg-slate-900 hover:bg-indigo-600 disabled:bg-slate-300 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-indigo-200 transform active:scale-[0.98]"
            >
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Search className="w-6 h-6" />}
              {isLoading ? 'Processing...' : 'Verify Now'}
            </button>
          </div>
        </div>
      </div>
      
      {isLoading && <VerificationLoader mode="text" />}
      
      {!isLoading && error && <div className="p-6 bg-red-50 text-red-900 rounded-xl border border-red-200 font-bold flex items-center gap-3 shadow-sm animate-fade-in-up"><AlertOctagon className="w-6 h-6 shrink-0 text-red-600"/> {error}</div>}
      {!isLoading && result && <ResultCard result={result} />}
    </div>
  );

  const renderVerifyImage = () => (
    <div className="w-full max-w-3xl mx-auto space-y-8 animate-fade-in-up">
       <div className="text-center mb-8">
        <h2 className="text-4xl font-black text-slate-900 tracking-tight">Verify Screenshot</h2>
        <p className="text-slate-600 mt-3 text-lg font-medium">Upload a news clipping or chat screenshot.</p>
      </div>

      {!isLoading ? (
        <div className="bg-white rounded-3xl shadow-xl border-2 border-dashed border-slate-300 p-10 md:p-14 text-center hover:border-blue-500 hover:bg-blue-50/30 transition-all relative group cursor-pointer animate-fade-in-up">
          <input 
            type="file" 
            accept="image/*"
            onChange={handleImageUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div className="flex flex-col items-center pointer-events-none transition-transform group-hover:scale-105 duration-300">
            <div className="bg-blue-100 p-6 rounded-2xl mb-6 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-sm">
              <Upload className="w-12 h-12" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Click to Upload Image</h3>
            <p className="text-slate-500 font-medium text-lg">or drag and drop here</p>
            <p className="text-slate-400 text-sm mt-6 bg-slate-100 px-3 py-1 rounded-full">Supports JPG, PNG (Max 5MB)</p>
          </div>
        </div>
      ) : (
        <VerificationLoader mode="image" />
      )}

      {inputText && !isLoading && !result && (
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 animate-fade-in-up">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-5 h-5 text-indigo-500" />
            <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">Extracted Text Content</span>
          </div>
          <p className="text-slate-800 italic leading-relaxed text-lg font-medium border-l-4 border-indigo-200 pl-4">"{inputText}"</p>
        </div>
      )}

      {!isLoading && error && <div className="p-6 bg-red-50 text-red-900 rounded-xl border border-red-200 font-bold flex items-center gap-3 shadow-sm animate-fade-in-up"><AlertOctagon className="w-6 h-6 shrink-0 text-red-600"/> {error}</div>}
      {!isLoading && result && <ResultCard result={result} />}
    </div>
  );

  const renderDemo = () => (
    <div className="w-full max-w-5xl mx-auto animate-fade-in-up">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-black text-slate-900">See It In Action</h2>
        <p className="text-slate-600 mt-2 text-lg">Click any example to run a live verification.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {DEMO_EXAMPLES.map((ex) => (
          <div key={ex.id} className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 hover:shadow-2xl hover:-translate-y-2 transition-all flex flex-col h-full relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-2 bg-slate-200 group-hover:bg-indigo-500 transition-colors"></div>
            <h3 className="font-bold text-xl text-slate-900 mb-4">{ex.title}</h3>
            <div className="flex-grow bg-slate-50 p-5 rounded-2xl mb-8 border border-slate-100">
              <p className="text-slate-700 text-base leading-relaxed italic font-medium">"{ex.text}"</p>
            </div>
            <button 
              onClick={() => {
                setInputText(ex.text);
                setView('text');
                handleVerify(ex.text);
              }}
              className="w-full py-4 bg-white border-2 border-slate-200 hover:border-indigo-600 hover:bg-indigo-600 hover:text-white text-slate-700 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              Verify This <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSources = () => (
    <div className="w-full max-w-4xl mx-auto animate-fade-in-up">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-10 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-3xl font-black text-slate-900 flex items-center gap-4">
            <ShieldCheck className="w-10 h-10 text-indigo-600" /> Official Sources
          </h2>
          <p className="text-slate-600 mt-3 text-lg">We strictly cross-reference claims against these trusted global databases.</p>
        </div>
        
        <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { name: "Reserve Bank of India (RBI)", url: "https://www.rbi.org.in/", desc: "Financial regulations & currency updates" },
            { name: "PIB Fact Check", url: "https://pib.gov.in/", desc: "Government of India official fact checker" },
            { name: "World Health Organization", url: "https://www.who.int/", desc: "Global health alerts & medical data" },
            { name: "Indian Railways", url: "https://indianrailways.gov.in/", desc: "Train schedules & official announcements" },
            { name: "BBC News", url: "https://www.bbc.com/news", desc: "International news verification" },
            { name: "Google Fact Check Explorer", url: "https://toolbox.google.com/factcheck/explorer", desc: "Global database of verified claims" },
          ].map((source) => (
            <a 
              key={source.url} 
              href={source.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-start gap-4 p-5 rounded-2xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/30 hover:shadow-md transition-all group"
            >
              <div className="bg-white p-3 rounded-xl border border-slate-100 group-hover:border-indigo-200 transition-colors">
                <ExternalLink className="w-6 h-6 text-slate-400 group-hover:text-indigo-600" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors text-lg">{source.name}</h4>
                <p className="text-sm text-slate-500 mt-1 font-medium">{source.desc}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50">
      {/* Navbar */}
      {view !== 'home' && (
        <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
            <div 
              onClick={goHome} 
              className="flex items-center gap-3 cursor-pointer select-none group"
            >
              <div className="bg-indigo-600 p-2 rounded-xl group-hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
                 <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <span className="font-black text-2xl text-slate-900 tracking-tight">Verifier</span>
            </div>
            
            <button 
              onClick={goHome} 
              className="px-5 py-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl flex items-center gap-2 text-sm font-bold transition-all"
            >
              <Home className="w-4 h-4" /> Dashboard
            </button>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className={`flex-grow ${view === 'home' ? '' : 'p-4 md:p-8'}`}>
        <div className={`mx-auto ${view === 'home' ? '' : 'max-w-6xl'}`}>
          {view !== 'home' && (
            <button onClick={goHome} className="mb-8 flex items-center text-slate-500 hover:text-indigo-600 text-sm font-bold transition-colors group">
              <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
            </button>
          )}

          {view === 'home' && renderHome()}
          {view === 'text' && renderVerifyText()}
          {view === 'screenshot' && renderVerifyImage()}
          {view === 'demo' && renderDemo()}
          {view === 'sources' && renderSources()}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white py-12 border-t border-slate-200 mt-auto">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-7 h-7 text-indigo-600" />
            <span className="font-black text-xl text-slate-900 tracking-tight">Fake-Forward Verifier</span>
          </div>
          <div className="text-center md:text-right">
            <p className="text-slate-600 text-sm font-bold">
              Powered by <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Google Gemini 3 Pro</span>
            </p>
            <p className="text-slate-400 text-xs mt-2 max-w-md font-medium leading-relaxed">
              This tool uses AI to verify claims. While accurate, it may not catch every nuance. Always consult official sources for critical medical or financial decisions.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
import React from 'react';
import { 
  FileText, 
  Target, 
  Briefcase, 
  BarChart3, 
  ChevronRight,
  Plus,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  Globe,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utils ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
type Section = 'resume' | 'match' | 'crm' | 'insights';

interface ResumeData {
  suggestedRoles: string[];
  skills: string[];
  tools: string[];
  experienceSummary: string;
  atsScore: number;
  atsAnalysis: {
    keywordDensity: string;
    quantificationStrength: string;
    formattingClarity: string;
    actionVerbStrength: string;
    alignmentPotential: string;
  };
  classification: string;
  missingElements: string[];
  recommendations: string[];
}

interface MatchData {
  matchPercentage: number;
  category: string;
  missingSkills: string[];
  seniorityMismatch: boolean;
  requiredKeywordsMissing: string[];
  atsCompatibility: string;
}

interface TailoredData {
  tailoredSummary: string;
  optimizedBullets: string[];
  reorderedSkills: string[];
  coverLetter: string;
}

interface Application {
  id: number;
  company: string;
  role: string;
  country: string;
  visa_sponsorship: string;
  match_score: number;
  match_category: string;
  date_applied: string;
  status: string;
  notes: string;
}

// --- Components ---

const Card = ({ children, className, title }: { children: React.ReactNode; className?: string; title?: string }) => (
  <div className={cn("bg-white rounded-3xl p-6 shadow-sm border border-black/5", className)}>
    {title && <h3 className="text-lg font-semibold mb-4 text-slate-800">{title}</h3>}
    {children}
  </div>
);

const Badge = ({ children, variant = 'default', ...props }: { children: React.ReactNode; variant?: 'default' | 'success' | 'warning' | 'error'; [key: string]: any }) => {
  const variants = {
    default: "bg-slate-100 text-slate-600",
    success: "bg-emerald-50 text-emerald-600 border border-emerald-100",
    warning: "bg-amber-50 text-amber-600 border border-amber-100",
    error: "bg-rose-50 text-rose-600 border border-rose-100",
  };
  return (
    <span className={cn("px-3 py-1 rounded-full text-xs font-medium", variants[variant])} {...props}>
      {children}
    </span>
  );
};

const Spinner = ({ className }: { className?: string }) => (
  <svg className={cn("animate-spin", className)} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export default function App() {
  const [activeSection, setActiveSection] = React.useState<Section>('resume');
  const [resumeText, setResumeText] = React.useState<string>('');
  const [resumeData, setResumeData] = React.useState<ResumeData | null>(null);
  const [isParsing, setIsParsing] = React.useState(false);
  
  const [jobDescription, setJobDescription] = React.useState('');
  const [matchData, setMatchData] = React.useState<MatchData | null>(null);
  const [isMatching, setIsMatching] = React.useState(false);
  
  const [tailoredData, setTailoredData] = React.useState<TailoredData | null>(null);
  const [isTailoring, setIsTailoring] = React.useState(false);

  const [applications, setApplications] = React.useState<Application[]>([]);
  const [isLoadingApps, setIsLoadingApps] = React.useState(true);
  const [isLogging, setIsLogging] = React.useState(false);

  const [insights, setInsights] = React.useState<string | null>(null);
  const [isGeneratingInsights, setIsGeneratingInsights] = React.useState(false);

  // Load applications
  React.useEffect(() => {
    fetch('/api/applications')
      .then(res => res.json())
      .then(data => {
        setApplications(data);
        setIsLoadingApps(false);
      });
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    const formData = new FormData();
    formData.append('resume', file);

    try {
      const parseRes = await fetch('/api/resume/parse', { method: 'POST', body: formData });
      if (!parseRes.ok) {
        const errorData = await parseRes.json();
        throw new Error(errorData.error || 'Failed to parse resume');
      }
      const { text } = await parseRes.json();
      setResumeText(text);

      if (!process.env.GEMINI_API_KEY) {
        throw new Error('Gemini API Key is missing. Please add it to your secrets.');
      }

      // Analyze with Gemini
      const { analyzeResume } = await import('./lib/gemini');
      const analysis = await analyzeResume(text);
      setResumeData(analysis);
    } catch (err: any) {
      console.error("Resume Analysis Error:", err);
      alert(err.message || "An error occurred during resume analysis.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleMatch = async () => {
    if (!resumeData || !jobDescription) return;
    setIsMatching(true);
    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error('Gemini API Key is missing. Please add it to your secrets.');
      }
      const { matchJob } = await import('./lib/gemini');
      const match = await matchJob(resumeData, jobDescription);
      setMatchData(match);
    } catch (err: any) {
      console.error("Match Error:", err);
      alert(err.message || "An error occurred during job matching.");
    } finally {
      setIsMatching(false);
    }
  };

  const handleTailor = async () => {
    if (!resumeText || !jobDescription) return;
    setIsTailoring(true);
    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error('Gemini API Key is missing. Please add it to your secrets.');
      }
      const { tailorApplication } = await import('./lib/gemini');
      const tailored = await tailorApplication(resumeText, jobDescription);
      setTailoredData(tailored);
    } catch (err: any) {
      console.error("Tailoring Error:", err);
      alert(err.message || "An error occurred during tailoring.");
    } finally {
      setIsTailoring(false);
    }
  };

  const logApplication = async (country: string, visa: string) => {
    if (!matchData) return;
    setIsLogging(true);
    try {
      const appData = {
        company: "New Company", // Ideally extracted from JD
        role: resumeData?.suggestedRoles[0] || "Role",
        country,
        visa_sponsorship: visa,
        match_score: matchData.matchPercentage,
        match_category: matchData.category,
        date_applied: new Date().toISOString().split('T')[0],
        notes: ""
      };
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appData)
      });
      const newApp = await res.json();
      setApplications([{ ...appData, id: newApp.id, status: 'Applied' }, ...applications]);
      setActiveSection('crm');
    } catch (err) {
      console.error(err);
    } finally {
      setIsLogging(false);
    }
  };

  const handleGenerateInsights = async () => {
    setIsGeneratingInsights(true);
    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error('Gemini API Key is missing. Please add it to your secrets.');
      }
      const { generateWeeklyReport } = await import('./lib/gemini');
      const report = await generateWeeklyReport(applications);
      setInsights(report);
    } catch (err: any) {
      console.error("Insights Error:", err);
      alert(err.message || "An error occurred during insights generation.");
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  const downloadFile = async (type: 'pdf' | 'docx', content: 'resume' | 'cover') => {
    if (!tailoredData) return;
    const { generatePdf, generateDocx } = await import('./lib/generators');
    const data = content === 'resume' 
      ? { title: "Tailored Resume", body: tailoredData.optimizedBullets.join('\n') + '\n\n' + tailoredData.tailoredSummary }
      : { title: "Tailored Cover Letter", body: tailoredData.coverLetter };
    
    if (type === 'pdf') generatePdf(data);
    else generateDocx(data);
  };

  return (
    <div className="flex h-screen bg-[#FDFDFF] text-slate-900 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 border-r border-black/5 flex flex-col p-6 bg-white/50 backdrop-blur-xl">
        <div className="flex items-center gap-3 mb-12 px-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#A7D8F5] to-[#F8C8DC] flex items-center justify-center shadow-sm">
            <ShieldCheck className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">SkyApply AI</h1>
        </div>

        <nav className="space-y-2 flex-1">
          {[
            { id: 'resume', icon: FileText, label: 'Resume Analysis' },
            { id: 'match', icon: Target, label: 'Job Match' },
            { id: 'crm', icon: Briefcase, label: 'Applications' },
            { id: 'insights', icon: BarChart3, label: 'Insights' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id as Section)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200",
                activeSection === item.id 
                  ? "bg-[#A7D8F5]/20 text-[#4A90E2] shadow-sm" 
                  : "text-slate-500 hover:bg-slate-50"
              )}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto p-4 bg-gradient-to-br from-[#A7D8F5]/10 to-[#F8C8DC]/10 rounded-2xl border border-white">
          <p className="text-xs text-slate-500 leading-relaxed">
            Optimizing your career path with precision AI.
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-12">
        <div className="max-w-5xl mx-auto">
          <AnimatePresence mode="wait">
            {activeSection === 'resume' && (
              <motion.div
                key="resume"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <header>
                  <h2 className="text-3xl font-bold text-slate-800 mb-2">Resume Intelligence</h2>
                  <p className="text-slate-500">Upload your resume to unlock deep ATS insights and role suggestions.</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <Card className="lg:col-span-2 border-dashed border-2 border-[#A7D8F5]/50 bg-[#A7D8F5]/5">
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-4">
                        <Plus className="text-[#A7D8F5]" />
                      </div>
                      <h4 className="font-semibold mb-1">Upload Resume</h4>
                      <p className="text-sm text-slate-400 mb-6">PDF, DOCX, or Images supported</p>
                      <input 
                        type="file" 
                        onChange={handleFileUpload} 
                        className="hidden" 
                        id="resume-upload"
                        accept=".pdf,.docx,.jpg,.jpeg,.png"
                      />
                      <label 
                        htmlFor="resume-upload"
                        className={cn(
                          "px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 cursor-pointer transition-colors shadow-sm flex items-center justify-center",
                          isParsing && "opacity-70 cursor-not-allowed"
                        )}
                      >
                        {isParsing ? <><Spinner className="w-4 h-4 mr-2" /> Processing...</> : 'Choose File'}
                      </label>
                    </div>
                  </Card>

                  {resumeData && (
                    <Card title="ATS Score" className="flex flex-col items-center justify-center text-center">
                      <div className="relative w-32 h-32 flex items-center justify-center mb-4">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle
                            cx="64" cy="64" r="58"
                            stroke="currentColor" strokeWidth="8"
                            fill="transparent"
                            className="text-slate-100"
                          />
                          <circle
                            cx="64" cy="64" r="58"
                            stroke="currentColor" strokeWidth="8"
                            fill="transparent"
                            strokeDasharray={364}
                            strokeDashoffset={364 - (364 * resumeData.atsScore) / 100}
                            className="text-[#A7D8F5]"
                          />
                        </svg>
                        <span className="absolute text-3xl font-bold">{resumeData.atsScore}</span>
                      </div>
                      <Badge variant={resumeData.atsScore > 80 ? 'success' : 'warning'}>
                        {resumeData.classification}
                      </Badge>
                    </Card>
                  )}
                </div>

                {resumeData && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Card title="Suggested Roles">
                      <div className="flex flex-wrap gap-2">
                        {resumeData.suggestedRoles.map(role => (
                          <Badge key={role}>{role}</Badge>
                        ))}
                      </div>
                    </Card>
                    <Card title="Top Skills">
                      <div className="flex flex-wrap gap-2">
                        {resumeData.skills.slice(0, 10).map(skill => (
                          <Badge key={skill} variant="default">{skill}</Badge>
                        ))}
                      </div>
                    </Card>
                    <Card title="ATS Breakdown" className="md:col-span-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Object.entries(resumeData.atsAnalysis).map(([key, val]) => (
                          <div key={key} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                            <p className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">
                              {key.replace(/([A-Z])/g, ' $1')}
                            </p>
                            <p className="text-sm font-medium text-slate-700">{val}</p>
                          </div>
                        ))}
                      </div>
                    </Card>
                    <Card title="Recommendations" className="md:col-span-2">
                      <ul className="space-y-3">
                        {resumeData.recommendations.map((rec, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                            <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={16} />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </Card>
                  </div>
                )}
              </motion.div>
            )}

            {activeSection === 'match' && (
              <motion.div
                key="match"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <header>
                  <h2 className="text-3xl font-bold text-slate-800 mb-2">Job Match Engine</h2>
                  <p className="text-slate-500">Paste a job description to see how well you align and generate tailored assets.</p>
                </header>

                <Card>
                  <textarea
                    placeholder="Paste the full job description here..."
                    className="w-full h-64 p-6 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-[#A7D8F5]/50 transition-all resize-none text-sm"
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                  />
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={handleMatch}
                      disabled={isMatching || !jobDescription || !resumeData}
                      className="px-8 py-3 bg-[#A7D8F5] text-white rounded-2xl font-semibold shadow-lg shadow-[#A7D8F5]/30 hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center"
                    >
                      {isMatching ? <><Spinner className="w-5 h-5 mr-2" /> Analyzing Match...</> : 'Check Match'}
                    </button>
                  </div>
                </Card>

                {matchData && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <Card className="lg:col-span-1 flex flex-col items-center justify-center text-center">
                      <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Match Result</h4>
                      <div className="text-5xl font-black text-slate-800 mb-2">{matchData.matchPercentage}%</div>
                      <Badge variant={matchData.category.includes('Great') ? 'success' : matchData.category.includes('Good') ? 'warning' : 'error'}>
                        {matchData.category}
                      </Badge>
                    </Card>
                    
                    <Card title="Missing Requirements" className="lg:col-span-2">
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase mb-2">Missing Skills</p>
                          <div className="flex flex-wrap gap-2">
                            {matchData.missingSkills.map(s => <Badge key={s} variant="error">{s}</Badge>)}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase mb-2">Missing Keywords</p>
                          <div className="flex flex-wrap gap-2">
                            {matchData.requiredKeywordsMissing.map(k => <Badge key={k} variant="warning">{k}</Badge>)}
                          </div>
                        </div>
                      </div>
                    </Card>

                    <Card title="Tailoring Options" className="lg:col-span-3 bg-gradient-to-br from-[#A7D8F5]/5 to-[#F8C8DC]/5">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold mb-1">Optimize Application</h4>
                          <p className="text-sm text-slate-500">Generate a tailored resume and cover letter for this specific role.</p>
                        </div>
                        <button
                          onClick={handleTailor}
                          disabled={isTailoring}
                          className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm flex items-center justify-center disabled:opacity-50"
                        >
                          {isTailoring ? <><Spinner className="w-4 h-4 mr-2" /> Tailoring...</> : 'Generate Tailored Assets'}
                        </button>
                      </div>
                    </Card>
                  </div>
                )}

                {tailoredData && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <Card title="Tailored Summary">
                        <p className="text-sm text-slate-600 leading-relaxed italic">"{tailoredData.tailoredSummary}"</p>
                      </Card>
                      <Card title="Optimized Bullets">
                        <ul className="space-y-3">
                          {tailoredData.optimizedBullets.map((b, i) => (
                            <li key={i} className="text-sm text-slate-600 flex gap-2">
                              <span className="text-[#A7D8F5]">•</span> {b}
                            </li>
                          ))}
                        </ul>
                      </Card>
                    </div>
                    <Card title="Cover Letter Preview">
                      <div className="p-6 bg-slate-50 rounded-2xl text-sm text-slate-600 whitespace-pre-wrap font-mono">
                        {tailoredData.coverLetter}
                      </div>
                    </Card>
                    <div className="flex flex-wrap gap-4 justify-center">
                      <button onClick={() => downloadFile('pdf', 'resume')} className="flex items-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-2xl text-sm font-medium hover:bg-slate-700 transition-all">
                        <Download size={16} /> Resume (PDF)
                      </button>
                      <button onClick={() => downloadFile('docx', 'resume')} className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium hover:bg-slate-50 transition-all">
                        <Download size={16} /> Resume (DOCX)
                      </button>
                      <button onClick={() => downloadFile('pdf', 'cover')} className="flex items-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-2xl text-sm font-medium hover:bg-slate-700 transition-all">
                        <Download size={16} /> Cover Letter (PDF)
                      </button>
                      <button onClick={() => downloadFile('docx', 'cover')} className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium hover:bg-slate-50 transition-all">
                        <Download size={16} /> Cover Letter (DOCX)
                      </button>
                    </div>

                    <Card title="Log Application" className="border-2 border-[#A7D8F5]">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Country</label>
                          <select id="country-select" className="w-full p-3 rounded-xl bg-slate-50 border border-slate-100 text-sm">
                            <option>India</option>
                            <option>Germany</option>
                            <option>USA</option>
                            <option>UK</option>
                            <option>Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Visa Sponsorship</label>
                          <select id="visa-select" className="w-full p-3 rounded-xl bg-slate-50 border border-slate-100 text-sm">
                            <option>Not Required</option>
                            <option>Required</option>
                            <option>Already Have</option>
                          </select>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          const country = (document.getElementById('country-select') as HTMLSelectElement).value;
                          const visa = (document.getElementById('visa-select') as HTMLSelectElement).value;
                          logApplication(country, visa);
                        }}
                        disabled={isLogging}
                        className="w-full py-3 bg-[#A7D8F5] text-white rounded-2xl font-bold hover:opacity-90 transition-all flex items-center justify-center disabled:opacity-50"
                      >
                        {isLogging ? <><Spinner className="w-5 h-5 mr-2" /> Logging...</> : 'Confirm Application Log'}
                      </button>
                    </Card>
                  </motion.div>
                )}
              </motion.div>
            )}

            {activeSection === 'crm' && (
              <motion.div
                key="crm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <header className="flex justify-between items-end">
                  <div>
                    <h2 className="text-3xl font-bold text-slate-800 mb-2">Application CRM</h2>
                    <p className="text-slate-500">Track and manage your career journey.</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-400 uppercase">Total</p>
                      <p className="text-2xl font-bold">{applications.length}</p>
                    </div>
                  </div>
                </header>

                <Card className="overflow-hidden p-0">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Company & Role</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Match</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Location</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Status</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {applications.map((app) => (
                        <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-semibold text-slate-800">{app.company}</p>
                            <p className="text-xs text-slate-500">{app.role}</p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{app.match_score}%</span>
                              <div className={cn(
                                "w-2 h-2 rounded-full",
                                app.match_category.includes('Great') ? 'bg-emerald-400' : app.match_category.includes('Good') ? 'bg-amber-400' : 'bg-rose-400'
                              )} />
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 text-sm text-slate-600">
                              <Globe size={14} />
                              {app.country}
                            </div>
                            <p className="text-[10px] text-slate-400">{app.visa_sponsorship}</p>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant={app.status === 'Applied' ? 'default' : app.status === 'Interview' ? 'success' : 'error'}>
                              {app.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500">
                            {app.date_applied}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {isLoadingApps ? (
                    <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center">
                      <Spinner className="w-8 h-8 mb-4 text-[#A7D8F5]" />
                      <p>Loading applications...</p>
                    </div>
                  ) : applications.length === 0 ? (
                    <div className="py-20 text-center text-slate-400">
                      <Briefcase className="mx-auto mb-4 opacity-20" size={48} />
                      <p>No applications logged yet.</p>
                    </div>
                  ) : null}
                </Card>
              </motion.div>
            )}

            {activeSection === 'insights' && (
              <motion.div
                key="insights"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <header>
                  <h2 className="text-3xl font-bold text-slate-800 mb-2">Strategic Intelligence</h2>
                  <p className="text-slate-500">AI-driven analysis of your application patterns and performance.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <Card className="bg-gradient-to-br from-[#A7D8F5]/20 to-transparent">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Avg Match Score</p>
                    <p className="text-3xl font-bold text-slate-800">
                      {applications.length > 0 
                        ? Math.round(applications.reduce((acc, curr) => acc + curr.match_score, 0) / applications.length)
                        : 0}%
                    </p>
                  </Card>
                  <Card className="bg-gradient-to-br from-[#F8C8DC]/20 to-transparent">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Top Country</p>
                    <p className="text-3xl font-bold text-slate-800">
                      {applications.length > 0 
                        ? applications.reduce((acc, curr) => {
                            acc[curr.country] = (acc[curr.country] || 0) + 1;
                            return acc;
                          }, {} as any)[Object.keys(applications.reduce((acc, curr) => {
                            acc[curr.country] = (acc[curr.country] || 0) + 1;
                            return acc;
                          }, {} as any)).sort((a, b) => (applications.reduce((acc, curr) => {
                            acc[curr.country] = (acc[curr.country] || 0) + 1;
                            return acc;
                          }, {} as any)[b] - applications.reduce((acc, curr) => {
                            acc[curr.country] = (acc[curr.country] || 0) + 1;
                            return acc;
                          }, {} as any)[a]))[0]] || 'N/A'
                        : 'N/A'}
                    </p>
                  </Card>
                  <Card>
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Success Rate</p>
                    <p className="text-3xl font-bold text-slate-800">0%</p>
                  </Card>
                </div>

                <Card className="relative overflow-hidden">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-lg font-semibold">Weekly AI Report</h3>
                    <button
                      onClick={handleGenerateInsights}
                      disabled={isGeneratingInsights || applications.length === 0}
                      className="px-6 py-2 bg-[#A7D8F5] text-white rounded-xl text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center"
                    >
                      {isGeneratingInsights ? <><Spinner className="w-4 h-4 mr-2" /> Analyzing...</> : 'Generate Report'}
                    </button>
                  </div>

                  {insights ? (
                    <div className="prose prose-slate max-w-none text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                      {insights}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-400 border-2 border-dashed border-slate-100 rounded-3xl">
                      <BarChart3 className="mx-auto mb-4 opacity-20" size={48} />
                      <p>Generate a report to see strategic insights.</p>
                    </div>
                  )}
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

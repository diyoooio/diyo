import React, { useState, useEffect, useRef } from 'react';
import { useStorage } from './StorageContext';
import { 
  Briefcase, 
  Download, 
  Upload, 
  MessageSquare, 
  CreditCard, 
  LifeBuoy, 
  User as UserIcon, 
  LogOut, 
  Send, 
  CheckCircle, 
  Clock, 
  FileText, 
  Sparkles, 
  Paperclip,
  Check,
  AlertTriangle,
  Info,
  Calendar,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Project, Deliverable, Ticket, Invoice, Message } from '../types';
import { downloadInvoicePDF } from '../utils/pdfGenerator';

export const ClientDashboard: React.FC = () => {
  const { 
    currentUser, 
    projects, 
    messages, 
    addMessage, 
    tickets, 
    addTicket, 
    addTicketReply,
    invoices, 
    payInvoice,
    updateUserProfile,
    setViews,
    logoutClient,
    clients,
    logActivity
  } = useStorage();

  const [activeTab, setActiveTab] = useState<'project' | 'chat' | 'invoices' | 'tickets' | 'profile'>('project');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [proposalViewed, setProposalViewed] = useState(() => {
    return localStorage.getItem(`diyo_proposal_viewed_${currentUser?.email}`) === 'true';
  });
  const [termsAccepted, setTermsAccepted] = useState(() => {
    return localStorage.getItem(`diyo_terms_accepted_${currentUser?.email}`) === 'true';
  });

  // File uploading simulator
  const [uploadedFiles, setUploadedFiles] = useState<{name: string, size: string, date: string}[]>([
    { name: 'Diyo_Branding_Brief_v1.0.pdf', size: '2.4 MB', date: '2 days ago' },
    { name: 'Wireframes_Aura_Product.fig', size: '15.1 MB', date: '5 days ago' }
  ]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Chat simulator
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Ticket creation
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketSeverity, setTicketSeverity] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [ticketDesc, setTicketDesc] = useState('');
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [ticketReplyInput, setTicketReplyInput] = useState('');

  // Derive matched customer record from memory
  const matchedClient = clients.find(c => c.email.toLowerCase() === (currentUser?.email || '').toLowerCase());

  // Profile Edit fields
  const [profileName, setProfileName] = useState(currentUser?.name || '');
  const [profileAvatar, setProfileAvatar] = useState(currentUser?.avatar || matchedClient?.avatar || '');
  const [profilePhone, setProfilePhone] = useState(matchedClient?.phone || '');
  const [profilePassword, setProfilePassword] = useState(matchedClient?.password || currentUser?.password || '');

  // Filter systems
  const clientEmail = currentUser?.email || '';
  const clientProjects = projects.filter(p => p.clientEmail?.toLowerCase() === clientEmail.toLowerCase());
  const clientInvoices = invoices.filter(i => i.clientEmail?.toLowerCase() === clientEmail.toLowerCase());
  const clientTickets = tickets.filter(t => t.clientEmail?.toLowerCase() === clientEmail.toLowerCase());
  const clientMessagesIn = messages.filter(m => m.email?.toLowerCase() === clientEmail.toLowerCase());

  // Show premium automated toasts
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  // Handle Drag / Drop file simulations
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      simulateFileUpload(file.name, (file.size / (1024 * 1024)).toFixed(1));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      simulateFileUpload(file.name, (file.size / (1024 * 1024)).toFixed(1));
    }
  };

  const simulateFileUpload = (name: string, sizeMb: string) => {
    triggerToast(`Uploading "${name}" securely to diyo cloud storage...`);
    setTimeout(() => {
      setUploadedFiles(prev => [
        { name, size: `${sizeMb} MB`, date: 'Just now' },
        ...prev
      ]);
      logActivity(`Submitted new asset build brief: "${name}" (${sizeMb} MB)`, "invite", currentUser?.name || "Client");
      triggerToast(`Successfully uploaded "${name}"! The diyo team is notified.`);
    }, 1500);
  };

  // Submit chat to Admin Console live messages
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    addMessage(
      currentUser?.name || 'Client Collaborator',
      clientEmail,
      chatInput.trim(),
      'SaaS Client',
      true // Mark as client message
    );
    setChatInput('');
    triggerToast('Message sent to diyo developers and PMs!');
  };

  // Support ticket actions
  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketTitle.trim() || !ticketDesc.trim()) return;

    addTicket({
      title: ticketTitle.trim(),
      clientEmail,
      status: 'Open',
      severity: ticketSeverity,
      description: ticketDesc.trim()
    });

    logActivity(`Opened system Support Incident: "${ticketTitle.trim()}" [Severity: ${ticketSeverity}]`, "ticket", currentUser?.name || "Client");

    setTicketTitle('');
    setTicketDesc('');
    triggerToast('Diyo Support ticket logged fully under ISO service level.');
  };

  const handleSendTicketReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketReplyInput.trim() || !activeTicketId) return;

    addTicketReply(activeTicketId, ticketReplyInput.trim(), 'client', currentUser?.name || 'Client');
    setTicketReplyInput('');
    triggerToast('Support reply posted securely.');
  };

  // Pay invoice simulation
  const handlePayInvoice = (id: string, title: string) => {
    payInvoice(id);
    logActivity(`Cleared Contract Invoice: "${title}"`, "billing", currentUser?.name || "Client");
    triggerToast(`Payment successful for invoice: ${title}! Certificate generated.`);
  };

  // Save profile changes
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) return;
    updateUserProfile(profileName.trim(), profileAvatar.trim(), profilePhone.trim() || undefined, profilePassword.trim() || undefined);
    triggerToast('Secure profile records matching your safety keys updated.');
  };

  return (
    <div className="min-h-screen bg-[#080a10] text-[#cfd3db] flex flex-col relative font-sans overflow-x-hidden selection:bg-primary selection:text-white">
      {/* Background gradients */}
      <div className="absolute top-0 right-1/4 w-[40rem] h-[35rem] rounded-full bg-primary/5 filter blur-[150px] pointer-events-none" />
      <div className="absolute -bottom-20 left-10 w-[30rem] h-[30rem] rounded-full bg-secondary/5 filter blur-[120px] pointer-events-none" />

      {/* TOAST SYSTEM */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-[#141a29] border border-white/10 shadow-2xl flex items-center gap-3 backdrop-blur-xl max-w-sm glow-orange"
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 animate-pulse">
              <Sparkles className="w-4 h-4 text-secondary" />
            </div>
            <div className="text-xs">
              <p className="font-bold text-white">System Broadcast</p>
              <p className="text-white/60 mt-0.5">{toastMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER STRIP */}
      <header className="h-20 border-b border-white/5 bg-[#0a0f1d]/50 backdrop-blur-xl px-6 md:px-12 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary p-[1px] flex items-center justify-center shadow-lg">
            <div className="w-full h-full bg-[#0a0f1d] rounded-xl flex items-center justify-center">
              <span className="font-mono text-xl font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">D</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-white tracking-widest font-mono">diyo</h1>
              <span className="px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider font-mono font-bold bg-secondary/15 text-secondary border border-secondary/20">
                Client Hub
              </span>
            </div>
            <p className="text-[10px] text-white/40 tracking-wider uppercase font-mono sm:block hidden">LIGHTING DIGITAL POSSIBILITIES</p>
          </div>
        </div>

        {/* Client identity bar */}
        <div className="flex items-center gap-4">
          <div className="text-right sm:block hidden">
            <p className="text-[9px] font-mono text-white/35">COLLABORATOR</p>
            <p className="text-xs font-bold text-white">{currentUser?.name || clientEmail}</p>
          </div>

          <div className="w-10 h-10 rounded-xl bg-[#121626] border border-white/10 flex items-center justify-center overflow-hidden">
            {profileAvatar ? (
              <img src={profileAvatar} alt="Client avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-primary font-mono select-none">
                {currentUser?.name?.slice(0, 2).toUpperCase() || 'CL'}
              </span>
            )}
          </div>

          <button 
            onClick={logoutClient}
            className="p-2 rounded-lg hover:bg-white/5 text-rose-400 hover:text-rose-300 transition-all cursor-pointer"
            title="Log out of secure pipeline"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* CORE FRAMEWORK GRID */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl w-full mx-auto p-4 md:p-8 gap-8">
        
        {/* SIDEBAR NAVIGATION TAB */}
        <aside className="w-full lg:w-64 shrink-0 flex flex-col gap-2">
          
          <div className="p-4 bg-[#0e1220] border border-white/5 rounded-2xl mb-2">
            <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">ACTIVE CONNECTION</p>
            <p className="text-[#edc157] text-xs font-mono font-bold flex items-center gap-1.5 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              diyo-secure://tunnel
            </p>
          </div>

          <button 
            id="client-tab-project"
            onClick={() => setActiveTab('project')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all cursor-pointer text-left ${activeTab === 'project' ? 'bg-primary/10 text-primary border border-primary/20 font-bold' : 'hover:bg-white/[0.03] text-white/50'}`}
          >
            <Briefcase className="w-4 h-4" /> Milestones & Files
          </button>

          <button 
            id="client-tab-chat"
            onClick={() => {
              setActiveTab('chat');
              // triggerToast("Opening Live developer liaison tunnel...");
            }}
            className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${activeTab === 'chat' ? 'bg-primary/10 text-primary border border-primary/20 font-bold' : 'hover:bg-white/[0.03] text-white/50'}`}
          >
            <span className="flex items-center gap-3">
              <MessageSquare className="w-4 h-4" /> Real-time Liaison
            </span>
            <span className="w-2 h-2 rounded-full bg-primary" />
          </button>

          <button 
            id="client-tab-invoices"
            onClick={() => setActiveTab('invoices')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all cursor-pointer text-left ${activeTab === 'invoices' ? 'bg-primary/10 text-primary border border-primary/20 font-bold' : 'hover:bg-white/[0.03] text-white/50'}`}
          >
            <CreditCard className="w-4 h-4" /> Billing & Invoices
          </button>

          <button 
            id="client-tab-tickets"
            onClick={() => setActiveTab('tickets')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all cursor-pointer text-left ${activeTab === 'tickets' ? 'bg-primary/10 text-primary border border-primary/20 font-bold' : 'hover:bg-white/[0.03] text-white/50'}`}
          >
            <LifeBuoy className="w-4 h-4" /> Support Tickets
          </button>

          <button 
            id="client-tab-profile"
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all cursor-pointer text-left ${activeTab === 'profile' ? 'bg-primary/10 text-primary border border-primary/20 font-bold' : 'hover:bg-white/[0.03] text-white/50'}`}
          >
            <UserIcon className="w-4 h-4" /> Profile Config
          </button>

          <div className="mt-8 p-5 rounded-2xl bg-gradient-to-b from-[#141a29] to-[#080c16] border border-white/5 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-primary/10 rounded-full filter blur-xl" />
            <h4 className="text-xs font-bold text-white">Need emergency hotline?</h4>
            <p className="text-[10px] text-white/40 mt-1">Direct dev cell lines and SLA overrides available upon enterprise upgrade.</p>
            <a href="mailto:nishant@diyo" className="mt-3 block w-full py-2 rounded-lg bg-white/5 text-center text-[10px] font-mono uppercase font-bold text-white hover:bg-white/10 transition-all border border-white/5">
              Email PM Direct
            </a>
          </div>

        </aside>

        {/* MAIN VIEWPORT CARD AREA */}
        <main className="flex-1 min-w-0">
          
          <AnimatePresence mode="wait">
            
            {/* VIEW 1: MY PROJECTS PIPELINES */}
            {activeTab === 'project' && (
              <motion.div 
                key="project-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-8"
              >
                {/* Showcase Banner */}
                <div className="p-6 md:p-8 rounded-3xl bg-[#121626] border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden glow-orange">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full filter blur-3xl" />
                  <div>
                    <h3 className="text-lg font-black text-white">Your Project Workspace</h3>
                    <p className="text-xs text-white/50 mt-1 max-w-xl">
                      Welcome back! All build sprints, active architectural deliverables, and specification requirements are aggregated securely under your organization profile keys.
                    </p>
                  </div>
                  <div className="px-4 py-2 rounded-2xl bg-[#090b16] border border-white/5 text-center shrink-0">
                    <p className="text-[9px] font-mono text-white/35 tracking-wider uppercase">SLA HEALTH</p>
                    <p className="text-emerald-400 font-bold font-mono text-sm">99.98% / EXCELLENT</p>
                  </div>
                </div>

                {/* PROPOSALS & LEGAL AGREEMENTS SECTION */}
                <div className="p-6 md:p-7 rounded-3xl bg-gradient-to-br from-[#121628] to-[#0a0c16] border border-white/5 space-y-5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full filter blur-2xl pointer-events-none" />
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <h4 className="text-sm font-black text-white flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary animate-pulse" /> Active Proposals & System Agreements
                      </h4>
                      <p className="text-[10px] text-white/40 mt-0.5">Review your customized pricing parameters, system scopes, and legal conditions securely.</p>
                    </div>
                    {termsAccepted ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-mono px-2.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-bold">
                        <Check className="w-3" /> Fully Signed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[9px] font-mono px-2.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/20 font-bold animate-pulse">
                        Awaiting Signature
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Proposal Card */}
                    <div className="p-4 rounded-2xl bg-[#0d101a] border border-white/5 hover:border-white/10 transition-all space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <p className="text-xs font-bold text-white">System Architecture & Service Proposal</p>
                          <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[8px] font-mono font-bold tracking-wider shrink-0">
                            SPECIFICATION
                          </span>
                        </div>
                        <p className="text-[11px] text-white/50 leading-relaxed font-sans">
                          High-fidelity custom design systems, Vite optimization, and robust Express backend services tailored for production.
                        </p>
                      </div>
                      
                      <div className="pt-2">
                        <button 
                          onClick={() => {
                            setProposalViewed(true);
                            localStorage.setItem(`diyo_proposal_viewed_${currentUser?.email}`, 'true');
                            logActivity('Viewed System Architecture & Service Proposal', 'launch', currentUser?.name || 'Client');
                            triggerToast('System proposal retrieved. Transmission registered on the Admin console!');
                          }}
                          className={`w-full py-2 font-mono text-[10px] uppercase rounded-xl transition-all font-bold border cursor-pointer ${
                            proposalViewed 
                              ? 'bg-white/5 border-white/10 text-white/60 hover:text-white' 
                              : 'bg-primary text-orange-950 border-primary hover:brightness-110'
                          }`}
                        >
                          {proposalViewed ? 'Re-View Service Proposal' : 'View System Proposal'}
                        </button>
                      </div>
                    </div>

                    {/* Terms Agreement Card */}
                    <div className="p-4 rounded-2xl bg-[#0d101a] border border-white/5 hover:border-white/10 transition-all space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <p className="text-xs font-bold text-white">Consolidated SLA Covenant Agreement</p>
                          <span className="px-2 py-0.5 rounded bg-secondary/10 text-secondary text-[8px] font-mono font-bold tracking-wider shrink-0">
                            LEGAL COVENANT
                          </span>
                        </div>
                        <p className="text-[11px] text-white/50 leading-relaxed font-sans">
                          Specifies technical deliverables timeline milestones, support ticketing SLAs, and recurring host maintenance.
                        </p>
                      </div>

                      <div className="pt-2">
                        {termsAccepted ? (
                          <div className="w-full py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[10px] uppercase rounded-xl text-center font-bold">
                            Signed on {new Date().toLocaleDateString()}
                          </div>
                        ) : (
                          <button 
                            onClick={() => {
                              setTermsAccepted(true);
                              localStorage.setItem(`diyo_terms_accepted_${currentUser?.email}`, 'true');
                              logActivity('Accepted Consolidated SLA Terms of Agreement', 'done_all', currentUser?.name || 'Client');
                              triggerToast('Covenant agreement successfully signed. Acknowledged on Admin Console!');
                            }}
                            className="w-full py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:brightness-110 text-white font-mono text-[10px] uppercase rounded-xl transition-all border border-emerald-500/30 font-bold cursor-pointer"
                          >
                            Accept & Sign SLA Covenant
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Projects Loop */}
                {clientProjects.length === 0 ? (
                  <div className="p-12 text-center rounded-3xl bg-[#0e1220]/50 border border-dashed border-white/10">
                    <Briefcase className="w-8 h-8 text-white/25 mx-auto mb-3" />
                    <h4 className="text-sm font-bold text-white">Initializing Pipelines</h4>
                    <p className="text-xs text-white/45 mt-1 max-w-sm mx-auto">
                      Diyo has set up your secure tenant space, but no active systems pipeline has loaded yet. Ask your PM to assign your code blueprint!
                    </p>
                  </div>
                ) : (
                  clientProjects.map((proj) => (
                    <div id={`client-project-${proj.id}`} key={proj.id} className="p-6 md:p-8 rounded-3xl bg-[#12162a]/40 border border-white/5 space-y-6">
                      
                      {/* Project identity */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-mono font-extrabold text-sm shadow-inner shrink-0">
                            {proj.prefix || 'DY'}
                          </div>
                          <div>
                            <h4 className="text-base font-black text-white">{proj.name}</h4>
                            <p className="text-xs text-white/45 flex items-center gap-2 mt-0.5">
                              <span>Phase: <strong className="text-white/70 font-medium">{proj.status}</strong></span>
                              <span className="w-1 h-1 rounded-full bg-white/20" />
                              <span>Prefix ID: <strong className="font-mono text-secondary">{proj.prefix}-{(proj.progress * 13) % 100}</strong></span>
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-mono tracking-widest uppercase font-bold border ${
                            proj.status === 'Completed' 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                              : 'bg-primary/10 text-primary border-primary/20'
                          }`}>
                            {proj.status}
                          </span>
                        </div>
                      </div>

                      {/* Custom progress gauge */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs font-mono">
                          <span className="text-white/40 uppercase tracking-widest">Pipeline Build Metri</span>
                          <span className="text-white font-bold">{proj.progress}% Fully Consolidated</span>
                        </div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden p-[1px] border border-white/5">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${proj.progress}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className="h-full rounded-full bg-gradient-to-r from-primary to-secondary relative"
                          >
                            <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/30 rounded-full animate-pulse" />
                          </motion.div>
                        </div>
                      </div>

                      {/* Deliverables downloading block */}
                      <div className="border-t border-white/5 pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* DELIVERABLES FROM DIYO */}
                        <div className="space-y-3">
                          <h5 className="text-xs font-mono text-white/50 uppercase tracking-widest flex items-center gap-1.5 font-bold">
                            <Download className="w-3.5 h-3.5 text-primary" /> System Deliverables
                          </h5>
                          
                          <div className="space-y-2.5">
                            {(proj.deliverables && proj.deliverables.length > 0) ? (
                              proj.deliverables.map((del) => (
                                <div key={del.id} className="p-3 rounded-xl bg-[#0e1220] border border-white/5 flex items-center justify-between gap-3 text-xs hover:border-white/10 transition-all">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <FileText className="w-4 h-4 text-secondary shrink-0" />
                                    <div className="truncate">
                                      <p className="font-bold text-white truncate">{del.name}</p>
                                      <p className="text-[10px] text-white/30 font-mono">{del.fileSize} • {del.type.toUpperCase()}</p>
                                    </div>
                                  </div>
                                  <a 
                                    href="#" 
                                    onClick={(e) => { 
                                      e.preventDefault(); 
                                      logActivity(`Downloaded build deliverable: "${del.name}"`, "launch", currentUser?.name || "Client");
                                      triggerToast(`Initializing high-speed secure download for ${del.name}...`); 
                                    }}
                                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-all cursor-pointer"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                  </a>
                                </div>
                              ))
                            ) : (
                              <div className="space-y-2">
                                <div className="p-3.5 rounded-xl bg-[#0e1220]/60 border border-white/5 flex items-center justify-between gap-2 text-xs">
                                  <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-primary" />
                                    <div>
                                      <p className="font-bold text-white">Diyo_Design_System_Spec.fig</p>
                                      <p className="text-[10px] text-white/30 font-mono">1.2 MB • FIGMA LINK</p>
                                    </div>
                                  </div>
                                  <button onClick={() => triggerToast('Figma system canvas is opening in browser mockup...')} className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all text-[10px] font-mono uppercase font-bold">
                                    View Design
                                  </button>
                                </div>

                                <div className="p-3.5 rounded-xl bg-[#0e1220]/60 border border-white/5 flex items-center justify-between gap-2 text-xs">
                                  <div className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-emerald-400" />
                                    <div>
                                      <p className="font-bold text-white">Architecture_MVP_Endpoint_V1.json</p>
                                      <p className="text-[10px] text-white/30 font-mono">245 KB • SPECIFICATION</p>
                                    </div>
                                  </div>
                                  <button onClick={() => triggerToast('Downloading raw MVP specification file...')} className="p-1.5 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 transition-all">
                                    <Download className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* SUBMIT REQUISITION TO DIYO */}
                        <div className="space-y-3">
                          <h5 className="text-xs font-mono text-white/50 uppercase tracking-widest flex items-center gap-1.5 font-bold">
                            <Upload className="w-3.5 h-3.5 text-secondary" /> Submit Assets / Requirements
                          </h5>

                          <div 
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`p-6 rounded-2xl border border-dashed text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                              isDragging 
                                ? 'bg-primary/5 border-primary text-primary' 
                                : 'bg-[#0a0d16] border-white/10 hover:border-white/20 hover:bg-[#0a0d16]/80'
                            }`}
                          >
                            <input 
                              type="file" 
                              ref={fileInputRef} 
                              className="hidden" 
                              onChange={handleFileSelect} 
                            />
                            <Paperclip className="w-5 h-5 text-white/40" />
                            <p className="text-xs font-bold text-white">Drag & drop files or click to browse</p>
                            <p className="text-[10px] text-white/30">PNG, Asset Zips, CSV, doc up to 50MB</p>
                          </div>

                        </div>

                      </div>

                    </div>
                  ))
                )}

                {/* Uploaded Files log list */}
                {uploadedFiles.length > 0 && (
                  <div className="p-6 rounded-3xl bg-[#0e1220]/60 border border-white/5 space-y-4">
                    <h4 className="text-xs font-mono text-white/40 uppercase tracking-widest font-bold">YOUR SUBMITTED FILES RECORD</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {uploadedFiles.map((file, idx) => (
                        <div key={idx} className="p-3.5 rounded-xl bg-[#121626]/40 border border-white/5 hover:border-white/10 flex items-center justify-between text-xs transition-all">
                          <div>
                            <p className="font-bold text-white">{file.name}</p>
                            <p className="text-[10px] text-white/30 font-mono">{file.size} • Uploaded {file.date}</p>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[9px] font-bold">
                            SECURED
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </motion.div>
            )}

            {/* VIEW 2: REAL-TIME SECURED CHAT TUNNEL */}
            {activeTab === 'chat' && (
              <motion.div 
                key="chat-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="h-[calc(100vh-12rem)] min-h-[480px] bg-[#121626]/45 border border-white/5 rounded-3xl overflow-hidden flex flex-col glow-orange"
              >
                {/* Chat header */}
                <div className="p-5 border-b border-white/5 bg-[#121626]/95 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 text-[#ff7a18] flex items-center justify-center font-mono font-bold text-xs select-none shadow-sm">
                      DY
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Nishant & Anuraj (Diyo Team)</h4>
                      <p className="text-[10px] text-emerald-400 font-mono mt-0.5 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Live Liaison Connection Active
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-[9px] font-mono text-white/35">TUNNEL ID</p>
                    <p className="text-[10px] font-mono text-[#edc157] font-bold uppercase">LIAISON_090_D8</p>
                  </div>
                </div>

                {/* Messages list */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {clientMessagesIn.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8">
                      <MessageSquare className="w-8 h-8 text-white/10 mb-2" />
                      <h5 className="text-xs font-bold text-white">Start your real-time conversation</h5>
                      <p className="text-[10px] text-white/40 mt-1 max-w-xs mx-auto">
                        Type a message below to coordinate instantly with our engineers, system designers, and founders.
                      </p>
                    </div>
                  ) : (
                    clientMessagesIn.map((msg) => {
                      const isClientMsg = msg.isClientMessage;
                      return (
                        <div key={msg.id} className={`flex ${isClientMsg ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                          <div className={`max-w-[80%] rounded-2xl p-4 space-y-1 relative group transition-all text-xs border ${
                            isClientMsg 
                              ? 'bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 text-white rounded-br-none shadow-orange-500/5' 
                              : 'bg-white/[0.02] border-white/5 text-white/90 rounded-bl-none'
                          }`}>
                            <div className="flex items-center justify-between gap-8 mb-1.5">
                              <span className="font-black font-mono text-[9px] uppercase tracking-wider text-secondary">
                                {isClientMsg ? 'You' : msg.senderName}
                              </span>
                              <span className="text-[9px] text-white/30 font-mono">{msg.relativeTime || 'Just now'}</span>
                            </div>
                            <p className="whitespace-pre-line leading-relaxed font-sans">{msg.previewText}</p>
                            
                            {/* Display answers / nested replies */}
                            {msg.replies && msg.replies.map((reply, i) => (
                              <div key={i} className="mt-3 pt-3 border-t border-white/5 space-y-1">
                                <p className="font-mono text-[9px] uppercase tracking-wider text-[#edc157] font-bold">Diyo Admin Team</p>
                                <p className="text-white/80 italic font-sans">{reply}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Sender form */}
                <form onSubmit={handleSendChat} className="p-4 border-t border-white/5 bg-[#0a0f1d] flex gap-3">
                  <input 
                    type="text" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type your design feedback or software enquiry here..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-white/25 focus:outline-none focus:border-primary font-sans"
                  />
                  <button 
                    type="submit"
                    className="p-3 bg-gradient-to-r from-primary to-[#ff7a18] text-orange-950 font-black rounded-xl hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer shadow-md"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>

              </motion.div>
            )}

            {/* VIEW 3: INVOICES & BILLING */}
            {activeTab === 'invoices' && (
              <motion.div 
                key="invoices-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6 animate-fadeIn"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Stats */}
                  <div className="p-6 rounded-2xl bg-[#121626]/65 border border-white/5">
                    <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Total Invoiced</p>
                    <p className="text-2xl font-mono font-black text-white mt-1">
                      NPR {clientInvoices.reduce((acc, i) => acc + (parseFloat(i.amount.replace(/[^0-9.]/g, '')) || 0), 0).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-white/40 mt-1 font-mono">Consolidated contract value</p>
                  </div>
                  
                  <div className="p-6 rounded-2xl bg-[#121626]/65 border border-white/5">
                    <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Paid Balance</p>
                    <p className="text-2xl font-mono font-black text-emerald-400 mt-1">
                      NPR {clientInvoices.filter(i => i.status === 'Paid').reduce((acc, i) => acc + (parseFloat(i.amount.replace(/[^0-9.]/g, '')) || 0), 0).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-emerald-400/50 mt-1 font-mono">Transfers cleared live</p>
                  </div>

                  <div className="p-6 rounded-2xl bg-[#121626]/65 border border-white/5">
                    <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Awaiting clearing</p>
                    <p className="text-2xl font-mono font-black text-[#ff7a18] mt-1">
                      NPR {clientInvoices.filter(i => i.status === 'Unpaid').reduce((acc, i) => acc + (parseFloat(i.amount.replace(/[^0-9.]/g, '')) || 0), 0).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-[#ff7a18]/50 mt-1 font-mono">Pending client payment action</p>
                  </div>
                </div>

                {/* List invoices */}
                <div className="p-6 rounded-3xl bg-[#12162a]/45 border border-white/5 space-y-4">
                  <h4 className="text-xs font-mono text-white/45 uppercase tracking-widest font-bold">CONTRACT INVOICES HUB</h4>
                  
                  <div className="space-y-3">
                    {clientInvoices.length === 0 ? (
                      <div className="p-8 text-center bg-white/[0.01] rounded-2xl border border-dashed border-white/5 text-xs text-white/40 font-mono">
                        No invoices logged under email key: {clientEmail}
                      </div>
                    ) : (
                      clientInvoices.map((inv) => (
                        <div id={`client-invoice-${inv.id}`} key={inv.id} className="p-4 md:p-5 rounded-2xl bg-[#0d101a] border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono ${inv.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-orange-500/10 text-primary'}`}>
                              <CreditCard className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-bold text-white text-sm">{inv.title}</p>
                              <p className="text-[10px] text-white/35 font-mono mt-0.5">Due date: {inv.dueDate || 'Immediate'}</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-0 border-white/5 pt-3 md:pt-0">
                            <div className="text-left md:text-right">
                              <p className="font-black text-white text-base font-mono">{inv.amount}</p>
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-mono tracking-widest mt-1 font-bold ${inv.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-[#ff7a18]/10 text-[#ff7a18]'}`}>
                                {inv.status.toUpperCase()}
                              </span>
                            </div>

                            <button 
                              onClick={() => {
                                downloadInvoicePDF(inv, clients, projects);
                                triggerToast(`Invoice PDF "${inv.title}" download triggered.`);
                              }}
                              className="px-3 py-2 bg-white/5 hover:bg-white/10 hover:text-[#ff7a18] text-white/70 font-mono text-[10px] uppercase rounded-lg transition-all border border-white/5 flex items-center gap-1.5 cursor-pointer shrink-0"
                              title="Download Invoice PDF"
                            >
                              <Download className="w-3.5 h-3.5" /> PDF
                            </button>

                            {inv.status === 'Unpaid' ? (
                              <button 
                                onClick={() => handlePayInvoice(inv.id, inv.title)}
                                className="px-3 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:brightness-110 text-white font-mono font-bold uppercase text-[10px] rounded-lg transition-all cursor-pointer shadow-md"
                              >
                                Clear Invoice
                              </button>
                            ) : (
                              <button 
                                disabled 
                                className="px-3 py-2 bg-white/5 text-white/30 font-mono text-[10px] uppercase rounded-lg cursor-not-allowed border border-white/5"
                              >
                                Cleared <Check className="inline w-3 h-3 ml-1" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </motion.div>
            )}

            {/* VIEW 4: SUPPORT TICKETS PORTAL */}
            {activeTab === 'tickets' && (
              <motion.div 
                key="tickets-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8"
              >
                
                {/* File Ticket Form (4 cols) */}
                <div className="lg:col-span- così lg:col-span-5 p-6 rounded-3xl bg-[#121626]/50 border border-white/5 space-y-4">
                  <h4 className="text-xs font-mono text-white/45 uppercase tracking-widest font-bold flex items-center gap-1.5">
                    <LifeBuoy className="w-4 h-4 text-primary animate-spin" /> Open Support Ticket
                  </h4>

                  <form onSubmit={handleCreateTicket} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-widest text-white/55 mb-2">Ticket Summary</label>
                      <input 
                        type="text" 
                        value={ticketTitle}
                        onChange={(e) => setTicketTitle(e.target.value)}
                        placeholder="e.g. Asset scaling bug or endpoint lag"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-primary font-sans"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-widest text-white/55 mb-2">Severity Level</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['High', 'Medium', 'Low'] as const).map((lvl) => (
                          <button 
                            key={lvl}
                            type="button"
                            onClick={() => setTicketSeverity(lvl)}
                            className={`py-2 text-[10px] font-mono uppercase rounded-lg border transition-all ${
                              ticketSeverity === lvl 
                                ? 'bg-primary/20 text-primary border-primary/45 font-extrabold' 
                                : 'bg-[#0a0d16] text-white/40 border-white/5 hover:text-white'
                            }`}
                          >
                            {lvl}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-widest text-white/55 mb-2">Instructional Description</label>
                      <textarea 
                        value={ticketDesc}
                        onChange={(e) => setTicketDesc(e.target.value)}
                        placeholder="Trace your steps and specify files or systems behaving unexpectedly."
                        rows={4}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-primary font-sans resize-none"
                      />
                    </div>

                    <button 
                      type="submit"
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-orange-950 font-black text-xs font-mono tracking-widest hover:brightness-110 transition-all cursor-pointer shadow-lg"
                    >
                      FILE SECURED TICKET
                    </button>
                  </form>
                </div>

                {/* View Tickets Thread (7 cols) */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="p-6 rounded-3xl bg-[#121626]/50 border border-white/5 space-y-4">
                    <h4 className="text-xs font-mono text-white/45 uppercase tracking-widest font-bold">SUPPORT PIPELINES</h4>

                    <div className="space-y-3">
                      {clientTickets.length === 0 ? (
                        <div className="p-8 text-center bg-white/[0.01] rounded-xl border border-dashed border-white/5 text-xs text-white/40 font-mono">
                          No support pipelines filed. Your system is fully operational.
                        </div>
                      ) : (
                        clientTickets.map((tc) => (
                          <div key={tc.id} className="p-4 rounded-xl bg-[#0c0f18] border border-white/5 space-y-3">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-white text-sm truncate max-w-[70%]">{tc.title}</span>
                              <div className="flex items-center gap-2">
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                                  tc.severity === 'High' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                  tc.severity === 'Medium' ? 'bg-[#ff7a18]/10 text-[#ff7a18] border border-primary/20' :
                                  'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                                }`}>
                                  {tc.severity} Priority
                                </span>
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                                  tc.status === 'Open' ? 'bg-[#ffa270]/10 text-primary border border-primary/25' :
                                  tc.status === 'In Progress' ? 'bg-[#edc157]/10 text-[#edc157] border border-white/5' :
                                  'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                }`}>
                                  {tc.status}
                                </span>
                              </div>
                            </div>

                            <p className="text-white/60 text-xs italic bg-white/[0.01] p-3 rounded-lg border border-white/5">
                              {tc.description}
                            </p>

                            {/* Replies expand tab */}
                            <div className="space-y-2 mt-2">
                              {tc.replies && tc.replies.map((rep) => (
                                <div key={rep.id} className={`p-3 rounded-xl border text-xs text-sans ${rep.sender === 'admin' ? 'bg-primary/5 border-primary/10 ml-4' : 'bg-white/[0.01] border-white/5 mr-4'}`}>
                                  <div className="flex items-center justify-between gap-2 mb-1">
                                    <span className="font-extrabold font-mono text-[9px] uppercase tracking-wider text-secondary">
                                      {rep.sender === 'admin' ? `🛡️ Diyo Engineer (${rep.senderName})` : `👤 Client (${rep.senderName})`}
                                    </span>
                                    <span className="text-[8px] text-white/30 font-mono">{rep.createdAt}</span>
                                  </div>
                                  <p className="text-white/80">{rep.message}</p>
                                </div>
                              ))}
                            </div>

                            {/* Reply Input */}
                            <form 
                              onSubmit={(e) => {
                                e.preventDefault();
                                if (!ticketReplyInput.trim()) return;
                                addTicketReply(tc.id, ticketReplyInput.trim(), 'client', currentUser?.name || 'Client');
                                setTicketReplyInput('');
                                triggerToast('Support response sent.');
                              }}
                              className="flex gap-2 pt-2 border-t border-white/5"
                            >
                              <input 
                                type="text"
                                placeholder="Type support reply or follow-up details..."
                                value={activeTicketId === tc.id ? ticketReplyInput : ''}
                                onChange={(e) => {
                                  setActiveTicketId(tc.id);
                                  setTicketReplyInput(e.target.value);
                                }}
                                className="flex-1 bg-white/[0.02] border border-white/5 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary text-white"
                              />
                              <button 
                                type="submit"
                                className="px-3 bg-white/5 hover:bg-white/10 text-white rounded-lg cursor-pointer"
                              >
                                Send
                              </button>
                            </form>

                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

              </motion.div>
            )}

            {/* VIEW 5: USER DEPLOYMENT PROFILE */}
            {activeTab === 'profile' && (
              <motion.div 
                key="profile-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="max-w-2xl mx-auto rounded-3xl bg-[#121626]/50 border border-white/5 p-6 md:p-8 space-y-6 glow-orange"
              >
                <div>
                  <h3 className="text-md font-bold text-white font-mono uppercase tracking-wider">Liaison Account Settings</h3>
                  <p className="text-xs text-white/40 mt-0.5">Customize your verified collaborator layout indicators.</p>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-6">
                  
                  <div className="flex flex-col sm:flex-row items-center gap-4 border-b border-white/5 pb-6">
                    <div className="w-16 h-16 rounded-2xl bg-[#090b16] border border-white/10 flex items-center justify-center overflow-hidden">
                      {profileAvatar ? (
                        <img src={profileAvatar} alt="Identity preview" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl font-bold text-primary font-mono select-none">
                          {profileName.slice(0, 2).toUpperCase() || 'CL'}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 space-y-3 w-full">
                      <label className="block text-[10px] font-mono uppercase tracking-widest text-white/50">Avatar endpoint URL</label>
                      <input 
                        type="url"
                        value={profileAvatar}
                        onChange={(e) => setProfileAvatar(e.target.value)}
                        placeholder="https://images.unsplash.com/... or your custom avatar URL"
                        className="w-full text-xs font-sans bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-widest text-white/55 mb-2">Secure Display Name</label>
                      <input 
                        type="text"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        placeholder="Sarah Jenkins"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-primary font-sans"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-widest text-[#5e6678] mb-2 font-bold select-none text-white/30">Liaison Email (Immutable)</label>
                      <input 
                        type="email"
                        disabled
                        value={clientEmail}
                        className="w-full bg-white/[0.02] border border-white/5 text-white/30 rounded-xl px-4 py-3 text-xs font-mono cursor-not-allowed select-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-widest text-[#ff7a18] mb-2 font-bold">Contact Phone Number</label>
                    <input 
                      type="tel"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      placeholder="+977-9801234567"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-primary font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-widest text-[#edc157] mb-2 font-bold select-none">Secure Access Password (Safety)</label>
                    <input 
                      type="text"
                      value={profilePassword}
                      onChange={(e) => setProfilePassword(e.target.value)}
                      placeholder="Access Password Matching Your Verification Key"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-primary font-mono"
                    />
                    <span className="text-[10px] text-[#cfd3db]/40 font-mono mt-1 block">Your access password serves as safety verification along with your email.</span>
                  </div>

                  {matchedClient?.customFeatures && matchedClient.customFeatures.length > 0 && (
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                      <p className="text-[10px] font-mono text-[#edc157] font-bold uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-secondary shrink-0 animate-pulse" /> Verified SLA Package Options
                      </p>
                      <ul className="text-xs text-white/70 font-sans grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                        {matchedClient.customFeatures.map((feat, idx) => (
                          <li key={idx} className="flex items-center gap-1.5 truncate">
                            <span className="text-primary font-bold select-none">•</span>
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <button 
                    type="submit"
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-orange-950 font-extrabold text-xs tracking-widest font-mono hover:brightness-110 transition-all cursor-pointer shadow-lg"
                  >
                    DEPLOY SECURE ENVELOPE
                  </button>

                </form>

                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-xs text-white/50 flex gap-3 relative overflow-hidden">
                  <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-white">Cryptokey Integrity Verified</p>
                    <p className="text-[10px] mt-0.5">Your email is tied permanently to Diyo Firestore rules allowing only this specific endpoint to fetch linked specifications.</p>
                  </div>
                </div>

              </motion.div>
            )}

          </AnimatePresence>

        </main>

      </div>
    </div>
  );
};

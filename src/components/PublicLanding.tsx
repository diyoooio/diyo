import React, { useState, useEffect } from 'react';
import { useStorage } from './StorageContext';
import { ThreeJSFlame } from './ThreeJSFlame';
import { ShaderBackground } from './ShaderBackground';
import { PricingPlan, Project } from '../types';
import { 
  Rocket, 
  Terminal, 
  Settings, 
  Activity, 
  Check, 
  X, 
  ArrowRight, 
  Send, 
  Sparkles, 
  Maximize2,
  Cpu,
  MonitorPlay,
  Layers,
  CheckCircle,
  Clock,
  Lock
} from 'lucide-react';

export const PublicLanding: React.FC = () => {
  const { plans, projects, addMessage, setViews } = useStorage();
  
  // Lead / client inquiry states
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryEmail, setInquiryEmail] = useState('');
  const [inquiryText, setInquiryText] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('plan-2');
  const [successSent, setSuccessSent] = useState(false);
  const [sendingState, setSendingState] = useState(false);

  // Modular interactive contact form states
  const [activeFormTab, setActiveFormTab] = useState<'onboard' | 'contact'>('onboard');
  const [contactSubject, setContactSubject] = useState('General Collaboration');
  const [senderRoleInput, setSenderRoleInput] = useState('Project Lead');

  // Currency and Nepali localization states
  const [currencyMode, setCurrencyMode] = useState<'npr-traditional' | 'npr-english' | 'usd'>('npr-traditional');
  const [kathmanduTime, setKathmanduTime] = useState('');

  // Devanagari numerals to western digits converter
  const convertDevanagariToEnglishRupee = (devanagariStr: string | undefined): string => {
    if (!devanagariStr) return '';
    const devanagariDigits = '०१२३४५६७८९';
    let result = devanagariStr.replace('रू', 'Rs.');
    for (let i = 0; i < 10; i++) {
      result = result.split(devanagariDigits[i]).join(String(i));
    }
    return result;
  };

  const getEnglishPeriod = (periodStr: string | undefined): string => {
    if (!periodStr) return '';
    if (periodStr.includes('महिना')) return '/month';
    if (periodStr.includes('प्रोजेक्ट')) return '/project';
    return periodStr;
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const nstOffset = 5.75 * 3600000; // GMT +5:45 (Nepal Standard Time)
      const nstDate = new Date(utc + nstOffset);
      
      const timeStr = nstDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      setKathmanduTime(timeStr);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Venture visual modal
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Quick preset selecting helper
  const handleSelectPlan = (plan: PricingPlan) => {
    setSelectedPlanId(plan.id);
    const element = document.getElementById('onboard-anchor');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSubmitLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryName || !inquiryEmail || !inquiryText) return;

    setSendingState(true);
    setTimeout(() => {
      if (activeFormTab === 'onboard') {
        const selectedPlan = plans.find(p => p.id === selectedPlanId);
        const planNameNote = selectedPlan ? ` [Interests: ${selectedPlan.name} Plan]` : '';
        addMessage(
          inquiryName, 
          inquiryEmail, 
          `${inquiryText}${planNameNote}`,
          senderRoleInput || 'Project Lead'
        );
      } else {
        addMessage(
          inquiryName,
          inquiryEmail,
          `[Subject: ${contactSubject}] ${inquiryText}`,
          senderRoleInput || 'General Inquirer'
        );
      }
      
      setSendingState(false);
      setSuccessSent(true);
      setInquiryName('');
      setInquiryEmail('');
      setInquiryText('');
      
      setTimeout(() => {
        setSuccessSent(false);
      }, 5000);
    }, 1200);
  };

  const activePlans = plans.filter(p => p.active);

  return (
    <div className="relative min-h-screen bg-bg-deep select-none overflow-x-hidden text-gray-200">
      {/* Dynamic Background Shader overlay */}
      <div className="absolute inset-0 z-0">
        <ShaderBackground opacity={0.45} />
      </div>

      {/* Decorative colored ambient backdrop spheres */}
      <div className="absolute top-[20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-primary/5 filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-secondary/5 filter blur-[120px] pointer-events-none" />

      <div className="relative z-10 font-sans">
        
        {/* Navigation Bar */}
        <nav className="border-b border-white/5 bg-bg-deep/70 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center">
                <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent tracking-widest font-mono">
                  diy<span className="text-secondary">o</span>
                </span>
                <span className="absolute -top-1 -right-4 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
              </div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-white/45 ml-4 border-l border-white/10 pl-4 py-1 sm:block hidden">
                Tactile Systems & UI
              </span>
              {kathmanduTime && (
                <div className="hidden lg:flex items-center gap-1.5 ml-3 bg-white/5 border border-white/10 rounded-full px-3 py-1 font-mono text-[10px] text-[#ffb68e]">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff7a18] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#ff7a18]"></span>
                  </span>
                  <span>KTM: {kathmanduTime} NST</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-8">
              <div className="hidden md:flex items-center gap-8 text-sm">
                <a href="#services" className="text-white/60 hover:text-white transition-colors cursor-pointer">Expertise</a>
                <a href="#projects" className="text-white/60 hover:text-white transition-colors cursor-pointer">Pipelines</a>
                <a href="#pricing" className="text-white/60 hover:text-white transition-colors cursor-pointer">transparent Execution</a>
                <a href="#onboard" className="text-white/60 hover:text-white transition-colors cursor-pointer">Onboard</a>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  id="nav-redeem-invitation"
                  onClick={() => setViews('invite-landing')}
                  className="px-3.5 py-2 rounded-lg text-xs font-mono tracking-wider bg-secondary/10 border border-secondary/20 hover:border-secondary/40 text-secondary hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Redeem Invitation
                </button>

                <button 
                  onClick={() => setViews('login')}
                  className="px-4 py-2 rounded-lg text-xs font-mono tracking-wider border border-white/10 hover:border-white/30 text-white/70 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5 text-primary" /> Admin Portal
                </button>
                
                <a 
                  href="#onboard" 
                  className="px-5 py-2 rounded-lg text-xs font-medium tracking-wider bg-gradient-to-r from-[#ff7a18] to-[#ffb68e] text-orange-950 font-mono hover:brightness-110 transition-all font-semibold flex items-center gap-1 cursor-pointer shadow-lg shadow-orange-500/10 sm:flex hidden"
                >
                  Apply Now <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

          </div>
        </nav>

        {/* Hero Section */}
        <header className="max-w-7xl mx-auto px-6 pt-16 pb-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-7 flex flex-col justify-center text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full w-fit mb-6">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#ffb68e]">
                Execution Q3 2026 Open
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight tracking-tight mb-6">
              Lighting digital <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-[#8bceff] ">
                possibilities.
              </span>
            </h1>

            <p className="text-gray-400 text-lg mb-8 max-w-xl leading-relaxed">
              We design and craft tactile React interfaces, custom high-performance shaders, and lightweight database layers synchronized with elite cloud architectures. Tailored for teams demanding pristine digital execution.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <a 
                href="#pricing"
                className="px-6 py-3.5 rounded-lg text-sm font-semibold tracking-wider bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all flex items-center gap-2 text-white cursor-pointer"
              >
                View Transparent Execution <ArrowRight className="w-4 h-4 text-primary" />
              </a>
              
              <div className="text-[11px] font-mono tracking-wide text-white/50 border-l border-white/10 pl-6 py-2">
                ACTIVE PIPELINES: <span className="text-white hover:text-[#ff7a18] transition-colors">{projects.length} VENTURES LIVE</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 flex justify-center items-center relative">
            {/* Spinning loop background effects */}
            <div className="absolute w-80 h-80 rounded-full bg-primary/5 filter blur-[80px]" />
            <ThreeJSFlame />
          </div>

        </header>

        {/* Client Features Segment (Expertise) */}
        <section id="services" className="border-t border-white/5 bg-white/[0.01] py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="mb-16 text-center max-w-2xl mx-auto">
              <span className="text-xs font-mono uppercase text-secondary tracking-widest block mb-3">Our Core Scope</span>
              <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Engineering Elite Experiences</h2>
              <p className="text-gray-400 mt-4">We bypass bloated agency layers to deliver direct developer craftsmanship.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Feature 1 */}
              <div className="p-8 rounded-2xl glass-card transition-all duration-300 hover:-translate-y-1 hover:border-white/15 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6">
                    <Cpu className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Tactile Web Architectures</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    Custom modular SPAs written using pristine React, Tailwind, and robust custom transitions. Zero bloat, responsive layout scales, and optimized startup bundles.
                  </p>
                </div>
                <div className="mt-8 pt-6 border-t border-white/5 text-[11px] font-mono text-white/40 tracking-wider">
                  FAST COMPRESSED ASSETS
                </div>
              </div>

              {/* Feature 2 */}
              <div className="p-8 rounded-2xl glass-card transition-all duration-300 hover:-translate-y-1 hover:border-white/15 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center mb-6">
                    <MonitorPlay className="w-6 h-6 text-secondary" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Ambient Graphics & Shaders</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    Interactive canvas elements running lightning-fast Fragment Shaders directly on client GPUs. Atmospheric visual elements that transform static marketing into absolute playgrounds.
                  </p>
                </div>
                <div className="mt-8 pt-6 border-t border-white/5 text-[11px] font-mono text-white/40 tracking-wider">
                  HIGH RES WEBGL RENDERERS
                </div>
              </div>

              {/* Feature 3 */}
              <div className="p-8 rounded-2xl glass-card transition-all duration-300 hover:-translate-y-1 hover:border-white/15 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-[#8bceff]/10 border border-[#8bceff]/20 flex items-center justify-center mb-6">
                    <Layers className="w-6 h-6 text-[#8bceff]" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Synchronized Cloud States</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    Modern full-stack cloud syncing with low-latency Firestore storage or SQLite caching. Secure, server-side encrypted token structures preserving enterprise validation.
                  </p>
                </div>
                <div className="mt-8 pt-6 border-t border-white/5 text-[11px] font-mono text-white/40 tracking-wider">
                  PERSISTENT CLIENT FLOWS
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Authentic Nepalese Cultural Heritage Concept Segment */}
        <section className="relative border-t border-white/5 bg-gradient-to-b from-black/20 to-black/40 py-20 overflow-hidden">
          {/* Ambient lighting backdrop */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[300px] bg-gradient-to-r from-primary/5 via-secondary/5 to-transparent filter blur-[100px] pointer-events-none" />
          
          <div className="max-w-7xl mx-auto px-6 relative z-10 font-sans">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              <div className="lg:col-span-4 flex justify-center">
                {/* Visual clay diyo lamp representation in modern vector/CSS */}
                <div className="relative w-48 h-48 rounded-full border border-white/10 flex items-center justify-center p-8 bg-[#120f13]/60 backdrop-blur shadow-2xl overflow-hidden group hover:border-[#ff7a18]/40 transition-all duration-500">
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-transparent opacity-50" />
                  
                  {/* Decorative Nepal Mandala circles */}
                  <div className="absolute w-36 h-36 rounded-full border border-dashed border-white/5 animate-[spin_120s_linear_infinite]" />
                  <div className="absolute w-28 h-28 rounded-full border border-white/5 animate-[spin_80s_linear_infinite_reverse]" />
                  
                  <div className="relative flex flex-col items-center justify-center">
                    {/* The Flame Symbol */}
                    <div className="w-10 h-16 bg-gradient-to-t from-[#ff4500] via-[#ff7a18] to-[#ffdd67] rounded-full filter blur-[1px] animate-pulse shadow-lg shadow-orange-500/50 flex items-center justify-center">
                      <div className="w-3 h-8 bg-white/45 rounded-full filter blur-[2px]" />
                    </div>
                    {/* Diyo Base Clay silhouette */}
                    <div className="h-6 w-16 bg-[#513629] rounded-b-full border-t-2 border-[#ff7a18]/50 mt-1 relative">
                      <div className="absolute -top-[3px] left-1/2 -translate-x-1/2 w-4 h-1 bg-[#ffdd67]/80 rounded-full" />
                    </div>
                    <span className="text-[11px] font-mono tracking-widest text-[#ffb68e] uppercase mt-3">दियो • DIYO</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-8 flex flex-col justify-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#ff7a18]/10 border border-primary/20 rounded-full w-fit mb-5">
                  <Sparkles className="w-3.5 h-3.5 text-secondary animate-pulse" />
                  <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-primary">Nepali Heritage & Craftsmanship</span>
                </div>
                
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-4">
                  Where Traditional Diyo Meets Digital Code
                </h2>
                
                <p className="text-gray-400 text-sm leading-relaxed mb-6">
                  In Nepal, a <span className="text-primary font-bold">दियो (Diyo)</span> is a traditional hand-crafted clay oil-lamp. Typically filled with mustard oil and cotton wicks, it is lit during auspicious festivals like Tihar to usher in brightness, hope, and knowledge while dispelling ignorance and darkness.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-gray-400 font-sans">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 shrink-0 flex items-center justify-center text-primary font-bold text-[14px]">
                      न
                    </div>
                    <div>
                      <h4 className="font-bold text-white mb-1">Authentic Values (नम्रता)</h4>
                      <p className="text-[11px] leading-relaxed">Pristine software execution with humility, directly linking the rich ancestral craftsmanship of Kathmandu to modern React architectures.</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 shrink-0 flex items-center justify-center text-secondary font-bold text-[14px]">
                      स
                    </div>
                    <div>
                      <h4 className="font-bold text-white mb-1">Sagarmatha Resilience</h4>
                      <p className="text-[11px] leading-relaxed font-sans">Engineering structures designed to scale and withstand high-peak client requirements with the absolute stability of the Himalayas.</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Selected Ventures / Live pipelines interactive showcase */}
        <section id="projects" className="border-t border-white/5 py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <span className="text-xs font-mono uppercase text-primary tracking-widest block mb-3">Live Ventures & Portfolios</span>
                <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Active Client Pipelines</h2>
              </div>
              <p className="text-gray-400 max-w-md">
                Click on any project milestone to inspect the underlying high-fidelity engineering stack and live progress validation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {projects.map((proj) => (
                <div 
                  key={proj.id}
                  onClick={() => setSelectedProject(proj)}
                  className="group relative p-6 rounded-2xl glass-card cursor-pointer hover:border-white/20 hover:bg-white/[0.02] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* Visual progress ring & identification initials */}
                    <div className="flex items-center justify-between mb-8">
                      <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-mono text-xs text-primary font-bold group-hover:text-white transition-colors">
                        {proj.prefix}
                      </div>

                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono bg-white/5 border border-white/10 text-white/80">
                        <Clock className="w-3 h-3 text-secondary" /> {proj.status}
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors mb-1">{proj.name}</h3>
                    <p className="text-xs text-white/50 mb-6">Client: {proj.client}</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs font-mono mb-2">
                      <span className="text-white/40">Build Stage Validation</span>
                      <span className="text-white/80">{proj.progress}%</span>
                    </div>
                    {/* Customized Progress Gauge */}
                    <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-primary to-secondary h-full rounded-full transition-all duration-1000"
                        style={{ width: `${proj.progress}%` }}
                      />
                    </div>
                    
                    <div className="mt-4 flex items-center justify-end text-xs text-primary/80 group-hover:text-primary gap-1 group-hover:translate-x-1.5 transition-all">
                      Diagnostics <Maximize2 className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Dynamic Project detailing modal */}
        {selectedProject && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-[100] p-6">
            <div className="w-full max-w-lg rounded-2xl bg-[#0f131d] border border-white/15 p-8 relative shadow-2xl overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full filter blur-xl pointer-events-none" />
              
              <button 
                onClick={() => setSelectedProject(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-mono text-lg font-bold text-[#ff7a18]">
                  {selectedProject.prefix}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">{selectedProject.name}</h3>
                  <p className="text-sm text-gray-400">Collaborator: {selectedProject.client}</p>
                </div>
              </div>

              <div className="space-y-4 border-t border-b border-white/5 py-6 my-6">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/50 font-mono">Current Status</span>
                  <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-mono text-secondary border border-white/10">{selectedProject.status}</span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/50 font-mono">Progress Milestone</span>
                  <span className="font-mono text-white font-bold">{selectedProject.progress}% Ready</span>
                </div>

                <div>
                  <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden mb-2">
                    <div className="bg-gradient-to-r from-primary to-[#ff7a18] h-full rounded-full" style={{ width: `${selectedProject.progress}%` }} />
                  </div>
                </div>

                <div className="text-xs text-gray-400 leading-relaxed mt-4">
                  This venture leverages our unified state persistence template. The dashboard triggers reactive state changes that render custom elements immediately. Currently under diagnostic testing cycle.
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button 
                  onClick={() => setSelectedProject(null)}
                  className="px-4 py-2 text-xs font-mono tracking-wider border border-white/10 hover:border-white/20 rounded-lg text-white/70 hover:text-white transition-colors cursor-pointer"
                >
                  Close Monitor
                </button>
                <a 
                  href="#onboard"
                  onClick={() => setSelectedProject(null)}
                  className="px-4 py-2 text-xs font-mono font-bold tracking-wider bg-primary text-orange-950 rounded-lg hover:brightness-110 transition-colors"
                >
                  Co-develop Similar
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Pricing Screen Titled "Transparent Execution" */}
        <section id="pricing" className="border-t border-white/5 bg-white/[0.005] py-24">
          <div className="max-w-7xl mx-auto px-6">
            
            <div className="mb-16 text-center max-w-2xl mx-auto">
              <span className="text-xs font-mono uppercase text-secondary tracking-widest block mb-3">Simple pricing ratios</span>
              <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Transparent Execution</h2>
              <p className="text-gray-400 mt-4 leading-relaxed">
                Direct subscription access. No negotiation stress. Scale up, halt, or transition plans at any time directly through client support.
              </p>

              {/* Unique Nepali Rupee & Global Currency Switching Widget */}
              <div className="mt-8 flex flex-col items-center justify-center gap-3">
                <div className="text-[10px] uppercase font-mono tracking-widest text-[#ffb68e] flex items-center gap-1.5 bg-white/5 border border-white/5 px-3 py-1 rounded-full">
                  <Sparkles className="w-3.5 h-3.5 text-secondary animate-pulse" /> Select Currency Engine
                </div>
                
                <div className="p-1.5 bg-black/40 border border-white/10 rounded-2xl inline-flex items-center gap-1 font-mono text-[10px] sm:text-xs">
                  <button
                    type="button"
                    onClick={() => setCurrencyMode('npr-traditional')}
                    className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer font-bold flex items-center gap-1.5 ${
                      currencyMode === 'npr-traditional'
                        ? 'bg-gradient-to-r from-primary to-[#ff7a18] text-orange-950 shadow-md shadow-orange-500/10'
                        : 'text-white/55 hover:text-white'
                    }`}
                  >
                    <span>रू NPR Devanagari</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrencyMode('npr-english')}
                    className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer font-bold flex items-center gap-1.5 ${
                      currencyMode === 'npr-english'
                        ? 'bg-gradient-to-r from-primary to-[#ff7a18] text-orange-950 shadow-md shadow-orange-500/10'
                        : 'text-white/55 hover:text-white'
                    }`}
                  >
                    <span>Rs. NPR English</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrencyMode('usd')}
                    className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer font-bold flex items-center gap-1.5 ${
                      currencyMode === 'usd'
                        ? 'bg-gradient-to-r from-primary to-[#ff7a18] text-orange-950 shadow-md shadow-orange-500/10'
                        : 'text-white/55 hover:text-white'
                    }`}
                  >
                    <span>$ USD Global</span>
                  </button>
                </div>
                
                <p className="text-[10px] text-white/30 font-mono mt-1 text-center">
                  * Grouped using the authentic Nepalese system <span className="text-white/40 font-bold">(Lakhs System - १,५०,०००)</span> rather than Western spacing.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
              {activePlans.map((plan) => {
                const isPopular = plan.popular;

                return (
                  <div 
                    key={plan.id}
                    className={`relative rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 ${
                      isPopular 
                        ? 'bg-gradient-to-b from-[#1b191c] to-[#0f131d] border-2 border-primary glow-orange' 
                        : 'glass-card'
                    }`}
                  >
                    {isPopular && (
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 rounded-full text-[10px] font-mono uppercase font-bold tracking-widest bg-gradient-to-r from-primary to-[#ff7a18] text-orange-950 shadow-md">
                        {plan.highlightBadge || 'Most Popular'}
                      </div>
                    )}

                    <div>
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <span className="text-xs font-mono uppercase tracking-widest text-[#ffb68e]">{plan.type}</span>
                          <h3 className="text-2xl font-bold text-white mt-1">{plan.name}</h3>
                        </div>
                      </div>

                      <div className="flex items-baseline gap-1.5 mb-6">
                        <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                          {currencyMode === 'usd' 
                            ? plan.price 
                            : currencyMode === 'npr-traditional' 
                              ? (plan.nprPrice || plan.price) 
                              : convertDevanagariToEnglishRupee(plan.nprPrice || plan.price)}
                        </span>
                        <span className="text-xs sm:text-sm text-[#ffb68e]/80 font-mono">
                          {currencyMode === 'usd' 
                            ? plan.period 
                            : currencyMode === 'npr-traditional' 
                              ? (plan.nprPeriod || plan.period) 
                              : getEnglishPeriod(plan.nprPeriod || plan.period)}
                        </span>
                      </div>

                      <p className="text-gray-400 text-sm leading-relaxed mb-8">{plan.description}</p>

                      <div className="border-t border-white/5 pt-6 mb-8 space-y-4">
                        {plan.features.map((feature, fIdx) => {
                          const isExcluded = feature.endsWith(':false');
                          let featureText = feature;
                          if (isExcluded) {
                            featureText = feature.substring(0, feature.lastIndexOf(':false'));
                          }

                          return (
                            <div key={fIdx} className="flex items-start gap-3 text-sm">
                              {isExcluded ? (
                                <>
                                  <X className="w-4 h-4 text-white/20 shrink-0 mt-0.5" />
                                  <span className="text-white/30 line-through">{featureText}</span>
                                </>
                              ) : (
                                <>
                                  <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                  <span className="text-gray-300">{featureText}</span>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-4">
                      <button 
                        onClick={() => handleSelectPlan(plan)}
                        className={`w-full py-3.5 rounded-xl text-xs font-bold tracking-wider font-mono transition-all duration-300 cursor-pointer ${
                          isPopular 
                            ? 'bg-gradient-to-r from-primary to-[#ff7a18] text-orange-950 hover:brightness-110 shadow-lg shadow-orange-500/15' 
                            : 'bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white'
                        }`}
                      >
                        {selectedPlanId === plan.id ? 'PLAN CURRENTLY SELECTED' : `SELECT THE ${plan.name.toUpperCase()} FLOW`}
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>

          </div>
        </section>

        {/* Integrated interactive onboarding & general correspondence lead capture */}
        <section id="onboard" className="border-t border-white/5 py-24 scroll-mt-20">
          <div id="onboard-anchor" className="max-w-4xl mx-auto px-6 font-sans">
            
            <div className="p-8 md:p-12 rounded-3xl glass-card relative overflow-hidden shadow-2xl">
              {/* background lighting accent */}
              <div className="absolute top-0 left-0 w-32 h-32 bg-[#ff7a18]/10 rounded-full filter blur-2xl pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#ffb68e]/5 rounded-full filter blur-3xl pointer-events-none" />
              
              <div className="relative z-10 max-w-2xl mx-auto">
                <div className="text-center mb-8">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-white/5 border border-white/10 text-primary mb-3">
                    <Sparkles className="w-3.5 h-3.5 text-secondary animate-pulse" /> Diyo Interactive Core
                  </span>
                  
                  <h2 className="text-3xl font-extrabold text-white tracking-tight">Connect with Diyo Developers</h2>
                  <p className="text-gray-400 mt-2 text-sm leading-relaxed">
                    Select a curated product strategy flow below or write to us for bespoke engineering and technical consulting.
                  </p>
                </div>

                {/* Sub-selector interactive tabs */}
                <div className="flex justify-center mb-10">
                  <div className="p-1 bg-[#0b0e17] border border-white/15 rounded-2xl inline-flex items-center gap-1 font-mono text-[10px] sm:text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveFormTab('onboard');
                        setSuccessSent(false);
                      }}
                      className={`px-4 sm:px-5 py-2.5 rounded-xl transition-all cursor-pointer font-bold flex items-center gap-2 ${
                        activeFormTab === 'onboard'
                          ? 'bg-gradient-to-r from-primary to-[#ff7a18] text-orange-950 shadow-md shadow-orange-500/10'
                          : 'text-white/50 hover:text-white'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 shrink-0" />
                      <span>Onboard Package (अनबोर्डिङ)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveFormTab('contact');
                        setSuccessSent(false);
                      }}
                      className={`px-4 sm:px-5 py-2.5 rounded-xl transition-all cursor-pointer font-bold flex items-center gap-2 ${
                        activeFormTab === 'contact'
                          ? 'bg-gradient-to-r from-primary to-[#ff7a18] text-orange-950 shadow-md shadow-orange-500/10'
                          : 'text-white/50 hover:text-white'
                      }`}
                    >
                      <Send className="w-3.5 h-3.5 shrink-0" />
                      <span>General Enquiry (सम्पर्क)</span>
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSubmitLead} className="space-y-6">
                  
                  {/* TAB 1: ONBOARDING SPECIFICS */}
                  {activeFormTab === 'onboard' && (
                    <div className="space-y-6 animate-fadeIn">
                      <div>
                        <label className="block text-xs font-mono uppercase tracking-widest text-white/55 mb-2.5">
                          Target Flow Pipeline (फ्लो चयन गर्नुहोस्)
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                          {plans.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => setSelectedPlanId(p.id)}
                              className={`p-3 rounded-xl border text-xs font-mono text-center tracking-wide transition-all ${
                                selectedPlanId === p.id 
                                  ? 'bg-primary/10 border-primary text-white shadow-md shadow-primary/5' 
                                  : 'bg-white/5 border-white/5 text-white/50 hover:text-white/85 hover:border-white/10'
                              }`}
                            >
                              <div className="font-bold text-[11px] truncate">{p.name}</div>
                              <div className="text-[10px] text-[#ffb68e] mt-1">
                                {currencyMode === 'usd' 
                                  ? p.price 
                                  : currencyMode === 'npr-traditional' 
                                    ? (p.nprPrice || p.price) 
                                    : convertDevanagariToEnglishRupee(p.nprPrice || p.price)}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-mono uppercase tracking-widest text-white/55 mb-2">
                          Your Professional Role / Designation (भूमिका)
                        </label>
                        <input 
                          type="text" 
                          required
                          value={senderRoleInput}
                          onChange={(e) => setSenderRoleInput(e.target.value)}
                          placeholder="e.g. Chief Product Officer, Founder, Tech Director"
                          className="w-full bg-[#0d101a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-primary transition-all font-sans"
                        />
                      </div>
                    </div>
                  )}

                  {/* TAB 2: GENERAL CONTACT CHANNEL */}
                  {activeFormTab === 'contact' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
                      <div>
                        <label className="block text-xs font-mono uppercase tracking-widest text-white/55 mb-2.5">
                          Inquiry Subject (सम्पर्क विषय)
                        </label>
                        <select
                          value={contactSubject}
                          onChange={(e) => setContactSubject(e.target.value)}
                          className="w-full bg-[#0d101a] border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-primary transition-all font-sans cursor-pointer"
                        >
                          <option value="General Conversation">General Chat (साधारण कुराकानी)</option>
                          <option value="Bespoke Software Build">Custom Software Build (विशिष्ट सफ्टवेयर)</option>
                          <option value="Strategic Partnership">Strategic Partnership (रणनीतिक साझेदारी)</option>
                          <option value="Remote Consulting">Remote Engineering Consulting (परामर्श)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-mono uppercase tracking-widest text-white/55 mb-2.5">
                          Inquirer Professional Role (भूमिका)
                        </label>
                        <select
                          value={senderRoleInput}
                          onChange={(e) => setSenderRoleInput(e.target.value)}
                          className="w-full bg-[#0d101a] border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-primary transition-all font-sans cursor-pointer"
                        >
                          <option value="Founder / VP">Founder / Chief Officer (संस्थापक / निर्देशक)</option>
                          <option value="Tech Principal">Product Manager / Advisor (उत्पादन प्रबन्धक)</option>
                          <option value="Staff Architect">Engineering Lead (वरिष्ठ इन्जिनियर)</option>
                          <option value="Technology Explorer">Technology Explorer (सृजनशील अन्वेषक)</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Standard Lead Coordinates (Always Required) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-widest text-white/55 mb-2">
                        Your Full Name (नाम)
                      </label>
                      <input 
                        type="text" 
                        required
                        value={inquiryName}
                        onChange={(e) => setInquiryName(e.target.value)}
                        placeholder="e.g. Nishant Aryal"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-primary transition-all font-sans"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-widest text-white/55 mb-2">
                        Secure Electronic Mail (इमेल)
                      </label>
                      <input 
                        type="email" 
                        required
                        value={inquiryEmail}
                        onChange={(e) => setInquiryEmail(e.target.value)}
                        placeholder="e.g. nishant@diyo.io"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-primary transition-all font-sans"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase tracking-widest text-white/55 mb-2">
                      {activeFormTab === 'onboard' ? 'Venture Scope Details (परियोजना विवरण)' : 'Inquiry Message Payload (सन्देश)'}
                    </label>
                    <textarea 
                      required
                      rows={4}
                      value={inquiryText}
                      onChange={(e) => setInquiryText(e.target.value)}
                      placeholder={
                        activeFormTab === 'onboard' 
                          ? "e.g. We are deploying an ultra-responsive client control application running customizable 3D graphics connected to secure local database systems..."
                          : "e.g. Namaste Diyo Team! We are interested in co-developing a reactive dashboard and custom WebGL layouts. We would love to discuss Sagarmatha Resilience parameters..."
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-primary transition-all font-sans resize-none"
                    />
                  </div>

                  {successSent && (
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm flex items-center gap-2.5 animate-fadeIn">
                      <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 animate-bounce" />
                      <div>
                        <strong>Inquiry Transmitted & Saved Successfully!</strong> This interactive form has registered a live message in your <strong>Client Intake Hub</strong> (Admin Console). Feel free to access the Admin Portal to review, reply, or manage.
                      </div>
                    </div>
                  )}

                  <button 
                    type="submit"
                    disabled={sendingState}
                    className="w-full py-4 rounded-xl text-xs font-mono tracking-widest bg-gradient-to-r from-primary to-[#ff7a18] text-orange-950 hover:brightness-110 active:scale-[0.99] font-extrabold transition-all duration-300 shadow-xl shadow-orange-500/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {sendingState ? (
                      'ESTABLISHING DISPATCH TRANSMISSION...'
                    ) : (
                      <>
                        {activeFormTab === 'onboard' ? 'TRANSMIT ONBOARD FLOW PROTOCOL' : 'DISPATCH GENERAL ENQUIRY MESSAGE'} <Send className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>

                </form>
              </div>

            </div>

          </div>
        </section>

        {/* Footer Area */}
        <footer className="border-t border-white/5 bg-bg-deep py-12 text-xs text-white/40">
          <div className="max-w-7xl mx-auto px-6 h-full flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <p className="font-mono text-[11px]">© 2026 DIYO DIGITAL INCORPORATED. ALL SYSTEMS OPTIONAL.</p>
              <p className="mt-1 text-white/20">Crafted in solid typescript, custom vector graphics pipeline, zero telemetry.</p>
            </div>
            
            <div className="flex gap-6 items-center">
              <button 
                onClick={() => setViews('login')}
                className="hover:text-white transition-colors cursor-pointer text-xs font-mono flex items-center gap-1.5"
              >
                [ Administrator Ingress ]
              </button>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
};

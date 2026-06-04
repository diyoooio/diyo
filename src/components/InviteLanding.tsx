import React, { useState, useEffect } from 'react';
import { useStorage } from './StorageContext';
import { ShaderBackground } from './ShaderBackground';
import { ThreeJSFlame } from './ThreeJSFlame';
import { 
  CheckCircle, 
  AlertTriangle, 
  ArrowRight, 
  Chrome, 
  Lock, 
  Mail, 
  User as UserIcon, 
  Sparkles,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const InviteLanding: React.FC = () => {
  const { 
    invitations, 
    projects,
    acceptInvitation, 
    activeInviteCode,
    setActiveInviteCode,
    setViews 
  } = useStorage();

  // Route Address bar state
  const [addressInput, setAddressInput] = useState(`https://diyo.com/invite/${activeInviteCode || 'ABCD1234XYZ'}`);
  const [currentCode, setCurrentCode] = useState(activeInviteCode || 'ABCD1234XYZ');

  // Registration Form states
  const [signUpMethod, setSignUpMethod] = useState<'social' | 'email'>('social');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientPassword, setClientPassword] = useState('');
  const [regError, setRegError] = useState('');
  const [authenticating, setAuthenticating] = useState(false);

  // Find invitation matching current code
  const invitation = invitations.find(i => i.invitationCode.toLowerCase() === currentCode.toLowerCase());

  // Sync clientPhone and password with invitation once loaded
  useEffect(() => {
    if (invitation) {
      if (invitation.phone) {
        setClientPhone(invitation.phone);
      }
      if (invitation.password) {
        setClientPassword(invitation.password);
      }
    }
  }, [invitation]);

  // Sync address bar input on activeInviteCode change 
  useEffect(() => {
    if (activeInviteCode) {
      setAddressInput(`https://diyo.com/invite/${activeInviteCode}`);
      setCurrentCode(activeInviteCode);
    }
  }, [activeInviteCode]);

  // Handle address bar simulation search
  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const match = addressInput.match(/\/invite\/([A-Za-z0-9_-]+)/i);
    if (match && match[1]) {
      setCurrentCode(match[1]);
      setActiveInviteCode(match[1]);
      setRegError('');
    } else {
      setRegError('Invalid URL format. Use pattern https://diyo.com/invite/CODE');
    }
  };

  // Perform client signup 
  const handleSignUp = (providerName: string) => {
    if (!invitation) return;
    
    if (invitation.status !== 'Pending') {
      setRegError('This invitation has already been accepted or is no longer pending.');
      return;
    }

    setAuthenticating(true);
    
    setTimeout(() => {
      // Create Client and Assign User profile
      const nameForAccount = clientName.trim() || invitation.email.split('@')[0].toUpperCase();
      const targetPassword = clientPassword.trim() || invitation.password;
      
      const success = acceptInvitation(currentCode, nameForAccount, clientPhone.trim() || undefined, targetPassword);
      setAuthenticating(false);

      if (!success) {
        setRegError('An unexpected error occurred assigning code channels.');
      }
    }, 1500);
  };

  const handleEmailSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!invitation) return;

    if (!clientName.trim()) {
      setRegError('Please supply your display name.');
      return;
    }

    if (!clientPassword || clientPassword.length < 5) {
      setRegError('Security password must contain at least 5 alphanumeric keys.');
      return;
    }

    handleSignUp('Email & Password');
  };

  return (
    <div className="relative min-h-screen bg-bg-deep flex flex-col font-sans select-none overflow-hidden">
      {/* Moving background shader */}
      <div className="absolute inset-0 z-0 opacity-20">
        <ShaderBackground opacity={0.3} />
      </div>

      <div className="absolute top-1/4 right-1/4 w-[35rem] h-[35rem] rounded-full bg-primary/5 filter blur-[120px] pointer-events-none" />

      {/* BROWSER ADDRESS BAR SIMULATOR MOCKUP */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 pt-6">
        <div className="bg-[#0b0e17] border border-white/10 rounded-2xl p-3 flex flex-col md:flex-row items-center gap-3 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="w-3 h-3 rounded-full bg-rose-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            <span className="text-white/20 text-xs ml-2 font-mono hidden sm:inline">diyo-core-sandbox</span>
          </div>

          <form onSubmit={handleAddressSubmit} className="flex-1 w-full flex items-center bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs">
            <Chrome className="w-3.5 h-3.5 text-white/40 shrink-0 mr-2" />
            <span className="text-white/30 mr-1 select-none font-mono hidden md:inline">URL:</span>
            <input 
              type="text"
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              className="flex-1 bg-transparent text-white focus:outline-none font-mono text-[11px] font-bold"
            />
            <button type="submit" className="px-2 py-0.5 bg-primary/20 text-primary rounded text-[9px] font-mono hover:bg-primary/30 font-bold transition-all shrink-0">
              NAVIGATE
            </button>
          </form>

          <button 
            onClick={() => setViews('public')} 
            className="text-xs font-mono text-white/50 hover:text-white px-3 py-1 cursor-pointer"
          >
            QUIT SIMULATOR
          </button>
        </div>
      </div>

      {/* CORE PORTAL CARD */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-xl">
          
          <AnimatePresence mode="wait">
            {invitation ? (
              <motion.div 
                key="invite-found"
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -10 }}
                className="rounded-3xl glass-card p-6 md:p-10 border border-white/10 glow-orange"
              >
                {/* Visual Header */}
                <div className="flex flex-col items-center text-center mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center overflow-hidden mb-4 relative shadow-inner">
                    <div className="scale-[0.38]">
                      <ThreeJSFlame />
                    </div>
                  </div>
                  
                  <h2 className="text-2xl font-black text-white tracking-tight uppercase font-mono">
                    diyo <span className="text-secondary font-sans normal-case italic font-medium">partnership welcome</span>
                  </h2>
                  <p className="text-[#edc157] text-xs font-mono mt-1 font-bold tracking-widest uppercase">
                    Secure Client Verification Tunnel
                  </p>
                </div>

                {/* Secure Invitation Status summary */}
                <div className="p-5 rounded-2xl bg-[#141b2a]/60 border border-white/5 space-y-3 mb-6 relative overflow-hidden text-xs">
                  <div className="absolute top-0 right-0 w-12 h-12 bg-primary/5 rounded-full filter blur-md" />
                  
                  <div className="flex justify-between items-center text-[10px] font-mono text-white/40 tracking-wider">
                    <span>PARTNERSHIP TETHER</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold font-mono ${
                      invitation.status === 'Pending' ? 'bg-orange-500/10 text-primary border border-primary/20' : 'bg-rose-500/10 text-rose-400'
                    }`}>
                      {invitation.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-mono text-white/35 uppercase">RECIPIENT EMAIL</p>
                      <p className="text-white font-bold font-sans truncate">{invitation.email}</p>
                    </div>

                    <div>
                      <p className="text-[10px] font-mono text-white/35 uppercase">SUBSCRIBED PLAN</p>
                      <p className="text-[#ff7a18] font-bold font-mono uppercase">{invitation.plan} Package</p>
                    </div>
                  </div>

                  {invitation.phone && (
                    <div className="border-t border-white/5 pt-3">
                      <p className="text-[10px] font-mono text-white/35 uppercase">REGISTERED PHONE</p>
                      <p className="text-white font-mono font-bold text-xs">{invitation.phone}</p>
                    </div>
                  )}

                  <div className="border-t border-white/5 pt-3">
                    <p className="text-[10px] font-mono text-white/35 uppercase">COLLABORATIVE VENTURE</p>
                    <p className="text-white font-bold leading-relaxed mt-0.5 font-sans">
                      {invitation.projectName || 'Diyo Custom Application Build'}
                    </p>
                  </div>

                  {invitation.customFeatures && invitation.customFeatures.length > 0 && (
                    <div className="border-t border-white/5 pt-3 space-y-1.5">
                      <p className="text-[10px] font-mono text-[#edc157] font-bold uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-secondary animate-pulse" /> Tailored Workspace Features:
                      </p>
                      <ul className="text-[11px] text-white/70 font-sans space-y-1 list-none p-1">
                        {invitation.customFeatures.map((feat, i) => (
                          <li key={i} className="flex items-start gap-1.5 leading-snug">
                            <span className="text-[#ff7a18] font-bold select-none">•</span>
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* SIGN UP CHOICE */}
                {invitation.status === 'Pending' ? (
                  <div className="space-y-6">
                    {/* Choose SignUp tab */}
                    <div className="grid grid-cols-2 gap-2 bg-[#090b16] p-1 rounded-xl border border-white/5">
                      <button 
                        onClick={() => setSignUpMethod('social')}
                        className={`py-2 rounded-lg text-xs font-mono uppercase ${signUpMethod === 'social' ? 'bg-white/5 text-white font-bold' : 'text-white/40 hover:text-white'}`}
                      >
                        Social Auth
                      </button>
                      <button 
                        onClick={() => setSignUpMethod('email')}
                        className={`py-2 rounded-lg text-xs font-mono uppercase ${signUpMethod === 'email' ? 'bg-white/5 text-white font-bold' : 'text-white/40 hover:text-white'}`}
                      >
                        Email Setup
                      </button>
                    </div>

                    {regError && (
                      <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl flex items-center gap-2 animate-fadeIn font-sans">
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>{regError}</span>
                      </div>
                    )}

                    {signUpMethod === 'social' ? (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <label className="block text-[10px] font-mono uppercase tracking-widest text-white/50">Your Professional Name</label>
                          <input 
                            type="text" 
                            placeholder=" Sarah Jenkins" 
                            value={clientName} 
                            onChange={(e) => setClientName(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-white/20 focus:outline-none focus:border-primary"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-[10px] font-mono uppercase tracking-widest text-[#ff7a18] font-bold">Contact Phone Number</label>
                          <input 
                            type="tel" 
                            placeholder="e.g. +977-9801234567" 
                            value={clientPhone} 
                            onChange={(e) => setClientPhone(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-white/20 focus:outline-none focus:border-primary font-mono text-xs"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                          <button 
                            disabled={authenticating}
                            onClick={() => handleSignUp('Google')}
                            className="py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-white/5 cursor-pointer disabled:opacity-50"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                              <path fill="#EA4335" d="M12 5.04c1.62 0 3.08.56 4.22 1.64l3.15-3.15C17.45 1.7 14.93 1 12 1 7.35 1 3.37 3.67 1.37 7.56l3.87 3C6.16 7.55 8.87 5.04 12 5.04z"/>
                              <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.43h6.44c-.28 1.47-1.11 2.71-2.36 3.55l3.66 2.84c2.14-1.97 3.38-4.88 3.38-8.48z"/>
                              <path fill="#FBBC05" d="M5.24 14.56c-.23-.69-.37-1.43-.37-2.19c0-.76.13-1.5.37-2.19L1.37 7.56C.49 9.3.01 11.23.01 13.26c0 2.03.48 3.96 1.36 5.7l3.87-3z"/>
                              <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.92l-3.66-2.84c-1.19.8-2.71 1.28-4.3 1.28c-3.13 0-5.84-2.51-6.76-5.52L1.37 15.7C3.37 19.59 7.35 23 12 23zm0-22c2.93 0 5.45.7 7.45 2.53l3.18-3.18C19.98.71 16.92 0 12 0c-4.65 0-8.63 3.41-10.63 7.3l3.87 3c.92-3.01 3.63-5.26 6.76-5.26z"/>
                            </svg>
                            Google Connect
                          </button>

                          <button 
                            disabled={authenticating}
                            onClick={() => handleSignUp('GitHub')}
                            className="py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-white/5 cursor-pointer disabled:opacity-50"
                          >
                            <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.435 9.8 8.205 11.385c.6.105.825-.255.825-.57c0-.285-.015-1.23-.015-2.235c-3.015.555-3.795-.735-4.035-1.41c-.135-.345-.72-1.41-1.23-1.695c-.42-.225-1.02-.78-.015-.795c.945-.015 1.62.87 1.845 1.23c1.08 1.815 2.805 1.305 3.495.99c.105-.78.42-1.305.765-1.605c-2.67-.3-5.46-1.335-5.46-5.925c0-1.305.465-2.385 1.23-3.225c-.12-.3-.54-1.53.12-3.18c0 0 1.005-.315 3.3 1.23c.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23c.66 1.65.24 2.88.12 3.18c.765.84 1.23 1.905 1.23 3.225c0 4.605-2.805 5.625-5.475 5.925c.435.375.81 1.095.81 2.22c0 1.605-.015 2.895-.015 3.3c0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
                            </svg>
                            GitHub OAuth
                          </button>

                          <button 
                            disabled={authenticating}
                            onClick={() => handleSignUp('Microsoft')}
                            className="py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-white/5 cursor-pointer disabled:opacity-50"
                          >
                            <svg className="w-4.5 h-4.5" viewBox="0 0 23 23">
                              <path fill="#f35325" d="M1 1h10v10H1V1z"/>
                              <path fill="#81bc06" d="M12 1h10v10H12V1z"/>
                              <path fill="#05a6f0" d="M1 12h10v10H1V12z"/>
                              <path fill="#ffba08" d="M12 12h10v10H12V12z"/>
                            </svg>
                            Microsoft ID
                          </button>

                          <button 
                            disabled={authenticating}
                            onClick={() => handleSignUp('Facebook')}
                            className="py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-white/5 cursor-pointer disabled:opacity-50"
                          >
                            <svg className="w-4.5 h-4.5 fill-[#1877F2]" viewBox="0 0 24 24">
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                            Facebook Connect
                          </button>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleEmailSignUpSubmit} className="space-y-4">
                        <div>
                          <label className="block text-[10px] font-mono uppercase tracking-widest text-[#ff7a18] font-bold mb-2">Contact Phone Number</label>
                          <div className="relative">
                            <input 
                              type="tel" 
                              placeholder="e.g. +977-9801234567" 
                              value={clientPhone} 
                              onChange={(e) => setClientPhone(e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-xs text-white focus:outline-none focus:border-primary font-mono text-[11px]"
                            />
                            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono uppercase tracking-widest text-white/55 mb-2">Display Name</label>
                          <div className="relative">
                            <input 
                              type="text" 
                              required
                              placeholder=" Sarah Jenkins" 
                              value={clientName} 
                              onChange={(e) => setClientName(e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-xs text-white placeholder-white/20 focus:outline-none focus:border-primary"
                            />
                            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono uppercase tracking-widest text-white/55 mb-2">Assign Cryptographic Password</label>
                          <div className="relative">
                            <input 
                              type="password" 
                              required
                              placeholder="Assemble password key" 
                              value={clientPassword} 
                              onChange={(e) => setClientPassword(e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-xs text-white placeholder-white/20 focus:outline-none focus:border-primary font-mono text-[11px]"
                            />
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
                          </div>
                        </div>

                        <button 
                          type="submit"
                          disabled={authenticating}
                          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-orange-950 font-black text-xs font-mono tracking-widest hover:brightness-110 transition-all cursor-pointer shadow-lg disabled:opacity-50"
                        >
                          {authenticating ? 'ENCRYPTING RECORDS...' : 'INITIALIZE CONNECTIVITY'}
                        </button>
                      </form>
                    )}

                    <div className="p-4 rounded-xl bg-white/[0.01] border border-white/5 text-[10px] text-white/40 flex gap-2 relative overflow-hidden">
                      <p className="font-mono text-primary font-bold">SECURITY:</p>
                      <p className="font-sans leading-relaxed">This secure environment validates cryptographic invite credentials. Google, GitHub and social configurations run strictly under sandbox parameters.</p>
                    </div>

                  </div>
                ) : (
                  <div className="py-8 text-center space-y-4">
                    <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
                    <h3 className="text-lg font-bold text-white">Invitation Already Redeemed</h3>
                    <p className="text-xs text-white/50 max-w-sm mx-auto">
                      This invitation token was accepted by client <strong>{invitation.email}</strong> on some earlier deployment run.
                    </p>
                    <button 
                      onClick={() => setViews('login')}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-mono select-none"
                    >
                      VISIT SECURED LOG-IN
                    </button>
                  </div>
                )}

              </motion.div>
            ) : (
              <motion.div 
                key="invite-not-found"
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -10 }}
                className="rounded-3xl glass-card p-6 md:p-10 border border-white/10 text-center space-y-6 glow-orange"
              >
                <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-extrabold text-white uppercase font-mono">Void Security Code: {currentCode}</h3>
                  <p className="text-xs text-white/45 max-w-sm mx-auto">
                    The requested invitation credentials mismatch or standard lifetime lapsed. Verify query parameters or request a new credentials file from diyo.
                  </p>
                </div>

                {invitations.length > 0 && (
                  <div className="bg-[#141b2a]/50 p-4 rounded-2xl border border-white/5 text-left space-y-3">
                    <p className="text-[9px] font-mono font-bold text-[#ffb68e] uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Sandbox Quick Test Keys
                    </p>
                    <p className="text-[10px] text-white/45">Use any of these pre-created sandbox invite codes for simulation click-testing:</p>
                    <div className="grid grid-cols-1 gap-1.5 max-h-24 overflow-y-auto">
                      {invitations.map((inv) => (
                        <button 
                          key={inv.invitationCode}
                          onClick={() => {
                            setActiveInviteCode(inv.invitationCode);
                          }}
                          className="px-3 py-2 bg-white/5 hover:bg-white/10 text-[10px] font-mono text-left text-white rounded-lg flex justify-between items-center transition-all cursor-pointer"
                        >
                          <span>{inv.invitationCode} • {inv.email}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold ${inv.status==='Pending'?'bg-orange-500/10 text-[#ffb68e]':'bg-white/10 text-white/50'}`}>{inv.status}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
};

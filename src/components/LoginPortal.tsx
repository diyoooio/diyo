import React, { useState } from 'react';
import { useStorage } from './StorageContext';
import { ShaderBackground } from './ShaderBackground';
import { ThreeJSFlame } from './ThreeJSFlame';
import { ArrowLeft, Lock, Mail, Eye, EyeOff, Sparkles, KeyRound, AlertCircle, Users } from 'lucide-react';

export const LoginPortal: React.FC = () => {
  const { loginAdmin, loginClient, clients, setViews } = useStorage();

  const [activeRole, setActiveRole] = useState<'admin' | 'client'>('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);

  const handleApplyDemoCredentials = (selectedEmail: string, selectedPass: string) => {
    setEmail(selectedEmail);
    setPassword(selectedPass);
    setErrorText('');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');

    if (!email) {
      setErrorText('Please supply your secure email endpoint.');
      return;
    }

    const trimmedEmail = email.trim();
    const trimmedPass = password.trim();

    if (activeRole === 'admin') {
      if (!password) {
        setErrorText('Please supply the authentication cryptokey.');
        return;
      }
      const isValid = 
        (trimmedEmail === 'admin@diyo.io' && trimmedPass === 'admin') ||
        (trimmedEmail === 'nishant@diyo' && trimmedPass === '001') ||
        (trimmedEmail === 'anuraj@diyo' && trimmedPass === '069');

      if (isValid) {
        setLoggingIn(true);
        setTimeout(() => {
          loginAdmin(trimmedEmail);
          setLoggingIn(false);
        }, 1000);
      } else {
        setIsShaking(true);
        setErrorText('Access Denied. Verification keys mismatch.');
        setTimeout(() => {
          setIsShaking(false);
        }, 500);
      }
    } else {
      // Client mode login
      if (!password) {
        setErrorText('Please supply your partner access password.');
        return;
      }
      setLoggingIn(true);
      setTimeout(() => {
        const success = loginClient(trimmedEmail, trimmedPass);
        setLoggingIn(false);
        if (!success) {
          setIsShaking(true);
          setErrorText('Authentication failed. No active registered client profile found for this email/password combination, or account is suspended.');
          setTimeout(() => {
            setIsShaking(false);
          }, 500);
        }
      }, 1000);
    }
  };

  return (
    <div className="relative min-h-screen bg-bg-deep flex items-center justify-center p-6 select-none overflow-hidden">
      {/* Underlying moving shader */}
      <div className="absolute inset-0 z-0">
        <ShaderBackground opacity={0.35} />
      </div>

      <div className="absolute top-1/4 left-1/4 w-[30rem] h-[30rem] rounded-full bg-[#ff7a18]/5 filter blur-[100px] pointer-events-none" />

      <div className={`relative z-10 w-full max-w-md transition-all duration-300 ${isShaking ? 'animate-[shake_0.4s_ease-in-out_infinite]' : ''}`}>
        
        {/* Back Link */}
        <button 
          onClick={() => setViews('public')}
          className="inline-flex items-center gap-2 text-white/50 hover:text-white mb-8 text-xs font-mono tracking-wider cursor-pointer transition-all hover:-translate-x-1"
        >
          <ArrowLeft className="w-4 h-4 text-primary" /> RETURN TO DIYO PUBLIC LANDING
        </button>

        {/* Login Container Shield */}
        <div className="rounded-3xl glass-card p-8 md:p-10 border border-white/10 glow-orange relative">
          
          {/* Flame Icon Indicator */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center overflow-hidden relative">
              <div className="scale-[0.38]">
                <ThreeJSFlame />
              </div>
            </div>
          </div>

          {/* Role Swapper Tabs */}
          <div className="grid grid-cols-2 gap-2 bg-white/[0.03] p-1.5 rounded-xl border border-white/5 mb-6">
            <button
              id="toggle-login-admin"
              type="button"
              onClick={() => {
                setActiveRole('admin');
                setEmail('');
                setPassword('');
                setErrorText('');
              }}
              className={`py-2 rounded-lg text-xs font-mono tracking-wider uppercase transition-all cursor-pointer ${
                activeRole === 'admin'
                  ? 'bg-primary/20 text-primary border border-primary/20 font-bold'
                  : 'text-white/40 hover:text-white hover:bg-white/[0.02]'
              }`}
            >
              Systems Owner
            </button>
            <button
              id="toggle-login-client"
              type="button"
              onClick={() => {
                setActiveRole('client');
                setEmail('');
                setPassword('');
                setErrorText('');
              }}
              className={`py-2 rounded-lg text-xs font-mono tracking-wider uppercase transition-all cursor-pointer ${
                activeRole === 'client'
                  ? 'bg-secondary/20 text-secondary border border-secondary/20 font-bold'
                  : 'text-white/40 hover:text-white hover:bg-white/[0.02]'
              }`}
            >
              Client Partner
            </button>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-2xl font-black text-white tracking-tight">
              {activeRole === 'admin' ? 'Operator Console' : 'Partner Portal'}
            </h2>
            <p className="text-white/40 text-[10px] font-mono mt-1 uppercase tracking-widest">
              {activeRole === 'admin' ? 'Administrator Verification Gate' : 'Secure Client Workspace Auth'}
            </p>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-5">
            
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-white/50 mb-2">
                Secure Email Endpoint
              </label>
              <div className="relative">
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={activeRole === 'admin' ? 'admin@diyo.io' : 'sarah@auroradigital.co'}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-primary transition-all font-sans"
                  required
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-white/50 mb-2">
                {activeRole === 'admin' ? 'Authentication Cryptokey' : 'Partner Access Password'}
              </label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={activeRole === 'admin' ? 'Enter security key' : 'Enter partner password'}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-12 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-primary transition-all font-sans"
                  required
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
                
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/35 hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {activeRole === 'client' && (
              <div className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl space-y-2">
                <p className="text-[10px] text-white/40 leading-relaxed font-mono text-center">
                  🔑 Secure partner authentication requires your administrator-provided email and workspace access password.
                </p>
              </div>
            )}

            {errorText && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorText}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loggingIn}
              className={`w-full py-3.5 rounded-xl text-xs font-mono tracking-widest bg-gradient-to-r text-orange-950 font-black hover:brightness-110 transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
                activeRole === 'admin' 
                  ? 'from-primary to-[#ff7a18] shadow-orange-500/10' 
                  : 'from-secondary to-[#ffb68e] shadow-amber-500/10'
              }`}
            >
              {loggingIn ? (
                'VERIFYING SECURITY TOKENS...'
              ) : (
                <>
                  {activeRole === 'admin' ? 'INITIALIZE DASHBOARD' : 'VERIFY & ENTER PORTAL'} <KeyRound className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Quick Demo Assist Links */}
            {activeRole === 'admin' ? (
              <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-1 mt-4">
                <span className="text-[9px] font-mono uppercase text-primary font-bold">Quick-entry Operator Credentials:</span>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() => handleApplyDemoCredentials('admin@diyo.io', 'admin')}
                    className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded font-mono text-[10px] text-white/70 transition-all cursor-pointer border border-white/5"
                  >
                    admin@diyo.io / admin
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-1 mt-4">
                <div className="flex items-center gap-1 text-[9px] font-mono uppercase text-secondary font-bold">
                  <Users className="w-3.5 h-3.5" />
                  <span>Verified Partner Accounts:</span>
                </div>
                <div className="flex flex-col gap-1 pt-1 max-h-32 overflow-y-auto">
                  {clients.length === 0 ? (
                    <span className="text-[10px] font-mono text-white/30">No registered partners. Redeem an invitation or define one in Admin dashboard.</span>
                  ) : (
                    clients.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleApplyDemoCredentials(c.email, c.password || '')}
                        className="w-full text-left p-1.5 bg-white/5 hover:bg-white/10 rounded font-mono text-[10px] text-white/80 transition-all cursor-pointer border border-white/5 flex justify-between items-center"
                      >
                        <span className="truncate">{c.name} ({c.email})</span>
                        <span className="text-secondary text-[9px] font-bold uppercase shrink-0 px-1 py-0.2 bg-secondary/10 rounded ml-1">{c.plan}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

          </form>

        </div>

      </div>
    </div>
  );
};

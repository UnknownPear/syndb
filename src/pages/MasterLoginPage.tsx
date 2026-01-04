import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from "react-router-dom";
// Assuming Aurora is in your utils folder as per your snippet
import Aurora from "../utils/Aurora"; 

// API Config
const API_BASE = (import.meta.env.VITE_API_URL || "/backend").replace(/\/$/, "");

export default function MasterLoginPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Design tokens
  const pal = {
    cardBg: "bg-slate-900/60", // Slightly darker for better contrast
    inputBg: "bg-slate-800/50",
    accent: "from-indigo-500 to-blue-600",
    border: "border-slate-700/50"
  };

  // --- HANDLER 1: Google Login (Primary) ---
  const handleGoogleSuccess = async (credentialResponse: any) => {
    setIsBusy(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/google-gatekeeper`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: credentialResponse.credential })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Access Denied");
      }

      const data = await res.json();
      localStorage.setItem("synergy_token", data.access_token);
      navigate("/hub");

    } catch (err: any) {
      console.error(err);
      setError("Google Authorization Failed");
      setIsBusy(false);
    }
  };

  // --- HANDLER 2: System Password (Fallback) ---
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    
    setIsBusy(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/auth/gatekeeper-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      if (!res.ok) {
        throw new Error("Invalid System Password");
      }

      const data = await res.json();
      localStorage.setItem("synergy_token", data.access_token);
      
      // Simulate small delay for animation smoothness
      setTimeout(() => navigate("/hub"), 500);

    } catch (err: any) {
      setError("Incorrect Password");
      setIsBusy(false);
      setPassword("");
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-slate-950 font-sans">
      
      {/* Background Layer */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
        {/* If Aurora isn't found, this gradient acts as fallback */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 to-slate-900"></div>
        <Aurora colorStops={["#6366f1", "#3b82f6", "#1e293b"]} speed={0.5} />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative z-10 w-full max-w-sm p-4`}
      >
        <div className={`backdrop-blur-xl ${pal.cardBg} rounded-3xl border ${pal.border} shadow-2xl overflow-hidden ring-1 ring-white/10`}>
          
          {/* Header */}
          <div className="pt-8 pb-6 px-8 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-blue-500/20 border border-indigo-500/30 mb-4 shadow-lg shadow-indigo-500/20">
              <ShieldCheck className="w-7 h-7 text-indigo-400" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Synergy Tools</h1>
            <p className="text-slate-400 text-xs mt-2 font-medium tracking-wide">SECURE WORKSPACE ACCESS</p>
          </div>

          <div className="px-8 pb-8 space-y-6">
            
            {/* 1. GOOGLE LOGIN */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-center w-full">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError("Google Connection Failed")}
                  theme="filled_black"
                  shape="pill"
                  width="280" // Matches standard width
                  size="large"
                  text="signin_with"
                />
              </div>
            </div>

            {/* Divider */}
            <div className="relative flex items-center">
              <div className="flex-grow border-t border-slate-700/50"></div>
              <span className="flex-shrink-0 mx-4 text-[10px] uppercase text-slate-500 font-semibold tracking-wider">Or using key</span>
              <div className="flex-grow border-t border-slate-700/50"></div>
            </div>

            {/* 2. PASSWORD FORM */}
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="System Password"
                    className={`w-full h-11 pl-10 pr-10 rounded-xl ${pal.inputBg} border ${pal.border} text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all`}
                    value={password}
                    onChange={(e) => { setError(null); setPassword(e.target.value); }}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="text-red-400 text-xs text-center font-medium bg-red-500/10 py-1.5 rounded-lg border border-red-500/20"
                >
                  {error}
                </motion.div>
              )}

              <button
                type="submit"
                disabled={isBusy || !password}
                className={`w-full h-11 relative overflow-hidden group rounded-xl bg-gradient-to-r ${pal.accent} text-white text-sm font-semibold shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <AnimatePresence mode="wait">
                  {isBusy ? (
                    <motion.div 
                      key="loading"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="flex items-center justify-center gap-2"
                    >
                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Verifying...</span>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="static"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="flex items-center justify-center gap-2"
                    >
                      <span>Unlock Hub</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="bg-slate-800/40 p-3 border-t border-slate-700/50 text-center backdrop-blur-md">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
              Authorized Personnel Only
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
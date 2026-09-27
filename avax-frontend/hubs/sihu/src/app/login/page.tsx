"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { generateTestnetWallet } from "@/services/hederaService";
import { Eye, EyeOff, Mail, Lock, ArrowLeft, Shield, RefreshCw } from "lucide-react";

type AuthMode = "social" | "email" | "admin" | "forgot";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("social");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Check if already authenticated
  useEffect(() => {
    if (typeof window !== "undefined") {
      const userSession = sessionStorage.getItem("sango_auth_user") || localStorage.getItem("sango_auth_user");
      if (userSession) router.replace("/portal");
      const adminAuth = sessionStorage.getItem("sango_admin_auth") === "true";
      if (adminAuth) router.replace("/admin");
    }
  }, [router]);

  /* ─── Social OAuth Simulation ─── */
  const handleSocial = async (provider: any) => {
    setLoading(provider);
    setError("");
    try {
      if (typeof window !== "undefined") {
        const dummyId = "soc_" + Math.random().toString(36).substring(2, 9);
        const userObj = {
          id: dummyId,
          email: `${provider}_user@sihu.local`,
          provider,
        };
        sessionStorage.setItem("sango_auth_user", JSON.stringify(userObj));
        localStorage.setItem("sango_auth_user", JSON.stringify(userObj));
        syncWallet(dummyId, userObj.email);
        router.replace("/portal");
      }
    } catch (e: any) {
      setError(e?.message || "Social sign-in failed.");
      setLoading(null);
    }
  };

  /* ─── Email Login ─── */
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading("email");
    setError("");
    try {
      if (!email || !password) {
        throw new Error("Please enter both email and password.");
      }
      const dummyId = "usr_" + btoa(email.toLowerCase()).replace(/[^a-zA-Z0-9]/g, "").slice(0, 12);
      const userObj = {
        id: dummyId,
        email,
      };
      if (typeof window !== "undefined") {
        sessionStorage.setItem("sango_auth_user", JSON.stringify(userObj));
        localStorage.setItem("sango_auth_user", JSON.stringify(userObj));
        syncWallet(dummyId, email);
      }
      router.replace("/portal");
    } catch (e: any) {
      setError(e?.message || "Login failed. Check your credentials.");
    } finally {
      setLoading(null);
    }
  };

  /* ─── Email Sign Up ─── */
  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading("signup");
    setError("");
    try {
      if (!email || !password) {
        throw new Error("Please enter both email and password.");
      }
      const dummyId = "usr_" + btoa(email.toLowerCase()).replace(/[^a-zA-Z0-9]/g, "").slice(0, 12);
      syncWallet(dummyId, email);
      setSuccess("Account created successfully! You can now log in.");
      setMode("email");
    } catch (e: any) {
      setError(e?.message || "Sign-up failed.");
    } finally {
      setLoading(null);
    }
  };

  /* ─── Forgot Password ─── */
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading("forgot");
    setError("");
    try {
      if (!email) {
        throw new Error("Please enter your email address.");
      }
      setSuccess("Password reset instructions sent! Check your inbox.");
    } catch (e: any) {
      setError(e?.message || "Failed to send reset email.");
    } finally {
      setLoading(null);
    }
  };

  /* ─── Admin Login ─── */
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email) { setError("Please enter your email."); return; }
    if (password === "sihuhub") {
      sessionStorage.setItem("sango_admin_auth", "true");
      sessionStorage.setItem("sango_admin_email", email);
      router.replace("/admin");
    } else {
      setError("Incorrect admin credentials.");
    }
  };

  /* ─── Wallet Sync ─── */
  const syncWallet = (userId: string, userEmail: string) => {
    if (typeof window === "undefined") return;
    const existing = localStorage.getItem(`sango_wallet_${userId}`);
    if (!existing) {
      const wallet = generateTestnetWallet();
      localStorage.setItem(`sango_wallet_${userId}`, JSON.stringify({
        id: userId,
        full_name: userEmail.split("@")[0],
        hedera_public_key: wallet.publicKeyStr,
        hedera_private_key: wallet.privateKeyStr,
        role: "user",
        updated_at: new Date().toISOString(),
      }));
    }
  };

  /* ─── Floating background blobs ─── */
  const blobs = [
    "absolute top-[-10%] left-[-5%] w-[320px] h-[320px] sm:w-[520px] sm:h-[520px] bg-blue-600/30 rounded-full blur-[90px] sm:blur-[120px]",
    "absolute bottom-[-10%] right-[-5%] w-[220px] h-[220px] sm:w-[360px] sm:h-[360px] md:w-[500px] md:h-[500px] bg-cyan-500/20 rounded-full blur-[70px] sm:blur-[90px] md:blur-[100px]",
    "absolute top-[40%] left-[50%] w-[180px] h-[180px] sm:w-[260px] sm:h-[260px] md:w-[300px] md:h-[300px] bg-indigo-600/10 rounded-full blur-[55px] sm:blur-[70px] md:blur-[80px]",
  ];

  return (
    <div className="min-h-screen bg-[#060D1A] flex items-center justify-center relative overflow-hidden p-4">
      {/* Blobs */}
      {blobs.map((cls, i) => <div key={i} className={cls} />)}

      {/* Back to home */}
      <Link href="/" className="absolute top-6 left-6 flex items-center gap-2 text-white/30 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors z-10">
        <ArrowLeft size={14} /> Home
      </Link>

      <div className="w-full max-w-[440px] relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 shadow-[0_0_40px_rgba(37,99,235,0.5)] mb-4">
            <span className="text-white font-black text-2xl">SH</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">SIHU Hub</h1>
          <p className="text-blue-400/60 text-xs font-bold uppercase tracking-[0.3em] mt-1">
            {mode === "social" && "Sign in or create your account"}
            {mode === "email" && "Email Authentication"}
            {mode === "admin" && "Admin Terminal Access"}
            {mode === "forgot" && "Password Recovery"}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-white/10 p-7 shadow-2xl"
             style={{ background: "linear-gradient(145deg, rgba(15,23,42,0.95), rgba(30,41,59,0.9))", backdropFilter: "blur(20px)" }}>

          {/* Error / Success messages */}
          {error && (
            <div className="mb-5 bg-red-500/10 border border-red-500/30 rounded-2xl p-3 text-xs text-red-400 font-bold text-center">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3 text-xs text-emerald-400 font-bold text-center">
              {success}
            </div>
          )}

          {/* ── SOCIAL MODE ── */}
          {mode === "social" && (
            <div className="flex flex-col gap-3">
              {/* Google */}
              <SocialButton
                icon={<GoogleIcon />}
                label="Continue with Google"
                color="bg-white hover:bg-slate-100 text-slate-900"
                onClick={() => handleSocial("google")}
                loading={loading === "google"}
              />
              {/* Facebook */}
              <SocialButton
                icon={<FacebookIcon />}
                label="Continue with Facebook"
                color="bg-[#1877F2] hover:bg-[#1877F2]/90 text-white"
                onClick={() => handleSocial("facebook")}
                loading={loading === "facebook"}
              />
              {/* X / Twitter */}
              <SocialButton
                icon={<TwitterXIcon />}
                label="Continue with X / Twitter"
                color="bg-black hover:bg-zinc-900 text-white border border-white/10"
                onClick={() => handleSocial("twitter")}
                loading={loading === "twitter"}
              />
              {/* Instagram */}
              <SocialButton
                icon={<InstagramIcon />}
                label="Continue with Instagram"
                color="text-white border border-white/10 hover:bg-white/5"
                gradient="linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)"
                onClick={() => handleSocial("instagram")}
                loading={loading === "instagram"}
              />

              <OrDivider />

              {/* Email Login */}
              <button
                onClick={() => { setMode("email"); setError(""); setSuccess(""); }}
                className="w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest text-white/60 border border-white/10 hover:bg-white/5 flex items-center justify-center gap-2 transition-all"
              >
                <Mail size={14} /> Sign In with Email
              </button>

              {/* Admin Terminal */}
              <button
                onClick={() => { setMode("admin"); setError(""); setSuccess(""); }}
                className="w-full py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-white/40 flex items-center justify-center gap-2 transition-all mt-1"
              >
                <Shield size={12} /> Admin Terminal Access
              </button>
            </div>
          )}

          {/* ── EMAIL MODE ── */}
          {mode === "email" && (
            <div>
              <form onSubmit={handleEmailLogin} className="flex flex-col gap-4 mb-4">
                <div>
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-widest px-1 mb-1.5 block">Email</label>
                  <div className="relative">
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                      placeholder="your@email.com"
                      className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 pl-10 text-sm text-white outline-none focus:border-blue-500/40 transition-all placeholder-white/20"
                    />
                    <Mail size={14} className="absolute left-3.5 top-4.5 text-white/20" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-widest px-1 mb-1.5 block">Password</label>
                  <div className="relative">
                    <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required
                      placeholder="••••••••"
                      className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 pl-10 pr-12 text-sm text-white outline-none focus:border-blue-500/40 transition-all placeholder-white/20"
                    />
                    <Lock size={14} className="absolute left-3.5 top-4.5 text-white/20" />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-4 text-white/20 hover:text-white">
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={!!loading}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30">
                  {loading === "email" ? <RefreshCw size={14} className="animate-spin" /> : null}
                  Sign In
                </button>
              </form>

              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                <button onClick={() => { setMode("forgot"); setError(""); setSuccess(""); }}
                  className="text-blue-400/60 hover:text-blue-400 transition-colors">Forgot Password</button>
                <button onClick={handleEmailSignUp}
                  className="text-emerald-400/60 hover:text-emerald-400 transition-colors">Create Account</button>
              </div>

              <OrDivider />
              <button onClick={() => { setMode("social"); setError(""); setSuccess(""); }}
                className="w-full py-3 text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-white/40 transition-colors text-center">
                ← Back to Social Login
              </button>
            </div>
          )}

          {/* ── FORGOT PASSWORD MODE ── */}
          {mode === "forgot" && (
            <div>
              <p className="text-xs text-white/40 mb-5 text-center leading-relaxed">
                Enter your email and we will send you a secure password-reset link.
              </p>
              <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
                <div className="relative">
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    placeholder="your@email.com"
                    className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 pl-10 text-sm text-white outline-none focus:border-blue-500/40 transition-all placeholder-white/20"
                  />
                  <Mail size={14} className="absolute left-3.5 top-4.5 text-white/20" />
                </div>
                <button type="submit" disabled={!!loading}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading === "forgot" ? <RefreshCw size={14} className="animate-spin" /> : null}
                  Send Reset Link
                </button>
              </form>
              <OrDivider />
              <button onClick={() => { setMode("email"); setError(""); setSuccess(""); }}
                className="w-full py-3 text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-white/40 transition-colors text-center">
                ← Back to Login
              </button>
            </div>
          )}

          {/* ── ADMIN MODE ── */}
          {mode === "admin" && (
            <div>
              <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-2xl p-3 mb-5">
                <Shield size={16} className="text-red-400 shrink-0" />
                <p className="text-[10px] text-red-400 font-bold uppercase leading-snug tracking-wider">
                  Restricted access. Authorized personnel only.
                </p>
              </div>
              <form onSubmit={handleAdminLogin} className="flex flex-col gap-4">
                <div className="relative">
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    placeholder="admin@sihuhub.com"
                    className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 pl-10 text-sm text-white outline-none focus:border-red-500/40 transition-all placeholder-white/20"
                  />
                  <Mail size={14} className="absolute left-3.5 top-4.5 text-white/20" />
                </div>
                <div className="relative">
                  <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required
                    placeholder="Master password"
                    className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 pl-10 pr-12 text-sm text-white outline-none focus:border-red-500/40 transition-all placeholder-white/20 font-mono"
                  />
                  <Lock size={14} className="absolute left-3.5 top-4.5 text-white/20" />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-4 text-white/20 hover:text-white">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <button type="submit"
                  className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-900/30">
                  <Shield size={14} strokeWidth={3} /> Unlock Admin Dashboard
                </button>
              </form>
              <OrDivider />
              <button onClick={() => { setMode("social"); setError(""); setSuccess(""); }}
                className="w-full py-3 text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-white/40 transition-colors text-center">
                ← Back to User Login
              </button>
            </div>
          )}
        </div>

        {/* Footer text */}
        <p className="text-center text-[9px] font-bold uppercase tracking-widest text-white/20 mt-6">
          Sango Information Hub • SIHU Ecosystem • Lake Victoria Basin
        </p>
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

function SocialButton({ icon, label, color, gradient, onClick, loading }: {
  icon: React.ReactNode;
  label: string;
  color: string;
  gradient?: string;
  onClick: () => void;
  loading?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={!!loading}
      className={`w-full py-3.5 rounded-2xl font-bold text-sm flex items-center gap-3 px-5 transition-all active:scale-95 disabled:opacity-60 ${color}`}
      style={gradient ? { background: gradient } : undefined}
    >
      {loading ? <RefreshCw size={18} className="animate-spin shrink-0" /> : <span className="shrink-0 w-5 flex">{icon}</span>}
      <span className="flex-1 text-left">{label}</span>
    </button>
  );
}

function OrDivider() {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-white/10" />
      <span className="text-[9px] font-black uppercase tracking-widest text-white/20">OR</span>
      <div className="flex-1 h-px bg-white/10" />
    </div>
  );
}

/* ─── Brand SVG Icons ─── */

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

function TwitterXIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  );
}

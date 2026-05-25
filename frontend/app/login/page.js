"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Check,
  ArrowLeft,
  X,
  ShieldCheck,
  User,
  Sparkles,
} from "lucide-react";
import { copyToClipboard } from "../utils/clipboard";
import { getApiUrl } from "@/app/utils/api";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Form State
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  // Lupa Password State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotResult, setForgotResult] = useState(null); // { temp_password, username }
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`${getApiUrl()}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Username atau password salah");
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      setShowModal(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    router.push("/");
  };

  // Lupa Password handlers
  const openForgotModal = (e) => {
    e.preventDefault();
    setForgotEmail("");
    setForgotError("");
    setForgotResult(null);
    setCopied(false);
    setShowForgotModal(true);
  };

  const closeForgotModal = () => {
    setShowForgotModal(false);
    setTimeout(() => {
      setForgotResult(null);
      setForgotEmail("");
      setForgotError("");
    }, 300);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setForgotError("Email wajib diisi.");
      return;
    }
    setForgotLoading(true);
    setForgotError("");

    try {
      const res = await fetch(
        `${getApiUrl()}/forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: forgotEmail.trim() }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Terjadi kesalahan.");
      }

      setForgotResult({
        message: data.message,
        dev_simulated: data.dev_simulated || false,
        reset_url: data.reset_url || "",
      });
    } catch (err) {
      setForgotError(err.message);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!forgotResult || !forgotResult.reset_url) return;
    const success = await copyToClipboard(forgotResult.reset_url);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-emerald-500/30">
      {/* ── Background Effects ── */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/login-bg.png"
          alt="Background"
          className="w-full h-full object-cover opacity-30 mix-blend-luminosity"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-zinc-950 via-zinc-950/90 to-emerald-950/20" />

        {/* Animated Glows */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-teal-500/10 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>

      {/* ── Login Container ── */}
      <div className="w-full max-w-[1000px] grid md:grid-cols-2 bg-zinc-900/40 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] overflow-hidden relative z-10">
        {/* Left Side: Branding & Visuals */}
        <div className="hidden md:flex flex-col justify-between p-12 relative overflow-hidden bg-emerald-500/5">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(16,185,129,0.1),transparent)]" />
          </div>

          <div className="relative z-10">
            <Link href="/" className="flex items-center group">
              <div className="relative w-48 h-14 group-hover:scale-105 transition-transform duration-500">
                <Image
                  src="/images/Logo-Bg-1-2.png"
                  alt="Satwa iD Logo"
                  fill
                  className="object-contain object-left"
                  priority
                />
              </div>
            </Link>
          </div>

          <div className="relative z-10 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles size={12} />
              Sahabat Fauna Indonesia
            </div>
            <h1 className="text-4xl font-black text-white leading-tight">
              Selamat Datang <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                di SatwaiD
              </span>
            </h1>
            <p className="text-zinc-400 text-lg leading-relaxed max-w-sm">
              Tempat terpercaya untuk jual beli satwa, perlengkapan, dan
              komunitas pecinta fauna.
            </p>
          </div>

          <div className="relative z-10 pt-8 border-t border-white/5">
            {/* <div className="flex -space-x-3">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="w-10 h-10 rounded-full border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center overflow-hidden">
                                    <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" />
                                </div>
                            ))}
                            <div className="w-10 h-10 rounded-full border-2 border-zinc-900 bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-zinc-950">
                                +2k
                            </div>
                        </div>
                        <p className="text-xs text-zinc-500 mt-3 font-medium">Bergabung dengan 2,000+ anggota aktif</p> */}
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="p-8 md:p-12 flex flex-col justify-center bg-black/20">
          <div className="mb-10">
            <div className="md:hidden mb-8">
              <Link href="/" className="flex items-center">
                <div className="relative w-40 h-12">
                  <Image
                    src="/images/Logo-Bg-1-2.png"
                    alt="Satwa iD Logo"
                    fill
                    className="object-contain object-left"
                  />
                </div>
              </Link>
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">
              Selamat Datang
            </h2>
            <p className="text-zinc-500">
              Masukkan akun Anda untuk melanjutkan akses penuh.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-sm animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                  <X size={16} />
                </div>
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">
                Username / Email
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-500 transition-colors">
                  <User size={20} />
                </div>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Username atau email"
                  required
                  className="w-full bg-white/5 border border-white/5 text-white rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:bg-white/10 transition-all placeholder:text-zinc-700"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                  Password
                </label>
                <button
                  type="button"
                  onClick={openForgotModal}
                  className="text-xs font-bold text-emerald-500 hover:text-emerald-400 transition-colors"
                >
                  Lupa Password?
                </button>
              </div>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-500 transition-colors">
                  <ShieldCheck size={20} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="w-full bg-white/5 border border-white/5 text-white rounded-2xl pl-12 pr-12 py-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:bg-white/10 transition-all placeholder:text-zinc-700"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full relative group overflow-hidden bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black py-4 rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-[45deg] -translate-x-[150%] group-hover:translate-x-[250%] transition-transform duration-1000" />
              <span className="flex items-center justify-center gap-2">
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                ) : (
                  "Masuk Sekarang"
                )}
              </span>
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-zinc-500 text-sm">
              Belum punya akun?{" "}
              <Link
                href="/register"
                className="text-white font-bold hover:text-emerald-400 transition-colors underline underline-offset-4 decoration-emerald-500/30"
              >
                Daftar Gratis
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* ── Modals ── */}

      {/* Success Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={handleCloseModal}
          />
          <div className="bg-zinc-900 border border-emerald-500/30 rounded-[2rem] p-10 max-w-sm w-full text-center relative z-10 animate-in zoom-in duration-300">
            <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-8 relative">
              <div className="absolute inset-0 rounded-full animate-ping bg-emerald-500/10" />
              <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-zinc-950">
                <Check size={32} strokeWidth={4} />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-white mb-3">
              Login Berhasil!
            </h3>
            <p className="text-zinc-400 mb-10 leading-relaxed">
              Selamat datang kembali di ekosistem reptil terbaik.
            </p>
            <button
              onClick={handleCloseModal}
              className="w-full bg-white text-zinc-950 font-black py-4 rounded-2xl hover:bg-emerald-500 transition-colors duration-300"
            >
              Lanjutkan
            </button>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
            onClick={closeForgotModal}
          />
          <div className="bg-zinc-900 border border-white/5 rounded-[2.5rem] w-full max-w-md relative z-10 overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center text-amber-500">
                  <KeyRound size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Lupa Password
                  </h3>
                  <p className="text-xs text-zinc-500">Reset akses akun Anda</p>
                </div>
              </div>
              <button
                onClick={closeForgotModal}
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8">
              {forgotResult ? (
                <div className="space-y-6 text-center">
                  <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 mx-auto">
                    <Check size={28} />
                  </div>
                  <div className="space-y-2">
                    <p className="text-white font-bold text-lg">
                      Instruksi Dikirim!
                    </p>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                      {forgotResult.message ||
                        "Tautan untuk mengatur ulang sandi Anda telah dikirim ke alamat email."}
                    </p>
                  </div>

                  {forgotResult.dev_simulated && (
                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl text-left space-y-3">
                      <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                        <Sparkles size={12} />
                        Mode Pengembangan (Simulasi)
                      </p>
                      <p className="text-zinc-500 text-xs leading-relaxed">
                        Sistem mendeteksi SMTP belum dikonfigurasi secara penuh
                        di file .env. Anda dapat menguji link reset langsung di
                        bawah ini:
                      </p>
                      <div className="flex gap-2">
                        <a
                          href={forgotResult.reset_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 text-center bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs py-2 px-3 rounded-xl transition-all"
                        >
                          Buka Link Reset
                        </a>
                        <button
                          onClick={handleCopy}
                          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${copied ? "bg-emerald-500 text-zinc-950" : "bg-white/5 text-zinc-400 hover:text-white"}`}
                        >
                          {copied ? "Tersalin!" : "Salin Link"}
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={closeForgotModal}
                    className="w-full bg-white/5 border border-white/5 text-white font-bold py-4 rounded-2xl hover:bg-white/10 transition-all"
                  >
                    Tutup
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">
                      Alamat Email
                    </label>
                    <div className="relative">
                      <Mail
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
                        size={20}
                      />
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => {
                          setForgotEmail(e.target.value);
                          setForgotError("");
                        }}
                        placeholder="nama@email.com"
                        required
                        className="w-full bg-white/5 border border-white/5 text-white rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all placeholder:text-zinc-700"
                      />
                    </div>
                    {forgotError && (
                      <p className="text-red-400 text-xs ml-1 font-medium">
                        {forgotError}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={closeForgotModal}
                      className="px-6 bg-white/5 text-white font-bold rounded-2xl hover:bg-white/10 transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading || !forgotEmail.trim()}
                      className="flex-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black py-4 rounded-2xl transition-all"
                    >
                      {forgotLoading ? "Memproses..." : "Reset Password"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

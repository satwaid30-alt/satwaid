"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Mail, KeyRound, Eye, EyeOff, User, Sparkles, X, CheckCircle2 } from "lucide-react";
import { getApiUrl } from "@/app/utils/api";

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`${getApiUrl()}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          role: "user",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Terjadi kesalahan saat mendaftar");
      }
      // Success, show modal
      setShowModal(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    router.push("/login");
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
          onError={(e) => {
            e.target.src = "https://images.unsplash.com/photo-1518558997970-4ddd2bb33ea0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-zinc-950 via-zinc-950/90 to-emerald-950/20" />

        {/* Animated Glows */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-teal-500/10 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>

      {/* Success Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md animate-in fade-in duration-300" onClick={handleCloseModal}></div>
          <div className="bg-zinc-900 border border-emerald-500/30 w-full max-w-sm rounded-[2.5rem] relative z-10 overflow-hidden animate-in zoom-in-95 duration-300 p-8 text-center">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-zinc-950">
                <CheckCircle2 size={24} />
              </div>
            </div>
            <h3 className="text-2xl font-black text-white mb-2">Pendaftaran Berhasil!</h3>
            <p className="text-zinc-400 font-medium mb-8">Akun Anda telah dibuat. Silakan login untuk melanjutkan perjalanan eksotis Anda.</p>
            <button onClick={handleCloseModal} className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black py-4 rounded-2xl transition-all">
              Ke Halaman Login
            </button>
          </div>
        </div>
      )}

      {/* ── Register Container ── */}
      <div className="w-full max-w-[1000px] grid md:grid-cols-2 bg-zinc-900/40 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] overflow-hidden relative z-10">
        {/* Left Side: Branding & Visuals */}
        <div className="hidden md:flex flex-col justify-between p-12 relative overflow-hidden bg-emerald-500/5">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(16,185,129,0.1),transparent)]" />
          </div>

          <div className="relative z-10">
            <Link href="/" className="flex items-center group">
              <div className="relative w-48 h-14 group-hover:scale-105 transition-transform duration-500">
                <Image src="/images/Logo-Bg-1-2.png" alt="Satwa iD Logo" fill className="object-contain object-left" priority />
              </div>
            </Link>
          </div>

          <div className="relative z-10 space-y-6">
            <h1 className="text-5xl font-black text-white leading-tight">
              Mulai <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Perjalanan </span> Hobi Anda
            </h1>
            <p className="text-zinc-400 text-lg leading-relaxed max-w-sm">Bergabunglah dengan ribuan pecinta fauna. Temukan satwa impian dan bertransaksi dengan aman di platform terpercaya.</p>
          </div>

          <div className="relative z-10 pt-8 border-t border-white/5">
            {/* <div className="flex -space-x-3">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="w-10 h-10 rounded-full border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center overflow-hidden">
                                    <img src={`https://i.pravatar.cc/100?img=${i + 20}`} alt="User" />
                                </div>
                            ))}
                            <div className="w-10 h-10 rounded-full border-2 border-zinc-900 bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-zinc-950">
                                +2k
                            </div>
                        </div>
                        <p className="text-xs text-zinc-500 mt-3 font-medium">Bergabung dengan 2,000+ anggota aktif</p> */}
          </div>
        </div>

        {/* Right Side: Register Form */}
        <div className="p-8 md:p-12 flex flex-col justify-center bg-black/20">
          <div className="mb-10">
            <div className="md:hidden mb-8">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-2xl font-bold text-white">
                  Dunia<span className="text-emerald-500">Reptil</span>
                </span>
              </Link>
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">Buat Akun Baru</h2>
            <p className="text-zinc-500">Silakan lengkapi data di bawah untuk mendaftar.</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-sm animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                  <X size={16} />
                </div>
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Username</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-500 transition-colors">
                  <User size={20} />
                </div>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Pilih username"
                  required
                  className="w-full bg-white/5 border border-white/5 text-white rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:bg-white/10 transition-all placeholder:text-zinc-700"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-500 transition-colors">
                  <Mail size={20} />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="nama@email.com"
                  required
                  className="w-full bg-white/5 border border-white/5 text-white rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:bg-white/10 transition-all placeholder:text-zinc-700"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Password</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-500 transition-colors">
                  <KeyRound size={20} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full bg-white/5 border border-white/5 text-white rounded-2xl pl-12 pr-12 py-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:bg-white/10 transition-all placeholder:text-zinc-700 font-mono"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-emerald-500 transition-colors">
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-4">
              {isLoading ? <div className="w-6 h-6 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" /> : "Daftar Sekarang"}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm font-medium text-zinc-500">
              Sudah punya akun?{" "}
              <Link href="/login" className="text-white hover:text-emerald-400 transition-colors font-bold">
                Masuk di sini
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

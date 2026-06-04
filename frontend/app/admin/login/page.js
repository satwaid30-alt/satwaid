"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, Eye, EyeOff, Loader2 } from "lucide-react";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Check if user has admin role
        if (data.user.role !== "admin") {
          setError("Akses ditolak. Anda tidak memiliki izin untuk mengakses Admin Portal.");
          setIsLoading(false);
          return;
        }

        localStorage.setItem("admin_token", data.token);
        localStorage.setItem("admin_user", JSON.stringify(data.user));
        router.push("/admin/dashboard");
      } else {
        setError(data.message || "Gagal masuk. Periksa kembali username dan password Anda.");
      }
    } catch (err) {
      setError("Tidak dapat terhubung ke server. Pastikan backend berjalan.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 selection:bg-emerald-500/30">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-zinc-900/50 backdrop-blur-2xl border border-zinc-800 rounded-[2.5rem] p-10 md:p-12 shadow-2xl shadow-emerald-500/5">
          <div className="text-center mb-8">
            <div className="w-48 h-28 mx-auto">
              <img src="/images/Logo-Bg-1-2.png" alt="SatwaiD Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Admin Portal</h1>
            <p className="text-zinc-400 font-medium">Masuk untuk mengelola konten SatwaiD</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-2xl text-sm font-semibold animate-shake">{error}</div>}

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-4">Username</label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-500 transition-colors">
                  <User size={20} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-2xl py-4 pl-14 pr-5 text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium"
                  placeholder="admin_reptile"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-4">Password</label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-500 transition-colors">
                  <Lock size={20} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-2xl py-4 pl-14 pr-14 text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium"
                  placeholder="••••••••"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors">
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/50 disabled:cursor-not-allowed text-zinc-950 font-black py-4 rounded-2xl transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98] flex items-center justify-center gap-3 text-lg">
              {isLoading ? <Loader2 size={24} className="animate-spin" /> : "Masuk Sekarang"}
            </button>
          </form>

          <p className="text-center mt-10 text-zinc-500 text-sm font-medium">
            Lupa akses?{" "}
            <a href="#" className="text-emerald-500 hover:text-emerald-400 underline decoration-2 underline-offset-4">
              Hubungi IT Developer
            </a>
          </p>
        </div>

        <p className="text-center mt-8 text-zinc-600 text-xs font-bold uppercase tracking-[0.2em]">&copy; 2026 SatwaiD Portal v1.0</p>
      </div>

      <style jsx global>{`
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-5px);
          }
          75% {
            transform: translateX(5px);
          }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out 0s 2;
        }
      `}</style>
    </div>
  );
}

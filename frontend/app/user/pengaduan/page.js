"use client";

import { Send, MessageSquare } from "lucide-react";

export default function PengaduanUserPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white mb-2">
          Pusat <span className="text-emerald-500">Pengaduan</span>
        </h1>
        <p className="text-zinc-400">Hubungi tim administrator terkait kendala transaksi, sistem marketplace, maupun laporan produk ilegal/berbahaya.</p>
      </div>

      {/* WhatsApp Support Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 mb-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none text-emerald-500">
          <MessageSquare size={200} />
        </div>
        <div className="flex items-center gap-5 z-10">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center border border-emerald-500/20 shrink-0 shadow-lg shadow-emerald-500/5">
            <MessageSquare size={32} />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">Hubungi Admin via WhatsApp</h2>
            <p className="text-zinc-400 text-xs md:text-sm mt-1 max-w-xl leading-relaxed">
              Punya kendala mendesak terkait transaksi, akun, atau sistem? Chat langsung dengan tim support kami melalui WhatsApp untuk penanganan dan respon yang lebih cepat.
            </p>
          </div>
        </div>
        <a 
          href="https://wa.me/6282240330951?text=Halo%20Admin%20SatwaiD,%20saya%20membutuhkan%20bantuan%20terkait..." 
          target="_blank" 
          rel="noopener noreferrer" 
          className="w-full md:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 active:scale-95 shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 shrink-0 uppercase tracking-wider text-xs"
        >
          <Send size={16} /> Chat Admin Sekarang
        </a>
      </div>
    </div>
  );
}

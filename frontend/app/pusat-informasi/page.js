"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { HelpCircle, ShieldCheck, FileText, Search, ChevronDown, MessageCircle, BookOpen, HeartHandshake, ArrowRight, ArrowLeft, ShieldAlert, AlertCircle, Scale, Lock, UserCheck, Info } from "lucide-react";

// FAQ Data structure
const FAQ_CATEGORIES = [
  { id: "semua", name: "Semua Kategori" },
  { id: "akun", name: "Akun & Keamanan" },
  { id: "transaksi", name: "Transaksi & Pembayaran" },
  { id: "lelang", name: "Lelang & Bidding" },
  { id: "toko", name: "Toko & Penjualan" },
];

const FAQ_ITEMS = [
  {
    category: "akun",
    question: "Bagaimana cara memverifikasi akun toko saya?",
    answer: "Untuk menjual satwa di SatwaiD, Anda wajib memverifikasi identitas. Buka dashboard akun Anda, pilih menu 'Profil Toko', masukkan alamat toko yang lengkap, nomor WhatsApp aktif, dan unggah foto KTP/Identitas resmi. Tim admin kami akan meninjau pengajuan Anda dalam waktu maksimal 1x24 jam.",
  },
  {
    category: "akun",
    question: "Apakah data KTP saya aman di SatwaiD?",
    answer:
      "Keamanan privasi Anda adalah prioritas kami. Semua berkas identitas yang diunggah dienkripsi menggunakan standar keamanan industri tingkat tinggi dan hanya digunakan untuk keperluan verifikasi kepatuhan hukum transaksi jual-beli hewan. Kami tidak akan pernah membagikan data pribadi Anda kepada pihak ketiga tanpa persetujuan eksplisit Anda.",
  },
  {
    category: "transaksi",
    question: "Bagaimana sistem pembayaran aman (Escrow/Rekber) bekerja?",
    answer:
      "Setiap transaksi di SatwaiD wajib menggunakan rekening bersama (escrow) resmi kami. Setelah pembeli memenangkan lelang atau membeli produk, mereka mengirim dana ke rekening SatwaiD. Kami akan menahan dana tersebut dengan aman dan memberi tahu penjual untuk segera mengirim hewan. Dana baru akan diteruskan ke saldo dompet penjual setelah pembeli mengonfirmasi bahwa hewan telah diterima dalam kondisi baik, atau setelah batas waktu otomatis 2x24 jam berakhir tanpa adanya komplain.",
  },
  {
    category: "transaksi",
    question: "Bagaimana jika hewan yang diterima mati atau sakit (DOA - Death on Arrival)?",
    answer:
      "Kami menerapkan garansi 'Death on Arrival' (DOA). Pembeli wajib merekam video unboxing utuh tanpa terputus/diedit sejak paket masih tersegel rapi sebagai bukti sah. Jika hewan terbukti mati atau sakit parah akibat pengiriman, pembeli dapat mengajukan 'Komplain' dalam waktu maksimal 2x24 jam sejak paket berstatus tiba. Dana escrow akan ditahan oleh admin dan kami akan memfasilitasi proses pengembalian dana (refund) penuh atau sebagian sesuai kesepakatan kedua belah pihak.",
  },
  {
    category: "lelang",
    question: "Apa perbedaan antara Bidding normal dan Buy It Now (BIN)?",
    answer:
      "Bidding normal adalah menawar produk lelang dengan kelipatan nominal tertentu sebelum waktu lelang habis. Sedangkan Buy It Now (BIN) adalah opsi untuk langsung membeli produk lelang tersebut secara instan tanpa menunggu waktu lelang berakhir, dengan membayar harga tetap (BIN Price) yang telah ditentukan oleh penjual sejak awal.",
  },
  {
    category: "lelang",
    question: "Apakah penawaran lelang (Bid) yang sudah dikirim bisa dibatalkan?",
    answer: "Tidak bisa. Setiap bid yang Anda kirimkan bersifat mengikat secara hukum di dalam platform kami. Tindakan membatalkan bid secara sepihak atau menolak membayar setelah memenangkan lelang (bid run/hit and run) akan dikenakan sanksi tegas berupa pembekuan akun secara permanen demi menjaga keadilan bagi para penjual.",
  },
  {
    category: "toko",
    question: "Satwa apa saja yang dilarang keras diperjualbelikan di SatwaiD?",
    answer:
      "Kami melarang keras penjualan semua jenis satwa liar yang dilindungi oleh undang-undang Indonesia (UU No. 5 Tahun 1990 & Permen LHK No. P.106/2018), satwa hasil selundupan ilegal, satwa eksotis langka internasional yang dilindungi CITES Appendix I, serta satwa dalam kondisi sakit parah atau cacat tanpa keterangan transparan. Tim kurator kami rutin meninjau dan menghapus setiap listing produk yang melanggar aturan ini secara instan.",
  },
  {
    category: "toko",
    question: "Berapa biaya administrasi yang dikenakan untuk setiap transaksi?",
    answer: "Untuk mendukung keberlangsungan platform dan pemeliharaan server transaksi yang aman, SatwaiD mengenakan biaya admin tetap sebesar Rp 5.000 untuk setiap invoice pembelian yang berhasil diselesaikan.",
  },
];

function PusatInformasiContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Derived State: Tab control directly derived from URL query parameters (no effect or state synchronization needed)
  const tabParam = searchParams.get("tab") || "bantuan";
  const activeTab = ["bantuan", "privasi", "syarat"].includes(tabParam) ? tabParam : "bantuan";

  // FAQ state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("semua");
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  const handleTabChange = (tabId) => {
    router.push(`/pusat-informasi?tab=${tabId}`, { scroll: false });
  };

  // Filter FAQ items
  const filteredFaqs = FAQ_ITEMS.filter((faq) => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "semua" || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-emerald-500 selection:text-zinc-950">
      {/* Premium Hero Header with dynamic glow */}
      <div className="relative overflow-hidden pt-20 pb-16 md:pt-28 md:pb-24 bg-gradient-to-b from-emerald-950/20 via-zinc-950 to-zinc-950">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute top-0 right-10 w-72 h-72 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none"></div>

        {/* Back Navigation Bar */}
        <div className="max-w-7xl mx-auto px-6 mb-8 flex justify-start relative z-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900/50 hover:bg-zinc-800/80 backdrop-blur-md border border-zinc-800/80 rounded-xl text-zinc-400 hover:text-white text-xs font-bold uppercase tracking-wider transition-all duration-200 active:scale-95 shadow-lg"
          >
            <ArrowLeft size={14} className="text-emerald-500" /> Kembali ke Beranda
          </Link>
        </div>

        <div className="max-w-7xl mx-auto px-6 text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <Info size={14} /> Pusat Informasi SatwaiD
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight uppercase max-w-4xl mx-auto leading-tight">
            Bagaimana Kami Bisa <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Membantu Anda?</span>
          </h1>
          <p className="text-zinc-400 text-sm md:text-lg max-w-2xl mx-auto leading-relaxed">Temukan panduan lengkap, regulasi platform, dan komitmen kami untuk menjaga keamanan transaksi hobi satwa kesayangan Anda.</p>
        </div>
      </div>

      {/* Tabs Navigation (Glassmorphic Bar) */}
      <div className="max-w-7xl mx-auto px-6 sticky top-20 z-40">
        <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 p-2 rounded-2xl md:rounded-3xl flex flex-col sm:flex-row items-center gap-2 max-w-3xl mx-auto shadow-2xl">
          {[
            { id: "bantuan", label: "Pusat Bantuan", icon: <HelpCircle size={18} /> },
            { id: "privasi", label: "Kebijakan Privasi", icon: <ShieldCheck size={18} /> },
            { id: "syarat", label: "Syarat Penggunaan", icon: <FileText size={18} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`w-full py-3.5 md:py-4 px-6 rounded-xl md:rounded-2xl text-xs md:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-3 transition-all ${
                activeTab === tab.id ? "bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/20 active:scale-95" : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 py-16 md:py-24">
        {/* ==================================================== */}
        {/* TAB 1: PUSAT BANTUAN (FAQ)                          */}
        {/* ==================================================== */}
        {activeTab === "bantuan" && (
          <div className="space-y-16 animate-in fade-in slide-in-from-bottom-6 duration-500">
            {/* Search Box & Category Filters */}
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" size={20} />
                <input
                  type="text"
                  placeholder="Cari pertanyaan Anda di sini... (misal: DOA, KTP, lelang)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 md:py-5 pl-14 pr-6 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium text-sm shadow-xl"
                />
              </div>

              {/* Category buttons */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                {FAQ_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setOpenFaqIndex(null);
                    }}
                    className={`px-4 py-2.5 rounded-xl border text-[10px] md:text-xs font-black uppercase tracking-wider transition-all ${selectedCategory === cat.id ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-zinc-900/50 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Accordion FAQ Grid */}
            <div className="max-w-4xl mx-auto space-y-4">
              {filteredFaqs.length > 0 ? (
                filteredFaqs.map((faq, index) => {
                  const isOpen = openFaqIndex === index;
                  return (
                    <div key={index} className={`bg-zinc-900/30 border rounded-2xl md:rounded-3xl overflow-hidden transition-all duration-300 ${isOpen ? "border-zinc-700 bg-zinc-900/50 shadow-2xl" : "border-zinc-800/80 hover:border-zinc-700"}`}>
                      <button onClick={() => setOpenFaqIndex(isOpen ? null : index)} className="w-full px-6 py-5 md:px-8 md:py-6 flex items-center justify-between text-left gap-4">
                        <span className="text-sm md:text-base font-black text-white group-hover:text-emerald-400 transition-colors">{faq.question}</span>
                        <div className={`w-8 h-8 rounded-lg bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center text-zinc-400 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180 text-emerald-400" : ""}`}>
                          <ChevronDown size={16} />
                        </div>
                      </button>

                      <div className={`transition-all duration-300 ease-in-out ${isOpen ? "max-h-[500px] border-t border-zinc-800" : "max-h-0"} overflow-hidden`}>
                        <div className="p-6 md:p-8 text-zinc-400 text-xs md:text-sm leading-relaxed font-medium text-justify bg-zinc-950/20">{faq.answer}</div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-20 text-center space-y-4 bg-zinc-900/10 border border-dashed border-zinc-800 rounded-3xl">
                  <AlertCircle size={48} className="text-zinc-600 mx-auto" />
                  <p className="text-zinc-500 font-bold text-sm">Maaf, kami tidak menemukan jawaban atas pertanyaan tersebut.</p>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("semua");
                    }}
                    className="text-emerald-500 text-xs font-black uppercase tracking-wider hover:underline"
                  >
                    Reset Pencarian
                  </button>
                </div>
              )}
            </div>

            {/* Direct Contact Admin (CTA Card) */}
            <div className="max-w-3xl mx-auto bg-gradient-to-r from-emerald-950/40 via-zinc-900/50 to-zinc-900 border border-emerald-500/20 rounded-[2.5rem] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden shadow-2xl">
              <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

              <div className="space-y-3 text-center md:text-left relative z-10">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[9px] font-black uppercase tracking-widest rounded-full border border-emerald-500/20">
                  <MessageCircle size={10} /> Layanan Pelanggan 24/7
                </div>
                <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">Masih butuh bantuan?</h3>
                <p className="text-zinc-400 text-xs md:text-sm font-medium leading-relaxed max-w-md">Apabila Anda mengalami kendala transaksi lelang, sengketa pengiriman, atau butuh bantuan mendesak, silakan hubungi tim CS resmi kami.</p>
              </div>

              <a
                href="https://wa.me/6282240330951?text=Halo%20Admin%20SatwaiD,%20saya%20membutuhkan%20bantuan%20terkait..."
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black rounded-2xl text-xs md:text-sm uppercase tracking-widest flex items-center gap-3 transition-all shrink-0 active:scale-95 shadow-xl shadow-emerald-500/10 z-10"
              >
                <MessageCircle size={16} /> Hubungi WhatsApp CS
              </a>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 2: KEBIJAKAN PRIVASI                            */}
        {/* ==================================================== */}
        {activeTab === "privasi" && (
          <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-500">
            {/* Header document metadata */}
            <div className="border-b border-zinc-800 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-2">
                <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-white">Kebijakan Privasi</h2>
                <p className="text-zinc-500 text-xs font-bold">Terakhir diperbarui: 24 Mei 2026</p>
              </div>
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20 w-fit">
                <Lock size={14} /> Dokumen Resmi & Terenkripsi
              </div>
            </div>

            {/* Document body content */}
            <div className="space-y-10 text-zinc-400 text-sm md:text-base leading-relaxed text-justify font-medium">
              <div className="space-y-4">
                <p>
                  Selamat datang di <strong>SatwaiD</strong>. Kami berkomitmen untuk melindungi dan menghormati data pribadi setiap pengguna kami (selanjutnya disebut &quot;Anda&quot;). Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menyimpan, menggunakan, mengolah, mentransfer, dan melindungi data pribadi Anda saat
                  menggunakan platform aplikasi, situs web, serta semua produk dan layanan yang kami tawarkan.
                </p>
                <p>Dengan mendaftar, mengakses, atau menggunakan layanan di SatwaiD, Anda dianggap telah membaca, memahami, dan menyetujui seluruh ketentuan pengolahan data pribadi Anda sebagaimana tercantum dalam Kebijakan Privasi ini.</p>
              </div>

              {/* Section 1 */}
              <div className="space-y-4 p-6 md:p-8 bg-zinc-900/30 border border-zinc-800 rounded-3xl">
                <h3 className="text-lg md:text-xl font-black uppercase tracking-tight text-white flex items-center gap-3">
                  <span className="text-emerald-500">1.</span> Informasi Yang Kami Kumpulkan
                </h3>
                <p>Kami mengumpulkan data pribadi tertentu dari Anda untuk mengoperasikan platform marketplace yang andal dan aman. Informasi tersebut meliputi:</p>
                <ul className="space-y-3 pl-4 list-none text-zinc-400">
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0 mt-2"></span>
                    <span>
                      <strong>Data Identitas Pribadi</strong>: Nama lengkap, nama pengguna (username), nomor kartu identitas (KTP/Passport) untuk keperluan verifikasi penjual, serta foto diri dengan KTP.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0 mt-2"></span>
                    <span>
                      <strong>Data Kontak</strong>: Alamat surel (email), nomor telepon/WhatsApp, alamat pengiriman fisik, dan provinsi/kota tinggal.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0 mt-2"></span>
                    <span>
                      <strong>Data Transaksi</strong>: Detail riwayat transaksi lelang atau pembelian langsung, metode pembayaran yang digunakan, bukti transfer pembayaran, data rekening bank, serta informasi saldo dompet internal.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0 mt-2"></span>
                    <span>
                      <strong>Data Teknis</strong>: Alamat IP (Internet Protocol), riwayat pencarian produk, riwayat bid lelang, data geolokasi perangkat, jenis browser, dan kuki (cookies) platform.
                    </span>
                  </li>
                </ul>
              </div>

              {/* Section 2 */}
              <div className="space-y-4">
                <h3 className="text-lg md:text-xl font-black uppercase tracking-tight text-white">2. Penggunaan Informasi Data Anda</h3>
                <p>Informasi yang kami kumpulkan dari Anda digunakan untuk beberapa tujuan utama, termasuk namun tidak terbatas pada:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="p-5 bg-zinc-900/10 border border-zinc-800/80 rounded-2xl space-y-2">
                    <h4 className="text-xs font-black uppercase text-emerald-400">Operasi & Layanan</h4>
                    <p className="text-xs text-zinc-500 leading-relaxed font-medium">Memproses pendaftaran akun, mengelola jalannya bid lelang, memfasilitasi rekber, dan mengamankan status pencairan dana.</p>
                  </div>
                  <div className="p-5 bg-zinc-900/10 border border-zinc-800/80 rounded-2xl space-y-2">
                    <h4 className="text-xs font-black uppercase text-emerald-400">Verifikasi & Keamanan</h4>
                    <p className="text-xs text-zinc-500 leading-relaxed font-medium">Mencegah penipuan identitas, mendeteksi akun ganda, memverifikasi kepatuhan hukum atas satwa yang dijual, dan menegakkan syarat penggunaan.</p>
                  </div>
                  <div className="p-5 bg-zinc-900/10 border border-zinc-800/80 rounded-2xl space-y-2">
                    <h4 className="text-xs font-black uppercase text-emerald-400">Dukungan Pelanggan</h4>
                    <p className="text-xs text-zinc-500 leading-relaxed font-medium">Menyediakan akses layanan pelanggan, merespons pertanyaan bantuan, dan menengahi sengketa komplain pengiriman hewan.</p>
                  </div>
                  <div className="p-5 bg-zinc-900/10 border border-zinc-800/80 rounded-2xl space-y-2">
                    <h4 className="text-xs font-black uppercase text-emerald-400">Komunikasi & Pemasaran</h4>
                    <p className="text-xs text-zinc-500 leading-relaxed font-medium">Mengirimkan notifikasi penting tentang transaksi, pembaruan keamanan, newsletter penawaran menarik, dan promosi platform.</p>
                  </div>
                </div>
              </div>

              {/* Section 3 */}
              <div className="space-y-4">
                <h3 className="text-lg md:text-xl font-black uppercase tracking-tight text-white">3. Perlindungan, Keamanan, & Penyimpanan Data</h3>
                <p>Kami mengambil langkah-langkah teknis, fisik, dan administratif yang wajar untuk melindungi data pribadi Anda dari akses yang tidak sah, kehilangan, perusakan, atau penyalahgunaan. Sistem basis data kami dilindungi oleh firewall yang ketat dan protokol enkripsi yang diperbarui secara rutin.</p>
                <p>Kami hanya menyimpan data pribadi Anda selama akun Anda aktif atau selama data tersebut diperlukan untuk penyediaan layanan hukum kami. Dokumen sensitif seperti KTP akan secara otomatis disamarkan (watermarked) secara digital saat proses pengunggahan di server kami.</p>
              </div>

              {/* Section 4 */}
              <div className="space-y-4">
                <h3 className="text-lg md:text-xl font-black uppercase tracking-tight text-white">4. Hak-Hak Anda sebagai Pengguna</h3>
                <p>Anda memiliki hak penuh atas data pribadi Anda yang tersimpan di platform kami. Anda berhak untuk:</p>
                <ul className="space-y-3 pl-4 list-none text-zinc-400">
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0 mt-2"></span>
                    <span>Mengakses, mengubah, atau memperbarui informasi profil akun Anda kapan saja melalui pengaturan aplikasi.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0 mt-2"></span>
                    <span>Mengajukan permohonan penutupan akun secara permanen. Setelah akun ditutup, kami akan menghapus atau menganonimkan data pribadi Anda sesuai dengan ketentuan hukum yang berlaku.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 3: SYARAT PENGGUNAAN                             */}
        {/* ==================================================== */}
        {activeTab === "syarat" && (
          <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-500">
            {/* Header document metadata */}
            <div className="border-b border-zinc-800 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-2">
                <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-white">Syarat Penggunaan</h2>
                <p className="text-zinc-500 text-xs font-bold">Terakhir diperbarui: 24 Mei 2026</p>
              </div>
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20 w-fit">
                <Scale size={14} /> Ketentuan Layanan Mengikat
              </div>
            </div>

            {/* Document body content */}
            <div className="space-y-10 text-zinc-400 text-sm md:text-base leading-relaxed text-justify font-medium">
              <div className="space-y-4">
                <p>
                  Syarat Penggunaan ini merupakan perjanjian hukum mengikat antara Anda sebagai pengguna dengan <strong>SatwaiD</strong>. Dengan mendaftar, mengunduh, menjelajahi, atau bertransaksi di platform kami, Anda secara otomatis menyetujui untuk terikat dengan seluruh syarat dan ketentuan yang diatur di bawah ini.
                </p>
                <p>Jika Anda tidak menyetujui sebagian atau seluruh isi dari Syarat Penggunaan ini, harap segera menghentikan akses dan penggunaan seluruh layanan yang tersedia di platform SatwaiD.</p>
              </div>

              {/* Section 1 */}
              <div className="space-y-4">
                <h3 className="text-lg md:text-xl font-black uppercase tracking-tight text-white">1. Ketentuan Umum Keanggotaan</h3>
                <ul className="space-y-3 pl-4 list-none text-zinc-400">
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0 mt-2"></span>
                    <span>
                      <strong>Batasan Usia</strong>: Pengguna wajib berusia minimal 17 tahun atau telah memiliki kartu identitas (KTP) resmi untuk dapat mendaftar dan bertransaksi di SatwaiD.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0 mt-2"></span>
                    <span>
                      <strong>Keaslian Data</strong>: Anda menjamin bahwa semua data yang Anda berikan selama pendaftaran akun adalah data yang benar, akurat, dan lengkap. Penggunaan data palsu merupakan pelanggaran hukum berat.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0 mt-2"></span>
                    <span>
                      <strong>Keamanan Akun</strong>: Anda bertanggung jawab penuh atas kerahasiaan kata sandi dan semua aktivitas yang terjadi di bawah nama pengguna Anda.
                    </span>
                  </li>
                </ul>
              </div>

              {/* Section 2 */}
              <div className="space-y-4 p-6 md:p-8 bg-zinc-900/30 border border-zinc-800 rounded-3xl">
                <h3 className="text-lg md:text-xl font-black uppercase tracking-tight text-white flex items-center gap-3">
                  <span className="text-emerald-500">2.</span> Peraturan Lelang & Bidding
                </h3>
                <p>SatwaiD memfasilitasi lelang Hewan online. Aturan ketat berikut berlaku bagi seluruh partisipan:</p>
                <ul className="space-y-3 pl-4 list-none text-zinc-400">
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0 mt-2"></span>
                    <span>
                      <strong>Bid Mengikat</strong>: Setiap bid yang dikirimkan oleh penawar (bidder) adalah tawaran yang mengikat secara sah. Pembatalan bid dengan alasan apa pun tidak diperkenankan.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0 mt-2"></span>
                    <span>
                      <strong>Sanksi Hit and Run (Bid Run)</strong>: Pemenang lelang yang menolak untuk melengkapi data pengiriman atau tidak melakukan pembayaran dalam waktu 1x24 jam akan dinyatakan melakukan pelanggaran berat. Akun pelanggar akan dibekukan secara permanen dan nomor teleponnya akan diblacklist dari platform.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0 mt-2"></span>
                    <span>
                      <strong>Kejujuran Lelang</strong>: Penjual dilarang keras melakukan manipulasi harga penawaran menggunakan akun palsu milik sendiri atau orang lain (shill bidding). Pelanggaran akan berakibat pada penutupan toko permanen.
                    </span>
                  </li>
                </ul>
              </div>

              {/* Section 3 */}
              <div className="space-y-4">
                <h3 className="text-lg md:text-xl font-black uppercase tracking-tight text-white">3. Kebijakan Kesejahteraan & Legalitas Satwa</h3>
                <p>Sebagai platform yang berdedikasi menjaga kelestarian hayati, kami menetapkan kebijakan nol-toleransi terhadap perdagangan satwa ilegal:</p>
                <ul className="space-y-3 pl-4 list-none text-zinc-400">
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0 mt-2"></span>
                    <span>Penjual hanya diperbolehkan mendaftarkan satwa hasil penangkaran legal (captive bred), satwa hobi eksotis yang tidak melanggar aturan negara, dan memiliki kondisi kesehatan yang prima.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0 mt-2"></span>
                    <span>Dilarang mendaftarkan spesies burung dilindungi, mamalia langka dilindungi, primata, jenis penyu laut, kucing hutan, atau reptil dilindungi yang diatur oleh undang-undang Indonesia.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0 mt-2"></span>
                    <span>Penjual bertanggung jawab atas kelayakan pengemasan paket pengiriman satwa (harus menggunakan wadah berventilasi cukup, kokoh, dan aman bagi satwa selama perjalanan).</span>
                  </li>
                </ul>
              </div>

              {/* Section 4 */}
              <div className="space-y-4">
                <h3 className="text-lg md:text-xl font-black uppercase tracking-tight text-white">4. Batasan Tanggung Jawab Platform</h3>
                <p>SatwaiD bertindak sebagai pihak ketiga penyedia platform perantara lelang dan escrow. Kami melakukan penyaringan identitas penjual secara berkala, namun kami tidak bertanggung jawab atas:</p>
                <ul className="space-y-3 pl-4 list-none text-zinc-400">
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0 mt-2"></span>
                    <span>Perselisihan kualitas fisik hewan yang dikirim di luar ketentuan deskripsi iklan asli penjual.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0 mt-2"></span>
                    <span>Keterlambatan atau kerusakan yang disebabkan oleh kelalaian pihak kurir pengiriman (kecuali diputuskan lain dalam komplain sengketa).</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0 mt-2"></span>
                    <span>Kerugian finansial akibat transaksi yang dilakukan di luar rekening escrow bersama resmi SatwaiD.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer-like subtle support notice */}
      <div className="bg-zinc-950 border-t border-zinc-900 py-12">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-4">
          <p className="text-zinc-600 text-xs font-semibold uppercase tracking-widest">SatwaiD Kepatuhan & Kepercayaan</p>
          <p className="text-zinc-500 text-xs max-w-lg mx-auto font-medium">Kami berkomitmen membangun ekosistem jual beli satwa yang aman, bertanggung jawab, dan sesuai dengan peraturan yang berlaku di Indonesia untuk mendukung hobi yang sehat dan terpercaya.</p>
        </div>
      </div>
    </div>
  );
}

export default function PusatInformasiPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-zinc-500 font-bold animate-pulse">Memuat Informasi...</p>
        </div>
      }
    >
      <PusatInformasiContent />
    </Suspense>
  );
}

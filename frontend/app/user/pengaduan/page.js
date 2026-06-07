"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, FileText, Send, Upload, Clock, CheckCircle2, Image as ImageIcon, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Trash2, Paperclip, Check, X, HelpCircle, MessageSquare } from "lucide-react";
import { io } from "socket.io-client";
import ActionModal from "@/components/ActionModal";
import { getApiUrl, getSocketUrl, getImageUrl } from "@/app/utils/api";
import ComplaintComments from "@/components/ComplaintComments";

export default function PengaduanUserPage() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Form State
  const [form, setForm] = useState({
    category: "sistem",
    title: "",
    description: "",
    attachment_url: "",
  });

  // Filter State
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, filterCategory]);

  // Expanded Complaint ID for detail view
  const [expandedId, setExpandedId] = useState(null);

  // Modal configuration
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
    onConfirm: null,
    confirmText: "Ya, Simpan",
    cancelText: "Batal",
    isLoading: false,
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user");
      const storedToken = localStorage.getItem("token");
      if (storedUser && storedToken) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setToken(storedToken);
      } else {
        setIsLoadingHistory(false);
      }
    }
  }, []);

  // Fetch complaints history
  const fetchHistory = async (userToken) => {
    try {
      setIsLoadingHistory(true);
      const res = await fetch(`${getApiUrl()}/complaints/user`, {
        headers: {
          Authorization: `Bearer ${userToken || token}`,
        },
      });
      if (res.ok) {
        const result = await res.json();
        setComplaints(result.data || []);
      }
    } catch (err) {
      console.error("Gagal mengambil riwayat pengaduan:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (token && user) {
      fetchHistory(token);

      // Connect to Socket.io for real-time status/response updates
      const socket = io(getSocketUrl(), {
        auth: { token },
      });

      socket.emit("join_user", user.id);

      socket.on("complaint_updated", (updatedData) => {
        // Auto update matching complaint in local state
        setComplaints((prevComplaints) => prevComplaints.map((item) => (item.id === updatedData.id ? { ...item, status: updatedData.status, admin_response: updatedData.admin_response, updated_at: new Date() } : item)));
      });

      socket.on("complaint_comment_added", (data) => {
        setComplaints((prevComplaints) =>
          prevComplaints.map((item) =>
            item.id === data.complaint_id
              ? { ...item, comments_count: (parseInt(item.comments_count) || 0) + 1 }
              : item
          )
        );
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [token, user]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // ── 1. Block dangerous extensions ─────────────────────────────────────────
    const blockedExtensions = [".php", ".exe", ".svg", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".pdf"];
    const fileName = file.name.toLowerCase();
    const fileExtension = fileName.substring(fileName.lastIndexOf("."));
    if (blockedExtensions.includes(fileExtension)) {
      setModalConfig({
        isOpen: true,
        type: "danger",
        title: "Format File Tidak Diperbolehkan",
        message: "File dengan format tersebut diblokir demi keamanan. Hanya diperbolehkan mengunggah file gambar (JPG, JPEG, PNG, WEBP, GIF).",
        onConfirm: null,
      });
      e.target.value = "";
      return;
    }

    // ── 2. Block dangerous & document MIME types ───────────────────────────────
    const blockedMime = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/x-php", "application/x-httpd-php", "text/x-php",
      "application/octet-stream", "image/svg+xml",
    ];
    if (blockedMime.includes(file.type)) {
      setModalConfig({
        isOpen: true,
        type: "danger",
        title: "Tipe File Tidak Diperbolehkan",
        message: "Tipe file tersebut diblokir demi keamanan. Hanya diperbolehkan mengunggah file gambar (JPG, JPEG, PNG, WEBP, GIF).",
        onConfirm: null,
      });
      e.target.value = "";
      return;
    }

    // ── 3. Validate allowed image MIME types ───────────────────────────────────
    const allowedMime = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!allowedMime.includes(file.type)) {
      setModalConfig({
        isOpen: true,
        type: "danger",
        title: "Format Tidak Didukung",
        message: "Hanya diperbolehkan mengunggah file gambar (JPG, JPEG, PNG, WEBP, GIF).",
        onConfirm: null,
      });
      e.target.value = "";
      return;
    }

    // ── 4. Validate size limit: max 1MB ────────────────────────────────────────
    const MAX_FILE_SIZE = 1024 * 1024; // 1 MB
    if (file.size > MAX_FILE_SIZE) {
      setModalConfig({
        isOpen: true,
        type: "warning",
        title: "Ukuran File Terlalu Besar",
        message: "Ukuran lampiran bukti maksimal adalah 1 MB. Silakan pilih file yang lebih kecil.",
        onConfirm: null,
      });
      e.target.value = "";
      return;
    }

    // ── 5. Rename file secara acak sebelum upload ─────────────────────────────
    setIsUploading(true);
    const randomString = Math.random().toString(36).substring(2, 15);
    const randomFilename = `${Date.now()}_complaint_${randomString}${fileExtension}`;
    const renamedFile = new File([file], randomFilename, { type: file.type });

    const formData = new FormData();
    formData.append("image", renamedFile);

    try {
      const response = await fetch(`${getApiUrl()}/upload`, {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (response.ok) {
        setForm({ ...form, attachment_url: result.url });
      } else {
        setModalConfig({
          isOpen: true,
          type: "danger",
          title: "Gagal Mengunggah",
          message: result.message || "Gagal mengunggah lampiran gambar.",
          onConfirm: null,
        });
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      setModalConfig({
        isOpen: true,
        type: "danger",
        title: "Kesalahan Koneksi",
        message: "Terjadi kesalahan saat mengunggah lampiran.",
        onConfirm: null,
      });
    } finally {
      setIsUploading(false);
    }
  };


  const handleRemoveAttachment = () => {
    setForm({ ...form, attachment_url: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setModalConfig({
        isOpen: true,
        type: "warning",
        title: "Sesi Berakhir",
        message: "Silakan login terlebih dahulu untuk mengirim pengaduan.",
        onConfirm: () => (window.location.href = "/login"),
      });
      return;
    }

    if (!form.description.trim()) {
      setModalConfig({
        isOpen: true,
        type: "warning",
        title: "Form Belum Lengkap",
        message: "Deskripsi pengaduan wajib diisi.",
        onConfirm: null,
      });
      return;
    }

    setModalConfig({
      isOpen: true,
      type: "save",
      title: "Kirim Pengaduan?",
      message: "Apakah Anda yakin ingin mengirim laporan pengaduan ini ke admin?",
      confirmText: "Ya, Kirim",
      cancelText: "Batal",
      onConfirm: executeSubmit,
    });
  };

  const executeSubmit = async () => {
    setModalConfig((prev) => ({ ...prev, isLoading: true }));
    setIsSubmitting(true);

    try {
      const payload = {
        ...form,
        title: form.description.length > 60 ? form.description.substring(0, 60).trim() + "..." : form.description.trim()
      };

      const response = await fetch(`${getApiUrl()}/complaints`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        setForm({
          category: "sistem",
          title: "",
          description: "",
          attachment_url: "",
        });

        // Refresh history
        await fetchHistory(token);

        setModalConfig({
          isOpen: true,
          type: "success",
          title: "Laporan Dikirim",
          message: "Laporan pengaduan Anda berhasil dikirim ke admin.",
          onConfirm: null,
        });
      } else {
        throw new Error(result.message || "Gagal mengirim pengaduan.");
      }
    } catch (error) {
      console.error("Error submitting complaint:", error);
      setModalConfig({
        isOpen: true,
        type: "danger",
        title: "Gagal Mengirim",
        message: error.message || "Terjadi kesalahan saat mengirim pengaduan.",
        onConfirm: null,
      });
    } finally {
      setIsSubmitting(false);
      setModalConfig((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Filter complaints list
  const filteredComplaints = complaints.filter((item) => {
    const matchesStatus = filterStatus === "all" || item.status === filterStatus;
    const matchesCategory = filterCategory === "all" || item.category === filterCategory;
    return matchesStatus && matchesCategory;
  });

  const totalItems = filteredComplaints.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedComplaints = filteredComplaints.slice(startIndex, endIndex);

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-bold rounded-full uppercase tracking-wider">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
            Menunggu
          </span>
        );
      case "processing":
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-bold rounded-full uppercase tracking-wider">
            <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-pulse" />
            Diproses
          </span>
        );
      case "resolved":
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-full uppercase tracking-wider">
            <Check size={12} />
            Selesai
          </span>
        );
      default:
        return null;
    }
  };

  const getCategoryName = (cat) => {
    switch (cat) {
      case "sistem":
        return "Sistem / Bug";
      case "produk":
        return "Laporan Produk";
      case "lainnya":
        return "Lainnya";
      default:
        return cat;
    }
  };

  const getCategoryBadgeColor = (cat) => {
    switch (cat) {
      case "sistem":
        return "bg-rose-500/10 border-rose-500/30 text-rose-400";
      case "produk":
        return "bg-indigo-500/10 border-indigo-500/30 text-indigo-400";
      default:
        return "bg-zinc-500/10 border-zinc-500/30 text-zinc-400";
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return (
      date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }) + " WIB"
    );
  };

  return (
    <div>
      {/* Global Action Modal */}
      <ActionModal isOpen={modalConfig.isOpen} onClose={() => setModalConfig({ ...modalConfig, isOpen: false })} onConfirm={modalConfig.onConfirm} type={modalConfig.type} title={modalConfig.title} message={modalConfig.message} confirmText={modalConfig.confirmText} cancelText={modalConfig.cancelText} isLoading={modalConfig.isLoading} />

      <div className="mb-8">
        <h1 className="text-3xl font-black text-white mb-2">
          Pusat <span className="text-emerald-500">Pengaduan</span>
        </h1>
        <p className="text-zinc-400">Hubungi tim administrator terkait kendala transaksi, sistem marketplace, maupun laporan produk ilegal/berbahaya.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* FORM SECTION (Left Side) */}
        <div className="lg:col-span-5 bg-transparent sm:bg-zinc-900 border-0 sm:border border-zinc-800 rounded-none sm:rounded-xl p-0 sm:p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-24 h-1" />
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <AlertTriangle className="text-emerald-500" size={20} />
            Buat Laporan Baru
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-zinc-300">Kategori Laporan</label>
              <select name="category" value={form.category} onChange={handleChange} className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-medium text-sm">
                <option value="sistem">Sistem / Kendala Website / Bug</option>
                <option value="produk">Masalah Produk / Penjual</option>
                <option value="lainnya">Lainnya / Pertanyaan Umum</option>
              </select>
            </div>


            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-zinc-300">Deskripsi / Detail Masalah</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={5}
                placeholder="Jelaskan secara kronologis kendala yang Anda alami. Tuliskan ID Pesanan jika berkaitan dengan transaksi tertentu."
                className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-medium text-sm placeholder-zinc-650 resize-none"
              />
            </div>

            {/* File Attachment Upload */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-zinc-300 flex justify-between items-center">
                <span>Foto Bukti / Tangkapan Layar</span>
                <span className="text-xs text-zinc-500">Maks. 1 MB</span>
              </label>

              {form.attachment_url ? (
                <div className="relative border border-zinc-800 rounded-xl overflow-hidden group bg-zinc-950">
                  <img src={getImageUrl(form.attachment_url)} alt="Bukti Lampiran" className="w-full h-48 object-cover opacity-80" />
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <button type="button" onClick={handleRemoveAttachment} className="p-3 bg-red-500/90 hover:bg-red-600 text-white rounded-full font-bold">
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ) : (
                <label className="w-full border-2 border-dashed border-zinc-800 hover:border-emerald-500/50 rounded-xl py-6 flex flex-col items-center justify-center cursor-pointer hover:bg-emerald-500/5">
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <svg className="animate-spin h-8 w-8 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Sedang Mengunggah...</span>
                    </div>
                  ) : (
                    <>
                      <Upload size={32} className="text-zinc-500 group-hover:text-emerald-500 mb-2" />
                      <span className="text-sm font-bold text-zinc-300">Pilih atau Seret Foto</span>
                      <span className="text-[11px] text-zinc-500 mt-1 uppercase font-semibold">Format: JPG, PNG, WEBP (Maks. 1MB)</span>
                    </>
                  )}
                  <input type="file" className="hidden" accept="image/*" disabled={isUploading} onChange={handleFileUpload} />
                </label>
              )}
            </div>

            <button type="submit" disabled={isSubmitting || isUploading} className={`w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black rounded-xl flex items-center justify-center gap-2 ${isSubmitting || isUploading ? "opacity-70 cursor-not-allowed" : ""}`}>
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Mengirim Laporan...</span>
                </>
              ) : (
                <>
                  <Send size={18} />
                  Kirim Pengaduan
                </>
              )}
            </button>
          </form>
        </div>

        {/* HISTORY SECTION (Right Side) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-transparent sm:bg-zinc-900 border-0 sm:border border-zinc-800 rounded-none sm:rounded-xl p-0 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-zinc-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FileText className="text-emerald-500" size={20} />
                Riwayat Pengaduan
              </h2>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs font-bold rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500">
                  <option value="all">Semua Kategori</option>
                  <option value="sistem">Sistem</option>
                  <option value="produk">Produk</option>
                  <option value="lainnya">Lainnya</option>
                </select>

                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs font-bold rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500">
                  <option value="all">Semua Status</option>
                  <option value="pending">Menunggu</option>
                  <option value="processing">Diproses</option>
                  <option value="resolved">Selesai</option>
                </select>
              </div>
            </div>

            {isLoadingHistory ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <svg className="animate-spin h-10 w-10 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="text-zinc-500 text-sm font-bold uppercase tracking-wider">Memuat riwayat pengaduan...</span>
              </div>
            ) : filteredComplaints.length === 0 ? (
              <div className="py-20 text-center space-y-4">
                <div className="w-16 h-16 bg-zinc-950 text-zinc-600 rounded-2xl flex items-center justify-center mx-auto border border-zinc-800">
                  <HelpCircle size={32} />
                </div>
                <div className="space-y-1">
                  <p className="text-white font-bold">Tidak Ada Riwayat Pengaduan</p>
                  <p className="text-zinc-500 text-xs">Anda belum pernah mengajukan pengaduan atau filter yang aktif tidak membuahkan hasil.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {paginatedComplaints.map((item) => (
                    <div key={item.id} className="bg-transparent sm:bg-zinc-950 border-0 border-b sm:border border-zinc-800 rounded-none py-5 sm:p-5">
                      {/* Header info */}
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`px-2.5 py-0.5 border text-[10px] font-bold rounded-md uppercase tracking-wider ${getCategoryBadgeColor(item.category)}`}>{getCategoryName(item.category)}</span>
                            <span className="text-[11px] text-zinc-500 font-semibold">{formatDate(item.created_at)}</span>
                          </div>
                          <h3 className="text-md font-bold text-white leading-tight">{item.title}</h3>
                        </div>
                        <div>{getStatusBadge(item.status)}</div>
                      </div>

                      {/* Complaint snippet & attachment */}
                      <div className="text-zinc-400 text-sm leading-relaxed mb-4 whitespace-pre-line">
                        {expandedId === item.id ? (
                          <>
                            <p>{item.description}</p>
                            {item.attachment_url && (
                              <div className="mt-4 border border-zinc-800 rounded-lg overflow-hidden max-w-sm bg-zinc-900">
                                <p className="text-xs text-zinc-500 px-3 py-2 border-b border-zinc-800 font-bold flex items-center gap-1.5 bg-zinc-950">
                                  <Paperclip size={12} /> Lampiran Bukti
                                </p>
                                <a href={getImageUrl(item.attachment_url)} target="_blank" rel="noreferrer" className="block relative">
                                  <img src={getImageUrl(item.attachment_url)} alt="Lampiran" className="w-full h-auto object-cover max-h-60" />
                                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs font-bold gap-1">
                                    <ImageIcon size={14} /> Lihat Gambar Penuh
                                  </div>
                                </a>
                              </div>
                            )}
                          </>
                        ) : (
                          <p>{item.description.length > 150 ? `${item.description.substring(0, 150)}...` : item.description}</p>
                        )}
                      </div>

                      {/* Action Row: Balas Chat & Detail Toggle */}
                      <div className="flex items-center justify-between border-t border-zinc-800/65 pt-3 mt-3.5 mb-2.5">
                        <button
                          onClick={() => toggleExpand(item.id)}
                          type="button"
                          className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-lg text-xs font-bold"
                        >
                          <MessageSquare size={13} className="text-blue-400" />
                          <span>Balas Chat</span>
                          <span className="bg-zinc-950 px-1.5 py-0.5 rounded-md text-[10px] text-zinc-500 font-bold">
                            {item.comments_count || 0}
                          </span>
                        </button>

                        <button
                          onClick={() => toggleExpand(item.id)}
                          type="button"
                          className="flex items-center gap-1 text-xs text-emerald-500 hover:text-emerald-400 font-bold uppercase tracking-wider"
                        >
                          {expandedId === item.id ? (
                            <>
                              Sembunyikan <ChevronUp size={14} />
                            </>
                          ) : (
                            <>
                              Detail <ChevronDown size={14} />
                            </>
                          )}
                        </button>
                      </div>

                      {/* Admin Response (Legacy) & Complaint Chat Thread */}
                      {expandedId === item.id && (
                        <div className="space-y-4 mt-2">
                          {item.admin_response && (
                            <div className="border border-zinc-800 bg-zinc-950/40 rounded-xl p-4">
                              <div className="flex items-center gap-1.5 text-xs font-black text-amber-500 uppercase tracking-wider mb-1.5">
                                <CheckCircle2 size={14} />
                                Tanggapan Administrator Utama (Legacy)
                              </div>
                              <p className="text-zinc-400 text-xs leading-relaxed whitespace-pre-line">{item.admin_response}</p>
                            </div>
                          )}
                          <div>
                            <ComplaintComments complaintId={item.id} isAdminPage={false} />
                          </div>
                        </div>
                      )}

                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-zinc-800/65">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs font-bold rounded-xl hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft size={14} />
                      Sebelumnya
                    </button>

                    <div className="flex items-center gap-1.5">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-9 h-9 flex items-center justify-center text-xs font-bold rounded-xl border ${
                            currentPage === page
                              ? "bg-emerald-500 border-emerald-500 text-zinc-950"
                              : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs font-bold rounded-xl hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Berikutnya
                      <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

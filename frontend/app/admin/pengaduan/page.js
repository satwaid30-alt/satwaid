"use client";

import { useState, useEffect } from "react";
import { 
  Search, 
  Filter, 
  CheckCircle2, 
  MessageSquare, 
  Paperclip, 
  AlertTriangle, 
  User, 
  Clock, 
  ExternalLink, 
  ShieldAlert, 
  Check, 
  X, 
  Eye,
  Mail,
  Phone,
  Image as ImageIcon
} from "lucide-react";
import { io } from "socket.io-client";
import ActionModal from "@/components/ActionModal";
import { getApiUrl, getSocketUrl, getImageUrl } from "@/app/utils/api";
import ComplaintComments from "@/components/ComplaintComments";

export default function AdminPengaduanPage() {
  const [complaints, setComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Selected complaint for drawer/modal
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [responseForm, setResponseForm] = useState({
    status: "",
    admin_response: ""
  });
  const [isSavingResponse, setIsSavingResponse] = useState(false);

  // Alert State
  const [alertInfo, setAlertInfo] = useState({ show: false, message: "", type: "success" });

  // Confirmation Modal
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

  const showAlert = (message, type = "success") => {
    setAlertInfo({ show: true, message, type });
    setTimeout(() => {
      setAlertInfo((prev) => ({ ...prev, show: false }));
    }, 5000);
  };

  const fetchComplaints = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("admin_token");
      const res = await fetch(`${getApiUrl()}/complaints`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : ""
        }
      });
      const result = await res.json();
      if (res.ok) {
        setComplaints(result.data || []);
      } else {
        showAlert(result.message || "Gagal memuat pengaduan.", "error");
      }
    } catch (err) {
      console.error("Error fetching complaints:", err);
      showAlert("Terjadi kesalahan koneksi saat mengambil data.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();

    // Setup Socket.IO for real-time notifications
    const token = localStorage.getItem("admin_token");
    if (token) {
      const socket = io(getSocketUrl(), {
        auth: { token }
      });

      socket.emit("join_admin");

      // Real-time listener for incoming complaints
      socket.on("new_complaint", (data) => {
        showAlert(`Pengaduan baru masuk: "${data.title}"`, "success");
        // Refetch to get complete data with user object
        fetchComplaints();
      });

      // Real-time status update from other admins
      socket.on("complaint_status_changed", (data) => {
        setComplaints((prev) =>
          prev.map((item) =>
            item.id === data.id ? { ...item, status: data.status } : item
          )
        );
      });

      return () => {
        socket.disconnect();
      };
    }
  }, []);

  const handleOpenDetail = (complaint) => {
    setSelectedComplaint(complaint);
    setResponseForm({
      status: complaint.status,
      admin_response: complaint.admin_response || ""
    });
  };

  const handleCloseDetail = () => {
    setSelectedComplaint(null);
  };

  const handleResponseChange = (e) => {
    setResponseForm({ ...responseForm, [e.target.name]: e.target.value });
  };

  const handleSaveResponse = (e) => {
    e.preventDefault();
    setModalConfig({
      isOpen: true,
      type: "save",
      title: "Simpan Tanggapan?",
      message: "Apakah Anda yakin ingin memperbarui status/tanggapan pengaduan ini?",
      confirmText: "Ya, Simpan",
      cancelText: "Batal",
      onConfirm: executeSaveResponse,
    });
  };

  const executeSaveResponse = async () => {
    if (!selectedComplaint) return;
    setModalConfig((prev) => ({ ...prev, isLoading: true }));
    setIsSavingResponse(true);

    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`${getApiUrl()}/complaints/${selectedComplaint.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify(responseForm)
      });

      const result = await response.json();

      if (response.ok) {
        // Update local list
        setComplaints((prev) =>
          prev.map((item) =>
            item.id === selectedComplaint.id
              ? { ...item, status: responseForm.status, admin_response: responseForm.admin_response, updated_at: new Date() }
              : item
          )
        );

        // Update selected complaint view
        setSelectedComplaint((prev) => ({
          ...prev,
          status: responseForm.status,
          admin_response: responseForm.admin_response
        }));

        setModalConfig({
          isOpen: true,
          type: "success",
          title: "Tanggapan Disimpan",
          message: "Status pengaduan dan tanggapan berhasil disimpan.",
          onConfirm: null,
        });
      } else {
        throw new Error(result.message || "Gagal menyimpan tanggapan.");
      }
    } catch (error) {
      console.error("Error saving response:", error);
      setModalConfig({
        isOpen: true,
        type: "danger",
        title: "Gagal Menyimpan",
        message: error.message || "Terjadi kesalahan saat menyimpan tanggapan.",
        onConfirm: null,
      });
    } finally {
      setIsSavingResponse(false);
      setModalConfig((prev) => ({ ...prev, isLoading: false }));
    }
  };

  // Filters and search query handling
  const filteredComplaints = complaints.filter((item) => {
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;

    // Search query matches title, reporter name, or reporter username
    const reporterName = item.user?.name || "";
    const reporterUsername = item.user?.username || "";
    const complaintTitle = item.title || "";
    const matchesSearch = 
      reporterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reporterUsername.toLowerCase().includes(searchQuery.toLowerCase()) ||
      complaintTitle.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesCategory && matchesSearch;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-bold rounded-full uppercase tracking-wider w-fit">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
            Menunggu
          </span>
        );
      case "processing":
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-bold rounded-full uppercase tracking-wider w-fit">
            <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-pulse" />
            Diproses
          </span>
        );
      case "resolved":
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-full uppercase tracking-wider w-fit">
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
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }) + " WIB";
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Global Action Modal */}
      <ActionModal 
        isOpen={modalConfig.isOpen} 
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })} 
        onConfirm={modalConfig.onConfirm} 
        type={modalConfig.type} 
        title={modalConfig.title} 
        message={modalConfig.message} 
        confirmText={modalConfig.confirmText} 
        cancelText={modalConfig.cancelText} 
        isLoading={modalConfig.isLoading} 
      />

      {/* Floating Alert Alert */}
      {alertInfo.show && (
        <div className={`fixed top-6 right-6 z-[200] flex items-center gap-3 px-6 py-4 rounded-2xl border backdrop-blur-xl shadow-2xl animate-in slide-in-from-top-6 duration-300 ${
          alertInfo.type === "success" 
            ? "bg-emerald-950/90 border-emerald-500/30 text-emerald-400" 
            : "bg-red-950/90 border-red-500/30 text-red-400"
        }`}>
          {alertInfo.type === "success" ? <CheckCircle2 size={20} /> : <ShieldAlert size={20} />}
          <span className="text-sm font-bold">{alertInfo.message}</span>
          <button onClick={() => setAlertInfo({ ...alertInfo, show: false })} className="text-current opacity-60 hover:opacity-100 ml-4">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white mb-2">
            Kelola <span className="text-emerald-500">Pengaduan</span>
          </h1>
          <p className="text-zinc-400">Moderasi laporan keluhan pengguna terkait bug sistem website maupun penyelewengan produk.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-3 text-center">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Menunggu</p>
            <p className="text-2xl font-black text-amber-500">{complaints.filter(c => c.status === "pending").length}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-3 text-center">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Diproses</p>
            <p className="text-2xl font-black text-sky-400">{complaints.filter(c => c.status === "processing").length}</p>
          </div>
        </div>
      </div>

      {/* Filter panel */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Search bar */}
          <div className="md:col-span-6 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input
              type="text"
              placeholder="Cari judul pengaduan, nama pengirim, atau username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500/50 text-white rounded-2xl pl-12 pr-4 py-3.5 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all placeholder-zinc-600"
            />
          </div>

          {/* Category filter */}
          <div className="md:col-span-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500/50 text-zinc-300 rounded-2xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all"
            >
              <option value="all">Semua Kategori</option>
              <option value="sistem">Sistem / Bug</option>
              <option value="produk">Masalah Produk</option>
              <option value="lainnya">Lainnya</option>
            </select>
          </div>

          {/* Status filter */}
          <div className="md:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500/50 text-zinc-300 rounded-2xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all"
            >
              <option value="all">Semua Status</option>
              <option value="pending">Menunggu</option>
              <option value="processing">Diproses</option>
              <option value="resolved">Selesai</option>
            </select>
          </div>
        </div>
      </div>

      {/* Complaints Table Grid */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
        {isLoading ? (
          <div className="py-28 flex flex-col items-center justify-center gap-3">
            <svg className="animate-spin h-10 w-10 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-zinc-500 text-sm font-bold uppercase tracking-wider">Memuat data pengaduan...</span>
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="py-28 text-center space-y-4">
            <div className="w-16 h-16 bg-zinc-950 text-zinc-700 rounded-2xl flex items-center justify-center mx-auto border border-zinc-800">
              <AlertTriangle size={32} />
            </div>
            <div className="space-y-1">
              <p className="text-white font-bold">Tidak Menemukan Pengaduan</p>
              <p className="text-zinc-500 text-xs">Belum ada pengaduan masuk atau kata kunci pencarian Anda salah.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-zinc-850 bg-zinc-950/45 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  <th className="px-6 py-4">User Pengirim</th>
                  <th className="px-6 py-4">Kategori</th>
                  <th className="px-6 py-4">Judul Pengaduan</th>
                  <th className="px-6 py-4">Tanggal Masuk</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850">
                {filteredComplaints.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-950/20 transition-colors">
                    {/* User profile column */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-9 h-9">
                          {item.user?.avatar_url ? (
                            <img 
                              src={item.user.avatar_url.startsWith("http") ? item.user.avatar_url : `${getApiUrl()}${item.user.avatar_url}`} 
                              alt="Avatar" 
                              className="w-9 h-9 rounded-full object-cover border border-zinc-800" 
                            />
                          ) : (
                            <div className="w-9 h-9 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full flex items-center justify-center font-bold text-sm">
                              {item.user?.username ? item.user.username.charAt(0).toUpperCase() : "?"}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white leading-none mb-1">{item.user?.name || item.user?.username || "Guest User"}</p>
                          <p className="text-xs text-zinc-500 leading-none">@{item.user?.username || "guest"}</p>
                        </div>
                      </div>
                    </td>

                    {/* Category column */}
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 border text-[10px] font-bold rounded-md uppercase tracking-wider ${getCategoryBadgeColor(item.category)}`}>
                        {getCategoryName(item.category)}
                      </span>
                    </td>

                    {/* Title column */}
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-white max-w-xs truncate">{item.title}</p>
                      <p className="text-xs text-zinc-500 max-w-xs truncate">{item.description}</p>
                    </td>

                    {/* Created at column */}
                    <td className="px-6 py-4 text-xs font-semibold text-zinc-400">
                      {formatDate(item.created_at)}
                    </td>

                    {/* Status column */}
                    <td className="px-6 py-4">
                      {getStatusBadge(item.status)}
                    </td>

                    {/* Action column */}
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenDetail(item)}
                        className="inline-flex items-center gap-1.5 px-4.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-black rounded-lg transition-all shadow-md active:scale-95"
                      >
                        <Eye size={14} />
                        Detail & Respon
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAIL MODAL PANEL */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-zinc-950/85 backdrop-blur-md animate-in fade-in duration-500" 
            onClick={handleCloseDetail}
          />

          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-6xl lg:max-w-7xl rounded-[2.5rem] relative z-10 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/40">
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-0.5 border text-[10px] font-bold rounded-md uppercase tracking-wider ${getCategoryBadgeColor(selectedComplaint.category)}`}>
                  {getCategoryName(selectedComplaint.category)}
                </span>
                <h3 className="text-xl font-bold text-white">Detail Pengaduan</h3>
              </div>
              <button 
                onClick={handleCloseDetail}
                className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 overflow-y-auto flex-1 custom-scrollbar grid grid-cols-1 md:grid-cols-12 gap-8">
              {/* Left Column: Complaint Details & Attachment */}
              <div className="md:col-span-7 space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Judul Laporan</h4>
                  <p className="text-lg font-bold text-white leading-tight">{selectedComplaint.title}</p>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Deskripsi Masalah</h4>
                  <div className="bg-zinc-950 border border-zinc-850 rounded-2xl p-5 text-sm text-zinc-350 leading-relaxed whitespace-pre-line max-h-56 overflow-y-auto custom-scrollbar">
                    {selectedComplaint.description}
                  </div>
                </div>

                {/* Attachment */}
                {selectedComplaint.attachment_url && (
                  <div>
                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <Paperclip size={12} /> Lampiran Bukti
                    </h4>
                    <div className="border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-950 relative group">
                      <img 
                        src={getImageUrl(selectedComplaint.attachment_url)} 
                        alt="Lampiran" 
                        className="w-full h-auto max-h-60 object-cover" 
                      />
                      <a 
                        href={getImageUrl(selectedComplaint.attachment_url)} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold gap-1.5"
                      >
                        <ExternalLink size={14} /> Buka di Tab Baru
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: User Info & Resolution Form */}
              <div className="md:col-span-5 space-y-6">
                {/* User Card */}
                <div className="bg-zinc-950 border border-zinc-850 rounded-2xl p-5 space-y-4">
                  <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Informasi Pengirim</h4>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 relative">
                      {selectedComplaint.user?.avatar_url ? (
                        <img 
                          src={selectedComplaint.user.avatar_url.startsWith("http") ? selectedComplaint.user.avatar_url : `${getApiUrl()}${selectedComplaint.user.avatar_url}`} 
                          alt="Avatar" 
                          className="w-11 h-11 rounded-full object-cover border border-zinc-800" 
                        />
                      ) : (
                        <div className="w-11 h-11 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center font-bold text-md border border-emerald-500/20">
                          {selectedComplaint.user?.username ? selectedComplaint.user.username.charAt(0).toUpperCase() : "?"}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{selectedComplaint.user?.name || selectedComplaint.user?.username || "Guest"}</p>
                      <p className="text-xs text-zinc-500">@{selectedComplaint.user?.username || "guest"}</p>
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-3 border-t border-zinc-850/60 text-xs">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Mail size={14} className="text-emerald-500/70" />
                      <span>{selectedComplaint.user?.email || "-"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Phone size={14} className="text-emerald-500/70" />
                      <span>{selectedComplaint.user?.phone || "-"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Clock size={14} className="text-emerald-500/70" />
                      <span>Masuk: {formatDate(selectedComplaint.created_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Response Form (Status only) */}
                <form onSubmit={handleSaveResponse} className="space-y-4">
                  <div className="bg-zinc-950 border border-zinc-850 rounded-2xl p-5 space-y-4 animate-in fade-in duration-300">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Perbarui Status</label>
                      <select
                        name="status"
                        value={responseForm.status}
                        onChange={handleResponseChange}
                        className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-transparent transition-all"
                      >
                        <option value="pending">Menunggu (Pending)</option>
                        <option value="processing">Diproses (Processing)</option>
                        <option value="resolved">Selesai (Resolved)</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={isSavingResponse}
                      className={`w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-95 ${
                        isSavingResponse ? "opacity-70 cursor-not-allowed" : ""
                      }`}
                    >
                      {isSavingResponse ? (
                        <>
                          <svg className="animate-spin h-3.5 w-3.5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span>Memperbarui Status...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={13} />
                          Simpan Status Laporan
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Complaint Comments Chat Thread */}
                <div className="animate-in fade-in duration-300">
                  <ComplaintComments complaintId={selectedComplaint.id} isAdminPage={true} />
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

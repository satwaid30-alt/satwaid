"use client";

import { useState, useEffect } from "react";
import { getApiUrl, getImageUrl } from "@/app/utils/api";
import Link from "next/link";
import { User, Search, Filter, RefreshCw, Eye, AlertCircle, CheckCircle2, UserX, ShieldAlert, X, Info } from "lucide-react";
import ActionModal from "@/components/ActionModal";

export default function AdminResetProfilPage() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  
  // Notification alert banner
  const [alertInfo, setAlertInfo] = useState({ show: false, message: "", type: "success" });

  // Action Confirmation Modal
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    userId: null,
    username: "",
    name: "",
  });

  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`${getApiUrl()}/users`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      const result = await response.json();
      if (response.ok) {
        setUsers(result.data);
      } else {
        showAlert(result.message || "Gagal memuat daftar pengguna.", "error");
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      showAlert("Terjadi kesalahan saat memuat data pengguna.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const showAlert = (message, type = "success") => {
    setAlertInfo({ show: true, message, type });
    setTimeout(() => {
      setAlertInfo((prev) => ({ ...prev, show: false }));
    }, 5000);
  };

  const isProfileComplete = (user) => {
    return !!(
      user.name &&
      user.name.trim() !== "" &&
      user.phone &&
      user.phone.trim() !== "" &&
      user.address &&
      user.address.trim() !== "" &&
      user.city &&
      user.city.trim() !== "" &&
      user.province &&
      user.province.trim() !== "" &&
      Array.isArray(user.bank_accounts) &&
      user.bank_accounts.length > 0
    );
  };

  const handleOpenResetModal = (user) => {
    // Prevent self-reset logic or alert (admin_user checking)
    const adminUser = JSON.parse(localStorage.getItem("admin_user") || "{}");
    if (adminUser.id === user.id) {
      showAlert("Anda tidak dapat mereset profil Anda sendiri dari panel ini.", "error");
      return;
    }

    setConfirmModal({
      isOpen: true,
      userId: user.id,
      username: user.username,
      name: user.name || user.username,
    });
  };

  const handleConfirmReset = async () => {
    const { userId } = confirmModal;
    setIsResetting(true);
    try {
      const token = localStorage.getItem("admin_token");
      // Complete profile reset clears all fields
      const response = await fetch(`${getApiUrl()}/users/profile/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          name: "",
          phone: "",
          address: "",
          city: "",
          province: "",
          bankAccounts: [],
          avatar_url: "",
        }),
      });

      const result = await response.json();
      if (response.ok) {
        showAlert(`Profil ${confirmModal.name} berhasil direset secara keseluruhan.`, "success");
        setConfirmModal({ isOpen: false, userId: null, username: "", name: "" });
        fetchUsers();
      } else {
        showAlert(result.message || "Gagal mereset profil.", "error");
      }
    } catch (err) {
      console.error("Error resetting profile:", err);
      showAlert("Terjadi kesalahan koneksi saat melakukan reset.", "error");
    } finally {
      setIsResetting(false);
    }
  };

  // Filter Logic
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      (user.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.username || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.email || "").toLowerCase().includes(searchQuery.toLowerCase());

    const isComplete = isProfileComplete(user);
    const matchesStatus =
      statusFilter === "All" ||
      (statusFilter === "Lengkap" && isComplete) ||
      (statusFilter === "Belum Lengkap" && !isComplete);

    return matchesSearch && matchesStatus;
  });

  const totalUsersCount = users.length;
  const completeUsersCount = users.filter(isProfileComplete).length;
  const incompleteUsersCount = totalUsersCount - completeUsersCount;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-zinc-400 font-medium">Memuat data pengguna...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      {/* Alert Banner */}
      {alertInfo.show && (
        <div
          className={`fixed top-6 right-6 z-[1000] flex items-center gap-3 px-5 py-4 rounded-2xl border shadow-2xl transition-all duration-300 animate-in slide-in-from-top-5 ${
            alertInfo.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}
        >
          {alertInfo.type === "success" ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span className="text-sm font-bold">{alertInfo.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <RefreshCw className="text-emerald-500 animate-spin-slow" size={32} />
            Reset Profil Pengguna
          </h1>
          <p className="text-zinc-500 mt-1 font-medium">Lihat status kelengkapan profil pengguna dan lakukan reset data bila diperlukan.</p>
        </div>

        {/* Stats Summary */}
        <div className="flex items-center gap-4 bg-zinc-900/50 p-2 rounded-2xl border border-zinc-800">
          <div className="px-4 py-2 text-center border-r border-zinc-800">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Total User</p>
            <p className="text-xl font-black text-white">{totalUsersCount}</p>
          </div>
          <div className="px-4 py-2 text-center border-r border-zinc-800">
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Lengkap</p>
            <p className="text-xl font-black text-emerald-400">{completeUsersCount}</p>
          </div>
          <div className="px-4 py-2 text-center">
            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Belum Lengkap</p>
            <p className="text-xl font-black text-amber-400">{incompleteUsersCount}</p>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" size={20} />
          <input
            type="text"
            placeholder="Cari nama lengkap, username, atau email..."
            className="w-full bg-zinc-900 border border-zinc-800 text-white pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:border-emerald-500 transition-all shadow-xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
          <select
            className="w-full bg-zinc-900 border border-zinc-800 text-white pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:border-emerald-500 transition-all appearance-none shadow-xl cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">Semua Status Profil</option>
            <option value="Lengkap">Profil Lengkap</option>
            <option value="Belum Lengkap">Profil Belum Lengkap</option>
          </select>
        </div>
      </div>

      {/* User Table Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-950/50 border-b border-zinc-800">
                <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest w-12 text-center">No</th>
                <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">User</th>
                <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Kontak</th>
                <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Alamat & Lokasi</th>
                <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Status Profil</th>
                <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user, index) => {
                  const complete = isProfileComplete(user);
                  const isUserAdmin = user.role === "admin";
                  return (
                    <tr key={user.id} className="hover:bg-white/[0.01] transition-colors group">
                      {/* Row Index */}
                      <td className="p-6 text-center text-xs font-bold text-zinc-500 font-mono">
                        {index + 1}
                      </td>

                      {/* User Column */}
                      <td className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-zinc-850 rounded-2xl flex items-center justify-center border border-zinc-800 overflow-hidden shrink-0">
                            {user.avatar_url ? (
                              <img
                                src={getImageUrl(user.avatar_url)}
                                alt={user.username}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = ""; // Clear source to fallback
                                }}
                              />
                            ) : (
                              <User size={20} className="text-zinc-500" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-black text-white group-hover:text-emerald-400 transition-colors leading-tight">
                                {user.name || "Belum Mengisi Nama"}
                              </p>
                              {isUserAdmin && (
                                <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 font-black text-[8px] uppercase tracking-widest border border-purple-500/25">
                                  Admin
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-zinc-500 font-bold mt-1">@{user.username} · <span className="font-normal text-zinc-650">{user.email}</span></p>
                          </div>
                        </div>
                      </td>

                      {/* WhatsApp Column */}
                      <td className="p-6">
                        {user.phone ? (
                          <span className="text-xs font-semibold text-zinc-300 font-mono">{user.phone}</span>
                        ) : (
                          <span className="text-[10px] text-zinc-650 font-bold italic uppercase tracking-wider">Belum Diisi</span>
                        )}
                      </td>

                      {/* Address Column */}
                      <td className="p-6 max-w-xs">
                        {user.address || user.city || user.province ? (
                          <div>
                            <p className="text-xs font-semibold text-zinc-350 truncate">{user.address || "-"}</p>
                            <p className="text-[9px] text-zinc-500 font-black uppercase tracking-wider mt-1">
                              {user.city || "-"}, {user.province || "-"}
                            </p>
                          </div>
                        ) : (
                          <span className="text-[10px] text-zinc-650 font-bold italic uppercase tracking-wider">Belum Diisi</span>
                        )}
                      </td>

                      {/* Completeness Badge Column */}
                      <td className="p-6">
                        <div className="flex justify-center">
                          {complete ? (
                            <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 flex items-center gap-1.5 shadow-inner">
                              <CheckCircle2 size={12} />
                              Lengkap
                            </span>
                          ) : (
                            <span className="px-3.5 py-1.5 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-widest border border-amber-500/20 flex items-center gap-1.5 shadow-inner">
                              <AlertCircle size={12} />
                              Belum Lengkap
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions Column */}
                      <td className="p-6">
                        <div className="flex items-center justify-center gap-2">
                          {/* Detail Profile Action */}
                          <Link
                            href={`/admin/reset-profil/detail-profil/${user.id}`}
                            className="w-10 h-10 bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-750 rounded-xl flex items-center justify-center transition-all border border-zinc-700 active:scale-90"
                            title="Detail Profil Lengkap"
                          >
                            <Eye size={18} />
                          </Link>

                          {/* Reset Profile Action */}
                          <button
                            onClick={() => handleOpenResetModal(user)}
                            className="w-10 h-10 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-xl flex items-center justify-center transition-all border border-red-500/10 active:scale-90"
                            title="Reset Seluruh Data Profil"
                          >
                            <UserX size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="p-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <User size={48} className="text-zinc-750" />
                      <p className="text-zinc-500 text-sm font-bold uppercase tracking-wider">Pengguna Tidak Ditemukan</p>
                      <p className="text-zinc-600 text-xs">Coba ubah kata pencarian Anda atau status filter.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ActionModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, userId: null, username: "", name: "" })}
        onConfirm={handleConfirmReset}
        type="danger"
        title="Reset Semua Data Profil?"
        message={`Apakah Anda benar-benar yakin ingin menghapus seluruh data profil dari user @${confirmModal.username}?`}
        confirmText="Ya, Reset Semua"
        cancelText="Batal"
        isLoading={isResetting}
      >
        <div className="flex items-start gap-3 p-4 bg-red-500/5 rounded-2xl border border-red-500/10 text-left">
          <ShieldAlert size={18} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-[10px] text-zinc-400 leading-relaxed font-bold uppercase tracking-tight">
            Tindakan ini akan mengosongkan seluruh data profil (Nama, Foto Profil, WhatsApp, Alamat & Wilayah, Rekening Bank). User harus mengisi kembali profilnya sebelum dapat membuka toko.
          </p>
        </div>
      </ActionModal>
    </div>
  );
}


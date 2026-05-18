"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, User, Mail, Shield, Clock, Eye, X, MapPin, Phone, CreditCard, KeyRound, EyeOff, Check, AlertTriangle, Trash2 } from "lucide-react";

export default function AdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedUser, setSelectedUser] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Reset Password State
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [resetTarget, setResetTarget] = useState(null);
    const [newPassword, setNewPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [resetSuccess, setResetSuccess] = useState(false);
    const [resetError, setResetError] = useState("");

    // Edit Email State
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [emailTarget, setEmailTarget] = useState(null);
    const [newEmail, setNewEmail] = useState("");
    const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
    const [emailSuccess, setEmailSuccess] = useState(false);
    const [emailError, setEmailError] = useState("");

    // Delete User State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    const openModal = (user) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setTimeout(() => setSelectedUser(null), 300);
    };

    const openResetModal = (user, e) => {
        e.preventDefault();
        e.stopPropagation();
        setResetTarget(user);
        setNewPassword("");
        setShowPassword(false);
        setResetSuccess(false);
        setResetError("");
        setIsResetModalOpen(true);
    };

    const closeResetModal = () => {
        setIsResetModalOpen(false);
        setTimeout(() => { setResetTarget(null); setResetSuccess(false); }, 300);
    };

    const handleResetPassword = async () => {
        if (!newPassword || newPassword.length < 4) {
            setResetError("Password minimal 4 karakter.");
            return;
        }
        setIsResetting(true);
        setResetError("");
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/reset-password/${resetTarget.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json"},
                body: JSON.stringify({ new_password: newPassword })
            });
            const data = await res.json();
            if (res.ok) {
                setResetSuccess(true);
            } else {
                setResetError(data.message || "Gagal mereset password.");
            }
        } catch (err) {
            setResetError("Tidak dapat terhubung ke server.");
        } finally {
            setIsResetting(false);
        }
    };

    const openEmailModal = (user, e) => {
        e.preventDefault();
        e.stopPropagation();
        setEmailTarget(user);
        setNewEmail(user.email || "");
        setEmailSuccess(false);
        setEmailError("");
        setIsEmailModalOpen(true);
    };

    const closeEmailModal = () => {
        setIsEmailModalOpen(false);
        setTimeout(() => { setEmailTarget(null); setEmailSuccess(false); }, 300);
    };

    const handleUpdateEmail = async () => {
        if (!newEmail || !newEmail.includes('@')) {
            setEmailError("Email tidak valid.");
            return;
        }
        setIsUpdatingEmail(true);
        setEmailError("");
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/email/${emailTarget.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json"},
                body: JSON.stringify({ new_email: newEmail })
            });
            const data = await res.json();
            if (res.ok) {
                setEmailSuccess(true);
                setUsers(users.map(u => u.id === emailTarget.id ? { ...u, email: newEmail } : u));
            } else {
                setEmailError(data.message || "Gagal mengubah email.");
            }
        } catch (err) {
            setEmailError("Tidak dapat terhubung ke server.");
        } finally {
            setIsUpdatingEmail(false);
        }
    };

    const openDeleteModal = (user, e) => {
        e.preventDefault();
        e.stopPropagation();
        setDeleteTarget(user);
        setDeleteError("");
        setIsDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setTimeout(() => { setDeleteTarget(null); setDeleteError(""); }, 300);
    };

    const handleDeleteUser = async () => {
        setIsDeleting(true);
        setDeleteError("");
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${deleteTarget.id}`, {
                method: "DELETE"
            });
            const data = await res.json();
            if (res.ok) {
                setUsers(users.filter(u => u.id !== deleteTarget.id));
                closeDeleteModal();
            } else {
                setDeleteError(data.message || "Gagal menghapus pengguna.");
            }
        } catch (err) {
            setDeleteError("Tidak dapat terhubung ke server.");
        } finally {
            setIsDeleting(false);
        }
    };

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`);
                const result = await response.json();
                if (response.ok) {
                    setUsers(result.data);
                }
            } catch (error) {
                console.error("Error fetching users:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const filteredUsers = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return users;
        return users.filter(user =>
            (user.username && user.username.toLowerCase().includes(q)) ||
            (user.email    && user.email.toLowerCase().includes(q))    ||
            (user.name     && user.name.toLowerCase().includes(q))
        );
    }, [users, searchQuery]);

    return (
        <div>
            {/* Header Section */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Daftar <span className="text-emerald-500">Pengguna</span></h1>
                    <p className="text-zinc-400">Kelola pengguna terdaftar di platform Dunia Reptile.</p>
                </div>
            </div>

            {/* Search */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-8 flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={20} />
                    <input
                        type="text"
                        placeholder="Cari username, email, atau nama..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoComplete="off"
                        spellCheck={false}
                        style={{ backgroundColor: '#09090b', colorScheme: 'dark' }}
                        className="w-full border border-zinc-800 rounded-xl pl-12 pr-10 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    />
                    {/* Tombol clear */}
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-white transition-colors rounded-full hover:bg-zinc-700"
                            title="Hapus pencarian"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-zinc-800 bg-zinc-950/50">
                                <th className="p-5 text-sm font-bold text-zinc-400 uppercase tracking-wider">Pengguna</th>
                                <th className="p-5 text-sm font-bold text-zinc-400 uppercase tracking-wider">Kontak (Email)</th>
                                <th className="p-5 text-sm font-bold text-zinc-400 uppercase tracking-wider">Peran (Role)</th>
                                <th className="p-5 text-sm font-bold text-zinc-400 uppercase tracking-wider">Tanggal Bergabung</th>
                                <th className="p-5 text-sm font-bold text-zinc-400 uppercase tracking-wider text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="5" className="p-10 text-center">
                                        <div className="flex flex-col items-center justify-center text-zinc-500">
                                            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                                            <p>Memuat data pengguna...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-10 text-center text-zinc-500">
                                        Tidak ada pengguna yang ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-zinc-800/50 transition-colors group">
                                        <td className="p-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-emerald-500 flex-shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                                                    <User size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white">{user.name || user.username || "Tanpa Nama"}</p>
                                                    <p className="text-xs text-zinc-500">@{user.username || "tanpa_username"}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <div className="flex items-center gap-2 text-zinc-300">
                                                <Mail size={16} className="text-zinc-500" />
                                                {user.email || <span className="text-zinc-600 italic">Belum diset</span>}
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                                                user.role === 'admin' 
                                                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                                                : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                            }`}>
                                                <Shield size={12} />
                                                {user.role ? user.role.toUpperCase() : "USER"}
                                            </span>
                                        </td>
                                        <td className="p-5">
                                            <div className="flex items-center gap-2 text-zinc-400 text-sm">
                                                <Clock size={16} className="text-zinc-500" />
                                                {user.created_at ? new Date(user.created_at).toLocaleDateString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric'
                                                }) : "-"}
                                            </div>
                                        </td>
                                        <td className="p-5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={(e) => openEmailModal(user, e)}
                                                    className="p-2 bg-zinc-800 hover:bg-blue-500/20 text-zinc-400 hover:text-blue-400 rounded-lg transition-colors border border-transparent hover:border-blue-500/30"
                                                    title="Edit Email"
                                                >
                                                    <Mail size={18} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => openResetModal(user, e)}
                                                    className="p-2 bg-zinc-800 hover:bg-amber-500/20 text-zinc-400 hover:text-amber-400 rounded-lg transition-colors border border-transparent hover:border-amber-500/30"
                                                    title="Reset Password"
                                                >
                                                    <KeyRound size={18} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => openModal(user)}
                                                    className="p-2 bg-zinc-800 hover:bg-emerald-500/20 text-zinc-400 hover:text-emerald-500 rounded-lg transition-colors border border-transparent hover:border-emerald-500/30"
                                                    title="Lihat Detail Pengguna"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => openDeleteModal(user, e)}
                                                    className="p-2 bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded-lg transition-colors border border-transparent hover:border-red-500/30"
                                                    title="Hapus Pengguna"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                
                {!isLoading && filteredUsers.length > 0 && (
                    <div className="p-5 border-t border-zinc-800 bg-zinc-950/30 flex justify-between items-center text-sm">
                        <p className="text-zinc-500 font-medium">Menampilkan <span className="text-white">{filteredUsers.length}</span> pengguna terdaftar.</p>
                    </div>
                )}
            </div>

            {/* Detail User Modal */}
            {isModalOpen && selectedUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl shadow-emerald-500/10 transform animate-in fade-in zoom-in duration-300">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center p-6 border-b border-zinc-800">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <User className="text-emerald-500" />
                                Detail Pengguna
                            </h3>
                            <button 
                                onClick={closeModal}
                                className="p-2 bg-zinc-800/50 hover:bg-red-500/20 text-zinc-400 hover:text-red-500 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto custom-scrollbar">
                            <div className="flex flex-col md:flex-row gap-6 mb-8 items-start">
                                {/* Avatar */}
                                <div className="w-24 h-24 rounded-full bg-zinc-800 border-2 border-emerald-500/30 flex items-center justify-center text-emerald-500 flex-shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.15)] overflow-hidden">
                                    {selectedUser.avatar_url ? (
                                        <img src={`${process.env.NEXT_PUBLIC_API_URL}${selectedUser.avatar_url}`} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-3xl font-black">{selectedUser.username ? selectedUser.username.charAt(0).toUpperCase() : "U"}</span>
                                    )}
                                </div>
                                
                                {/* Info Utama */}
                                <div className="flex-1 space-y-3">
                                    <div>
                                        <h4 className="text-2xl font-black text-white">{selectedUser.name || selectedUser.username || "Tanpa Nama"}</h4>
                                        <p className="text-zinc-500 font-medium">@{selectedUser.username}</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                                            selectedUser.role === 'admin' 
                                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                                            : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                        }`}>
                                            <Shield size={12} />
                                            {selectedUser.role ? selectedUser.role.toUpperCase() : "USER"}
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-800 text-zinc-300 rounded-full text-xs font-medium border border-zinc-700">
                                            <Clock size={12} />
                                            Bergabung: {new Date(selectedUser.created_at).toLocaleDateString('id-ID')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Section: Kontak & Alamat */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div className="space-y-4">
                                    <h5 className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                                        <Mail size={16} /> Informasi Kontak
                                    </h5>
                                    <div className="bg-zinc-950/50 border border-zinc-800 rounded-xl p-4 space-y-3">
                                        <div>
                                            <p className="text-xs text-zinc-500 mb-1">Email</p>
                                            <p className="text-sm text-white font-medium">{selectedUser.email || "-"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-zinc-500 mb-1">Nomor Telepon</p>
                                            <p className="text-sm text-white font-medium flex items-center gap-2">
                                                <Phone size={14} className="text-emerald-500" />
                                                {selectedUser.phone || <span className="text-zinc-600 italic">Belum diset</span>}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h5 className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                                        <MapPin size={16} /> Alamat Pengiriman
                                    </h5>
                                    <div className="bg-zinc-950/50 border border-zinc-800 rounded-xl p-4 space-y-3">
                                        <div>
                                            <p className="text-xs text-zinc-500 mb-1">Alamat Lengkap</p>
                                            <p className="text-sm text-white font-medium">{selectedUser.address || <span className="text-zinc-600 italic">Belum diset</span>}</p>
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="flex-1">
                                                <p className="text-xs text-zinc-500 mb-1">Kota / Kab</p>
                                                <p className="text-sm text-white font-medium">{selectedUser.city || "-"}</p>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs text-zinc-500 mb-1">Provinsi</p>
                                                <p className="text-sm text-white font-medium">{selectedUser.province || "-"}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section: Rekening Bank */}
                            <div className="space-y-4">
                                <h5 className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                                    <CreditCard size={16} /> Informasi Rekening Bank
                                </h5>
                                {selectedUser.bank_accounts && selectedUser.bank_accounts.length > 0 && selectedUser.bank_accounts.some(acc => acc.bankName || acc.accountNumber) ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {selectedUser.bank_accounts.map((acc, idx) => {
                                            if (!acc.bankName && !acc.accountNumber) return null;
                                            return (
                                                <div key={idx} className="bg-zinc-950 border border-emerald-500/20 rounded-xl p-4 relative overflow-hidden group">
                                                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                                        <CreditCard size={100} />
                                                    </div>
                                                    <p className="text-xs font-bold text-emerald-500 mb-1">{acc.bankName || "Bank"}</p>
                                                    <p className="text-lg font-mono text-white mb-2 tracking-wider">{acc.accountNumber || "---"}</p>
                                                    <p className="text-xs text-zinc-400 uppercase tracking-widest">{acc.accountName || "---"}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="bg-zinc-950/50 border border-zinc-800 border-dashed rounded-xl p-6 text-center text-zinc-500 text-sm">
                                        Pengguna belum mendaftarkan rekening bank.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Reset Password Modal */}
            {isResetModalOpen && resetTarget && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md shadow-2xl transform animate-in fade-in zoom-in duration-300">
                        {/* Header */}
                        <div className="flex justify-between items-center p-6 border-b border-zinc-800">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <KeyRound className="text-amber-400" size={20} />
                                Reset Password
                            </h3>
                            <button onClick={closeResetModal} className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-full transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-6">
                            {resetSuccess ? (
                                /* Success State */
                                <div className="text-center py-4">
                                    <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Check className="text-emerald-500" size={32} />
                                    </div>
                                    <h4 className="text-xl font-bold text-white mb-2">Password Berhasil Direset!</h4>
                                    <p className="text-zinc-400 text-sm mb-2">
                                        Password untuk akun <span className="text-white font-bold">@{resetTarget.username}</span> telah diperbarui.
                                    </p>
                                    <p className="text-zinc-500 text-xs mb-6">Beritahu user untuk segera login dengan password baru.</p>
                                    <button onClick={closeResetModal} className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold py-3 rounded-xl transition-colors">
                                        Selesai
                                    </button>
                                </div>
                            ) : (
                                /* Form State */
                                <>
                                    {/* Info user target */}
                                    <div className="flex items-center gap-3 bg-zinc-950/60 border border-zinc-800 rounded-2xl p-4 mb-6">
                                        <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-emerald-500 flex-shrink-0">
                                            {resetTarget.avatar_url ? (
                                                <img src={`${process.env.NEXT_PUBLIC_API_URL}${resetTarget.avatar_url}`} alt="" className="w-full h-full object-cover rounded-full" />
                                            ) : (
                                                <span className="text-sm font-bold">{resetTarget.username?.charAt(0).toUpperCase() || "U"}</span>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-white text-sm">{resetTarget.name || resetTarget.username}</p>
                                            <p className="text-xs text-zinc-500">{resetTarget.email}</p>
                                        </div>
                                    </div>

                                    {/* Warning */}
                                    <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-5">
                                        <AlertTriangle className="text-amber-400 flex-shrink-0 mt-0.5" size={16} />
                                        <p className="text-amber-400 text-xs font-medium">Password lama akan langsung diganti. Pastikan user diberitahu password barunya.</p>
                                    </div>

                                    {/* Input password baru */}
                                    <div className="space-y-2 mb-4">
                                        <label className="text-sm font-semibold text-zinc-300">Password Baru</label>
                                        <div className="relative">
                                            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={newPassword}
                                                onChange={(e) => { setNewPassword(e.target.value); setResetError(""); }}
                                                placeholder="Masukkan password baru..."
                                                className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-xl pl-12 pr-12 py-3.5 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                        {resetError && (
                                            <p className="text-red-400 text-xs font-medium flex items-center gap-1">
                                                <AlertTriangle size={12} /> {resetError}
                                            </p>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-3 pt-2">
                                        <button onClick={closeResetModal} className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-colors">
                                            Batal
                                        </button>
                                        <button
                                            onClick={handleResetPassword}
                                            disabled={isResetting || !newPassword}
                                            className={`flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${ isResetting || !newPassword ? "opacity-60 cursor-not-allowed" : ""}`}
                                        >
                                            {isResetting ? (
                                                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                                                </svg>
                                            ) : (
                                                <><KeyRound size={18} /> Reset Password</>
                                            )}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {/* Edit Email Modal */}
            {isEmailModalOpen && emailTarget && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md shadow-2xl transform animate-in fade-in zoom-in duration-300">
                        {/* Header */}
                        <div className="flex justify-between items-center p-6 border-b border-zinc-800">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Mail className="text-blue-400" size={20} />
                                Edit Email Pengguna
                            </h3>
                            <button onClick={closeEmailModal} className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-full transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-6">
                            {emailSuccess ? (
                                <div className="text-center py-4">
                                    <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Check className="text-emerald-500" size={32} />
                                    </div>
                                    <h4 className="text-xl font-bold text-white mb-2">Email Berhasil Diubah!</h4>
                                    <p className="text-zinc-400 text-sm mb-6">
                                        Email untuk akun <span className="text-white font-bold">@{emailTarget.username}</span> telah diperbarui menjadi <span className="text-white font-bold">{newEmail}</span>.
                                    </p>
                                    <button onClick={closeEmailModal} className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold py-3 rounded-xl transition-colors">
                                        Selesai
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center gap-3 bg-zinc-950/60 border border-zinc-800 rounded-2xl p-4 mb-6">
                                        <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-emerald-500 flex-shrink-0">
                                            {emailTarget.avatar_url ? (
                                                <img src={`${process.env.NEXT_PUBLIC_API_URL}${emailTarget.avatar_url}`} alt="" className="w-full h-full object-cover rounded-full" />
                                            ) : (
                                                <span className="text-sm font-bold">{emailTarget.username?.charAt(0).toUpperCase() || "U"}</span>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-white text-sm">{emailTarget.name || emailTarget.username}</p>
                                            <p className="text-xs text-zinc-500">Email Lama: {emailTarget.email || "-"}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2 mb-6">
                                        <label className="text-sm font-semibold text-zinc-300">Email Baru</label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                            <input
                                                type="email"
                                                value={newEmail}
                                                onChange={(e) => { setNewEmail(e.target.value); setEmailError(""); }}
                                                placeholder="Masukkan email baru..."
                                                className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                            />
                                        </div>
                                        {emailError && (
                                            <p className="text-red-400 text-xs font-medium flex items-center gap-1 mt-2">
                                                <AlertTriangle size={12} /> {emailError}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex gap-3">
                                        <button onClick={closeEmailModal} className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-colors">
                                            Batal
                                        </button>
                                        <button
                                            onClick={handleUpdateEmail}
                                            disabled={isUpdatingEmail || !newEmail || newEmail === emailTarget.email}
                                            className={`flex-1 py-3 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${ isUpdatingEmail || !newEmail || newEmail === emailTarget.email ? "opacity-60 cursor-not-allowed" : ""}`}
                                        >
                                            {isUpdatingEmail ? (
                                                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                                                </svg>
                                            ) : (
                                                <><Mail size={18} /> Simpan Email</>
                                            )}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && deleteTarget && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md shadow-2xl transform animate-in fade-in zoom-in duration-300">
                        <div className="p-6">
                            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="text-red-500" size={32} />
                            </div>
                            <h4 className="text-xl font-bold text-white text-center mb-2">Hapus Pengguna?</h4>
                            <p className="text-zinc-400 text-center text-sm mb-6">
                                Apakah Anda yakin ingin menghapus akun <span className="text-white font-bold">@{deleteTarget.username}</span>? Tindakan ini tidak dapat dibatalkan dan semua data terkait mungkin akan hilang.
                            </p>

                            {deleteError && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-6 flex items-center gap-2 text-red-400 text-xs font-medium">
                                    <AlertTriangle size={14} />
                                    {deleteError}
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button 
                                    onClick={closeDeleteModal} 
                                    disabled={isDeleting}
                                    className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleDeleteUser}
                                    disabled={isDeleting}
                                    className="flex-1 py-3 bg-red-500 hover:bg-red-400 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isDeleting ? (
                                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                                        </svg>
                                    ) : (
                                        "Hapus Sekarang"
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

"use client";

import { useState, useEffect, use } from "react";
import { useParams, useRouter } from "next/navigation";
import { Search, Filter, Download, Upload, FileText, CheckCircle2, Clock, MoreVertical, DollarSign, ArrowLeft, ShoppingBag, Calendar, ArrowUpRight, Store, MapPin, CreditCard, Phone, Mail, User, Printer, X } from "lucide-react";
import Link from "next/link";
import ActionModal from "@/components/ActionModal";
import { getApiUrl, getImageUrl } from "@/app/utils/api";

export default function DetailPembayaranPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const { id } = params;

  const [shop, setShop] = useState(null);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [actionModal, setActionModal] = useState({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
    onConfirm: null,
  });

  const [selectedOrders, setSelectedOrders] = useState([]);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [notes, setNotes] = useState("");
  const [additionalFee, setAdditionalFee] = useState(0);
  const [isSubmittingBulk, setIsSubmittingBulk] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [sentInvoices, setSentInvoices] = useState({});

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("sent_invoices");
      if (stored) {
        try {
          setSentInvoices(JSON.parse(stored));
        } catch (e) {
          console.error("Error parsing sent invoices:", e);
        }
      }
    }
  }, []);

  const toggleInvoiceSent = (orderId) => {
    const updated = {
      ...sentInvoices,
      [orderId]: !sentInvoices[orderId],
    };
    setSentInvoices(updated);
    localStorage.setItem("sent_invoices", JSON.stringify(updated));
  };

  const setInvoiceSentTrue = (orderId) => {
    const updated = {
      ...sentInvoices,
      [orderId]: true,
    };
    setSentInvoices(updated);
    localStorage.setItem("sent_invoices", JSON.stringify(updated));
  };

  const isInvoiceSent = (orderId) => {
    return !!sentInvoices[orderId];
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1 MB
      if (file.size > MAX_FILE_SIZE) {
        setActionModal({
          isOpen: true,
          type: "warning",
          title: "Ukuran File Terlalu Besar",
          message: "Ukuran file bukti transfer tidak boleh melebihi 1MB. Silakan pilih file yang lebih kecil.",
          onConfirm: () => setActionModal((prev) => ({ ...prev, isOpen: false })),
        });
        e.target.value = ""; // Reset input file
        setSelectedFile(null);
        setPreviewUrl(null);
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBulkDisburseSubmit = async (e) => {
    if (e) e.preventDefault();
    if (selectedOrders.length === 0) return;
    if (!selectedFile) {
      setActionModal({
        isOpen: true,
        type: "warning",
        title: "Bukti Transfer Kosong",
        message: "Silakan pilih file bukti transfer terlebih dahulu.",
        onConfirm: null,
      });
      return;
    }

    setIsSubmittingBulk(true);
    try {
      const token = localStorage.getItem("admin_token");

      // 1. Upload proof file
      const formData = new FormData();
      formData.append("image", selectedFile);

      const uploadRes = await fetch(`${getApiUrl()}/upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.message || "Gagal mengunggah file bukti transfer");

      const fileUrl = uploadData.url;

      // 2. Call bulk disburse API
      const disburseRes = await fetch(`${getApiUrl()}/orders/bulk-disburse`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          order_ids: selectedOrders,
          disbursement_proof: fileUrl,
          disbursement_notes: notes,
          additional_fee: additionalFee,
        }),
      });

      const disburseData = await disburseRes.json();
      if (disburseRes.ok) {
        setIsBulkModalOpen(false);
        setSelectedOrders([]);
        setSelectedFile(null);
        setPreviewUrl(null);
        setNotes("");
        setAdditionalFee(0);

        setActionModal({
          isOpen: true,
          type: "success",
          title: "Transfer Berhasil",
          message: disburseData.message || "Pencairan dana terpilih berhasil diverifikasi sekaligus.",
          onConfirm: null,
        });

        // Refresh orders
        fetchData();
      } else {
        throw new Error(disburseData.message || "Gagal memproses verifikasi pencairan sekaligus");
      }
    } catch (err) {
      console.error(err);
      setActionModal({
        isOpen: true,
        type: "danger",
        title: "Verifikasi Gagal",
        message: err.message || "Terjadi kesalahan saat memproses verifikasi.",
        onConfirm: null,
      });
    } finally {
      setIsSubmittingBulk(false);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("admin_token");
      const headers = {
        Authorization: token ? `Bearer ${token}` : "",
      };

      // Fetch Shop Details
      const shopRes = await fetch(`${getApiUrl()}/shops/${id}`, { headers });
      const shopResult = await shopRes.json();
      if (shopRes.ok && shopResult.data) {
        setShop(shopResult.data);
      } else {
        setActionModal({
          isOpen: true,
          type: "error",
          title: "Toko Tidak Ditemukan",
          message: "Informasi toko seller tidak berhasil dimuat.",
          onConfirm: () => router.push("/admin/keuangan"),
        });
        return;
      }

      // Fetch Orders for this Shop
      const ordersRes = await fetch(`${getApiUrl()}/orders/shop/${id}`, { headers });
      const ordersResult = await ordersRes.json();
      if (ordersRes.ok) {
        setOrders(ordersResult.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const filteredOrders = orders.filter((order) => {
    // Hanya tampilkan order yang relevan untuk halaman keuangan
    const isRelevant = ["completed", "disbursement_requested"].includes(order.status) || !!(order.disbursed_at || order.disbursement_proof);
    if (!isRelevant) return false;

    const matchesSearch = order.order_id?.toLowerCase().includes(searchQuery.toLowerCase()) || order.product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || order.user?.username?.toLowerCase().includes(searchQuery.toLowerCase()) || order.user?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesStatus = true;
    if (statusFilter === "disbursed") {
      matchesStatus = !!(order.disbursed_at || order.disbursement_proof);
    } else if (statusFilter === "requested") {
      matchesStatus = order.status === "disbursement_requested" && !(order.disbursed_at || order.disbursement_proof);
    } else if (statusFilter === "pending") {
      matchesStatus = order.status === "completed" && !(order.disbursed_at || order.disbursement_proof);
    }

    return matchesSearch && matchesStatus;
  });

  const eligibleOrders = filteredOrders.filter((o) => !(o.disbursed_at || o.disbursement_proof) && (o.status === "completed" || o.status === "disbursement_requested"));

  const totalAccumulatedAmount = filteredOrders
    .filter((o) => selectedOrders.includes(o.id))
    .reduce((acc, curr) => {
      const total = Number(curr.price || 0) * Number(curr.quantity || 1) + Number(curr.shipping_cost || 0) + Number(curr.packing_cost || 0);
      return acc + total;
    }, 0);

  const formatPrice = (price) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price || 0);
  };

  // Removed local getImageUrl function in favor of central helper from @/app/utils/api

  const getDisbursementStatus = (order) => {
    if (order.disbursed_at || order.disbursement_proof) {
      return {
        label: "Selesai",
        style: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
        icon: <CheckCircle2 size={10} />,
      };
    }
    if (order.status === "disbursement_requested") {
      return {
        label: "Pengajuan",
        style: "bg-blue-500/10 text-blue-500 border-blue-500/20 animate-pulse",
        icon: <ArrowUpRight size={10} />,
      };
    }
    return {
      label: "Belum Diajukan",
      style: "bg-zinc-800 text-zinc-400 border-zinc-700",
      icon: <Clock size={10} />,
    };
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] gap-4 bg-zinc-950 text-white">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-zinc-500 font-bold animate-pulse">Memuat detail keuangan seller...</p>
      </div>
    );
  }

  if (!shop) return null;

  return (
    <div className="min-h-screen bg-zinc-950 p-6 lg:p-10 space-y-8 animate-in fade-in duration-700 text-white">
      {/* Navigation & Header */}
      <div className="space-y-4">
        <Link href="/admin/keuangan" className="inline-flex items-center gap-2 text-zinc-500 hover:text-emerald-500 transition-all group font-bold text-sm">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Kembali ke Keuangan Utama
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-zinc-900 pb-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-zinc-900 rounded-[1.5rem] flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-2xl overflow-hidden shrink-0">{shop.logo_url ? <img src={getImageUrl(shop.logo_url)} className="w-full h-full object-cover" alt={shop.name} /> : <Store size={32} />}</div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight leading-tight">{shop.name}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-zinc-500 text-xs font-medium">
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-emerald-500" />
                  {shop.city}, {shop.province}
                </span>
                <span className="w-1.5 h-1.5 bg-zinc-800 rounded-full hidden sm:inline-block"></span>
                <span className="flex items-center gap-1.5">
                  <Phone size={14} className="text-emerald-500" />
                  +62 {shop.whatsapp}
                </span>
              </div>
            </div>
          </div>

          {/* Bank Info */}
          <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-4 max-w-md">
            <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center font-black text-[10px] uppercase border border-emerald-500/10 shrink-0">Bank</div>
            {shop.owner?.bank_accounts && shop.owner.bank_accounts.length > 0 ? (
              <div>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">Rekening Transfer Penarikan</p>
                <p className="text-sm font-black text-white tracking-wider">
                  {shop.owner.bank_accounts[0].bank_name || shop.owner.bank_accounts[0].bankName} - {shop.owner.bank_accounts[0].account_number || shop.owner.bank_accounts[0].accountNumber}
                </p>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-tight mt-1">an. {shop.owner.bank_accounts[0].account_name || shop.owner.bank_accounts[0].accountName}</p>
              </div>
            ) : (
              <div>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">Rekening Penarikan</p>
                <p className="text-xs text-zinc-500 font-medium italic">Seller belum mengatur rekening bank.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 space-y-4">
          <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 border border-emerald-500/20">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-xs font-black text-zinc-500 uppercase tracking-widest">Dana Sudah Cair</p>
            <h3 className="text-2xl font-black text-white mt-1">
              {formatPrice(
                orders
                  .filter((o) => o.disbursed_at || o.disbursement_proof)
                  .reduce((acc, curr) => {
                    const total = Number(curr.price || 0) * Number(curr.quantity || 1) + Number(curr.shipping_cost || 0) + Number(curr.packing_cost || 0) - Number(curr.additional_fee || 0);
                    return acc + total;
                  }, 0),
              )}
            </h3>
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 space-y-4">
          <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 border border-blue-500/20">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-xs font-black text-zinc-500 uppercase tracking-widest">Transfer Selesai</p>
            <h3 className="text-2xl font-black text-white mt-1">{orders.filter((o) => o.disbursed_at || o.disbursement_proof).length} Transaksi</h3>
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 space-y-4">
          <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 border border-amber-500/20">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-xs font-black text-zinc-500 uppercase tracking-widest">Menunggu Transfer</p>
            <h3 className="text-2xl font-black text-white mt-1">{orders.filter((o) => !o.disbursed_at && !o.disbursement_proof && (o.status === "completed" || o.status === "disbursement_requested")).length} Order</h3>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-3 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input
            type="text"
            placeholder="Cari Invoice, Produk, atau Buyer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-all text-sm font-medium"
          />
        </div>
        <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 min-w-[200px]">
          <Filter size={16} className="text-zinc-500" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-transparent text-white text-xs font-bold outline-none cursor-pointer w-full pr-4">
            <option value="all" className="bg-zinc-900 text-white">
              Semua Status Pencairan
            </option>
            <option value="disbursed" className="bg-zinc-900 text-white">
              Selesai Transfer
            </option>
            <option value="requested" className="bg-zinc-900 text-white">
              Menunggu Konfirmasi
            </option>
            <option value="pending" className="bg-zinc-900 text-white">
              Belum Ada Pengajuan
            </option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-950/50 border-b border-zinc-800">
                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center w-16">
                  <input
                    type="checkbox"
                    checked={eligibleOrders.length > 0 && eligibleOrders.every((o) => selectedOrders.includes(o.id))}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedOrders((prev) => {
                          const newSelection = [...prev];
                          eligibleOrders.forEach((o) => {
                            if (!newSelection.includes(o.id)) newSelection.push(o.id);
                          });
                          return newSelection;
                        });
                      } else {
                        setSelectedOrders((prev) => prev.filter((id) => !eligibleOrders.map((o) => o.id).includes(id)));
                      }
                    }}
                    className="rounded border-zinc-800 bg-zinc-950 text-emerald-500 focus:ring-emerald-500/20 w-4 h-4 cursor-pointer"
                  />
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">No</th>
                <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Produk</th>
                <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Invoice</th>
                <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Tanggal Terjual</th>
                <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Buyer</th>
                <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Tanggal Pengajuan</th>
                <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Tanggal Transfer</th>
                <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Nominal</th>
                <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Status Transfer</th>
                <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Cetak Invoice</th>
                <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order, index) => (
                  <tr key={order.id} className={`hover:bg-zinc-800/20 transition-colors group border-b border-zinc-800/50 ${selectedOrders.includes(order.id) ? "bg-emerald-500/5 hover:bg-emerald-500/10" : ""}`}>
                    <td className="px-6 py-6 text-center">
                      {!(order.disbursed_at || order.disbursement_proof) && (order.status === "completed" || order.status === "disbursement_requested") ? (
                        <input
                          type="checkbox"
                          checked={selectedOrders.includes(order.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedOrders((prev) => [...prev, order.id]);
                            } else {
                              setSelectedOrders((prev) => prev.filter((id) => id !== order.id));
                            }
                          }}
                          className="rounded border-zinc-800 bg-zinc-950 text-emerald-500 focus:ring-emerald-500/20 w-4 h-4 cursor-pointer"
                        />
                      ) : (
                        <span className="w-4 h-4 block mx-auto bg-zinc-800/40 rounded border border-zinc-800/20 cursor-not-allowed"></span>
                      )}
                    </td>
                    <td className="px-6 py-6 text-center text-xs font-bold text-zinc-500 font-mono">{index + 1}</td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 shrink-0">
                          <img src={getImageUrl(order.product?.images)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-white line-clamp-1">{order.product?.name || "Produk dihapus"}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">Qty: {order.quantity}</span>
                            <span className="px-1.5 py-0.5 bg-zinc-950 text-[8px] text-zinc-400 rounded font-black uppercase tracking-widest border border-zinc-800">ID: {order.product?.product_id || "-"}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1">
                        <span className="text-[11px] font-black text-zinc-300 font-mono tracking-wider">{order.order_id}</span>
                        <span className="text-[9px] font-bold text-zinc-600 uppercase">Payment Verified</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-xs font-bold text-zinc-400">
                        <Calendar size={14} className="text-emerald-500" />
                        {new Date(order.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-[10px] font-black text-emerald-500 border border-zinc-700 shrink-0">
                          <User size={14} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-white">{order.user?.name || order.user?.username || "Unknown"}</p>
                          <p className="text-[10px] font-bold text-zinc-500 truncate max-w-[120px]">{order.user?.phone || "-"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      {order.disbursement_requested_at ? (
                        <div className="flex flex-col items-center gap-0.5">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-400">
                            <Calendar size={12} className="text-blue-400/70" />
                            {new Date(order.disbursement_requested_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                          </div>
                          <span className="text-[10px] font-black text-zinc-500 font-mono tracking-tighter">{new Date(order.disbursement_requested_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(".", ":")} WIB</span>
                        </div>
                      ) : order.disbursed_at || order.disbursement_proof ? (
                        <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[8px] font-black rounded-lg uppercase tracking-widest whitespace-nowrap">Langsung Transfer</span>
                      ) : (
                        <span className="text-[10px] font-bold text-zinc-600 italic">-</span>
                      )}
                    </td>
                    <td className="px-8 py-6 text-center">
                      {order.disbursed_at ? (
                        <div className="flex flex-col items-center gap-0.5">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-500">
                            <Calendar size={12} className="text-emerald-500/70" />
                            {new Date(order.disbursed_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                          </div>
                          <span className="text-[10px] font-black text-zinc-500 font-mono tracking-tighter">{new Date(order.disbursed_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(".", ":")} WIB</span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-zinc-600 italic">-</span>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-emerald-500">{formatPrice(Number(order.price || 0) * Number(order.quantity || 1) + Number(order.shipping_cost || 0) + Number(order.packing_cost || 0) - Number(order.additional_fee || 0))}</span>
                        {order.additional_fee > 0 && <span className="text-[9px] font-bold text-red-400/80 italic mt-0.5">Pot. Admin: -{formatPrice(order.additional_fee)}</span>}
                        <span className="text-[9px] font-bold text-zinc-600">Disbursement</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex justify-center">
                        {(() => {
                          const status = getDisbursementStatus(order);
                          return (
                            <span className={`px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest whitespace-nowrap flex items-center gap-1.5 ${status.style}`}>
                              {status.icon}
                              {status.label}
                            </span>
                          );
                        })()}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setInvoiceOrder(order)}
                          className="flex items-center gap-2 px-4 py-2.5 bg-violet-500/10 hover:bg-violet-500 border border-violet-500/30 hover:border-violet-500 text-violet-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all group/inv"
                          title="Cetak Invoice"
                        >
                          <Printer size={14} className="group-hover/inv:scale-110 transition-transform" />
                          Invoice
                        </button>
                        <button
                          onClick={() => toggleInvoiceSent(order.order_id)}
                          className={`flex items-center justify-center p-2.5 rounded-xl transition-all border shrink-0 ${
                            isInvoiceSent(order.order_id) ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30 hover:text-emerald-300" : "bg-zinc-800 text-zinc-500 border-zinc-700 hover:text-zinc-300 hover:border-zinc-600"
                          }`}
                          title={isInvoiceSent(order.order_id) ? "Tandai Belum Terkirim" : "Tandai Sudah Terkirim"}
                        >
                          <CheckCircle2 size={14} className={isInvoiceSent(order.order_id) ? "fill-emerald-500/10" : ""} />
                        </button>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex justify-center items-center gap-2">
                        <Link href={`/admin/keuangan/upload/${order.id}`} className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-zinc-700 hover:border-zinc-600 group/btn shadow-inner min-w-[140px] justify-center">
                          {order.disbursed_at || order.disbursement_proof ? (
                            <>
                              <FileText size={14} className="text-blue-500 group-hover/btn:scale-110 transition-transform" />
                              Detail Transfer
                            </>
                          ) : (
                            <>
                              <Upload size={14} className="text-emerald-500 group-hover/btn:scale-110 transition-transform" />
                              Upload Bukti
                            </>
                          )}
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-700 shadow-inner">
                        <FileText size={32} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-white font-black uppercase tracking-widest">Tidak Ada Data</p>
                        <p className="text-zinc-500 text-xs font-medium">Data transaksi keuangan untuk seller ini tidak ditemukan.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {!isLoading && filteredOrders.length > 0 && (
          <div className="px-8 py-5 bg-zinc-950/30 border-t border-zinc-800 flex items-center justify-between">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Menampilkan {filteredOrders.length} data transaksi</p>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1 bg-zinc-800 text-zinc-500 rounded-lg text-[10px] font-black uppercase disabled:opacity-50" disabled>
                Prev
              </button>
              <button className="px-3 py-1 bg-zinc-800 text-white rounded-lg text-[10px] font-black uppercase">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Floating Glassmorphic Checkout Panel */}
      {selectedOrders.length > 0 && (
        <div className="fixed bottom-6 left-6 right-6 md:left-80 md:right-10 bg-zinc-950/80 backdrop-blur-xl border border-zinc-800 rounded-3xl p-5 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 z-50 animate-in slide-in-from-bottom-8 duration-500">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold shrink-0">{selectedOrders.length}</div>
            <div>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">Pencairan Terpilih</p>
              <p className="text-sm font-bold text-zinc-300">
                Total Transfer: <span className="text-emerald-400 font-black">{formatPrice(totalAccumulatedAmount)}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button onClick={() => setSelectedOrders([])} className="flex-1 sm:flex-none px-5 py-3 text-xs font-black text-zinc-400 hover:text-white uppercase tracking-widest transition-colors">
              Batal
            </button>
            <button
              onClick={() => {
                setNotes(`Pencairan sekaligus untuk ${selectedOrders.length} transaksi.`);
                setIsBulkModalOpen(true);
              }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/10 hover:shadow-emerald-500/20"
            >
              <Upload size={14} /> Proses Terpilih ({selectedOrders.length})
            </button>
          </div>
        </div>
      )}

      {/* Premium Upload Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight">Verifikasi Pencairan Sekaligus</h3>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mt-1">
                  {selectedOrders.length} Pesanan • Toko {shop?.name}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsBulkModalOpen(false);
                  setSelectedFile(null);
                  setPreviewUrl(null);
                }}
                className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <span className="font-bold text-sm">✕</span>
              </button>
            </div>

            {/* Summary Block */}
            <div className="bg-zinc-950/50 border border-zinc-800 p-5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Total Dana Kotor</span>
                <span className="text-sm font-black text-white">{formatPrice(totalAccumulatedAmount)}</span>
              </div>
              {additionalFee > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-red-400 font-bold uppercase tracking-wider">Biaya Tambahan</span>
                  <span className="text-sm font-black text-red-400">-{formatPrice(Number(additionalFee))}</span>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-zinc-800 pt-3">
                <span className="text-xs text-emerald-400 font-black uppercase tracking-wider">Total Harus Ditransfer</span>
                <span className="text-base font-black text-emerald-400">{formatPrice(totalAccumulatedAmount - (Number(additionalFee) || 0))}</span>
              </div>
            </div>

            {/* File Upload Section */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Unggah Bukti Transfer (PNG, JPG, PDF)</label>
              {previewUrl ? (
                <div className="relative border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-950 aspect-video flex items-center justify-center group">
                  <img src={previewUrl} className="w-full h-full object-contain" alt="Bukti Transfer" />
                  <div className="absolute inset-0 bg-zinc-950/70 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl(null);
                      }}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all"
                    >
                      Hapus Bukti
                    </button>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center border border-dashed border-zinc-800 hover:border-emerald-500/30 rounded-2xl p-8 bg-zinc-950/50 cursor-pointer hover:bg-zinc-950 transition-all group">
                  <Upload size={24} className="text-zinc-600 group-hover:text-emerald-500 transition-colors mb-2" />
                  <span className="text-xs font-bold text-zinc-400">Pilih File Bukti Transfer</span>
                  <span className="text-[9px] text-zinc-600 mt-1 font-bold">Maks. 1MB</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>
              )}
            </div>

            {/* Biaya Tambahan */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
                Biaya Tambahan / Potongan (Opsional)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-black text-sm select-none">Rp</span>
                <input
                  type="number"
                  min="0"
                  value={additionalFee}
                  onChange={(e) => setAdditionalFee(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-xs text-white font-bold placeholder:text-zinc-700 outline-none focus:border-red-500/50 transition-all"
                  placeholder="0"
                />
              </div>
              <p className="text-[9px] text-zinc-600 font-bold ml-1 italic">* Misal: biaya transfer antar bank. Kosongkan jika tidak ada.</p>
            </div>

            {/* Notes Section */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Catatan Tambahan (Opsional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Masukkan catatan pencairan (misal: Transfer Bank Mandiri ke Mandiri)..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder:text-zinc-700 outline-none focus:border-emerald-500/50 transition-all h-20 resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsBulkModalOpen(false);
                  setSelectedFile(null);
                  setPreviewUrl(null);
                }}
                className="flex-1 px-5 py-3 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSubmittingBulk}
                onClick={handleBulkDisburseSubmit}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-600 text-zinc-950 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/10"
              >
                {isSubmittingBulk ? "Memproses..." : "Konfirmasi Transfer"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ActionModal isOpen={actionModal.isOpen} type={actionModal.type} title={actionModal.title} message={actionModal.message} onConfirm={actionModal.onConfirm} onClose={() => setActionModal((prev) => ({ ...prev, isOpen: false }))} />

      {/* ===== INVOICE MODAL ===== */}
      {invoiceOrder &&
        (() => {
          const inv = invoiceOrder;
          const subtotal = Number(inv.price || 0) * Number(inv.quantity || 1);
          const shipping = Number(inv.shipping_cost || 0);
          const packing = Number(inv.packing_cost || 0);
          const adminFee = Number(inv.admin_fee || 0);
          const addFee = Number(inv.additional_fee || 0);
          const total = subtotal + shipping + packing + adminFee;
          const disbursed = subtotal + shipping + packing - addFee;
          const bankAccounts = shop?.owner?.bank_accounts || [];
          const bank = Array.isArray(bankAccounts) && bankAccounts.length > 0 ? bankAccounts[0] : null;
          return (
            <div className="fixed inset-0 z-[200] flex items-start justify-center bg-black/80 backdrop-blur-sm overflow-y-auto py-8 px-4">
              {/* Toolbar */}
              <div className="fixed top-4 right-4 flex items-center gap-3 z-[201] no-print">
                <button onClick={() => setShowEmailModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg">
                  <Mail size={16} /> Teks Email
                </button>
                <button
                  onClick={() => {
                    setInvoiceOrder(null);
                    setShowEmailModal(false);
                  }}
                  className="w-10 h-10 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl flex items-center justify-center transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Invoice Paper */}
              <div
                id="satwaid-invoice"
                style={{
                  background: "#ffffff",
                  color: "#111827",
                  width: "794px",
                  minHeight: "1123px",
                  fontFamily: "'Segoe UI', Arial, sans-serif",
                  position: "relative",
                  overflow: "hidden",
                  boxShadow: "0 25px 80px rgba(0,0,0,0.6)",
                  padding: "0",
                }}
              >
                {/* Watermark Logo */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    pointerEvents: "none",
                    zIndex: 0,
                  }}
                >
                  <img
                    src="/images/Logo-Bg-2-2.png"
                    alt=""
                    style={{
                      width: "850px",
                      height: "650px",
                      objectFit: "contain",
                      opacity: 0.055,
                      transform: "rotate(-25deg)",
                    }}
                  />
                </div>

                {/* Header Strip */}
                <div
                  style={{
                    background: "#1e3a8a",
                    padding: "36px 48px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  <div>
                    <img src="/images/Logo-Bg-1-2.png" alt="SatwaiD" style={{ height: "72px", objectFit: "contain", display: "block" }} />
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.65)", fontWeight: "700", letterSpacing: "0.15em", textTransform: "uppercase" }}>Invoice Pengajuan Dana</div>
                    <div style={{ fontSize: "22px", fontWeight: "900", color: "#fff", fontFamily: "monospace", marginTop: "4px" }}>{inv.order_id}</div>
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", marginTop: "6px" }}>Diterbitkan: {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</div>
                  </div>
                </div>

                {/* Body */}
                <div style={{ padding: "40px 48px", position: "relative", zIndex: 1 }}>
                  {/* Status Badge */}
                  <div style={{ marginBottom: "32px" }}>
                    <div
                      style={{
                        display: "inline-block",
                        padding: "8px 20px",
                        borderRadius: "100px",
                        background: inv.disbursed_at || inv.disbursement_proof ? "#d1fae5" : "#fef3c7",
                        color: inv.disbursed_at || inv.disbursement_proof ? "#065f46" : "#92400e",
                        fontSize: "11px",
                        fontWeight: "800",
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        border: `1px solid ${inv.disbursed_at || inv.disbursement_proof ? "#6ee7b7" : "#fcd34d"}`,
                        verticalAlign: "middle",
                      }}
                    >
                      <span
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          background: inv.disbursed_at || inv.disbursement_proof ? "#065f46" : "#92400e",
                          display: "inline-block",
                          verticalAlign: "middle",
                          marginRight: "8px",
                        }}
                      />
                      <span style={{ verticalAlign: "middle" }}>{inv.disbursed_at || inv.disbursement_proof ? "Dana Telah Dicairkan" : "Menunggu Pencairan"}</span>
                    </div>
                    {inv.disbursed_at && <span style={{ fontSize: "11px", color: "#6b7280", fontWeight: "600", marginLeft: "12px", verticalAlign: "middle", display: "inline-block" }}>• Tanggal Transfer: {new Date(inv.disbursed_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span>}
                  </div>

                  {/* 2-column info grid */}
                  <div style={{ display: "flex", gap: "24px", marginBottom: "36px" }}>
                    {/* Seller */}
                    <div style={{ flex: 1, background: "#f9fafb", borderRadius: "16px", padding: "24px", border: "1px solid #e5e7eb" }}>
                      <div style={{ fontSize: "10px", fontWeight: "800", color: "#059669", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "16px", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ width: "3px", height: "14px", background: "#059669", borderRadius: "2px", display: "inline-block" }}></span>
                        Informasi Penjual
                      </div>
                      <div style={{ fontSize: "16px", fontWeight: "900", color: "#111827", marginBottom: "4px" }}>{shop?.name || "-"}</div>
                      <div style={{ fontSize: "12px", color: "#6b7280", fontWeight: "600", marginBottom: "2px" }}>
                        {shop?.city}
                        {shop?.province ? `, ${shop?.province}` : ""}
                      </div>
                      <div style={{ fontSize: "12px", color: "#6b7280", fontWeight: "600", marginBottom: "2px" }}>+62 {shop?.whatsapp || "-"}</div>
                      <div style={{ fontSize: "12px", color: "#6b7280", fontWeight: "600" }}>{shop?.owner?.email || "-"}</div>
                      {bank && (
                        <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px dashed #e5e7eb" }}>
                          <div style={{ fontSize: "10px", color: "#9ca3af", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "6px" }}>Rekening Penerima</div>
                          <div style={{ fontSize: "13px", fontWeight: "800", color: "#111827" }}>{bank.bank_name || bank.bankName}</div>
                          <div style={{ fontSize: "13px", fontWeight: "700", color: "#374151", fontFamily: "monospace", letterSpacing: "0.06em" }}>{bank.account_number || bank.accountNumber}</div>
                          <div style={{ fontSize: "11px", color: "#6b7280", fontWeight: "600" }}>a.n. {bank.account_name || bank.accountName || shop?.owner?.name}</div>
                        </div>
                      )}
                    </div>

                    {/* Buyer */}
                    <div style={{ flex: 1, background: "#f9fafb", borderRadius: "16px", padding: "24px", border: "1px solid #e5e7eb" }}>
                      <div style={{ fontSize: "10px", fontWeight: "800", color: "#7c3aed", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "16px", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ width: "3px", height: "14px", background: "#7c3aed", borderRadius: "2px", display: "inline-block" }}></span>
                        Informasi Pembeli
                      </div>
                      <div style={{ fontSize: "16px", fontWeight: "900", color: "#111827", marginBottom: "4px" }}>{inv.user?.name || inv.user?.username || "-"}</div>
                      <div style={{ fontSize: "12px", color: "#6b7280", fontWeight: "600", marginBottom: "2px" }}>{inv.user?.email || "-"}</div>
                      <div style={{ fontSize: "12px", color: "#6b7280", fontWeight: "600", marginBottom: "2px" }}>{inv.user?.phone || "-"}</div>
                      <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px dashed #e5e7eb" }}>
                        <div style={{ fontSize: "10px", color: "#9ca3af", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "6px" }}>Informasi Pesanan</div>
                        <div style={{ fontSize: "12px", color: "#374151", fontWeight: "600", marginBottom: "2px" }}>Tgl Order: {new Date(inv.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</div>
                        {inv.disbursement_requested_at && <div style={{ fontSize: "12px", color: "#374151", fontWeight: "600", marginBottom: "2px" }}>Tgl Pengajuan: {new Date(inv.disbursement_requested_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</div>}
                      </div>
                    </div>
                  </div>

                  {/* Product Table */}
                  <div style={{ marginBottom: "32px" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                      <thead>
                        <tr style={{ background: "#111827" }}>
                          <th style={{ padding: "14px 20px", textAlign: "left", color: "#fff", fontWeight: "800", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", borderRadius: "8px 0 0 8px" }}>Produk</th>
                          <th style={{ padding: "14px 20px", textAlign: "center", color: "#fff", fontWeight: "800", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase" }}>Qty</th>
                          <th style={{ padding: "14px 20px", textAlign: "right", color: "#fff", fontWeight: "800", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase" }}>Harga Satuan</th>
                          <th style={{ padding: "14px 20px", textAlign: "right", color: "#fff", fontWeight: "800", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", borderRadius: "0 8px 8px 0" }}>Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                          <td style={{ padding: "16px 20px" }}>
                            <div style={{ fontWeight: "700", color: "#111827", fontSize: "14px" }}>{inv.product?.name || "Produk"}</div>
                            <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "2px", fontWeight: "600" }}>
                              ID: {inv.product?.product_id || "-"} • {inv.product?.species || ""}
                            </div>
                          </td>
                          <td style={{ padding: "16px 20px", textAlign: "center", fontWeight: "700", color: "#374151" }}>{inv.quantity}</td>
                          <td style={{ padding: "16px 20px", textAlign: "right", fontWeight: "700", color: "#374151" }}>{formatPrice(inv.price)}</td>
                          <td style={{ padding: "16px 20px", textAlign: "right", fontWeight: "800", color: "#111827" }}>{formatPrice(subtotal)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Cost Breakdown */}
                  <div style={{ marginBottom: "32px", display: "flex" }}>
                    <div style={{ marginLeft: "auto", width: "340px", background: "#f9fafb", borderRadius: "16px", overflow: "hidden", border: "1px solid #e5e7eb" }}>
                      {[
                        { label: "Subtotal Produk", val: formatPrice(subtotal), color: "#374151" },
                        { label: "Ongkos Kirim", val: inv.product?.is_free_shipping ? "GRATIS" : formatPrice(shipping), color: inv.product?.is_free_shipping ? "#059669" : "#374151" },
                        { label: "Biaya Packing", val: inv.product?.is_free_packing ? "GRATIS" : formatPrice(packing), color: inv.product?.is_free_packing ? "#059669" : "#374151" },
                        { label: "Biaya Admin", val: formatPrice(adminFee), color: "#374151" },
                      ].map((row, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "12px 20px", borderBottom: "1px solid #e5e7eb" }}>
                          <span style={{ fontSize: "12px", color: "#6b7280", fontWeight: "600" }}>{row.label}</span>
                          <span style={{ fontSize: "12px", fontWeight: "700", color: row.color }}>{row.val}</span>
                        </div>
                      ))}
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "16px 20px", background: "#111827" }}>
                        <span style={{ fontSize: "13px", color: "#fff", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Tagihan Pembeli</span>
                        <span style={{ fontSize: "15px", fontWeight: "900", color: "#34d399", fontFamily: "monospace" }}>{formatPrice(total)}</span>
                      </div>
                      {addFee > 0 && (
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 20px", borderTop: "1px solid #e5e7eb", background: "#fff7ed" }}>
                          <span style={{ fontSize: "12px", color: "#92400e", fontWeight: "700" }}>Potongan Biaya Transfer</span>
                          <span style={{ fontSize: "12px", fontWeight: "800", color: "#dc2626" }}>-{formatPrice(addFee)}</span>
                        </div>
                      )}
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "16px 20px", background: "#ecfdf5", borderTop: "2px solid #6ee7b7" }}>
                        <span style={{ fontSize: "13px", color: "#065f46", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.05em" }}>Dana Diterima Penjual</span>
                        <span style={{ fontSize: "15px", fontWeight: "900", color: "#059669", fontFamily: "monospace" }}>{formatPrice(disbursed)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {inv.disbursement_notes && (
                    <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "12px", padding: "16px 20px", marginBottom: "28px" }}>
                      <div style={{ fontSize: "10px", fontWeight: "800", color: "#059669", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "6px" }}>Catatan Admin</div>
                      <div style={{ fontSize: "13px", color: "#374151", fontWeight: "600", fontStyle: "italic" }}>{`"${inv.disbursement_notes}"`}</div>
                    </div>
                  )}

                  {/* Footer */}
                  <div style={{ borderTop: "2px dashed #e5e7eb", paddingTop: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <div>
                      <div style={{ fontSize: "10px", color: "#9ca3af", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "4px" }}>Diterbitkan oleh</div>
                      <div style={{ fontSize: "16px", fontWeight: "900", color: "#059669" }}>SatwaiD</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "10px", color: "#9ca3af", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "4px" }}>Dokumen Resmi</div>
                      <div style={{ fontSize: "11px", color: "#9ca3af", fontWeight: "700", fontFamily: "monospace" }}>{inv.order_id}</div>
                      <div style={{ fontSize: "10px", color: "#9ca3af", fontWeight: "600", marginTop: "2px" }}>Dicetak: {new Date().toLocaleString("id-ID")}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Email Template Modal */}
              {showEmailModal &&
                (() => {
                  const namaSeller = shop?.name || shop?.owner?.name || "-";
                  const invoice = inv.order_id;
                  const tanggal = inv.disbursement_requested_at ? new Date(inv.disbursement_requested_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : new Date(inv.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
                  const totalDana = formatPrice(disbursed);

                  const emailBody = `Halo ${namaSeller},

Pengajuan pencairan dana Anda telah berhasil diterima oleh sistem SatwaiD.

Berikut detail pengajuan Anda:
• Nomor Invoice: ${invoice}
• Tanggal Pengajuan: ${tanggal}
• Status: Menunggu Pencairan
• Total Dana Diterima: ${totalDana}

Invoice resmi telah kami lampirkan pada email ini sebagai bukti pengajuan pencairan dana.

Tim SatwaiD akan melakukan proses verifikasi sebelum dana diteruskan ke rekening terdaftar Anda. Estimasi proses pencairan dapat berbeda tergantung antrean dan hasil verifikasi transaksi.

Silakan pastikan data rekening Anda sudah benar pada pengaturan profil toko.

Terima kasih telah menjadi bagian dari ekosistem SatwaiD.

Salam hangat,
Tim SatwaiD
Platform Jual Beli Satwa Terpercaya`;

                  return (
                    <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-md flex items-center justify-center z-[250] p-4 animate-in fade-in duration-300">
                      {/* Hapus h-[85vh] dan ganti dengan h-full */}
                      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-4xl h-full rounded-[2.5rem] p-8 shadow-2xl space-y-6 flex flex-col text-white">
                        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 shrink-0">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center border border-amber-500/10">
                              <Mail size={20} />
                            </div>
                            <div>
                              <h3 className="text-lg font-black text-white uppercase tracking-tight">Teks Email Pencairan</h3>
                              <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mt-0.5">Salin format email untuk dikirim ke seller</p>
                            </div>
                          </div>
                          <button onClick={() => setShowEmailModal(false)} className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors">
                            <X size={16} />
                          </button>
                        </div>

                        <div className="flex-1 flex flex-col space-y-4 min-h-0 pr-1">
                          <div className="bg-zinc-950/50 border border-zinc-800 p-5 rounded-2xl space-y-3 shrink-0">
                            <div className="flex justify-between items-center text-xs text-zinc-500 font-bold uppercase tracking-wider">
                              <span>Subject Email</span>
                              <span className="text-[10px] text-amber-500 font-black">REKOMENDASI</span>
                            </div>
                            <div className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-3 text-xs text-white font-bold select-all font-mono">[SatwaiD] Pengajuan Pencairan Dana Berhasil Diterima - {invoice}</div>
                          </div>

                          <div className="flex-1 flex flex-col space-y-2 min-h-0">
                            <div className="flex justify-between items-center shrink-0">
                              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Isi Email (Body)</label>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(emailBody);
                                  setInvoiceSentTrue(invoice);
                                  setActionModal({
                                    isOpen: true,
                                    type: "success",
                                    title: "Salin Berhasil",
                                    message: "Isi email telah disalin ke clipboard.",
                                    onConfirm: null,
                                  });
                                }}
                                className="text-[10px] font-black text-emerald-500 hover:text-emerald-400 uppercase tracking-widest transition-colors flex items-center gap-1"
                              >
                                Salin Teks
                              </button>
                            </div>
                            <textarea readOnly value={emailBody} className="flex-1 w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-5 text-xs text-zinc-300 font-medium outline-none focus:border-amber-500/30 transition-all font-mono leading-relaxed select-all resize-none" />
                          </div>
                        </div>

                        <div className="flex items-center gap-3 pt-4 border-t border-zinc-800 shrink-0">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(emailBody);
                              setInvoiceSentTrue(invoice);
                              setActionModal({
                                isOpen: true,
                                type: "success",
                                title: "Salin Berhasil",
                                message: "Isi email telah disalin ke clipboard.",
                                onConfirm: null,
                              });
                            }}
                            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/10"
                          >
                            Salin Semua Teks
                          </button>
                          <button onClick={() => setShowEmailModal(false)} className="px-6 py-3 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all">
                            Tutup
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
            </div>
          );
        })()}
    </div>
  );
}

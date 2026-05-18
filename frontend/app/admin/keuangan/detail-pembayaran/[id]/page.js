"use client";

import { useState, useEffect, use } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Search,
    Filter,
    Download,
    Upload,
    FileText,
    CheckCircle2,
    Clock,
    MoreVertical,
    DollarSign,
    ArrowLeft,
    ShoppingBag,
    Calendar,
    ArrowUpRight,
    Store,
    MapPin,
    CreditCard,
    Phone,
    Mail,
    User
} from "lucide-react";
import Link from "next/link";
import ActionModal from "@/components/ActionModal";

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
        type: 'success',
        title: '',
        message: '',
        onConfirm: null
    });

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Fetch Shop Details
            const shopRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/shops/${id}`);
            const shopResult = await shopRes.json();
            if (shopRes.ok && shopResult.data) {
                setShop(shopResult.data);
            } else {
                setActionModal({
                    isOpen: true,
                    type: 'error',
                    title: 'Toko Tidak Ditemukan',
                    message: 'Informasi toko seller tidak berhasil dimuat.',
                    onConfirm: () => router.push("/admin/keuangan")
                });
                return;
            }

            // Fetch Orders for this Shop
            const ordersRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/shop/${id}`);
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

    const filteredOrders = orders.filter(order => {
        // Hanya tampilkan order yang relevan untuk halaman keuangan
        const isRelevant = ['completed', 'disbursement_requested'].includes(order.status) ||
                           !!(order.disbursed_at || order.disbursement_proof);
        if (!isRelevant) return false;

        const matchesSearch = (order.order_id?.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (order.product?.name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (order.user?.username?.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (order.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()));

        let matchesStatus = true;
        if (statusFilter === "disbursed") {
            matchesStatus = !!(order.disbursed_at || order.disbursement_proof);
        } else if (statusFilter === "requested") {
            matchesStatus = order.status === 'disbursement_requested' && !(order.disbursed_at || order.disbursement_proof);
        } else if (statusFilter === "pending") {
            matchesStatus = order.status === 'completed' && !(order.disbursed_at || order.disbursement_proof);
        }

        return matchesSearch && matchesStatus;
    });

    const formatPrice = (price) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0
        }).format(price || 0);
    };

    const getImageUrl = (path) => {
        if (!path) return "https://placehold.co/100x100?text=No+Image";
        let finalPath = path;
        try {
            if (typeof path === 'string' && (path.startsWith('[') || path.startsWith('{'))) {
                const parsed = JSON.parse(path);
                finalPath = Array.isArray(parsed) ? parsed[0] : parsed;
            } else if (Array.isArray(path)) {
                finalPath = path[0];
            }
        } catch (e) { }
        if (!finalPath) return "https://placehold.co/100x100?text=No+Image";
        if (typeof finalPath !== 'string') return "https://placehold.co/100x100?text=Invalid+Path";
        if (finalPath.startsWith('http') || finalPath.startsWith('data:')) return finalPath;
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
        const formattedPath = finalPath.startsWith('/') ? finalPath : `/${finalPath}`;
        return `${baseUrl}${formattedPath}`;
    };

    const getDisbursementStatus = (order) => {
        if (order.disbursed_at || order.disbursement_proof) {
            return {
                label: "Selesai",
                style: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
                icon: <CheckCircle2 size={10} />
            };
        }
        if (order.status === 'disbursement_requested') {
            return {
                label: "Pengajuan",
                style: "bg-blue-500/10 text-blue-500 border-blue-500/20 animate-pulse",
                icon: <ArrowUpRight size={10} />
            };
        }
        return {
            label: "Belum Diajukan",
            style: "bg-zinc-800 text-zinc-400 border-zinc-700",
            icon: <Clock size={10} />
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
                <Link
                    href="/admin/keuangan"
                    className="inline-flex items-center gap-2 text-zinc-500 hover:text-emerald-500 transition-all group font-bold text-sm"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Kembali ke Keuangan Utama
                </Link>
                
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-zinc-900 pb-8">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-zinc-900 rounded-[1.5rem] flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-2xl overflow-hidden shrink-0">
                            {shop.logo_url ? (
                                <img src={getImageUrl(shop.logo_url)} className="w-full h-full object-cover" alt={shop.name} />
                            ) : (
                                <Store size={32} />
                            )}
                        </div>
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
                        <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center font-black text-[10px] uppercase border border-emerald-500/10 shrink-0">
                            Bank
                        </div>
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
                            {formatPrice(orders.filter(o => o.disbursed_at || o.disbursement_proof).reduce((acc, curr) => {
                                const total = (Number(curr.price || 0) * Number(curr.quantity || 1)) + 
                                              Number(curr.shipping_cost || 0) + 
                                              Number(curr.packing_cost || 0) - 
                                              Number(curr.additional_fee || 0);
                                return acc + total;
                            }, 0))}
                        </h3>
                    </div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 space-y-4">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 border border-blue-500/20">
                        <CheckCircle2 size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-black text-zinc-500 uppercase tracking-widest">Transfer Selesai</p>
                        <h3 className="text-2xl font-black text-white mt-1">{orders.filter(o => o.disbursed_at || o.disbursement_proof).length} Transaksi</h3>
                    </div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 space-y-4">
                    <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 border border-amber-500/20">
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-black text-zinc-500 uppercase tracking-widest">Menunggu Transfer</p>
                        <h3 className="text-2xl font-black text-white mt-1">{orders.filter(o => !o.disbursed_at && !o.disbursement_proof && (o.status === 'completed' || o.status === 'disbursement_requested')).length} Order</h3>
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
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-transparent text-white text-xs font-bold outline-none cursor-pointer w-full pr-4"
                    >
                        <option value="all" className="bg-zinc-900 text-white">Semua Status Pencairan</option>
                        <option value="disbursed" className="bg-zinc-900 text-white">Selesai Transfer</option>
                        <option value="requested" className="bg-zinc-900 text-white">Menunggu Konfirmasi</option>
                        <option value="pending" className="bg-zinc-900 text-white">Belum Ada Pengajuan</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-zinc-950/50 border-b border-zinc-800">
                                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">No</th>
                                <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Produk</th>
                                <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Invoice</th>
                                <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Tanggal Terjual</th>
                                <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Buyer</th>
                                <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Tanggal Pengajuan</th>
                                <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Tanggal Pencairan</th>
                                <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Nominal</th>
                                <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Status Transfer</th>
                                <th className="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {filteredOrders.length > 0 ? (
                                filteredOrders.map((order, index) => (
                                    <tr key={order.id} className="hover:bg-zinc-800/20 transition-colors group border-b border-zinc-800/50">
                                        <td className="px-6 py-6 text-center text-xs font-bold text-zinc-500 font-mono">
                                            {index + 1}
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 shrink-0">
                                                    <img
                                                        src={getImageUrl(order.product?.images)}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                        alt=""
                                                    />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-white line-clamp-1">{order.product?.name || "Produk dihapus"}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">Qty: {order.quantity}</span>
                                                        <span className="px-1.5 py-0.5 bg-zinc-950 text-[8px] text-zinc-400 rounded font-black uppercase tracking-widest border border-zinc-800">
                                                            ID: {order.product?.product_id || "-"}
                                                        </span>
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
                                                {new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
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
                                                        {new Date(order.disbursement_requested_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </div>
                                                    <span className="text-[10px] font-black text-zinc-500 font-mono tracking-tighter">
                                                        {new Date(order.disbursement_requested_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':')} WIB
                                                    </span>
                                                </div>
                                            ) : (order.disbursed_at || order.disbursement_proof) ? (
                                                <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[8px] font-black rounded-lg uppercase tracking-widest whitespace-nowrap">
                                                    Langsung Pencairan
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-bold text-zinc-600 italic">-</span>
                                            )}
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            {order.disbursed_at ? (
                                                <div className="flex flex-col items-center gap-0.5">
                                                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-500">
                                                        <Calendar size={12} className="text-emerald-500/70" />
                                                        {new Date(order.disbursed_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </div>
                                                    <span className="text-[10px] font-black text-zinc-500 font-mono tracking-tighter">
                                                        {new Date(order.disbursed_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':')} WIB
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-[10px] font-bold text-zinc-600 italic">-</span>
                                            )}
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col items-end">
                                                <span className="text-sm font-black text-emerald-500">{formatPrice(order.total_price)}</span>
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
                                            <div className="flex justify-center items-center gap-2">
                                                <Link
                                                    href={`/admin/keuangan/upload/${order.id}`}
                                                    className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-zinc-700 hover:border-zinc-600 group/btn shadow-inner min-w-[140px] justify-center"
                                                >
                                                    {(order.disbursed_at || order.disbursement_proof) ? (
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
                                    <td colSpan={10} className="px-8 py-20 text-center">
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
                            <button className="px-3 py-1 bg-zinc-800 text-zinc-500 rounded-lg text-[10px] font-black uppercase disabled:opacity-50" disabled>Prev</button>
                            <button className="px-3 py-1 bg-zinc-800 text-white rounded-lg text-[10px] font-black uppercase">Next</button>
                        </div>
                    </div>
                )}
            </div>

            <ActionModal
                isOpen={actionModal.isOpen}
                type={actionModal.type}
                title={actionModal.title}
                message={actionModal.message}
                onConfirm={actionModal.onConfirm}
            />
        </div>
    );
}

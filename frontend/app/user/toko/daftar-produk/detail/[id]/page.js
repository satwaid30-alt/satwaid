"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Tag,
    Trash2,
    Edit,
    ChevronLeft,
    ChevronRight,
    Truck,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Calendar,
    ScrollText,
    ShoppingBag,
    History,
    Package,
    Globe,
    VenusAndMars,
    Clock
} from "lucide-react";

export default function ListingDetailPage({ params }) {
    const { id } = use(params);
    const router = useRouter();
    const [listing, setListing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    useEffect(() => {
        fetchListingDetail();
    }, [id]);

    const fetchListingDetail = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/listings/${id}`);
            const result = await res.json();
            if (res.ok && result.data) {
                setListing(result.data);
            } else {
                alert("Gagal memuat detail produk");
                router.push("/user/toko/daftar-produk");
            }
        } catch (err) {
            console.error("Error fetching detail:", err);
            alert("Terjadi kesalahan koneksi");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Apakah Anda yakin ingin menghapus iklan ini?")) return;

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/listings/${id}`, {
                method: "DELETE"
            });
            if (res.ok) {
                alert("Iklan berhasil dihapus");
                router.push("/user/toko/daftar-produk");
            } else {
                alert("Gagal menghapus iklan");
            }
        } catch (err) {
            console.error("Error deleting listing:", err);
            alert("Terjadi kesalahan koneksi");
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0
        }).format(price || 0);
    };

    const getStatusStyles = (status) => {
        switch (status?.toLowerCase()) {
            case 'active':
                return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
            case 'rejected':
                return "bg-red-500/10 text-red-500 border-red-500/20";
            case 'pending':
                return "bg-amber-500/10 text-amber-500 border-amber-500/20";
            case 'sold':
                return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
            default:
                return "bg-zinc-500/10 text-zinc-500 border-zinc-500/20";
        }
    };

    const isSold = listing?.status?.toLowerCase() === 'sold';

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[600px] gap-6">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-emerald-500/20 rounded-full"></div>
                    <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                </div>
                <p className="text-zinc-500 font-black uppercase tracking-widest text-xs animate-pulse">Memuat detail produk...</p>
            </div>
        );
    }

    if (!listing) return null;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-12 animate-in fade-in duration-700">
            {/* Navigation Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
                <Link
                    href="/user/toko/daftar-produk"
                    className="inline-flex items-center gap-3 text-zinc-500 hover:text-white transition-all group"
                >
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:bg-zinc-800 group-hover:border-zinc-700 transition-all">
                        <ChevronLeft size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 group-hover:text-emerald-500 transition-colors leading-none mb-1">Kembali</p>
                        <p className="text-sm font-bold">Daftar Jualan</p>
                    </div>
                </Link>

                {/* <div className="flex items-center gap-3 self-end md:self-auto">
                    <span className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border shadow-lg ${getStatusStyles(listing.status)}`}>
                        Status: {listing.status}
                    </span>
                </div> */}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                <div className="lg:col-span-5 space-y-4 lg:space-y-6">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl lg:rounded-[2.5rem] overflow-hidden shadow-2xl relative">
                        <div className="w-full aspect-square bg-zinc-950 relative group cursor-zoom-in">
                            {listing.images && listing.images[activeImageIndex] ? (
                                <img
                                    src={listing.images[activeImageIndex]}
                                    alt={listing.name}
                                    className="w-full h-full object-contain p-4 lg:p-8"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-zinc-800">
                                    <ShoppingBag size={80} />
                                </div>
                            )}

                            {/* Image Nav Arrows */}
                            {listing.images?.length > 1 && (
                                <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                                    <button
                                        onClick={() => setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : listing.images.length - 1))}
                                        className="p-3 lg:p-4 bg-zinc-900/80 backdrop-blur-md text-white rounded-xl lg:rounded-2xl hover:bg-emerald-500 hover:text-zinc-950 transition-all pointer-events-auto shadow-xl"
                                    >
                                        <ChevronLeft size={20} className="lg:w-6 lg:h-6" />
                                    </button>
                                    <button
                                        onClick={() => setActiveImageIndex((prev) => (prev < listing.images.length - 1 ? prev + 1 : 0))}
                                        className="p-3 lg:p-4 bg-zinc-900/80 backdrop-blur-md text-white rounded-xl lg:rounded-2xl hover:bg-emerald-500 hover:text-zinc-950 transition-all pointer-events-auto shadow-xl"
                                    >
                                        <ChevronRight size={20} className="lg:w-6 lg:h-6" />
                                    </button>
                                </div>
                            )}

                            {/* Image Counter Badge */}
                            {listing.images?.length > 1 && (
                                <div className="absolute bottom-6 right-6 px-4 py-2 bg-zinc-950/60 backdrop-blur-md border border-zinc-800 rounded-full text-[10px] font-black text-white uppercase tracking-widest shadow-xl">
                                    {activeImageIndex + 1} / {listing.images.length} Foto
                                </div>
                            )}
                        </div>

                        {/* Thumbnails */}
                        {listing.images?.length > 1 && (
                            <div className="p-4 lg:p-6 bg-zinc-950/30 border-t border-zinc-800 flex gap-3 lg:gap-4 overflow-x-auto custom-scrollbar">
                                {listing.images?.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveImageIndex(idx)}
                                        className={`w-16 h-16 lg:w-20 lg:h-20 rounded-xl lg:rounded-2xl overflow-hidden border-2 shrink-0 transition-all duration-300 ${activeImageIndex === idx ? 'border-emerald-500 scale-105 shadow-xl shadow-emerald-500/20' : 'border-zinc-800 opacity-40 hover:opacity-100'}`}
                                    >
                                        <img src={img} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT: Info Section */}
                <div className="lg:col-span-7 space-y-6 lg:space-y-8">
                    {/* Basic Info & Price */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl lg:rounded-[2.5rem] p-6 lg:p-12 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] -mr-32 -mt-32 group-hover:bg-emerald-500/10 transition-colors duration-700"></div>

                        <div className="relative space-y-8">
                            <div className="space-y-4">
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border ${
                                        listing.status?.toLowerCase() === 'sold' || listing.type === 'sell' 
                                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                                            : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                    }`}>
                                        {listing.status?.toLowerCase() === 'sold' ? 'Terjual' : (listing.type === 'sell' ? 'Ready Stock' : 'Auction / Lelang')}
                                    </span>
                                    <span className="px-4 py-1.5 rounded-full text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] border border-zinc-800 bg-zinc-950/50">
                                        ID Produk: {listing.product_id || 'PENDING'}
                                    </span>
                                </div>
                                <div>
                                    <h4 className="text-emerald-500 font-black uppercase tracking-[0.3em] text-[9px] lg:text-[10px] mb-1 lg:mb-2">{listing.species}</h4>
                                    <h1 className="text-2xl lg:text-3xl font-black text-white leading-tight tracking-tight break-words">{listing.name}</h1>
                                </div>
                            </div>

                            {/* Price Card */}
                            <div className="bg-zinc-950 rounded-3xl p-8 border border-zinc-800 shadow-inner group/price relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 text-emerald-500/5 group-hover/price:text-emerald-500/10 transition-colors">
                                    <Tag size={120} strokeWidth={1.5} />
                                </div>

                                <div className="relative">
                                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-3">
                                        {listing.type === 'sell' ? 'Harga' : 'Open Bid Terkini'}
                                    </p>
                                    <div className="flex flex-wrap items-baseline gap-2 lg:gap-4">
                                        <p className="text-2xl lg:text-3xl font-black text-white tracking-tighter">
                                            {formatPrice(listing.type === 'sell' ? listing.price : (listing.current_bid || listing.start_bid))}
                                        </p>
                                        {listing.type === 'auction' && (
                                            <p className="text-amber-500 font-black text-sm mb-2">
                                                (Kelipatan +{formatPrice(listing.multiple)})
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-zinc-800/50">
                                        {listing.is_free_shipping && (
                                            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                                                <Truck size={14} className="text-emerald-500" />
                                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Gratis Ongkir</span>
                                            </div>
                                        )}
                                        {listing.is_free_packing && (
                                            <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                                                <AlertCircle size={14} className="text-blue-500" />
                                                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Gratis Packing</span>
                                            </div>
                                        )}
                                        {!listing.is_free_shipping && !listing.is_free_packing && (
                                            <p className="text-[10px] font-bold text-zinc-600 italic">Biaya kirim & packing dihitung kemudian.</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Specs Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
                                <div className="p-4 lg:p-5 bg-zinc-950/40 border border-zinc-800/60 rounded-2xl lg:rounded-3xl group/spec hover:border-emerald-500/30 transition-all duration-300">
                                    <VenusAndMars size={16} className="text-emerald-500 mb-2 lg:mb-3 group-hover/spec:scale-110 transition-transform" />
                                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Kelamin</p>
                                    <p className="text-xs lg:text-sm font-black text-zinc-200">{listing.sex || 'Unsex'}</p>
                                </div>
                                <div className="p-4 lg:p-5 bg-zinc-950/40 border border-zinc-800/60 rounded-2xl lg:rounded-3xl group/spec hover:border-emerald-500/30 transition-all duration-300">
                                    <Globe size={16} className="text-emerald-500 mb-2 lg:mb-3 group-hover/spec:scale-110 transition-transform" />
                                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Jangkauan</p>
                                    <p className="text-xs lg:text-sm font-black text-zinc-200">{listing.shipping_type || '-'}</p>
                                </div>
                                <div className="p-4 lg:p-5 bg-zinc-950/40 border border-zinc-800/60 rounded-2xl lg:rounded-3xl group/spec hover:border-emerald-500/30 transition-all duration-300">
                                    <Package size={16} className="text-emerald-500 mb-2 lg:mb-3 group-hover/spec:scale-110 transition-transform" />
                                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Stok</p>
                                    <p className="text-xs lg:text-sm font-black text-zinc-200">{listing.stock || 0} Ekor</p>
                                </div>
                                <div className="p-4 lg:p-5 bg-zinc-950/40 border border-zinc-800/60 rounded-2xl lg:rounded-3xl group/spec hover:border-emerald-500/30 transition-all duration-300">
                                    <Clock size={16} className="text-emerald-500 mb-2 lg:mb-3 group-hover/spec:scale-110 transition-transform" />
                                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Posting</p>
                                    <p className="text-xs lg:text-sm font-black text-zinc-200">{new Date(listing.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="pt-4 lg:pt-6 flex flex-col sm:flex-row gap-3 lg:gap-4">
                                {isSold ? (
                                    <div className="flex-1 bg-zinc-800/50 border border-zinc-700 text-zinc-500 font-black py-4 lg:py-5 rounded-2xl lg:rounded-[2rem] flex items-center justify-center gap-3 cursor-not-allowed text-xs lg:text-sm">
                                        <ShoppingBag size={20} />
                                        PRODUK SUDAH TERJUAL
                                    </div>
                                ) : (
                                    <Link
                                        href={`/user/toko/jual-produk/edit/${listing.id}`}
                                        className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black py-4 lg:py-5 rounded-2xl lg:rounded-[2rem] flex items-center justify-center gap-3 transition-all shadow-xl shadow-emerald-500/20 active:scale-95 group/btn text-xs lg:text-sm"
                                    >
                                        <Edit size={20} className="group-hover:rotate-12 transition-transform" />
                                        UBAH DATA IKLAN
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Descriptions Section */}
                    <div className="grid grid-cols-1 gap-6 lg:gap-8">
                        {/* Main Description */}
                        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl lg:rounded-[2.5rem] p-6 lg:p-12 shadow-2xl relative overflow-hidden group">
                            <div className="flex items-center gap-4 mb-6 lg:mb-10">
                                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-zinc-950 border border-zinc-800 rounded-xl lg:rounded-2xl flex items-center justify-center text-emerald-500 shadow-xl group-hover:border-emerald-500/30 transition-colors">
                                    <ScrollText size={22} />
                                </div>
                                <h3 className="text-lg lg:text-xl font-black text-white tracking-tight uppercase tracking-[0.2em]">Deskripsi Produk</h3>
                                <div className="flex-1 h-px bg-zinc-800/50"></div>
                            </div>

                            <div
                                className="description-content text-zinc-400 font-medium leading-[1.8] text-sm lg:text-base prose prose-invert max-w-none"
                                dangerouslySetInnerHTML={{ __html: listing.description || "<p class='italic text-zinc-600'>Tidak ada deskripsi produk.</p>" }}
                            ></div>
                        </div>

                        {/* Shipping/Policy */}
                        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl lg:rounded-[2.5rem] p-6 lg:p-12 shadow-2xl relative overflow-hidden group">
                            <div className="flex items-center gap-4 mb-6 lg:mb-10">
                                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-zinc-950 border border-zinc-800 rounded-xl lg:rounded-2xl flex items-center justify-center text-amber-500 shadow-xl group-hover:border-amber-500/30 transition-colors">
                                    <Truck size={22} />
                                </div>
                                <h3 className="text-lg lg:text-xl font-black text-white tracking-tight uppercase tracking-[0.2em]">Info Pengiriman</h3>
                                <div className="flex-1 h-px bg-zinc-800/50"></div>
                            </div>

                            <div
                                className="description-content text-zinc-400 font-medium leading-[1.8] text-sm lg:text-base prose prose-invert max-w-none"
                                dangerouslySetInnerHTML={{ __html: listing.shipping_description || "<p class='italic text-zinc-600'>Tidak ada informasi pengiriman khusus.</p>" }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .description-content {
                    overflow-wrap: break-word;
                    word-wrap: break-word;
                    word-break: normal;
                    line-break: auto;
                    white-space: normal;
                    overflow: visible;
                }
                .description-content ul {
                    list-style-type: disc !important;
                    list-style-position: outside !important;
                    padding-left: 1.5rem !important;
                    margin: 1rem 0 !important;
                }
                .description-content ol {
                    list-style-type: decimal !important;
                    list-style-position: outside !important;
                    padding-left: 1.5rem !important;
                    margin: 1rem 0 !important;
                }
                .description-content li {
                    display: list-item !important;
                    margin-bottom: 0.5rem !important;
                }
                .description-content li::before {
                    content: none !important;
                }
                .description-content li p {
                    display: inline !important;
                    margin: 0 !important;
                }
                .description-content p {
                    margin-bottom: 1rem !important;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    height: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #18181b;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #3f3f46;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #52525b;
                }
                @keyframes shake {
                    0%, 100% { transform: rotate(0); }
                    25% { transform: rotate(-10deg); }
                    75% { transform: rotate(10deg); }
                }
                .group/del:hover .group-hover\:shake {
                    animation: shake 0.2s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}

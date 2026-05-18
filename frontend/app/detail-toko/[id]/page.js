"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import ProductCard from "../../../components/ProductCard";
import { MapPin, Star, Store, Calendar, MessageCircle, Share2, Info, ChevronLeft } from "lucide-react";
import ActionModal from "../../../components/ActionModal";
import ChatModal from "../../../components/ChatModal";
import Link from "next/link";
import { copyToClipboard } from "../../utils/clipboard";

export default function DetailTokoPage() {
    const params = useParams();
    const id = params.id;

    const [shop, setShop] = useState(null);
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    // Calculate pagination values
    const totalItems = products.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentProducts = products.slice(indexOfFirstItem, indexOfLastItem);

    // Modal States
    const [actionModal, setActionModal] = useState({
        isOpen: false,
        type: 'success',
        title: '',
        message: '',
        onConfirm: null,
        confirmText: '',
        isLoading: false
    });

    const [chatConfig, setChatConfig] = useState({
        isOpen: false,
        sellerId: null,
        buyerId: null,
        sellerName: '',
        buyerName: '',
        productId: null
    });

    useEffect(() => {
        // Load current user
        const userStr = localStorage.getItem("user");
        if (userStr) {
            try {
                setCurrentUser(JSON.parse(userStr));
            } catch (e) {
                console.error("Error parsing user data", e);
            }
        }

        if (id) {
            fetchShopDetails();
        }
    }, [id]);

    const fetchShopDetails = async () => {
        try {
            // Fetch shop info
            const shopRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/shops/${id}`);
            const shopData = await shopRes.json();

            if (shopRes.ok) {
                setShop(shopData.data);

                // Fetch products for this shop
                const productsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/listings/shop/${id}`);
                const productsData = await productsRes.json();
                if (productsRes.ok) {
                    setProducts(productsData.data || []);
                }
            }
        } catch (err) {
            console.error("Error fetching shop details:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleChatSeller = () => {
        if (!currentUser) {
            window.location.href = "/login";
            return;
        }

        if (shop.user_id === currentUser.id) {
            setActionModal({
                isOpen: true,
                type: 'info',
                title: 'Info',
                message: 'Ini adalah toko Anda sendiri.',
                onConfirm: null
            });
            return;
        }

        setChatConfig({
            isOpen: true,
            sellerId: shop.user_id,
            buyerId: currentUser.id,
            sellerName: shop.name || 'Seller',
            buyerName: currentUser.name || currentUser.username,
            productId: null // No specific product when chatting from profile
        });
    };

    const handleShare = async () => {
        const url = window.location.href;

        // Try Web Share API first (mostly mobile)
        if (navigator.share) {
            try {
                await navigator.share({
                    title: shop?.name || "Toko",
                    text: `Lihat toko ${shop?.name || ""} di REPTILEHAVEN!`,
                    url: url,
                });
                return;
            } catch (err) {
                // If it's an AbortError, the user just closed the share sheet
                if (err.name === 'AbortError') return;
                console.error('Error sharing:', err);
                // Fallback to clipboard if share fails
            }
        }

        // Fallback to clipboard
        const success = await copyToClipboard(url);

        if (success) {
            setActionModal({
                isOpen: true,
                type: 'success',
                title: 'Link Berhasil Disalin',
                message: 'Tautan profil toko telah disalin ke clipboard Anda.',
                onConfirm: null
            });
        } else {
            setActionModal({
                isOpen: true,
                type: 'info',
                title: 'Gagal Menyalin Otomatis',
                message: 'Silakan salin link di browser Anda secara manual.',
                onConfirm: null
            });
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    if (!shop) {
        return (
            <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center">
                <Store size={64} className="text-zinc-300 mb-4" />
                <h1 className="text-2xl font-bold text-zinc-900">Toko tidak ditemukan</h1>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 font-sans selection:bg-emerald-100">
            <Navbar theme="light" />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-24 sm:py-32">
                {/* Shop Profile Header - Premium Redesign */}
                <div className="relative mb-16">
                    {/* Banner Section */}
                    <div className="h-48 sm:h-72 rounded-[2.5rem] overflow-hidden relative shadow-2xl group">
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 animate-gradient-x"></div>
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

                        {/* Decorative Elements */}
                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl"></div>
                    </div>

                    {/* Shop Info Container */}
                    <div className="max-w-6xl mx-auto px-4 sm:px-12 -mt-16 sm:-mt-24 relative z-10">
                        <div className="bg-white/90 backdrop-blur-2xl rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-12 shadow-2xl border border-white/50 flex flex-col md:flex-row items-center md:items-end gap-6 sm:gap-8">

                            {/* Shop Logo Overlay */}
                            <div className="relative group/logo">
                                <div className="absolute inset-0 rounded-3xl sm:rounded-[2.5rem] blur-xl opacity-40 group-hover/logo:opacity-60 transition-opacity"></div>
                                <div className="w-24 h-24 sm:w-44 sm:h-44 rounded-3xl sm:rounded-[2.5rem] bg-white p-1 shadow-2xl relative overflow-hidden ring-2 sm:ring-4 ring-white">
                                    <div className="w-full h-full rounded-[1.25rem] sm:rounded-[2rem] overflow-hidden bg-zinc-50 border border-zinc-100">
                                        {shop.logo_url ? (
                                            <img src={shop.logo_url} alt={shop.name} className="w-full h-full object-cover group-hover/logo:scale-110 transition-transform duration-700" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-zinc-300">
                                                <Store size={40} className="sm:w-[64px] sm:h-[64px]" strokeWidth={1.5} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {shop.status === 'Verified' && (
                                    <div className="absolute -top-2 -right-2 bg-emerald-500 text-white p-2 rounded-2xl shadow-lg ring-4 ring-white animate-bounce-subtle">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 4.946-2.597 9.181-6.5 11.5a11.954 11.954 0 01-11.5-11.5c0-.68.056-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                )}
                            </div>

                            {/* Details Section */}
                            <div className="flex-1 text-center md:text-left space-y-3 sm:space-y-4">
                                <div>
                                    <h1 className="text-xl sm:text-5xl font-black text-zinc-900 tracking-tight flex items-center justify-center md:justify-start gap-2 sm:gap-3">
                                        {shop.name}
                                        <span className="hidden sm:inline-flex px-3 py-1 bg-emerald-100 text-emerald-600 text-xs font-black uppercase rounded-lg tracking-widest border border-emerald-200">Official Store</span>
                                    </h1>
                                    <div className="flex flex-wrap justify-center md:justify-start gap-3 sm:gap-4 mt-2 sm:mt-3">
                                        <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] sm:text-sm font-medium">
                                            <div className="p-1 sm:p-1.5 bg-emerald-50 rounded-lg text-emerald-500"><MapPin size={12} className="sm:w-[14px] sm:h-[14px]" /></div>
                                            {shop.city || "Lokasi tidak diset"}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] sm:text-sm font-bold">
                                            <div className="p-1 sm:p-1.5 bg-amber-50 rounded-lg text-amber-500"><Star size={12} className="fill-amber-500 sm:w-[14px] sm:h-[14px]" /></div>
                                            {shop.avgRating || "0.0"} <span className="text-zinc-300 font-medium">Rating Toko</span>
                                            {shop.totalRatings > 0 && (
                                                <span className="text-[8px] sm:text-xs text-zinc-400 font-medium ml-0.5 sm:ml-1">({shop.totalRatings} Penilaian)</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Stats Bar */}
                                <div className="flex flex-wrap justify-center md:justify-start gap-4 sm:gap-6 pt-1 sm:pt-2">
                                    <div className="text-center md:text-left">
                                        <p className="text-[11px] sm:text-xl font-black text-zinc-900">{products.length}</p>
                                        <p className="text-[8px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-widest">Produk</p>
                                    </div>
                                    <div className="w-px h-6 sm:h-8 bg-zinc-100 self-center hidden sm:block"></div>
                                    <div className="text-center md:text-left">
                                        <p className="text-[11px] sm:text-xl font-black text-zinc-900">{shop.totalSales || 0}</p>
                                        <p className="text-[8px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-widest">Terjual</p>
                                    </div>
                                    <div className="w-px h-6 sm:h-8 bg-zinc-100 self-center hidden sm:block"></div>
                                    <div className="text-center md:text-left">
                                        <p className="text-[11px] sm:text-xl font-black text-zinc-900">
                                            {new Date(shop.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </p>
                                        <p className="text-[8px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-widest">Gabung</p>
                                    </div>
                                </div>
                            </div>

                            {/* Action Area */}
                            <div className="flex flex-col gap-2 sm:gap-3 w-full sm:w-auto md:self-center">
                                {shop.whatsapp && (
                                    <a
                                        href={`https://wa.me/${shop.whatsapp.replace(/\D/g, '')}?text=Halo ${shop.name}, saya tertarik dengan produk Anda di REPTILEHAVEN.`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full sm:w-56 flex items-center justify-center gap-2 sm:gap-3 bg-[#25D366] hover:bg-[#128C7E] text-white font-black px-6 py-3 sm:px-8 sm:py-4 rounded-xl sm:rounded-2xl text-xs sm:text-base transition-all active:scale-95 group"
                                    >
                                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.246 2.248 3.484 5.232 3.484 8.412-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.309 1.656zm6.224-3.82l.448.265c1.485.881 3.192 1.347 4.933 1.348 5.456 0 9.897-4.44 9.899-9.898.001-2.646-1.03-5.133-2.903-7.006-1.874-1.874-4.359-2.907-7.004-2.907-5.457 0-9.898 4.44-9.9 9.898-.001 2.107.549 4.159 1.59 5.968l.301.517-1.103 4.029 4.125-1.082zM17.472 14.382c-.301-.15-1.78-.879-2.056-.979-.276-.1-.477-.15-.677.15-.2.299-.777.979-.951 1.178-.174.2-.349.226-.65.075-.301-.15-1.272-.469-2.422-1.494-.894-.797-1.498-1.783-1.674-2.083-.176-.3-.019-.462.132-.611.135-.134.301-.35.451-.525.15-.175.2-.299.301-.499.1-.2.05-.375-.025-.525-.075-.15-.677-1.633-.927-2.235-.243-.587-.491-.507-.677-.517-.175-.008-.376-.01-.577-.01s-.526.075-.802.375c-.276.3-1.052 1.026-1.052 2.503s1.077 2.903 1.227 3.103c.15.2 2.119 3.235 5.132 4.532.716.308 1.276.492 1.711.631.719.228 1.373.196 1.89.119.576-.086 1.78-.727 2.031-1.428.25-.701.25-1.302.175-1.428-.075-.126-.276-.226-.577-.376z" />
                                        </svg>
                                        Chat WhatsApp
                                    </a>
                                )}
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleShare}
                                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white border border-zinc-200 hover:border-emerald-200 text-zinc-600 hover:text-emerald-600 font-bold px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-base transition-all active:scale-95"
                                    >
                                        <Share2 size={16} className="sm:w-[18px] sm:h-[18px]" /> Bagikan
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Products Section Grid */}
                <div className="space-y-8">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-black text-zinc-900">Semua Produk</h2>
                        <span className="text-sm font-bold text-zinc-400">{products.length} Produk</span>
                    </div>

                    {products.length > 0 ? (
                        <>
                            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 mb-12">
                                {currentProducts.map((product) => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>

                            {/* Pagination UI */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-6 sm:px-6 mt-8">
                                    <div className="flex flex-1 justify-between sm:hidden">
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                            disabled={currentPage === 1}
                                            className="relative inline-flex items-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-bold text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 transition-colors"
                                        >
                                            Previous
                                        </button>
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                            disabled={currentPage === totalPages}
                                            className="relative ml-3 inline-flex items-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-bold text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 transition-colors"
                                        >
                                            Next
                                        </button>
                                    </div>
                                    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-sm text-zinc-500 font-medium">
                                                Showing <span className="font-black text-zinc-900">{indexOfFirstItem + 1}</span> to <span className="font-black text-zinc-900">{Math.min(indexOfLastItem, totalItems)}</span> of <span className="font-black text-zinc-900">{totalItems}</span> results
                                            </p>
                                        </div>
                                        <div>
                                            <nav className="isolate inline-flex gap-1 rounded-xl" aria-label="Pagination">
                                                <button
                                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                    disabled={currentPage === 1}
                                                    className="relative inline-flex items-center rounded-xl px-3 py-2 text-zinc-400 hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-30 transition-all"
                                                >
                                                    <span className="sr-only">Previous</span>
                                                    <ChevronLeft size={20} />
                                                </button>

                                                {[...Array(totalPages)].map((_, i) => {
                                                    const pageNum = i + 1;
                                                    // Show logic: first, last, and current +/- 1
                                                    if (
                                                        pageNum === 1 ||
                                                        pageNum === totalPages ||
                                                        (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                                                    ) {
                                                        return (
                                                            <button
                                                                key={pageNum}
                                                                onClick={() => setCurrentPage(pageNum)}
                                                                className={`relative inline-flex items-center rounded-xl px-4 py-2 text-sm font-black transition-all ${currentPage === pageNum
                                                                    ? "z-10 bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-110"
                                                                    : "text-zinc-500 hover:bg-zinc-100"
                                                                    }`}
                                                            >
                                                                {pageNum}
                                                            </button>
                                                        );
                                                    } else if (
                                                        (pageNum === currentPage - 2 && pageNum > 1) ||
                                                        (pageNum === currentPage + 2 && pageNum < totalPages)
                                                    ) {
                                                        return <span key={pageNum} className="relative inline-flex items-center px-4 py-2 text-sm font-bold text-zinc-400">...</span>;
                                                    }
                                                    return null;
                                                })}

                                                <button
                                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                                    disabled={currentPage === totalPages}
                                                    className="relative inline-flex items-center rounded-xl px-3 py-2 text-zinc-400 hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-30 transition-all"
                                                >
                                                    <span className="sr-only">Next</span>
                                                    <ChevronLeft size={20} className="rotate-180" />
                                                </button>
                                            </nav>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="bg-white rounded-3xl p-20 text-center border border-zinc-100">
                            <Store size={48} className="text-zinc-200 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-zinc-900">Belum ada produk</h3>
                            <p className="text-zinc-500 mt-1">Toko ini belum memiliki produk aktif.</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Global Modals */}
            <ActionModal
                isOpen={actionModal.isOpen}
                onClose={() => setActionModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={actionModal.onConfirm}
                type={actionModal.type}
                title={actionModal.title}
                message={actionModal.message}
                confirmText={actionModal.confirmText}
                isLoading={actionModal.isLoading}
            />

            <ChatModal
                isOpen={chatConfig.isOpen}
                onClose={() => setChatConfig(prev => ({ ...prev, isOpen: false }))}
                sellerId={chatConfig.sellerId}
                buyerId={chatConfig.buyerId}
                sellerName={chatConfig.sellerName}
                buyerName={chatConfig.buyerName}
                productId={chatConfig.productId}
            />
        </div>
    );
}

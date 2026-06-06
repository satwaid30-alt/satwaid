"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Tag, Trash2, Edit, ChevronLeft, ChevronRight, Truck, AlertCircle, CheckCircle2, XCircle, Calendar, ScrollText, ShoppingBag, History, Package, Globe, VenusAndMars, Clock, Gavel } from "lucide-react";
import { getApiUrl } from "@/app/utils/api";

export default function ListingDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [bids, setBids] = useState([]);

  const getParsedImages = (imagesData) => {
    if (!imagesData) return [];

    let rawImages = [];
    try {
      if (typeof imagesData === "string") {
        if (imagesData.startsWith("[") || imagesData.startsWith("{")) {
          rawImages = JSON.parse(imagesData);
        } else {
          rawImages = [imagesData];
        }
      } else if (Array.isArray(imagesData)) {
        rawImages = imagesData;
      } else {
        rawImages = [imagesData];
      }
    } catch (e) {
      console.error("Error parsing imagesData:", e);
      return [];
    }

    const arr = Array.isArray(rawImages) ? rawImages : [rawImages];
    return arr
      .filter((img) => img && typeof img === "string")
      .map((img) => {
        if (img.startsWith("http") || img.startsWith("data:")) {
          return img;
        }
        const baseUrl = getApiUrl();
        const path = img.startsWith("/") ? img : `/${img}`;
        return `${baseUrl}${path}`;
      });
  };

  const getAvatarUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http") || url.startsWith("data:")) return url;
    const path = url.startsWith("/") ? url : `/${url}`;
    return `${getApiUrl()}${path}`;
  };

  const parsedImages = getParsedImages(listing?.images);

  useEffect(() => {
    fetchListingDetail();
  }, [id]);

  const fetchBids = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/listings/${id}/bids`);
      if (res.ok) {
        const result = await res.json();
        setBids(result.data || []);
      }
    } catch (err) {
      console.error("Error fetching bids:", err);
    }
  };

  const fetchListingDetail = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/listings/${id}`);
      const result = await res.json();
      if (res.ok && result.data) {
        if (result.data.status?.toLowerCase() === "history") {
          router.replace("/user/toko/daftar-produk");
          return;
        }
        if (result.data.type === "auction") {
          router.replace(`/user/toko/lelang-produk/detail/${id}`);
          return;
        }
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
      const token = localStorage.getItem("token");
      const res = await fetch(`${getApiUrl()}/listings/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
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
      minimumFractionDigits: 0,
    }).format(price || 0);
  };

  const getStatusStyles = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "rejected":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "pending":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "sold":
        return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-500 border-zinc-500/20";
    }
  };

  const isSold = listing?.status?.toLowerCase() === "sold";

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
        <Link href="/user/toko/daftar-produk" className="inline-flex items-center gap-3 text-zinc-500 hover:text-white transition-all group">
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
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl lg:rounded-[2.5rem] overflow-hidden relative">
            <div className="w-full aspect-square bg-zinc-950 relative group cursor-zoom-in">
              {parsedImages && parsedImages[activeImageIndex] ? (
                <img src={parsedImages[activeImageIndex]} alt={listing.name} className="w-full h-full object-contain p-4 lg:p-8" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-800">
                  <ShoppingBag size={80} />
                </div>
              )}

              {/* Image Nav Arrows */}
              {parsedImages?.length > 1 && (
                <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  <button onClick={() => setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : parsedImages.length - 1))} className="p-3 lg:p-4 bg-zinc-900/80 backdrop-blur-md text-white rounded-xl lg:rounded-2xl hover:bg-emerald-500 hover:text-zinc-950 transition-all pointer-events-auto">
                    <ChevronLeft size={20} className="lg:w-6 lg:h-6" />
                  </button>
                  <button onClick={() => setActiveImageIndex((prev) => (prev < parsedImages.length - 1 ? prev + 1 : 0))} className="p-3 lg:p-4 bg-zinc-900/80 backdrop-blur-md text-white rounded-xl lg:rounded-2xl hover:bg-emerald-500 hover:text-zinc-950 transition-all pointer-events-auto">
                    <ChevronRight size={20} className="lg:w-6 lg:h-6" />
                  </button>
                </div>
              )}

              {/* Image Counter Badge */}
              {parsedImages?.length > 1 && (
                <div className="absolute bottom-6 right-6 px-4 py-2 bg-zinc-950/60 backdrop-blur-md border border-zinc-800 rounded-full text-[10px] font-black text-white uppercase tracking-widest">
                  {activeImageIndex + 1} / {parsedImages.length} Foto
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {parsedImages?.length > 1 && (
              <div className="p-4 lg:p-6 bg-zinc-950/30 border-t border-zinc-800 flex gap-3 lg:gap-4 overflow-x-auto custom-scrollbar">
                {parsedImages?.map((img, idx) => (
                  <button key={idx} onClick={() => setActiveImageIndex(idx)} className={`w-16 h-16 lg:w-20 lg:h-20 rounded-xl lg:rounded-2xl overflow-hidden border-2 shrink-0 transition-all duration-300 ${activeImageIndex === idx ? "border-emerald-500 scale-105" : "border-zinc-800 opacity-40 hover:opacity-100"}`}>
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
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl lg:rounded-[2.5rem] p-6 lg:p-12 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] -mr-32 -mt-32 group-hover:bg-emerald-500/10 transition-colors duration-700"></div>

            <div className="relative space-y-8">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border ${listing.status?.toLowerCase() === "sold" || listing.type === "sell" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20"}`}>
                    {listing.status?.toLowerCase() === "sold" ? "Terjual" : listing.type === "sell" ? "Ready Stock" : "Auction / Lelang"}
                  </span>
                  <span className="px-4 py-1.5 rounded-full text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] border border-zinc-800 bg-zinc-950/50">ID Produk: {listing.product_id || "PENDING"}</span>
                </div>
                <div>
                  <h4 className="text-emerald-500 font-black uppercase tracking-[0.3em] text-[9px] lg:text-[10px] mb-1 lg:mb-2">{listing.species}</h4>
                  <h1 className="text-2xl lg:text-3xl font-black text-white leading-tight tracking-tight break-words">{listing.name}</h1>
                </div>
              </div>

              {/* Price Card */}
              {/* Price Card */}
              <div className={`rounded-3xl p-8 border group/price relative overflow-hidden shadow-2xl ${listing.type === "auction" ? "bg-amber-500/5 border-amber-500/20" : "bg-zinc-950 border-zinc-800"}`}>
                <div className="relative">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-3">{listing.type === "sell" ? "Harga" : "Open Bid (OB)"}</p>
                  <div className="flex flex-wrap items-baseline gap-2 lg:gap-4">
                    <p className="text-2xl lg:text-3xl font-black text-white tracking-tighter">{formatPrice(listing.type === "sell" ? listing.price : listing.current_bid || listing.start_bid)}</p>
                    {listing.type === "auction" && <p className="text-amber-500 font-black text-sm mb-2">(Kelipatan +{formatPrice(listing.multiple)})</p>}
                  </div>

                  {listing.type === "auction" && listing.bin_price && (
                    <div className="mt-4 pt-4 border-t border-amber-500/10">
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-2">Beli Sekarang (BIN)</p>
                      <p className="text-xl font-black text-white">{formatPrice(listing.bin_price)}</p>
                    </div>
                  )}

                  {listing.type === "auction" && (
                    <div className="mt-6 pt-6 border-t border-amber-500/10 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800/50">
                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                          <Calendar size={12} className="text-amber-500" /> Mulai Lelang
                        </p>
                        <p className="text-sm font-bold text-zinc-300">{new Date(listing.start_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).replace(".", ":").replace(" pukul ", " • ")} WIB</p>
                      </div>
                      <div className="bg-amber-500/10 p-4 rounded-2xl border border-amber-500/20">
                        <p className="text-[9px] font-black text-amber-500/80 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                          <Clock size={12} className="text-amber-500" /> Berakhir Pada
                        </p>
                        <p className="text-sm font-black text-amber-500">{new Date(listing.end_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).replace(".", ":").replace(" pukul ", " • ")} WIB</p>
                      </div>
                    </div>
                  )}

                  <div className={`flex flex-wrap gap-3 mt-6 pt-6 border-t ${listing.type === "auction" ? "border-amber-500/10" : "border-zinc-800/50"}`}>
                    {listing.is_free_shipping && (
                      <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${listing.type === "auction" ? "bg-amber-500/10 border border-amber-500/20" : "bg-emerald-500/10 border border-emerald-500/20"}`}>
                        <Truck size={14} className={listing.type === "auction" ? "text-amber-500" : "text-emerald-500"} />
                        <span className={`text-[10px] font-black uppercase tracking-widest ${listing.type === "auction" ? "text-amber-500" : "text-emerald-500"}`}>Gratis Ongkir</span>
                      </div>
                    )}
                    {listing.is_free_packing && (
                      <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                        <AlertCircle size={14} className="text-blue-500" />
                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Gratis Packing</span>
                      </div>
                    )}
                    {!listing.is_free_shipping && !listing.is_free_packing && <p className="text-[10px] font-bold text-zinc-600 italic">Biaya kirim & packing dihitung kemudian.</p>}
                  </div>
                </div>
              </div>

              {/* Bidder / Winner Section */}
              {listing.type === "auction" &&
                (() => {
                  const isEnded = listing.end_date ? new Date(listing.end_date) <= new Date() : false;
                  return (
                    <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 lg:p-8 space-y-4">
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                        <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                          <Gavel size={14} className="text-amber-500" />
                          {isEnded ? "Status Pemenang Lelang" : "Daftar Penawaran Aktif"}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${isEnded ? "bg-zinc-800 text-zinc-400" : "bg-amber-500/10 text-amber-500 border border-amber-500/20"}`}>{isEnded ? "Selesai" : "Berlangsung"}</span>
                      </div>

                      {isEnded ? (
                        bids && bids.length > 0 ? (
                          <div className="space-y-4">
                            <div className="flex items-center gap-3 bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
                              <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 overflow-hidden flex-shrink-0 flex items-center justify-center">
                                {bids[0].bidder?.avatar_url ? <img src={getAvatarUrl(bids[0].bidder.avatar_url)} alt="avatar" className="w-full h-full object-cover" /> : <span className="text-xs font-black text-zinc-500 uppercase">{bids[0].bidder?.username?.substring(0, 2)}</span>}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider leading-none mb-1">Pemenang Lelang</p>
                                <p className="text-sm font-black text-white truncate">{bids[0].bidder?.name || bids[0].bidder?.username}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider leading-none mb-1">Bid Akhir</p>
                                <p className="text-sm font-black text-emerald-500">{formatPrice(bids[0].bid_amount)}</p>
                              </div>
                            </div>

                            {/* Link to transaction if available */}
                            {listing.latestOrderUuid ? (
                              <Link href={`/user/toko/pesanan-masuk/detail/${listing.latestOrderUuid}`} className="inline-flex w-full h-11 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-black rounded-2xl text-xs transition-all items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer">
                                Lihat Detail Transaksi Pesanan
                              </Link>
                            ) : (
                              <p className="text-[10px] text-amber-500 font-bold text-center bg-amber-500/5 border border-amber-500/10 py-2 px-4 rounded-xl leading-relaxed">Menunggu pemenang melakukan checkout pembayaran.</p>
                            )}
                          </div>
                        ) : (
                          <div className="py-4 text-center">
                            <p className="text-xs font-black text-zinc-500 uppercase tracking-wider bg-zinc-900 border border-zinc-800 py-3 px-4 rounded-2xl">Tidak ada pemenang</p>
                          </div>
                        )
                      ) : /* Active Auction Bidders List */
                      bids && bids.length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                          {bids.map((b, idx) => (
                            <div key={b.id || idx} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${idx === 0 ? "bg-amber-500/5 border-amber-500/20 shadow-md" : "bg-zinc-900/30 border-zinc-800"}`}>
                              <div className="flex items-center gap-2 min-w-0">
                                <span className={`text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center ${idx === 0 ? "bg-amber-500 text-zinc-950" : "bg-zinc-800 text-zinc-400"}`}>{idx + 1}</span>
                                <span className="text-xs font-bold text-zinc-200 truncate">{b.bidder?.name || b.bidder?.username}</span>
                              </div>
                              <span className={`text-xs font-black ${idx === 0 ? "text-amber-500" : "text-zinc-300"}`}>{formatPrice(b.bid_amount)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-4 text-center">
                          <p className="text-xs font-bold text-zinc-600 italic">Belum ada penawaran masuk.</p>
                        </div>
                      )}
                    </div>
                  );
                })()}

              {/* Specs Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
                <div className="p-4 lg:p-5 bg-zinc-950/40 border border-zinc-800/60 rounded-2xl lg:rounded-3xl group/spec hover:border-emerald-500/30 transition-all duration-300">
                  <VenusAndMars size={16} className="text-emerald-500 mb-2 lg:mb-3 group-hover/spec:scale-110 transition-transform" />
                  <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Kelamin</p>
                  <p className="text-xs lg:text-sm font-black text-zinc-200">{listing.sex || "Unsex"}</p>
                </div>
                <div className="p-4 lg:p-5 bg-zinc-950/40 border border-zinc-800/60 rounded-2xl lg:rounded-3xl group/spec hover:border-emerald-500/30 transition-all duration-300">
                  <Globe size={16} className="text-emerald-500 mb-2 lg:mb-3 group-hover/spec:scale-110 transition-transform" />
                  <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Jangkauan</p>
                  <p className="text-xs lg:text-sm font-black text-zinc-200">{listing.shipping_type || "-"}</p>
                </div>
                <div className="p-4 lg:p-5 bg-zinc-950/40 border border-zinc-800/60 rounded-2xl lg:rounded-3xl group/spec hover:border-emerald-500/30 transition-all duration-300">
                  <Package size={16} className="text-emerald-500 mb-2 lg:mb-3 group-hover/spec:scale-110 transition-transform" />
                  <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Stok</p>
                  <p className="text-xs lg:text-sm font-black text-zinc-200">{listing.stock || 0} Ekor</p>
                </div>
                <div className="p-4 lg:p-5 bg-zinc-950/40 border border-zinc-800/60 rounded-2xl lg:rounded-3xl group/spec hover:border-emerald-500/30 transition-all duration-300">
                  <Clock size={16} className="text-emerald-500 mb-2 lg:mb-3 group-hover/spec:scale-110 transition-transform" />
                  <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Posting</p>
                  <p className="text-xs lg:text-sm font-black text-zinc-200">{new Date(listing.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</p>
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
                    href={listing.type === "auction" ? `/user/toko/lelang-produk/edit/${listing.id}` : `/user/toko/jual-produk/edit/${listing.id}`}
                    className={`flex-1 font-black py-4 lg:py-5 rounded-2xl lg:rounded-[2rem] flex items-center justify-center gap-3 transition-all active:scale-95 group/btn text-xs lg:text-sm cursor-pointer ${
                      listing.type === "auction" ? "bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-lg shadow-amber-500/20" : "bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-lg shadow-emerald-500/20"
                    }`}
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
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl lg:rounded-[2.5rem] p-6 lg:p-12 relative overflow-hidden group">
              <div className="flex items-center gap-4 mb-6 lg:mb-10">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-zinc-950 border border-zinc-800 rounded-xl lg:rounded-2xl flex items-center justify-center text-emerald-500 group-hover:border-emerald-500/30 transition-colors">
                  <ScrollText size={22} />
                </div>
                <h3 className="text-lg lg:text-xl font-black text-white tracking-tight uppercase tracking-[0.2em]">Deskripsi Produk</h3>
                <div className="flex-1 h-px bg-zinc-800/50"></div>
              </div>

              <div className="description-content text-zinc-400 font-medium leading-[1.8] text-sm lg:text-base prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: listing.description || "<p class='italic text-zinc-600'>Tidak ada deskripsi produk.</p>" }}></div>
            </div>

            {/* Shipping/Policy */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl lg:rounded-[2.5rem] p-6 lg:p-12 relative overflow-hidden group">
              <div className="flex items-center gap-4 mb-6 lg:mb-10">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-zinc-950 border border-zinc-800 rounded-xl lg:rounded-2xl flex items-center justify-center text-amber-500 group-hover:border-amber-500/30 transition-colors">
                  <Truck size={22} />
                </div>
                <h3 className="text-lg lg:text-xl font-black text-white tracking-tight uppercase tracking-[0.2em]">Info Pengiriman</h3>
                <div className="flex-1 h-px bg-zinc-800/50"></div>
              </div>

              <div className="description-content text-zinc-400 font-medium leading-[1.8] text-sm lg:text-base prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: listing.shipping_description || "<p class='italic text-zinc-600'>Tidak ada informasi pengiriman khusus.</p>" }}></div>
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
          0%,
          100% {
            transform: rotate(0);
          }
          25% {
            transform: rotate(-10deg);
          }
          75% {
            transform: rotate(10deg);
          }
        }
        .group/del:hover .group-hover\:shake {
          animation: shake 0.2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

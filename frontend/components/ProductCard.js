"use client";

import { useRouter } from "next/navigation";
import {
  MapPin,
  ShoppingBag,
  Store,
  Star,
  Truck,
  Package,
  Gavel,
} from "lucide-react";
import { useState, useEffect } from "react";
import { getLogoUrl } from "@/app/utils/api";

export default function ProductCard({ product }) {
  const router = useRouter();

  const formatPrice = (price) => {
    const formatted = new Intl.NumberFormat("id-ID").format(price || 0);
    return `Rp ${formatted}`;
  };

  const dateObj = new Date(product.created_at);
  const day = dateObj.getDate();
  const month = dateObj.toLocaleDateString("id-ID", { month: "short" });
  const year = dateObj.getFullYear().toString().slice(-2);

  const priceValue =
    product.type === "sell"
      ? product.price
      : product.current_bid || product.start_bid;

  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (product.type !== "auction" || !product.end_date) return;

    const update = () => {
      const now = new Date().getTime();
      const distance = new Date(product.end_date).getTime() - now;
      if (distance < 0) {
        setTimeLeft({ expired: true });
      } else {
        const d = Math.floor(distance / (1000 * 60 * 60 * 24));
        const h = Math.floor(
          (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
        );
        const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft({
          d: d.toString(),
          h: h.toString().padStart(2, "0"),
          m: m.toString().padStart(2, "0"),
          s: s.toString().padStart(2, "0"),
          expired: false,
        });
      }
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [product.type, product.end_date]);

  const handleCardClick = () => {
    if (product.type === "auction") {
      router.push(`/toko/detail-lelang/${product.id}`);
    } else {
      router.push(`/toko/detail-produk?id=${product.id}`);
    }
  };

  const handleShopClick = (e) => {
    e.stopPropagation();
    if (product.shop?.id) {
      router.push(`/detail-toko/${product.shop.id}`);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-white rounded-lg overflow-hidden border border-zinc-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full group cursor-pointer"
    >
      {/* Image Container - Square */}
      <div className="relative aspect-square overflow-hidden bg-zinc-50">
        <img
          src={
            product.images && product.images[0]
              ? product.images[0]
              : "https://placehold.co/400x400/f4f4f5/71717a?text=No+Image"
          }
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Labels - top left */}
        <div className="absolute top-2 left-2 flex flex-col gap-1.5">
          <div className="flex gap-1.5">
            <span className="bg-white/90 backdrop-blur-sm text-zinc-800 text-[9px] sm:text-[10px] font-bold px-2 py-1 rounded shadow-sm border border-white/20">
              {product.species}
            </span>
            {product.sex && (
              <span
                className={`bg-white/90 backdrop-blur-sm text-[9px] sm:text-[10px] font-bold px-2 py-1 rounded shadow-sm border border-white/20 ${product.sex === "Jantan" ? "text-blue-600" : product.sex === "Betina" ? "text-pink-600" : "text-zinc-500"}`}
              >
                {product.sex}
              </span>
            )}
          </div>
        </div>

        {/* Auction Badge */}
        {product.type === "auction" && (
          <>
            <div className="absolute top-2 right-2 z-10">
              <span className="bg-amber-500 text-zinc-950 text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm uppercase tracking-tighter flex items-center gap-1">
                Lelang{" "}
                <span className="w-1.5 h-1.5 bg-zinc-950 rounded-full animate-pulse" />
              </span>
            </div>
          </>
        )}
      </div>

      {/* Content Container */}
      <div className="p-3 sm:p-4 flex flex-col flex-grow">
        {/* Shop Owner Info */}
        <div
          onClick={handleShopClick}
          className="flex items-center gap-2 mb-2 hover:bg-zinc-50 p-1 -m-1 rounded-xl transition-colors group/shop"
        >
          <div className="w-5 h-5 rounded-full bg-zinc-100 overflow-hidden border border-zinc-200 shadow-sm flex-shrink-0">
            {product.shop?.logo_url ? (
              <img
                src={getLogoUrl(product.shop.logo_url)}
                className="w-full h-full object-cover"
                alt={product.shop.name}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-400">
                <Store size={10} />
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5 overflow-hidden flex-1">
            <span className="text-[10px] text-zinc-500 font-bold truncate group-hover/shop:text-emerald-600 transition-colors">
              {product.shop?.name || "Seller"}
            </span>
            <div className="flex items-center gap-0.5 sm:gap-1 bg-amber-500/10 px-1 py-0.5 rounded flex-shrink-0">
              <Star size={8} className="text-amber-500 fill-amber-500" />
              <span className="text-[9px] font-black text-amber-600">
                {product.shop?.avgRating || "5.0"}
              </span>
            </div>
            {/* <span className="inline-flex items-center text-[7px] sm:text-[8px] font-black uppercase tracking-tighter bg-zinc-100 text-zinc-600 px-1 py-0.5 rounded border border-zinc-200 shadow-sm flex-shrink-0">
              Stok: {product.stock || 0}
            </span> */}
          </div>
        </div>

        {/* Location and Date */}
        <div className="flex items-center flex-wrap gap-1 sm:gap-1.5 mb-1.5 overflow-hidden">
          <div className="flex items-center gap-1 text-zinc-400">
            <MapPin size={8} className="text-emerald-500" />
            <span className="text-[8px] sm:text-[9px] font-medium uppercase tracking-tight truncate max-w-[60px] sm:max-w-[80px]">
              {product.shop?.city || "Lokasi"}
            </span>
          </div>
          <span className="text-zinc-300 hidden sm:inline">•</span>
          <span className="text-[8px] sm:text-[9px] text-zinc-400 font-medium leading-none">
            {new Date(product.created_at).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>

        {/* Product Name */}
        <h3 className="font-bold text-xs sm:text-sm lg:text-base text-zinc-900 leading-tight mb-2 group-hover:text-emerald-600 transition-colors line-clamp-2 min-h-[2rem] lg:min-h-[2.4rem]">
          {product.name}
        </h3>

        {/* Free Shipping & Packing Labels */}
        <div className="flex flex-wrap gap-1 mt-auto mb-2">
          {product.is_free_shipping && (
            <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-tighter bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-md border border-emerald-200 shadow-sm">
              <Truck size={8} /> Free Ongkir
            </span>
          )}
          {product.is_free_packing && (
            <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-tighter bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-md border border-blue-200 shadow-sm">
              <Package size={8} /> Free Packing
            </span>
          )}
        </div>

        {/* Countdown Info (For Auction) */}
        {product.type === "auction" && (
          <div className="mb-3 -mx-3 sm:-mx-4">
            {timeLeft && !timeLeft.expired ? (
              <div className="flex items-center gap-1 sm:gap-1.5 bg-amber-50 border-y border-amber-200 py-2 px-1 sm:px-2 justify-center shadow-inner">
                {timeLeft.d !== "0" && (
                  <>
                    <div className="bg-white text-amber-600 font-black px-1 py-1 rounded-lg border border-amber-200/60 text-xs sm:text-sm min-w-[26px] sm:min-w-[30px] text-center shadow-sm">
                      {timeLeft.d}d
                    </div>
                    <span className="text-amber-400 text-xs sm:text-sm font-bold">
                      :
                    </span>
                  </>
                )}
                <div className="bg-white text-amber-600 font-black px-1 py-1 rounded-lg border border-amber-200/60 text-xs sm:text-sm min-w-[26px] sm:min-w-[30px] text-center shadow-sm">
                  {timeLeft.h}h
                </div>
                <span className="text-amber-400 text-xs sm:text-sm font-bold">
                  :
                </span>
                <div className="bg-white text-amber-600 font-black px-1 py-1 rounded-lg border border-amber-200/60 text-xs sm:text-sm min-w-[26px] sm:min-w-[30px] text-center shadow-sm">
                  {timeLeft.m}m
                </div>
                <span className="text-amber-400 text-xs sm:text-sm font-bold">
                  :
                </span>
                <div className="bg-white text-amber-600 font-black px-1 py-1 rounded-lg border border-amber-200/60 text-xs sm:text-sm min-w-[26px] sm:min-w-[30px] text-center shadow-sm">
                  {timeLeft.s}s
                </div>
              </div>
            ) : timeLeft && timeLeft.expired ? (
              <div className="bg-zinc-100 border-y border-zinc-200 py-2.5 text-center shadow-inner">
                <span className="text-xs font-black text-zinc-500 uppercase tracking-widest">
                  Lelang Berakhir
                </span>
              </div>
            ) : null}
          </div>
        )}

        <div className="mt-auto pt-3 flex items-center justify-between border-t border-zinc-50">
          <div>
            {product.type === "auction" && (
              <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-0.5">
                {product.current_bid ? "Last Bid" : "Open Bid"}
              </p>
            )}
            <span className="text-sm sm:text-base lg:text-lg font-black text-emerald-600 leading-none">
              {formatPrice(priceValue)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`text-white p-1.5 rounded-lg transition-all shadow-lg shadow-zinc-900/10 ${product.type === "auction" ? "bg-amber-500 hover:bg-amber-600" : "bg-zinc-900 group-hover:bg-emerald-500"}`}
            >
              {product.type === "auction" ? (
                <Gavel size={14} />
              ) : (
                <ShoppingBag size={14} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

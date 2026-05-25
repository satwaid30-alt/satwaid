"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";
import Link from "next/link";
import {
  Gavel,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  X,
  Image as ImageIcon,
  Truck,
  AlertCircle,
  Calendar,
  Coins,
  ScrollText,
  Plus,
  Tag,
} from "lucide-react";
import { getApiUrl } from "@/app/utils/api";

// Import ReactQuill dynamically to avoid SSR errors
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["blockquote", "code-block"],
    ["clean"],
  ],
};

const quillFormats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "list",
  "blockquote",
  "code-block",
];

const formatRupiah = (value) => {
  if (value === null || value === undefined) return "";
  const clean = value.toString().replace(/\D/g, "");
  if (!clean) return "";
  return new Intl.NumberFormat("id-ID").format(parseInt(clean, 10));
};

const initialReptileData = {
  name: "",
  species: "",
  start_bid: "",
  multiple: "",
  bin_price: "",
  start_date: "",
  duration: "",
  description: "",
  sex: "",
  shipping_description: "",
  images: [],
  is_free_shipping: false,
  is_free_packing: false,
  shipping_type: "",
  stock: 1,
};

export default function LelangProdukPage() {
  const [hasShop, setHasShop] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [shopStatus, setShopStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showRules, setShowRules] = useState(false);

  const [reptileData, setReptileData] = useState({ ...initialReptileData });
  const [isAgreed, setIsAgreed] = useState(false);
  const [previewDates, setPreviewDates] = useState(null);
  const [createdListingId, setCreatedListingId] = useState(null);

  const resetForm = () => {
    setReptileData((prev) => ({
      ...initialReptileData,
      shipping_description: prev.shipping_description,
    }));
    setIsAgreed(false);
    setShowRules(false);
    setIsSubmitting(false);
    setPreviewDates(null);
  };

  useEffect(() => {
    if (reptileData.duration) {
      const now = new Date();
      let start;
      if (reptileData.start_date) {
        const selectedDate = new Date(reptileData.start_date);
        start = selectedDate;
        start.setHours(
          now.getHours(),
          now.getMinutes(),
          now.getSeconds(),
          now.getMilliseconds(),
        );

        if (
          selectedDate.getFullYear() === now.getFullYear() &&
          selectedDate.getMonth() === now.getMonth() &&
          selectedDate.getDate() === now.getDate()
        ) {
          start = now;
        }
      } else {
        start = now;
      }

      const end = new Date(
        start.getTime() +
          (parseInt(reptileData.duration, 10) || 1) * 24 * 60 * 60 * 1000,
      );

      const months = [
        "Januari",
        "Februari",
        "Maret",
        "April",
        "Mei",
        "Juni",
        "Juli",
        "Agustus",
        "September",
        "Oktober",
        "November",
        "Desember",
      ];
      const formatPreview = (date) => {
        const d = date.getDate();
        const m = months[date.getMonth()];
        const y = date.getFullYear();
        const h = String(date.getHours()).padStart(2, "0");
        const min = String(date.getMinutes()).padStart(2, "0");
        return `${d} ${m} ${y} • ${h}:${min} WIB`;
      };

      setPreviewDates({
        start: formatPreview(start),
        end: formatPreview(end),
        duration: `${parseInt(reptileData.duration, 10) || 1} Hari`,
      });
    } else {
      setPreviewDates(null);
    }
  }, [reptileData.start_date, reptileData.duration]);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        fetch(`${getApiUrl()}/shops/user/${parsed.id}`)
          .then((res) => {
            if (!res.ok) {
              // 404 = user belum punya toko, bukan error
              setIsLoading(false);
              return null;
            }
            return res.json();
          })
          .then((res) => {
            if (!res) return;
            if (res.data) {
              setHasShop(true);
              setShopStatus(res.data.status);
              // Pre-fill shipping policies from shop profile
              setReptileData((prev) => ({
                ...prev,
                shipping_description: `<strong>Kebijakan Pengiriman:</strong><br/>${res.data.shipping_policy || "-"}<br/><br/><strong>Kebijakan Garansi:</strong><br/>${res.data.warranty_policy || "-"}`,
              }));
            }
            setIsLoading(false);
          })
          .catch((err) => {
            console.error("Error fetching shop:", err);
            setIsLoading(false);
          });
      } catch (e) {
        console.error("Error parsing user data", e);
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const handleAddAuction = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const userRaw = localStorage.getItem("user");
    if (!userRaw) {
      alert("Sesi anda telah berakhir, silakan login kembali.");
      setIsSubmitting(false);
      return;
    }
    const userData = JSON.parse(userRaw);

    try {
      // Manual Validation for Rich Text, Images, and Auction Specifics
      const cleanDescription = reptileData.description
        .replace(/<(.|\n)*?>/g, "")
        .trim();
      const cleanShipping = reptileData.shipping_description
        .replace(/<(.|\n)*?>/g, "")
        .trim();

      if (
        !reptileData.name ||
        !reptileData.species ||
        !reptileData.start_bid ||
        !reptileData.multiple ||
        !reptileData.duration ||
        !cleanDescription ||
        !reptileData.sex ||
        !cleanShipping ||
        !reptileData.shipping_type ||
        reptileData.images.length === 0
      ) {
        alert(
          "Harap lengkapi semua data lelang, deskripsi, kebijakan pengiriman, jenis pengiriman, dan unggah minimal satu foto.",
        );
        setIsSubmitting(false);
        return;
      }

      // Date validations
      const now = new Date();
      let start;
      if (reptileData.start_date) {
        const selectedDate = new Date(reptileData.start_date);
        start = selectedDate;
        start.setHours(
          now.getHours(),
          now.getMinutes(),
          now.getSeconds(),
          now.getMilliseconds(),
        );

        // If the selected date is today, use current time to avoid past-date errors
        if (
          selectedDate.getFullYear() === now.getFullYear() &&
          selectedDate.getMonth() === now.getMonth() &&
          selectedDate.getDate() === now.getDate()
        ) {
          start = now;
        }
      } else {
        start = now;
      }

      const end = new Date(
        start.getTime() +
          (parseInt(reptileData.duration, 10) || 1) * 24 * 60 * 60 * 1000,
      );

      if (reptileData.start_date && start < new Date(now.getTime() - 60000)) {
        // allow 1 minute tolerance
        alert("Tanggal mulai lelang tidak boleh di masa lalu.");
        setIsSubmitting(false);
        return;
      }

      // BIN Price Validation
      if (reptileData.bin_price) {
        const bin = parseInt(
          reptileData.bin_price.toString().replace(/\D/g, ""),
        );
        const ob = parseInt(
          reptileData.start_bid.toString().replace(/\D/g, ""),
        );
        if (bin <= ob) {
          alert(
            "Harga Beli Sekarang (BIN) harus lebih tinggi dari Open Bid (OB).",
          );
          setIsSubmitting(false);
          return;
        }
      }

      const payload = {
        ...reptileData,
        type: "auction",
        user_id: userData.id,
        price: null,
        start_bid: reptileData.start_bid ? parseInt(reptileData.start_bid.toString().replace(/\D/g, ""), 10) : null,
        multiple: reptileData.multiple ? parseInt(reptileData.multiple.toString().replace(/\D/g, ""), 10) : null,
        bin_price: reptileData.bin_price ? parseInt(reptileData.bin_price.toString().replace(/\D/g, ""), 10) : null,
        start_date: start.toISOString(),
        end_date: end.toISOString(),
      };
      delete payload.duration;

      const response = await fetch(
        `${getApiUrl()}/listings`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const result = await response.json();

      if (response.ok) {
        setSuccessMessage("Berhasil memulai lelang baru!");
        if (result.data && result.data.id) {
          setCreatedListingId(result.data.id);
        }
        setShowSuccessModal(true);
        resetForm();
      } else {
        alert(result.message || "Gagal memasang lelang");
      }
    } catch (err) {
      console.error("Error adding auction:", err);
      alert("Terjadi kesalahan koneksi");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] bg-zinc-950">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-amber-500/20 rounded-full border-t-amber-500 animate-spin"></div>
          <Gavel
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-amber-500"
            size={24}
          />
        </div>
      </div>
    );
  }

  if (!hasShop) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-6">
        <div className="w-20 h-20 bg-zinc-900 border border-zinc-800 rounded-3xl flex items-center justify-center mx-auto text-zinc-500">
          <AlertCircle size={40} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">
            Toko Belum Terdaftar
          </h1>
          <p className="text-zinc-500 mt-2">
            Anda harus membuka toko terlebih dahulu sebelum dapat melakukan
            lelang.
          </p>
        </div>
        <Link
          href="/user/toko"
          className="inline-flex items-center gap-2 px-8 py-4 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black rounded-2xl transition-all shadow-lg shadow-amber-500/20"
        >
          Buka Toko Sekarang
          <ChevronRight size={20} />
        </Link>
      </div>
    );
  }

  if (shopStatus?.toLowerCase() === "suspended") {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-6">
        <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center justify-center mx-auto text-red-500 shadow-xl shadow-red-500/5">
          <AlertCircle size={40} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">Toko Ditangguhkan</h1>
          <p className="text-zinc-500 mt-2">
            Maaf, toko Anda sedang dalam status penangguhan oleh Admin.
            Aktivitas lelang dinonaktifkan sementara.
          </p>
        </div>
        <button
          onClick={() => window.open("https://wa.me/628123456789", "_blank")}
          className="px-8 py-4 bg-white text-zinc-950 font-black rounded-2xl hover:bg-zinc-200 transition-all active:scale-95"
        >
          Hubungi Admin
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-10 space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Gavel className="text-amber-500" size={32} />
            Mulai Lelang Baru
          </h1>
          <p className="text-zinc-500 mt-1 font-bold uppercase tracking-widest text-[10px] sm:text-xs">
            Buka lelang untuk produk/reptil koleksi terbaik Anda
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/user/toko/daftar-produk"
            className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-bold rounded-xl border border-zinc-800 transition-all flex items-center gap-2"
          >
            Lihat Iklan Saya
          </Link>
        </div>
      </div>

      {/* Regulations Section */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-3xl overflow-hidden shadow-xl shadow-amber-500/5">
        <button
          onClick={() => setShowRules(!showRules)}
          className="w-full p-4 sm:p-6 flex items-center justify-between text-left hover:bg-amber-500/5 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500 text-zinc-950 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
              <ScrollText size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-amber-500 uppercase tracking-tight">
                📜 Peraturan Jualan
              </h2>
              <p className="text-amber-500/60 text-sm">
                Wajib dibaca dan dipatuhi oleh semua penjual
              </p>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full border border-amber-500/20 flex items-center justify-center text-amber-500">
            {showRules ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </button>

        {showRules && (
          <div className="px-4 pb-6 sm:px-8 sm:pb-8 animate-in slide-in-from-top-2 duration-300">
            <div className="h-px bg-amber-500/20 mb-8"></div>

            <p className="text-amber-500/80 text-sm mb-8 font-medium italic">
              Untuk menjaga kenyamanan dan keamanan bersama, setiap penjual
              wajib mengikuti peraturan berikut:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 text-sm text-zinc-300">
              {/* Kolom 1 */}
              <div className="space-y-8">
                <div className="space-y-3">
                  <h3 className="font-black text-white flex items-center gap-2 text-base">
                    <span className="w-7 h-7 bg-amber-500 text-zinc-950 rounded-lg flex items-center justify-center text-xs shadow-lg shadow-amber-500/10">
                      1
                    </span>
                    Keaslian & Kejujuran Produk
                  </h3>
                  <ul className="list-disc list-outside ml-9 text-zinc-400 space-y-2 leading-relaxed">
                    <li>
                      Semua hewan yang dijual harus sesuai dengan deskripsi,
                      termasuk spesies, morph/genetik, umur, dan kondisi.
                    </li>
                    <li>
                      Dilarang memberikan informasi palsu atau menyesatkan.
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h3 className="font-black text-white flex items-center gap-2 text-base">
                    <span className="w-7 h-7 bg-amber-500 text-zinc-950 rounded-lg flex items-center justify-center text-xs shadow-lg shadow-amber-500/10">
                      2
                    </span>
                    Kondisi Hewan
                  </h3>
                  <ul className="list-disc list-outside ml-9 text-zinc-400 space-y-2 leading-relaxed">
                    <li>
                      Hewan yang dijual harus dalam kondisi sehat, aktif, dan
                      layak jual.
                    </li>
                    <li>
                      Wajib mencantumkan kondisi terkini, riwayat makan, dan
                      jika ada kekurangan (cacat/penyakit) harus dijelaskan
                      secara jujur.
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h3 className="font-black text-white flex items-center gap-2 text-base">
                    <span className="w-7 h-7 bg-amber-500 text-zinc-950 rounded-lg flex items-center justify-center text-xs shadow-lg shadow-amber-500/10">
                      3
                    </span>
                    Foto Produk
                  </h3>
                  <ul className="list-disc list-outside ml-9 text-zinc-400 space-y-2 leading-relaxed">
                    <li>
                      Gunakan foto asli (real picture), bukan hasil ambil dari
                      internet.
                    </li>
                    <li>
                      Foto harus jelas, tidak blur, dan menampilkan kondisi
                      sebenarnya dari hewan.
                    </li>
                    <li>
                      Hindari penggunaan filter berlebihan yang dapat
                      menyesatkan pembeli.
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h3 className="font-black text-white flex items-center gap-2 text-base">
                    <span className="w-7 h-7 bg-amber-500 text-zinc-950 rounded-lg flex items-center justify-center text-xs shadow-lg shadow-amber-500/10">
                      4
                    </span>
                    Penetapan Harga
                  </h3>
                  <ul className="list-disc list-outside ml-9 text-zinc-400 space-y-2 leading-relaxed">
                    <li>
                      Harga harus jelas dan sesuai dengan produk yang
                      ditawarkan.
                    </li>
                    <li>
                      Dilarang melakukan perubahan harga sepihak setelah terjadi
                      kesepakatan.
                    </li>
                  </ul>
                </div>
              </div>

              {/* Kolom 2 */}
              <div className="space-y-8">
                <div className="bg-amber-500/5 border border-amber-500/20 p-5 rounded-2xl space-y-3 shadow-inner">
                  <h3 className="font-black text-amber-500 flex items-center gap-2 text-base">
                    <AlertCircle size={20} />
                    5. Metode Transaksi (Wajib Admin)
                  </h3>
                  <ul className="list-disc list-outside ml-5 text-zinc-300 space-y-2 text-xs leading-relaxed">
                    <li>
                      Seluruh transaksi{" "}
                      <strong>
                        wajib dilakukan melalui pihak ketiga (Admin Platform)
                      </strong>{" "}
                      sebagai perantara.
                    </li>
                    <li>
                      Pembeli melakukan pembayaran terlebih dahulu kepada Admin.
                    </li>
                    <li>
                      Dana akan diteruskan kepada penjual setelah barang/hewan
                      diterima oleh pembeli.
                    </li>
                    <li className="text-amber-500 font-bold">
                      Dilarang melakukan transaksi di luar platform.
                    </li>
                    <li>
                      Apabila transaksi dilakukan di luar Admin, maka{" "}
                      <strong>
                        segala risiko dan kerugian bukan menjadi tanggung jawab
                        Admin Platform
                      </strong>
                      .
                    </li>
                    <li>
                      Penjual{" "}
                      <strong>
                        wajib mengirimkan nomor resi atau bukti pengiriman
                        kepada Admin dan pembeli
                      </strong>{" "}
                      sebagai bentuk validasi transaksi.
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h3 className="font-black text-white flex items-center gap-2 text-base">
                    <span className="w-7 h-7 bg-amber-500 text-zinc-950 rounded-lg flex items-center justify-center text-xs shadow-lg shadow-amber-500/10">
                      6
                    </span>
                    Pengiriman & Penyerahan
                  </h3>
                  <ul className="list-disc list-outside ml-9 text-zinc-400 space-y-2 leading-relaxed">
                    <li>
                      Penjual bertanggung jawab atas keamanan hewan selama
                      proses pengiriman.
                    </li>
                    <li>
                      Pengiriman dilakukan setelah pembayaran dikonfirmasi oleh
                      Admin.
                    </li>
                    <li>
                      Penjual wajib menggunakan metode pengiriman yang aman dan
                      sesuai untuk hewan hidup.
                    </li>
                    <li>
                      Nomor resi atau bukti pengiriman wajib diberikan melalui
                      platform.
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h3 className="font-black text-white flex items-center gap-2 text-base">
                    <span className="w-7 h-7 bg-amber-500 text-zinc-950 rounded-lg flex items-center justify-center text-xs shadow-lg shadow-amber-500/10">
                      7
                    </span>
                    Larangan Penjualan
                  </h3>
                  <ul className="list-disc list-outside ml-9 text-zinc-400 space-y-2 leading-relaxed">
                    <li>Dilarang menjual hewan yang dilindungi atau ilegal.</li>
                    <li>
                      Dilarang menjual hewan dalam kondisi sakit parah atau
                      tidak layak jual.
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h3 className="font-black text-white flex items-center gap-2 text-base">
                    <span className="w-7 h-7 bg-amber-500 text-zinc-950 rounded-lg flex items-center justify-center text-xs shadow-lg shadow-amber-500/10">
                      8
                    </span>
                    Tanggung Jawab Penjual
                  </h3>
                  <ul className="list-disc list-outside ml-9 text-zinc-400 space-y-2 leading-relaxed">
                    <li>
                      Penjual wajib merespon pertanyaan pembeli dengan baik dan
                      sopan.
                    </li>
                    <li>
                      Penjual bertanggung jawab penuh atas produk yang dijual.
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h3 className="font-black text-white flex items-center gap-2 text-base">
                    <span className="w-7 h-7 bg-amber-500 text-zinc-950 rounded-lg flex items-center justify-center text-xs shadow-lg shadow-amber-500/10">
                      9
                    </span>
                    Sanksi
                  </h3>
                  <div className="ml-9 space-y-2">
                    <p className="text-zinc-400 leading-relaxed">
                      Pelanggaran terhadap peraturan dapat mengakibatkan:
                    </p>
                    <ul className="list-disc list-outside ml-4 text-zinc-400 space-y-1 leading-relaxed">
                      <li>Penghapusan iklan</li>
                      <li>Pembatasan akun</li>
                      <li>Pemblokiran akun secara permanen</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-amber-500/20 text-center">
              <p className="text-sm text-amber-500 font-bold italic">
                💡 Dengan menggunakan platform ini, penjual dianggap telah
                membaca, memahami, dan menyetujui seluruh peraturan yang
                berlaku.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-transparent sm:bg-zinc-900 border-none sm:border border-zinc-800 rounded-none sm:rounded-3xl overflow-hidden shadow-none sm:shadow-2xl">
        <form onSubmit={handleAddAuction} className="px-0 py-6 sm:p-8 space-y-8">
          {/* Basic Info Section */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">
                  Nama Produk / Judul Lelang{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: [LELANG] Ball Python Piebald High White"
                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-2xl px-5 py-4 focus:outline-none focus:border-amber-500 transition-all font-bold placeholder:text-zinc-700 shadow-inner"
                  value={reptileData.name}
                  onChange={(e) =>
                    setReptileData({ ...reptileData, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-zinc-300 uppercase tracking-widest ml-1">
                  Kategori / Spesies <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-2xl px-5 py-4 focus:outline-none focus:border-amber-500 transition-all font-bold appearance-none cursor-pointer shadow-inner"
                  value={reptileData.species}
                  onChange={(e) =>
                    setReptileData({ ...reptileData, species: e.target.value })
                  }
                >
                  <option value="">Pilih Kategori</option>
                  <option value="Reptil">Reptil</option>
                  <option value="Mamalia">Mamalia</option>
                  <option value="Burung">Burung</option>
                  <option value="Ikan">Ikan</option>
                  <option value="Amfibi">Amfibi</option>
                  <option value="Serangga">Serangga</option>
                  <option value="Invertebrata Lainnya">
                    Invertebrata Lainnya
                  </option>
                  <option value="Unggas">Unggas</option>
                  <option value="Hewan Lainnya">Hewan Lainnya</option>
                  <option value="Pakan Hewan">Pakan Hewan</option>
                  <option value="Perlengkapan & Aksesoris">
                    Perlengkapan & Aksesoris
                  </option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">
                  Jenis Kelamin <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-2xl px-5 py-4 focus:outline-none focus:border-amber-500 transition-all font-bold appearance-none cursor-pointer shadow-inner text-sm"
                  value={reptileData.sex}
                  onChange={(e) =>
                    setReptileData({ ...reptileData, sex: e.target.value })
                  }
                >
                  <option value="" disabled>
                    Pilih Jenis Kelamin
                  </option>
                  <option value="Jantan">Jantan</option>
                  <option value="Betina">Betina</option>
                  <option value="Unsex">Unsex</option>
                  <option value="Unknown">Unknown</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">
                  Jumlah Stok <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-2xl px-5 py-4 focus:outline-none focus:border-amber-500 transition-all font-bold shadow-inner"
                  value={reptileData.stock}
                  onChange={(e) =>
                    setReptileData({ ...reptileData, stock: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                  <Calendar size={12} className="text-white" /> Tanggal Mulai
                  (Opsional / Sekarang)
                </label>
                <input
                  type="date"
                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-2xl px-5 py-4 focus:outline-none focus:border-amber-500 transition-all font-bold shadow-inner text-sm cursor-pointer"
                  style={{ colorScheme: "dark" }}
                  value={reptileData.start_date}
                  onChange={(e) =>
                    setReptileData({
                      ...reptileData,
                      start_date: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                  <Calendar size={12} className="text-white" /> Durasi Lelang{" "}
                  <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-2xl px-5 py-4 focus:outline-none focus:border-amber-500 transition-all font-bold appearance-none cursor-pointer shadow-inner text-sm"
                  value={reptileData.duration}
                  onChange={(e) =>
                    setReptileData({ ...reptileData, duration: e.target.value })
                  }
                >
                  <option value="" disabled>
                    - Pilih Durasi -
                  </option>
                  <option value="1">1 Hari</option>
                  <option value="2">2 Hari</option>
                  <option value="3">3 Hari</option>
                  <option value="5">5 Hari</option>
                  <option value="7">7 Hari</option>
                </select>
              </div>
            </div>

            {previewDates && (
              <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl flex flex-col md:flex-row gap-6 md:gap-12 text-sm mt-6 shadow-inner animate-in fade-in duration-300">
                <div>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">
                    Mulai lelang:
                  </p>
                  <p className="text-white font-bold">{previewDates.start}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">
                    Berakhir:
                  </p>
                  <p className="text-amber-500 font-bold">{previewDates.end}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">
                    Durasi:
                  </p>
                  <p className="text-white font-bold">
                    {previewDates.duration}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Shipping Options */}
          <div className="p-4 sm:p-6 bg-zinc-950/50 border border-zinc-800 rounded-3xl space-y-6">
            {/* Open Bid, Kelipatan, Beli Sekarang */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-zinc-800/50">
              <div className="space-y-2">
                <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                  <Coins size={12} className="text-white" /> Open Bid (OB){" "}
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 font-black text-xs">
                    Rp
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    placeholder="500.000"
                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-2xl pl-12 pr-5 py-4 focus:outline-none focus:border-amber-500 transition-all font-bold placeholder:text-zinc-700 shadow-inner"
                    value={reptileData.start_bid}
                    onChange={(e) =>
                      setReptileData({
                        ...reptileData,
                        start_bid: formatRupiah(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="px-1 py-1">
                  <p className="text-[9px] font-bold text-amber-500/80 italic leading-tight">
                    &quot;Belum termasuk ongkir & packing. Klik pilihan
                    &quot;Gratis&quot; di bawah jika ingin menggratiskan. Semua
                    Ongkir & Packing, ditanggung pembeli
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                  <Plus size={12} className="text-white" /> Kelipatan Bid{" "}
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 font-black text-xs">
                    Rp
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    placeholder="50.000"
                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-2xl pl-12 pr-5 py-4 focus:outline-none focus:border-amber-500 transition-all font-bold placeholder:text-zinc-700 shadow-inner"
                    value={reptileData.multiple}
                    onChange={(e) =>
                      setReptileData({
                        ...reptileData,
                        multiple: formatRupiah(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                  <Tag size={12} className="text-white" /> Beli Sekarang / BIN
                  (Opsional)
                </label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 font-black text-xs">
                    Rp
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="1.000.000"
                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-2xl pl-12 pr-5 py-4 focus:outline-none focus:border-amber-500 transition-all font-bold placeholder:text-zinc-700 shadow-inner"
                    value={reptileData.bin_price}
                    onChange={(e) =>
                      setReptileData({
                        ...reptileData,
                        bin_price: formatRupiah(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2">
                Opsi Tambahan
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex items-center gap-4 cursor-pointer group bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800/50 hover:border-amber-500/30 transition-all">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={reptileData.is_free_shipping}
                      onChange={(e) =>
                        setReptileData({
                          ...reptileData,
                          is_free_shipping: e.target.checked,
                        })
                      }
                    />
                    <div className="w-6 h-6 bg-zinc-950 border-2 border-zinc-700 rounded-lg peer-checked:bg-amber-500 peer-checked:border-amber-500 transition-all flex items-center justify-center">
                      <CheckCircle2
                        size={14}
                        className="text-zinc-950 scale-0 peer-checked:scale-100 transition-transform"
                      />
                    </div>
                  </div>
                  <span className="text-xs font-bold text-zinc-400 group-hover:text-zinc-200 transition-colors">
                    Bebas Ongkos Kirim (Gratis)
                  </span>
                </label>
                <label className="flex items-center gap-4 cursor-pointer group bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800/50 hover:border-amber-500/30 transition-all">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={reptileData.is_free_packing}
                      onChange={(e) =>
                        setReptileData({
                          ...reptileData,
                          is_free_packing: e.target.checked,
                        })
                      }
                    />
                    <div className="w-6 h-6 bg-zinc-950 border-2 border-zinc-700 rounded-lg peer-checked:bg-amber-500 peer-checked:border-amber-500 transition-all flex items-center justify-center">
                      <CheckCircle2
                        size={14}
                        className="text-zinc-950 scale-0 peer-checked:scale-100 transition-transform"
                      />
                    </div>
                  </div>
                  <span className="text-xs font-bold text-zinc-400 group-hover:text-zinc-200 transition-colors">
                    Bebas Biaya Packing (Gratis)
                  </span>
                </label>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">
                Jenis Jangkauan Pengiriman{" "}
                <span className="text-red-500">*</span>
              </label>
              <select
                required
                className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-2xl px-5 py-4 focus:outline-none focus:border-amber-500 transition-all font-bold appearance-none cursor-pointer shadow-inner text-sm"
                value={reptileData.shipping_type}
                onChange={(e) =>
                  setReptileData({
                    ...reptileData,
                    shipping_type: e.target.value,
                  })
                }
              >
                <option value="" disabled>
                  Pilih Jangkauan Pengiriman
                </option>
                <option value="Pengiriman Dalam Pulau/ Wilayah">
                  Pengiriman Dalam Pulau/ Wilayah
                </option>
                <option value="Pengiriman Seluruh Pulau/ Wilayah">
                  Pengiriman Seluruh Pulau/ Wilayah
                </option>
              </select>
            </div>
          </div>

          {/* Rich Text Editors */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">
                Deskripsi Produk <span className="text-red-500">*</span>
              </label>
              <div className="quill-dark-editor">
                <ReactQuill
                  theme="snow"
                  value={reptileData.description}
                  onChange={(content) =>
                    setReptileData({ ...reptileData, description: content })
                  }
                  modules={quillModules}
                  formats={quillFormats}
                  placeholder="Tuliskan kondisi kesehatan, karakter, riwayat makan, dan detail lainnya secara lengkap..."
                  className="bg-zinc-950 text-white rounded-2xl overflow-hidden border border-zinc-800 focus-within:border-amber-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between ml-1">
                <div className="flex items-center gap-2">
                  <Truck size={14} className="text-white" />
                  <label className="text-xs font-black text-zinc-300 uppercase tracking-widest">
                    Kebijakan Pengiriman & Garansi
                  </label>
                </div>
                <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                  Otomatis dari Profil
                </span>
              </div>
              <div className="p-4 sm:p-6 bg-zinc-950 border border-zinc-800 rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 blur-2xl rounded-full -mr-8 -mt-8"></div>
                <div
                  className="text-xs sm:text-sm text-zinc-400 leading-relaxed description-content relative z-10 break-words"
                  dangerouslySetInnerHTML={{
                    __html:
                      reptileData.shipping_description ||
                      '<span className="italic opacity-50">Mengambil data kebijakan dari profil toko Anda...</span>',
                  }}
                ></div>
                <div className="mt-4 pt-4 border-t border-zinc-800/50 flex items-center justify-between relative z-10">
                  <p className="text-[10px] text-zinc-500 font-bold italic">
                    Kebijakan ini diambil otomatis dari pengaturan toko Anda
                    agar seragam.
                  </p>
                  <Link
                    href="/user/toko/edit-toko"
                    className="text-[10px] font-black text-amber-500 hover:text-amber-400 uppercase tracking-widest transition-colors flex items-center gap-1"
                  >
                    Ubah di Profil <ChevronRight size={12} />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-4">
            <div className="flex items-center justify-between ml-1">
              <label className="text-xs font-black text-zinc-500 uppercase tracking-widest">
                Foto Produk (Maks 3) <span className="text-red-500">*</span>
              </label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {reptileData.images.map((img, index) => (
                <div
                  key={index}
                  className="relative aspect-square rounded-2xl overflow-hidden group border border-zinc-800 shadow-2xl"
                >
                  <img
                    src={img}
                    alt="Preview"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                    <button
                      type="button"
                      onClick={() => {
                        const newImages = [...reptileData.images];
                        newImages.splice(index, 1);
                        setReptileData({ ...reptileData, images: newImages });
                      }}
                      className="bg-red-500 text-white p-2.5 rounded-full hover:bg-red-400 transition-all active:scale-90 shadow-xl"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}

              {reptileData.images.length < 3 && (
                <label className="aspect-square bg-zinc-950 border-2 border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center gap-2 text-zinc-500 hover:border-amber-500 hover:text-amber-500 transition-all cursor-pointer group hover:bg-amber-500/5 shadow-inner">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      if (file.size > 500 * 1024) {
                        setShowErrorModal(true);
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        setReptileData((prev) => ({
                          ...prev,
                          images: [...prev.images, event.target.result],
                        }));
                      };
                      reader.readAsDataURL(file);
                      e.target.value = null;
                    }}
                  />
                  <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center group-hover:bg-amber-500/20 group-hover:scale-110 transition-all shadow-lg">
                    <ImageIcon size={24} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                    Upload Foto
                  </span>
                </label>
              )}
            </div>
            <div className="px-1">
              <p className="text-[10px] font-bold text-amber-500/80 italic">
                * Ukuran foto maksimal 500KB per file. Pastikan foto jelas dan
                terang (Maks 3 Foto).
              </p>
            </div>
          </div>

          <div className="pt-8 border-t border-zinc-800">
            <label className="flex items-start gap-4 cursor-pointer group mb-8 px-2">
              <div className="relative mt-0.5">
                <input
                  type="checkbox"
                  required
                  className="peer sr-only"
                  checked={isAgreed}
                  onChange={(e) => setIsAgreed(e.target.checked)}
                />
                <div className="w-6 h-6 bg-zinc-950 border-2 border-zinc-700 rounded-lg peer-checked:bg-amber-500 peer-checked:border-amber-500 transition-all flex items-center justify-center shadow-inner">
                  <i className="fa-solid fa-check text-zinc-950 text-xs scale-0 peer-checked:scale-100 transition-transform"></i>
                </div>
              </div>
              <span className="text-xs font-bold text-zinc-500 group-hover:text-zinc-300 transition-colors leading-relaxed">
                Saya menyatakan bahwa data lelang dan ketentuan di atas adalah
                benar. Saya bertanggung jawab penuh atas proses lelang ini.
              </span>
            </label>

            <button
              type="submit"
              disabled={isSubmitting || reptileData.images.length === 0}
              className="w-full py-5 rounded-[1.5rem] bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black shadow-2xl shadow-amber-500/20 transition-all flex items-center justify-center gap-3 group active:scale-[0.98] disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="w-6 h-6 border-4 border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Gavel
                    size={24}
                    className="group-hover:rotate-12 transition-transform"
                  />
                  Mulai Lelang Sekarang
                  <ChevronRight
                    size={24}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-zinc-950/90 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => {
              setShowSuccessModal(false);
              setCreatedListingId(null);
            }}
          ></div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] w-full max-w-md p-12 text-center relative z-10 shadow-[0_0_100px_rgba(245,158,11,0.1)] animate-in zoom-in-95 duration-300">
            <div className="w-24 h-24 bg-amber-500 text-zinc-950 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-amber-500/30 relative">
              <div className="absolute inset-0 bg-amber-500 rounded-full animate-ping opacity-20"></div>
              <Gavel size={48} className="relative z-10" />
            </div>
            <h3 className="text-3xl font-black text-white mb-4">
              Lelang Dimulai!
            </h3>
            <p className="text-zinc-400 mb-10 leading-relaxed font-medium">
              Lelang Anda telah berhasil didaftarkan dan akan segera aktif
              setelah verifikasi sistem.
            </p>
            <div className="grid grid-cols-1 gap-4">
              {createdListingId && (
                <Link
                  href={`/toko/detail-lelang/${createdListingId}`}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black py-4 rounded-2xl transition-all shadow-xl flex items-center justify-center gap-2 active:scale-95"
                >
                  <Gavel size={20} />
                  Buka Detail Lelang
                </Link>
              )}
              <Link
                href="/user/toko/daftar-produk"
                onClick={() => {
                  setShowSuccessModal(false);
                  setCreatedListingId(null);
                }}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-black py-4 rounded-2xl transition-all shadow-xl flex items-center justify-center"
              >
                Lihat Daftar Produk
              </Link>
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  setCreatedListingId(null);
                  resetForm();
                }}
                className="w-full bg-transparent hover:bg-white/5 text-zinc-500 hover:text-white font-bold py-3 transition-all"
              >
                Tambah Lelang Lagi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-zinc-950/90 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setShowErrorModal(false)}
          ></div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] w-full max-w-md p-12 text-center relative z-10 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-24 h-24 bg-red-500 text-zinc-950 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-red-500/30">
              <AlertCircle size={48} />
            </div>
            <h3 className="text-3xl font-black text-white mb-4">
              File Terlalu Besar!
            </h3>
            <p className="text-zinc-400 mb-10 leading-relaxed font-medium">
              Ukuran foto tidak boleh melebihi{" "}
              <span className="text-red-500 font-black">500KB</span>. Silakan
              kompres foto Anda.
            </p>
            <button
              onClick={() => setShowErrorModal(false)}
              className="w-full bg-red-500 hover:bg-red-400 text-zinc-950 font-black py-4 rounded-2xl transition-all shadow-xl shadow-red-500/20"
            >
              Saya Mengerti
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        .quill-dark-editor .ql-toolbar {
          background-color: #09090b !important;
          border-color: #18181b !important;
          border-top-left-radius: 1rem;
          border-top-right-radius: 1rem;
        }
        .quill-dark-editor .ql-container {
          border-color: #18181b !important;
          border-bottom-left-radius: 1rem;
          border-bottom-right-radius: 1rem;
          min-height: 180px;
          font-size: 0.875rem;
        }
        .quill-dark-editor .ql-editor.ql-blank::before {
          color: #52525b !important;
          font-style: normal;
        }
        .quill-dark-editor .ql-snow .ql-stroke {
          stroke: #71717a !important;
        }
        .quill-dark-editor .ql-snow .ql-fill {
          fill: #71717a !important;
        }
        .quill-dark-editor .ql-snow .ql-picker {
          color: #71717a !important;
        }
        .quill-dark-editor .ql-snow .ql-picker-options {
          background-color: #09090b !important;
          border-color: #18181b !important;
        }
      `}</style>
    </div>
  );
}

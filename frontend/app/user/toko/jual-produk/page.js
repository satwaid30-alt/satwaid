"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";
import Link from "next/link";
import {
    Tag,
    ChevronRight,
    ChevronDown,
    ChevronUp,
    CheckCircle2,
    X,
    Image as ImageIcon,
    Truck,
    AlertCircle,
    ScrollText, ArrowLeft
} from "lucide-react";

// Import ReactQuill dynamically to avoid SSR errors
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

const quillModules = {
    toolbar: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['blockquote', 'code-block'],
        ['clean']
    ],
};

const quillFormats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list',
    'blockquote', 'code-block'
];

const initialReptileData = {
    name: "",
    species: "",
    price: "",
    description: "",
    sex: "",
    shipping_description: "",
    images: [],
    is_free_shipping: false,
    is_free_packing: false,
    shipping_type: "",
    stock: 1
};

export default function JualProdukPage() {
    const [hasShop, setHasShop] = useState(false);
    const [shopStatus, setShopStatus] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [showRules, setShowRules] = useState(false);

    const [reptileData, setReptileData] = useState({ ...initialReptileData });
    const [isAgreed, setIsAgreed] = useState(false);

    const resetForm = () => {
        setReptileData(prev => ({
            ...initialReptileData,
            shipping_description: prev.shipping_description
        }));
        setIsAgreed(false);
        setShowRules(false);
        setIsSubmitting(false);
    };

    useEffect(() => {
        const userData = localStorage.getItem("user");
        if (userData) {
            try {
                const parsed = JSON.parse(userData);
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/shops/user/${parsed.id}`)
                    .then(res => res.json())
                    .then(res => {
                        if (res.data) {
                            setHasShop(true);
                            setShopStatus(res.data.status);
                            // Pre-fill shipping policies from shop profile
                            setReptileData(prev => ({
                                ...prev,
                                shipping_description: `<strong>Kebijakan Pengiriman:</strong><br/>${res.data.shipping_policy || '-'}<br/><br/><strong>Kebijakan Garansi:</strong><br/>${res.data.warranty_policy || '-'}`
                            }));
                        }
                    })
                    .catch(err => console.error("Error fetching shop:", err));
            } catch (e) {
                console.error("Error parsing user data", e);
            }
        }
    }, []);

    const handleAddReptile = async (e) => {
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
            // Manual Validation for Rich Text and Images
            const cleanDescription = reptileData.description.replace(/<(.|\n)*?>/g, '').trim();
            const cleanShipping = reptileData.shipping_description.replace(/<(.|\n)*?>/g, '').trim();

            if (!reptileData.name || !reptileData.species || !reptileData.price ||
                !cleanDescription || !reptileData.sex || !cleanShipping ||
                !reptileData.shipping_type || reptileData.images.length === 0 || !reptileData.stock) {
                alert("Harap lengkapi semua data produk, deskripsi, kebijakan pengiriman, jenis pengiriman, dan unggah minimal satu foto.");
                setIsSubmitting(false);
                return;
            }

            const payload = {
                ...reptileData,
                type: "sell",
                user_id: userData.id,
                price: (reptileData.price || null),
                start_bid: null,
                multiple: null,
                end_date: null,
            };

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/listings`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (response.ok) {
                setSuccessMessage("Berhasil memasang jualan!");
                setShowSuccessModal(true);
                resetForm();
            } else {
                alert(result.message || "Gagal memasang iklan");
            }
        } catch (err) {
            console.error("Error adding listing:", err);
            alert("Terjadi kesalahan koneksi");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!hasShop) {
        return (
            <div className="max-w-4xl mx-auto py-20 text-center space-y-6">
                <div className="w-20 h-20 bg-zinc-900 border border-zinc-800 rounded-3xl flex items-center justify-center mx-auto text-zinc-500">
                    <AlertCircle size={40} />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-white">Toko Belum Terdaftar</h1>
                    <p className="text-zinc-500 mt-2">Anda harus membuka toko terlebih dahulu sebelum dapat berjualan.</p>
                </div>
                <Link
                    href="/user/toko"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black rounded-2xl transition-all shadow-lg shadow-emerald-500/20"
                >
                    Buka Toko Sekarang
                    <ChevronRight size={20} />
                </Link>
            </div>
        );
    }

    if (shopStatus?.toLowerCase() === 'suspended') {
        return (
            <div className="max-w-4xl mx-auto py-20 text-center space-y-6">
                <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center justify-center mx-auto text-red-500 shadow-xl shadow-red-500/5">
                    <AlertCircle size={40} />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-white">Toko Ditangguhkan</h1>
                    <p className="text-zinc-500 mt-2">Maaf, toko Anda sedang dalam status penangguhan oleh Admin. Aktivitas berjualan dinonaktifkan sementara.</p>
                </div>
                <button
                    onClick={() => window.open('https://wa.me/628123456789', '_blank')}
                    className="px-8 py-4 bg-white text-zinc-950 font-black rounded-2xl hover:bg-zinc-200 transition-all active:scale-95"
                >
                    Hubungi Admin
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950">
            <div className="max-w-5xl mx-auto py-6 sm:py-10 px-0 sm:px-6 lg:px-8 space-y-6 sm:space-y-10">
                {/* Header */}
                <div className="px-4 sm:px-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <Link
                            href="/user/toko"
                            className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-all mb-3 group font-black text-[10px] uppercase tracking-widest"
                        >
                            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                            Kembali ke Toko
                        </Link>
                        <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
                            <Tag className="text-emerald-500" size={24} />
                            Jual Produk Baru
                        </h1>
                        <p className="text-zinc-500 mt-1 font-bold uppercase tracking-widest text-[10px] sm:text-xs">Pasang iklan jualan produk/reptil Anda ke marketplace</p>
                    </div>
                    <Link
                        href="/user/toko/daftar-produk"
                        className="hidden sm:flex px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-bold rounded-xl border border-zinc-800 transition-all items-center gap-2"
                    >
                        Lihat Iklan Saya
                    </Link>
                </div>

                {/* Regulations Section */}
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl shadow-amber-500/5">
                    <button
                        onClick={() => setShowRules(!showRules)}
                        className="w-full p-4 sm:p-6 flex items-center justify-between text-left hover:bg-amber-500/5 transition-colors"
                    >
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-500 text-zinc-950 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
                                <ScrollText size={20} />
                            </div>
                            <div>
                                <h2 className="text-base sm:text-xl font-black text-amber-500 uppercase tracking-tight">📜 Peraturan Jualan</h2>
                                <p className="text-amber-500/60 text-xs sm:text-sm">Wajib dipatuhi oleh semua penjual</p>
                            </div>
                        </div>
                        <div className="w-10 h-10 rounded-full border border-amber-500/20 flex items-center justify-center text-amber-500">
                            {showRules ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                    </button>

                    {showRules && (
                        <div className="px-8 pb-8 animate-in slide-in-from-top-2 duration-300">
                            <div className="h-px bg-amber-500/20 mb-8"></div>

                            <p className="text-amber-500/80 text-sm mb-8 font-medium italic">
                                Untuk menjaga kenyamanan dan keamanan bersama, setiap penjual wajib mengikuti peraturan berikut:
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 text-sm text-zinc-300">
                                {/* Kolom 1 */}
                                <div className="space-y-8">
                                    <div className="space-y-3">
                                        <h3 className="font-black text-white flex items-center gap-2 text-base">
                                            <span className="w-7 h-7 bg-amber-500 text-zinc-950 rounded-lg flex items-center justify-center text-xs shadow-lg shadow-amber-500/10">1</span>
                                            Keaslian & Kejujuran Produk
                                        </h3>
                                        <ul className="list-disc list-outside ml-9 text-zinc-400 space-y-2 leading-relaxed">
                                            <li>Semua hewan yang dijual harus sesuai dengan deskripsi, termasuk spesies, morph/genetik, umur, dan kondisi.</li>
                                            <li>Dilarang memberikan informasi palsu atau menyesatkan.</li>
                                        </ul>
                                    </div>

                                    <div className="space-y-3">
                                        <h3 className="font-black text-white flex items-center gap-2 text-base">
                                            <span className="w-7 h-7 bg-amber-500 text-zinc-950 rounded-lg flex items-center justify-center text-xs shadow-lg shadow-amber-500/10">2</span>
                                            Kondisi Hewan
                                        </h3>
                                        <ul className="list-disc list-outside ml-9 text-zinc-400 space-y-2 leading-relaxed">
                                            <li>Hewan yang dijual harus dalam kondisi sehat, aktif, dan layak jual.</li>
                                            <li>Wajib mencantumkan kondisi terkini, riwayat makan, dan jika ada kekurangan (cacat/penyakit) harus dijelaskan secara jujur.</li>
                                        </ul>
                                    </div>

                                    <div className="space-y-3">
                                        <h3 className="font-black text-white flex items-center gap-2 text-base">
                                            <span className="w-7 h-7 bg-amber-500 text-zinc-950 rounded-lg flex items-center justify-center text-xs shadow-lg shadow-amber-500/10">3</span>
                                            Foto Produk
                                        </h3>
                                        <ul className="list-disc list-outside ml-9 text-zinc-400 space-y-2 leading-relaxed">
                                            <li>Gunakan foto asli (real picture), bukan hasil ambil dari internet.</li>
                                            <li>Foto harus jelas, tidak blur, dan menampilkan kondisi sebenarnya dari hewan.</li>
                                            <li>Hindari penggunaan filter berlebihan yang dapat menyesatkan pembeli.</li>
                                        </ul>
                                    </div>

                                    <div className="space-y-3">
                                        <h3 className="font-black text-white flex items-center gap-2 text-base">
                                            <span className="w-7 h-7 bg-amber-500 text-zinc-950 rounded-lg flex items-center justify-center text-xs shadow-lg shadow-amber-500/10">4</span>
                                            Penetapan Harga
                                        </h3>
                                        <ul className="list-disc list-outside ml-9 text-zinc-400 space-y-2 leading-relaxed">
                                            <li>Harga harus jelas dan sesuai dengan produk yang ditawarkan.</li>
                                            <li>Harga yang diinput pada form Harga Jual adalah harga per ekor, tidak termasuk ongkos kirim (ongkir), packing, dan biaya tambahan lainnya yang akan dihitung terpisah saat transaksi.</li>
                                            <li>Dilarang melakukan perubahan harga sepihak setelah terjadi kesepakatan.</li>
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
                                            <li>Seluruh transaksi <strong>wajib dilakukan melalui pihak ketiga (Admin Platform)</strong> sebagai perantara.</li>
                                            <li>Pembeli melakukan pembayaran terlebih dahulu kepada Admin.</li>
                                            <li>Dana akan diteruskan kepada penjual setelah barang/hewan diterima oleh pembeli.</li>
                                            <li className="text-amber-500 font-bold">Dilarang melakukan transaksi di luar platform.</li>
                                            <li>Apabila transaksi dilakukan di luar Admin, maka <strong>segala risiko dan kerugian bukan menjadi tanggung jawab Admin Platform</strong>.</li>
                                            <li>Penjual <strong>wajib mengirimkan nomor resi atau bukti pengiriman kepada Admin dan pembeli</strong> sebagai bentuk validasi transaksi.</li>
                                        </ul>
                                    </div>

                                    <div className="space-y-3">
                                        <h3 className="font-black text-white flex items-center gap-2 text-base">
                                            <span className="w-7 h-7 bg-amber-500 text-zinc-950 rounded-lg flex items-center justify-center text-xs shadow-lg shadow-amber-500/10">6</span>
                                            Pengiriman & Penyerahan
                                        </h3>
                                        <ul className="list-disc list-outside ml-9 text-zinc-400 space-y-2 leading-relaxed">
                                            <li>Penjual bertanggung jawab atas keamanan hewan selama proses pengiriman.</li>
                                            <li>Pengiriman dilakukan setelah pembayaran dikonfirmasi oleh Admin.</li>
                                            <li>Penjual wajib menggunakan metode pengiriman yang aman dan sesuai untuk hewan hidup.</li>
                                            <li>Nomor resi atau bukti pengiriman wajib diberikan melalui platform.</li>
                                        </ul>
                                    </div>

                                    <div className="space-y-3">
                                        <h3 className="font-black text-white flex items-center gap-2 text-base">
                                            <span className="w-7 h-7 bg-amber-500 text-zinc-950 rounded-lg flex items-center justify-center text-xs shadow-lg shadow-amber-500/10">7</span>
                                            Larangan Penjualan
                                        </h3>
                                        <ul className="list-disc list-outside ml-9 text-zinc-400 space-y-2 leading-relaxed">
                                            <li>Dilarang menjual hewan yang dilindungi atau ilegal.</li>
                                            <li>Dilarang menjual hewan dalam kondisi sakit parah atau tidak layak jual.</li>
                                        </ul>
                                    </div>

                                    <div className="space-y-3">
                                        <h3 className="font-black text-white flex items-center gap-2 text-base">
                                            <span className="w-7 h-7 bg-amber-500 text-zinc-950 rounded-lg flex items-center justify-center text-xs shadow-lg shadow-amber-500/10">8</span>
                                            Tanggung Jawab Penjual
                                        </h3>
                                        <ul className="list-disc list-outside ml-9 text-zinc-400 space-y-2 leading-relaxed">
                                            <li>Penjual wajib merespon pertanyaan pembeli dengan baik dan sopan.</li>
                                            <li>Penjual bertanggung jawab penuh atas produk yang dijual.</li>
                                        </ul>
                                    </div>

                                    <div className="space-y-3">
                                        <h3 className="font-black text-white flex items-center gap-2 text-base">
                                            <span className="w-7 h-7 bg-amber-500 text-zinc-950 rounded-lg flex items-center justify-center text-xs shadow-lg shadow-amber-500/10">9</span>
                                            Sanksi
                                        </h3>
                                        <div className="ml-9 space-y-2">
                                            <p className="text-zinc-400 leading-relaxed">Pelanggaran terhadap peraturan dapat mengakibatkan:</p>
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
                                    💡 Dengan menggunakan platform ini, penjual dianggap telah membaca, memahami, dan menyetujui seluruh peraturan yang berlaku.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="sm:bg-zinc-900 sm:border sm:border-zinc-800 sm:rounded-3xl sm:shadow-2xl overflow-hidden">
                    <form onSubmit={handleAddReptile} className="p-4 sm:p-8 md:p-10 space-y-8">
                        {/* Basic Info Section */}
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-zinc-300 uppercase tracking-widest ml-1">Nama Produk / Judul Iklan <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Contoh: Ball Python Piebald High White"
                                        className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-2xl px-5 py-4 focus:outline-none focus:border-emerald-500 transition-all font-bold placeholder:text-zinc-700 shadow-inner"
                                        value={reptileData.name}
                                        onChange={(e) => setReptileData({ ...reptileData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-zinc-300 uppercase tracking-widest ml-1">Kategori / Spesies <span className="text-red-500">*</span></label>
                                    <select
                                        required
                                        className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-2xl px-5 py-4 focus:outline-none focus:border-emerald-500 transition-all font-bold appearance-none cursor-pointer shadow-inner"
                                        value={reptileData.species}
                                        onChange={(e) => setReptileData({ ...reptileData, species: e.target.value })}
                                    >
                                        <option value="">Pilih Kategori</option>
                                        <option value="Reptil">Reptil</option>
                                        <option value="Mamalia">Mamalia</option>
                                        <option value="Burung">Burung</option>
                                        <option value="Ikan">Ikan</option>
                                        <option value="Amfibi">Amfibi</option>
                                        <option value="Serangga">Serangga</option>
                                        <option value="Invertebrata Lainnya">Invertebrata Lainnya</option>
                                        <option value="Unggas">Unggas</option>
                                        <option value="Hewan Lainnya">Hewan Lainnya</option>
                                        <option value="Pakan Hewan">Pakan Hewan</option>
                                        <option value="Perlengkapan & Aksesoris">Perlengkapan & Aksesoris</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-zinc-300 uppercase tracking-widest ml-1">Harga Jual (Rp) <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 font-black">Rp</span>
                                        <input
                                            type="number"
                                            required
                                            placeholder="Contoh: 1500000"
                                            className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-2xl pl-14 pr-5 py-4 focus:outline-none focus:border-emerald-500 transition-all font-bold placeholder:text-zinc-700 shadow-inner"
                                            value={reptileData.price}
                                            onChange={(e) => setReptileData({ ...reptileData, price: e.target.value })}
                                        />
                                    </div>
                                    <div className="px-1 py-1">
                                        <p className="text-[11px] font-bold text-amber-500/80 italic leading-tight">
                                            * Harga Belum termasuk ongkir & packing. Klik pilihan "Gratis" di bawah jika ingin menggratiskan.
                                        </p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-zinc-300 uppercase tracking-widest ml-1">Jenis Kelamin <span className="text-red-500">*</span></label>
                                        <select
                                            required
                                            className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-2xl px-5 py-4 focus:outline-none focus:border-emerald-500 transition-all font-bold appearance-none cursor-pointer shadow-inner text-sm"
                                            value={reptileData.sex}
                                            onChange={(e) => setReptileData({ ...reptileData, sex: e.target.value })}
                                        >
                                            <option value="" disabled>Pilih</option>
                                            <option value="Jantan">Jantan</option>
                                            <option value="Betina">Betina</option>
                                            <option value="Unsex">Unsex</option>
                                            <option value="Unknown">Unknown</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-zinc-300 uppercase tracking-widest ml-1">Stok <span className="text-red-500">*</span></label>
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-2xl px-5 py-4 focus:outline-none focus:border-emerald-500 transition-all font-bold shadow-inner"
                                            value={reptileData.stock}
                                            onChange={(e) => setReptileData({ ...reptileData, stock: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Shipping Options */}
                        <div className="sm:p-6 sm:bg-zinc-950/50 sm:border sm:border-zinc-800 sm:rounded-3xl space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] sm:text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Jangkauan Pengiriman <span className="text-red-500">*</span></label>
                                <select
                                    required
                                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-2xl px-5 py-4 focus:outline-none focus:border-emerald-500 transition-all font-bold appearance-none cursor-pointer shadow-inner text-sm"
                                    value={reptileData.shipping_type}
                                    onChange={(e) => setReptileData({ ...reptileData, shipping_type: e.target.value })}
                                >
                                    <option value="" disabled>Pilih Jangkauan Pengiriman</option>
                                    <option value="Pengiriman Dalam Pulau/ Wilayah">Pengiriman Dalam Pulau/ Wilayah</option>
                                    <option value="Pengiriman Seluruh Pulau/ Wilayah">Pengiriman Seluruh Pulau/ Wilayah</option>
                                </select>
                            </div>

                            <div className="space-y-3">
                                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Opsi Tambahan</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    <label className="flex items-center gap-4 cursor-pointer group bg-zinc-950/50 p-4 sm:p-5 rounded-2xl border border-zinc-800/50 hover:border-emerald-500/30 transition-all shadow-inner">
                                        <div className="relative flex items-center shrink-0">
                                            <input
                                                type="checkbox"
                                                className="peer sr-only"
                                                checked={reptileData.is_free_shipping}
                                                onChange={(e) => setReptileData({ ...reptileData, is_free_shipping: e.target.checked })}
                                            />
                                            <div className="w-7 h-7 bg-zinc-900 border-2 border-zinc-700 rounded-xl peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-all flex items-center justify-center shadow-lg">
                                                <CheckCircle2 size={16} className="text-zinc-950 scale-0 peer-checked:scale-100 transition-transform" />
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-sm font-black text-white group-hover:text-emerald-500 transition-colors">Gratis Ongkir</span>
                                            <span className="text-[10px] text-zinc-600 italic">Bebas biaya pengiriman</span>
                                        </div>
                                    </label>
                                    <label className="flex items-center gap-4 cursor-pointer group bg-zinc-950/50 p-4 sm:p-5 rounded-2xl border border-zinc-800/50 hover:border-emerald-500/30 transition-all shadow-inner">
                                        <div className="relative flex items-center shrink-0">
                                            <input
                                                type="checkbox"
                                                className="peer sr-only"
                                                checked={reptileData.is_free_packing}
                                                onChange={(e) => setReptileData({ ...reptileData, is_free_packing: e.target.checked })}
                                            />
                                            <div className="w-7 h-7 bg-zinc-900 border-2 border-zinc-700 rounded-xl peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-all flex items-center justify-center shadow-lg">
                                                <CheckCircle2 size={16} className="text-zinc-950 scale-0 peer-checked:scale-100 transition-transform" />
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-sm font-black text-white group-hover:text-emerald-500 transition-colors">Gratis Packing</span>
                                            <span className="text-[10px] text-zinc-600 italic">Bebas biaya pengemasan</span>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Rich Text Editors */}
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-zinc-300 uppercase tracking-widest ml-1">Deskripsi Produk <span className="text-red-500">*</span></label>
                                <div className="quill-dark-editor">
                                    <ReactQuill
                                        theme="snow"
                                        value={reptileData.description}
                                        onChange={(content) => setReptileData({ ...reptileData, description: content })}
                                        modules={quillModules}
                                        formats={quillFormats}
                                        placeholder="Tuliskan kondisi kesehatan, karakter, riwayat makan, dan detail lainnya secara lengkap..."
                                        className="bg-zinc-950 text-white rounded-2xl overflow-hidden border border-zinc-800 focus-within:border-emerald-500 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 ml-1">
                                    <div className="flex items-center gap-2">
                                        <Truck size={14} className="text-emerald-500 shrink-0" />
                                        <label className="text-xs font-black text-zinc-300 uppercase tracking-widest break-words">Kebijakan Pengiriman & Garansi</label>
                                    </div>
                                    <span className="w-fit text-[9px] sm:text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">Otomatis dari Profil</span>
                                </div>
                                <div className="p-5 sm:p-6 bg-zinc-950 border border-zinc-800 rounded-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-2xl rounded-full -mr-8 -mt-8"></div>
                                    <div className="text-sm text-zinc-400 leading-relaxed description-content relative z-10 break-words overflow-hidden" dangerouslySetInnerHTML={{ __html: reptileData.shipping_description || '<span className="italic opacity-50">Mengambil data kebijakan dari profil toko Anda...</span>' }}></div>
                                    <div className="mt-4 pt-4 border-t border-zinc-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                                        <p className="text-[10px] text-zinc-500 font-bold italic leading-relaxed break-words">Kebijakan ini diambil otomatis dari pengaturan toko Anda agar seragam.</p>
                                        <Link href="/user/toko/edit-toko" className="text-[10px] font-black text-emerald-500 hover:text-emerald-400 uppercase tracking-widest transition-colors flex items-center gap-1 shrink-0">
                                            Ubah di Profil <ChevronRight size={12} />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Image Upload */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between ml-1">
                                <label className="text-xs font-black text-zinc-300 uppercase tracking-widest">Foto Produk (Maks 3) <span className="text-red-500">*</span></label>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                                {reptileData.images.map((img, index) => (
                                    <div key={index} className="relative aspect-square rounded-2xl overflow-hidden group border border-zinc-800 shadow-2xl bg-zinc-900">
                                        <img src={img} alt="Preview" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                        {/* Delete button - always visible on mobile, hover on desktop */}
                                        <div className="absolute top-2 right-2 sm:absolute sm:inset-0 sm:bg-black/60 sm:opacity-0 sm:group-hover:opacity-100 sm:transition-opacity sm:flex sm:items-center sm:justify-center sm:backdrop-blur-sm">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newImages = [...reptileData.images];
                                                    newImages.splice(index, 1);
                                                    setReptileData({ ...reptileData, images: newImages });
                                                }}
                                                className="bg-red-500/90 text-white p-2 rounded-xl hover:bg-red-500 transition-all active:scale-90 shadow-lg backdrop-blur-sm sm:bg-red-500 sm:p-2.5 sm:rounded-full"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {reptileData.images.length < 3 && (
                                    <label className="aspect-square bg-zinc-950 border-2 border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center gap-2 text-zinc-500 hover:border-emerald-500 hover:text-emerald-500 transition-all cursor-pointer group hover:bg-emerald-500/5 shadow-inner">
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
                                                    setReptileData(prev => ({
                                                        ...prev,
                                                        images: [...prev.images, event.target.result]
                                                    }));
                                                };
                                                reader.readAsDataURL(file);
                                                e.target.value = null;
                                            }}
                                        />
                                        <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center group-hover:bg-emerald-500/20 group-hover:scale-110 transition-all shadow-lg">
                                            <ImageIcon size={24} />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Upload Foto</span>
                                    </label>
                                )}
                            </div>
                            <div className="px-1">
                                <p className="text-[11px] font-bold text-amber-500/80 italic">
                                    * Ukuran foto maksimal 500KB per file. Pastikan foto jelas dan terang (Maks 3 Foto).
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
                                    <div className="w-6 h-6 bg-zinc-950 border-2 border-zinc-700 rounded-lg peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-all flex items-center justify-center shadow-inner">
                                        <CheckCircle2 size={14} className="text-zinc-950 scale-0 peer-checked:scale-100 transition-transform" />
                                    </div>
                                </div>
                                <span className="text-xs font-bold text-zinc-300 group-hover:text-zinc-300 transition-colors leading-relaxed">
                                    Saya menyatakan bahwa data produk dan ketentuan penjualan di atas adalah benar dan sesuai dengan kondisi aslinya.
                                </span>
                            </label>

                            <button
                                type="submit"
                                disabled={isSubmitting || reptileData.images.length === 0}
                                className="w-full py-5 rounded-[1.5rem] bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black shadow-2xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3 group active:scale-[0.98] disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <div className="w-6 h-6 border-4 border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <CheckCircle2 size={24} className="group-hover:scale-110 transition-transform" />
                                        Pasang Iklan Sekarang
                                        <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Success Modal */}
                {showSuccessModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowSuccessModal(false)}></div>
                        <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] w-full max-w-md p-12 text-center relative z-10 shadow-[0_0_100px_rgba(16,185,129,0.1)] animate-in zoom-in-95 duration-300">
                            <div className="w-24 h-24 bg-emerald-500 text-zinc-950 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-500/30 relative">
                                <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-20"></div>
                                <CheckCircle2 size={48} className="relative z-10" />
                            </div>
                            <h3 className="text-3xl font-black text-white mb-4">Iklan Terpasang!</h3>
                            <p className="text-zinc-400 mb-10 leading-relaxed font-medium">
                                Produk Anda telah berhasil ditambahkan dan akan segera tayang setelah verifikasi sistem.
                            </p>
                            <div className="grid grid-cols-1 gap-4">
                                <Link
                                    href="/user/toko/daftar-produk"
                                    className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-black py-4 rounded-2xl transition-all shadow-xl"
                                >
                                    Lihat Daftar Produk
                                </Link>
                                <button
                                    onClick={() => {
                                        setShowSuccessModal(false);
                                        resetForm();
                                    }}
                                    className="w-full bg-transparent hover:bg-white/5 text-zinc-500 hover:text-white font-bold py-3 transition-all"
                                >
                                    Tambah Produk Lagi
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Error Modal */}
                {showErrorModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowErrorModal(false)}></div>
                        <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] w-full max-w-md p-12 text-center relative z-10 shadow-2xl animate-in zoom-in-95 duration-300">
                            <div className="w-24 h-24 bg-red-500 text-zinc-950 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-red-500/30">
                                <AlertCircle size={48} />
                            </div>
                            <h3 className="text-3xl font-black text-white mb-4">File Terlalu Besar!</h3>
                            <p className="text-zinc-400 mb-10 leading-relaxed font-medium">
                                Ukuran foto tidak boleh melebihi <span className="text-red-500 font-black">500KB</span>. Silakan kompres foto Anda.
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
                .quill-dark-editor .ql-editor.ql-blank::before { color: #52525b !important; font-style: normal; }
                .quill-dark-editor .ql-snow .ql-stroke { stroke: #71717a !important; }
                .quill-dark-editor .ql-snow .ql-fill { fill: #71717a !important; }
                .quill-dark-editor .ql-snow .ql-picker { color: #71717a !important; }
                .quill-dark-editor .ql-snow .ql-picker-options { background-color: #09090b !important; border-color: #18181b !important; }
                
                .description-content ul, .ql-editor ul {
                    list-style-type: disc !important;
                    list-style-position: inside !important;
                    padding-left: 0.5rem !important;
                    margin-left: 0 !important;
                    margin-bottom: 1rem !important;
                }
                .description-content ol, .ql-editor ol {
                    list-style-type: decimal !important;
                    list-style-position: inside !important;
                    padding-left: 0.5rem !important;
                    margin-left: 0 !important;
                    margin-bottom: 1rem !important;
                }
                .description-content li, .ql-editor li {
                    display: list-item !important;
                    margin-bottom: 0.5rem !important;
                    color: inherit !important;
                }
                .description-content li p, .ql-editor li p {
                    display: inline !important;
                }
            `}</style>
            </div>
        </div>
    );
}


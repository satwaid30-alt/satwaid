"use client";

import { useEffect, useState } from "react";
import { getApiUrl } from "@/app/utils/api";
import {
  Sliders,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Coins,
  Info,
  ShieldCheck,
  Unlock
} from "lucide-react";

export default function BiayaAdminPage() {
  const [adminFee, setAdminFee] = useState(5000);
  const [inputFee, setInputFee] = useState("5000");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" }); // success | error
  const [isLocked, setIsLocked] = useState(true);

  const formatPrice = (price) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const fetchAdminFee = async () => {
    setLoading(true);
    setMessage({ text: "", type: "" });
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(`${getApiUrl()}/admin/settings/admin-fee`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setAdminFee(result.adminFee);
        setInputFee(String(result.adminFee));
      } else {
        throw new Error(result.message || "Gagal mengambil data biaya admin");
      }
    } catch (error) {
      console.error(error);
      setMessage({
        text: error.message || "Terjadi kesalahan koneksi ke server.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      try {
        const token = localStorage.getItem("admin_token");
        const res = await fetch(`${getApiUrl()}/admin/settings/admin-fee`, {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        });
        const result = await res.json();
        if (res.ok && result.success && active) {
          setAdminFee(result.adminFee);
          setInputFee(String(result.adminFee));
        } else if (active) {
          throw new Error(result.message || "Gagal mengambil data biaya admin");
        }
      } catch (error) {
        console.error(error);
        if (active) {
          setMessage({
            text: error.message || "Terjadi kesalahan koneksi ke server.",
            type: "error",
          });
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadData();

    const handleAdminFeeUpdated = (e) => {
      if (typeof e.detail === "number" && active) {
        setAdminFee(e.detail);
        setInputFee(String(e.detail));
      }
    };
    window.addEventListener("admin_fee_updated", handleAdminFeeUpdated);

    return () => {
      active = false;
      window.removeEventListener("admin_fee_updated", handleAdminFeeUpdated);
    };
  }, []);

  const handlePresetClick = (val) => {
    setInputFee(String(val));
  };

  const handleInputChange = (e) => {
    // Only allow digits
    const val = e.target.value.replace(/\D/g, "");
    setInputFee(val);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const numericFee = Number(inputFee);
    if (inputFee === "" || isNaN(numericFee) || numericFee < 0) {
      setMessage({
        text: "Biaya admin tidak valid. Masukkan nilai numerik di atas atau sama dengan 0.",
        type: "error",
      });
      return;
    }

    setSaving(true);
    setMessage({ text: "", type: "" });
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(`${getApiUrl()}/admin/settings/admin-fee`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ adminFee: numericFee }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setAdminFee(result.adminFee);
        setInputFee(String(result.adminFee));
        setIsLocked(true);
        setMessage({ text: "Biaya admin berhasil diperbarui!", type: "success" });
        setTimeout(() => setMessage({ text: "", type: "" }), 4000);
      } else {
        throw new Error(result.message || "Gagal memperbarui biaya admin");
      }
    } catch (error) {
      console.error(error);
      setMessage({ text: error.message || "Gagal menyimpan perubahan.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const presets = [0, 2000, 3000, 5000, 7500, 10000, 15000, 20000];

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Sliders className="text-emerald-500" size={32} />
            Pengaturan Biaya Admin
          </h1>
          <p className="text-zinc-500 text-sm mt-1 font-medium">
            Atur biaya administrasi flat yang dikenakan untuk setiap order atau penyesuaian ongkos kirim.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={fetchAdminFee}
            disabled={loading || saving}
            className="p-3 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-xl transition-all disabled:opacity-50"
            title="Muat Ulang Data"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Alert Messages */}
      {message.text && (
        <div
          className={`flex items-start gap-4 p-4 rounded-xl border ${
            message.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-red-500/10 border-red-500/20 text-red-400"
          } animate-in fade-in slide-in-from-top-2 duration-200`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="shrink-0 mt-0.5" size={20} />
          ) : (
            <AlertCircle className="shrink-0 mt-0.5" size={20} />
          )}
          <div className="flex-1 text-sm font-semibold">{message.text}</div>
        </div>
      )}

      {loading ? (
        <div className="space-y-6">
          <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-[2rem] h-48 animate-pulse flex flex-col justify-between">
            <div className="h-6 bg-zinc-800 rounded w-1/4"></div>
            <div className="h-10 bg-zinc-800 rounded w-1/2"></div>
            <div className="h-4 bg-zinc-800 rounded w-1/3"></div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-[2rem] h-96 animate-pulse"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Summary / Stats Card */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-[2rem] space-y-4 hover:border-zinc-750 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                  <Coins size={20} />
                </div>
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Aktif Saat Ini</span>
              </div>
              <div>
                <h3 className="text-3xl font-black text-white tracking-tight">
                  {formatPrice(adminFee)}
                </h3>
                <p className="text-zinc-500 text-xs mt-2 font-medium">
                  Biaya admin global yang sedang diterapkan ke sistem pembayaran.
                </p>
              </div>
            </div>

            <div className="bg-zinc-900/20 border border-zinc-800/60 p-6 rounded-2xl flex gap-3.5">
              <Info className="text-zinc-500 shrink-0 mt-0.5" size={18} />
              <p className="text-zinc-500 text-xs leading-relaxed font-medium">
                Pembaruan biaya admin akan langsung berpengaruh pada checkout pesanan baru dan kalkulasi akhir transaksi. Pesanan lama tidak akan terdampak.
              </p>
            </div>
          </div>

          {/* Form Card */}
          <div className="md:col-span-2">
            <form
              onSubmit={handleSave}
              className="bg-zinc-900/30 border border-zinc-800 p-8 rounded-[2.5rem] space-y-8"
            >
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="text-emerald-500" size={20} />
                  Ubah Biaya Admin
                </h2>
                <p className="text-zinc-500 text-xs mt-1 font-medium">
                  Tentukan nominal biaya admin baru. Gunakan preset di bawah untuk pengisian cepat.
                </p>
              </div>

              {/* Input nominal */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                  Nominal Biaya (IDR)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500 font-bold text-sm">
                    Rp
                  </div>
                  <input
                    type="text"
                    value={inputFee}
                    onChange={handleInputChange}
                    placeholder="0"
                    disabled={isLocked || loading || saving}
                    className={`w-full border rounded-xl pl-12 pr-4 py-3.5 text-base font-bold transition-all ${
                      isLocked
                        ? "bg-zinc-950/40 border-zinc-900/60 text-zinc-500 cursor-not-allowed"
                        : "bg-zinc-950 border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none text-white"
                    }`}
                  />
                </div>
                {inputFee && !isNaN(Number(inputFee)) && (
                  <p className="text-xs text-emerald-500 font-semibold animate-in fade-in duration-200">
                    Format: {formatPrice(Number(inputFee))}
                  </p>
                )}
              </div>

              {/* Preset Buttons */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                  Preset Cepat
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {presets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handlePresetClick(preset)}
                      disabled={isLocked || loading || saving}
                      className={`px-4 py-2.5 text-xs font-bold rounded-xl border transition-all ${
                        isLocked
                          ? "bg-zinc-900/30 border-zinc-900/40 text-zinc-600 cursor-not-allowed"
                          : Number(inputFee) === preset
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                            : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                      }`}
                    >
                      {preset === 0 ? "Gratis (Rp 0)" : formatPrice(preset)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions Section */}
              {isLocked ? (
                <button
                  type="button"
                  onClick={() => setIsLocked(false)}
                  disabled={loading || saving}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-emerald-400 hover:text-emerald-300 font-bold rounded-2xl transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Unlock size={18} />
                  Ubah Konfigurasi
                </button>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsLocked(true);
                      setInputFee(String(adminFee));
                      setMessage({ text: "", type: "" });
                    }}
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white font-bold rounded-2xl transition-all disabled:opacity-50 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-[2] flex items-center justify-center gap-2 px-6 py-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black rounded-2xl transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {saving ? (
                      <>
                        <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
                        Menyimpan Perubahan...
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        Simpan Konfigurasi
                      </>
                    )}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

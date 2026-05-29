"use client";

import { useEffect, useState } from "react";
import { getApiUrl } from "@/app/utils/api";
import { 
  Sliders, 
  Save, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Home, 
  User, 
  MessageSquare, 
  ShoppingBag, 
  Store, 
  Settings,
  EyeOff,
  Wrench,
  Code,
  Check
} from "lucide-react";

const ICON_MAP = {
  beranda: Home,
  profil: User,
  komunitas: MessageSquare,
  pesanan: ShoppingBag,
  toko: Store,
  keamanan: Settings
};

export default function ControlMenuPage() {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" }); // type: success | error

  // Load menu controls
  const fetchMenus = async () => {
    setLoading(true);
    setMessage({ text: "", type: "" });
    try {
      const res = await fetch(`${getApiUrl()}/menu-controls`);
      const result = await res.json();
      if (res.ok && result.success) {
        // Deep copy of data for modifications
        setMenus(JSON.parse(JSON.stringify(result.data)));
      } else {
        throw new Error(result.message || "Gagal mengambil data menu");
      }
    } catch (error) {
      console.error(error);
      setMessage({ text: error.message || "Terjadi kesalahan koneksi ke server.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  // Update localized state of a menu field
  const handleStatusChange = (menuKey, status) => {
    setMenus((prevMenus) =>
      prevMenus.map((menu) =>
        menu.menu_key === menuKey ? { ...menu, status } : menu
      )
    );
  };

  const handleMessageChange = (menuKey, msg) => {
    setMenus((prevMenus) =>
      prevMenus.map((menu) =>
        menu.menu_key === menuKey ? { ...menu, message: msg } : menu
      )
    );
  };

  // Submit all modified menu states at once
  const handleSaveChanges = async () => {
    setSaving(true);
    setMessage({ text: "", type: "" });
    try {
      const updates = menus.map((m) => ({
        menu_key: m.menu_key,
        status: m.status,
        message: m.message
      }));

      const res = await fetch(`${getApiUrl()}/menu-controls/bulk`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ updates })
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setMessage({ text: "Semua pengaturan menu berhasil disimpan!", type: "success" });
        // Automatically hide alert after 4 seconds
        setTimeout(() => setMessage({ text: "", type: "" }), 4000);
      } else {
        throw new Error(result.message || "Gagal memperbarui data menu");
      }
    } catch (error) {
      console.error(error);
      setMessage({ text: error.message || "Gagal menyimpan perubahan.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  // Group menus by hierarchy (Parent menus vs child submenus)
  const mainMenus = menus.filter((m) => m.parent_key === null);
  
  const getSubmenus = (parentKey) => {
    return menus.filter((m) => m.parent_key === parentKey);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Sliders className="text-emerald-500" size={32} />
            Pengaturan Kontrol Menu
          </h1>
          <p className="text-zinc-500 text-sm mt-1 font-medium">
            Kelola visibilitas, status pemeliharaan (maintenance), dan fase pengembangan (development) menu CMS SatwaID.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={fetchMenus}
            disabled={loading || saving}
            className="p-3 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-xl transition-all disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={handleSaveChanges}
            disabled={loading || saving}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.3)] disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
                Menyimpan...
              </>
            ) : (
              <>
                <Save size={18} />
                Simpan Perubahan
              </>
            )}
          </button>
        </div>
      </div>

      {/* Messages */}
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

      {/* Loading Skeletons */}
      {loading ? (
        <div className="space-y-8">
          {[...Array(2)].map((_, idx) => (
            <div key={idx} className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-[2rem] space-y-6 animate-pulse">
              <div className="h-6 bg-zinc-800 rounded w-1/4"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(2)].map((_, sIdx) => (
                  <div key={sIdx} className="bg-zinc-900 border border-zinc-850 p-6 rounded-2xl h-44"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-10">
          {/* Loop Groups */}
          {mainMenus.map((parentMenu) => {
            const submenus = getSubmenus(parentMenu.menu_key);
            const MenuIcon = ICON_MAP[parentMenu.menu_key] || Sliders;

            return (
              <div key={parentMenu.id} className="bg-zinc-900/30 border border-zinc-850 p-8 rounded-[2.5rem] space-y-6">
                {/* Parent Menu Header */}
                <div className="flex items-center justify-between border-b border-zinc-800/40 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-emerald-500 border border-zinc-700/50">
                      <MenuIcon size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">{parentMenu.name}</h2>
                      <span className="text-zinc-500 text-xs font-mono font-medium">Key: {parentMenu.menu_key}</span>
                    </div>
                  </div>
                  
                  {/* Parent Status Badge */}
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500 text-xs font-semibold mr-1">Status Induk:</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                      parentMenu.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                      parentMenu.status === 'maintenance' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                      parentMenu.status === 'development' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                      'bg-zinc-800 text-zinc-500 border border-zinc-700/50'
                    }`}>
                      {parentMenu.status}
                    </span>
                  </div>
                </div>

                {/* Parent Menu Content Card Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Render Parent Menu itself as a controllable item */}
                  <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl hover:border-zinc-750 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-bold text-white text-base flex items-center gap-2">
                            {parentMenu.name}
                            <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-md font-mono">Induk</span>
                          </h3>
                          <p className="text-zinc-500 text-xs mt-1">Mengontrol menu utama secara keseluruhan.</p>
                        </div>
                      </div>

                      {/* Status selectors */}
                      <div className="grid grid-cols-4 gap-2 mb-4">
                        {['active', 'maintenance', 'development', 'hidden'].map((status) => (
                          <button
                            key={status}
                            onClick={() => handleStatusChange(parentMenu.menu_key, status)}
                            className={`py-2 text-[10px] font-black uppercase tracking-wider rounded-lg border text-center transition-all ${
                              parentMenu.status === status
                                ? status === 'active' ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-400' :
                                  status === 'maintenance' ? 'bg-amber-500/10 border-amber-500/35 text-amber-400' :
                                  status === 'development' ? 'bg-blue-500/10 border-blue-500/35 text-blue-400' :
                                  'bg-zinc-800 border-zinc-700 text-zinc-300'
                                : 'bg-transparent border-zinc-800 text-zinc-650 hover:border-zinc-700 hover:text-zinc-400'
                            }`}
                          >
                            {status === 'active' ? 'Aktif' :
                             status === 'maintenance' ? 'Maint' :
                             status === 'development' ? 'Dev' : 'Hide'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Maintenance Custom Message */}
                    {(parentMenu.status === 'maintenance' || parentMenu.status === 'development') && (
                      <div className="space-y-1.5 mt-2">
                        <label className="text-[10px] font-bold text-zinc-455 uppercase tracking-wider block">Pesan Kustom</label>
                        <input
                          type="text"
                          value={parentMenu.message || ""}
                          onChange={(e) => handleMessageChange(parentMenu.menu_key, e.target.value)}
                          placeholder={`Pesan saat menu diakses...`}
                          className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-700 focus:outline-none rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-600 transition-colors"
                        />
                      </div>
                    )}
                  </div>

                  {/* Render child submenus if any */}
                  {submenus.map((sub) => (
                    <div key={sub.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl hover:border-zinc-750 transition-all flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-bold text-white text-base">{sub.name}</h3>
                            <p className="text-zinc-500 text-xs mt-1 font-mono">Key: {sub.menu_key}</p>
                          </div>
                        </div>

                        {/* Status selectors */}
                        <div className="grid grid-cols-4 gap-2 mb-4">
                          {['active', 'maintenance', 'development', 'hidden'].map((status) => (
                            <button
                              key={status}
                              onClick={() => handleStatusChange(sub.menu_key, status)}
                              className={`py-2 text-[10px] font-black uppercase tracking-wider rounded-lg border text-center transition-all ${
                                sub.status === status
                                  ? status === 'active' ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-400' :
                                    status === 'maintenance' ? 'bg-amber-500/10 border-amber-500/35 text-amber-400' :
                                    status === 'development' ? 'bg-blue-500/10 border-blue-500/35 text-blue-400' :
                                    'bg-zinc-800 border-zinc-700 text-zinc-300'
                                  : 'bg-transparent border-zinc-800 text-zinc-650 hover:border-zinc-700 hover:text-zinc-400'
                              }`}
                            >
                              {status === 'active' ? 'Aktif' :
                               status === 'maintenance' ? 'Maint' :
                               status === 'development' ? 'Dev' : 'Hide'}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Maintenance Custom Message */}
                      {(sub.status === 'maintenance' || sub.status === 'development') && (
                        <div className="space-y-1.5 mt-2">
                          <label className="text-[10px] font-bold text-zinc-455 uppercase tracking-wider block">Pesan Kustom</label>
                          <input
                            type="text"
                            value={sub.message || ""}
                            onChange={(e) => handleMessageChange(sub.menu_key, e.target.value)}
                            placeholder={`Pesan saat menu diakses...`}
                            className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-700 focus:outline-none rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-600 transition-colors"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

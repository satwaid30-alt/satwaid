"use client";

import { useState, useEffect } from "react";
import { 
    Save, 
    Plus, 
    Trash2, 
    Image as ImageIcon, 
    X,
    LayoutGrid,
    Info,
    AlertCircle,
    Dna
} from "lucide-react";

export default function MorphGroupForm({ initialData, onSubmit, isLoading }) {
    const [formData, setFormData] = useState({
        species_id: "",
        group_name: "",
        items: []
    });

    const [speciesList, setSpeciesList] = useState([]);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        const fetchSpecies = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/species`);
                const data = await response.json();
                if (response.ok) {
                    setSpeciesList(data.data);
                }
            } catch (err) {
                console.error("Failed to fetch species:", err);
            }
        };
        fetchSpecies();
    }, []);

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...formData,
                ...initialData,
                items: initialData.items || []
            });
        }
    }, [initialData]);


    const handleFileUpload = async (e, itemIndex) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        const formDataUpload = new FormData();
        formDataUpload.append("image", file);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload`, {
                method: "POST",
                body: formDataUpload,
            });
            const data = await response.json();
            if (response.ok) {
                updateMorphItem(itemIndex, "image", `${process.env.NEXT_PUBLIC_API_URL}${data.url}`);
            } else {
                alert("Upload gagal: " + data.message);
            }
        } catch (err) {
            console.error("Upload error:", err);
            alert("Terjadi kesalahan saat upload");
        } finally {
            setIsUploading(false);
        }
    };

    const addMorphItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { 
                name: "", 
                image: "", 
                geneticInfo: "", 
                details: {} 
            }]

        }));
    };

    const updateMorphItem = (itemIndex, field, value) => {
        const newItems = [...formData.items];
        newItems[itemIndex][field] = value;
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const updateMorphDetail = (itemIndex, oldKey, newKey, value, action = 'update') => {
        const newItems = [...formData.items];
        const details = { ...newItems[itemIndex].details };
        
        if (action === 'delete') {
            delete details[oldKey];
        } else if (action === 'add') {
            details["Detail Baru"] = "";
        } else {
            // Update key or value
            if (oldKey !== newKey) {
                delete details[oldKey];
            }
            details[newKey] = value;
        }
        
        newItems[itemIndex].details = details;
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const removeMorphItem = (itemIndex) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== itemIndex)
        }));
    };


    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.species_id) {
            alert("Pilih spesies reptile terlebih dahulu!");
            return;
        }
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-12 pb-32">
            {/* Step 1: Species Selection */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 md:p-12 shadow-xl">
                <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center">
                        <Info size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white">Langkah 1: Pilih Spesies</h2>
                        <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest mt-1">Tentukan spesifik reptile untuk grup ini</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-4">Spesies Reptile</label>
                        <select 
                            value={formData.species_id} 
                            onChange={(e) => setFormData({...formData, species_id: e.target.value})}
                            className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-emerald-500 transition-all font-bold appearance-none"
                            required
                        >
                            <option value="">Pilih Spesies...</option>
                            {speciesList.map(s => <option key={s.id} value={s.id}>{s.name} ({s.scientificName})</option>)}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-4">Nama Grup Morfologi</label>
                        <input 
                            type="text" 
                            value={formData.group_name} 
                            onChange={(e) => setFormData({...formData, group_name: e.target.value})}
                            className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-emerald-500 transition-all font-bold" 
                            placeholder="Contoh: Visual Morphs (Pattern & Scale)" 
                            required 
                        />
                    </div>
                </div>
            </div>

            {/* Step 2: Morph Items */}
            {formData.species_id && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 md:p-12 animate-fade-in">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-purple-500/10 text-purple-500 rounded-2xl flex items-center justify-center">
                                <Dna size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white">Langkah 2: Daftar Morf ({speciesList.find(s => s.id === formData.species_id)?.name})</h2>
                                <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest mt-1">Tambahkan variasi morfologi dalam grup ini</p>
                            </div>
                        </div>

                        <button 
                            type="button" 
                            onClick={addMorphItem} 
                            className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-6 py-3 rounded-2xl flex items-center gap-3 font-black transition-all shadow-lg"
                        >
                            <Plus size={20} />
                            Tambah Morf
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-8">
                        {formData.items.map((item, idx) => (
                            <div key={idx} className="bg-zinc-800/30 border border-zinc-700/30 rounded-[2rem] overflow-hidden group/morph">
                                {/* Morph Item Header */}
                                <div className="bg-zinc-800/50 px-8 py-4 border-b border-zinc-700/50 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-emerald-500 text-zinc-950 rounded-lg flex items-center justify-center font-black text-xs">
                                            {idx + 1}
                                        </div>
                                        <span className="text-xs font-bold text-white uppercase tracking-widest">Morf #{idx + 1}</span>
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={() => removeMorphItem(idx)}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all text-[10px] font-bold uppercase tracking-widest"
                                    >
                                        <Trash2 size={14} />
                                        Hapus Morf
                                    </button>
                                </div>
                                
                                <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {/* Image Upload Area */}
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-2">Gambar Morf</label>
                                        <div className="aspect-square bg-zinc-900 rounded-3xl border border-zinc-700 relative overflow-hidden group/img">
                                            {item.image ? (
                                                <img src={item.image} alt="Morph" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center text-zinc-700 gap-2">
                                                    <ImageIcon size={32} />
                                                    <span className="text-[10px] font-bold">No Image</span>
                                                </div>
                                            )}
                                            <input 
                                                type="file" 
                                                accept="image/*"
                                                onChange={(e) => handleFileUpload(e, idx)}
                                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                            />
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                                                Ganti Gambar
                                            </div>
                                        </div>
                                    </div>

                                    <div className="lg:col-span-2 space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-2">Nama Morf</label>
                                                <input 
                                                    type="text" 
                                                    value={item.name} 
                                                    onChange={(e) => updateMorphItem(idx, "name", e.target.value)}
                                                    className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-emerald-500" 
                                                    placeholder="Contoh: Normal / Wildtype"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between ml-2">
                                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Informasi Genetik</label>
                                                    <label className="flex items-center gap-2 cursor-pointer group/check">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={item.showGeneticInfo !== false} 
                                                            onChange={(e) => updateMorphItem(idx, "showGeneticInfo", e.target.checked)}
                                                            className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-emerald-500"
                                                        />
                                                        <span className="text-[10px] font-bold text-zinc-500 group-hover/check:text-emerald-500 transition-colors uppercase">Tampilkan</span>
                                                    </label>
                                                </div>
                                                <input 
                                                    type="text" 
                                                    value={item.geneticInfo} 
                                                    onChange={(e) => updateMorphItem(idx, "geneticInfo", e.target.value)}
                                                    className={`w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-emerald-500 transition-opacity ${item.showGeneticInfo === false ? 'opacity-40' : 'opacity-100'}`}
                                                    placeholder="Contoh: Wildtype"
                                                />
                                            </div>

                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between ml-2">
                                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Tampilan Fisik (Detail)</label>
                                                <button 
                                                    type="button" 
                                                    onClick={() => updateMorphDetail(idx, null, null, null, 'add')}
                                                    className="text-[10px] font-black text-emerald-500 hover:text-emerald-400 uppercase tracking-widest flex items-center gap-1"
                                                >
                                                    <Plus size={12} /> Tambah Karakteristik
                                                </button>
                                            </div>
                                            <div className="space-y-3">
                                                {Object.entries(item.details).map(([key, value], dIdx) => (
                                                    <div key={dIdx} className="flex gap-4 group/detail">
                                                        <input 
                                                            type="text" 
                                                            value={key} 
                                                            onChange={(e) => updateMorphDetail(idx, key, e.target.value, value)}
                                                            className="w-1/3 bg-zinc-900 border border-zinc-700/50 rounded-2xl py-3 px-5 text-emerald-500 font-black text-xs focus:outline-none focus:border-emerald-500 shadow-inner" 
                                                            placeholder="Bagian (Kepala)"
                                                        />
                                                        <textarea 
                                                            value={value} 
                                                            onChange={(e) => updateMorphDetail(idx, key, key, e.target.value)}
                                                            rows={2}
                                                            className="flex-1 bg-zinc-900/50 border border-zinc-700/50 rounded-2xl py-3 px-5 text-white focus:outline-none focus:border-emerald-500 text-sm font-medium resize-none leading-relaxed" 
                                                            placeholder="Deskripsi..."
                                                        />
                                                        <button 
                                                            type="button" 
                                                            onClick={() => updateMorphDetail(idx, key, null, null, 'delete')}
                                                            className="w-12 h-12 flex items-center justify-center text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all self-start mt-1"
                                                            title="Hapus Baris"
                                                        >
                                                            <X size={18} />
                                                        </button>
                                                    </div>

                                                ))}
                                                {Object.keys(item.details).length === 0 && (
                                                    <p className="text-[10px] text-zinc-600 italic ml-2">Belum ada karakteristik fisik yang ditambahkan.</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-2">URL Gambar (Opsional)</label>
                                            <input 
                                                type="text" 
                                                value={item.image} 
                                                onChange={(e) => updateMorphItem(idx, "image", e.target.value)}
                                                className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl py-2 px-4 text-zinc-400 focus:outline-none focus:border-emerald-500 font-mono text-[10px]" 
                                                placeholder="https://..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem] shadow-xl flex items-center justify-between">
                <div className="flex items-center gap-4 px-4 text-zinc-400">
                    <AlertCircle size={20} />
                    <span className="text-sm font-bold">Simpan untuk menerapkan perubahan</span>
                </div>
                <div className="flex items-center gap-4">
                    <button type="button" onClick={() => window.history.back()} className="px-6 py-2 font-bold text-zinc-500 hover:text-white transition-all">Batal</button>
                    <button type="submit" disabled={isLoading} className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/50 text-zinc-950 px-10 py-3 rounded-2xl font-black flex items-center gap-3 transition-all active:scale-95 shadow-xl shadow-emerald-500/20">
                        {isLoading ? <span className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></span> : <Save size={20} />}
                        Simpan Grup
                    </button>
                </div>
            </div>

        </form>
    );
}


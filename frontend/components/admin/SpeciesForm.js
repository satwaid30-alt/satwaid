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
    CheckCircle2,
    AlertCircle,
    Globe,
    Utensils,
    Stethoscope,
    Heart,
    BookOpen
} from "lucide-react";


export default function SpeciesForm({ initialData, onSubmit, isLoading }) {
    const [formData, setFormData] = useState({
        id: "",
        slug: "",
        name: "",
        scientificName: "",
        category: "Ular",
        lifespan: "",
        size: "",
        description: "",
        image: "",
        origin: [],
        diet: [],
        habitat: "",
        careTips: [],
        healthIssues: [],
        breedingGuide: [],
        morphGroups: [],
        references: []
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...formData,
                ...initialData,
                origin: initialData.origin || [],
                diet: initialData.diet || [],
                careTips: initialData.careTips || [],
                healthIssues: initialData.healthIssues || [],
                breedingGuide: initialData.breedingGuide || [],
                morphGroups: initialData.morphGroups || [],
                references: initialData.references || []
            });

        } else {
            // Generate random ID for new entry (format like s12345)
            const randomId = "s" + Math.random().toString(36).substring(2, 7);
            setFormData(prev => ({ ...prev, id: randomId }));
        }
    }, [initialData]);


    const [isUploading, setIsUploading] = useState(false);

    const handleFileUpload = async (e, field, groupIndex = null, itemIndex = null) => {
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
                const fullUrl = `${process.env.NEXT_PUBLIC_API_URL}${data.url}`;
                if (groupIndex !== null && itemIndex !== null) {
                    // Update morph item image
                    updateMorphItem(groupIndex, itemIndex, "image", fullUrl);
                } else {
                    // Update main image
                    setFormData(prev => ({ ...prev, [field]: fullUrl }));
                }
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

    const handleChange = (e) => {

        const { name, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: value };
            if (name === "name" && !initialData) {
                newData.slug = value.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
            }
            return newData;
        });
    };

    // Array of Strings Handlers (Origin, Diet, CareTips, HealthIssues, BreedingGuide)
    const addArrayItem = (field) => {
        setFormData(prev => ({
            ...prev,
            [field]: [...prev[field], ""]
        }));
    };

    const updateArrayItem = (field, index, value) => {
        const newArr = [...formData[field]];
        newArr[index] = value;
        setFormData(prev => ({ ...prev, [field]: newArr }));
    };

    const removeArrayItem = (field, index) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].filter((_, i) => i !== index)
        }));
    };

    // Morph Groups Handlers
    const addMorphGroup = () => {
        setFormData(prev => ({
            ...prev,
            morphGroups: [...prev.morphGroups, { category: "", items: [] }]
        }));
    };

    const updateMorphGroupTitle = (groupIndex, value) => {
        const newGroups = [...formData.morphGroups];
        newGroups[groupIndex].category = value;
        setFormData(prev => ({ ...prev, morphGroups: newGroups }));
    };

    const removeMorphGroup = (groupIndex) => {
        setFormData(prev => ({
            ...prev,
            morphGroups: prev.morphGroups.filter((_, i) => i !== groupIndex)
        }));
    };

    const addMorphItem = (groupIndex) => {
        const newGroups = [...formData.morphGroups];
        newGroups[groupIndex].items.push({ 
            name: "", 
            image: "", 
            geneticInfo: "", 
            details: { "Tampilan Fisik": "" } 
        });
        setFormData(prev => ({ ...prev, morphGroups: newGroups }));
    };

    const updateMorphItem = (groupIndex, itemIndex, field, value) => {
        const newGroups = [...formData.morphGroups];
        newGroups[groupIndex].items[itemIndex][field] = value;
        setFormData(prev => ({ ...prev, morphGroups: newGroups }));
    };

    const updateMorphDetail = (groupIndex, itemIndex, key, value) => {
        const newGroups = [...formData.morphGroups];
        newGroups[groupIndex].items[itemIndex].details[key] = value;
        setFormData(prev => ({ ...prev, morphGroups: newGroups }));
    };

    const removeMorphItem = (groupIndex, itemIndex) => {
        const newGroups = [...formData.morphGroups];
        newGroups[groupIndex].items = newGroups[groupIndex].items.filter((_, i) => i !== itemIndex);
        setFormData(prev => ({ ...prev, morphGroups: newGroups }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const renderArrayInput = (field, label, icon, placeholder) => {
        const Icon = icon;
        return (
            <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 md:p-12">
                <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-zinc-800 text-zinc-400 rounded-2xl flex items-center justify-center">
                            <Icon size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white">{label}</h2>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => addArrayItem(field)}
                        className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-2xl flex items-center gap-3 font-bold transition-all border border-zinc-700/50"
                    >
                        <Plus size={20} />
                        Tambah
                    </button>
                </div>
                <div className="space-y-4">
                    {formData[field].map((item, index) => (
                        <div key={index} className="flex gap-4">
                            <input
                                type="text"
                                value={item}
                                onChange={(e) => updateArrayItem(field, index, e.target.value)}
                                placeholder={placeholder}
                                className="flex-1 bg-zinc-800/50 border border-zinc-700/50 rounded-2xl py-4 px-6 text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-all font-medium"
                            />
                            <button
                                type="button"
                                onClick={() => removeArrayItem(field, index)}
                                className="w-14 h-14 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all flex-shrink-0"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-12 pb-32">
            {/* Basic Info Section */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 md:p-12 shadow-xl shadow-black/20">
                <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center">
                        <Info size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white">Informasi Dasar</h2>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-4">ID Unik (Auto)</label>
                        <input 
                            type="text" 
                            name="id" 
                            value={formData.id} 
                            readOnly
                            className="w-full bg-zinc-800/30 border border-zinc-700/30 rounded-2xl py-4 px-6 text-zinc-500 focus:outline-none transition-all font-mono cursor-not-allowed" 
                            placeholder="s3" 
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-4">Nama Spesies</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-2xl py-4 px-6 text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-all font-bold" placeholder="Leopard Gecko" required />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-4">Nama Ilmiah</label>
                        <input type="text" name="scientificName" value={formData.scientificName} onChange={handleChange} className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-2xl py-4 px-6 text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-all font-bold italic" placeholder="Eublepharis macularius" required />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-4">Slug (URL)</label>
                        <input type="text" name="slug" value={formData.slug} onChange={handleChange} className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-2xl py-4 px-6 text-emerald-500 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-all font-bold" placeholder="leopard-gecko" required />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-4">Kategori</label>
                        <input
                            type="text"
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-2xl py-4 px-6 text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-all font-bold"
                            placeholder="Contoh: Ular, Kadal, dll"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-4">Harapan Hidup</label>
                        <input type="text" name="lifespan" value={formData.lifespan} onChange={handleChange} className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-2xl py-4 px-6 text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-all font-bold" placeholder="10-20 Tahun" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-4">Ukuran</label>
                        <input type="text" name="size" value={formData.size} onChange={handleChange} className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-2xl py-4 px-6 text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-all font-bold" placeholder="20-25 cm" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-4">Habitat</label>
                        <input type="text" name="habitat" value={formData.habitat} onChange={handleChange} className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-2xl py-4 px-6 text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-all font-bold" placeholder="Daerah semi-gersang..." />
                    </div>
                </div>
                <div className="mt-8 space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-4">Deskripsi</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} rows={5} className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-3xl py-4 px-6 text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-all font-medium resize-none" placeholder="Deskripsi lengkap spesies..." />
                </div>
                <div className="mt-8 space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-4">Gambar Utama</label>
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="w-full md:w-48 h-48 bg-zinc-800 rounded-3xl overflow-hidden relative border border-zinc-700 flex-shrink-0 group">
                            {formData.image ? (
                                <>
                                    <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                                    <button 
                                        type="button" 
                                        onClick={() => setFormData(prev => ({ ...prev, image: "" }))}
                                        className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                    >
                                        <X size={16} />
                                    </button>
                                </>
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 gap-2">
                                    <ImageIcon size={32} />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">No Image</span>
                                </div>
                            )}
                            {isUploading && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                    <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}
                        </div>
                        <div className="flex-1 space-y-4">
                            <div className="relative group">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleFileUpload(e, "image")}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    disabled={isUploading}
                                />
                                <div className="bg-zinc-800 border-2 border-dashed border-zinc-700 group-hover:border-emerald-500/50 rounded-2xl py-8 px-6 text-center transition-all">
                                    <Plus size={24} className="mx-auto mb-2 text-zinc-500 group-hover:text-emerald-500" />
                                    <p className="text-sm font-bold text-zinc-400">
                                        {isUploading ? "Sedang Mengunggah..." : "Klik atau Taruh Gambar untuk Upload"}
                                    </p>
                                    <p className="text-[10px] text-zinc-600 mt-1 uppercase tracking-widest font-bold">PNG, JPG, WEBP (Maks 5MB)</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-4">Atau Gunakan URL Gambar</label>
                                <input 
                                    type="text" 
                                    name="image" 
                                    value={formData.image} 
                                    onChange={handleChange} 
                                    className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-2xl py-4 px-6 text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-all font-mono text-sm" 
                                    placeholder="https://example.com/image.png atau /uploads/..." 
                                />
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* List Sections */}
            {renderArrayInput("origin", "Asal / Distribusi", Globe, "Contoh: Afghanistan")}
            {renderArrayInput("diet", "Diet / Makanan", Utensils, "Contoh: Jangkrik")}
            {renderArrayInput("careTips", "Tips Perawatan", CheckCircle2, "Masukkan satu baris tips...")}
            {renderArrayInput("healthIssues", "Masalah Kesehatan", Stethoscope, "Contoh: Metabolic Bone Disease: ...")}
            {renderArrayInput("breedingGuide", "Panduan Breeding", Heart, "Langkah-langkah perkembangbiakan...")}
            {renderArrayInput("references", "Referensi / Sumber", BookOpen, "Contoh: Greer, A. E. (1989)...")}



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
                        Simpan Spesies
                    </button>
                </div>
            </div>

        </form>
    );
}


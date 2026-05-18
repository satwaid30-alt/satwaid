"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";


export default function Footer() {
    const pathname = usePathname();
    if (pathname && pathname.startsWith("/admin")) return null;

    return (
        <footer className="bg-zinc-950 text-white pt-16 md:pt-24 pb-12">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 md:gap-16 mb-20 md:mb-24">
                <div className="col-span-1 sm:col-span-2 space-y-6">
                    <Link href="/" className="inline-block">
                        <div className="relative w-56 h-14 md:w-72 md:h-20 transition-transform hover:scale-105">
                            <Image
                                src="/images/Logo-Bg-1-2.png"
                                alt="SatwaiD Logo"
                                fill
                                className="object-contain object-left"
                                priority
                            />
                        </div>
                    </Link>
                    <p className="text-zinc-400 text-sm md:text-base max-w-xs md:max-w-sm leading-relaxed text-justify">
                        SatwaiD adalah platform marketplace inovatif yang menghubungkan penjual satwa terverifikasi dengan para pecinta hewan di seluruh Indonesia. Kami berkomitmen untuk membangun ekosistem jual-beli yang bertanggung jawab, memastikan setiap satwa yang diperdagangkan bukan merupakan spesies dilindungi, serta memberikan keamanan transaksi digital yang terjamin melalui identitas yang jelas.
                    </p>
                    <div className="flex gap-3 pt-2">
                        {[
                            { name: "𝕏", link: "#" },
                            { name: "IG", link: "#" },
                            { name: "FB", link: "#" },
                            { name: "YT", link: "#" }
                        ].map((social, i) => (
                            <a
                                key={i}
                                href={social.link}
                                className="w-9 h-9 border border-white/5 bg-white/5 rounded-xl flex items-center justify-center text-zinc-400 hover:text-emerald-500 hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-all cursor-pointer text-[10px] font-black tracking-tighter"
                            >
                                {social.name}
                            </a>
                        ))}
                    </div>
                </div>

                <div className="space-y-6">
                    <h5 className="font-bold text-lg">Tautan Cepat</h5>
                    <ul className="space-y-3 md:space-y-4 text-zinc-400 font-medium text-sm md:text-base">
                        <li><Link href="/" className="hover:text-emerald-500 transition-colors">Beranda</Link></li>
                        <li><Link href="/komunitas" className="hover:text-emerald-500 transition-colors">Komunitas</Link></li>
                        <li><a href="/toko" className="hover:text-emerald-500 transition-colors">Etalase Satwa</a></li>
                    </ul>
                </div>

                <div className="space-y-6">
                    <h5 className="font-bold text-lg">Bantuan</h5>
                    <ul className="space-y-3 md:space-y-4 text-zinc-400 font-medium text-sm md:text-base">
                        <li><a href="#" className="hover:text-emerald-500 transition-colors">Pusat Bantuan</a></li>
                        <li><a href="#" className="hover:text-emerald-500 transition-colors">Kebijakan Privasi</a></li>
                        <li><a href="#" className="hover:text-emerald-500 transition-colors">Syarat Penggunaan</a></li>
                        <li><a href="#" className="hover:text-emerald-500 transition-colors">Kontak</a></li>
                    </ul>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-zinc-500 font-medium text-sm">
                <p>© 2026 SatwaiD. Hak cipta dilindungi undang-undang.</p>
                <div className="flex gap-8">
                    <a href="#" className="hover:text-white transition-colors">Instagram</a>
                    <a href="#" className="hover:text-white transition-colors">Twitter</a>
                    <a href="#" className="hover:text-white transition-colors">Discord</a>
                </div>
            </div>
        </footer>
    );
}

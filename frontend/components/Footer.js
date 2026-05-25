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
            SatwaiD adalah platform marketplace inovatif yang menghubungkan
            penjual satwa terverifikasi dengan para pecinta hewan di seluruh
            Indonesia. Kami berkomitmen untuk membangun ekosistem jual-beli yang
            bertanggung jawab, memastikan setiap satwa yang diperdagangkan bukan
            merupakan spesies dilindungi, serta memberikan keamanan transaksi
            digital yang terjamin melalui identitas yang jelas.
          </p>
          <div className="flex gap-3 pt-2">
            {[{ name: "FB", link: "https://www.facebook.com/SatwaiD/" }].map(
              (social, i) => (
                <a
                  key={i}
                  href={social.link}
                  className="w-9 h-9 border border-white/5 bg-white/5 rounded-xl flex items-center justify-center text-zinc-400 hover:text-emerald-500 hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-all cursor-pointer text-[10px] font-black tracking-tighter"
                >
                  {social.name}
                </a>
              ),
            )}
          </div>
        </div>

        <div className="space-y-6">
          <h5 className="font-bold text-lg">Tautan Cepat</h5>
          <ul className="space-y-3 md:space-y-4 text-zinc-400 font-medium text-sm md:text-base">
            <li>
              <Link
                href="/"
                className="hover:text-emerald-500 transition-colors"
              >
                Beranda
              </Link>
            </li>
            <li>
              <Link
                href="/komunitas"
                className="hover:text-emerald-500 transition-colors"
              >
                Komunitas
              </Link>
            </li>
            <li>
              <a
                href="/toko"
                className="hover:text-emerald-500 transition-colors"
              >
                Etalase Satwa
              </a>
            </li>
          </ul>
        </div>

        <div className="space-y-6">
          <h5 className="font-bold text-lg">Bantuan</h5>
          <ul className="space-y-3 md:space-y-4 text-zinc-400 font-medium text-sm md:text-base">
            <li>
              <Link
                href="/pusat-informasi?tab=bantuan"
                className="hover:text-emerald-500 transition-colors"
              >
                Pusat Bantuan
              </Link>
            </li>
            <li>
              <Link
                href="/pusat-informasi?tab=privasi"
                className="hover:text-emerald-500 transition-colors"
              >
                Kebijakan Privasi
              </Link>
            </li>
            <li>
              <Link
                href="/pusat-informasi?tab=syarat"
                className="hover:text-emerald-500 transition-colors"
              >
                Syarat Penggunaan
              </Link>
            </li>
            <li className="pt-2">
              <a
                href="https://wa.me/6282240330951?text=Halo%20Admin%20SatwaiD,%20saya%20membutuhkan%20bantuan%20terkait..."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500 hover:text-zinc-950 hover:border-emerald-400 transition-all font-black text-xs uppercase tracking-wider active:scale-95 shadow-lg shadow-emerald-500/5 cursor-pointer mt-1"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.458L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.967C16.68 1.973 14.198 1.94 11.99 1.94c-5.439 0-9.865 4.372-9.87 9.802 0 1.76.476 3.479 1.382 5.02L2.451 21.6l4.196-1.446zm11.393-5.263c-.293-.146-1.73-.853-1.998-.951-.267-.099-.462-.146-.657.146-.195.293-.756.951-.926 1.146-.17.195-.341.219-.634.073-.293-.146-1.238-.456-2.359-1.454-.872-.777-1.46-1.738-1.631-2.03-.17-.293-.018-.452.129-.597.132-.13.293-.341.439-.512.146-.17.195-.293.293-.488.097-.195.048-.366-.024-.512-.072-.146-.657-1.583-.9-2.17-.236-.57-.478-.492-.657-.502-.17-.008-.366-.01-.561-.01-.195 0-.512.073-.78.366-.268.293-1.024 1.001-1.024 2.441 0 1.439 1.048 2.83 1.195 3.025.147.195 2.062 3.149 4.996 4.417.697.302 1.24.482 1.66.617.7.223 1.338.192 1.843.117.563-.083 1.73-.707 1.976-1.39.244-.683.244-1.268.17-1.39-.074-.121-.268-.194-.561-.34z" />
                </svg>
                Hubungi WA CS
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-zinc-500 font-medium text-sm">
        <p>© 2026 SatwaiD. Hak cipta dilindungi undang-undang.</p>
        {/* <div className="flex gap-8">
          <a href="#" className="hover:text-white transition-colors">
            Instagram
          </a>
          <a href="#" className="hover:text-white transition-colors">
            Twitter
          </a>
          <a href="#" className="hover:text-white transition-colors">
            Discord
          </a>
        </div> */}
      </div>
    </footer>
  );
}

"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";

export default function ConditionalFooter() {
    const pathname = usePathname();

    // Sembunyikan footer di halaman login, user CMS, dan admin CMS
    const isCmsPage = 
        pathname.startsWith("/user") || 
        pathname.startsWith("/akun") || 
        pathname.startsWith("/toko-saya") ||
        pathname.startsWith("/admin") ||
        pathname.startsWith("/panel-admin");

    if (pathname === "/login" || isCmsPage) {
        return null;
    }

    return <Footer />;
}

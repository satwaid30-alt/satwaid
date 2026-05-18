"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";

export default function ConditionalFooter() {
    const pathname = usePathname();

    // Sembunyikan footer di halaman login dan pengaturan (dashboard user)
    if (pathname === "/login" || pathname.startsWith("/user")) {
        return null;
    }

    return <Footer />;
}

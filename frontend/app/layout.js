import { Inter } from "next/font/google";
import "./globals.css";
import ConditionalFooter from "../components/ConditionalFooter";
import FloatingChatButton from "../components/FloatingChatButton";
import ScrollToTop from "../components/ScrollToTop";

const inter = Inter({
    subsets: ["latin"],
});

export const metadata = {
    title: "Reptile Haven | Blog Reptil Terlengkap",
    description: "Temukan dunia reptil yang menakjubkan, mulai dari ular, kadal, hingga kura-kura.",
};

export default function RootLayout({ children }) {
    return (
        <html lang="id" className="scroll-smooth">
            <head>
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
            </head>
            <body className={`${inter.className} antialiased bg-zinc-50 text-zinc-900`}>
                {children}
                <ConditionalFooter />
                {/* <FloatingChatButton /> */}
                <ScrollToTop />
            </body>
        </html>
    );
}

import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata = {
  title: "SatwaiD Admin Panel",
  description: "Panel Kontrol Admin SatwaiD",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
      </head>
      <body className={`${inter.className} antialiased bg-zinc-950 text-white`}>
        {children}
      </body>
    </html>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import Navbar from "../../../components/Navbar";
import { BLOG_POSTS } from "../../../data/blog-posts";

export default function BlogDetail() {
    const { slug } = useParams();
    const post = BLOG_POSTS.find((p) => p.slug === slug);

    if (!post) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-bold text-zinc-900">Artikel Tidak Ditemukan</h1>
                    <Link href="/" className="text-emerald-600 font-bold hover:underline">
                        Kembali ke Beranda
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white text-zinc-900 selection:bg-emerald-200">
            <Navbar theme="light" />

            {/* Main Content Container */}
            <main className="max-w-4xl mx-auto px-6 pt-32 pb-24">
                {/* Article Header */}
                <header className="space-y-6 mb-12">
                    <div className="flex items-center gap-3">
                        <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider">
                            {post.category}
                        </span>
                        <span className="text-zinc-300">/</span>
                        <time className="text-zinc-400 text-sm font-medium">{post.date}</time>
                    </div>

                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-zinc-900 leading-tight">
                        {post.title}
                    </h1>

                    <div className="flex items-center justify-between py-6 border-y border-zinc-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-xl">
                                {post.author.avatar}
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-zinc-900">{post.author.name}</span>
                                <span className="text-xs text-zinc-400 font-medium">Contributor</span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            {/* Share Icons Placeholder */}
                            <div className="w-8 h-8 rounded-full border border-zinc-100 flex items-center justify-center text-zinc-400 hover:text-emerald-600 hover:border-emerald-600 transition-colors cursor-pointer text-xs">𝕏</div>
                            <div className="w-8 h-8 rounded-full border border-zinc-100 flex items-center justify-center text-zinc-400 hover:text-emerald-600 hover:border-emerald-600 transition-colors cursor-pointer text-xs">FB</div>
                        </div>
                    </div>
                </header>

                {/* Featured Image */}
                <div className="relative aspect-video w-full rounded-3xl overflow-hidden mb-12">
                    <Image
                        src={post.image}
                        alt={post.title}
                        fill
                        className="object-cover"
                        priority
                        quality={100}
                    />
                </div>

                {/* Article Body */}
                <article className="prose prose-emerald prose-lg md:prose-xl max-w-none">
                    <div
                        dangerouslySetInnerHTML={{ __html: post.content }}
                        className="prose-h3:text-2xl prose-h3:font-black prose-h3:text-zinc-900 prose-p:text-zinc-600 prose-p:leading-relaxed prose-h3:mt-12 prose-h3:mb-6"
                    />
                </article>

                {/* Back Button */}
                <footer className="mt-20 pt-12 border-t border-zinc-100">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
                        <Link href="/" className="inline-flex items-center gap-3 bg-zinc-950 text-white hover:bg-zinc-800 px-8 py-4 rounded-full font-bold transition-all hover:-translate-x-1 w-full sm:w-auto text-center justify-center">
                            ← Kembali ke Beranda
                        </Link>

                        <div className="flex items-center gap-4 text-zinc-400 text-sm font-medium">
                            Tandai artikel ini: <span className="text-zinc-900 cursor-pointer hover:text-emerald-600 transition-colors">🔖 Simpan</span>
                        </div>
                    </div>
                </footer>
            </main>

        </div>
    );
}

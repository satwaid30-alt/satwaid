"use client";

import { useState } from "react";

export default function Accordion({ title, children, icon, isOpenDefault = false }) {
    const [isOpen, setIsOpen] = useState(isOpenDefault);

    return (
        <div className="border-b border-zinc-100 last:border-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full py-6 flex items-center justify-between text-left group focus:outline-none"
            >
                <div className="flex items-center gap-4">
                    <span className="text-xl group-hover:scale-110 transition-transform duration-300">
                        {icon}
                    </span>
                    <h3 className="text-xl font-black text-zinc-900 group-hover:text-emerald-600 transition-colors">
                        {title}
                    </h3>
                </div>
                <div className={`w-8 h-8 rounded-full border border-zinc-200 flex items-center justify-center transition-all duration-300 ${isOpen ? 'bg-emerald-600 border-emerald-600 text-white rotate-180' : 'text-zinc-400 group-hover:border-emerald-500 group-hover:text-emerald-500'}`}>
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </div>
            </button>
            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[2000px] opacity-100 pb-8' : 'max-h-0 opacity-0'}`}>
                <div className="text-zinc-600 leading-relaxed font-medium">
                    {children}
                </div>
            </div>
        </div>
    );
}

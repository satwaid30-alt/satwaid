import React from 'react';
import { CheckCircle2, AlertCircle, Trash2, Info, X, Save, Edit3, ShoppingBag } from 'lucide-react';

/**
 * ActionModal Component
 * A premium, uniform modal for all user actions (Submit, Delete, Edit, Success)
 */
const ActionModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    type = 'success', // success, danger, warning, info, save, edit, checkout
    title, 
    message, 
    confirmText = 'Ya, Lanjutkan', 
    cancelText = 'Batal',
    isLoading = false,
    children
}) => {
    if (!isOpen) return null;

    // Configuration for different modal types
    const configs = {
        success: {
            icon: <CheckCircle2 size={40} />,
            color: 'emerald',
            bg: 'bg-emerald-500/10',
            text: 'text-emerald-500',
            border: 'border-emerald-500/20',
            button: 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-emerald-500/20'
        },
        danger: {
            icon: <Trash2 size={40} />,
            color: 'red',
            bg: 'bg-red-500/10',
            text: 'text-red-500',
            border: 'border-red-500/20',
            button: 'bg-red-500 hover:bg-red-400 text-white shadow-red-500/20'
        },
        warning: {
            icon: <AlertCircle size={40} />,
            color: 'amber',
            bg: 'bg-amber-500/10',
            text: 'text-amber-500',
            border: 'border-amber-500/20',
            button: 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-amber-500/20'
        },
        info: {
            icon: <Info size={40} />,
            color: 'blue',
            bg: 'bg-blue-500/10',
            text: 'text-blue-500',
            border: 'border-blue-500/20',
            button: 'bg-blue-500 hover:bg-blue-400 text-white shadow-blue-500/20'
        },
        save: {
            icon: <Save size={40} />,
            color: 'emerald',
            bg: 'bg-emerald-500/10',
            text: 'text-emerald-500',
            border: 'border-emerald-500/20',
            button: 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-emerald-500/20'
        },
        edit: {
            icon: <Edit3 size={40} />,
            color: 'blue',
            bg: 'bg-blue-500/10',
            text: 'text-blue-500',
            border: 'border-blue-500/20',
            button: 'bg-blue-500 hover:bg-blue-400 text-white shadow-blue-500/20'
        },
        checkout: {
            icon: <ShoppingBag size={40} />,
            color: 'emerald',
            bg: 'bg-emerald-500/10',
            text: 'text-emerald-500',
            border: 'border-emerald-500/20',
            button: 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-emerald-500/20'
        }
    };

    const config = configs[type] || configs.success;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md animate-in fade-in duration-500"
                onClick={() => !isLoading && onClose()}
            ></div>

            {/* Modal Container */}
            <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-[2.5rem] relative z-10 overflow-hidden shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
                
                {/* Close Button */}
                {!isLoading && (
                    <button 
                        onClick={onClose}
                        className="absolute top-6 right-6 text-zinc-500 hover:text-white hover:bg-zinc-800 p-2 rounded-full transition-all"
                    >
                        <X size={18} />
                    </button>
                )}

                <div className="p-10 text-center space-y-8">
                    {/* Icon Section */}
                    <div className={`w-20 h-20 ${config.bg} ${config.text} rounded-3xl flex items-center justify-center mx-auto shadow-inner border ${config.border}`}>
                        {config.icon}
                    </div>

                    {/* Text Section */}
                    <div className="space-y-3">
                        <h3 className="text-2xl font-black text-white uppercase tracking-tight">{title}</h3>
                        <p className="text-zinc-500 text-sm leading-relaxed font-medium px-4">
                            {message}
                        </p>
                    </div>

                    {/* Custom Content (Children) */}
                    {children && (
                        <div className="w-full">
                            {children}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        {onConfirm ? (
                            <>
                                <button
                                    onClick={onClose}
                                    disabled={isLoading}
                                    className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-black rounded-2xl transition-all disabled:opacity-50 active:scale-95"
                                >
                                    {cancelText}
                                </button>
                                <button
                                    onClick={onConfirm}
                                    disabled={isLoading}
                                    className={`flex-1 py-4 ${config.button} font-black rounded-2xl transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95`}
                                >
                                    {isLoading ? (
                                        <div className="w-5 h-5 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin"></div>
                                    ) : (
                                        confirmText
                                    )}
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={onClose}
                                className={`w-full py-4 ${config.button} font-black rounded-2xl transition-all shadow-lg active:scale-[0.98]`}
                            >
                                Oke, Mengerti
                            </button>
                        )}
                    </div>
                </div>

                {/* Decorative background element */}
                <div className={`absolute -bottom-24 -right-24 w-48 h-48 ${config.bg} rounded-full blur-[80px] opacity-20`}></div>
                <div className={`absolute -top-24 -left-24 w-48 h-48 ${config.bg} rounded-full blur-[80px] opacity-20`}></div>
            </div>
        </div>
    );
};

export default ActionModal;

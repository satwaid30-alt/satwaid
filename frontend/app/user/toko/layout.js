"use client";

import UserSidebar from "../../../components/user/UserSidebar";
import UserNavbar from "../../../components/user/UserNavbar";

export default function UserTokoLayout({ children }) {
    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col md:flex-row">
            {/* Sidebar */}
            <UserSidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
                {/* Navbar */}
                <UserNavbar />

                {/* Main scrollable body */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                    {children}
                </main>
            </div>
        </div>
    );
}

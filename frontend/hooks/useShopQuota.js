"use client";

import { useState, useEffect } from "react";
import { getApiUrl, getSocketUrl } from "@/app/utils/api";
import { io } from "socket.io-client";

/**
 * Module-level cache (persists across navigation in a SPA session).
 * Key: shopId, Value: quota data object
 *
 * Strategy: stale-while-revalidate
 *   - If cache hit → return cached data immediately (no loading flash)
 *   - Always fetch fresh in background → update silently
 */
const quotaCache = new Map();

/**
 * useShopQuota — fetches and caches quota for a given shopId.
 * Returns { quota, loading } where:
 *   - loading is true ONLY on the very first fetch (no cached data yet)
 *   - subsequent navigations return cached data instantly with loading=false
 */
export function useShopQuota(shopId) {
    // Initialize from cache immediately — avoids loading state on re-navigation
    const [quota, setQuota] = useState(() => quotaCache.get(shopId) ?? null);
    const [loading, setLoading] = useState(() => !quotaCache.has(shopId));

    useEffect(() => {
        if (!shopId) return;

        // If cache hit: show immediately, no loading flash
        const cached = quotaCache.get(shopId);
        if (cached) {
            setQuota(cached);
            setLoading(false);
        } else {
            setLoading(true);
        }

        // Always fetch fresh data in background (stale-while-revalidate)
        const controller = new AbortController();

        const fetchQuota = (signal) => {
            fetch(`${getApiUrl()}/listings/quota/${shopId}`, { signal })
                .then(r => r.json())
                .then(r => {
                    if (r.data) {
                        quotaCache.set(shopId, r.data);
                        setQuota(r.data);
                    }
                })
                .catch(() => {}) // Ignore abort + network errors silently
                .finally(() => setLoading(false));
        };

        fetchQuota(controller.signal);

        // Establish Socket.IO connection for real-time updates
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
        let userId = null;
        if (userStr) {
            try {
                userId = JSON.parse(userStr).id;
            } catch (e) {}
        }

        const socket = io(getSocketUrl(), {
            auth: {
                token: token ? `Bearer ${token}` : null,
            },
        });

        if (userId) {
            socket.emit("join_user", userId);
        }

        // Listen for sync event or socket updates to trigger fresh fetch (real-time)
        const handleSync = () => {
            fetchQuota();
        };

        socket.on("new_listing_created", handleSync);
        socket.on("listing_deleted", handleSync);
        socket.on("shop_quota_updated", handleSync);

        window.addEventListener("sync_quota", handleSync);

        return () => {
            controller.abort(); // Cleanup on unmount
            socket.disconnect();
            window.removeEventListener("sync_quota", handleSync);
        };
    }, [shopId]);

    return { quota, loading };
}


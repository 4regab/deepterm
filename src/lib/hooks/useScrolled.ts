"use client";

import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
    window.addEventListener("scroll", callback, { passive: true });
    return () => window.removeEventListener("scroll", callback);
}

function getServerSnapshot() {
    return false;
}

export function useScrolled(threshold = 20) {
    return useSyncExternalStore(
        subscribe,
        () => window.scrollY > threshold,
        getServerSnapshot
    );
}

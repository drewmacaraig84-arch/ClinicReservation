// High-Speed Stale-While-Revalidate (SWR) Client Cache + RBAC Session Manager
const memoryCache = new Map();
const CACHE_PREFIX = 'carepoint_swr_v3:';
const AUTH_SESSION_KEY = 'carepoint_auth_session_v1';

export function getAuthSession() {
    try {
        const raw = localStorage.getItem(AUTH_SESSION_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch (e) {
        return null;
    }
}

export function setAuthSession(sessionObj) {
    try {
        if (!sessionObj) {
            localStorage.removeItem(AUTH_SESSION_KEY);
        } else {
            localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(sessionObj));
        }
    } catch (e) {
        // ignore
    }
    invalidateClientCache();
}

export function clearAuthSession() {
    setAuthSession(null);
}

export function getActiveRole() {
    const session = getAuthSession();
    return session?.role || 'patient';
}

export function getRbacHeaders(extraHeaders = {}) {
    return {
        Accept: 'application/json',
        'X-Active-Role': getActiveRole(),
        ...extraHeaders,
    };
}

export function getCachedData(url) {
    const roleScopedUrl = `${getActiveRole()}:${url}`;
    if (memoryCache.has(roleScopedUrl)) {
        return memoryCache.get(roleScopedUrl).data;
    }
    try {
        const raw = sessionStorage.getItem(CACHE_PREFIX + roleScopedUrl);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.data) {
                memoryCache.set(roleScopedUrl, parsed);
                return parsed.data;
            }
        }
    } catch (e) {
        // Ignore storage quota errors
    }
    return null;
}

export function setCachedData(url, data) {
    const roleScopedUrl = `${getActiveRole()}:${url}`;
    const entry = { data, timestamp: Date.now() };
    memoryCache.set(roleScopedUrl, entry);
    try {
        sessionStorage.setItem(CACHE_PREFIX + roleScopedUrl, JSON.stringify(entry));
    } catch (e) {
        // Ignore storage errors
    }
}

export function invalidateClientCache() {
    memoryCache.clear();
    try {
        const keysToRemove = [];
        for (let i = 0; i < sessionStorage.length; i++) {
            const k = sessionStorage.key(i);
            if (k && k.startsWith(CACHE_PREFIX)) {
                keysToRemove.push(k);
            }
        }
        keysToRemove.forEach((k) => sessionStorage.removeItem(k));
    } catch (e) {
        // Ignore
    }
}

/**
 * Fetches JSON with instant cache hydration (Stale-While-Revalidate) and RBAC role header.
 */
export async function cachedFetchJson(url, onData, forceNetwork = false) {
    if (!forceNetwork) {
        const cached = getCachedData(url);
        if (cached) {
            onData(cached, true);
        }
    }

    const res = await fetch(url, {
        headers: getRbacHeaders(),
    });
    const freshData = await res.json();
    if (res.ok) {
        setCachedData(url, freshData);
        onData(freshData, false);
    }
    return { ok: res.ok, status: res.status, data: freshData };
}

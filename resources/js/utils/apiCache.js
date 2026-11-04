// High-Speed Stale-While-Revalidate (SWR) Client Cache + RBAC Session Manager
const memoryCache = new Map();
const CACHE_PREFIX = 'carepoint_swr_v5:';
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
    const session = getAuthSession();
    const headers = {
        Accept: 'application/json',
        'X-Active-Role': getActiveRole(),
        ...extraHeaders,
    };
    if (session?.user?.id) {
        headers['X-Active-User-Id'] = String(session.user.id);
    }
    return headers;
}

function getScopedCacheKey(url) {
    const session = getAuthSession();
    const userScope = session?.user?.id ? `u${session.user.id}:` : '';
    return `${getActiveRole()}:${userScope}${url}`;
}

export function getCachedData(url) {
    const key = getScopedCacheKey(url);
    if (memoryCache.has(key)) {
        return memoryCache.get(key).data;
    }
    try {
        const raw = sessionStorage.getItem(CACHE_PREFIX + key);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.data) {
                memoryCache.set(key, parsed);
                return parsed.data;
            }
        }
    } catch (e) {
        // Ignore storage quota errors
    }
    return null;
}

export function setCachedData(url, data) {
    const key = getScopedCacheKey(url);
    const entry = { data, timestamp: Date.now() };
    memoryCache.set(key, entry);
    try {
        sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
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
 * Fetches JSON with instant cache hydration (Stale-While-Revalidate), RBAC role header, and non-JSON crash guards.
 */
export async function cachedFetchJson(url, onData, forceNetwork = false) {
    let servedFromCache = false;
    if (!forceNetwork) {
        const cached = getCachedData(url);
        if (cached) {
            servedFromCache = true;
            onData(cached, true);
        }
    }

    let res;
    try {
        res = await fetch(url, {
            headers: getRbacHeaders(),
        });
    } catch (netErr) {
        if (!servedFromCache) {
            throw new Error(netErr?.message || 'Network connection failed');
        }
        return { ok: false, status: 0, data: null };
    }

    let freshData = null;
    try {
        freshData = await res.json();
    } catch (jsonErr) {
        // Guard against non-JSON responses (e.g. 500 HTML crash page from hosting/proxy)
        if (!res.ok && !servedFromCache) {
            throw new Error(`Server returned HTTP ${res.status}`);
        }
    }

    if (res.ok && freshData !== null) {
        setCachedData(url, freshData);
        onData(freshData, false);
    } else {
        if (res.status === 401) {
            clearAuthSession();
        }
        if (!servedFromCache) {
            throw new Error(freshData?.message || `HTTP ${res.status}`);
        }
    }
    return { ok: res.ok, status: res.status, data: freshData };
}

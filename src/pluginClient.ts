import fetch from 'node-fetch';

const PLUGLIST_URL = 'https://download.moodle.org/api/1.3/pluglist.php';

// Cache configuration
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour in milliseconds

interface CacheEntry {
    data: string;
    timestamp: number;
}

interface MoodleVersion {
    version: number;
    release: string;
}

interface PluginVersion {
    id: number;
    version: number;
    release: string;
    maturity: number;
    downloadurl: string;
    downloadmd5: string;
    vcssystem: string | null;
    vcssystemother: string | null;
    vcsrepositoryurl: string | null;
    vcsbranch: string | null;
    vcstag: string | null;
    timecreated: number;
    supportedmoodles: MoodleVersion[];
}

interface Plugin {
    id: number;
    name: string;
    component: string;
    source: string;
    doc: string;
    bugs: string;
    discussion: string;
    timelastreleased: number;
    versions: PluginVersion[];
}

interface PluginListResponse {
    plugins: Plugin[];
}

let pluglistCache: CacheEntry | null = null;

export async function fetchPluglistRaw(): Promise<string> {
    // This returns raw text from the pluglist API. The API historically returns XML.
    // Parsing into structured types will be implemented later.
    const res = await fetch(PLUGLIST_URL);
    if (!res.ok) throw new Error(`Failed to fetch pluglist: ${res.status}`);
    return await res.text();
}

export async function getCachedPluglist(): Promise<string> {
    const now = Date.now();

    // Check if we have valid cached data
    if (pluglistCache && (now - pluglistCache.timestamp) < CACHE_TTL_MS) {
        console.error('[Cache] Using cached pluglist data');
        return pluglistCache.data;
    }

    // Cache is stale or doesn't exist, fetch fresh data
    console.error('[Cache] Fetching fresh pluglist data');
    try {
        const freshData = await fetchPluglistRaw();
        pluglistCache = {
            data: freshData,
            timestamp: now
        };
        return freshData;
    } catch (error) {
        // If fetch fails and we have stale cache, use it as fallback
        if (pluglistCache) {
            console.error('[Cache] Fetch failed, using stale cached data as fallback');
            return pluglistCache.data;
        }
        throw error; // Re-throw if no cache available
    }
}

export async function getParsedPluglist(): Promise<PluginListResponse> {
    const rawData = await getCachedPluglist();
    try {
        return JSON.parse(rawData);
    } catch (error) {
        throw new Error(`Failed to parse plugin list JSON: ${error}`);
    }
}

export async function findPluginLatestVersion(
    pluginName: string,
    moodleVersion?: number,
    moodleRelease?: string
): Promise<{
    plugin: Plugin;
    latestVersion: PluginVersion;
    moodleTarget: { version?: number; release?: string };
} | null> {
    if (!moodleVersion && !moodleRelease) {
        throw new Error('Either moodle_version or moodle_release must be provided');
    }
    if (moodleVersion && moodleRelease) {
        throw new Error('Cannot specify both moodle_version and moodle_release');
    }

    const pluginList = await getParsedPluglist();

    // Find the plugin by component name
    const plugin = pluginList.plugins.find(p => p.component === pluginName);
    if (!plugin) {
        return null; // Plugin not found
    }

    // Find the latest version that supports the specified Moodle version/release
    let latestCompatibleVersion: PluginVersion | null = null;
    let latestVersionTime = 0;

    for (const version of plugin.versions) {
        // Check if this version supports the target Moodle version/release
        const isCompatible = version.supportedmoodles.some(moodle => {
            if (moodleVersion !== undefined) {
                return moodle.version === moodleVersion;
            } else if (moodleRelease !== undefined) {
                return moodle.release === moodleRelease;
            }
            return false;
        });

        if (isCompatible && version.timecreated > latestVersionTime) {
            latestCompatibleVersion = version;
            latestVersionTime = version.timecreated;
        }
    }

    if (!latestCompatibleVersion) {
        return null; // No compatible version found
    }

    return {
        plugin,
        latestVersion: latestCompatibleVersion,
        moodleTarget: {
            version: moodleVersion,
            release: moodleRelease
        }
    };
}

// Utility function to clear cache (useful for testing or manual refresh)
export function clearPluglistCache(): void {
    pluglistCache = null;
    console.error('[Cache] Pluglist cache cleared');
}

// Utility function to get cache status
export function getCacheStatus(): { hasCache: boolean; age?: number; ttl: number } {
    const now = Date.now();
    return {
        hasCache: pluglistCache !== null,
        age: pluglistCache ? now - pluglistCache.timestamp : undefined,
        ttl: CACHE_TTL_MS
    };
}

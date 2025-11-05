import fetch from 'node-fetch';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Cache configuration - read from environment variable or default to temp directory
const CACHE_DIR = process.env.CACHE_DIR || path.join(os.tmpdir(), 'mcp-moodle-cache');

// Cache configuration
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour in milliseconds

// Removed setCacheDir function - now uses environment variable

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

export async function fetchPluglistRaw(): Promise<string> {
    // This returns raw JSON data from the pluglist API.
    const url = `https://download.moodle.org/api/1.3/pluglist.php`;
    const res = await fetch(url);
    return await res.text();
}

export async function getCachedPluglist(): Promise<string> {
    const cacheFile = path.join(CACHE_DIR, 'pluglist.json');
    const now = Date.now();

    try {
        // Check if cache file exists and is fresh
        const stat = await fs.promises.stat(cacheFile);
        if ((now - stat.mtime.getTime()) < CACHE_TTL_MS) {
            console.error('[Cache] Using cached pluglist data from file');
            return await fs.promises.readFile(cacheFile, 'utf-8');
        }
    } catch (error) {
        // File doesn't exist or can't be read, will fetch fresh
    }

    // Cache is stale or doesn't exist, fetch fresh data
    console.error('[Cache] Fetching fresh pluglist data');
    try {
        const freshData = await fetchPluglistRaw();
        // Ensure cache dir exists
        await fs.promises.mkdir(CACHE_DIR, { recursive: true });
        await fs.promises.writeFile(cacheFile, freshData, 'utf-8');
        return freshData;
    } catch (fetchError) {
        // If fetch fails, try to use stale cache file as fallback
        try {
            console.error('[Cache] Fetch failed, using stale cached file as fallback');
            return await fs.promises.readFile(cacheFile, 'utf-8');
        } catch (fileError) {
            throw fetchError; // Re-throw fetch error if no cache available
        }
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
export async function clearPluglistCache(): Promise<void> {
    const cacheFile = path.join(CACHE_DIR, 'pluglist.json');
    try {
        await fs.promises.unlink(cacheFile);
        console.error('[Cache] Pluglist cache file cleared');
    } catch (error) {
        console.error('[Cache] Failed to clear cache file:', error);
    }
}

// Utility function to get cache status
export async function getCacheStatus(): Promise<{ hasCache: boolean; age?: number; ttl: number }> {
    const cacheFile = path.join(CACHE_DIR, 'pluglist.json');
    const now = Date.now();
    try {
        const stat = await fs.promises.stat(cacheFile);
        return {
            hasCache: true,
            age: now - stat.mtime.getTime(),
            ttl: CACHE_TTL_MS
        };
    } catch (error) {
        return {
            hasCache: false,
            ttl: CACHE_TTL_MS
        };
    }
}

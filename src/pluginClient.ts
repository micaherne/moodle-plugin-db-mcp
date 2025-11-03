import fetch from 'node-fetch';

const PLUGLIST_URL = 'https://download.moodle.org/api/1.3/pluglist.php';

export async function fetchPluglistRaw(): Promise<string> {
    // This returns raw text from the pluglist API. The API historically returns XML.
    // Parsing into structured types will be implemented later.
    const res = await fetch(PLUGLIST_URL);
    if (!res.ok) throw new Error(`Failed to fetch pluglist: ${res.status}`);
    return await res.text();
}

// Small stub for future parsing/caching
export async function getCachedPluglist(): Promise<string> {
    // TODO: add caching layer
    return await fetchPluglistRaw();
}

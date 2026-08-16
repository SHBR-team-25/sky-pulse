export const MAP_SEARCH_STORAGE_KEY = 'skypulse.map.search';

function normalize(search: string): string {
    return search.startsWith('?') ? search.slice(1) : search;
}

// localStorage недоступен в приватном режиме и при отключённых куках
export function readStoredMapSearch(): string {
    try {
        return localStorage.getItem(MAP_SEARCH_STORAGE_KEY) ?? '';
    } catch {
        return '';
    }
}

export function writeStoredMapSearch(search: string): void {
    const value = normalize(search);

    if (!value) {
        return;
    }

    try {
        localStorage.setItem(MAP_SEARCH_STORAGE_KEY, value);
    } catch {
        console.error('Failed to store map search');
    }
}

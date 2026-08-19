import { tryParseMapBoundsView } from './mapViewParams';
import { readStoredMapSearch } from './mapViewStorage';

export function resolveStoredMapSearch(searchParams: URLSearchParams): string | null {
    if (tryParseMapBoundsView(searchParams)) {
        return null;
    }

    const stored = readStoredMapSearch();

    return stored && tryParseMapBoundsView(new URLSearchParams(stored)) ? stored : null;
}

export function resolveMapSearchParams(searchParams: URLSearchParams): URLSearchParams {
    const stored = resolveStoredMapSearch(searchParams);

    return stored ? new URLSearchParams(stored) : searchParams;
}

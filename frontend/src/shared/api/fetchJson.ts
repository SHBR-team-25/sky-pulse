import { API_BASE_URL } from './constants';

export type QueryParamValue = string | number | boolean | undefined | null;
export type QueryParams = Readonly<Record<string, QueryParamValue>>;

export class ApiError extends Error {
    readonly status: number;
    readonly url: string;

    constructor(status: number, url: string, message?: string) {
        super(message ?? `Request failed with status ${status}: ${url}`);
        this.name = 'ApiError';
        this.status = status;
        this.url = url;
    }
}

export function buildUrl(path: string, params?: QueryParams): string {
    const search = new URLSearchParams();

    for (const [key, value] of Object.entries(params ?? {})) {
        if (value === undefined || value === null) {
            continue;
        }

        search.append(key, String(value));
    }

    const query = search.toString();

    return `${API_BASE_URL}${path}${query ? `?${query}` : ''}`;
}

export interface FetchJsonOptions {
    params?: QueryParams;
    signal?: AbortSignal;
}

export async function fetchJson<TResponse>(
    path: string,
    { params, signal }: FetchJsonOptions = {}
): Promise<TResponse> {
    const url = buildUrl(path, params);
    const response = await fetch(url, {
        signal,
        headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
        throw new ApiError(response.status, url, `${response.status} ${response.statusText}`);
    }

    return (await response.json()) as TResponse;
}

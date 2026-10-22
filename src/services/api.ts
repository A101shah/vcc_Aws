
import { fetchAuthSession } from "aws-amplify/auth";

const API_BASE_URL = (
    import.meta.env.VITE_API_BASE_URL || ""
).replace(/\/+$/, "");

export async function apiRequest<T>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
    if (!API_BASE_URL) {
        throw new Error("VITE_API_BASE_URL is not configured");
    }

    const session = await fetchAuthSession();
    const token = session.tokens?.accessToken?.toString();

    if (!token) {
        throw new Error("Please sign in before accessing student data.");
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options.headers,
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const message = await response.text();
        throw new Error(`API error ${response.status}: ${message}`);
    }

    if (response.status === 204) {
        return undefined as T;
    }

    return response.json() as Promise<T>;
}

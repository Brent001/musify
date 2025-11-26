import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async ({ params, url, fetch }) => {
    const artistId = params.id;
    const page = url.searchParams.get('page');
    const sortBy = url.searchParams.get('sortBy');
    const sortOrder = url.searchParams.get('sortOrder');

    if (!env.VITE_API_URL) {
        throw error(500, 'API URL is not configured in environment variables.');
    }

    if (!artistId) {
        throw error(400, 'Artist ID is required in the path.');
    }

    const paramsForExternalApi = new URLSearchParams();
    if (page) paramsForExternalApi.append('page', page);
    if (sortBy) paramsForExternalApi.append('sortBy', sortBy);
    if (sortOrder) paramsForExternalApi.append('sortOrder', sortOrder);

    const externalApiUrl = `${env.VITE_API_URL}/api/artists/${encodeURIComponent(artistId)}/albums?${paramsForExternalApi.toString()}`;

    try {
        const response = await fetch(externalApiUrl);

        if (response.status === 404) {
            throw error(404, 'Artist not found for the given ID.');
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.error('External API Error Response (Artist Albums):', errorText);
            throw error(response.status, `Failed to retrieve artist albums from external API: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.success && data.data) {
            return json(data.data);
        } else if (data.success && !data.data) {
            // If data.success is true but data.data is null/undefined, it means no albums found for the artist
            return json({ total: 0, albums: [] }); // Return empty list explicitly
        } else {
            console.error('Unexpected external API response format (Artist Albums):', data);
            throw error(500, 'Unexpected response format from external API.');
        }

    } catch (err) {
        console.error(`Error fetching albums for artist ID "${artistId}":`, err);
        if (err instanceof Error && 'status' in err) {
            throw err;
        }
        throw error(500, 'An internal error occurred while fetching artist albums.');
    }
};
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async ({ url, fetch }) => {
    const playlistId = url.searchParams.get('id');
    const playlistLink = url.searchParams.get('link');
    const page = url.searchParams.get('page');
    const limit = url.searchParams.get('limit');

    if (!env.VITE_API_URL) {
        throw error(500, 'API URL is not configured in environment variables.');
    }

    if (!playlistId && !playlistLink) {
        throw error(400, 'Playlist ID or link is required as a query parameter.');
    }

    // Construct the query parameters for the external JioSaavn API
    const params = new URLSearchParams();
    if (playlistId) params.append('id', playlistId);
    if (playlistLink) params.append('link', playlistLink);
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);

    const externalApiUrl = `${env.VITE_API_URL}/api/playlists?${params.toString()}`;

    try {
        const response = await fetch(externalApiUrl);

        if (response.status === 404) {
            throw error(404, 'The playlist could not be found with the provided ID or link.');
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.error('External API Error Response (Playlist by ID/Link):', errorText);
            throw error(response.status, `Failed to retrieve playlist from external API: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.success && data.data) {
            return json(data.data);
        } else if (data.success && !data.data) {
            throw error(404, 'The playlist could not be found with the provided ID or link.');
        } else {
            console.error('Unexpected external API response format (Playlist by ID/Link):', data);
            throw error(500, 'Unexpected response format from external API.');
        }

    } catch (err) {
        console.error(`Error fetching playlist with ID "${playlistId}" or link "${playlistLink}":`, err);
        if (err instanceof Error && 'status' in err) {
            throw err;
        }
        throw error(500, 'An internal error occurred while fetching playlist details.');
    }
};
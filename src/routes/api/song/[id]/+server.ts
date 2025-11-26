import { json, error } from '@sveltejs/kit';
import { VITE_API_URL } from '$env/static/private';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ params, fetch }) => {
    const songId = params.id; // Get the song ID from the path parameters

    if (!VITE_API_URL) {
        throw error(500, 'API URL is not configured');
    }

    if (!songId) {
        throw error(400, 'Song ID is required.');
    }

    try {
        const response = await fetch(`${VITE_API_URL}/api/songs/${encodeURIComponent(songId)}`);

        if (response.status === 404) {
            throw error(404, 'Song not found for the given ID.');
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.error('External API Error Response (Song by ID):', errorText);
            throw error(response.status, `Failed to fetch song from external API: ${response.statusText}`);
        }

        const data = await response.json();

        // The external API returns a 'data' array, we expect a single song
        if (data.success && data.data && data.data.length > 0) {
            return json(data.data[0]); // Return the first song object
        } else if (data.success && data.data && data.data.length === 0) {
             throw error(404, 'Song not found for the given ID.');
        } else {
            throw error(500, 'Unexpected response format from external API.');
        }

    } catch (err) {
        console.error(`Error fetching song with ID ${songId}:`, err);
        // Re-throw SvelteKit errors, otherwise return a generic 500
        if (err instanceof Error && 'status' in err) {
            throw err;
        }
        throw error(500, 'An internal error occurred while fetching song details.');
    }
};
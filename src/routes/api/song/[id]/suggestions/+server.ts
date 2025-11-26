import { json, error } from '@sveltejs/kit';
import { VITE_API_URL } from '$env/static/private';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ params, url, fetch }) => {
    const songId = params.id; // Get the song ID from the path parameters
    const limit = url.searchParams.get('limit') || '10'; // Get limit from query params, default to '10'

    if (!VITE_API_URL) {
        throw error(500, 'API URL is not configured');
    }

    if (!songId) {
        throw error(400, 'Song ID is required for suggestions.');
    }

    try {
        const response = await fetch(
            `${VITE_API_URL}/api/songs/${encodeURIComponent(songId)}/suggestions?limit=${encodeURIComponent(limit)}`
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('External API Error Response (Song Suggestions):', errorText);
            throw error(
                response.status,
                `Failed to fetch song suggestions from external API: ${response.statusText}`
            );
        }

        const data = await response.json();

        // The external API returns a 'data' array for suggestions
        if (data.success && data.data) {
            return json(data.data); // Return the array of song suggestions
        } else {
            throw error(500, 'Unexpected response format from external API for suggestions.');
        }

    } catch (err) {
        console.error(`Error fetching song suggestions for ID ${songId}:`, err);
        // Re-throw SvelteKit errors, otherwise return a generic 500
        if (err instanceof Error && 'status' in err) {
            throw err;
        }
        throw error(500, 'An internal error occurred while fetching song suggestions.');
    }
};
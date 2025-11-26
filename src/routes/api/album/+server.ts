import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { env } from '$env/dynamic/private'; // CHANGED: Import 'env' object from dynamic/private

export const GET: RequestHandler = async ({ url, fetch }) => {
    const albumId = url.searchParams.get('id');
    const albumLink = url.searchParams.get('link');

    // CHANGED: Access VITE_API_URL via the 'env' object
    if (!env.VITE_API_URL) {
        throw error(500, 'API URL is not configured in environment variables.');
    }

    if (!albumId && !albumLink) {
        throw error(400, 'Album ID or link is required as a query parameter.');
    }

    // Construct the query parameters for the external JioSaavn API
    const params = new URLSearchParams();
    if (albumId) {
        params.append('id', albumId);
    }
    if (albumLink) {
        params.append('link', albumLink);
    }

    // CHANGED: Use env.VITE_API_URL for the external API call
    const externalApiUrl = `${env.VITE_API_URL}/api/albums?${params.toString()}`;

    try {
        const response = await fetch(externalApiUrl);

        if (response.status === 404) {
            throw error(404, 'The album could not be found with the provided ID or link.');
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.error('External API Error Response (Album by ID/Link):', errorText);
            throw error(response.status, `Failed to retrieve album from external API: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.success && data.data) {
            return json(data.data);
        } else if (data.success && !data.data) {
            throw error(404, 'The album could not be found with the provided ID or link.');
        } else {
            console.error('Unexpected external API response format (Album by ID/Link):', data);
            throw error(500, 'Unexpected response format from external API.');
        }

    } catch (err) {
        console.error(`Error fetching album with ID "${albumId}" or link "${albumLink}":`, err);
        if (err instanceof Error && 'status' in err) {
            throw err;
        }
        throw error(500, 'An internal error occurred while fetching album details.');
    }
};
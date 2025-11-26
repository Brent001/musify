import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async ({ url, fetch }) => {
    const artistId = url.searchParams.get('id');
    const artistLink = url.searchParams.get('link');
    const page = url.searchParams.get('page');
    const songCount = url.searchParams.get('songCount');
    const albumCount = url.searchParams.get('albumCount');
    const sortBy = url.searchParams.get('sortBy');
    const sortOrder = url.searchParams.get('sortOrder'); // Default 'desc' as per docs

    if (!env.VITE_API_URL) {
        throw error(500, 'API URL is not configured in environment variables.');
    }

    if (!artistId && !artistLink) {
        throw error(400, 'Artist ID or link is required as a query parameter.');
    }

    const params = new URLSearchParams();
    if (artistId) params.append('id', artistId);
    if (artistLink) params.append('link', artistLink);
    if (page) params.append('page', page);
    if (songCount) params.append('songCount', songCount);
    if (albumCount) params.append('albumCount', albumCount);
    if (sortBy) params.append('sortBy', sortBy);
    if (sortOrder) params.append('sortOrder', sortOrder);

    const externalApiUrl = `${env.VITE_API_URL}/api/artists?${params.toString()}`;

    try {
        const response = await fetch(externalApiUrl);

        if (response.status === 404) {
            throw error(404, 'Artist not found for the given ID or link.');
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.error('External API Error Response (Artist by ID/Link):', errorText);
            throw error(response.status, `Failed to retrieve artist from external API: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.success && data.data) {
            return json(data.data);
        } else if (data.success && !data.data) {
            throw error(404, 'Artist not found for the given ID or link.');
        } else {
            console.error('Unexpected external API response format (Artist by ID/Link):', data);
            throw error(500, 'Unexpected response format from external API.');
        }

    } catch (err) {
        console.error(`Error fetching artist with ID "${artistId}" or link "${artistLink}":`, err);
        if (err instanceof Error && 'status' in err) {
            throw err;
        }
        throw error(500, 'An internal error occurred while fetching artist details.');
    }
};
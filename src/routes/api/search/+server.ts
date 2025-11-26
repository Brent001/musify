import { json, error } from '@sveltejs/kit';
import { VITE_API_URL } from '$env/static/private';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ url }) => {
    const query = url.searchParams.get('query');

    if (!VITE_API_URL) {
        throw error(500, 'API URL is not configured');
    }

    if (!query) {
        return json({ success: false, message: 'A search query is required.' }, { status: 400 });
    }

    try {
        const response = await fetch(`${VITE_API_URL}/api/search?query=${encodeURIComponent(query)}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error Response:', errorText);
            throw error(response.status, `Failed to fetch from external API: ${response.statusText}`);
        }

        const data = await response.json();

        return json(data);
    } catch (err) {
        console.error('Error fetching search results:', err);
        throw error(500, 'An internal error occurred while fetching search results.');
    }
};
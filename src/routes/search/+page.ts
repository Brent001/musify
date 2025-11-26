import type { PageLoad } from './$types.js';

export const load: PageLoad = async ({ fetch, url }) => {
    const query = url.searchParams.get('query');

    if (!query) {
        return {
            query: '',
            results: null
        };
    }

    try {
        const response = await fetch(`/api/search?query=${encodeURIComponent(query)}`);

        if (!response.ok) {
            const errorData = await response.json();
            return {
                query,
                results: null,
                error: errorData.message || 'Failed to fetch search results.'
            };
        }

        const results = await response.json();

        return {
            query,
            results
        };
    } catch (error) {
        console.error('Error in search page load:', error);
        return {
            query,
            results: null,
            error: 'An unexpected error occurred.'
        };
    }
};
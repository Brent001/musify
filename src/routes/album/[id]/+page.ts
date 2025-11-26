import type { PageLoad } from './$types.js';
import { error } from '@sveltejs/kit';

// Simplified types based on your API response example
interface Image {
    quality: string;
    url: string;
}

interface Artist {
    id: string;
    name: string;
    role?: string;
    type?: string;
    image?: Image[];
    url?: string;
}

interface AlbumSong {
    id: string;
    name: string;
    type: string;
    year: number | null;
    duration: number | null;
    explicitContent: boolean;
    language: string;
    hasLyrics: boolean;
    url: string;
    image: Image[];
    artists: {
        primary: Artist[];
        featured: Artist[];
        all: Artist[];
    };
    album: {
        id: string | null;
        name: string | null;
        url: string | null;
    };
}

export interface AlbumData {
    id: string;
    name: string;
    description: string;
    year: number | null;
    type: string;
    playCount: number | null;
    language: string;
    explicitContent: boolean;
    artists: {
        primary: Artist[];
        featured: Artist[];
        all: Artist[];
    };
    songCount: number | null;
    url: string;
    image: Image[];
    songs: AlbumSong[];
}

export const load: PageLoad = async ({ params, fetch }) => {
    const albumId = params.id; // Get the album ID from the route parameters

    if (!albumId) {
        throw error(400, 'Album ID is required.');
    }

    try {
        // Call your internal API endpoint for album details
        const response = await fetch(`/api/album?id=${encodeURIComponent(albumId)}`);

        if (!response.ok) {
            const errorBody = await response.json();
            throw error(response.status, errorBody?.message || `Failed to fetch album: ${response.statusText}`);
        }

        const album: AlbumData = await response.json();

        return {
            album
        };
    } catch (err: any) {
        console.error('Error in album/[id]/+page.ts load function:', err);
        throw error(err.status || 500, err.body?.message || 'Could not load album details.');
    }
};
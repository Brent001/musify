import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types.js';

// --- Reusable Types (consider moving to a common types file like $lib/types.ts) ---
interface Image {
    quality: string;
    url: string;
}

interface MiniArtist { // Simplified artist type for song listings
    id: string;
    name: string;
    role?: string;
    type?: string;
    image?: Image[];
    url?: string;
}

interface PlaylistSong {
    id: string;
    name: string;
    type: string;
    year: number | null;
    releaseDate: string | null;
    duration: number | null;
    label: string | null;
    explicitContent: boolean;
    playCount: number | null;
    language: string;
    hasLyrics: boolean;
    lyricsId: string | null;
    url: string;
    copyright: string | null;
    album: {
        id: string | null;
        name: string | null;
        url: string | null;
    };
    artists: {
        primary: MiniArtist[];
        featured?: MiniArtist[];
        all?: MiniArtist[];
    };
    image: Image[];
    downloadUrl: { quality: string; url: string; }[];
}

export interface PlaylistData {
    id: string;
    name: string;
    description: string | null;
    year: number | null;
    type: string;
    playCount: number | null;
    language: string;
    explicitContent: boolean;
    songCount: number | null;
    url: string;
    image: Image[];
    songs: PlaylistSong[];
    artists?: MiniArtist[]; // Artists associated with the playlist (if any)
}
// --- End Reusable Types ---


export const load: PageLoad = async ({ params, fetch }) => {
    const playlistId = params.id;

    if (!playlistId) {
        throw error(400, 'Playlist ID is missing.');
    }

    try {
        const response = await fetch(`/api/playlist?id=${encodeURIComponent(playlistId)}`);

        if (!response.ok) {
            const errData = await response.json();
            if (response.status === 404) {
                throw error(404, errData.message || 'Playlist not found.');
            }
            throw error(response.status, errData.message || `Failed to fetch playlist details: ${response.statusText}`);
        }

        const playlistData: PlaylistData = await response.json();

        if (!playlistData) {
            throw error(404, 'Playlist not found.');
        }

        return {
            playlist: playlistData
        };
    } catch (err: any) {
        console.error('Error in playlist page load:', err);
        // Ensure SvelteKit error is re-thrown
        if (err instanceof Error && 'status' in err) {
            throw err;
        }
        throw error(err.status || 500, err.body?.message || 'Could not load playlist details.');
    }
};
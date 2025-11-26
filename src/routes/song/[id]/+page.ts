import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types.js';

// Re-import AlbumData and related types from the album page load file
// to ensure consistency, or define them here if not used elsewhere.
// For simplicity, I'm defining a minimal SongFromAlbum type for now.
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

interface AlbumSong { // This type is for songs returned as part of an album's data
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
        primary: Artist[];
        featured: Artist[];
        all: Artist[];
    };
    image: Image[];
    downloadUrl: { quality: string; url: string; }[];
}

interface AlbumData { // Minimal AlbumData type for fetching tracks
    id: string;
    name: string;
    image: Image[];
    songs: AlbumSong[];
    // ...other album properties you might fetch but aren't strictly needed for this feature
}


export const load: PageLoad = async ({ params, fetch }) => {
    const songId = params.id;

    if (!songId) {
        throw error(400, 'Song ID is missing.');
    }

    let songData;
    let suggestionsData = [];
    let otherAlbumTracksData: AlbumSong[] = []; // NEW: Array to hold other tracks from the same album

    // 1. Fetch main song details
    try {
        const songResponse = await fetch(`/api/song/${songId}`);

        if (!songResponse.ok) {
            const errData = await songResponse.json();
            if (songResponse.status === 404) {
                throw error(404, errData.message || 'Song not found.');
            }
            throw error(songResponse.status, errData.message || 'Failed to load song details.');
        }

        songData = await songResponse.json();

    } catch (err) {
        console.error('Error in song page load (main song fetch):', err);
        if (err instanceof Error && 'status' in err) {
            throw err;
        }
        throw error(500, 'Could not load song details.');
    }

    // 2. NEW: If the song belongs to an album, fetch that album's details
    if (songData.album && songData.album.id) {
        try {
            const albumResponse = await fetch(`/api/album?id=${encodeURIComponent(songData.album.id)}`);
            if (albumResponse.ok) {
                const albumData: AlbumData = await albumResponse.json();
                if (albumData && albumData.songs) {
                    // Filter out the current song from the album's song list
                    otherAlbumTracksData = albumData.songs.filter(track => track.id !== songId);
                }
            } else {
                console.warn(`Could not fetch album details for album ID ${songData.album.id}: ${albumResponse.statusText}`);
            }
        } catch (err) {
            console.error(`Error fetching album details for album ID ${songData.album.id}:`, err);
        }
    }


    // 3. Fetch suggestions for the song (existing logic)
    try {
        const suggestionsResponse = await fetch(`/api/song/${songId}/suggestions?limit=10`);
        if (suggestionsResponse.ok) {
            suggestionsData = await suggestionsResponse.json();
        } else {
            console.warn(`Could not fetch suggestions for song ID ${songId}: ${suggestionsResponse.statusText}`);
            suggestionsData = [];
        }
    } catch (err) {
        console.error(`Error fetching suggestions for song ID ${songId}:`, err);
        suggestionsData = [];
    }

    return {
        song: songData,
        suggestions: suggestionsData,
        otherAlbumTracks: otherAlbumTracksData // NEW: Pass the other album tracks
    };
};
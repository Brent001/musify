import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types.js';

// --- Reusable Types (consider moving to a common types file like $lib/types.ts) ---
interface Image {
    quality: string;
    url: string;
}

interface MiniArtist {
    id: string;
    name: string;
    role?: string;
    type?: string;
    image?: Image[];
    url?: string;
}

interface SongFromArtist { // Simplified for display on artist page
    id: string;
    name: string;
    type: string;
    year: number | null;
    duration: number | null;
    language: string;
    url: string;
    image: Image[];
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
    downloadUrl?: { quality: string; url: string; }[]; // Optional as not all lists include it
}

interface AlbumFromArtist { // Simplified for display on artist page
    id: string;
    name: string;
    type: string;
    year: number | null;
    language: string;
    url: string;
    image: Image[];
    artists: {
        primary: MiniArtist[];
        featured?: MiniArtist[];
        all?: MiniArtist[];
    };
    songCount: number | null;
}

interface ArtistBio {
    text: string | null;
    title: string | null;
    sequence: number | null;
}

export interface ArtistData {
    id: string;
    name: string;
    url: string;
    type: string;
    image: Image[];
    followerCount: number | null;
    fanCount: number | null;
    isVerified: boolean | null;
    dominantLanguage: string | null;
    dominantType: string | null;
    bio: ArtistBio[];
    dob: string | null; // Date of birth
    fb: string | null; // Facebook link
    twitter: string | null; // Twitter link
    wiki: string | null; // Wikipedia link
    availableLanguages: string[];
    isRadioPresent: boolean | null;
    // Note: topSongs, topAlbums, singles, similarArtists are often fetched separately or come under 'data'
}
// --- End Reusable Types ---


export const load: PageLoad = async ({ params, fetch }) => {
    const artistId = params.id;

    if (!artistId) {
        throw error(400, 'Artist ID is missing.');
    }

    let artistData: ArtistData | null = null;
    let topSongs: SongFromArtist[] = [];
    let topAlbums: AlbumFromArtist[] = [];

    // Fetch Artist Details
    try {
        const artistResponse = await fetch(`/api/artist/${artistId}?songCount=0&albumCount=0`); // Fetch artist data without embedded songs/albums
        if (!artistResponse.ok) {
            const errData = await artistResponse.json();
            throw error(artistResponse.status, errData.message || `Failed to fetch artist details: ${artistResponse.statusText}`);
        }
        artistData = await artistResponse.json();

    } catch (err) {
        console.error('Error fetching artist details:', err);
        if (err instanceof Error && 'status' in err) {
            throw err;
        }
        throw error(500, 'Could not load artist details.');
    }

    // Fetch Top Songs
    try {
        const songsResponse = await fetch(`/api/artist/${artistId}/songs?sortBy=popularity&sortOrder=desc&page=0`);
        if (songsResponse.ok) {
            const data = await songsResponse.json();
            if (data.songs) {
                topSongs = data.songs;
            }
        } else {
            console.warn(`Could not fetch top songs for artist ID ${artistId}: ${songsResponse.statusText}`);
        }
    } catch (err) {
        console.error(`Error fetching top songs for artist ID ${artistId}:`, err);
    }

    // Fetch Top Albums
    try {
        const albumsResponse = await fetch(`/api/artist/${artistId}/albums?sortBy=popularity&sortOrder=desc&page=0`);
        if (albumsResponse.ok) {
            const data = await albumsResponse.json();
            if (data.albums) {
                topAlbums = data.albums;
            }
        } else {
            console.warn(`Could not fetch top albums for artist ID ${artistId}: ${albumsResponse.statusText}`);
        }
    } catch (err) {
        console.error(`Error fetching top albums for artist ID ${artistId}:`, err);
    }

    if (!artistData) {
        throw error(404, 'Artist not found.');
    }

    return {
        artist: artistData,
        topSongs,
        topAlbums
    };
};
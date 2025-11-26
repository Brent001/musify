<script lang="ts">
    import type { PageData } from './$types.js';
    import { goto } from '$app/navigation'; // Import goto for navigation
    import { playerStore, type SongForPlayer } from '$lib/stores/playerStore.js'; // Import playerStore
    import Play from 'lucide-svelte/icons/play'; // Import the Play icon

    // Access the data returned by the load function in +page.ts
    export let data: PageData;

    // Helper functions (same as previous +page.svelte, moved here for clarity)
    function getArtistNames(artists: { primary: any[]; featured?: any[]; all?: any[] } | undefined): string {
        if (!artists || artists.primary.length === 0) return 'Unknown Artist';
        return artists.primary.map(a => a.name).join(', ');
    }

    interface Image {
        quality: string;
        url: string;
    }

    // Type for download URLs to correctly extract audio URLs
    type DownloadUrlItem = {
        quality: string;
        url: string;
    };


    function getImageUrl(images: Image[] | undefined): string {
        if (!images || images.length === 0) return '/default-album-art.png'; // Fallback image
        // Prioritize higher quality images if available, otherwise just pick the first one
        const highQuality = images.find(img => img.quality === '500x500' || img.quality === '150x150');
        return highQuality ? highQuality.url : images[0].url;
    }

    // NEW: Function to play the first song of the album
    function playFirstAlbumSong() {
        if (data.album && data.album.songs && data.album.songs.length > 0) {
            const firstSong = data.album.songs[0];
            if (firstSong.downloadUrl && firstSong.downloadUrl.length > 0) {
                // Find the 320kbps URL, or fallback to the highest available
                const audioUrl =
                    firstSong.downloadUrl.find((item: DownloadUrlItem) => item.quality === '320kbps')?.url ||
                    firstSong.downloadUrl[firstSong.downloadUrl.length - 1].url;

                const songForPlayer: SongForPlayer = {
                    id: firstSong.id,
                    name: firstSong.name,
                    artistName: getArtistNames(firstSong.artists), // Use the helper for artists
                    albumName: firstSong.album?.name || data.album.name || 'Unknown Album',
                    albumImageUrl: getImageUrl(firstSong.image),
                    audioUrl: audioUrl,
                    duration: firstSong.duration || 0 // duration is in seconds from API
                };
                playerStore.startPlaying(songForPlayer);
            }
        }
    }

    // NEW: Function to handle clicking an individual song card
    function handleSongCardClick(songId: string) {
        goto(`/song/${songId}`);
    }

</script>

<div class="container mx-auto p-6 bg-background-base min-h-screen text-text-base">
    {#if data.album}
        <div class="bg-background-elevated-base p-8 rounded-lg shadow-xl">
            <div class="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
                <!-- NEW: Playable Album Cover Image Section -->
                <div
                    class="album-image-wrapper"
                    on:click={playFirstAlbumSong}
                    role="button"
                    tabindex="0"
                    aria-label="Play first song from {data.album.name}"
                >
                    <img
                        src={getImageUrl(data.album.image)}
                        alt={data.album.name}
                        class="album-image"
                    />
                    <div class="play-overlay">
                        <Play size={48} class="play-icon" />
                    </div>
                </div>

                <div class="text-center md:text-left">
                    <h1 class="text-4xl font-extrabold mb-2 text-primary">{data.album.name}</h1>
                    <p class="text-lg text-text-subdued mb-1">
                        Artist: <span class="text-text-base">{getArtistNames(data.album.artists)}</span>
                    </p>
                    {#if data.album.year}<p class="text-md text-text-subdued mb-1">Year: <span class="text-text-base">{data.album.year}</span></p>{/if}
                    {#if data.album.language}<p class="text-md text-text-subdued mb-1">Language: <span class="text-text-base">{data.album.language}</span></p>{/if}
                    {#if data.album.playCount}<p class="text-md text-text-subdued mb-1">Play Count: <span class="text-text-base">{data.album.playCount?.toLocaleString()}</span></p>{/if}
                    {#if data.album.description}<p class="text-md text-text-subdued mt-4 max-w-2xl">{data.album.description}</p>{/if}
                    <!-- Removed: <a href={data.album.url} target="_blank" rel="noopener noreferrer" class="text-accent hover:underline mt-4 inline-block">
                        View on JioSaavn
                    </a> -->
                </div>
            </div>

            <h2 class="text-2xl font-bold mb-4 text-primary">Songs</h2>
            {#if data.album.songs && data.album.songs.length > 0}
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {#each data.album.songs as song (song.id)}
                        <!-- NEW: Added click handler to navigate to song page -->
                        <div
                            class="bg-background-base p-4 rounded-lg flex items-center gap-4 hover:bg-background-elevated-highlight transition-colors cursor-pointer"
                            on:click={() => handleSongCardClick(song.id)}
                            role="button"
                            tabindex="0"
                            aria-label="View song {song.name}"
                        >
                            <img src={getImageUrl(song.image)} alt={song.name} class="w-16 h-16 object-cover rounded" />
                            <div>
                                <h3 class="font-semibold text-text-base">{song.name}</h3>
                                <p class="text-sm text-text-subdued">{getArtistNames(song.artists)}</p>
                                <p class="text-xs text-text-subdued">
                                    {song.duration ? `${Math.floor(song.duration / 60)}:${(song.duration % 60).toString().padStart(2, '0')}` : ''}
                                </p>
                            </div>
                        </div>
                    {/each}
                </div>
            {:else}
                <p class="text-text-subdued">No songs found for this album.</p>
            {/if}
        </div>
    {/if}
</div>

<style>
    /* Basic custom properties (ensure these are defined globally in your app.css or similar) */
    :root {
        --background-base: #121212;
        --background-elevated-base: #1a1a1a;
        --background-elevated-highlight: #282828;
        --text-base: #ffffff;
        --text-subdued: #a7a7a7;
        --primary: #1ed760; /* Spotify green */
        --primary-hover: #169c46;
        --accent: #1db954; /* Another green shade */
    }

    .bg-background-base { background-color: var(--background-base); }
    .bg-background-elevated-base { background-color: var(--background-elevated-base); }
    .bg-background-elevated-highlight { background-color: var(--background-elevated-highlight); }
    .text-text-base { color: var(--text-base); }
    .text-text-subdued { color: var(--text-subdued); }
    .text-primary { color: var(--primary); }
    .bg-primary { background-color: var(--primary); }
    .hover\:bg-primary-hover:hover { background-color: var(--primary-hover); }
    .border-background-elevated-highlight { border-color: var(--background-elevated-highlight); }
    .text-accent { color: var(--accent); }
    .hover\:underline:hover { text-decoration: underline; }

    /* NEW: Styles for the playable album cover */
    .album-image-wrapper {
        position: relative;
        width: 250px;
        height: 250px;
        cursor: pointer;
        border-radius: 8px;
        overflow: hidden; /* Ensure overlay stays within bounds */
        box-shadow: 0 4px 60px rgba(0, 0, 0, 0.5);
        flex-shrink: 0; /* Prevent it from shrinking */
        transition: transform 0.2s ease-in-out;
        outline: none; /* Remove default focus outline */
    }

    .album-image-wrapper:hover,
    .album-image-wrapper:focus-visible { /* Add focus-visible for keyboard users */
        transform: scale(1.02);
    }

    .album-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block; /* Remove extra space below image */
    }

    .play-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5); /* Semi-transparent black overlay */
        display: flex;
        justify-content: center;
        align-items: center;
        opacity: 0; /* Hidden by default */
        transition: opacity 0.3s ease;
    }

    .album-image-wrapper:hover .play-overlay,
    .album-image-wrapper:focus-visible .play-overlay {
        opacity: 1; /* Show on hover/focus */
    }

    .play-icon {
        color: #1DB954; /* Spotify green */
        filter: drop-shadow(0 0 8px rgba(29, 185, 84, 0.6));
    }

    /* Adjustments for responsiveness */
    @media (max-width: 768px) {
        .album-image-wrapper {
            width: 180px;
            height: 180px;
        }
    }
</style>
<script lang="ts">
    import type { PageData } from './$types.js';
    import { goto } from '$app/navigation';
    import { playerStore, type SongForPlayer } from '$lib/stores/playerStore.js';
    import Play from 'lucide-svelte/icons/play';

    export let data: PageData;

    $: playlist = data.playlist;

    // Define a type for the downloadUrl items for better type safety
    type DownloadUrlItem = {
        quality: string;
        url: string;
    };

    // Helper to get the URL of the highest quality image
    function getImageUrl(images: { quality: string; url: string }[] | undefined): string {
        if (!images || images.length === 0) {
            return 'https://via.placeholder.com/300?text=No+Image';
        }
        return images[images.length - 1].url; // Assuming last is highest quality
    }

    // Helper to get artist names from a song object
    function getArtistNames(artists: { primary: any[]; featured?: any[]; all?: any[] } | undefined): string {
        if (!artists || artists.primary.length === 0) return 'Unknown Artist';
        return artists.primary.map(a => a.name).join(', ');
    }

    // Helper to format duration from seconds to MM:SS
    function formatDuration(durationInSeconds: number | null): string {
        if (durationInSeconds === null || isNaN(durationInSeconds)) {
            return '--:--';
        }
        const minutes = Math.floor(durationInSeconds / 60);
        const seconds = Math.floor(durationInSeconds % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    // Function to play a song (from the playlist)
    function playSong(songToPlay: any) { // Using 'any' for flexibility
        if (songToPlay && songToPlay.downloadUrl && songToPlay.downloadUrl.length > 0) {
            const audioUrl =
                songToPlay.downloadUrl.find((item: DownloadUrlItem) => item.quality === '320kbps')?.url ||
                songToPlay.downloadUrl[songToPlay.downloadUrl.length - 1].url;

            const songForPlayer: SongForPlayer = {
                id: songToPlay.id,
                name: songToPlay.name,
                artistName: getArtistNames(songToPlay.artists),
                albumName: songToPlay.album?.name || playlist?.name || 'Unknown Album',
                albumImageUrl: getImageUrl(songToPlay.image),
                audioUrl: audioUrl,
                duration: songToPlay.duration
            };
            playerStore.startPlaying(songForPlayer);
        }
    }

    // Function to play the first song of the playlist when the cover is clicked
    function playFirstPlaylistSong() {
        if (playlist && playlist.songs && playlist.songs.length > 0) {
            playSong(playlist.songs[0]);
        }
    }

    // Function to navigate to song details page
    function handleSongClick(songId: string) {
        goto(`/song/${songId}`);
    }

    // Handles keyboard events for accessibility on song cards
    function handleSongCardKeyPress(event: KeyboardEvent, songId: string) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleSongClick(songId);
        }
    }
</script>

<div class="playlist-detail-page">
    {#if playlist}
        <div class="playlist-header">
            <!-- Playable Playlist Cover Image Section -->
            <div
                class="playlist-image-wrapper"
                on:click={playFirstPlaylistSong}
                role="button"
                tabindex="0"
                aria-label="Play {playlist.name}"
            >
                <img
                    src={getImageUrl(playlist.image)}
                    alt={playlist.name}
                    class="playlist-image"
                />
                <div class="play-overlay">
                    <Play size={48} class="play-icon" />
                </div>
            </div>

            <div class="playlist-info">
                <p class="playlist-type">{playlist.type?.toUpperCase() || 'PLAYLIST'}</p>
                <h1 class="playlist-name">{playlist.name}</h1>
                {#if playlist.description}
                    <p class="playlist-description">{playlist.description}</p>
                {/if}
                <div class="playlist-meta">
                    {#if playlist.songCount !== null}<span class="meta-item">{playlist.songCount} Songs</span>{/if}
                    {#if playlist.playCount !== null}<span class="meta-item">{playlist.playCount?.toLocaleString()} Plays</span>{/if}
                    {#if playlist.language}<span class="meta-item">{playlist.language}</span>{/if}
                </div>
                <div class="action-buttons">
                    <button class="add-button">Add to Library</button>
                </div>
            </div>
        </div>

        <!-- Playlist Songs Section -->
        {#if playlist.songs && playlist.songs.length > 0}
            <section class="playlist-songs-section">
                <h2>Songs in this Playlist</h2>
                <div class="song-list">
                    {#each playlist.songs as song (song.id)}
                        <div
                            class="song-item"
                            on:click={() => handleSongClick(song.id)}
                            on:keydown={(e) => handleSongCardKeyPress(e, song.id)}
                            role="button"
                            tabindex="0"
                            aria-label="View song {song.name}"
                        >
                            <img
                                src={getImageUrl(song.image)}
                                alt={song.name}
                                class="song-item-image"
                            />
                            <div class="song-item-details">
                                <div class="song-item-title">{song.name}</div>
                                <div class="song-item-artist">{getArtistNames(song.artists)}</div>
                                <div class="song-item-album">{song.album?.name}</div>
                            </div>
                            <div class="song-item-duration">{formatDuration(song.duration)}</div>
                            <button class="play-song-button" on:click|stopPropagation={() => playSong(song)} aria-label="Play {song.name}">
                                <Play size={20} />
                            </button>
                        </div>
                    {/each}
                </div>
            </section>
        {:else}
            <p class="no-songs-message">This playlist currently has no songs.</p>
        {/if}

    {:else}
        <div class="loading-error">
            <p>Loading playlist details...</p>
        </div>
    {/if}
</div>

<style>
    /* Global styles and color variables from your existing pages */
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

    .playlist-detail-page {
        padding: 24px;
        color: var(--text-base);
        max-width: 1200px;
        margin: 0 auto;
    }

    .playlist-header {
        display: flex;
        flex-wrap: wrap;
        gap: 32px;
        align-items: flex-end;
        margin-bottom: 48px;
        background: linear-gradient(to bottom, #1a1a1a, #121212);
        padding: 32px;
        border-radius: 8px;
    }

    .playlist-image-wrapper {
        position: relative;
        width: 250px;
        height: 250px;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 4px 60px rgba(0, 0, 0, 0.5);
        flex-shrink: 0;
        transition: transform 0.2s ease-in-out;
        outline: none;
        cursor: pointer;
    }

    .playlist-image-wrapper:hover,
    .playlist-image-wrapper:focus-visible {
        transform: scale(1.02);
    }

    .playlist-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
    }

    .play-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        opacity: 0;
        transition: opacity 0.3s ease;
    }

    .playlist-image-wrapper:hover .play-overlay,
    .playlist-image-wrapper:focus-visible .play-overlay {
        opacity: 1;
    }

    .play-icon {
        color: var(--primary);
        filter: drop-shadow(0 0 8px rgba(29, 185, 84, 0.6));
    }

    .playlist-info {
        flex: 1;
        min-width: 250px;
    }

    .playlist-type {
        font-size: 0.9em;
        font-weight: bold;
        color: var(--text-subdued);
        margin-bottom: 8px;
    }

    .playlist-name {
        font-size: 3.5em;
        font-weight: bold;
        margin: 0 0 16px 0;
        line-height: 1.2;
        color: var(--text-base);
    }

    .playlist-description {
        font-size: 1em;
        color: var(--text-subdued);
        margin-top: 10px;
        max-width: 600px;
        line-height: 1.5;
    }

    .playlist-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        font-size: 0.9em;
        color: var(--text-subdued);
        margin-top: 16px;
    }

    .meta-item {
        background-color: var(--background-elevated-highlight);
        padding: 4px 12px;
        border-radius: 20px;
    }

    .action-buttons {
        margin-top: 24px;
    }

    .add-button {
        padding: 12px 24px;
        border-radius: 500px;
        border: none;
        font-size: 1em;
        font-weight: bold;
        cursor: pointer;
        transition: transform 0.2s ease-in-out;
        background-color: var(--background-elevated-highlight);
        color: var(--text-base);
        border: 1px solid var(--text-subdued);
    }

    .add-button:hover {
        background-color: #535353;
        transform: scale(1.05);
    }

    .playlist-songs-section {
        margin-top: 48px;
        background-color: var(--background-elevated-base);
        padding: 32px;
        border-radius: 8px;
    }

    .playlist-songs-section h2 {
        font-size: 2em;
        margin-bottom: 24px;
        color: var(--text-base);
    }

    .song-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .song-item {
        display: grid;
        grid-template-columns: 60px 1fr auto 40px; /* Image, Details, Duration, Play Button */
        align-items: center;
        gap: 16px;
        padding: 12px 16px;
        border-radius: 4px;
        transition: background-color 0.2s;
        cursor: pointer;
        background-color: var(--background-base);
        position: relative;
        outline: none;
    }

    .song-item:hover,
    .song-item:focus-visible {
        background-color: var(--background-elevated-highlight);
    }

    .song-item-image {
        width: 48px;
        height: 48px;
        object-fit: cover;
        border-radius: 4px;
    }

    .song-item-details {
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        min-width: 0; /* Allow text to truncate */
    }

    .song-item-title {
        font-weight: bold;
        color: var(--text-base);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .song-item-artist, .song-item-album {
        font-size: 0.9em;
        color: var(--text-subdued);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .song-item-duration {
        font-size: 0.9em;
        color: var(--text-subdued);
        flex-shrink: 0;
    }

    .play-song-button {
        background-color: var(--primary);
        color: #fff;
        border: none;
        border-radius: 50%;
        width: 36px;
        height: 36px;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 1.1em;
        cursor: pointer;
        opacity: 0;
        transition: opacity 0.2s ease, transform 0.2s ease;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        transform: translateY(5px);
        flex-shrink: 0;
    }

    .song-item:hover .play-song-button,
    .song-item:focus-visible .play-song-button {
        opacity: 1;
        transform: translateY(0);
    }

    .no-songs-message {
        text-align: center;
        margin-top: 32px;
        font-size: 1.1em;
        color: var(--text-subdued);
    }

    .loading-error {
        text-align: center;
        margin-top: 100px;
        font-size: 1.2em;
        color: var(--text-subdued);
    }

    @media (max-width: 768px) {
        .playlist-header {
            flex-direction: column;
            align-items: center;
            text-align: center;
        }

        .playlist-image-wrapper {
            width: 180px;
            height: 180px;
        }

        .playlist-name {
            font-size: 2.5em;
        }

        .song-item {
            grid-template-columns: 48px 1fr auto 36px; /* Adjust for smaller screens */
            gap: 12px;
            padding: 10px 12px;
        }

        .song-item-details {
            font-size: 0.9em;
        }
    }
</style>
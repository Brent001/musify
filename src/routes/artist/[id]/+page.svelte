<script lang="ts">
    import type { PageData } from './$types.js';
    import { goto } from '$app/navigation';
    import { playerStore, type SongForPlayer } from '$lib/stores/playerStore.js';
    import Play from 'lucide-svelte/icons/play';

    export let data: PageData;

    $: artist = data.artist;
    $: topSongs = data.topSongs;
    $: topAlbums = data.topAlbums;

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

    // Helper to play a song (from topSongs)
    function playSong(songToPlay: any) { // Using 'any' for flexibility
        if (songToPlay && songToPlay.downloadUrl && songToPlay.downloadUrl.length > 0) {
            const audioUrl =
                songToPlay.downloadUrl.find((item: DownloadUrlItem) => item.quality === '320kbps')?.url ||
                songToPlay.downloadUrl[songToPlay.downloadUrl.length - 1].url;

            const songForPlayer: SongForPlayer = {
                id: songToPlay.id,
                name: songToPlay.name,
                artistName: songToPlay.artists?.primary?.[0]?.name || artist?.name || 'Unknown Artist',
                albumName: songToPlay.album?.name || 'Unknown Album',
                albumImageUrl: getImageUrl(songToPlay.image),
                audioUrl: audioUrl,
                duration: songToPlay.duration
            };
            playerStore.startPlaying(songForPlayer);
        }
    }

    // NEW: Function to play the first top song of the artist
    function playArtistTopSong() {
        if (topSongs && topSongs.length > 0) {
            playSong(topSongs[0]);
        }
    }

    // Function to navigate to song details page
    function handleSongClick(songId: string) {
        goto(`/song/${songId}`);
    }

    // Function to navigate to album details page
    function handleAlbumClick(albumId: string) {
        goto(`/album/${albumId}`);
    }

    // Handles keyboard events for accessibility on cards
    function handleCardKeyPress(event: KeyboardEvent, id: string, type: 'song' | 'album') {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            if (type === 'song') {
                handleSongClick(id);
            } else {
                handleAlbumClick(id);
            }
        }
    }
</script>

<div class="artist-detail-page">
    {#if artist}
        <div class="artist-header">
            <!-- Playable Artist Image Section -->
            <div
                class="artist-image-wrapper"
                on:click={playArtistTopSong}
                role="button"
                tabindex="0"
                aria-label="Play top song from {artist.name}"
            >
                <img
                    src={getImageUrl(artist.image)}
                    alt={artist.name}
                    class="artist-image"
                />
                <div class="play-overlay">
                    <Play size={48} class="play-icon" />
                </div>
            </div>

            <div class="artist-info">
                <h1 class="artist-name">{artist.name}</h1>
                {#if artist.followerCount !== null}
                    <p class="follower-count">Followers: {artist.followerCount?.toLocaleString()}</p>
                {/if}
                {#if artist.dominantLanguage}
                    <p class="dominant-language">Dominant Language: {artist.dominantLanguage}</p>
                {/if}
                {#if artist.bio && artist.bio.length > 0}
                    <p class="artist-bio">{artist.bio[0].text}</p>
                {/if}
                <div class="action-buttons">
                    <button class="add-button">Follow</button>
                </div>
            </div>
        </div>

        <!-- Top Songs Section -->
        {#if topSongs && topSongs.length > 0}
            <section class="top-songs-section">
                <h2>Top Songs by {artist.name}</h2>
                <div class="tracks-grid">
                    {#each topSongs as song (song.id)}
                        <div
                            class="track-card"
                            on:click={() => handleSongClick(song.id)}
                            on:keydown={(e) => handleCardKeyPress(e, song.id, 'song')}
                            role="button"
                            tabindex="0"
                            aria-label="View song {song.name}"
                        >
                            <img
                                src={getImageUrl(song.image)}
                                alt={song.name}
                                class="track-image"
                            />
                            <div class="track-info">
                                <div class="track-title">{song.name}</div>
                                <div class="track-artist">{song.album?.name || 'Single'}</div>
                            </div>
                            <!-- Stop propagation to prevent card click from triggering as well -->
                            {#if song.downloadUrl && song.downloadUrl.length > 0}
                                <button class="play-track-button" on:click|stopPropagation={() => playSong(song)} aria-label="Play {song.name}">
                                    <Play size={20} />
                                </button>
                            {/if}
                        </div>
                    {/each}
                </div>
            </section>
        {/if}

        <!-- Top Albums Section -->
        {#if topAlbums && topAlbums.length > 0}
            <section class="top-albums-section">
                <h2>Albums by {artist.name}</h2>
                <div class="albums-grid">
                    {#each topAlbums as album (album.id)}
                        <div
                            class="album-card"
                            on:click={() => handleAlbumClick(album.id)}
                            on:keydown={(e) => handleCardKeyPress(e, album.id, 'album')}
                            role="link"
                            tabindex="0"
                            aria-label="View album {album.name}"
                        >
                            <img
                                src={getImageUrl(album.image)}
                                alt={album.name}
                                class="album-card-image"
                            />
                            <div class="album-card-info">
                                <div class="album-card-title">{album.name}</div>
                                <div class="album-card-year">{album.year}</div>
                            </div>
                        </div>
                    {/each}
                </div>
            </section>
        {/if}

    {:else}
        <div class="loading-error">
            <p>Loading artist details...</p>
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

    .artist-detail-page {
        padding: 24px;
        color: var(--text-base);
        max-width: 1200px;
        margin: 0 auto;
    }

    .artist-header {
        display: flex;
        flex-wrap: wrap;
        gap: 32px;
        align-items: flex-end;
        margin-bottom: 48px;
        background: linear-gradient(to bottom, #1a1a1a, #121212);
        padding: 32px;
        border-radius: 8px;
    }

    .artist-image-wrapper {
        position: relative;
        width: 250px;
        height: 250px;
        border-radius: 50%; /* Make artist image round */
        overflow: hidden;
        box-shadow: 0 4px 60px rgba(0, 0, 0, 0.5);
        flex-shrink: 0;
        transition: transform 0.2s ease-in-out;
        outline: none;
        cursor: pointer;
    }

    .artist-image-wrapper:hover,
    .artist-image-wrapper:focus-visible {
        transform: scale(1.02);
    }

    .artist-image {
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

    .artist-image-wrapper:hover .play-overlay,
    .artist-image-wrapper:focus-visible .play-overlay {
        opacity: 1;
    }

    .play-icon {
        color: var(--primary);
        filter: drop-shadow(0 0 8px rgba(29, 185, 84, 0.6));
    }

    .artist-info {
        flex: 1;
        min-width: 250px;
    }

    .artist-name {
        font-size: 3.5em; /* Larger font for artist name */
        font-weight: bold;
        margin: 0 0 16px 0;
        line-height: 1.2;
        color: var(--text-base);
    }

    .follower-count, .dominant-language {
        font-size: 1.1em;
        color: var(--text-subdued);
        margin-bottom: 8px;
    }

    .artist-bio {
        font-size: 1em;
        color: var(--text-subdued);
        margin-top: 20px;
        max-width: 600px;
        line-height: 1.5;
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

    .top-songs-section, .top-albums-section {
        margin-top: 48px;
        background-color: var(--background-elevated-base);
        padding: 32px;
        border-radius: 8px;
    }

    .top-songs-section h2, .top-albums-section h2 {
        font-size: 2em;
        margin-bottom: 24px;
        color: var(--text-base);
    }

    .tracks-grid, .albums-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 24px;
    }

    /* Styles for song cards (reused from song detail page) */
    .track-card {
        background-color: var(--background-elevated-highlight);
        border-radius: 8px;
        padding: 16px;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        cursor: pointer;
        transition: background-color 0.2s;
        position: relative;
        color: inherit;
        font-family: inherit;
        box-shadow: none;
        width: 100%;
        outline: none;
    }

    .track-card:hover,
    .track-card:focus-visible {
        background-color: #3e3e3e;
    }

    .track-image {
        width: 150px;
        height: 150px;
        object-fit: cover;
        border-radius: 4px;
        margin-bottom: 12px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
    }

    .track-info {
        flex-grow: 1;
        width: 100%;
    }

    .track-title {
        font-weight: bold;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        width: 100%;
        color: var(--text-base);
        margin-bottom: 4px;
    }

    .track-artist {
        font-size: 0.9em;
        color: var(--text-subdued);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        width: 100%;
    }

    .play-track-button {
        position: absolute;
        bottom: 20px;
        right: 20px;
        background-color: var(--primary);
        color: #fff;
        border: none;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 1.2em;
        cursor: pointer;
        opacity: 0;
        transform: translateY(10px);
        transition: opacity 0.3s ease, transform 0.3s ease;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
    }

    .track-card:hover .play-track-button,
    .track-card:focus-visible .play-track-button {
        opacity: 1;
        transform: translateY(0);
    }

    /* Styles for album cards (similar to search results album cards) */
    .album-card {
        background-color: var(--background-elevated-highlight);
        border-radius: 8px;
        padding: 16px;
        transition: background-color 0.2s;
        cursor: pointer;
        outline: none;
    }

    .album-card:hover,
    .album-card:focus-visible {
        background-color: #3e3e3e;
    }

    .album-card-image {
        width: 100%;
        border-radius: 4px;
        margin-bottom: 12px;
        aspect-ratio: 1 / 1;
        object-fit: cover;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
    }

    .album-card-title {
        font-weight: bold;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        color: var(--text-base);
    }

    .album-card-year {
        font-size: 0.9rem;
        color: var(--text-subdued);
        margin-top: 4px;
    }

    .loading-error {
        text-align: center;
        margin-top: 100px;
        font-size: 1.2em;
        color: var(--text-subdued);
    }

    @media (max-width: 768px) {
        .artist-header {
            flex-direction: column;
            align-items: center;
            text-align: center;
        }

        .artist-image-wrapper {
            width: 180px;
            height: 180px;
        }

        .artist-name {
            font-size: 2.5em;
        }

        .tracks-grid, .albums-grid {
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        }
    }
</style>
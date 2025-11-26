<script lang="ts">
    import type { PageData } from './$types.js';
    import { playerStore, type SongForPlayer } from '$lib/stores/playerStore.js';
    import { goto } from '$app/navigation'; // For navigating to other song pages
    import Play from 'lucide-svelte/icons/play'; // Import the Play icon

    export let data: PageData;

    $: song = data.song;
    $: suggestions = data.suggestions;
    $: otherAlbumTracks = data.otherAlbumTracks; // NEW: Get other album tracks from page data

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
        // Assuming the last image in the array is typically the highest quality
        return images[images.length - 1].url;
    }

    // Helper to format duration from seconds to MM:SS (API returns duration in seconds)
    function formatDuration(durationInSeconds: number | null): string {
        if (durationInSeconds === null || isNaN(durationInSeconds)) {
            return '--:--';
        }
        const minutes = Math.floor(durationInSeconds / 60);
        const seconds = Math.floor(durationInSeconds % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    // Reusable function to play any song (main song, suggestion, or other album track)
    function playSong(songToPlay: any) {
        if (songToPlay && songToPlay.downloadUrl && songToPlay.downloadUrl.length > 0) {
            const audioUrl =
                songToPlay.downloadUrl.find((item: DownloadUrlItem) => item.quality === '320kbps')?.url ||
                songToPlay.downloadUrl[songToPlay.downloadUrl.length - 1].url;

            const songForPlayer: SongForPlayer = {
                id: songToPlay.id,
                name: songToPlay.name,
                artistName: songToPlay.artists?.primary?.[0]?.name || 'Unknown Artist',
                albumName: songToPlay.album?.name || 'Unknown Album',
                albumImageUrl: getImageUrl(songToPlay.image),
                audioUrl: audioUrl,
                duration: songToPlay.duration
            };
            playerStore.startPlaying(songForPlayer);
        }
    }

    // Function to handle clicking a suggestion or other album track card to navigate
    function handleTrackClick(trackId: string) {
        goto(`/song/${trackId}`);
    }

    // Handles keyboard events for accessibility on track cards
    function handleTrackKeyPress(event: KeyboardEvent, trackId: string) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleTrackClick(trackId);
        }
    }

    // Reactive statement to update the player store with recommendations
    $: if (suggestions && suggestions.length > 0) {
        const mappedSuggestions: SongForPlayer[] = suggestions.map((s: any) => ({
            id: s.id,
            name: s.name,
            artistName: s.artists?.primary?.[0]?.name || 'Unknown Artist',
            albumName: s.album?.name || 'Unknown Album',
            albumImageUrl: getImageUrl(s.image),
            audioUrl: s.downloadUrl.find((item: DownloadUrlItem) => item.quality === '320kbps')?.url || s.downloadUrl[s.downloadUrl.length - 1].url,
            duration: s.duration
        }));
        playerStore.setRecommendations(mappedSuggestions);
    }
</script>

<div class="song-detail-page">
    {#if song}
        <div class="song-header">
            <!-- Playable Cover Image Section -->
            <div
                class="song-image-wrapper"
                on:click={() => playSong(song)}
                role="button"
                tabindex="0"
                aria-label="Play {song.name}"
            >
                <img src={getImageUrl(song.image)} alt={song.name} class="song-image" />
                <div class="play-overlay">
                    <Play size={48} class="play-icon" />
                </div>
            </div>

            <div class="song-info">
                <p class="song-type">{song.type?.toUpperCase() || 'SONG'}</p>
                <h1 class="song-title">{song.name}</h1>
                {#if song.artists?.primary?.length}
                    <p class="song-artists">
                        {#each song.artists.primary as artist, i}
                            <a href="/artist/{artist.id}" class="artist-link">{artist.name}</a>{#if i < song.artists.primary.length - 1}, {/if}
                        {/each}
                    </p>
                {/if}
                {#if song.album?.name}
                    <p class="song-album">Album: <a href="/album/{song.album.id}" class="album-link">{song.album.name}</a></p>
                {/if}
                <div class="song-meta">
                    {#if song.year}<span class="meta-item">Year: {song.year}</span>{/if}
                    {#if song.language}<span class="meta-item">Language: {song.language}</span>{/if}
                    {#if song.duration !== null}<span class="meta-item">Duration: {formatDuration(song.duration)}</span>{/if}
                    {#if song.playCount !== null}<span class="meta-item">Plays: {song.playCount?.toLocaleString()}</span>{/if}
                </div>
                <div class="action-buttons">
                    <button class="add-button">Add to Playlist</button>
                </div>
            </div>
        </div>

        <!-- NEW: Other Tracks from Album section -->
        {#if otherAlbumTracks && otherAlbumTracks.length > 0}
            <section class="album-tracks-section">
                <h2>More from {song.album?.name || 'this Album'}</h2>
                <div class="tracks-grid">
                    {#each otherAlbumTracks as albumTrack (albumTrack.id)}
                        <div
                            class="track-card"
                            on:click={() => handleTrackClick(albumTrack.id)}
                            on:keydown={(e) => handleTrackKeyPress(e, albumTrack.id)}
                            role="button"
                            tabindex="0"
                            aria-label="View details for {albumTrack.name}"
                        >
                            <img
                                src={getImageUrl(albumTrack.image)}
                                alt={albumTrack.name}
                                class="track-image"
                            />
                            <div class="track-info">
                                <div class="track-title">{albumTrack.name}</div>
                                <div class="track-artist">{albumTrack.artists?.primary?.[0]?.name || 'Unknown Artist'}</div>
                            </div>
                            <button class="play-track-button" on:click|stopPropagation={() => playSong(albumTrack)} aria-label="Play {albumTrack.name}">
                                <Play size={20} />
                            </button>
                        </div>
                    {/each}
                </div>
            </section>
        {/if}

        <!-- Lyrics section -->
        {#if song.hasLyrics && song.lyricsId}
            <section class="lyrics-section">
                <h2>Lyrics</h2>
                <p>Lyrics functionality not yet implemented. (Lyrics ID: {song.lyricsId})</p>
            </section>
        {/if}

        <!-- Suggestions section -->
        {#if suggestions && suggestions.length > 0}
            <section class="suggestions-section">
                <h2>More Like This</h2>
                <div class="suggestions-grid">
                    {#each suggestions as suggestedSong (suggestedSong.id)}
                        <div
                            class="track-card"
                            on:click={() => handleTrackClick(suggestedSong.id)}
                            on:keydown={(e) => handleTrackKeyPress(e, suggestedSong.id)}
                            role="button"
                            tabindex="0"
                            aria-label="View details for {suggestedSong.name}"
                        >
                            <img
                                src={getImageUrl(suggestedSong.image)}
                                alt={suggestedSong.name}
                                class="track-image"
                            />
                            <div class="track-info">
                                <div class="track-title">{suggestedSong.name}</div>
                                <div class="track-artist">{suggestedSong.artists?.primary?.[0]?.name || 'Unknown Artist'}</div>
                            </div>
                            <button class="play-track-button" on:click|stopPropagation={() => playSong(suggestedSong)} aria-label="Play {suggestedSong.name}">
                                <Play size={20} />
                            </button>
                        </div>
                    {/each}
                </div>
            </section>
        {/if}

    {:else}
        <div class="loading-error">
            <p>Loading song details...</p>
        </div>
    {/if}
</div>

<style>
    .song-detail-page {
        padding: 24px;
        color: #fff;
        max-width: 1200px;
        margin: 0 auto;
    }

    .song-header {
        display: flex;
        flex-wrap: wrap;
        gap: 32px;
        align-items: flex-end;
        margin-bottom: 48px;
        background: linear-gradient(to bottom, #1a1a1a, #121212);
        padding: 32px;
        border-radius: 8px;
    }

    .song-image-wrapper {
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

    .song-image-wrapper:hover,
    .song-image-wrapper:focus-visible { /* Add focus-visible for keyboard users */
        transform: scale(1.02);
    }

    .song-image {
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

    .song-image-wrapper:hover .play-overlay,
    .song-image-wrapper:focus-visible .play-overlay {
        opacity: 1; /* Show on hover/focus */
    }

    .play-icon {
        color: #1DB954; /* Spotify green */
        filter: drop-shadow(0 0 8px rgba(29, 185, 84, 0.6));
    }


    .song-info {
        flex: 1;
        min-width: 250px;
    }

    .song-type {
        font-size: 0.9em;
        font-weight: bold;
        color: #b3b3b3;
        margin-bottom: 8px;
    }

    .song-title {
        font-size: 3em;
        font-weight: bold;
        margin: 0 0 16px 0;
        line-height: 1.2;
    }

    .song-artists, .song-album {
        font-size: 1.1em;
        color: #b3b3b3;
        margin-bottom: 8px;
    }

    .artist-link, .album-link {
        color: #fff;
        text-decoration: none;
        font-weight: bold;
    }

    .artist-link:hover, .album-link:hover {
        text-decoration: underline;
    }

    .song-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        font-size: 0.9em;
        color: #b3b3b3;
        margin-top: 16px;
    }

    .meta-item {
        background-color: #282828;
        padding: 4px 12px;
        border-radius: 20px;
    }

    .action-buttons {
        margin-top: 24px;
        display: flex;
        gap: 16px;
    }

    .add-button {
        padding: 12px 24px;
        border-radius: 500px;
        border: none;
        font-size: 1em;
        font-weight: bold;
        cursor: pointer;
        transition: transform 0.2s ease-in-out;
        background-color: #3e3e3e;
        color: #fff;
    }

    .add-button:hover {
        background-color: #535353;
    }

    .lyrics-section, .suggestions-section, .album-tracks-section { /* Added .album-tracks-section */
        margin-top: 48px;
        background-color: #181818;
        padding: 32px;
        border-radius: 8px;
    }

    .lyrics-section h2, .suggestions-section h2, .album-tracks-section h2 { /* Added .album-tracks-section h2 */
        font-size: 2em;
        margin-bottom: 24px;
        color: #fff;
    }

    .suggestions-grid, .tracks-grid { /* Combined for similar styling */
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 24px;
    }

    .track-card { /* Unified styling for suggestion and album track cards */
        background-color: #282828;
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

    .track-image { /* Unified styling for suggestion and album track images */
        width: 150px;
        height: 150px;
        object-fit: cover;
        border-radius: 4px;
        margin-bottom: 12px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
    }

    .track-info { /* Unified styling for suggestion and album track info */
        flex-grow: 1;
        width: 100%;
    }

    .track-title { /* Unified styling for suggestion and album track titles */
        font-weight: bold;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        width: 100%;
        color: #fff;
        margin-bottom: 4px;
    }

    .track-artist { /* Unified styling for suggestion and album track artists */
        font-size: 0.9em;
        color: #b3b3b3;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        width: 100%;
    }

    .play-track-button { /* Unified styling for play buttons on cards */
        position: absolute;
        bottom: 20px;
        right: 20px;
        background-color: #1DB954;
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

    .loading-error {
        text-align: center;
        margin-top: 100px;
        font-size: 1.2em;
        color: #b3b3b3;
    }

    @media (max-width: 768px) {
        .song-header {
            flex-direction: column;
            align-items: center;
            text-align: center;
        }

        .song-image-wrapper {
            width: 200px;
            height: 200px;
        }

        .song-title {
            font-size: 2.5em;
        }

        .suggestions-grid, .tracks-grid {
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        }
    }
</style>
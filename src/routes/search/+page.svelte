<script lang="ts">
    import type { PageData } from './$types.js';
    import { goto } from '$app/navigation'; // Import goto for navigation

    export let data: PageData;

    function handleSongClick(songId: string) {
        goto(`/song/${songId}`);
    }

    // New function to handle album clicks
    function handleAlbumClick(albumId: string) {
        goto(`/album/${albumId}`);
    }
</script>

<div class="search-page">
    <main class="search-results">
        {#if data.error}
            <p class="error-message">{data.error}</p>
        {:else if data.results?.data}
            {@const results = data.results.data}
            {#if results.songs?.results.length || results.artists?.results.length || results.albums?.results.length}
                {#if results.artists?.results.length}
                    <section>
                        <h2>Artists</h2>
                        <div class="grid-container">
                            {#each results.artists.results as artist (artist.id)}
                                <div class="card">
                                    <img
                                        src={artist.image?.[artist.image.length - 1]?.url ||
                                            'https://via.placeholder.com/150'}
                                        alt={artist.title}
                                        class="card-image artist-image"
                                    />
                                    <div class="card-info">
                                        <div class="card-title">{artist.title}</div>
                                        <div class="card-subtitle">Artist</div>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    </section>
                {/if}

                {#if results.albums?.results.length}
                    <section>
                        <h2>Albums</h2>
                        <div class="grid-container">
                            {#each results.albums.results as album (album.id)}
                                <!-- Added click handler for albums -->
                                <div class="card" on:click={() => handleAlbumClick(album.id)} role="link" tabindex="0">
                                    <img
                                        src={album.image?.[album.image.length - 1]?.url ||
                                            'https://via.placeholder.com/150'}
                                        alt={album.title}
                                        class="card-image"
                                    />
                                    <div class="card-info">
                                        <div class="card-title">{album.title}</div>
                                        <div class="card-subtitle">{album.artist}</div>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    </section>
                {/if}

                {#if results.songs?.results.length}
                    <section>
                        <h2>Songs</h2>
                        <div class="song-list">
                            {#each results.songs.results as song, i (song.id)}
                                <!-- Add click handler to navigate to the song page -->
                                <div class="song-item" on:click={() => handleSongClick(song.id)} role="button" tabindex="0">
                                    <span class="song-index">{i + 1}</span>
                                    <img
                                        src={song.image?.[song.image.length - 1]?.url ||
                                            'https://via.placeholder.com/40'}
                                        alt={song.album}
                                        class="song-image"
                                    />
                                    <div class="song-details">
                                        <div class="song-title">{song.title}</div>
                                        <div class="song-artist">{song.primaryArtists}</div>
                                    </div>
                                    <div class="song-album">{song.album}</div>
                                </div>
                            {/each}
                        </div>
                    </section>
                {/if}
            {:else if data.query}
                <div class="no-results">
                    <h3>No results found for "{data.query}"</h3>
                    <p>
                        Please make sure your words are spelled correctly, or use fewer or different keywords.
                    </p>
                </div>
            {/if}
        {:else}
            <div class="prompt">
                <h2>Search Musify</h2>
                <p>Find your favorite songs, artists, and albums.</p>
            </div>
        {/if}
    </main>
</div>

<style>
    .search-page {
        padding: 16px 24px;
        height: 100%;
        overflow-y: auto;
        box-sizing: border-box;
    }

    .search-results h2 {
        margin-top: 32px;
        margin-bottom: 16px;
        color: white; /* Ensure headings are visible */
    }

    .error-message {
        color: #f44336;
    }

    .prompt,
    .no-results {
        text-align: center;
        margin-top: 10vh;
        color: #b3b3b3;
    }

    .prompt h2,
    .no-results h3 {
        color: #fff;
        font-size: 1.5rem;
        margin-bottom: 8px;
    }

    .grid-container {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 24px;
    }

    .card {
        background-color: #181818;
        border-radius: 8px;
        padding: 16px;
        transition: background-color 0.2s;
        cursor: pointer; /* Added for clickable cards */
    }

    .card:hover {
        background-color: #282828;
    }

    .card-image {
        width: 100%;
        border-radius: 4px;
        margin-bottom: 12px;
        aspect-ratio: 1 / 1;
        object-fit: cover;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
    }

    .artist-image {
        border-radius: 50%;
    }

    .card-title {
        font-weight: bold;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        color: white; /* Ensure titles are visible */
    }

    .card-subtitle {
        font-size: 0.9rem;
        color: #b3b3b3;
        margin-top: 4px;
    }

    .song-list {
        display: flex;
        flex-direction: column;
    }

    .song-item {
        display: grid;
        grid-template-columns: 24px 40px 1fr 1fr;
        align-items: center;
        gap: 16px;
        padding: 8px 16px;
        border-radius: 4px;
        transition: background-color 0.2s;
        cursor: pointer; /* Add cursor pointer to indicate it's clickable */
    }

    .song-item:hover {
        background-color: rgba(255, 255, 255, 0.1);
    }

    .song-index {
        color: #b3b3b3;
        text-align: right;
    }

    .song-image {
        width: 40px;
        height: 40px;
        object-fit: cover;
    }

    .song-details {
        display: flex;
        flex-direction: column;
    }

    .song-title {
        color: #fff;
    }

    .song-artist,
    .song-album {
        color: #b3b3b3;
        font-size: 0.9rem;
    }
</style>
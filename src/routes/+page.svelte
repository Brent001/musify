<script lang="ts">
    import type { PageData } from './$types.js';
    import { goto } from '$app/navigation'; // Import goto for navigation

    export let data: PageData;

    $: playlists = data.playlists;

    // Helper to get the URL of the highest quality image
    function getImageUrl(images: { quality: string; url: string }[] | undefined): string {
        if (!images || images.length === 0) {
            return 'https://via.placeholder.com/150?text=Playlist';
        }
        // Assuming the last image in the array is typically the highest quality
        return images[images.length - 1].url;
    }

    // Function to navigate to the playlist detail page
    function handlePlaylistClick(playlistId: string) {
        goto(`/playlist/${playlistId}`);
    }
</script>

<div class="py-6">
    <section class="mb-8">
        <h2 class="text-2xl font-bold mb-4">Good Afternoon</h2>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
            {#each playlists.slice(0, 6) as playlist (playlist.id)}
                <div
                    class="group flex items-center bg-white/10 rounded overflow-hidden cursor-pointer hover:bg-white/20 transition-colors"
                    on:click={() => handlePlaylistClick(playlist.id)}
                    role="link"
                    tabindex="0"
                    aria-label="Go to playlist {playlist.name}"
                >
                    <img src={getImageUrl(playlist.image)} alt={playlist.name} class="w-20 h-20 object-cover shadow-lg" />
                    <div class="font-semibold ml-4">{playlist.name}</div>
                </div>
            {/each}
        </div>
        {#if playlists.length === 0}
            <p class="text-text-subdued">No playlists to show right now.</p>
        {/if}
    </section>

    <section class="mb-8">
        <h2 class="text-2xl font-bold mb-4">Your top mixes</h2>
        <div
            class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6"
        >
            {#each playlists as playlist (playlist.id)}
                <div
                    class="p-4 bg-background-highlight hover:bg-background-elevated-base transition-colors rounded-md cursor-pointer"
                    on:click={() => handlePlaylistClick(playlist.id)}
                    role="link"
                    tabindex="0"
                    aria-label="Go to playlist {playlist.name}"
                >
                    <img src={getImageUrl(playlist.image)} alt={playlist.name} class="w-full aspect-square object-cover rounded-md mb-4 shadow-lg" />
                    <div class="font-bold truncate">{playlist.name}</div>
                    <p class="text-sm text-text-subdued line-clamp-2">{playlist.description || 'No description available.'}</p>
                </div>
            {/each}
        </div>
    </section>
</div>

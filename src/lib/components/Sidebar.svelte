<script>
    import Home from 'lucide-svelte/icons/home';
    import Search from 'lucide-svelte/icons/search';
    import Library from 'lucide-svelte/icons/library';
</script>

<nav class="bg-black flex flex-col gap-2 h-full">
    <div class="bg-background-highlight rounded-lg p-2">
        <ul class="flex flex-col">
            <li>
                <a
                    href="/"
                    class="flex items-center gap-5 text-text-subdued hover:text-text-base font-semibold transition-colors p-2"
                >
                    <Home /> Home
                </a>
            </li>
            <li>
                <a
                    href="/search"
                    class="flex items-center gap-5 text-text-subdued hover:text-text-base font-semibold transition-colors p-2"
                >
                    <Search /> Search
                </a>
            </li>
        </ul>
    </div>
    <div class="bg-background-highlight rounded-lg p-2 pt-0 flex-1 flex flex-col">
        <div class="p-2">
            <button class="flex items-center gap-5 text-text-subdued hover:text-text-base font-semibold w-full">
                <Library />
                <span>Your Library</span>
            </button>
        </div>
        <div class="overflow-y-auto mt-4">
            <div class="flex gap-2 mb-4 px-2">
                <span
                    class="bg-background-elevated-base text-sm text-text-base py-1 px-3 rounded-full cursor-pointer"
                >
                    Playlists
                </span>
                <span
                    class="bg-background-elevated-base text-sm text-text-base py-1 px-3 rounded-full cursor-pointer"
                >
                    Artists
                </span>
            </div>
            <ul class="flex flex-col gap-3 p-2">
                <li><a href="/" class="text-text-subdued hover:text-text-base text-sm">Liked Songs</a></li>
                <li>
                    <a href="/" class="text-text-subdued hover:text-text-base text-sm">My Playlist #1</a>
                </li>
            </ul>
        </div>
    </div>
</nav>

<style>
    .sidebar {
        background-color: #000;
        padding: 8px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        height: 100%;
        overflow-y: auto;
    }

    .sidebar__section {
        background-color: var(--background-highlight);
        border-radius: 8px;
        padding: 8px 12px;
    }

    ul {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    li a,
    .library__header button {
        display: flex;
        align-items: center;
        gap: 20px;
        color: var(--text-subdued);
        text-decoration: none;
        font-weight: 600;
        padding: 8px;
        transition: color 0.2s ease;
    }

    li a:hover,
    .library__header button:hover {
        color: var(--text-base);
    }

    .library__header button {
        background: none;
        border: none;
        width: 100%;
        font-size: 1rem;
        cursor: pointer;
    }

    .sidebar__library {
        flex: 1;
        display: flex;
        flex-direction: column;
    }

    .library__content {
        overflow-y: auto;
        margin-top: 1rem;
    }

    .chip-container {
        display: flex;
        gap: 8px;
        margin-bottom: 16px;
    }

    .chip {
        background-color: var(--background-elevated-base);
        color: var(--text-base);
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.875rem;
        cursor: pointer;
    }

    .playlist-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .playlist-list a {
        font-weight: 400;
        font-size: 0.9rem;
        padding: 4px;
    }
</style>
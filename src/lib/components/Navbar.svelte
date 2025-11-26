<script lang="ts">
    import User from 'lucide-svelte/icons/user';
    import Search from 'lucide-svelte/icons/search';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';

    let inputValue = $page.url.searchParams.get('query') || '';
    let isInputFocused = false; // Flag to track if the search input is currently focused
    let searchInputRef: HTMLInputElement; // Reference to the search input element

    // State to explicitly control if the search box is active in the navbar when NOT on /search route
    let navbarSearchActive = false;

    // The search input form is shown if we are on the /search route, OR if it's explicitly activated in the navbar
    $: showSearchInputForm = $page.url.pathname.startsWith('/search') || navbarSearchActive;

    // Auto-focus the input when it becomes visible
    $: {
        if (showSearchInputForm && searchInputRef && !isInputFocused) {
            searchInputRef.focus();
        }
    }

    // Sync inputValue with URL query when not focused, preventing loss of typing
    $: {
        const urlQuery = $page.url.searchParams.get('query') || '';
        if (!isInputFocused && urlQuery !== inputValue) {
            inputValue = urlQuery;
        }
    }

    function handleFocus() {
        isInputFocused = true;
    }

    function handleBlur() {
        isInputFocused = false;
        // If the input loses focus and is empty, and we are NOT on the /search page,
        // hide the search box again.
        if (inputValue.trim() === '' && !$page.url.pathname.startsWith('/search')) {
            navbarSearchActive = false;
        }
    }

    function handleSearch() {
        const trimmedValue = inputValue.trim();
        if (trimmedValue) {
            goto(`/search?query=${encodeURIComponent(trimmedValue)}`);
            // Once a search is performed, we navigate to /search, so navbarSearchActive
            // can be reset, as /search route will keep the form visible.
            navbarSearchActive = false;
        } else if ($page.url.pathname.startsWith('/search')) {
            // If on search page and input is cleared, navigate to base search page to clear results.
            // The search form should remain visible because we are still on the /search route.
            goto('/search');
        } else {
            // If on a non-search page and input is cleared, just hide the search box again.
            navbarSearchActive = false;
        }
    }
</script>

<header
    class="sticky top-0 z-30 flex justify-between items-center px-6 min-h-[64px] bg-black/70 backdrop-blur-sm"
    style="backdrop-filter: blur(8px);"
>
    <div class="flex items-center gap-2 flex-1 relative z-40">
        {#if showSearchInputForm}
            <form on:submit|preventDefault={handleSearch} class="relative max-w-xs w-full">
                <button
                    type="submit"
                    class="absolute left-3 top-1/2 -translate-y-1/2 bg-transparent border-none p-0 text-gray-500 cursor-pointer"
                    aria-label="Search"
                >
                    <Search size={20} />
                </button>
                <input
                    type="text"
                    placeholder="What do you want to listen to?"
                    bind:value={inputValue}
                    bind:this={searchInputRef}
                    on:focus={handleFocus}
                    on:blur={handleBlur}
                    class="w-full bg-white text-black placeholder:text-gray-500 rounded-full py-2 pl-10 pr-4 text-sm font-semibold focus:outline-none focus:ring-2 ring-white"
                />
            </form>
        {:else}
            <button
                on:click={() => (navbarSearchActive = true)}
                class="bg-background-elevated-base rounded-full p-2 text-text-subdued hover:text-text-base transition-colors flex items-center gap-2 font-semibold"
            >
                <Search size={20} />
                <span class="sr-only md:not-sr-only">Search</span>
            </button>
        {/if}
    </div>

    <div class="flex items-center gap-4 relative z-40">
        <button
            class="hidden md:block bg-white text-black font-semibold rounded-full py-2 px-4 text-sm hover:scale-105"
        >
            Upgrade
        </button>
        <button
            class="bg-black/70 text-white rounded-full p-2 flex items-center gap-2 text-sm font-semibold"
        >
            <User /> <span class="hidden md:inline">Your Name</span>
        </button>
    </div>
</header>

<style>
    /* ...existing style... */
</style>
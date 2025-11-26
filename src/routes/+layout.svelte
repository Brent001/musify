<script lang="ts">
    import './layout.css';
    import Sidebar from '$lib/components/Sidebar.svelte';
    import Player from '$lib/components/Player.svelte';
    import Navbar from '$lib/components/Navbar.svelte';
</script>

<div class="app-layout">
    <div class="sidebar-layout">
        <Sidebar />
    </div>
    <main class="main-layout">
        <Navbar />
        <div class="p-6">
            <slot />
        </div>
    </main>
    <div class="player-layout">
        <Player />
    </div>
</div>

<style>
    :global(body) {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu',
            'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        background-color: black;
        color: #fff;
    }

    .app-layout {
        height: 100vh;
        display: grid;
        grid-template-rows: 1fr auto;
        grid-template-columns: auto 1fr;
        grid-template-areas:
            'sidebar main'
            'player player';
        gap: 8px;
        padding: 8px;
        overflow: hidden;
        box-sizing: border-box;
    }

    .sidebar-layout {
        grid-area: sidebar;
        width: 300px;
        overflow: hidden;
    }

    .main-layout {
        grid-area: main;
        overflow-y: auto;
        background-color: #121212;
        border-radius: 8px;
    }

    .player-layout {
        grid-area: player;
    }

    @media (max-width: 768px) {
        .app-layout {
            grid-template-columns: 1fr;
            grid-template-areas:
                'main'
                'player';
            padding: 0;
            gap: 0;
        }

        .sidebar-layout {
            display: none;
        }
    }
</style>

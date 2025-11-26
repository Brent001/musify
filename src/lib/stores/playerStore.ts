import { writable } from 'svelte/store';

export type SongForPlayer = {
    id: string;
    name: string;
    artistName: string;
    albumName: string; // Added albumName to SongForPlayer
    albumImageUrl: string;
    audioUrl: string;
    duration: number; // in seconds
};

export type PlayerState = {
    currentSong: SongForPlayer | null;
    isPlaying: boolean;
    progress: number; // current playback position in seconds
    volume: number; // 0-1
    recommendations: SongForPlayer[]; // List of all loaded recommendations
    isShuffling: boolean; // Is shuffle mode active?
    shuffledQueue: SongForPlayer[]; // The currently shuffled list of songs
    shuffledQueueIndex: number; // Current index in the shuffled queue
};

const initialPlayerState: PlayerState = {
    currentSong: null,
    isPlaying: false,
    progress: 0,
    volume: 1, // default to full volume
    recommendations: [],
    isShuffling: false,
    shuffledQueue: [],
    shuffledQueueIndex: -1,
};

// Helper function for Fisher-Yates (Knuth) shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array]; // Create a copy to avoid mutating original
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

const player = writable<PlayerState>(initialPlayerState);

// The `playerStore` object will now expose all the actions.
export const playerStore = {
    subscribe: player.subscribe,

    startPlaying: (song: SongForPlayer) => {
        player.update(state => ({
            ...state,
            currentSong: song,
            isPlaying: true,
            progress: 0, // Reset progress when a new song starts
            // When a new song is explicitly started, disable shuffle and clear its queue
            isShuffling: false,
            shuffledQueue: [],
            shuffledQueueIndex: -1
        }));
    },

    pausePlaying: () => {
        player.update(state => ({ ...state, isPlaying: false }));
    },

    resumePlaying: () => {
        player.update(state => ({ ...state, isPlaying: true }));
    },

    updateProgress: (progress: number) => {
        player.update(state => ({ ...state, progress }));
    },

    setVolume: (volume: number) => {
        player.update(state => ({ ...state, volume }));
    },

    // New: Set a list of recommendations (e.g., from a song detail page)
    setRecommendations: (songs: SongForPlayer[]) => {
        player.update(state => {
            console.log(`playerStore: Received ${songs.length} new recommendations.`);
            // If shuffle is active, re-shuffle the new recommendations
            if (state.isShuffling) {
                const newShuffledQueue = shuffleArray(songs);
                return {
                    ...state,
                    recommendations: songs,
                    shuffledQueue: newShuffledQueue,
                    shuffledQueueIndex: -1 // Reset index, next auto-play will start from beginning
                };
            }
            return {
                ...state,
                recommendations: songs
            };
        });
    },

    // New: Toggle shuffle mode
    toggleShuffle: () => {
        player.update(state => {
            const newIsShuffling = !state.isShuffling;
            let newShuffledQueue: SongForPlayer[] = [];
            let newShuffledQueueIndex: number = -1;

            if (newIsShuffling && state.recommendations.length > 0) {
                newShuffledQueue = shuffleArray(state.recommendations);
                newShuffledQueueIndex = 0; // Start from the beginning of the shuffled list
                console.log('playerStore: Shuffle enabled. Shuffled queue created.');
            } else {
                console.log('playerStore: Shuffle disabled.');
            }

            return {
                ...state,
                isShuffling: newIsShuffling,
                shuffledQueue: newShuffledQueue,
                shuffledQueueIndex: newShuffledQueueIndex
            };
        });
    },

    // New: Play the next song from the shuffled queue
    playNextShuffledSong: () => {
        player.update(state => {
            if (!state.isShuffling || state.shuffledQueue.length === 0) {
                console.log('playerStore: Not in shuffle mode or shuffled queue is empty. Stopping playback.');
                return { ...state, isPlaying: false, progress: 0 }; // Stop playback
            }

            let nextIndex = state.shuffledQueueIndex + 1;
            // If end of queue, re-shuffle and loop back to start
            if (nextIndex >= state.shuffledQueue.length) {
                console.log('playerStore: End of shuffled queue reached. Re-shuffling recommendations.');
                // Re-shuffle original recommendations to ensure a fresh set
                state.shuffledQueue = shuffleArray(state.recommendations);
                nextIndex = 0; // Start from the beginning of the newly shuffled list
            }

            const nextSong = state.shuffledQueue[nextIndex];
            if (nextSong) {
                console.log(`playerStore: Playing next shuffled song: ${nextSong.name}`);
                return {
                    ...state,
                    currentSong: nextSong,
                    isPlaying: true, // Auto-play next song
                    progress: 0,
                    shuffledQueueIndex: nextIndex
                };
            } else {
                console.log('playerStore: No next song available in shuffled queue after re-shuffle. Stopping playback.');
                return { ...state, isPlaying: false, progress: 0, shuffledQueueIndex: -1 };
            }
        });
    }
};
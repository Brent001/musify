<script lang="ts">
    import Play from 'lucide-svelte/icons/play';
    import Pause from 'lucide-svelte/icons/pause';
    import SkipBack from 'lucide-svelte/icons/skip-back';
    import SkipForward from 'lucide-svelte/icons/skip-forward';
    import Mic2 from 'lucide-svelte/icons/mic-2';
    import ListMusic from 'lucide-svelte/icons/list-music';
    import Laptop2 from 'lucide-svelte/icons/laptop-2'; // Used to toggle EQ
    import Volume2 from 'lucide-svelte/icons/volume-2';
    import VolumeX from 'lucide-svelte/icons/volume-x'; // For muted state
    import Shuffle from 'lucide-svelte/icons/shuffle'; // Import Shuffle icon
    import Repeat from 'lucide-svelte/icons/repeat'; // Import Repeat icon for loop all
    import Repeat1 from 'lucide-svelte/icons/repeat-1'; // Import Repeat1 icon for loop one

    import { onMount, onDestroy } from 'svelte';
    import Eq from './Eq.svelte'; // Import the Eq component

    // Ensure PlayerState and SongForPlayer are exported from here
    import { playerStore, type PlayerState, type SongForPlayer } from '$lib/stores/playerStore';

    let audioElement: HTMLAudioElement; // Reference to the HTMLAudioElement
    let currentSong: SongForPlayer | null = $playerStore.currentSong; // Allow null for when no song is playing
    let isPlaying: boolean = $playerStore.isPlaying;
    let progress: number = $playerStore.progress;
    let volume: number = $playerStore.volume;
    let duration: number = 0; // Duration of the current song
    let isShuffling: boolean = $playerStore.isShuffling; // Bind to shuffle state from store
    let loopMode: 'none' | 'all' | 'one' = $playerStore.loopMode; // Bind to loop state from store

    // Web Audio API related variables (now owned by Player.svelte)
    let audioContext: AudioContext;
    let sourceNode: MediaElementAudioSourceNode;
    let masterGainNode: GainNode; // Overall volume control for Web Audio API

    // EQ related nodes and state (moved from Eq.svelte)
    let filterNodes: BiquadFilterNode[] = [];
    const bands = [
        { frequency: 60, type: 'lowshelf', q: 0.7, gain: 0 },   // Bass
        { frequency: 170, type: 'peaking', q: 1.0, gain: 0 },   // Low Mid
        { frequency: 350, type: 'peaking', q: 1.0, gain: 0 },   // Mid
        { frequency: 1000, type: 'peaking', q: 1.0, gain: 0 },  // Upper Mid
        { frequency: 3000, type: 'peaking', q: 1.0, gain: 0 },  // Presence
        { frequency: 8000, type: 'highshelf', q: 0.7, gain: 0 } // Treble
    ] as const;
    let eqGains: number[] = bands.map(b => b.gain); // Initial gains for the EQ filters

    // Impulse Response Reverb (Convolver) related nodes and state
    let convolverNode: ConvolverNode;
    let convolverDryGainNode: GainNode; // Controls the dry signal level for the convolver path
    let convolverWetGainNode: GainNode; // Controls the wet (convolver) signal level
    let impulseResponseBuffer: AudioBuffer | null = null;
    let convolverEnabled: boolean = false; // Renamed from reverbEnabled
    let convolverMix: number = 0.3; // Renamed from reverbMix

    // New state for IR file selection
    let availableIrs: string[] = []; // List of public URLs for IR files
    let selectedIrUrl: string | null = null; // Currently selected IR file URL

    // New Generic Reverb Nodes and State
    let genericReverbEnabled: boolean = false;
    let genericReverbAmount: number = 0.2; // A general amount for the reverb effect (0.0 to 1.0)
    let genericReverbDelay: DelayNode;
    let genericReverbFeedbackGain: GainNode; // For feedback loop
    let genericReverbOutputGain: GainNode; // To control this reverb's final output level
    let genericReverbType: string = 'hall'; // Default to 'hall', ensure it's `string` to match Eq.svelte
    let genericReverbFilterNode: BiquadFilterNode; // Filter for the generic reverb feedback loop

    // Analyser for potential future visualization (still present)
    let analyserNode: AnalyserNode;

    let showEq: boolean = false; // State to toggle EQ UI visibility

    // --- Local Storage for Settings ---
    const LOCAL_STORAGE_KEY = 'musify-audio-settings';

    function loadSettings() {
        if (typeof window !== 'undefined' && window.localStorage) {
            console.log('Attempting to load settings...');
            const storedSettings = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (storedSettings) {
                try {
                    console.log('Raw stored settings:', storedSettings);
                    const settings = JSON.parse(storedSettings);
                    if (settings.eqGains) {
                        eqGains = settings.eqGains;
                        console.log('Loaded eqGains:', eqGains);
                    }
                    if (typeof settings.convolverEnabled === 'boolean') {
                        convolverEnabled = settings.convolverEnabled;
                        console.log('Loaded convolverEnabled:', convolverEnabled);
                    }
                    if (typeof settings.convolverMix === 'number') {
                        convolverMix = settings.convolverMix;
                        console.log('Loaded convolverMix:', convolverMix);
                    }
                    if (typeof settings.selectedIrUrl === 'string' || settings.selectedIrUrl === null) {
                        selectedIrUrl = settings.selectedIrUrl;
                        console.log('Loaded selectedIrUrl:', selectedIrUrl);
                    }
                    if (typeof settings.genericReverbEnabled === 'boolean') {
                        genericReverbEnabled = settings.genericReverbEnabled;
                        console.log('Loaded genericReverbEnabled:', genericReverbEnabled);
                    }
                    if (typeof settings.genericReverbAmount === 'number') {
                        genericReverbAmount = settings.genericReverbAmount;
                        console.log('Loaded genericReverbAmount:', genericReverbAmount);
                    }
                    if (typeof settings.genericReverbType === 'string') {
                        genericReverbType = settings.genericReverbType;
                        console.log('Loaded genericReverbType:', genericReverbType);
                    }
                    if (typeof settings.loopMode === 'string') {
                        loopMode = settings.loopMode as typeof loopMode;
                        console.log('Loaded loopMode:', loopMode);
                    }
                    if (typeof settings.isShuffling === 'boolean') {
                        isShuffling = settings.isShuffling;
                        console.log('Loaded isShuffling:', isShuffling);
                    }
                    console.log('Player.svelte: Loaded settings from localStorage.', settings);
                } catch (e) {
                    console.error('Player.svelte: Failed to parse settings from localStorage:', e);
                }
            } else {
                console.log('Player.svelte: No settings found in localStorage. Using defaults.');
                // Explicitly set all controllable states to their default/inactive state
                isShuffling = false;
                loopMode = 'none';
                eqGains = bands.map(b => b.gain); // Reset to initial flat if no settings
                convolverEnabled = false;
                convolverMix = 0.3; // Default mix
                selectedIrUrl = null; // No IR selected by default
                genericReverbEnabled = false;
                genericReverbAmount = 0.2; // Default generic reverb amount
                genericReverbType = 'hall'; // Default generic reverb type
            }
        }
    }

    function saveSettings() {
        if (typeof window !== 'undefined' && window.localStorage) {
            const settingsToSave = {
                eqGains: [...eqGains], // Use spread to ensure reactivity if array reference isn't changed elsewhere
                convolverEnabled,
                convolverMix,
                selectedIrUrl,
                genericReverbEnabled,
                genericReverbAmount,
                genericReverbType,
                loopMode,
                isShuffling,
            };
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settingsToSave));
            console.log('Player.svelte: Settings saved to localStorage.', settingsToSave);
        }
    }
    // --- End Local Storage ---

    // Function to configure generic reverb based on type
    function configureGenericReverb(type: string) {
        if (!genericReverbDelay || !genericReverbFeedbackGain || !genericReverbFilterNode) {
            console.warn('Generic reverb nodes not initialized yet for configuration.');
            return;
        }

        // Reset filter gain for types that don't use it
        genericReverbFilterNode.gain.value = 0;

        switch (type) {
            case 'hall':
                genericReverbDelay.delayTime.value = 0.4; // Longer initial delay
                genericReverbFilterNode.type = 'lowpass';
                genericReverbFilterNode.frequency.value = 8000; // Bright hall, some high-end damping
                genericReverbFilterNode.Q.value = 0.5;
                break;
            case 'plate':
                genericReverbDelay.delayTime.value = 0.05; // Shorter, denser initial delay
                genericReverbFilterNode.type = 'highpass'; // More metallic/bright
                genericReverbFilterNode.frequency.value = 1000;
                genericReverbFilterNode.Q.value = 0.7;
                break;
            case 'room':
                genericReverbDelay.delayTime.value = 0.2; // Medium delay
                genericReverbFilterNode.type = 'lowpass';
                genericReverbFilterNode.frequency.value = 6000; // More damping than hall
                genericReverbFilterNode.Q.value = 0.5;
                break;
            case 'cathedral':
                genericReverbDelay.delayTime.value = 0.7; // Very long initial delay
                genericReverbFilterNode.type = 'lowpass';
                genericReverbFilterNode.frequency.value = 4000; // Heavy damping for vast space
                genericReverbFilterNode.Q.value = 0.3;
                break;
            case 'spring': // Approximate spring reverb characteristics
                genericReverbDelay.delayTime.value = 0.02; // Very short delay
                genericReverbFilterNode.type = 'peaking'; // Emphasize specific frequencies for a "boingy" sound
                genericReverbFilterNode.frequency.value = 3000; // Peak frequency
                genericReverbFilterNode.gain.value = 6; // Boost at this frequency
                genericReverbFilterNode.Q.value = 8; // Narrow Q for resonance
                break;
            default: // Default to hall if type is unrecognized
                genericReverbDelay.delayTime.value = 0.4;
                genericReverbFilterNode.type = 'lowpass';
                genericReverbFilterNode.frequency.value = 8000;
                genericReverbFilterNode.Q.value = 0.5;
                break;
        }
        console.log(`Player.svelte: Generic reverb type set to "${type}" with delay: ${genericReverbDelay.delayTime.value.toFixed(2)}s`);
    }

    // Function to load the impulse response audio file (now in Player.svelte)
    async function loadImpulseResponse(irUrl: string | null) {
        if (!irUrl || !audioContext) {
            impulseResponseBuffer = null;
            if (convolverNode) convolverNode.buffer = null; // Clear existing buffer
            console.log('Player.svelte: No IR URL provided or audioContext not ready. Clearing convolver buffer.');
            updateEffectsConnections(); // Update connections to reflect no reverb
            return;
        }

        try {
            console.log(`Player.svelte: Loading impulse response from ${irUrl}...`);
            const response = await fetch(irUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            impulseResponseBuffer = await audioContext.decodeAudioData(arrayBuffer);
            if (convolverNode) {
                convolverNode.buffer = impulseResponseBuffer;
                console.log(`Player.svelte: Impulse response for ${irUrl} loaded and set.`);
                updateEffectsConnections(); // Re-evaluate connections after buffer loads
            }
        } catch (error) {
            console.error(`Player.svelte: Error loading impulse response from ${irUrl}:`, error);
            impulseResponseBuffer = null;
            if (convolverNode) convolverNode.buffer = null;
            updateEffectsConnections(); // Update connections to reflect error
        }
    }

    // Function to manage all effects connections based on states
    function updateEffectsConnections() {
        if (!convolverNode || !convolverDryGainNode || !convolverWetGainNode ||
            !genericReverbDelay || !genericReverbFeedbackGain || !genericReverbOutputGain || !genericReverbFilterNode) return;

        // --- Convolver Reverb (IR) Logic ---
        if (convolverEnabled && impulseResponseBuffer && convolverNode.buffer) {
            convolverWetGainNode.gain.value = convolverMix;
            convolverDryGainNode.gain.value = 1 - convolverMix; // Blend dry/wet for convolver
        } else {
            convolverWetGainNode.gain.value = 0; // Disable wet signal
            convolverDryGainNode.gain.value = 1; // Full dry signal if convolver is off
        }

        // --- Generic Reverb Logic ---
        if (genericReverbEnabled) {
            genericReverbOutputGain.gain.value = genericReverbAmount; // Control overall output level of generic reverb
            genericReverbFeedbackGain.gain.value = genericReverbAmount * 0.7; // Tie feedback to amount, less than 1 to prevent runaway
        } else {
            genericReverbOutputGain.gain.value = 0; // Disable generic reverb output
            genericReverbFeedbackGain.gain.value = 0; // Stop feedback in delay loop
        }
    }

    onMount(async () => {
        // Load settings from localStorage first
        loadSettings();

        // Initialize AudioContext
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        console.log('Player.svelte onMount: AudioContext initialized. State:', audioContext.state);

        // Attempt to resume AudioContext immediately if suspended (required by many browsers for autoplay)
        if (audioContext.state === 'suspended') {
            audioContext.resume().then(() => {
                console.log('Player.svelte onMount: AudioContext resumed after initial suspend.');
            }).catch(e => console.error('Player.svelte onMount: Error resuming AudioContext:', e));
        }

        // Create a MediaElementSourceNode from the audio element
        sourceNode = audioContext.createMediaElementSource(audioElement);
        console.log('Player.svelte onMount: MediaElementAudioSourceNode created.');
        console.log('Player.svelte onMount: audioElement crossorigin status:', audioElement.crossOrigin);

        // Create EQ filter nodes
        filterNodes = bands.map((band, i) => {
            const filter = audioContext.createBiquadFilter();
            filter.type = band.type as BiquadFilterType;
            filter.frequency.value = band.frequency;
            filter.Q.value = band.q;
            filter.gain.value = eqGains[i]; // Set initial gain from state (which is loaded from localStorage)
            console.log(`Player.svelte onMount: Created filter for ${band.frequency}Hz (${band.type}) with gain ${eqGains[i]}.`);
            return filter;
        });

        // Create ConvolverNode and its Dry/Wet GainNodes
        convolverNode = audioContext.createConvolver();
        convolverDryGainNode = audioContext.createGain();
        convolverWetGainNode = audioContext.createGain();
        console.log('Player.svelte onMount: Convolver and its Dry/Wet GainNodes created.');

        // Create Generic Reverb Nodes (simple feedback delay)
        genericReverbDelay = audioContext.createDelay(1.0); // 1 second max delay
        genericReverbFeedbackGain = audioContext.createGain();
        genericReverbOutputGain = audioContext.createGain();
        genericReverbFilterNode = audioContext.createBiquadFilter(); // Initialize the filter node
        console.log('Player.svelte onMount: Generic Reverb (Delay, Feedback Gain, Output Gain, Filter) created.');

        // Configure generic reverb with loaded type
        configureGenericReverb(genericReverbType); // Call to set initial parameters based on loaded type

        // Create AnalyserNode and Master Gain Node
        analyserNode = audioContext.createAnalyser();
        analyserNode.fftSize = 256;
        masterGainNode = audioContext.createGain(); // Overall volume control for Web Audio API
        masterGainNode.gain.value = volume; // Set initial volume from store
        console.log('Player.svelte onMount: Analyser and Master Gain Node created.');

        // --- Fetch available IR files ---
        try {
            const response = await fetch('/api/irs');
            if (!response.ok) throw new Error('Failed to fetch IR list');
            availableIrs = await response.json();
            console.log('Player.svelte onMount: Available IRs:', availableIrs);
            // If selectedIrUrl was loaded from localStorage, ensure it's in availableIrs
            if (selectedIrUrl && !availableIrs.includes(selectedIrUrl)) {
                 console.warn(`Player.svelte onMount: Stored IR URL (${selectedIrUrl}) not found in available IRs. Clearing selection.`);
                 selectedIrUrl = null; // Clear if not available
            } else if (!selectedIrUrl && availableIrs.length > 0) {
                selectedIrUrl = availableIrs[0]; // If no IR was selected, default to the first available
                console.log('Player.svelte onMount: Defaulting selected IR to first available:', selectedIrUrl);
            }
        } catch (error) {
            console.error('Player.svelte onMount: Error fetching available IRs:', error);
        }

        // Set initial effects states
        updateEffectsConnections(); // Initialize all dry/wet/reverb gains

        // --- Establish the FULL and PERMANENT audio graph ---
        // 1. Source -> EQ Chain
        let currentAudioNode: AudioNode = sourceNode;
        if (filterNodes.length > 0) {
            currentAudioNode.connect(filterNodes[0]);
            for (let i = 0; i < filterNodes.length - 1; i++) {
                filterNodes[i].connect(filterNodes[i+1]);
            }
            currentAudioNode = filterNodes[filterNodes.length - 1]; // Output of EQ chain
            console.log('Player.svelte onMount: EQ chain connected.');
        } else {
            console.log('Player.svelte onMount: No EQ filters configured, sourceNode connects directly to next stage.');
        }

        // 2. EQ Chain Output -> Split into multiple paths (Convolver dry/wet, Generic Reverb)
        currentAudioNode.connect(convolverDryGainNode); // Dry path for convolver mix
        currentAudioNode.connect(convolverNode);       // Wet path for convolver
        currentAudioNode.connect(genericReverbDelay);  // Input for generic reverb
        console.log('Player.svelte onMount: EQ output branched to Convolver dry/wet and Generic Reverb.');

        // Set up generic reverb feedback loop (with filter in the loop)
        genericReverbDelay.connect(genericReverbFeedbackGain);
        genericReverbFeedbackGain.connect(genericReverbFilterNode); // Feedback gain -> Filter
        genericReverbFilterNode.connect(genericReverbDelay); // Filter -> Delay (completes loop)
        genericReverbDelay.connect(genericReverbOutputGain); // Connect delay output to its output gain

        // 3. All effect paths -> Analyser -> Master Gain -> Destination
        convolverDryGainNode.connect(analyserNode);   // Convolver dry path
        convolverNode.connect(convolverWetGainNode); // Convolver feeds its wet gain
        convolverWetGainNode.connect(analyserNode);  // Convolver wet path
        genericReverbOutputGain.connect(analyserNode); // Generic reverb path

        analyserNode.connect(masterGainNode); // Analyser feeds into master volume
        masterGainNode.connect(audioContext.destination); // Master volume feeds to speakers
        console.log('Player.svelte onMount: Full audio graph (Source -> EQ -> (Convolver dry/wet + Generic Reverb) -> Analyser -> Master Gain -> Destination) established.');

        // Ensure the audio element's own volume is always maxed, so we control all volume via masterGainNode
        audioElement.volume = 1;
        console.log('Player.svelte onMount: audioElement.volume set to 1.');

        // Ensure the audioContext is resumed on user interaction (required by many browsers)
        const resumeAudioContext = () => {
            if (audioContext.state === 'suspended') {
                audioContext.resume().then(() => {
                    console.log('Player.svelte: AudioContext resumed by user interaction.');
                }).catch(e => console.error('Player.svelte: Error resuming AudioContext on user interaction:', e));
            }
        };
        document.addEventListener('click', resumeAudioContext);
        document.addEventListener('keydown', resumeAudioContext);

        onDestroy(() => {
            document.removeEventListener('click', resumeAudioContext);
            document.removeEventListener('keydown', resumeAudioContext);
            if (audioContext) {
                audioContext.close(); // Clean up AudioContext
                console.log('Player.svelte onDestroy: AudioContext closed.');
            }
        });
    });

    // Update local state when store changes
    playerStore.subscribe((state: PlayerState) => {
        // These are coming from the store, which should also be persisted or have initial defaults
        currentSong = state.currentSong;
        isPlaying = state.isPlaying;
        progress = state.progress;
        volume = state.volume;
        isShuffling = state.isShuffling;
        loopMode = state.loopMode; // Update local loopMode state
        if (masterGainNode) {
            masterGainNode.gain.value = volume;
        }
    });

    // Reactive statement to handle song changes and play/pause
    $: {
        if (audioElement && currentSong && audioContext) {
            if (audioElement.src !== currentSong.audioUrl) {
                audioElement.src = currentSong.audioUrl;
                audioElement.load();
                console.log('Player.svelte reactive: New song loaded:', currentSong.name);
            }
            if (isPlaying) {
                if (audioContext.state === 'suspended') {
                    console.log('Player.svelte reactive: Attempting to resume AudioContext before playing.');
                    audioContext.resume().then(() => {
                        audioElement.play().catch((e: Error) => console.error("Player.svelte reactive: Error playing audio (resume then play):", e));
                    });
                } else {
                    audioElement.play().catch((e: Error) => console.error("Player.svelte reactive: Error playing audio:", e));
                }
            } else {
                audioElement.pause();
                console.log('Player.svelte reactive: Audio paused.');
            }
        }
    }

    // Reactive statement to load new IR when selectedIrUrl changes
    $: selectedIrUrl, loadImpulseResponse(selectedIrUrl);

    // Reactive statements to update audio node parameters when state changes (including new generic reverb)
    $: eqGains, filterNodes.forEach((filter, i) => { if (filter) filter.gain.value = eqGains[i]; });
    $: convolverEnabled, convolverMix, genericReverbEnabled, genericReverbAmount, updateEffectsConnections();
    // Reactive statement for generic reverb type change
    $: genericReverbType, configureGenericReverb(genericReverbType);

    // Reactive statement to save settings when any of them change
    $: eqGains, convolverEnabled, convolverMix, selectedIrUrl, genericReverbEnabled, genericReverbAmount, genericReverbType, loopMode, isShuffling, saveSettings();

    // Function to format duration (seconds to MM:SS)
    function formatTime(seconds: number | null): string {
        if (seconds === null || isNaN(seconds)) return '0:00';
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    }

    // Event handlers for the audio element
    function handleTimeUpdate() {
        if (audioElement && currentSong) {
            playerStore.updateProgress(audioElement.currentTime);
            progress = audioElement.currentTime;
        }
    }

    function handleLoadedMetadata() {
        if (audioElement) {
            duration = audioElement.duration;
            console.log('Player.svelte handleLoadedMetadata: Audio duration set to:', duration);
        }
    }

    // Modified handleEnded logic for loop functionality
    function handleEnded() {
        if (loopMode === 'one') {
            audioElement.currentTime = 0;
            audioElement.play().catch(e => console.error("Player.svelte handleEnded: Error looping single track:", e));
            playerStore.resumePlaying(); // Ensure store state reflects playing
        } else if (isShuffling) {
            playerStore.playNextShuffledSong(); // Store handles logic for next shuffled song
        } else if (loopMode === 'all') {
            playerStore.playNextSong(); // Assume playerStore.playNextSong handles looping the queue if at end
        } else {
            // No loop, not shuffling: pause and reset progress
            playerStore.pausePlaying();
            playerStore.updateProgress(0);
        }
        console.log(`Player.svelte handleEnded: Song ended. LoopMode: ${loopMode}, Shuffling: ${isShuffling}`);
    }

    function handleError(e: Event) {
        console.error("Player.svelte handleError: Audio error:", e);
    }

    function togglePlayPause() {
        if (currentSong) {
            if (isPlaying) {
                playerStore.pausePlaying();
            } else {
                playerStore.resumePlaying();
            }
            console.log('Player.svelte togglePlayPause: isPlaying toggled to', !isPlaying);
        }
    }

    // Simplified type, cast inside the function
    function handleVolumeChange(event: Event) {
        // We know this input is an HTMLInputElement because of type="range" and its context
        const newVolume = (event.currentTarget as HTMLInputElement).valueAsNumber / 100;
        playerStore.setVolume(newVolume);
    }

    // Simplified type, cast inside the function
    function handleProgressBarChange(event: Event) {
        if (audioElement && currentSong && duration > 0) {
            // We know this input is an HTMLInputElement because of type="range" and its context
            const newProgress = ((event.currentTarget as HTMLInputElement).valueAsNumber / 100) * duration;
            audioElement.currentTime = newProgress;
            playerStore.updateProgress(newProgress);
        }
    }

    function toggleEqVisibility() {
        showEq = !showEq;
        console.log('Player.svelte toggleEqVisibility: EQ UI visibility toggled to', showEq);
    }
</script>

<footer
    class="bg-black border-t border-background-elevated-base px-4 h-[90px] grid grid-cols-[1fr_auto] md:grid-cols-[1fr_2fr_1fr] items-center gap-8"
>
    <!-- Hidden Audio Element -->
    <audio
        bind:this={audioElement}
        on:timeupdate={handleTimeUpdate}
        on:loadedmetadata={handleLoadedMetadata}
        on:ended={handleEnded}
        on:error={handleError}
        preload="metadata"
        crossorigin="anonymous"
    ></audio>

    <!-- Track Info -->
    <div class="flex items-center gap-3">
        {#if currentSong}
            <img src={currentSong.albumImageUrl} alt={currentSong.name} class="w-14 h-14 object-cover" />
            <div>
                <div class="font-semibold text-sm">{currentSong.name}</div>
                <div class="text-xs text-text-subdued">{currentSong.artistName}</div>
            </div>
        {:else}
            <div class="w-14 h-14 bg-background-elevated-base"></div>
            <div>
                <div class="font-semibold text-sm">No song playing</div>
                <div class="text-xs text-text-subdued"></div>
            </div>
        {/if}
    </div>

    <!-- Player Controls -->
    <div class="flex flex-col items-center gap-2 md:w-full">
        <div class="flex items-center gap-4">
            <button class="text-text-subdued hover:text-text-base" disabled={!currentSong}><SkipBack size={20} /></button>
            <button
                class="bg-text-base text-black rounded-full p-2 hover:scale-105"
                on:click={togglePlayPause}
                disabled={!currentSong}
            >
                {#if isPlaying}
                    <Pause size={20} />
                {:else}
                    <Play size={20} />
                {/if}
            </button>
            <button class="text-text-subdued hover:text-text-base" disabled={!currentSong}><SkipForward size={20} /></button>
        </div>
        <div class="hidden md:flex items-center gap-2 w-full max-w-2xl text-xs text-text-subdued">
            <span>{formatTime(progress)}</span>
            <div class="w-full h-1 bg-background-elevated-highlight rounded-full relative">
                <input
                    type="range"
                    id="progress-slider"
                    min="0"
                    max="100"
                    value={duration > 0 ? (progress / duration) * 100 : 0}
                    on:input={handleProgressBarChange}
                    class="absolute w-full h-full appearance-none cursor-pointer range-slider"
                    style="--progress: {duration > 0 ? (progress / duration) * 100 : 0}%;"
                    disabled={!currentSong}
                />
                <div class="h-full bg-text-base rounded-full" style="width: {duration > 0 ? (progress / duration) * 100 : 0}%"></div>
            </div>
            <span>{formatTime(duration || currentSong?.duration || 0)}</span>
        </div>
    </div>

    <!-- Extra Controls -->
    <div class="hidden md:flex justify-end items-center gap-4">
        <button class="text-text-subdued hover:text-text-base"><Mic2 size={18} /></button>
        <button class="text-text-subdued hover:text-text-base"><ListMusic size={18} /></button>
        <!-- Button to toggle EQ visibility -->
        <button class="text-text-subdued hover:text-text-base" on:click={toggleEqVisibility} aria-label="Toggle Equalizer">
            <Laptop2 size={18} />
        </button>
        <!-- Shuffle Button (already togglable) -->
        <button
            class="text-text-subdued hover:text-text-base"
            class:active={isShuffling}
            on:click={playerStore.toggleShuffle}
            aria-label="Toggle Shuffle"
            disabled={!currentSong}
        >
            <Shuffle size={18} />
        </button>
        <!-- Loop Button -->
        <button
            class="text-text-subdued hover:text-text-base"
            class:active={loopMode !== 'none'}
            on:click={playerStore.toggleLoop}
            aria-label="Toggle Loop Mode"
            disabled={!currentSong}
        >
            {#if loopMode === 'one'}
                <Repeat1 size={18} />
            {:else}
                <Repeat size={18} />
            {/if}
        </button>
        <button class="text-text-subdued hover:text-text-base" on:click={() => playerStore.setVolume(volume > 0 ? 0 : 1)} aria-label="Toggle Mute">
            {#if volume > 0}
                <Volume2 size={18} />
            {:else}
                <VolumeX size={18} />
            {/if}
        </button>
        <div class="w-24 h-1 bg-background-elevated-highlight rounded-full relative">
             <input
                type="range"
                id="volume-slider"
                min="0"
                max="100"
                value={volume * 100}
                on:input={handleVolumeChange}
                class="absolute w-full h-full appearance-none cursor-pointer volume-slider"
                style="--volume: {volume * 100}%;"
            />
            <div class="h-full bg-text-base rounded-full" style="width: {volume * 100}%"></div>
        </div>
    </div>
</footer>

<!-- EQ Component Overlay -->
{#if showEq && audioContext && sourceNode && masterGainNode}
    <div class="eq-overlay">
        <Eq
            {audioContext}
            {filterNodes}
            {bands}
            bind:eqGains={eqGains}
            {convolverNode}
            bind:convolverEnabled={convolverEnabled}
            bind:convolverMix={convolverMix}
            {impulseResponseBuffer}
            bind:availableIrs={availableIrs}
            bind:selectedIrUrl={selectedIrUrl}
            bind:reverbEnabled={genericReverbEnabled}
            bind:reverbAmount={genericReverbAmount}
            bind:reverbType={genericReverbType}
        />
    </div>
{/if}

<style>
    footer {
        grid-area: player;
        background-color: #000;
        border-top: 1px solid var(--background-elevated-base);
        padding: 0 16px;
        height: 90px;
        display: grid;
        grid-template-columns: 1fr 2fr 1fr;
        align-items: center;
        gap: 2rem;
    }
    .flex {
        display: flex;
    }
    .items-center {
        align-items: center;
    }
    .gap-3 {
        gap: 12px;
    }
    .w-14 {
        width: 56px;
    }
    .h-14 {
        height: 56px;
    }
    .font-semibold {
        font-weight: 600;
    }
    .text-sm {
        font-size: 0.9rem;
    }
    .text-xs {
        font-size: 0.75rem;
    }
    .text-text-subdued {
        color: var(--text-subdued);
    }
    .hover\:text-text-base:hover {
        color: var(--text-base);
    }
    .bg-text-base {
        background-color: var(--text-base);
    }
    .text-black {
        color: #000;
    }
    .rounded-full {
        border-radius: 50%;
    }
    .p-2 {
        padding: 8px;
    }
    .hover\:scale-105:hover {
        transform: scale(1.05);
    }
    .hidden {
        display: none;
    }
    .md\:flex {
        display: flex;
    }
    .gap-4 {
        gap: 16px;
    }
    .w-24 {
        width: 100px;
    }
    .h-1 {
        height: 4px;
    }
    .bg-background-elevated-base {
        background-color: var(--background-elevated-base);
    }
    .bg-background-elevated-highlight {
        background-color: var(--background-elevated-highlight);
    }

    @media (max-width: 768px) {
        footer {
            grid-template-columns: 1fr;
            height: auto;
            padding: 12px;
        }
    }

    /* Custom styles for range input to match design */
    .range-slider::-webkit-slider-thumb,
    .volume-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: #fff; /* White thumb */
        cursor: pointer;
        margin-top: -4px; /* Adjust to center thumb vertically */
        box-shadow: 0 0 0 2px rgba(0,0,0,0.2);
        display: none; /* Hide by default */
    }

    .range-slider:hover::-webkit-slider-thumb,
    .range-slider:focus::-webkit-slider-thumb,
    .volume-slider:hover::-webkit-slider-thumb,
    .volume-slider:focus::-webkit-slider-thumb {
        display: block; /* Show on hover/focus */
    }

    .range-slider::-webkit-slider-runnable-track,
    .volume-slider::-webkit-slider-runnable-track {
        width: 100%;
        height: 4px; /* Match the track height */
        background: transparent; /* Track is handled by the div below */
        border-radius: 2px;
    }

    /* Firefox compatibility */
    .range-slider::-moz-range-thumb,
    .volume-slider::-moz-range-thumb {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: #fff;
        cursor: pointer;
        border: none;
        display: none;
    }
    .range-slider:hover::-moz-range-thumb,
    .range-slider:focus::-moz-range-thumb,
    .volume-slider:hover::-moz-range-thumb,
    .volume-slider:focus::-moz-range-thumb {
        display: block;
    }
    .range-slider::-moz-range-track,
    .volume-slider::-moz-range-track {
        width: 100%;
        height: 4px;
        background: transparent;
        border-radius: 2px;
    }

    /* Microsoft Edge compatibility */
    .range-slider::-ms-thumb,
    .volume-slider::-ms-thumb {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: #fff;
        cursor: pointer;
        margin-top: 0;
        box-shadow: 0 0 0 2px rgba(0,0,0,0.2);
        display: none;
    }
    .range-slider:hover::-ms-thumb,
    .range-slider:focus::-ms-thumb,
    .volume-slider:hover::-ms-thumb,
    .volume-slider:focus::-ms-thumb {
        display: block;
    }
    .range-slider::-ms-track,
    .volume-slider::-ms-track {
        width: 100%;
        height: 4px;
        background: transparent;
        border-radius: 2px;
        color: transparent; /* Hide default track */
    }
    .range-slider::-ms-fill-lower,
    .volume-slider::-ms-fill-lower {
        background: transparent; /* Fill controlled by custom div */
    }
    .range-slider::-ms-fill-upper,
    .volume-slider::-ms-fill-upper {
        background: transparent; /* Fill controlled by custom div */
    }

    /* Position the range input over the progress div */
    .range-slider, .volume-slider {
        position: absolute;
        top: 0;
        left: 0;
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        background: transparent;
        z-index: 1; /* Place above the visible track */
    }

    .range-slider:focus-visible, .volume-slider:focus-visible {
        outline: none; /* Remove default focus outline */
    }

    /* Hide default track for some browsers */
    .range-slider, .volume-slider {
        /* Firefox */
        -moz-appearance: none;
        /* Chrome, Safari, Edge */
        -webkit-appearance: none;
        appearance: none;
    }

    .range-slider::-webkit-slider-runnable-track,
    .volume-slider::-webkit-slider-runnable-track {
        background: transparent;
    }
    .range-slider::-moz-range-track,
    .volume-slider::-moz-range-track {
        background: transparent;
    }
    .range-slider::-ms-track,
    .volume-slider::-ms-track {
        background: transparent;
    }

    /* Styles for EQ Overlay */
    .eq-overlay {
        position: fixed;
        bottom: 90px; /* Adjust based on player height */
        right: 0;
        z-index: 1000;
        background-color: transparent; /* Make it transparent to only show Eq component */
        padding: 10px; /* Optional: if you want some space around the EQ component */
        display: flex; /* Adjust display if you need to position Eq component specifically */
        justify-content: flex-end; /* Align EQ to the right */
    }

    /* Added styling for active shuffle button */
    .text-text-base {
        color: var(--text-base); /* Assuming --text-base is your primary text color, e.g. white or a light grey */
    }
    .text-text-subdued {
        color: var(--text-subdued); /* Assuming --text-subdued is a less prominent color */
    }

    button.active {
        color: var(--text-base); /* This will make the icon white when active */
    }
</style>
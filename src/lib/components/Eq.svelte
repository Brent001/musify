<script lang="ts">
    import { createEventDispatcher, onMount } from 'svelte'; // Added onMount

    export let audioContext: AudioContext;
    export let filterNodes: BiquadFilterNode[];
    export let bands: readonly ({ frequency: number; type: "lowshelf" | "peaking" | "highshelf"; q: number; gain: number; })[];
    export let eqGains: number[];

    export let convolverNode: ConvolverNode;
    // Renamed for IR Reverb (Convolver)
    export let convolverEnabled: boolean;
    export let convolverMix: number;
    export let impulseResponseBuffer: AudioBuffer | null;

    // New exports for IR file selection
    export let availableIrs: string[]; // List of public URLs for IR files
    export let selectedIrUrl: string | null; // Currently selected IR file URL

    // New exports for Generic Reverb (Additional Reverb)
    export let reverbEnabled: boolean; // For the generic reverb
    export let reverbAmount: number;   // For the generic reverb slider
    export let reverbType: string = 'hall'; // New: reverb type (hall, plate, room, cathedral)

    let irDropdownOpen: boolean = false; // State for custom IR dropdown visibility
    let reverbTypeDropdownOpen: boolean = false; // State for reverb type dropdown
    let eqPresetDropdownOpen: boolean = false; // NEW: State for EQ Preset dropdown

    // Dispatcher not strictly needed for internal dropdowns if using svelte:window click handler
    // const dispatch = createEventDispatcher();

    // Available reverb types (as before)
    const reverbTypes = [
        { value: 'hall', label: 'Hall' },
        { value: 'plate', label: 'Plate' },
        { value: 'room', label: 'Room' },
        { value: 'cathedral', label: 'Cathedral' },
        { value: 'spring', label: 'Spring' }
    ];

    // NEW: EQ Presets
    // These gain values correspond to the 6 bands defined in Player.svelte
    const eqPresets = [
        { name: 'Flat', gains: [0, 0, 0, 0, 0, 0] },
        { name: 'Bass Boost', gains: [6, 4, 2, 0, 0, 0] },
        { name: 'Treble Boost', gains: [0, 0, 0, 2, 4, 6] },
        { name: 'Vocal Boost', gains: [-2, -2, 4, 4, -2, -2] },
        { name: 'Rock', gains: [4, 2, -2, 2, 4, 6] },
        { name: 'Jazz', gains: [2, 0, 0, 2, 4, 0] },
        { name: 'Pop', gains: [3, 1, -1, 2, 3, 2] },
        { name: 'Dance/EDM', gains: [6, 4, 0, 2, 4, 5] },
        { name: 'Classical', gains: [3, 0, -3, -3, 0, 3] },
        { name: 'Live', gains: [0, 1, 2, 3, 2, 1] },
        // Add a "Custom" preset to represent manual adjustments, gains will be dynamic
        { name: 'Custom', gains: [] }
    ];

    // NEW: Variable to hold the currently selected preset name for display
    let selectedEqPresetName: string = 'Flat';

    // Helper to determine if current eqGains match a predefined preset
    function getMatchingPresetName(currentGains: number[]): string {
        const matchingPreset = eqPresets.find(p => p.name !== 'Custom' && JSON.stringify(p.gains) === JSON.stringify(currentGains));
        return matchingPreset ? matchingPreset.name : 'Custom';
    }

    // Initialize selectedEqPresetName on mount based on initial eqGains (loaded from Player.svelte, which uses localStorage)
    onMount(() => {
        selectedEqPresetName = getMatchingPresetName(eqGains);
    });

    // Reactive statement to update selectedEqPresetName when eqGains change manually
    // This will set it to 'Custom' if the user adjusts sliders after selecting a preset.
    $: eqGains, selectedEqPresetName = getMatchingPresetName(eqGains);


    // EQ Gain update handler (no change)
    function updateGain(index: number, event: Event) {
        const value = (event.target as HTMLInputElement).valueAsNumber;
        eqGains[index] = value;
    }

    // NEW: Function to apply an EQ preset
    function applyEqPreset(preset: typeof eqPresets[0]) {
        if (preset.name === 'Custom') {
            // 'Custom' preset means current settings are manually adjusted.
            // No need to change eqGains unless we want to reset to 'Flat' or another default for 'Custom'.
            // For now, it simply reflects the state.
            selectedEqPresetName = 'Custom';
        } else {
            eqGains = [...preset.gains]; // Create a new array to ensure reactivity and propagate to Player.svelte
            selectedEqPresetName = preset.name;
        }
        eqPresetDropdownOpen = false; // Close dropdown after selection
    }

    // Impulse Response Reverb (Convolver) Mix update handler (no change)
    function updateConvolverMix(mixValue: number) {
        convolverMix = mixValue;
    }

    // Generic Reverb Amount update handler (no change)
    function updateReverbAmount(amountValue: number) {
        reverbAmount = amountValue;
    }

    // Function to extract just the filename for display (no change)
    function getFilenameFromUrl(url: string): string {
        const parts = url.split('/');
        return parts[parts.length - 1];
    }

    // Custom dropdown handlers for IR (updated to close other dropdowns)
    function toggleIrDropdown() {
        irDropdownOpen = !irDropdownOpen;
        reverbTypeDropdownOpen = false;
        eqPresetDropdownOpen = false; // Close other dropdowns
    }

    function selectIr(url: string | null) {
        selectedIrUrl = url;
        irDropdownOpen = false;
    }

    // Custom dropdown handlers for Reverb Type (updated to close other dropdowns)
    function toggleReverbTypeDropdown() {
        reverbTypeDropdownOpen = !reverbTypeDropdownOpen;
        irDropdownOpen = false;
        eqPresetDropdownOpen = false; // Close other dropdowns
    }

    function selectReverbType(type: string) {
        reverbType = type;
        reverbTypeDropdownOpen = false;
    }

    // NEW: Custom dropdown handlers for EQ Presets
    function toggleEqPresetDropdown() {
        eqPresetDropdownOpen = !eqPresetDropdownOpen;
        irDropdownOpen = false;
        reverbTypeDropdownOpen = false; // Close other dropdowns
    }

    // Handle clicks outside the dropdown to close it (updated to include new dropdown)
    function handleClickOutside(event: MouseEvent) {
        const irDropdownElement = document.getElementById('ir-custom-dropdown');
        const reverbDropdownElement = document.getElementById('reverb-type-dropdown');
        const eqPresetDropdownElement = document.getElementById('eq-preset-dropdown'); // NEW

        if (irDropdownElement && !irDropdownElement.contains(event.target as Node)) {
            irDropdownOpen = false;
        }
        if (reverbDropdownElement && !reverbDropdownElement.contains(event.target as Node)) {
            reverbTypeDropdownOpen = false;
        }
        if (eqPresetDropdownElement && !eqPresetDropdownElement.contains(event.target as Node)) { // NEW
            eqPresetDropdownOpen = false;
        }
    }
</script>

<svelte:window on:click={handleClickOutside} />

<!-- NEW: Wrapper div for scrolling -->
<div class="eq-scroll-wrapper">
    <div class="eq-controls">
        <h3 class="title">Audio Effects</h3>
        
        <!-- NEW: EQ Presets Section -->
        <div class="eq-section">
            <h4 class="section-title">EQ Presets</h4>
            <div class="custom-dropdown-wrapper" id="eq-preset-dropdown">
                <button class="dropdown-toggle" on:click|stopPropagation={toggleEqPresetDropdown} aria-expanded={eqPresetDropdownOpen}>
                    {selectedEqPresetName}
                    <span class="arrow">▼</span>
                </button>
                {#if eqPresetDropdownOpen}
                    <ul class="dropdown-menu">
                        {#each eqPresets as preset (preset.name)}
                            <li
                                class="dropdown-item"
                                class:selected={preset.name === selectedEqPresetName}
                                on:click={() => applyEqPreset(preset)}
                            >
                                {preset.name}
                            </li>
                        {/each}
                    </ul>
                {/if}
            </div>
        </div>

        <!-- EQ Sliders Section -->
        <div class="eq-section">
            <h4 class="section-title">Equalizer</h4>
            <div class="eq-grid">
                {#each bands as band, i}
                    <div class="eq-item">
                        <label for={`eq-slider-${i}`}>{band.frequency}Hz</label>
                        <span class="gain-value">{eqGains[i].toFixed(1)}dB</span>
                        <input
                            type="range"
                            id={`eq-slider-${i}`}
                            min="-20"
                            max="20"
                            step="0.1"
                            bind:value={eqGains[i]}
                            on:input={(e) => updateGain(i, e)}
                            class="horizontal-slider"
                        />
                    </div>
                {/each}
            </div>
        </div>

        <!-- Reverb Section -->
        <div class="reverb-section">
            <h4 class="section-title">Reverb</h4>
            <div class="reverb-grid">
                <!-- IR Reverb -->
                <div class="reverb-item">
                    <div class="reverb-header">
                        <span class="reverb-label">Impulse Response</span>
                        <input type="checkbox" id="convolver-enable" bind:checked={convolverEnabled} disabled={!impulseResponseBuffer} />
                    </div>
                    
                    <div class="custom-dropdown-wrapper" id="ir-custom-dropdown">
                        <button class="dropdown-toggle" on:click|stopPropagation={toggleIrDropdown} aria-expanded={irDropdownOpen}>
                            {selectedIrUrl ? getFilenameFromUrl(selectedIrUrl) : 'Custom'}
                            <span class="arrow">▼</span>
                        </button>
                        {#if irDropdownOpen}
                            <ul class="dropdown-menu">
                                {#if !availableIrs.length}
                                    <li class="dropdown-item disabled">No IRs available</li>
                                {:else}
                                    <li
                                        class="dropdown-item"
                                        class:selected={!selectedIrUrl}
                                        on:click={() => selectIr(null)}
                                    >
                                        Custom
                                    </li>
                                    {#each availableIrs as irUrl (irUrl)}
                                        <li
                                            class="dropdown-item"
                                            class:selected={irUrl === selectedIrUrl}
                                            on:click={() => selectIr(irUrl)}
                                        >
                                            {getFilenameFromUrl(irUrl)}
                                        </li>
                                    {/each}
                                {/if}
                            </ul>
                        {/if}
                    </div>

                    {#if convolverEnabled}
                        <div class="slider-control">
                            <span class="control-label">Mix:</span>
                            <input
                                type="range"
                                id="convolver-mix"
                                min="0"
                                max="1"
                                step="0.01"
                                bind:value={convolverMix}
                                on:input={(e) => updateConvolverMix((e.target as HTMLInputElement).valueAsNumber)}
                                class="horizontal-slider"
                            />
                            <span class="control-value">{(convolverMix * 100).toFixed(0)}%</span>
                        </div>
                    {/if}
                    
                    {#if !impulseResponseBuffer && selectedIrUrl}
                        <p class="status-message loading">Loading...</p>
                    {:else if !selectedIrUrl}
                        <p class="status-message info">No IR selected</p>
                    {/if}
                </div>

                <!-- Standard Reverb -->
                <div class="reverb-item">
                    <div class="reverb-header">
                        <span class="reverb-label">Standard</span>
                        <input type="checkbox" id="generic-reverb-enable" bind:checked={reverbEnabled} />
                    </div>

                    <div class="custom-dropdown-wrapper" id="reverb-type-dropdown">
                        <button class="dropdown-toggle" on:click|stopPropagation={toggleReverbTypeDropdown} aria-expanded={reverbTypeDropdownOpen}>
                            {reverbTypes.find(r => r.value === reverbType)?.label || 'Hall'}
                            <span class="arrow">▼</span>
                        </button>
                        {#if reverbTypeDropdownOpen}
                            <ul class="dropdown-menu">
                                {#each reverbTypes as type}
                                    <li
                                        class="dropdown-item"
                                        class:selected={type.value === reverbType}
                                        on:click={() => selectReverbType(type.value)}
                                    >
                                        {type.label}
                                    </li>
                                {/each}
                            </ul>
                        {/if}
                    </div>

                    {#if reverbEnabled}
                        <div class="slider-control">
                            <span class="control-label">Amount:</span>
                            <input
                                type="range"
                                id="generic-reverb-amount"
                                min="0"
                                max="1"
                                step="0.01"
                                bind:value={reverbAmount}
                                on:input={(e) => updateReverbAmount((e.target as HTMLInputElement).valueAsNumber)}
                                class="horizontal-slider"
                            />
                            <span class="control-value">{(reverbAmount * 100).toFixed(0)}%</span>
                        </div>
                    {/if}
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    /* NEW: Wrapper for scrolling */
    .eq-scroll-wrapper {
        /* This max-height should leave space for the player footer at the bottom */
        max-height: calc(100vh - 100px); /* Example: 100vh - (footer height + some top/bottom margin if needed) */
        overflow-y: auto; /* Enable vertical scrolling */
        padding-right: 10px; /* Space for scrollbar to not overlay content */
        box-sizing: border-box; /* Include padding in the max-height */
        /* Position the wrapper relative to its parent .eq-overlay in Player.svelte */
        position: absolute;
        bottom: 0;
        right: 0;
        /* Adjust width as needed for your UI, making it reasonable for a side panel */
        width: min(calc(100vw - 20px), 400px); /* Max 400px, or full width minus padding on smaller screens */
    }

    /* Style the scrollbar for better aesthetics (Webkit only) */
    .eq-scroll-wrapper::-webkit-scrollbar {
        width: 8px;
    }

    .eq-scroll-wrapper::-webkit-scrollbar-track {
        background: #333;
        border-radius: 4px;
    }

    .eq-scroll-wrapper::-webkit-scrollbar-thumb {
        background: #555;
        border-radius: 4px;
    }

    .eq-scroll-wrapper::-webkit-scrollbar-thumb:hover {
        background: #1DB954;
    }

    .eq-controls {
        background-color: #1a1a1a;
        padding: 15px;
        border-radius: 8px;
        color: #fff;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
        /* Remove max-width from here, as the wrapper now controls the overall width */
        margin: 0 auto; /* Keep content centered horizontally within the wrapper */
        width: 100%; /* Ensure it fills the wrapper */
    }

    .title {
        margin: 0 0 12px 0;
        text-align: center;
        font-size: 1.5em;
        color: #1DB954;
    }

    .section-title {
        margin: 0 0 10px 0;
        text-align: center;
        color: #1DB954;
        font-size: 1em;
        font-weight: 600;
    }

    /* EQ Section */
    .eq-section {
        background-color: #282828;
        padding: 12px 15px;
        border-radius: 6px;
        margin-bottom: 12px;
        box-shadow: inset 0 1px 3px rgba(0,0,0,0.4);
    }

    .eq-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 12px;
    }

    .eq-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 5px 8px;
        background-color: #333;
        border-radius: 4px;
    }

    .eq-item label {
        font-size: 0.75em;
        color: #b3b3b3;
        text-align: left;
        flex-shrink: 0;
        min-width: 45px;
    }

    .gain-value {
        font-size: 0.7em;
        color: #1DB954;
        min-width: 40px;
        text-align: right;
        font-weight: 600;
        flex-shrink: 0;
    }

    /* Reverb Section */
    .reverb-section {
        background-color: #282828;
        padding: 12px 15px;
        border-radius: 6px;
        box-shadow: inset 0 1px 3px rgba(0,0,0,0.4);
    }

    .reverb-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 15px;
    }

    .reverb-item {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .reverb-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 4px 0;
    }

    .reverb-label {
        font-size: 0.85em;
        color: #b3b3b3;
        font-weight: 500;
    }

    input[type="checkbox"] {
        width: 18px;
        height: 18px;
        cursor: pointer;
        accent-color: #1DB954;
    }

    input[type="checkbox"]:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    /* Dropdown Styles - generic, used by all dropdowns */
    .custom-dropdown-wrapper {
        position: relative;
        width: 100%;
    }

    .dropdown-toggle {
        width: 100%;
        padding: 8px 10px;
        border-radius: 4px;
        border: 1px solid #555;
        background-color: #333;
        color: #fff;
        font-size: 0.85em;
        cursor: pointer;
        text-align: left;
        display: flex;
        justify-content: space-between;
        align-items: center;
        transition: border-color 0.2s ease;
    }

    .dropdown-toggle:hover,
    .dropdown-toggle:focus {
        border-color: #1DB954;
        outline: none;
    }

    .arrow {
        font-size: 0.7em;
        color: #b3b3b3;
        transition: transform 0.2s ease;
    }

    .dropdown-menu {
        position: absolute;
        top: 100%;
        left: 0;
        width: 100%;
        max-height: 200px;
        overflow-y: auto;
        background-color: #282828;
        border: 1px solid #444;
        border-radius: 4px;
        list-style: none;
        padding: 0;
        margin: 4px 0 0 0;
        z-index: 10;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
    }

    .dropdown-item {
        padding: 8px 10px;
        color: #fff;
        font-size: 0.85em;
        cursor: pointer;
        transition: background-color 0.2s ease;
    }

    .dropdown-item:hover {
        background-color: #3a3a3a;
    }

    .dropdown-item.selected {
        background-color: #1DB954;
        color: #000;
        font-weight: bold;
    }

    .dropdown-item.disabled {
        color: #888;
        cursor: not-allowed;
        background-color: #2f2f2f;
    }

    /* Slider Control (used for reverb, and now also EQ sliders) */
    .slider-control {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .control-label {
        font-size: 0.8em;
        color: #b3b3b3;
        min-width: 55px;
    }

    .control-value {
        font-size: 0.75em;
        color: #1DB954;
        min-width: 35px;
        text-align: right;
        font-weight: 600;
    }

    .horizontal-slider {
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
        flex: 1; /* Allow the slider to take up remaining space */
        height: 6px;
        background: #333;
        outline: none;
        border-radius: 3px;
    }

    .horizontal-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #1DB954;
        cursor: pointer;
        transition: background 0.15s ease-in-out;
        box-shadow: 0 0 0 2px rgba(0,0,0,0.2);
    }

    .horizontal-slider::-moz-range-thumb {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #1DB954;
        cursor: pointer;
        transition: background 0.15s ease-in-out;
        box-shadow: 0 0 0 2px rgba(0,0,0,0.2);
        border: none;
    }

    .horizontal-slider::-webkit-slider-runnable-track,
    .horizontal-slider::-moz-range-track {
        background: #333;
        border-radius: 3px;
        height: 6px;
    }

    /* Status Messages */
    .status-message {
        text-align: center;
        font-size: 0.7em;
        margin: 5px 0 0 0;
    }

    .status-message.loading {
        color: #ff6b6b;
    }

    .status-message.info {
        color: #9bd3ff;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
        .eq-grid {
            grid-template-columns: 1fr;
        }

        .reverb-grid {
            grid-template-columns: 1fr;
        }
    }
</style>
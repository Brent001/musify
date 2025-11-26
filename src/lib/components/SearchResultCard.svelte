<script lang="ts">
    export let item: {
        title: string;
        image: { quality: string; url: string }[];
        type: string;
        primaryArtists?: string;
        artist?: string;
        description?: string;
    };

    $: imageUrl =
        item.image?.find((img) => img.quality === '150x150')?.url ||
        item.image?.[0]?.url ||
        'https://via.placeholder.com/150';
    $: isArtist = item.type === 'artist';
    $: subtitle = item.primaryArtists || item.artist || item.description;
</script>

<div
    class="p-4 bg-background-highlight hover:bg-background-elevated-base transition-colors rounded-md cursor-pointer flex flex-col gap-4 h-full"
>
    <img
        src={imageUrl}
        alt={item.title}
        class="w-full aspect-square object-cover shadow-lg {isArtist ? 'rounded-full' : 'rounded-md'}"
    />
    <div class="min-h-[62px]">
        <div class="font-bold truncate" title={item.title}>{item.title}</div>
        {#if subtitle}
            <div class="text-sm text-text-subdued line-clamp-2">
                <span class="capitalize">{item.type}</span>
                <span class="before:content-['•'] before:mx-1">{subtitle.split(',').slice(0, 2).join(', ')}</span
                >
            </div>
        {/if}
    </div>
</div>
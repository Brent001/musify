import { json } from '@sveltejs/kit';
import { readdir } from 'fs/promises'; // Changed from 'node:fs/promises'
import { join } from 'path'; // Changed from 'node:path'

export async function GET() {
    // Determine the absolute path to your static IRs directory.
    // In SvelteKit development, process.cwd() is usually the project root.
    // For production builds (e.g., with adapter-node), ensure 'static' is accessible
    // relative to the build output directory if necessary, but this path
    // generally works assuming static assets are copied to an accessible location.
    const irsDirPath = join(process.cwd(), 'static', 'eq', 'irs');
    const irsPublicPathPrefix = '/eq/irs/'; // Public URL prefix for these files

    try {
        const files = await readdir(irsDirPath);
        const irsFiles = files
            .filter((file: string) => file.endsWith('.irs')) // Filter for .irs files, explicitly typed
            .map((file: string) => `${irsPublicPathPrefix}${file}`); // Construct public URLs, explicitly typed
        console.log(`[GET /api/irs]: Found ${irsFiles.length} IR files.`);
        return json(irsFiles);
    } catch (error) {
        console.error('[GET /api/irs]: Failed to read IRs directory:', error);
        // Return an empty array and a 500 status on error, or just an empty array for a graceful fallback
        return json([], { status: 500 });
    }
}
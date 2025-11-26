/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{html,js,svelte,ts}'],
    theme: {
        extend: {
            colors: {
                'background-base': '#121212',
                'background-highlight': '#1a1a1a',
                'background-press': '#000',
                'background-elevated-base': '#242424',
                'background-elevated-highlight': '#2a2a2a',
                'text-base': '#fff',
                'text-subdued': '#a7a7a7',
                'text-bright-accent': '#1ed760',
                'essential-subdued': '#727272'
            }
        }
    },
    plugins: []
};
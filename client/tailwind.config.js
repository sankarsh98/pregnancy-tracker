/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Soft, calming pregnancy theme colors
                lavender: {
                    50: '#faf8ff',
                    100: '#f3f0ff',
                    200: '#e9e3ff',
                    300: '#d7cdff',
                    400: '#bba6ff',
                    500: '#9d79ff',
                    600: '#8b54f7',
                    700: '#7a42e3',
                    800: '#6636bf',
                    900: '#54309c',
                },
                mint: {
                    50: '#f0fdf6',
                    100: '#dcfce9',
                    200: '#bbf7d4',
                    300: '#86efb4',
                    400: '#4ade8b',
                    500: '#22c566',
                    600: '#16a34f',
                    700: '#15803f',
                    800: '#166535',
                    900: '#14532d',
                },
                blush: {
                    50: '#fff5f7',
                    100: '#ffeaef',
                    200: '#ffd4df',
                    300: '#ffadc3',
                    400: '#ff7aa0',
                    500: '#ff4d7f',
                    600: '#ed2460',
                    700: '#c8154b',
                    800: '#a61541',
                    900: '#8b163c',
                },
                cream: {
                    50: '#fffbf5',
                    100: '#fff6e8',
                    200: '#ffecd1',
                    300: '#ffdcab',
                    400: '#ffc373',
                    500: '#ffa43e',
                    600: '#ed8015',
                    700: '#c5600d',
                    800: '#9c4b12',
                    900: '#7d3f13',
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
}

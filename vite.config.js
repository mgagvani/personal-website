import { defineConfig } from 'vite'

export default defineConfig({
    // Use relative paths for cPanel deployment
    base: './',

    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        // Generate sourcemaps for debugging
        sourcemap: false,
        // Optimize chunks
        rollupOptions: {
            output: {
                manualChunks: {
                    three: ['three'],
                    gsap: ['gsap']
                }
            }
        },
        // Minification
        minify: 'esbuild',
        // Target modern browsers
        target: 'es2020'
    },

    server: {
        port: 3000,
        open: true,
        host: true
    },

    preview: {
        port: 4000
    }
})

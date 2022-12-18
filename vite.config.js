/** @type {import('vite').UserConfig} */
import { resolve } from 'path'

const root = resolve(__dirname)
const outDir = resolve(__dirname, 'dist')

export default {
    root,
    build: {
        outDir,
        emptyOutDir: true,
        rollupOptions: {
            input: {
                main: resolve(root, 'index.html'),
                about: resolve(root, 'about.html'),
                "1v1": resolve(root, 'pvp', '1v1.html'),
                "6v6": resolve(root, 'pvp', '6v6.html'),
            }
        },
        target: 'es2022'
    }
}

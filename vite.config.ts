import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import wasm from 'vite-plugin-wasm'

export default defineConfig({
	plugins: [
		wasm(),
		nodePolyfills({
      protocolImports: true,
    }),
		sveltekit()
	],
	build: {
		target: 'esnext'
	}
});

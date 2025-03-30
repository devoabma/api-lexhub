import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src'],
  outDir: 'build',
  splitting: false,
  sourcemap: true,
  clean: true,
})

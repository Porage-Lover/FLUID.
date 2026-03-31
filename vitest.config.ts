import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./setup-tests.ts'],
    include: ['src/context/**/*.test.tsx', 'src/context/**/*.test.ts'],
    env: {
      VITE_SUPABASE_URL: 'http://localhost',
      VITE_SUPABASE_ANON_KEY: 'test_key'
    }
  },
});

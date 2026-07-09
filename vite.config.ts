import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // `vercel dev` proxies to the underlying Vite dev server over the IPv6
  // loopback address ([::1]), but Vite's default binding can end up
  // IPv4-only depending on the OS/Node setup -- the proxy's connection
  // then silently fails and falls through to a 404, even though Vercel's
  // own routing correctly identified the request as frontend-bound.
  // Binding to all interfaces makes Vite reachable via ::1 too.
  server: { host: true },
});

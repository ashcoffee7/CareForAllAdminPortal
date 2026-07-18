import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // `vercel dev` proxies to the underlying Vite dev server over the IPv6
  // loopback address ([::1]). `host: true` binds Vite to 0.0.0.0, which is
  // IPv4-only and did NOT resolve 404s on main.tsx/@react-refresh/
  // @vite/client -- explicitly binding the IPv6 wildcard instead, which
  // accepts IPv4 connections mapped through it on most OSes (dual-stack),
  // actually covers the exact address vercel dev's proxy connects to.
  server: { host: '::' },
});

import express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();

// Configure proxy for Steam API requests
app.use(
  '/api/steam',
  createProxyMiddleware({
    target: 'https://api.steampowered.com',
    changeOrigin: true, // Required for virtual hosted sites
  })
);

// ... other routes and middleware ...

app.listen(3001, () => {
  console.log('Proxy server listening on port 3001');
});
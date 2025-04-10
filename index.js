const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const preservicaApiUrl = process.env.PRESERVICA_API_URL || 'https://lac.preservica.com/api';

// CORS middleware
app.use(cors());

// Simple health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Proxy middleware for all /api routes
app.use('/api', createProxyMiddleware({
  target: preservicaApiUrl.endsWith('/api') 
    ? preservicaApiUrl.slice(0, -4) // Remove /api if it's included
    : preservicaApiUrl,
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/api', // Keep the /api prefix when forwarding
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`Proxying ${req.method} request to: ${req.path}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`Received ${proxyRes.statusCode} from proxy`);
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(500).send('Proxy error: ' + err.message);
  }
}));

app.listen(port, () => {
  console.log(`Proxy server running on port ${port}`);
  console.log(`Proxying requests to: ${preservicaApiUrl}`);
});
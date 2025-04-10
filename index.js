const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const preservicaApiUrl = process.env.PRESERVICA_API_URL || 'https://lac.preservica.com/api';

// Comprehensive CORS configuration
const corsOptions = {
  origin: [
    'https://master.d1pp5clznit78t.amplifyapp.com', // Your React app's domain
    'http://localhost:3000', // Local development
    /\.amplifyapp\.com$/ // Matches all Amplify app domains
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'Accept', 
    'Origin'
  ],
  credentials: true,
  maxAge: 3600
};

// Apply CORS middleware before proxy
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

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
    
    // Optional: Add any additional headers if needed
    // proxyReq.setHeader('Custom-Header', 'value');
  },
  onProxyRes: (proxyRes, req, res) => {
    // Add CORS headers to the proxied response
    res.set('Access-Control-Allow-Origin', req.get('Origin') || '*');
    res.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.set('Access-Control-Allow-Credentials', 'true');

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

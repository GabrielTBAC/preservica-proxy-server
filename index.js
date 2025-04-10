const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const preservicaApiUrl = process.env.PRESERVICA_API_URL || 'https://lac.preservica.com/api';

// Extremely permissive CORS configuration
app.use((req, res, next) => {
  // Allow from any origin
  res.header('Access-Control-Allow-Origin', '*');
  
  // Allow all HTTP methods
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  
  // Allow these headers
  res.header('Access-Control-Allow-Headers', 
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-CSRF-Token'
  );
  
  // Allow credentials if needed
  res.header('Access-Control-Allow-Credentials', true);

  // Intercept OPTIONS method
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  else {
    return next();
  }
});

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
    
    // Optional: Log full request details for debugging
    console.log('Request headers:', req.headers);
  },
  onProxyRes: (proxyRes, req, res) => {
    // Add additional logging for response
    console.log(`Received ${proxyRes.statusCode} from proxy`);
    console.log('Response headers:', proxyRes.headers);
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(500).send('Proxy error: ' + JSON.stringify(err));
  }
}));

app.listen(port, () => {
  console.log(`Proxy server running on port ${port}`);
  console.log(`Proxying requests to: ${preservicaApiUrl}`);
});

// api/preview/config.js
let currentConfig = null;
let configTimestamp = Date.now();

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method === 'POST') {
    try {
      const { config } = req.body;
      if (!config) {
        return res.status(400).json({ error: 'Config is required' });
      }
      currentConfig = config;
      configTimestamp = Date.now();
      console.log('✅ Config updated:', new Date().toISOString());
      return res.status(200).json({
        success: true,
        message: 'Config updated',
        timestamp: configTimestamp
      });
    } catch (error) {
      console.error('Error updating config:', error);
      return res.status(500).json({ error: 'Failed to update config' });
    }
  }
  
  if (req.method === 'GET') {
    if (!currentConfig) {
      return res.status(404).json({
        config: null,
        message: 'No config available'
      });
    }
    return res.status(200).json({
      config: currentConfig,
      timestamp: configTimestamp
    });
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}
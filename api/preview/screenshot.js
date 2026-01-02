// api/preview/screenshot.js
let currentScreenshot = null;
let screenshotTimestamp = Date.now();

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method === 'POST') {
    try {
      const { screenshot, timestamp } = req.body;
      if (!screenshot) {
        return res.status(400).json({ error: 'Screenshot is required' });
      }
      currentScreenshot = screenshot;
      screenshotTimestamp = Date.now();
      console.log('📸 Screenshot received:', new Date().toISOString());
      return res.status(200).json({
        success: true,
        message: 'Screenshot received'
      });
    } catch (error) {
      console.error('Error saving screenshot:', error);
      return res.status(500).json({ error: 'Failed to save screenshot' });
    }
  }
  
  if (req.method === 'GET') {
    if (!currentScreenshot) {
      return res.status(404).json({
        screenshot: null,
        message: 'No screenshot available'
      });
    }
    return res.status(200).json({
      screenshot: currentScreenshot,
      timestamp: screenshotTimestamp
    });
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}
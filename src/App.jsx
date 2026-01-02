import React, { useState, useEffect } from 'react';
import { Save, Grid, Layout, Settings, Home, FileText, Plus, X, GripVertical, Check, Download, Upload, RefreshCw } from 'lucide-react';

export default function ERPFlowAppBuilder() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [erpnextUrl, setErpnextUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [doctypes, setDoctypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('home');
  const [draggedCard, setDraggedCard] = useState(null);
  
  // Preview state
  const [deviceScreenshot, setDeviceScreenshot] = useState(null);
  const [deviceConnected, setDeviceConnected] = useState(false);
  const [lastScreenshotTime, setLastScreenshotTime] = useState(null);
  
  const [appConfig, setAppConfig] = useState({
    app_name: 'ERPFlow',
    version: '1.0.0',
    theme: {
      primary_color: '#2563eb',
      secondary_color: '#10b981',
      background_color: '#f3f4f6'
    },
    home_page: { cards: [] },
    forms: {}
  });

  // Load saved config
  useEffect(() => {
    const saved = localStorage.getItem('app_config');
    if (saved) setAppConfig(JSON.parse(saved));
  }, []);

  // Save config to localStorage
  useEffect(() => {
    if (appConfig.home_page.cards.length > 0) {
      localStorage.setItem('app_config', JSON.stringify(appConfig));
    }
  }, [appConfig]);

  // Send config to preview server whenever it changes
  useEffect(() => {
    if (isAuthenticated) {
      sendConfigToPreview();
    }
  }, [appConfig, isAuthenticated]);

  // Poll for device screenshots
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const pollScreenshots = setInterval(async () => {
      try {
        const response = await fetch('/api/preview/screenshot');
        if (response.ok) {
          const data = await response.json();
          if (data.screenshot) {
            setDeviceScreenshot(data.screenshot);
            setDeviceConnected(true);
            setLastScreenshotTime(new Date(data.timestamp));
          }
        } else {
          setDeviceConnected(false);
        }
      } catch (error) {
        setDeviceConnected(false);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollScreenshots);
  }, [isAuthenticated]);

  // Send config to preview server
  const sendConfigToPreview = async () => {
    try {
      await fetch('/api/preview/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: appConfig })
      });
    } catch (error) {
      console.error('Failed to send config to preview:', error);
    }
  };

  // Proxy fetch function
  const proxyFetch = async (url, options = {}) => {
    try {
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          method: options.method || 'GET',
          headers: options.headers || {},
          body: options.body
        })
      });
      return response;
    } catch (error) {
      throw error;
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      let url = erpnextUrl.trim();
      if (!url.startsWith('http')) url = 'https://' + url;
      
      localStorage.setItem('erpnext_url', url);
      localStorage.setItem('api_key', apiKey);
      localStorage.setItem('api_secret', apiSecret);
      
      const response = await proxyFetch(`${url}/api/resource/DocType?fields=["name","module"]&filters=[["issingle","=",0],["istable","=",0]]&limit_page_length=500`, {
        headers: { 'Authorization': `token ${apiKey}:${apiSecret}` }
      });
      
      if (!response.ok) throw new Error('Authentication failed');
      
      const data = await response.json();
      setDoctypes(data.data.map(dt => ({ name: dt.name, module: dt.module || 'Custom' })));
      setIsAuthenticated(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addToHomePage = (doctype) => {
    if (appConfig.home_page.cards.some(c => c.doctype === doctype.name)) return;
    
    setAppConfig(prev => ({
      ...prev,
      home_page: {
        cards: [...prev.home_page.cards, {
          doctype: doctype.name,
          label: doctype.name,
          icon: 'file-text',
          module: doctype.module,
          order: prev.home_page.cards.length
        }]
      }
    }));
  };

  const removeCard = (index) => {
    setAppConfig(prev => ({
      ...prev,
      home_page: {
        cards: prev.home_page.cards.filter((_, i) => i !== index)
      }
    }));
  };

  const updateCardLabel = (index, label) => {
    setAppConfig(prev => ({
      ...prev,
      home_page: {
        cards: prev.home_page.cards.map((c, i) => i === index ? { ...c, label } : c)
      }
    }));
  };

  const handleDragStart = (e, index) => {
    setDraggedCard(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedCard === null || draggedCard === index) return;
    
    const cards = [...appConfig.home_page.cards];
    const item = cards[draggedCard];
    cards.splice(draggedCard, 1);
    cards.splice(index, 0, item);
    
    setAppConfig(prev => ({ ...prev, home_page: { cards } }));
    setDraggedCard(index);
  };

  const exportConfig = async () => {
    setLoading(true);
    try {
      const config = {
        ...appConfig,
        last_updated: new Date().toISOString(),
        version: (parseFloat(appConfig.version) + 0.1).toFixed(1)
      };
      
      // Download locally as backup
      const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'erpflow-config.json';
      a.click();
      
      setAppConfig(config);
      alert('✅ Config exported and sent to preview!');
    } catch (error) {
      alert('⚠️ Export failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="bg-blue-600 text-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Layout className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">ERPFlow Builder</h1>
            <p className="text-gray-600">Design your mobile app visually</p>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ERPNext URL</label>
              <input
                type="text"
                placeholder="https://yoursite.erpnext.com"
                value={erpnextUrl}
                onChange={(e) => setErpnextUrl(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">API Secret</label>
              <input
                type="password"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <button
              onClick={handleLogin}
              disabled={loading || !erpnextUrl || !apiKey || !apiSecret}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 transition"
            >
              {loading ? 'Connecting...' : 'Connect'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-600 text-white w-10 h-10 rounded-lg flex items-center justify-center">
              <Layout className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">ERPFlow Builder</h1>
              <p className="text-sm text-gray-500">v{appConfig.version}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${deviceConnected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              <div className={`w-2 h-2 rounded-full ${deviceConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
              <span className="text-sm font-medium">{deviceConnected ? 'Device Connected' : 'Waiting for device...'}</span>
            </div>
            
            <button
              onClick={exportConfig}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
            >
              <Download className="w-4 h-4" />
              <span>Export Config</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-20 bg-white border-r flex flex-col items-center py-6 space-y-4">
          <button
            onClick={() => setActiveTab('home')}
            className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              activeTab === 'home' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            <Home className="w-6 h-6" />
          </button>
          
          <button
            onClick={() => setActiveTab('theme')}
            className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              activeTab === 'theme' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            <Settings className="w-6 h-6" />
          </button>
          
          <button
            onClick={() => setActiveTab('doctypes')}
            className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              activeTab === 'doctypes' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            <Grid className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 flex">
          <div className="w-80 bg-white border-r overflow-y-auto">
            {activeTab === 'home' && (
              <div className="p-6">
                <h2 className="text-lg font-bold mb-4">Home Cards</h2>
                <p className="text-sm text-gray-600 mb-6">Drag to reorder</p>
                
                {appConfig.home_page.cards.map((card, i) => (
                  <div
                    key={i}
                    draggable
                    onDragStart={(e) => handleDragStart(e, i)}
                    onDragOver={(e) => handleDragOver(e, i)}
                    onDragEnd={() => setDraggedCard(null)}
                    className="bg-gray-50 border rounded-lg p-3 mb-3 cursor-move"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <GripVertical className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{card.doctype}</span>
                      </div>
                      <button onClick={() => removeCard(i)} className="text-red-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={card.label}
                      onChange={(e) => updateCardLabel(i, e.target.value)}
                      className="w-full px-3 py-2 text-sm border rounded"
                    />
                  </div>
                ))}
                
                {appConfig.home_page.cards.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <Grid className="w-12 h-12 mx-auto mb-3" />
                    <p>No cards yet</p>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'theme' && (
              <div className="p-6 space-y-6">
                <h2 className="text-lg font-bold mb-6">Theme</h2>
                
                {['primary_color', 'secondary_color', 'background_color'].map(key => (
                  <div key={key}>
                    <label className="block text-sm font-medium mb-2 capitalize">
                      {key.replace('_', ' ')}
                    </label>
                    <div className="flex space-x-3">
                      <input
                        type="color"
                        value={appConfig.theme[key]}
                        onChange={(e) => setAppConfig(prev => ({
                          ...prev,
                          theme: { ...prev.theme, [key]: e.target.value }
                        }))}
                        className="w-16 h-10 rounded border"
                      />
                      <input
                        type="text"
                        value={appConfig.theme[key]}
                        onChange={(e) => setAppConfig(prev => ({
                          ...prev,
                          theme: { ...prev.theme, [key]: e.target.value }
                        }))}
                        className="flex-1 px-3 py-2 border rounded"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {activeTab === 'doctypes' && (
              <div className="p-6">
                <h2 className="text-lg font-bold mb-4">DocTypes ({doctypes.length})</h2>
                
                <div className="space-y-2">
                  {doctypes.map((dt, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">{dt.name}</div>
                        <div className="text-xs text-gray-500">{dt.module}</div>
                      </div>
                      <button
                        onClick={() => addToHomePage(dt)}
                        disabled={appConfig.home_page.cards.some(c => c.doctype === dt.name)}
                        className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300"
                      >
                        {appConfig.home_page.cards.some(c => c.doctype === dt.name) ? (
                          <Check className="w-4 h-4 mx-auto" />
                        ) : (
                          <Plus className="w-4 h-4 mx-auto" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-8 bg-gray-100">
            <div className="max-w-md mx-auto">
              <div className="bg-gray-800 rounded-[3rem] p-4 shadow-2xl">
                <div className="bg-white rounded-[2.5rem] overflow-hidden relative" style={{ aspectRatio: '9/19.5' }}>
                  {deviceScreenshot ? (
                    <img 
                      src={`data:image/png;base64,${deviceScreenshot}`}
                      alt="Device Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <div className="text-center p-8">
                        <RefreshCw className="w-16 h-16 mx-auto mb-4 text-gray-400 animate-spin" />
                        <p className="text-gray-600 font-medium">Waiting for Flutter app...</p>
                        <p className="text-sm text-gray-500 mt-2">Run your app with preview mode enabled</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  {deviceConnected ? (
                    <>Live Preview • Last updated {lastScreenshotTime?.toLocaleTimeString()}</>
                  ) : (
                    'Run Flutter app to see live preview'
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

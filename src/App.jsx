import React, { useState, useEffect } from 'react';
import { Save, Grid, Layout, Settings, Home, FileText, Plus, X, ChevronRight, Menu, LogOut, Download, Eye, Edit2, Trash2, GripVertical, Check } from 'lucide-react';

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

  useEffect(() => {
    const saved = localStorage.getItem('app_config');
    if (saved) setAppConfig(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (appConfig.home_page.cards.length > 0) {
      localStorage.setItem('app_config', JSON.stringify(appConfig));
    }
  }, [appConfig]);

  // PROXY FETCH FUNCTION - Bypasses CORS!
  const proxyFetch = async (url, options = {}) => {
    try {
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          method: options.method || 'GET',
          headers: options.headers || {},
          body: options.body
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Proxy fetch error:', error);
      throw error;
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      let url = erpnextUrl.trim();
      if (!url.startsWith('http')) url = 'https://' + url;
      
      // Remove trailing slash to prevent double slashes
      url = url.replace(/\/$/, '');
      
      localStorage.setItem('erpnext_url', url);
      localStorage.setItem('api_key', apiKey);
      localStorage.setItem('api_secret', apiSecret);
      
      // Use proxy instead of direct fetch
      const data = await proxyFetch(
        `${url}/api/resource/DocType?fields=["name","module"]&filters=[["issingle","=",0],["istable","=",0]]&limit_page_length=500`,
        {
          headers: { 
            'Authorization': `token ${apiKey}:${apiSecret}` 
          }
        }
      );
      
      setDoctypes(data.data.map(dt => ({ name: dt.name, module: dt.module || 'Custom' })));
      setIsAuthenticated(true);
    } catch (err) {
      setError('Failed to connect. Please check your credentials.');
      console.error('Login error:', err);
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
    try {
      setLoading(true);
      setError('');
      
      const config = {
        ...appConfig,
        last_updated: new Date().toISOString(),
        version: (parseFloat(appConfig.version) + 0.1).toFixed(1)
      };
      
      // Create base64 encoded file content
      const fileContent = JSON.stringify(config, null, 2);
      const base64Content = btoa(fileContent);
      
      const baseUrl = erpnextUrl.replace(/\/$/, '');
      
      // First, check if file already exists
      let fileExists = false;
      try {
        const checkUrl = `${baseUrl}/api/resource/File?filters=[["file_name","=","erpflow-config.json"]]`;
        const existingFiles = await proxyFetch(checkUrl, {
          headers: { 'Authorization': `token ${apiKey}:${apiSecret}` }
        });
        
        if (existingFiles.data && existingFiles.data.length > 0) {
          fileExists = true;
          // Delete old file
          const oldFileId = existingFiles.data[0].name;
          await proxyFetch(`${baseUrl}/api/resource/File/${oldFileId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `token ${apiKey}:${apiSecret}` }
          });
        }
      } catch (e) {
        console.log('No existing file to delete');
      }
      
      // Upload new file using ERPNext API
      const uploadUrl = `${baseUrl}/api/resource/File`;
      const uploadData = {
        file_name: 'erpflow-config.json',
        is_private: 0,
        content: base64Content,
        decode: true
      };
      
      const uploadResponse = await proxyFetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `token ${apiKey}:${apiSecret}`,
          'Content-Type': 'application/json'
        },
        body: uploadData
      });
      
      if (uploadResponse.data) {
        // Also download locally as backup
        const blob = new Blob([fileContent], { type: 'application/json' });
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = 'erpflow-config.json';
        a.click();
        URL.revokeObjectURL(downloadUrl);
        
        setAppConfig(config);
        
        const fileUrl = `${baseUrl}${uploadResponse.data.file_url}`;
        alert(`✅ Config uploaded to ERPNext successfully!\n\n📍 URL: ${fileUrl}\n\n✅ Also downloaded locally as backup.\n\nYour Flutter app will now fetch this config automatically!`);
      }
    } catch (err) {
      console.error('Upload error:', err);
      
      // Fallback: Just download locally
      const config = {
        ...appConfig,
        last_updated: new Date().toISOString(),
        version: (parseFloat(appConfig.version) + 0.1).toFixed(1)
      };
      
      const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'erpflow-config.json';
      a.click();
      URL.revokeObjectURL(url);
      
      setAppConfig(config);
      setError(`⚠️ Could not upload to ERPNext: ${err.message}\n\nConfig downloaded locally instead. You can manually upload it to ERPNext.`);
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
          
          <button
            onClick={exportConfig}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
          >
            <Download className="w-4 h-4" />
            <span>Export Config</span>
          </button>
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
                <div className="bg-white rounded-[2.5rem] overflow-hidden" style={{ aspectRatio: '9/19.5' }}>
                  <div className="bg-gray-100 px-6 py-2 flex justify-between text-xs">
                    <span>9:41</span>
                    <div className="flex space-x-1">
                      <div className="w-4 h-3 bg-gray-400 rounded-sm"></div>
                      <div className="w-4 h-3 bg-gray-400 rounded-sm"></div>
                    </div>
                  </div>
                  
                  <div className="px-6 py-4" style={{ backgroundColor: appConfig.theme.primary_color }}>
                    <h1 className="text-xl font-bold text-white">{appConfig.app_name}</h1>
                  </div>
                  
                  <div className="p-4" style={{ backgroundColor: appConfig.theme.background_color, minHeight: '500px' }}>
                    {appConfig.home_page.cards.length === 0 ? (
                      <div className="text-center py-12 text-gray-400">
                        <Grid className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p>Add cards from sidebar</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {appConfig.home_page.cards.map((card, i) => (
                          <div key={i} className="bg-white rounded-xl p-4 shadow-md">
                            <div 
                              className="w-12 h-12 rounded-lg flex items-center justify-center mb-3"
                              style={{ backgroundColor: appConfig.theme.primary_color + '20' }}
                            >
                              <FileText className="w-6 h-6" style={{ color: appConfig.theme.primary_color }} />
                            </div>
                            <div className="font-semibold text-sm">{card.label}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <p className="text-center text-sm text-gray-600 mt-4">Live Preview</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

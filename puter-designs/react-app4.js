import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';

const customStyles = {
  fabShadow: {
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
  }
};

const Header = () => {
  const [notificationOpen, setNotificationOpen] = useState(false);

  return (
    <header className="flex items-center justify-between px-6 py-4 flex-shrink-0 bg-[#FDFBF7] border-b border-slate-100 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
            <polyline points="2 17 12 22 22 17"></polyline>
            <polyline points="2 12 12 17 22 12"></polyline>
          </svg>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Puter Proxy</h1>
      </div>
      <div className="flex items-center gap-4">
        <button 
          className="text-slate-400 hover:text-slate-900 transition-colors"
          onClick={() => setNotificationOpen(!notificationOpen)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
          </svg>
        </button>
        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-medium text-xs">JD</div>
      </div>
    </header>
  );
};

const ProxyStatusCard = () => {
  const [proxyRunning, setProxyRunning] = useState(true);
  const [uptime, setUptime] = useState('2h 14m');
  const [latency, setLatency] = useState('24ms');

  const handleToggleProxy = () => {
    setProxyRunning(!proxyRunning);
  };

  const handleRefresh = () => {
    setLatency(Math.floor(Math.random() * 50 + 10) + 'ms');
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1 block">Proxy Status</span>
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md ${proxyRunning ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'} text-[10px] font-bold tracking-wide uppercase`}>
            <div className={`w-1.5 h-1.5 rounded-full ${proxyRunning ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
            {proxyRunning ? 'Running' : 'Stopped'}
          </span>
        </div>
        <button 
          className="p-2 rounded-full border border-slate-100 bg-slate-50 text-slate-600"
          onClick={handleRefresh}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10"></polyline>
            <polyline points="1 20 1 14 7 14"></polyline>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
          </svg>
        </button>
      </div>
      <h2 className="text-2xl font-semibold tracking-tight text-slate-900 font-mono mb-6">localhost:8080</h2>
      
      <div className="grid grid-cols-2 gap-4 py-4 border-t border-slate-50">
        <div>
          <span className="text-xs text-slate-400 font-medium">Uptime</span>
          <p className="text-slate-900 font-semibold">{uptime}</p>
        </div>
        <div>
          <span className="text-xs text-slate-400 font-medium">Latency</span>
          <p className="text-slate-900 font-semibold">{latency}</p>
        </div>
      </div>
      
      <button 
        className="w-full mt-2 py-3 bg-slate-900 text-white text-sm font-medium rounded-2xl flex items-center justify-center gap-2"
        onClick={handleToggleProxy}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        </svg>
        {proxyRunning ? 'Stop Proxy' : 'Start Proxy'}
      </button>
    </div>
  );
};

const APISecurityCard = () => {
  const [showToken, setShowToken] = useState(false);
  const [token] = useState('sk_1234567890abcdef');

  const handleRotateToken = () => {
    alert('Token rotated successfully!');
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">API Security</span>
        <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-md">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Encrypted</span>
        </div>
      </div>
      <div className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 font-mono text-sm text-slate-400 flex items-center justify-between mb-3">
        <span>{showToken ? token : '●●●●●●●●●●●●'}</span>
        <button onClick={() => setShowToken(!showToken)}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {showToken ? (
              <>
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </>
            ) : (
              <>
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </>
            )}
          </svg>
        </button>
      </div>
      <button 
        className="w-full py-2.5 text-slate-600 text-xs font-semibold hover:bg-slate-50 rounded-xl transition-colors"
        onClick={handleRotateToken}
      >
        Rotate Token
      </button>
    </div>
  );
};

const AvailableModels = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const models = [
    { name: 'gpt-4-turbo', provider: 'OpenAI', context: '128k context', pricing: '$10 / $30', color: 'text-emerald-600' },
    { name: 'gpt-3.5-turbo', provider: 'OpenAI', context: '16k context', pricing: '$0.5 / $1.5', color: 'text-blue-600' },
    { name: 'claude-3-opus', provider: 'Anthropic', context: '200k context', pricing: '$15 / $75', color: 'text-purple-600' }
  ];

  const filteredModels = models.filter(model => 
    model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    model.provider.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <details className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden group" open={isOpen}>
      <summary 
        className="flex items-center justify-between p-6 cursor-pointer list-none"
        onClick={(e) => {
          e.preventDefault();
          setIsOpen(!isOpen);
        }}
      >
        <h3 className="text-base font-semibold text-slate-900">Available Models</h3>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className="text-slate-400 transition-transform duration-200"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </summary>
      {isOpen && (
        <div className="px-6 pb-6">
          <div className="relative mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <input 
              type="text" 
              placeholder="Search models..." 
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm text-slate-700 focus:outline-none placeholder-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="space-y-3">
            {filteredModels.map((model, index) => (
              <div key={index} className="flex justify-between items-center p-3 rounded-2xl bg-slate-50/50">
                <div>
                  <p className={`text-sm font-mono font-medium ${model.color}`}>{model.name}</p>
                  <p className="text-[10px] text-slate-500">{model.provider} • {model.context}</p>
                </div>
                <span className="text-[10px] font-mono text-slate-400">{model.pricing}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </details>
  );
};

const LiveLogs = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [logs] = useState([
    { level: 'INFO', message: 'Proxy service initialized on port 8080' },
    { level: 'INFO', message: 'Loaded 6 model configs' },
    { level: 'INFO', message: 'Health check passed' }
  ]);

  return (
    <details className="bg-[#1C1C1E] rounded-3xl border border-slate-900 shadow-sm overflow-hidden" open={isOpen}>
      <summary 
        className="flex items-center justify-between p-6 cursor-pointer list-none"
        onClick={(e) => {
          e.preventDefault();
          setIsOpen(!isOpen);
        }}
      >
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-white">Live Logs</h3>
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
        </div>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className="text-slate-500 transition-transform duration-200"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </summary>
      {isOpen && (
        <div className="px-6 pb-6 max-h-60 overflow-y-auto font-mono text-[10px] space-y-2">
          {logs.map((log, index) => (
            <div key={index} className="flex gap-2">
              <span className="text-blue-400 font-bold">{log.level}</span>
              <span className="text-slate-300">{log.message}</span>
            </div>
          ))}
        </div>
      )}
    </details>
  );
};

const FloatingActionButton = () => {
  const handleClick = () => {
    alert('Send action triggered!');
  };

  return (
    <button 
      className="fixed bottom-6 right-6 w-14 h-14 bg-slate-900 text-white rounded-full flex items-center justify-center z-30 active:scale-95 transition-transform"
      style={customStyles.fabShadow}
      onClick={handleClick}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="22" y1="2" x2="11" y2="13"></line>
        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
      </svg>
    </button>
  );
};

const BottomNav = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', icon: 'layout-grid', label: 'Overview' },
    { path: '/models', icon: 'box', label: 'Models' },
    { path: '/logs', icon: 'terminal-square', label: 'Logs' },
    { path: '/settings', icon: 'settings', label: 'Settings' }
  ];

  const renderIcon = (iconName) => {
    const icons = {
      'layout-grid': (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
      ),
      'box': (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
          <line x1="12" y1="22.08" x2="12" y2="12"></line>
        </svg>
      ),
      'terminal-square': (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m7 11 2-2-2-2"></path>
          <path d="M11 13h4"></path>
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        </svg>
      ),
      'settings': (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      )
    };
    return icons[iconName];
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-slate-100 flex justify-around items-center py-3 px-6 z-20">
      {navItems.map((item) => (
        <Link 
          key={item.path}
          to={item.path} 
          className={`flex flex-col items-center gap-1 ${location.pathname === item.path ? 'text-slate-900' : 'text-slate-400'}`}
        >
          {renderIcon(item.icon)}
          <span className="text-[10px] font-medium">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
};

const OverviewPage = () => {
  return (
    <main className="flex-1 overflow-y-auto pb-24">
      <div className="p-4 space-y-4 max-w-md mx-auto">
        <ProxyStatusCard />
        <APISecurityCard />
        <AvailableModels />
        <LiveLogs />
      </div>
    </main>
  );
};

const ModelsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const models = [
    { name: 'gpt-4-turbo', provider: 'OpenAI', context: '128k context', pricing: '$10 / $30', color: 'text-emerald-600' },
    { name: 'gpt-3.5-turbo', provider: 'OpenAI', context: '16k context', pricing: '$0.5 / $1.5', color: 'text-blue-600' },
    { name: 'claude-3-opus', provider: 'Anthropic', context: '200k context', pricing: '$15 / $75', color: 'text-purple-600' },
    { name: 'claude-3-sonnet', provider: 'Anthropic', context: '200k context', pricing: '$3 / $15', color: 'text-purple-600' },
    { name: 'gemini-pro', provider: 'Google', context: '32k context', pricing: '$0.5 / $1.5', color: 'text-blue-600' },
    { name: 'llama-2-70b', provider: 'Meta', context: '4k context', pricing: '$0.7 / $0.8', color: 'text-orange-600' }
  ];

  const filteredModels = models.filter(model => 
    model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    model.provider.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="flex-1 overflow-y-auto pb-24">
      <div className="p-4 space-y-4 max-w-md mx-auto">
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">All Models</h2>
          <div className="relative mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <input 
              type="text" 
              placeholder="Search models..." 
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm text-slate-700 focus:outline-none placeholder-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="space-y-3">
            {filteredModels.map((model, index) => (
              <div key={index} className="flex justify-between items-center p-3 rounded-2xl bg-slate-50/50">
                <div>
                  <p className={`text-sm font-mono font-medium ${model.color}`}>{model.name}</p>
                  <p className="text-[10px] text-slate-500">{model.provider} • {model.context}</p>
                </div>
                <span className="text-[10px] font-mono text-slate-400">{model.pricing}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
};

const LogsPage = () => {
  const [logs] = useState([
    { level: 'INFO', message: 'Proxy service initialized on port 8080', time: '14:23:45' },
    { level: 'INFO', message: 'Loaded 6 model configs', time: '14:23:46' },
    { level: 'INFO', message: 'Health check passed', time: '14:23:47' },
    { level: 'INFO', message: 'Request processed successfully', time: '14:24:12' },
    { level: 'WARN', message: 'Rate limit approaching threshold', time: '14:25:03' },
    { level: 'INFO', message: 'Cache hit ratio: 87%', time: '14:26:15' }
  ]);

  return (
    <main className="flex-1 overflow-y-auto pb-24">
      <div className="p-4 space-y-4 max-w-md mx-auto">
        <div className="bg-[#1C1C1E] rounded-3xl p-6 border border-slate-900 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-base font-semibold text-white">Live Logs</h2>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
          <div className="max-h-96 overflow-y-auto font-mono text-[10px] space-y-2">
            {logs.map((log, index) => (
              <div key={index} className="flex gap-2">
                <span className="text-slate-500">{log.time}</span>
                <span className={log.level === 'WARN' ? 'text-yellow-400 font-bold' : 'text-blue-400 font-bold'}>{log.level}</span>
                <span className="text-slate-300">{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
};

const SettingsPage = () => {
  const [notifications, setNotifications] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [theme, setTheme] = useState('light');

  return (
    <main className="flex-1 overflow-y-auto pb-24">
      <div className="p-4 space-y-4 max-w-md mx-auto">
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Settings</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <span className="text-sm text-slate-700">Notifications</span>
              <button 
                className={`w-12 h-6 rounded-full transition-colors ${notifications ? 'bg-slate-900' : 'bg-slate-300'} relative`}
                onClick={() => setNotifications(!notifications)}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${notifications ? 'translate-x-6' : ''}`}></span>
              </button>
            </div>
            
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <span className="text-sm text-slate-700">Auto Refresh</span>
              <button 
                className={`w-12 h-6 rounded-full transition-colors ${autoRefresh ? 'bg-slate-900' : 'bg-slate-300'} relative`}
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${autoRefresh ? 'translate-x-6' : ''}`}></span>
              </button>
            </div>

            <div className="py-3">
              <label className="text-sm text-slate-700 block mb-2">Theme</label>
              <select 
                className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-700 focus:outline-none"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

const App = () => {
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
      
      body {
        font-family: 'Inter', sans-serif;
        background-color: #FDFBF7; 
      }
      
      .font-mono {
        font-family: 'JetBrains Mono', monospace;
      }

      .no-scrollbar::-webkit-scrollbar {
        display: none;
      }

      details summary::-webkit-details-marker {
        display: none;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <Router basename="/">
      <div className="flex flex-col h-screen w-full text-slate-900 bg-[#FDFBF7] overflow-hidden">
        <Header />
        <Routes>
          <Route path="/" element={<OverviewPage />} />
          <Route path="/models" element={<ModelsPage />} />
          <Route path="/logs" element={<LogsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
        <FloatingActionButton />
        <BottomNav />
      </div>
    </Router>
  );
};

export default App;
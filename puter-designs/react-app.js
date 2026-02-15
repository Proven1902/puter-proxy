import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';

const customStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;700&family=Oswald:wght@500;700&display=swap');
  
  body {
    font-family: 'Inter', sans-serif;
    background-color: #ffffff;
    color: #000000;
  }
  
  .font-display {
    font-family: 'Oswald', sans-serif;
  }
  
  .font-mono {
    font-family: 'JetBrains Mono', monospace;
  }
  
  ::-webkit-scrollbar {
    width: 12px;
    height: 12px;
  }
  ::-webkit-scrollbar-track {
    background: #ffffff;
    border-left: 2px solid black;
  }
  ::-webkit-scrollbar-thumb {
    background: #000000;
    border: 2px solid #ffffff;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #000000;
  }
  
  .brutal-border {
    border: 2px solid black;
  }
  
  .brutal-border-b {
    border-bottom: 2px solid black;
  }
  
  .brutal-border-r {
    border-right: 2px solid black;
  }
  
  .brutal-border-t {
    border-top: 2px solid black;
  }
  
  .brutal-shadow {
    box-shadow: 4px 4px 0px 0px #000000;
  }
  
  .no-rounded {
    border-radius: 0 !important;
  }
  
  input:checked + div {
    background-color: #000000 !important;
  }
`;

const Icon = ({ name, className = "w-5 h-5" }) => {
  const icons = {
    'layers': (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
      </svg>
    ),
    'layout-grid': (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="14" y="3" width="7" height="7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="3" y="14" width="7" height="7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="14" y="14" width="7" height="7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    'shield-check': (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    'box': (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    'terminal-square': (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8l4 4-4 4M13 16h4" />
      </svg>
    ),
    'settings': (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <circle cx="12" cy="12" r="3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    'bell': (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
    'help-circle': (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01" />
      </svg>
    ),
    'refresh-cw': (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M1 4v6h6M23 20v-6h-6M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
      </svg>
    ),
    'square': (
      <svg className={className} fill="currentColor" stroke="currentColor" viewBox="0 0 24 24">
        <rect x="6" y="6" width="12" height="12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    'lock': (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    'eye': (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
    'search': (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35" />
      </svg>
    ),
    'download': (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
      </svg>
    ),
    'chevron-down': (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    ),
    'send': (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
      </svg>
    ),
    'trash-2': (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" />
      </svg>
    ),
  };
  
  return icons[name] || null;
};

const Sidebar = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Overview', icon: 'layout-grid' },
    { path: '/proxy-control', label: 'Proxy Control', icon: 'shield-check' },
    { path: '/models', label: 'Models', icon: 'box' },
    { path: '/logs', label: 'Logs', icon: 'terminal-square' },
    { path: '/settings', label: 'Settings', icon: 'settings' },
  ];
  
  return (
    <aside className="w-72 flex-shrink-0 flex flex-col justify-between brutal-border-r bg-white relative z-20">
      <div>
        <div className="flex items-center gap-3 px-6 py-8 brutal-border-b">
          <div className="w-10 h-10 bg-black flex items-center justify-center text-white rounded-full border-2 border-black">
            <Icon name="layers" className="w-6 h-6" />
          </div>
          <span className="text-2xl font-display font-bold uppercase tracking-tight">Puter Proxy</span>
        </div>

        <nav className="flex flex-col">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-4 px-6 py-5 font-bold uppercase tracking-wider brutal-border-b group transition-all ${
                location.pathname === item.path
                  ? 'bg-black text-white'
                  : 'text-black hover:bg-gray-100'
              }`}
            >
              <Icon name={item.icon} className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-4 px-6 py-6 brutal-border-t">
        <div className="w-12 h-12 rounded-full border-2 border-black flex items-center justify-center text-black font-bold text-lg bg-white">JD</div>
        <div className="flex flex-col">
          <span className="text-base font-bold uppercase text-black">John Doe</span>
          <span className="text-xs font-mono bg-black text-white px-1 py-0.5 w-fit">PRO_PLAN</span>
        </div>
      </div>
    </aside>
  );
};

const Header = () => {
  return (
    <header className="flex items-center justify-between px-10 py-8 flex-shrink-0 brutal-border-b bg-white z-10">
      <div>
        <h1 className="text-6xl font-display font-bold uppercase tracking-tighter text-black leading-[0.85]">Dashboard</h1>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 px-4 py-2 bg-white border-2 border-black rounded-full">
          <div className="w-3 h-3 rounded-full bg-black animate-pulse"></div>
          <span className="text-sm font-bold uppercase tracking-wide">Connected to Puter</span>
        </div>
        <button className="text-black hover:bg-black hover:text-white border-2 border-transparent hover:border-black rounded-full p-2 transition-all">
          <Icon name="bell" className="w-6 h-6" />
        </button>
        <button className="text-black hover:bg-black hover:text-white border-2 border-transparent hover:border-black rounded-full p-2 transition-all">
          <Icon name="help-circle" className="w-6 h-6" />
        </button>
      </div>
    </header>
  );
};

const Overview = () => {
  const [tokenVisible, setTokenVisible] = useState(false);
  const [streamEnabled, setStreamEnabled] = useState(true);
  const [selectedModel, setSelectedModel] = useState('gpt-4-turbo');
  const [prompt, setPrompt] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [logFilter, setLogFilter] = useState('');
  const [activeLogType, setActiveLogType] = useState('Info');

  const models = [
    { id: 'gpt-4-turbo', provider: 'OpenAI', context: '128k', costIn: '$10.00', costOut: '$30.00' },
    { id: 'gpt-3.5-turbo', provider: 'OpenAI', context: '16k', costIn: '$0.50', costOut: '$1.50' },
    { id: 'claude-3-opus', provider: 'Anthropic', context: '200k', costIn: '$15.00', costOut: '$75.00' },
    { id: 'claude-3-sonnet', provider: 'Anthropic', context: '200k', costIn: '$3.00', costOut: '$15.00' },
    { id: 'mistral-large', provider: 'Mistral', context: '32k', costIn: '$8.00', costOut: '$24.00' },
  ];

  const logs = [
    { time: '10:42:05.120', type: 'INFO', message: 'Proxy service initialized on port 8080' },
    { time: '10:42:05.125', type: 'INFO', message: 'Loaded 6 model configurations from local storage' },
    { time: '10:42:08.502', type: 'INFO', message: 'Health check passed successfully' },
  ];

  const filteredModels = models.filter(model =>
    model.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    model.provider.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLogs = logs.filter(log =>
    log.message.toLowerCase().includes(logFilter.toLowerCase()) &&
    (activeLogType === 'Info' ? log.type === 'INFO' : true)
  );

  return (
    <div className="flex-1 overflow-y-auto px-10 pb-10 pt-10">
      <div className="grid grid-cols-12 gap-0 max-w-[1600px] mx-auto border-2 border-black bg-white">
        
        <div className="col-span-12 lg:col-span-7 p-8 border-b-2 lg:border-r-2 border-black flex flex-col justify-between h-full min-h-[280px]">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold tracking-widest text-black uppercase mb-4 block border-b-2 border-black w-fit pb-1">Proxy Status</span>
              <div className="flex items-center gap-3 mb-2">
                <span className="flex items-center gap-2 px-3 py-1 rounded-full border-2 border-black bg-black text-white text-xs font-bold tracking-wide uppercase">
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                  Running
                </span>
              </div>
              <h2 className="text-5xl font-display font-bold tracking-tight uppercase mt-4">localhost:8080</h2>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-6 py-2 rounded-full border-2 border-black text-sm font-bold uppercase hover:bg-black hover:text-white transition-all flex items-center gap-2">
                <Icon name="refresh-cw" className="w-4 h-4" />
                Restart
              </button>
              <button className="px-6 py-2 rounded-full border-2 border-black bg-white text-black text-sm font-bold uppercase hover:bg-red-600 hover:border-red-600 hover:text-white transition-all flex items-center gap-2">
                <Icon name="square" className="w-3 h-3 fill-current" />
                Stop
              </button>
            </div>
          </div>
          
          <div className="flex items-end gap-12 mt-8 pt-8 border-t-2 border-black">
            <div>
              <span className="text-xs font-mono font-bold uppercase block mb-1">Uptime</span>
              <p className="text-3xl font-display font-bold">2h 14m</p>
            </div>
            <div>
              <span className="text-xs font-mono font-bold uppercase block mb-1">Latency</span>
              <p className="text-3xl font-display font-bold">24ms</p>
            </div>
            <div className="flex-1 flex justify-end pb-1">
              <div className="h-12 w-48 flex items-end gap-1">
                <div className="w-2 bg-black h-[40%]"></div>
                <div className="w-2 bg-black h-[60%]"></div>
                <div className="w-2 bg-gray-300 h-[30%]"></div>
                <div className="w-2 bg-black h-[50%]"></div>
                <div className="w-2 bg-black h-[70%]"></div>
                <div className="w-2 bg-black h-[45%]"></div>
                <div className="w-2 bg-gray-300 h-[30%]"></div>
                <div className="w-2 bg-black h-[55%]"></div>
                <div className="w-2 bg-gray-300 h-[40%]"></div>
                <div className="w-2 bg-black h-[65%]"></div>
                <div className="w-2 bg-black h-[35%]"></div>
                <div className="w-2 bg-black h-[20%]"></div>
                <div className="w-2 bg-black h-[50%]"></div>
                <div className="w-2 bg-gray-300 h-[80%]"></div>
                <div className="w-2 bg-black h-[40%]"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-5 p-8 border-b-2 border-black flex flex-col bg-white">
          <div className="flex justify-between items-center mb-8 border-b-2 border-black pb-4">
            <span className="text-xs font-bold tracking-widest uppercase">API Security</span>
            <div className="flex items-center gap-1.5 px-3 py-1 border-2 border-black rounded-full bg-white">
              <Icon name="lock" className="w-3 h-3 text-black" />
              <span className="text-[10px] font-bold uppercase tracking-wide">Encrypted</span>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col justify-center gap-6">
            <div className="relative group">
              <label className="text-xs font-bold uppercase mb-2 block">API Token</label>
              <div className="w-full bg-white border-2 border-black px-4 py-3 font-mono text-sm text-black flex items-center justify-between">
                <span className="tracking-widest">{tokenVisible ? 'sk-1234567890abcdef' : '●●●●●●●●●●●●●●●●●●'}</span>
                <button 
                  onClick={() => setTokenVisible(!tokenVisible)}
                  className="text-black hover:scale-110 transition-transform"
                >
                  <Icon name="eye" className="w-5 h-5" />
                </button>
              </div>
            </div>
            <button className="w-full py-4 bg-black text-white border-2 border-black text-sm font-bold uppercase hover:bg-white hover:text-black transition-all tracking-wider">
              Rotate Token
            </button>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-7 p-8 border-b-2 lg:border-b-0 lg:border-r-2 border-black">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-display font-bold uppercase">Available Models</h3>
            <div className="flex gap-3">
              <div className="relative">
                <Icon name="search" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-black font-bold" />
                <input 
                  type="text" 
                  placeholder="SEARCH..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white border-2 border-black rounded-none text-sm font-bold placeholder:text-gray-400 focus:outline-none focus:bg-black focus:text-white w-48 uppercase" 
                />
              </div>
              <button className="p-2 border-2 border-black hover:bg-black hover:text-white transition-colors">
                <Icon name="download" className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-black">
                  <th className="pb-3 text-xs font-bold uppercase tracking-wider pl-1">Model ID</th>
                  <th className="pb-3 text-xs font-bold uppercase tracking-wider">Provider</th>
                  <th className="pb-3 text-xs font-bold uppercase tracking-wider">Context</th>
                  <th className="pb-3 text-xs font-bold uppercase tracking-wider text-right pr-1">Cost (In/Out)</th>
                </tr>
              </thead>
              <tbody className="text-sm font-medium">
                {filteredModels.map((model) => (
                  <tr key={model.id} className="group hover:bg-black hover:text-white transition-colors border-b border-black last:border-0">
                    <td className="py-4 pl-2 font-mono font-bold">{model.id}</td>
                    <td className="py-4">{model.provider}</td>
                    <td className="py-4">{model.context}</td>
                    <td className="py-4 text-right pr-2 font-mono text-xs">{model.costIn} / {model.costOut}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-5 p-8 flex flex-col bg-white">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-display font-bold uppercase">Test Request</h3>
            <div className="relative">
              <select 
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="appearance-none bg-white border-2 border-black py-2 pl-4 pr-10 text-sm font-bold text-black focus:outline-none cursor-pointer hover:bg-black hover:text-white transition-colors uppercase"
              >
                <option>gpt-4-turbo</option>
                <option>claude-3-opus</option>
                <option>mistral-large</option>
              </select>
              <Icon name="chevron-down" className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none mix-blend-difference" />
            </div>
          </div>
          
          <div className="flex-1 flex flex-col gap-4">
            <div className="relative flex-1">
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full h-full min-h-[200px] bg-white border-2 border-black p-4 font-mono text-sm text-black resize-none focus:outline-none focus:ring-4 focus:ring-black/10 placeholder:text-gray-400" 
                placeholder="ENTER PROMPT..."
              ></textarea>
              <span className="absolute bottom-4 right-4 text-[10px] text-black bg-white px-2 py-1 border border-black font-bold uppercase">Markdown supported</span>
            </div>
            
            <div className="flex items-center justify-between mt-2 pt-4 border-t-2 border-black">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center">
                  <input 
                    type="checkbox" 
                    checked={streamEnabled}
                    onChange={(e) => setStreamEnabled(e.target.checked)}
                    className="peer sr-only" 
                  />
                  <div className="w-10 h-6 bg-gray-200 border-2 border-black peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-2 after:border-black after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-black"></div>
                </div>
                <span className="text-sm text-black font-bold uppercase">Stream</span>
              </label>
              
              <button className="px-8 py-3 bg-black text-white text-sm font-bold uppercase border-2 border-black hover:bg-white hover:text-black transition-all flex items-center gap-2 tracking-wide">
                <Icon name="send" className="w-4 h-4" />
                Send
              </button>
            </div>
          </div>
        </div>

        <div className="col-span-12 bg-black border-t-2 border-black p-0 overflow-hidden">
          <div className="flex items-center justify-between px-8 py-4 border-b-2 border-white/20 bg-black">
            <div className="flex items-center gap-6">
              <h3 className="text-lg font-bold text-white uppercase tracking-wider">Live Logs</h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => setActiveLogType('Info')}
                  className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                    activeLogType === 'Info' 
                      ? 'bg-white text-black' 
                      : 'border border-white text-white hover:bg-white hover:text-black'
                  }`}
                >
                  Info
                </button>
                <button 
                  onClick={() => setActiveLogType('Warn')}
                  className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                    activeLogType === 'Warn' 
                      ? 'bg-white text-black' 
                      : 'border border-white text-white hover:bg-white hover:text-black'
                  }`}
                >
                  Warn
                </button>
                <button 
                  onClick={() => setActiveLogType('Error')}
                  className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                    activeLogType === 'Error' 
                      ? 'bg-white text-black' 
                      : 'border border-white text-white hover:bg-white hover:text-black'
                  }`}
                >
                  Error
                </button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Icon name="search" className="w-3 h-3 absolute left-3 top-1/2 -translate-y-1/2 text-white" />
                <input 
                  type="text" 
                  placeholder="FILTER LOGS..." 
                  value={logFilter}
                  onChange={(e) => setLogFilter(e.target.value)}
                  className="pl-9 pr-4 py-1.5 bg-black border border-white rounded-none text-xs text-white focus:outline-none focus:bg-white focus:text-black placeholder:text-gray-500 w-48 uppercase font-mono" 
                />
              </div>
              <button className="text-white hover:text-gray-300 transition-colors">
                <Icon name="trash-2" className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="p-8 font-mono text-xs overflow-y-auto max-h-48 space-y-1 bg-black text-white">
            {filteredLogs.map((log, index) => (
              <div key={index} className="flex gap-6 group hover:bg-white hover:text-black px-4 py-2 transition-colors border-l-2 border-transparent hover:border-black">
                <span className="opacity-60 w-24 flex-shrink-0">{log.time}</span>
                <span className="font-bold w-12 flex-shrink-0">[{log.type}]</span>
                <span>{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const ProxyControl = () => {
  return (
    <div className="flex-1 overflow-y-auto px-10 pb-10 pt-10">
      <div className="max-w-[1600px] mx-auto">
        <h2 className="text-4xl font-display font-bold uppercase mb-8">Proxy Control</h2>
        <div className="bg-white border-2 border-black p-8">
          <p className="text-lg">Proxy control panel content goes here...</p>
        </div>
      </div>
    </div>
  );
};

const Models = () => {
  return (
    <div className="flex-1 overflow-y-auto px-10 pb-10 pt-10">
      <div className="max-w-[1600px] mx-auto">
        <h2 className="text-4xl font-display font-bold uppercase mb-8">Models</h2>
        <div className="bg-white border-2 border-black p-8">
          <p className="text-lg">Models management content goes here...</p>
        </div>
      </div>
    </div>
  );
};

const Logs = () => {
  return (
    <div className="flex-1 overflow-y-auto px-10 pb-10 pt-10">
      <div className="max-w-[1600px] mx-auto">
        <h2 className="text-4xl font-display font-bold uppercase mb-8">Logs</h2>
        <div className="bg-white border-2 border-black p-8">
          <p className="text-lg">Logs viewer content goes here...</p>
        </div>
      </div>
    </div>
  );
};

const Settings = () => {
  return (
    <div className="flex-1 overflow-y-auto px-10 pb-10 pt-10">
      <div className="max-w-[1600px] mx-auto">
        <h2 className="text-4xl font-display font-bold uppercase mb-8">Settings</h2>
        <div className="bg-white border-2 border-black p-8">
          <p className="text-lg">Settings configuration content goes here...</p>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = customStyles;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <Router basename="/">
      <div className="flex h-screen w-full overflow-hidden selection:bg-black selection:text-white">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white relative">
          <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
          <Header />
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/proxy-control" element={<ProxyControl />} />
            <Route path="/models" element={<Models />} />
            <Route path="/logs" element={<Logs />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
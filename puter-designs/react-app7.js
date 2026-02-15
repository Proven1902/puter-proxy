import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';

const customStyles = {
  body: {
    fontFamily: "'Inter', sans-serif",
    backgroundColor: '#FDFBF7'
  },
  scrollbar: `
    ::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    ::-webkit-scrollbar-track {
      background: transparent;
    }
    ::-webkit-scrollbar-thumb {
      background: #e5e5e5;
      border-radius: 3px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: #d4d4d4;
    }
  `
};

const Icon = ({ name, className = "w-5 h-5" }) => {
  const icons = {
    'layers': <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
    'layout-grid': <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" /></svg>,
    'shield-check': <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
    'box': <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
    'terminal-square': <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
    'settings': <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    'bell': <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
    'help-circle': <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    'refresh-cw': <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
    'square': <svg className={className} fill="currentColor" stroke="currentColor" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2" /></svg>,
    'lock': <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
    'eye': <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
    'search': <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
    'download': <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>,
    'chevron-down': <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>,
    'send': <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>,
    'trash-2': <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
  };
  return icons[name] || null;
};

const Sidebar = ({ activeNav, setActiveNav }) => {
  const navItems = [
    { name: 'Overview', icon: 'layout-grid', path: '/' },
    { name: 'Proxy Control', icon: 'shield-check', path: '/proxy-control' },
    { name: 'Models', icon: 'box', path: '/models' },
    { name: 'Logs', icon: 'terminal-square', path: '/logs' },
    { name: 'Settings', icon: 'settings', path: '/settings' }
  ];

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col justify-between border-r border-slate-200/60 bg-[#FDFBF7] px-6 py-8">
      <div>
        <div className="flex items-center gap-3 mb-12 px-2">
          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white">
            <Icon name="layers" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Puter Proxy</span>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              onClick={() => setActiveNav(item.name)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all-200 ${
                activeNav === item.name
                  ? 'bg-white shadow-sm text-slate-900 border border-slate-100'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/50'
              }`}
            >
              <Icon name={item.icon} className={`w-5 h-5 ${activeNav === item.name ? 'text-slate-900' : ''}`} />
              {item.name}
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-3 px-2 pt-6 border-t border-slate-200/60">
        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-medium text-sm">JD</div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-slate-900">John Doe</span>
          <span className="text-xs text-slate-500">Pro Plan</span>
        </div>
      </div>
    </aside>
  );
};

const Header = () => {
  return (
    <header className="flex items-center justify-between px-10 py-8 flex-shrink-0">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-emerald-100 rounded-full shadow-sm">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-sm font-medium text-emerald-700">Connected to Puter</span>
        </div>
        <button className="text-slate-400 hover:text-slate-900 transition-colors">
          <Icon name="bell" />
        </button>
        <button className="text-slate-400 hover:text-slate-900 transition-colors">
          <Icon name="help-circle" />
        </button>
      </div>
    </header>
  );
};

const ProxyStatusCard = () => {
  const [proxyRunning, setProxyRunning] = useState(true);

  const handleStop = () => {
    setProxyRunning(false);
  };

  const handleRestart = () => {
    setProxyRunning(true);
  };

  return (
    <div className="col-span-12 lg:col-span-7 bg-white rounded-3xl p-8 border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] flex flex-col justify-between h-full min-h-[220px]">
      <div className="flex justify-between items-start">
        <div>
          <span className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-2 block">Proxy Status</span>
          <div className="flex items-center gap-3 mb-1">
            <span className={`flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-bold tracking-wide uppercase ${
              proxyRunning 
                ? 'bg-emerald-50 text-emerald-600' 
                : 'bg-slate-100 text-slate-500'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${proxyRunning ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
              {proxyRunning ? 'Running' : 'Stopped'}
            </span>
          </div>
          <h2 className="text-4xl font-semibold tracking-tight text-slate-900 mt-4 font-mono">localhost:8080</h2>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleRestart}
            className="px-5 py-2.5 rounded-full border border-slate-200 text-sm font-medium text-slate-600 hover:border-slate-300 hover:text-slate-900 transition-all bg-white hover:bg-slate-50 flex items-center gap-2"
          >
            <Icon name="refresh-cw" className="w-4 h-4" />
            Restart
          </button>
          <button 
            onClick={handleStop}
            className="px-5 py-2.5 rounded-full bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg shadow-slate-200"
          >
            <Icon name="square" className="w-3 h-3 fill-current" />
            Stop Proxy
          </button>
        </div>
      </div>
      
      <div className="flex items-center gap-8 mt-8 pt-8 border-t border-slate-100">
        <div>
          <span className="text-xs text-slate-400 font-medium">Uptime</span>
          <p className="text-slate-900 font-semibold mt-0.5">2h 14m</p>
        </div>
        <div>
          <span className="text-xs text-slate-400 font-medium">Latency</span>
          <p className="text-slate-900 font-semibold mt-0.5">24ms</p>
        </div>
        <div className="flex-1 flex justify-end">
          <div className="h-8 w-32 flex items-end gap-1">
            <div className="w-1 bg-slate-100 h-[40%] rounded-t-sm"></div>
            <div className="w-1 bg-slate-100 h-[60%] rounded-t-sm"></div>
            <div className="w-1 bg-slate-200 h-[30%] rounded-t-sm"></div>
            <div className="w-1 bg-slate-100 h-[50%] rounded-t-sm"></div>
            <div className="w-1 bg-slate-100 h-[70%] rounded-t-sm"></div>
            <div className="w-1 bg-emerald-400 h-[45%] rounded-t-sm"></div>
            <div className="w-1 bg-slate-100 h-[30%] rounded-t-sm"></div>
            <div className="w-1 bg-slate-100 h-[55%] rounded-t-sm"></div>
            <div className="w-1 bg-slate-200 h-[40%] rounded-t-sm"></div>
            <div className="w-1 bg-slate-100 h-[65%] rounded-t-sm"></div>
            <div className="w-1 bg-slate-100 h-[35%] rounded-t-sm"></div>
            <div className="w-1 bg-slate-100 h-[20%] rounded-t-sm"></div>
            <div className="w-1 bg-slate-100 h-[50%] rounded-t-sm"></div>
            <div className="w-1 bg-slate-200 h-[80%] rounded-t-sm"></div>
            <div className="w-1 bg-slate-100 h-[40%] rounded-t-sm"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const APISecurityCard = () => {
  const [showToken, setShowToken] = useState(false);
  const [token] = useState('sk-1234567890abcdef');

  return (
    <div className="col-span-12 lg:col-span-5 bg-white rounded-3xl p-8 border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">API Security</span>
        <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 rounded-md">
          <Icon name="lock" className="w-3 h-3 text-slate-500" />
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">Encrypted</span>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col justify-center gap-4">
        <div className="relative group">
          <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-mono text-sm text-slate-500 flex items-center justify-between group-hover:border-slate-300 transition-colors">
            <span>{showToken ? token : '●●●●●●●●●●●●●●●●●●'}</span>
            <button 
              onClick={() => setShowToken(!showToken)}
              className="text-slate-400 hover:text-slate-900 transition-colors"
            >
              <Icon name="eye" className="w-4 h-4" />
            </button>
          </div>
        </div>
        <button className="w-full py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 hover:border-slate-300 transition-all">
          Rotate Token
        </button>
      </div>
    </div>
  );
};

const ModelsTable = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const models = [
    { id: 'gpt-4-turbo', provider: 'OpenAI', context: '128k', costIn: '$10.00', costOut: '$30.00', color: 'emerald' },
    { id: 'gpt-3.5-turbo', provider: 'OpenAI', context: '16k', costIn: '$0.50', costOut: '$1.50', color: 'blue' },
    { id: 'claude-3-opus', provider: 'Anthropic', context: '200k', costIn: '$15.00', costOut: '$75.00', color: 'purple' },
    { id: 'claude-3-sonnet', provider: 'Anthropic', context: '200k', costIn: '$3.00', costOut: '$15.00', color: 'purple' },
    { id: 'mistral-large', provider: 'Mistral', context: '32k', costIn: '$8.00', costOut: '$24.00', color: 'orange' },
    { id: 'llama-3-70b', provider: 'Meta', context: '8k', costIn: '$0.90', costOut: '$0.90', color: 'blue' }
  ];

  const filteredModels = models.filter(model => 
    model.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    model.provider.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="col-span-12 lg:col-span-7 bg-white rounded-3xl p-8 border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900">Available Models</h3>
        <div className="flex gap-2">
          <div className="relative">
            <Icon name="search" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search models..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-50 border-none rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-200 placeholder-slate-400 w-48"
            />
          </div>
          <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors">
            <Icon name="download" className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider pl-1">Model ID</th>
              <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Provider</th>
              <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Context</th>
              <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right pr-1">Cost (In/Out)</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {filteredModels.map((model) => (
              <tr key={model.id} className="group hover:bg-slate-50/50 transition-colors">
                <td className={`py-4 pl-1 font-mono font-medium text-${model.color}-600`}>{model.id}</td>
                <td className="py-4 text-slate-600">{model.provider}</td>
                <td className="py-4 text-slate-500">{model.context}</td>
                <td className="py-4 text-right pr-1 text-slate-500 font-mono text-xs">{model.costIn} / {model.costOut}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const TestRequestCard = () => {
  const [selectedModel, setSelectedModel] = useState('gpt-4-turbo');
  const [streamEnabled, setStreamEnabled] = useState(true);
  const [prompt, setPrompt] = useState('');

  const handleSendRequest = () => {
    console.log('Sending request:', { model: selectedModel, prompt, stream: streamEnabled });
  };

  return (
    <div className="col-span-12 lg:col-span-5 bg-white rounded-3xl p-8 border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900">Test Request</h3>
        <div className="relative">
          <select 
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="appearance-none bg-slate-50 border-none rounded-lg py-2 pl-4 pr-10 text-sm font-medium text-slate-700 focus:outline-none cursor-pointer hover:bg-slate-100 transition-colors"
          >
            <option>gpt-4-turbo</option>
            <option>claude-3-opus</option>
            <option>mistral-large</option>
          </select>
          <Icon name="chevron-down" className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>
      
      <div className="flex-1 flex flex-col gap-4">
        <div className="relative flex-1">
          <textarea 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full h-full min-h-[200px] bg-slate-50 border-none rounded-xl p-4 font-mono text-sm text-slate-700 resize-none focus:ring-1 focus:ring-slate-200 focus:outline-none placeholder-slate-400" 
            placeholder="Enter a prompt to test the proxy connection..."
          />
          <span className="absolute bottom-4 right-4 text-[10px] text-slate-400 font-medium">Markdown supported</span>
        </div>
        
        <div className="flex items-center justify-between mt-2">
          <label className="flex items-center gap-2 cursor-pointer group">
            <div className="relative flex items-center">
              <input 
                type="checkbox" 
                checked={streamEnabled}
                onChange={(e) => setStreamEnabled(e.target.checked)}
                className="peer sr-only"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-900"></div>
            </div>
            <span className="text-sm text-slate-600 font-medium">Stream Response</span>
          </label>
          
          <button 
            onClick={handleSendRequest}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-full shadow-lg shadow-slate-200 transition-all flex items-center gap-2"
          >
            <Icon name="send" className="w-4 h-4" />
            Send Request
          </button>
        </div>
      </div>
    </div>
  );
};

const LiveLogsCard = () => {
  const [activeFilter, setActiveFilter] = useState('Info');
  const [filterTerm, setFilterTerm] = useState('');

  const logs = [
    { time: '10:42:05.120', level: 'INFO', message: 'Proxy service initialized on port 8080' },
    { time: '10:42:05.125', level: 'INFO', message: 'Loaded 6 model configurations from local storage' },
    { time: '10:42:08.502', level: 'INFO', message: 'Health check passed successfully' }
  ];

  return (
    <div className="col-span-12 bg-[#1C1C1E] rounded-3xl p-0 border border-slate-900 overflow-hidden shadow-xl shadow-slate-200/50">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#2C2C2E]">
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-semibold text-white">Live Logs</h3>
          <div className="flex gap-1">
            <button 
              onClick={() => setActiveFilter('Info')}
              className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${
                activeFilter === 'Info' 
                  ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' 
                  : 'text-slate-400 hover:bg-white/5'
              }`}
            >
              Info
            </button>
            <button 
              onClick={() => setActiveFilter('Warn')}
              className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${
                activeFilter === 'Warn' 
                  ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' 
                  : 'text-slate-400 hover:bg-white/5'
              }`}
            >
              Warn
            </button>
            <button 
              onClick={() => setActiveFilter('Error')}
              className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${
                activeFilter === 'Error' 
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                  : 'text-slate-400 hover:bg-white/5'
              }`}
            >
              Error
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Icon name="search" className="w-3 h-3 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder="Filter logs..." 
              value={filterTerm}
              onChange={(e) => setFilterTerm(e.target.value)}
              className="pl-8 pr-4 py-1.5 bg-black/20 border border-white/5 rounded-md text-xs text-slate-300 focus:outline-none focus:border-white/20 placeholder-slate-600 w-48"
            />
          </div>
          <button className="text-slate-500 hover:text-slate-300 transition-colors">
            <Icon name="trash-2" className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="p-6 font-mono text-xs overflow-y-auto max-h-48 space-y-2">
        {logs.map((log, index) => (
          <div key={index} className="flex gap-4 group hover:bg-white/5 -mx-6 px-6 py-1 transition-colors">
            <span className="text-slate-500 w-24 flex-shrink-0">{log.time}</span>
            <span className="text-blue-400 font-bold w-12 flex-shrink-0">{log.level}</span>
            <span className="text-slate-300">{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const OverviewPage = () => {
  return (
    <>
      <Header />
      <div className="flex-1 overflow-y-auto px-10 pb-10">
        <div className="grid grid-cols-12 gap-6 max-w-[1600px] mx-auto">
          <ProxyStatusCard />
          <APISecurityCard />
          <ModelsTable />
          <TestRequestCard />
          <LiveLogsCard />
        </div>
      </div>
    </>
  );
};

const PlaceholderPage = ({ title }) => {
  return (
    <>
      <Header />
      <div className="flex-1 overflow-y-auto px-10 pb-10">
        <div className="max-w-[1600px] mx-auto">
          <div className="bg-white rounded-3xl p-16 border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] text-center">
            <h2 className="text-2xl font-semibold text-slate-900 mb-2">{title}</h2>
            <p className="text-slate-500">This page is under construction.</p>
          </div>
        </div>
      </div>
    </>
  );
};

const App = () => {
  const [activeNav, setActiveNav] = useState('Overview');

  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
      
      body {
        font-family: 'Inter', sans-serif;
        background-color: #FDFBF7;
      }
      
      .font-mono {
        font-family: 'JetBrains Mono', monospace;
      }

      ${customStyles.scrollbar}

      .transition-all-200 {
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }
    `;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  return (
    <Router basename="/">
      <div className="flex h-screen w-full text-slate-900 overflow-hidden">
        <Sidebar activeNav={activeNav} setActiveNav={setActiveNav} />
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#FDFBF7]">
          <Routes>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/proxy-control" element={<PlaceholderPage title="Proxy Control" />} />
            <Route path="/models" element={<PlaceholderPage title="Models" />} />
            <Route path="/logs" element={<PlaceholderPage title="Logs" />} />
            <Route path="/settings" element={<PlaceholderPage title="Settings" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
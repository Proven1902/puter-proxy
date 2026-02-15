import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';

const customStyles = {
  scrollbar: `
    ::-webkit-scrollbar {
      width: 12px;
      height: 12px;
    }
    ::-webkit-scrollbar-track {
      background: #ffffff;
      border-left: 2px solid #000000;
    }
    ::-webkit-scrollbar-thumb {
      background: #000000;
      border: 2px solid #ffffff;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: #333333;
    }
  `,
  global: `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&family=JetBrains+Mono:wght@400;500;700&display=swap');
    
    body {
      font-family: 'Inter', sans-serif;
      background-color: #ffffff;
      color: #000000;
    }
    
    .font-mono {
      font-family: 'JetBrains Mono', monospace;
    }
    
    * {
      border-radius: 0px !important;
    }
    
    .rounded-full {
      border-radius: 9999px !important;
    }
  `
};

const Icon = ({ name, className = "w-5 h-5" }) => {
  const icons = {
    'layers': <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
    'layout-grid': <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" strokeWidth="2"/><rect x="14" y="3" width="7" height="7" strokeWidth="2"/><rect x="14" y="14" width="7" height="7" strokeWidth="2"/><rect x="3" y="14" width="7" height="7" strokeWidth="2"/></svg>,
    'shield-check': <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
    'box': <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
    'terminal-square': <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8l4 4-4 4M13 16h4" /></svg>,
    'settings': <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><circle cx="12" cy="12" r="3" strokeWidth="2"/></svg>,
    'bell': <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
    'help-circle': <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth="2"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" /><circle cx="12" cy="17" r="0.5" fill="currentColor"/></svg>,
    'refresh-cw': <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M1 4v6h6M23 20v-6h-6" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" /></svg>,
    'square': <svg className={className} fill="currentColor" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" strokeWidth="2"/></svg>,
    'search': <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" strokeWidth="2"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35" /></svg>,
    'download': <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>,
    'chevron-down': <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>,
    'send': <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>,
    'eye': <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" strokeWidth="2"/></svg>,
    'trash-2': <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" /></svg>,
    'lock': <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeWidth="2"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11V7a5 5 0 0110 0v4" /></svg>
  };
  
  return icons[name] || null;
};

const Sidebar = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'overview', name: 'OVERVIEW', icon: 'layout-grid' },
    { id: 'proxy', name: 'PROXY CONTROL', icon: 'shield-check' },
    { id: 'models', name: 'MODELS', icon: 'box' },
    { id: 'logs', name: 'LOGS', icon: 'terminal-square' },
    { id: 'settings', name: 'SETTINGS', icon: 'settings' }
  ];

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col justify-between border-r-2 border-black bg-white px-0 py-0">
      <div>
        <div className="flex items-center gap-3 p-8 border-b-2 border-black">
          <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white border-2 border-black">
            <Icon name="layers" className="w-6 h-6" />
          </div>
          <span className="text-xl font-black tracking-tighter uppercase">Puter Proxy</span>
        </div>

        <nav className="flex flex-col">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3 px-8 py-5 font-bold border-b-2 border-black transition-all hover:pl-10 ${
                activeTab === item.id 
                  ? 'bg-black text-white' 
                  : 'text-black hover:bg-neutral-100'
              }`}
            >
              <Icon name={item.icon} />
              {item.name}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-3 p-6 border-t-2 border-black bg-neutral-50 hover:bg-black hover:text-white group transition-colors cursor-pointer">
        <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-mono font-bold text-sm border-2 border-black group-hover:bg-white group-hover:text-black">JD</div>
        <div className="flex flex-col">
          <span className="text-sm font-black uppercase">John Doe</span>
          <span className="text-xs font-mono opacity-60">PRO PLAN</span>
        </div>
      </div>
    </aside>
  );
};

const Header = () => {
  return (
    <header className="flex items-center justify-between px-10 py-6 flex-shrink-0 border-b-2 border-black">
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-sm">D</div>
        <h1 className="text-4xl font-black tracking-tighter uppercase">Dashboard</h1>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="w-3 h-3 rounded-full bg-emerald-500 border border-black"></div>
          <span className="text-sm font-bold uppercase tracking-wide">Connected to Puter</span>
        </div>
        <button className="text-black hover:opacity-50 transition-opacity p-2 border-2 border-transparent hover:border-black">
          <Icon name="bell" className="w-6 h-6" />
        </button>
        <button className="text-black hover:opacity-50 transition-opacity p-2 border-2 border-transparent hover:border-black">
          <Icon name="help-circle" className="w-6 h-6" />
        </button>
      </div>
    </header>
  );
};

const ProxyStatusCard = () => {
  const [isRunning, setIsRunning] = useState(true);

  return (
    <div className="col-span-12 lg:col-span-7 bg-white border-2 border-black p-0 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between h-full min-h-[220px]">
      <div className="flex justify-between items-start p-8 border-b-2 border-black">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-black text-white px-2 py-1 text-xs font-bold uppercase">Status</div>
            <span className={`flex items-center gap-2 px-3 py-1 border-2 border-black text-black text-xs font-bold uppercase ${
              isRunning ? 'bg-emerald-100' : 'bg-red-100'
            }`}>
              <div className={`w-2 h-2 rounded-full border border-black ${
                isRunning ? 'bg-emerald-600' : 'bg-red-600'
              }`}></div>
              {isRunning ? 'Running' : 'Stopped'}
            </span>
          </div>
          <h2 className="text-5xl font-black tracking-tighter text-black mt-2 font-mono break-all">localhost:8080</h2>
        </div>
      </div>
      
      <div className="p-8">
        <div className="flex flex-wrap gap-4 mb-8">
          <button 
            onClick={() => alert('Proxy restarted!')}
            className="px-6 py-3 border-2 border-black text-sm font-bold uppercase hover:bg-black hover:text-white transition-all flex items-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1"
          >
            <Icon name="refresh-cw" className="w-4 h-4" />
            Restart
          </button>
          <button 
            onClick={() => setIsRunning(!isRunning)}
            className="px-6 py-3 bg-black text-white border-2 border-black text-sm font-bold uppercase hover:bg-white hover:text-black transition-all flex items-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]"
          >
            <Icon name="square" className="w-3 h-3 fill-current" />
            {isRunning ? 'Stop Proxy' : 'Start Proxy'}
          </button>
        </div>

        <div className="flex items-end gap-12 pt-6 border-t-2 border-black">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider block mb-1">Uptime</span>
            <p className="text-3xl font-mono font-bold">2h 14m</p>
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider block mb-1">Latency</span>
            <p className="text-3xl font-mono font-bold">24ms</p>
          </div>
          
          <div className="flex-1 flex justify-end items-end h-12 gap-1 pb-1">
            {[40, 60, 30, 50, 70, 45, 30, 55, 40, 65, 35, 20, 50, 80, 40].map((height, i) => (
              <div 
                key={i}
                className={`w-2 border border-black ${i === 5 || i === 13 ? 'bg-black' : i % 3 === 0 ? 'bg-neutral-300' : 'bg-neutral-200'}`}
                style={{ height: `${height}%` }}
              ></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const SecurityCard = () => {
  const [showToken, setShowToken] = useState(false);
  const token = 'pk_live_51J3qY2H3qY2H3qY2H';

  return (
    <div className="col-span-12 lg:col-span-5 bg-white border-2 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col">
      <div className="flex justify-between items-center mb-8 border-b-2 border-black pb-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold">S</div>
          <span className="text-lg font-black tracking-tight uppercase">API Security</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 bg-black text-white border-2 border-black">
          <Icon name="lock" className="w-3 h-3" />
          <span className="text-[10px] font-bold uppercase tracking-wide">Encrypted</span>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col justify-center gap-6">
        <div className="relative group">
          <label className="text-xs font-bold uppercase mb-2 block">Token</label>
          <div className="w-full bg-white border-2 border-black px-4 py-4 font-mono text-sm text-black flex items-center justify-between hover:bg-neutral-50 transition-colors">
            <span>{showToken ? token : '●●●●●●●●●●●●●●●●●●'}</span>
            <button 
              onClick={() => setShowToken(!showToken)}
              className="text-black hover:text-neutral-500 transition-colors"
            >
              <Icon name="eye" />
            </button>
          </div>
        </div>
        <button 
          onClick={() => alert('Token rotated successfully!')}
          className="w-full py-4 bg-white border-2 border-black text-black text-sm font-bold uppercase hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1"
        >
          Rotate Token
        </button>
      </div>
    </div>
  );
};

const ModelsTable = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const models = [
    { id: 'gpt-4-turbo', provider: 'OpenAI', context: '128k', costIn: '$10.00', costOut: '$30.00' },
    { id: 'gpt-3.5-turbo', provider: 'OpenAI', context: '16k', costIn: '$0.50', costOut: '$1.50' },
    { id: 'claude-3-opus', provider: 'Anthropic', context: '200k', costIn: '$15.00', costOut: '$75.00' },
    { id: 'claude-3-sonnet', provider: 'Anthropic', context: '200k', costIn: '$3.00', costOut: '$15.00' },
    { id: 'mistral-large', provider: 'Mistral', context: '32k', costIn: '$8.00', costOut: '$24.00' },
    { id: 'llama-3-70b', provider: 'Meta', context: '8k', costIn: '$0.90', costOut: '$0.90' }
  ];

  const filteredModels = models.filter(model => 
    model.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    model.provider.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="col-span-12 lg:col-span-7 bg-white border-2 border-black p-0 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex items-center justify-between p-8 border-b-2 border-black">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold">M</div>
          <h3 className="text-lg font-black uppercase">Available Models</h3>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <Icon name="search" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-black" />
            <input 
              type="text" 
              placeholder="SEARCH..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border-2 border-black text-sm font-bold placeholder-neutral-400 w-48 focus:bg-neutral-50 focus:outline-none"
            />
          </div>
          <button 
            onClick={() => alert('Models exported!')}
            className="p-2 border-2 border-black hover:bg-black hover:text-white transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            <Icon name="download" className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b-2 border-black bg-neutral-100">
              <th className="py-3 px-6 text-xs font-black text-black uppercase tracking-wider border-r-2 border-black">Model ID</th>
              <th className="py-3 px-6 text-xs font-black text-black uppercase tracking-wider border-r-2 border-black">Provider</th>
              <th className="py-3 px-6 text-xs font-black text-black uppercase tracking-wider border-r-2 border-black">Context</th>
              <th className="py-3 px-6 text-xs font-black text-black uppercase tracking-wider text-right">Cost (In/Out)</th>
            </tr>
          </thead>
          <tbody className="text-sm font-mono">
            {filteredModels.map((model, index) => (
              <tr 
                key={model.id}
                className={`group hover:bg-neutral-50 transition-colors ${index < filteredModels.length - 1 ? 'border-b border-black' : ''}`}
              >
                <td className="py-4 px-6 font-bold border-r border-black">{model.id}</td>
                <td className="py-4 px-6 border-r border-black">{model.provider}</td>
                <td className="py-4 px-6 border-r border-black">{model.context}</td>
                <td className="py-4 px-6 text-right">{model.costIn} / {model.costOut}</td>
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
  const [prompt, setPrompt] = useState('');
  const [streamResponse, setStreamResponse] = useState(true);

  const handleSend = () => {
    if (!prompt.trim()) {
      alert('Please enter a prompt');
      return;
    }
    alert(`Sending request to ${selectedModel}:\n${prompt}`);
  };

  return (
    <div className="col-span-12 lg:col-span-5 bg-white border-2 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col">
      <div className="flex items-center justify-between mb-8 border-b-2 border-black pb-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold">T</div>
          <h3 className="text-lg font-black uppercase">Test Request</h3>
        </div>
        <div className="relative">
          <select 
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="appearance-none bg-white border-2 border-black py-2 pl-4 pr-10 text-sm font-bold text-black focus:outline-none cursor-pointer hover:bg-neutral-50 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            <option>gpt-4-turbo</option>
            <option>claude-3-opus</option>
            <option>mistral-large</option>
          </select>
          <Icon name="chevron-down" className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-black pointer-events-none" />
        </div>
      </div>
      
      <div className="flex-1 flex flex-col gap-6">
        <div className="relative flex-1">
          <textarea 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full h-full min-h-[200px] bg-white border-2 border-black p-4 font-mono text-sm text-black resize-none focus:bg-neutral-50 focus:outline-none placeholder-neutral-400" 
            placeholder="Enter a prompt to test the proxy connection..."
          ></textarea>
          <span className="absolute bottom-4 right-4 text-[10px] text-black font-bold uppercase tracking-wider bg-white border border-black px-1">Markdown supported</span>
        </div>
        
        <div className="flex items-center justify-between mt-2">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative flex items-center">
              <input 
                type="checkbox" 
                checked={streamResponse}
                onChange={(e) => setStreamResponse(e.target.checked)}
                className="peer sr-only"
              />
              <div className="w-10 h-6 bg-white border-2 border-black peer-focus:outline-none peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-black after:border after:border-black after:h-4 after:w-4 after:transition-all peer-checked:bg-white"></div>
            </div>
            <span className="text-xs font-bold uppercase tracking-wide">Stream Response</span>
          </label>
          
          <button 
            onClick={handleSend}
            className="px-6 py-3 bg-black hover:bg-neutral-800 text-white text-sm font-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] transition-all flex items-center gap-2 border-2 border-black active:shadow-none active:translate-x-1 active:translate-y-1"
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
  const [filter, setFilter] = useState('info');
  const [searchTerm, setSearchTerm] = useState('');
  
  const logs = [
    { time: '10:42:05.120', level: 'INFO', message: 'Proxy service initialized on port 8080' },
    { time: '10:42:05.125', level: 'INFO', message: 'Loaded 6 model configurations from local storage' },
    { time: '10:42:08.502', level: 'INFO', message: 'Health check passed successfully' }
  ];

  const filteredLogs = logs.filter(log => 
    (filter === 'all' || log.level.toLowerCase() === filter) &&
    (searchTerm === '' || log.message.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="col-span-12 bg-black text-white p-0 border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)] overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900">
        <div className="flex items-center gap-4">
          <div className="w-4 h-4 bg-white rounded-full animate-pulse"></div>
          <h3 className="text-sm font-bold uppercase tracking-wider">Live Logs</h3>
          <div className="flex gap-2 ml-4">
            <button 
              onClick={() => setFilter('info')}
              className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                filter === 'info' 
                  ? 'bg-blue-600 border border-blue-400 text-white' 
                  : 'border border-neutral-600 text-neutral-400 hover:bg-neutral-800'
              }`}
            >
              Info
            </button>
            <button 
              onClick={() => setFilter('warn')}
              className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                filter === 'warn' 
                  ? 'bg-yellow-600 border border-yellow-400 text-white' 
                  : 'border border-neutral-600 text-neutral-400 hover:bg-neutral-800'
              }`}
            >
              Warn
            </button>
            <button 
              onClick={() => setFilter('error')}
              className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                filter === 'error' 
                  ? 'bg-red-600 border border-red-400 text-white' 
                  : 'border border-neutral-600 text-neutral-400 hover:bg-neutral-800'
              }`}
            >
              Error
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Icon name="search" className="w-3 h-3 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input 
              type="text" 
              placeholder="FILTER LOGS..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-4 py-1.5 bg-black border border-neutral-700 text-xs text-white focus:outline-none focus:border-white w-48 font-mono"
            />
          </div>
          <button 
            onClick={() => alert('Logs cleared!')}
            className="text-neutral-500 hover:text-white transition-colors"
          >
            <Icon name="trash-2" className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="p-6 font-mono text-xs overflow-y-auto max-h-48 space-y-0">
        {filteredLogs.map((log, index) => (
          <div 
            key={index}
            className="flex gap-4 group hover:bg-neutral-900 -mx-6 px-6 py-2 transition-colors border-b border-neutral-900"
          >
            <span className="text-neutral-500 w-24 flex-shrink-0">{log.time}</span>
            <span className="text-blue-400 font-bold w-12 flex-shrink-0">{log.level}</span>
            <span className="text-neutral-300">{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const DashboardPage = () => {
  return (
    <div className="grid grid-cols-12 gap-8 max-w-[1600px] mx-auto">
      <ProxyStatusCard />
      <SecurityCard />
      <ModelsTable />
      <TestRequestCard />
      <LiveLogsCard />
    </div>
  );
};

const App = () => {
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = customStyles.global + customStyles.scrollbar;
    document.head.appendChild(styleElement);
    return () => document.head.removeChild(styleElement);
  }, []);

  return (
    <Router basename="/">
      <div className="flex h-screen w-full text-black overflow-hidden bg-white">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
          <Header />
          
          <div className="flex-1 overflow-y-auto p-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9IiNlN2U3ZTciLz48L3N2Zz4=')]">
            <DashboardPage />
          </div>
        </main>
      </div>
    </Router>
  );
};

export default App;
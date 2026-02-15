import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

const customStyles = {
  scrollbar: `
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    ::-webkit-scrollbar-track {
      background: #E5E5E5;
    }
    ::-webkit-scrollbar-thumb {
      background: #1A1A1A;
      border: 2px solid #E5E5E5;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: #4A4A4A;
    }
  `,
  fonts: `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
  `
};

const NavLink = ({ icon, children, active = false }) => (
  <a 
    href="#" 
    className={`flex items-center gap-3 px-4 py-3 ${active ? 'bg-black text-white' : 'text-[#666] hover:text-black hover:bg-black/5'} font-medium transition-all duration-200 rounded-none`}
  >
    <i data-lucide={icon} className={`w-5 h-5 ${active ? 'text-[#DEDD26]' : ''}`}></i>
    {children}
  </a>
);

const Sidebar = () => {
  const [activeNav, setActiveNav] = useState('overview');

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col justify-between bg-[#E5E5E5] px-6 py-8">
      <div>
        <div className="flex items-center gap-3 mb-12 px-2">
          <div className="w-8 h-8 bg-black rounded-none flex items-center justify-center text-white">
            <i data-lucide="layers" className="w-5 h-5"></i>
          </div>
          <span className="text-lg font-bold tracking-tight text-black">Puter Proxy</span>
        </div>

        <nav className="space-y-2">
          <NavLink icon="layout-grid" active={activeNav === 'overview'}>Overview</NavLink>
          <NavLink icon="shield-check">Proxy Control</NavLink>
          <NavLink icon="box">Models</NavLink>
          <NavLink icon="terminal-square">Logs</NavLink>
          <NavLink icon="settings">Settings</NavLink>
        </nav>
      </div>

      <div className="flex items-center gap-3 px-2 pt-6 border-t border-black/10">
        <div className="w-10 h-10 rounded-none bg-black flex items-center justify-center text-[#DEDD26] font-bold text-sm">JD</div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-black">John Doe</span>
          <span className="text-xs text-[#666]">Pro Plan</span>
        </div>
      </div>
    </aside>
  );
};

const Header = () => (
  <header className="flex items-center justify-between px-10 py-8 flex-shrink-0">
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-black">Dashboard</h1>
    </div>
    <div className="flex items-center gap-6">
      <div className="flex items-center gap-2 px-4 py-2 bg-black rounded-none shadow-none">
        <div className="w-2 h-2 bg-[#DEDD26] animate-pulse rounded-full"></div>
        <span className="text-sm font-medium text-white">Connected to Puter</span>
      </div>
      <button className="text-[#666] hover:text-black transition-colors">
        <i data-lucide="bell" className="w-6 h-6 stroke-[1.5]"></i>
      </button>
      <button className="text-[#666] hover:text-black transition-colors">
        <i data-lucide="help-circle" className="w-6 h-6 stroke-[1.5]"></i>
      </button>
    </div>
  </header>
);

const ProxyStatusCard = () => {
  const [isRunning, setIsRunning] = useState(true);

  const handleRestart = () => {
    setIsRunning(false);
    setTimeout(() => setIsRunning(true), 1000);
  };

  const handleStop = () => {
    setIsRunning(false);
  };

  return (
    <div className="col-span-12 lg:col-span-7 bg-[#4A4A4A] rounded-none p-8 flex flex-col justify-between h-full min-h-[260px]">
      <div className="flex justify-between items-start">
        <div>
          <span className="text-sm font-medium text-[#DEDD26] mb-1 block">Proxy Status</span>
          <h2 className="text-6xl font-normal tracking-tighter text-white mt-2 font-inter">localhost:8080</h2>
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-[#DEDD26] text-black text-xs font-bold uppercase tracking-wider">
            <div className="w-1.5 h-1.5 bg-black rounded-none"></div>
            {isRunning ? 'Running' : 'Stopped'}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleRestart}
            className="px-5 py-2.5 rounded-none border border-white/20 text-sm font-medium text-white hover:bg-white/10 transition-all flex items-center gap-2"
          >
            <i data-lucide="refresh-cw" className="w-4 h-4"></i>
            Restart
          </button>
          <button 
            onClick={handleStop}
            className="px-5 py-2.5 rounded-none bg-black text-white text-sm font-medium hover:bg-gray-900 transition-all flex items-center gap-2 border border-black"
          >
            <i data-lucide="square" className="w-3 h-3 fill-current"></i>
            Stop
          </button>
        </div>
      </div>
      
      <div className="flex items-center gap-12 mt-8 pt-8 border-t border-white/10">
        <div>
          <span className="text-xs text-white/60 font-medium uppercase tracking-wide">Uptime</span>
          <p className="text-white text-xl font-normal mt-1">2h 14m</p>
        </div>
        <div>
          <span className="text-xs text-white/60 font-medium uppercase tracking-wide">Latency</span>
          <p className="text-white text-xl font-normal mt-1">24ms</p>
        </div>
        <div className="flex-1 flex justify-end">
          <div className="h-10 w-48 flex items-end gap-1.5 opacity-80">
            {[40, 60, 30, 50, 70, 45, 30, 55, 40, 65, 35, 20, 50, 80, 40].map((height, i) => (
              <div 
                key={i}
                className={`w-1.5 ${i === 5 ? 'bg-[#DEDD26]' : 'bg-white/20'}`}
                style={{ height: `${height}%` }}
              ></div>
            ))}
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
    <div className="col-span-12 lg:col-span-5 bg-[#DEDD26] rounded-none p-8 flex flex-col justify-between h-full min-h-[260px]">
      <div className="flex justify-between items-start">
        <div className="flex flex-col">
          <span className="text-3xl font-medium text-black tracking-tight mb-2">API Security</span>
          <div className="flex items-center gap-1.5 w-fit border-b border-black pb-0.5">
            <span className="text-xs font-bold text-black uppercase tracking-wide">Encrypted</span>
          </div>
        </div>
        <i data-lucide="lock" className="w-12 h-12 text-black stroke-[1]"></i>
      </div>
      
      <div className="flex-1 flex flex-col justify-end gap-4 mt-8">
        <div className="relative group">
          <div className="w-full bg-white/50 border-0 rounded-none px-4 py-4 font-mono text-sm text-black flex items-center justify-between transition-colors">
            <span className="tracking-widest">{showToken ? token : '●●●●●●●●●●●●'}</span>
            <button 
              onClick={() => setShowToken(!showToken)}
              className="text-black/60 hover:text-black transition-colors"
            >
              <i data-lucide={showToken ? "eye-off" : "eye"} className="w-5 h-5"></i>
            </button>
          </div>
        </div>
        <button className="w-full py-4 bg-black text-white rounded-none text-sm font-medium hover:bg-gray-900 transition-all flex justify-between px-6 items-center group">
          Rotate Token
          <i data-lucide="arrow-right" className="w-4 h-4 group-hover:translate-x-1 transition-transform"></i>
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
    <div className="col-span-12 lg:col-span-7 bg-white rounded-none p-8 border-0">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-2xl font-bold text-black tracking-tight">Available Models</h3>
        <div className="flex gap-2">
          <div className="relative">
            <i data-lucide="search" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-[#F5F5F5] border-none rounded-none text-sm text-black focus:outline-none focus:ring-1 focus:ring-black placeholder-gray-400 w-48 font-medium"
            />
          </div>
          <button className="p-2 text-black bg-[#F5F5F5] hover:bg-[#E5E5E5] rounded-none transition-colors">
            <i data-lucide="download" className="w-4 h-4"></i>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="pb-3 text-xs font-bold text-black uppercase tracking-wider pl-1">Model ID</th>
              <th className="pb-3 text-xs font-bold text-black uppercase tracking-wider">Provider</th>
              <th className="pb-3 text-xs font-bold text-black uppercase tracking-wider">Context</th>
              <th className="pb-3 text-xs font-bold text-black uppercase tracking-wider text-right pr-1">Cost (In/Out)</th>
            </tr>
          </thead>
          <tbody className="text-sm font-medium">
            {filteredModels.map((model, index) => (
              <tr key={index} className="group hover:bg-[#DEDD26]/20 transition-colors border-b border-gray-100">
                <td className="py-4 pl-1 font-mono text-black">{model.id}</td>
                <td className="py-4 text-gray-600">{model.provider}</td>
                <td className="py-4 text-gray-500">{model.context}</td>
                <td className="py-4 text-right pr-1 text-gray-500 font-mono text-xs">{model.costIn} / {model.costOut}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const TestPanel = () => {
  const [selectedModel, setSelectedModel] = useState('gpt-4-turbo');
  const [prompt, setPrompt] = useState('');
  const [isStreaming, setIsStreaming] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const handleSend = () => {
    if (prompt.trim()) {
      setIsSending(true);
      setTimeout(() => setIsSending(false), 2000);
    }
  };

  return (
    <div className="col-span-12 lg:col-span-5 bg-[#DEDD26] rounded-none p-8 flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-col">
          <h3 className="text-3xl font-medium text-black tracking-tight">Test</h3>
          <div className="w-8 h-1 bg-black mt-2"></div>
        </div>
        <div className="relative">
          <select 
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="appearance-none bg-white/50 border-none rounded-none py-2 pl-4 pr-10 text-sm font-bold text-black focus:outline-none cursor-pointer hover:bg-white/70 transition-colors uppercase tracking-wide"
          >
            <option>gpt-4-turbo</option>
            <option>claude-3-opus</option>
            <option>mistral-large</option>
          </select>
          <i data-lucide="chevron-down" className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-black pointer-events-none"></i>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col gap-4">
        <div className="relative flex-1">
          <textarea 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full h-full min-h-[200px] bg-white/50 border-none rounded-none p-4 font-mono text-sm text-black resize-none focus:ring-1 focus:ring-black focus:outline-none placeholder-black/50" 
            placeholder="Enter a prompt to test..."
          ></textarea>
          <span className="absolute bottom-4 right-4 text-[10px] text-black font-bold uppercase tracking-wide">Markdown supported</span>
        </div>
        
        <div className="flex items-center justify-between mt-2 pt-4 border-t border-black/10">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative flex items-center">
              <input 
                type="checkbox" 
                checked={isStreaming}
                onChange={(e) => setIsStreaming(e.target.checked)}
                className="peer sr-only"
              />
              <div className="w-10 h-6 bg-black/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
            </div>
            <span className="text-sm text-black font-bold">Stream</span>
          </label>
          
          <button 
            onClick={handleSend}
            disabled={isSending}
            className="px-6 py-3 bg-black hover:bg-gray-900 text-[#DEDD26] text-sm font-bold rounded-none transition-all flex items-center gap-2 uppercase tracking-wide disabled:opacity-50"
          >
            <i data-lucide="send" className="w-4 h-4"></i>
            {isSending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
      
      <div className="mt-4 flex justify-end">
        <i data-lucide="fan" className="w-12 h-12 text-black stroke-[1]" style={{ animation: 'spin 10s linear infinite' }}></i>
      </div>
    </div>
  );
};

const LiveLogs = () => {
  const [filterText, setFilterText] = useState('');
  const [logs, setLogs] = useState([
    { time: '10:42:05.120', level: 'INFO', message: 'Proxy service initialized on port 8080' },
    { time: '10:42:05.125', level: 'INFO', message: 'Loaded 6 model configurations from local storage' },
    { time: '10:42:08.502', level: 'INFO', message: 'Health check passed successfully' }
  ]);

  const filteredLogs = logs.filter(log =>
    log.message.toLowerCase().includes(filterText.toLowerCase())
  );

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="col-span-12 bg-black rounded-none p-0 overflow-hidden border-t-4 border-[#DEDD26]">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#1A1A1A]">
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Live Logs</h3>
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-[#DEDD26] rounded-full"></div>
            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <i data-lucide="search" className="w-3 h-3 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"></i>
            <input 
              type="text" 
              placeholder="Filter..." 
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="pl-8 pr-4 py-1.5 bg-white/5 border border-white/10 rounded-none text-xs text-gray-300 focus:outline-none focus:border-[#DEDD26] placeholder-gray-600 w-48"
            />
          </div>
          <button 
            onClick={clearLogs}
            className="text-gray-500 hover:text-white transition-colors"
          >
            <i data-lucide="trash-2" className="w-4 h-4"></i>
          </button>
        </div>
      </div>
      
      <div className="p-6 font-mono text-xs overflow-y-auto max-h-48 space-y-2 bg-black">
        {filteredLogs.map((log, index) => (
          <div key={index} className="flex gap-4 group hover:bg-white/5 -mx-6 px-6 py-1 transition-colors border-l-2 border-transparent hover:border-[#DEDD26]">
            <span className="text-gray-500 w-24 flex-shrink-0">{log.time}</span>
            <span className="text-[#DEDD26] font-bold w-12 flex-shrink-0">{log.level}</span>
            <span className="text-gray-300">{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const Dashboard = () => {
  return (
    <>
      <Header />
      <div className="flex-1 overflow-y-auto px-10 pb-10">
        <div className="grid grid-cols-12 gap-4 max-w-[1600px] mx-auto">
          <ProxyStatusCard />
          <APISecurityCard />
          <ModelsTable />
          <TestPanel />
          <LiveLogs />
        </div>
      </div>
    </>
  );
};

const App = () => {
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      ${customStyles.fonts}
      ${customStyles.scrollbar}
      body {
        font-family: 'Inter', sans-serif;
        background-color: #E5E5E5;
        color: #1A1A1A;
      }
      .font-mono {
        font-family: 'JetBrains Mono', monospace;
      }
      .font-inter {
        font-family: 'Inter', sans-serif;
      }
      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }
    `;
    document.head.appendChild(style);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/lucide@latest';
    script.onload = () => {
      if (window.lucide) {
        window.lucide.createIcons();
      }
    };
    document.body.appendChild(script);

    const observer = new MutationObserver(() => {
      if (window.lucide) {
        window.lucide.createIcons();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => {
      document.head.removeChild(style);
      observer.disconnect();
    };
  }, []);

  return (
    <Router basename="/">
      <div className="flex h-screen w-full overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#E5E5E5]">
          <Routes>
            <Route path="/" element={<Dashboard />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
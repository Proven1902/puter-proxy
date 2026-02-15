import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

const customStyles = {
  bgColor: '#F3F2F0',
  textPrimary: '#111111',
  textSecondary: '#555555',
  accentOrange: '#FF3D18',
  lineColor: '#111111',
  lineLight: 'rgba(17, 17, 17, 0.15)',
};

const ScribbleSVG = () => (
  <svg className="absolute -top-[20%] -left-[10%] w-[120%] h-[140%] fill-none stroke-current pointer-events-none opacity-80 -rotate-[2deg]" viewBox="0 0 200 60" strokeWidth="2">
    <path d="M10,30 Q50,5 90,30 T180,30" fill="none" />
  </svg>
);

const NavBar = () => {
  const [activeNav, setActiveNav] = useState('Dashboard');

  return (
    <nav className="flex justify-between items-center px-12 py-6 border-b" style={{ borderColor: customStyles.lineLight }}>
      <div className="font-serif text-2xl font-semibold">Puter Proxy.</div>
      <div className="flex gap-8">
        {['Dashboard', 'Models', 'Analytics', 'Security'].map((item) => (
          <a
            key={item}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setActiveNav(item);
            }}
            className="font-sans text-xs uppercase tracking-wider relative pb-1 hover:after:content-[''] hover:after:absolute hover:after:bottom-0 hover:after:left-0 hover:after:w-full hover:after:h-px hover:after:bg-current"
            style={{ color: customStyles.textPrimary }}
          >
            {item}
          </a>
        ))}
      </div>
    </nav>
  );
};

const Hero = ({ onDeployClick }) => {
  return (
    <header className="px-12 py-16 flex justify-between items-start">
      <div className="max-w-[60%]">
        <span className="block mb-4 font-sans text-xs uppercase tracking-wider" style={{ color: customStyles.textSecondary }}>
          System Status
        </span>
        <h1 className="font-serif text-8xl leading-[0.9] font-normal mb-8 tracking-tight">
          All systems{' '}
          <span className="relative inline-block">
            operational
            <ScribbleSVG />
          </span>
          <br />
          at max capacity.
        </h1>
      </div>
      <button
        onClick={onDeployClick}
        className="flex flex-col justify-center items-center text-center w-40 h-40 rounded-full font-sans text-xs font-semibold uppercase tracking-wider cursor-pointer transition-transform duration-300 hover:scale-105 leading-snug text-white -mt-8"
        style={{ backgroundColor: customStyles.accentOrange }}
      >
        Deploy
        <br />
        New Proxy
      </button>
    </header>
  );
};

const ModelCard = ({ name, status, latency, requests }) => {
  const isActive = status === 'Online';

  return (
    <div className="p-8 border-r border-b transition-colors hover:bg-white/40" style={{ borderColor: customStyles.lineLight }}>
      <div className="flex justify-between mb-6">
        <span className="font-serif text-2xl font-semibold">{name}</span>
        <span
          className={`font-sans text-[0.65rem] uppercase tracking-wider px-2 py-1 rounded-xl border ${
            isActive ? 'text-[#F3F2F0]' : ''
          }`}
          style={{
            borderColor: customStyles.lineColor,
            backgroundColor: isActive ? customStyles.textPrimary : 'transparent',
          }}
        >
          {status}
        </span>
      </div>
      <div className="h-[60px] w-full relative overflow-hidden mt-4" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0) 100%)' }}>
        <svg className="absolute bottom-0 left-0 right-0 top-5 w-full opacity-60" preserveAspectRatio="none">
          <path d="M0,50 Q20,30 40,50 T80,50 T120,40 T160,50 T200,30 T240,50 T280,10" fill="none" stroke="black" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
      <div className="flex justify-between mt-8 font-sans text-[0.7rem] uppercase tracking-wide" style={{ color: customStyles.textSecondary }}>
        <span>Latency</span>
        <span className="font-semibold" style={{ color: customStyles.textPrimary }}>
          {latency}
        </span>
      </div>
      <div className="flex justify-between mt-0 font-sans text-[0.7rem] uppercase tracking-wide" style={{ color: customStyles.textSecondary }}>
        <span>Requests</span>
        <span className="font-semibold" style={{ color: customStyles.textPrimary }}>
          {requests}
        </span>
      </div>
    </div>
  );
};

const ModelsPanel = () => {
  const models = [
    { name: 'GPT-4 Turbo', status: 'Online', latency: '240ms', requests: '14.2k/hr' },
    { name: 'Claude 3 Opus', status: 'Online', latency: '890ms', requests: '8.1k/hr' },
    { name: 'Mistral Large', status: 'Standby', latency: '--', requests: '0/hr' },
    { name: 'Llama 3 70B', status: 'Online', latency: '120ms', requests: '32.5k/hr' },
  ];

  return (
    <div className="border-r" style={{ borderColor: customStyles.lineLight }}>
      <div className="px-12 py-12 pb-6 font-serif text-5xl font-normal flex justify-between items-baseline">
        <h2>Active Models</h2>
      </div>
      <div className="grid grid-cols-2 border-t" style={{ borderColor: customStyles.lineLight }}>
        {models.map((model, index) => (
          <div key={index} className={index % 2 === 1 ? 'border-r-0' : ''}>
            <ModelCard {...model} />
          </div>
        ))}
      </div>
    </div>
  );
};

const TestPanel = () => {
  const [endpoint, setEndpoint] = useState('https://api.puter.com/v1/chat');
  const [model, setModel] = useState('gpt-4-turbo');
  const [authToken, setAuthToken] = useState('sk_live_5928301...');
  const [response, setResponse] = useState(`{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1677652288,
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "System operational."
    },
    "finish_reason": "stop"
  }]
}`);

  const handleSendRequest = () => {
    console.log('Sending request with:', { endpoint, model, authToken });
  };

  return (
    <div className="px-12 py-12 flex flex-col" style={{ backgroundColor: '#EFEEEC' }}>
      <h3 className="font-serif text-3xl mb-8">Test Request</h3>

      <div className="mb-8">
        <label className="block font-sans text-[0.65rem] uppercase tracking-wider mb-2 font-semibold">Endpoint</label>
        <input
          type="text"
          className="w-full bg-transparent border-none border-b pb-2 font-sans text-base outline-none"
          style={{ borderBottomColor: customStyles.textPrimary, color: customStyles.textPrimary }}
          value={endpoint}
          readOnly
        />
      </div>

      <div className="mb-8">
        <label className="block font-sans text-[0.65rem] uppercase tracking-wider mb-2 font-semibold">Model Selection</label>
        <input
          type="text"
          className="w-full bg-transparent border-none border-b pb-2 font-sans text-base outline-none"
          style={{ borderBottomColor: customStyles.textPrimary, color: customStyles.textPrimary }}
          placeholder="Select model..."
          value={model}
          onChange={(e) => setModel(e.target.value)}
        />
      </div>

      <div className="mb-8">
        <label className="block font-sans text-[0.65rem] uppercase tracking-wider mb-2 font-semibold">Auth Token</label>
        <input
          type="password"
          className="w-full bg-transparent border-none border-b pb-2 font-sans text-base outline-none"
          style={{ borderBottomColor: customStyles.textPrimary, color: customStyles.textPrimary }}
          value={authToken}
          onChange={(e) => setAuthToken(e.target.value)}
        />
      </div>

      <div className="mb-8">
        <label className="block font-sans text-[0.65rem] uppercase tracking-wider mb-2 font-semibold">Response Preview</label>
        <div className="bg-white p-4 font-mono text-sm mt-4 border min-h-[200px]" style={{ borderColor: customStyles.lineLight, color: '#333' }}>
          <pre>{response}</pre>
        </div>
      </div>

      <button
        onClick={handleSendRequest}
        className="mt-auto bg-transparent border px-4 py-4 w-full font-sans uppercase text-xs tracking-wider cursor-pointer transition-all duration-200 hover:text-white"
        style={{ borderColor: customStyles.textPrimary }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = customStyles.textPrimary)}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        Send Request
      </button>
    </div>
  );
};

const LogsSection = () => {
  const logs = [
    {
      title: 'API Security',
      subtitle: 'Recent Events',
      items: [
        {
          type: 'error',
          title: 'Rate Limit Exceeded',
          description: 'IP 192.168.1.42',
          time: '10:42:02 AM',
        },
      ],
    },
    {
      title: 'System Health',
      subtitle: 'Node Status',
      items: [
        {
          type: 'success',
          title: 'Node US-East-1',
          description: 'Latency normal (42ms)',
          time: '10:41:55 AM',
        },
      ],
    },
    {
      title: 'Billing',
      subtitle: 'Current Usage',
      items: [
        {
          type: 'default',
          title: 'Threshold Alert',
          description: '85% of monthly budget',
          time: '10:30:00 AM',
        },
      ],
    },
  ];

  const getDotColor = (type) => {
    if (type === 'error') return customStyles.accentOrange;
    if (type === 'success') return '#4CAF50';
    return customStyles.textPrimary;
  };

  return (
    <div className="px-12 py-16 border-t" style={{ borderColor: customStyles.lineLight }}>
      <span className="block font-sans text-xs uppercase tracking-wider" style={{ color: customStyles.textSecondary }}>
        Live Activity Log
      </span>
      <div className="grid grid-cols-3 gap-8 mt-8">
        {logs.map((log, index) => (
          <div key={index} className="border-t pt-4" style={{ borderColor: customStyles.textPrimary }}>
            <div className="font-serif text-xl mb-1">{log.title}</div>
            <div className="font-sans text-[0.65rem] uppercase tracking-wider mb-6" style={{ color: customStyles.textSecondary }}>
              {log.subtitle}
            </div>
            {log.items.map((item, itemIndex) => (
              <div key={itemIndex} className="mt-6 flex items-start gap-4">
                <div className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: getDotColor(item.type) }} />
                <div className="font-sans text-sm leading-snug">
                  <strong>{item.title}</strong>
                  <br />
                  {item.description}
                  <br />
                  <span className="text-xs" style={{ color: '#666' }}>
                    {item.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [showDeployModal, setShowDeployModal] = useState(false);

  return (
    <div className="flex flex-col min-h-screen">
      <Hero onDeployClick={() => setShowDeployModal(true)} />
      <div className="grid grid-cols-[2fr_1fr] border-t flex-1" style={{ borderColor: customStyles.lineLight }}>
        <ModelsPanel />
        <TestPanel />
        <div className="col-span-2">
          <LogsSection />
        </div>
      </div>
    </div>
  );
};

const App = () => {
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap');
      
      * {
        -webkit-font-smoothing: antialiased;
      }
      
      body {
        font-family: 'Inter', sans-serif;
      }
      
      .font-serif {
        font-family: 'Playfair Display', serif;
      }
      
      .font-sans {
        font-family: 'Inter', sans-serif;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <Router basename="/">
      <div className="min-h-screen flex justify-center p-8" style={{ backgroundColor: customStyles.bgColor, color: customStyles.textPrimary }}>
        <div className="w-full max-w-[1400px] border min-h-[90vh] flex flex-col relative" style={{ backgroundColor: customStyles.bgColor, borderColor: customStyles.lineLight }}>
          <NavBar />
          <Routes>
            <Route path="/" element={<Dashboard />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';

const customStyles = {
  root: {
    '--bg-color': '#4B5E45',
    '--text-color': '#CAD6D0',
    '--line-color': '#8C9E90',
    '--highlight-color': '#FFFFFF',
    '--hover-bg': '#556850',
    '--font-display': "'Instrument Sans', sans-serif",
    '--font-serif': "'Instrument Serif', serif",
    '--font-mono': "'JetBrains Mono', monospace",
    '--spacing-unit': '1rem',
    '--border-width': '1px'
  }
};

const Header = () => {
  return (
    <header style={{ borderBottom: '1px solid var(--line-color)' }}>
      <div style={{
        fontSize: 'clamp(3rem, 8vw, 6rem)',
        fontWeight: 600,
        lineHeight: 0.9,
        textTransform: 'uppercase',
        letterSpacing: '-0.02em',
        padding: '0.5rem 1rem',
        color: 'var(--highlight-color)',
        borderBottom: '1px solid var(--line-color)'
      }}>
        Puter Proxy
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        fontSize: '10px',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        fontWeight: 600
      }}>
        <div style={{
          padding: '0.75rem 1rem',
          borderRight: '1px solid var(--line-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <span style={{ opacity: 0.7 }}>System Status</span>
          <span style={{ color: 'var(--highlight-color)' }}>● Operational</span>
        </div>
        <div style={{
          padding: '0.75rem 1rem',
          borderRight: '1px solid var(--line-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <span style={{ opacity: 0.7 }}>Active Nodes</span>
          <span style={{ color: 'var(--highlight-color)' }}>14 / 16</span>
        </div>
        <div style={{
          padding: '0.75rem 1rem',
          borderRight: '1px solid var(--line-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <span style={{ opacity: 0.7 }}>Avg Latency</span>
          <span style={{ color: 'var(--highlight-color)' }}>42ms</span>
        </div>
        <div style={{
          padding: '0.75rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <span style={{ opacity: 0.7 }}>Total Requests</span>
          <span style={{ color: 'var(--highlight-color)' }}>2,401,922</span>
        </div>
      </div>
    </header>
  );
};

const Sidebar = ({ activeView, setActiveView }) => {
  const navItems = [
    { id: 'overview', label: 'Overview', badge: '→' },
    { id: 'models', label: 'Model Registry', badge: '04' },
    { id: 'security', label: 'API Security', badge: '02' },
    { id: 'balancer', label: 'Load Balancer', badge: '01' },
    { id: 'logs', label: 'Live Logs', badge: '99+' },
    { id: 'settings', label: 'Settings', badge: '⚙' }
  ];

  return (
    <nav style={{
      borderRight: '1px solid var(--line-color)',
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto'
    }}>
      <div style={{
        padding: '1rem',
        fontSize: '10px',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        borderBottom: '1px solid var(--line-color)',
        position: 'sticky',
        top: 0,
        background: 'var(--bg-color)',
        zIndex: 10
      }}>
        Select View
      </div>
      <ul style={{ listStyle: 'none' }}>
        {navItems.map(item => (
          <li key={item.id} style={{ borderBottom: '1px solid var(--line-color)' }}>
            <button
              onClick={() => setActiveView(item.id)}
              style={{
                width: '100%',
                textAlign: 'left',
                background: 'none',
                border: 'none',
                color: activeView === item.id ? 'var(--highlight-color)' : 'var(--text-color)',
                padding: '1rem',
                paddingLeft: activeView === item.id ? '1.5rem' : '1rem',
                fontFamily: 'var(--font-serif)',
                fontSize: '1.5rem',
                lineHeight: 1.1,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: activeView === item.id ? 'rgba(255,255,255,0.05)' : 'transparent'
              }}
              onMouseEnter={(e) => {
                if (activeView !== item.id) {
                  e.currentTarget.style.color = 'var(--highlight-color)';
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.paddingLeft = '1.5rem';
                }
                e.currentTarget.querySelector('.arrow').style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                if (activeView !== item.id) {
                  e.currentTarget.style.color = 'var(--text-color)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.paddingLeft = '1rem';
                  e.currentTarget.querySelector('.arrow').style.opacity = '0';
                }
              }}
            >
              {item.label}
              <span
                className="arrow"
                style={{
                  fontSize: '10px',
                  opacity: activeView === item.id ? 1 : 0,
                  fontFamily: 'var(--font-mono)'
                }}
              >
                {item.badge}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};

const OverviewContent = () => {
  const [targetModel, setTargetModel] = useState('gpt-4-turbo');
  const [promptPayload, setPromptPayload] = useState('{"role": "user", "content": "Hello world"}');
  const [rateLimit, setRateLimit] = useState('5000');

  const models = [
    { id: 'gpt-4-turbo-preview', provider: 'OpenAI', context: '128k', status: 'online', latency: '124ms', active: true },
    { id: 'claude-3-opus', provider: 'Anthropic', context: '200k', status: 'online', latency: '412ms', active: true },
    { id: 'mistral-large', provider: 'Mistral AI', context: '32k', status: 'online', latency: '89ms', active: true },
    { id: 'llama-3-70b', provider: 'Meta / Groq', context: '8k', status: 'high-load', latency: '45ms', active: false },
    { id: 'gemini-1.5-pro', provider: 'Google', context: '1M', status: 'online', latency: '210ms', active: true }
  ];

  const logs = [
    { time: '10:42:01.442', msg: 'POST /v1/chat/completions -> gpt-4-turbo', status: '200', statusClass: 'status-200' },
    { time: '10:42:00.912', msg: 'GET /v1/models', status: '200', statusClass: 'status-200' },
    { time: '10:41:59.330', msg: 'POST /v1/embeddings -> text-embedding-3-small', status: '200', statusClass: 'status-200' },
    { time: '10:41:58.105', msg: 'POST /v1/chat/completions -> claude-3-opus', status: '500', statusClass: 'status-500' },
    { time: '10:41:55.221', msg: 'POST /v1/chat/completions -> llama-3-70b', status: '200', statusClass: 'status-200' }
  ];

  return (
    <>
      <div style={{
        padding: '3rem 2rem',
        borderBottom: '1px solid var(--line-color)'
      }}>
        <p style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '1.75rem',
          maxWidth: '800px',
          marginBottom: '1rem',
          lineHeight: 1.3,
          color: 'var(--highlight-color)'
        }}>
          Through optimized routing and intelligent caching, Puter Proxy gives developers the freedom to scale AI infrastructure with complete autonomy.
        </p>
        <p style={{
          fontSize: '12px',
          opacity: 0.8,
          maxWidth: '600px',
          lineHeight: 1.6
        }}>
          An aesthetically pleasing interface is just one part of a well-designed proxy. Strategic request handling elevates backend performance.
        </p>
      </div>

      <div style={{
        padding: '1rem',
        borderBottom: '1px solid var(--line-color)',
        fontSize: '10px',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        opacity: 0.7
      }}>
        Available Models
      </div>

      <table style={{
        width: '100%',
        borderCollapse: 'collapse'
      }}>
        <thead>
          <tr>
            <th style={{
              textAlign: 'left',
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              padding: '1rem 2rem',
              borderBottom: '1px solid var(--line-color)',
              fontWeight: 500,
              color: 'var(--text-color)',
              opacity: 0.7
            }}>Model ID</th>
            <th style={{
              textAlign: 'left',
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              padding: '1rem 2rem',
              borderBottom: '1px solid var(--line-color)',
              fontWeight: 500,
              color: 'var(--text-color)',
              opacity: 0.7
            }}>Provider</th>
            <th style={{
              textAlign: 'left',
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              padding: '1rem 2rem',
              borderBottom: '1px solid var(--line-color)',
              fontWeight: 500,
              color: 'var(--text-color)',
              opacity: 0.7
            }}>Context</th>
            <th style={{
              textAlign: 'left',
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              padding: '1rem 2rem',
              borderBottom: '1px solid var(--line-color)',
              fontWeight: 500,
              color: 'var(--text-color)',
              opacity: 0.7
            }}>Status</th>
            <th style={{
              textAlign: 'left',
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              padding: '1rem 2rem',
              borderBottom: '1px solid var(--line-color)',
              fontWeight: 500,
              color: 'var(--text-color)',
              opacity: 0.7
            }}>Latency</th>
          </tr>
        </thead>
        <tbody>
          {models.map((model, idx) => (
            <tr
              key={idx}
              style={{ transition: 'background-color 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <td style={{
                padding: '1rem 2rem',
                borderBottom: '1px solid var(--line-color)',
                fontFamily: 'var(--font-mono)',
                fontSize: '13px'
              }}>{model.id}</td>
              <td style={{
                padding: '1rem 2rem',
                borderBottom: '1px solid var(--line-color)',
                fontFamily: 'var(--font-mono)',
                fontSize: '13px'
              }}>{model.provider}</td>
              <td style={{
                padding: '1rem 2rem',
                borderBottom: '1px solid var(--line-color)',
                fontFamily: 'var(--font-mono)',
                fontSize: '13px'
              }}>{model.context}</td>
              <td style={{
                padding: '1rem 2rem',
                borderBottom: '1px solid var(--line-color)',
                fontFamily: 'var(--font-mono)',
                fontSize: '13px'
              }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: model.active ? '#A3E635' : '#FCD34D',
                    boxShadow: model.active ? '0 0 5px rgba(163, 230, 53, 0.3)' : 'none'
                  }}></span>
                  {model.status === 'online' ? 'Online' : 'High Load'}
                </span>
              </td>
              <td style={{
                padding: '1rem 2rem',
                borderBottom: '1px solid var(--line-color)',
                fontFamily: 'var(--font-mono)',
                fontSize: '13px'
              }}>{model.latency}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        borderBottom: '1px solid var(--line-color)'
      }}>
        <div style={{
          padding: '2rem',
          borderRight: '1px solid var(--line-color)'
        }}>
          <div style={{ marginBottom: '2rem' }}>
            <span style={{
              display: 'block',
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '0.5rem',
              opacity: 0.7
            }}>Test Request</span>
            <div style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.5rem',
              marginBottom: '1rem',
              color: 'var(--highlight-color)'
            }}>Debug Endpoint</div>
            <p style={{
              fontSize: '12px',
              opacity: 0.8,
              maxWidth: '600px',
              lineHeight: 1.6,
              marginBottom: '2rem'
            }}>Send a sample payload to verify routing logic.</p>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: '0.5rem',
                opacity: 0.7
              }}>Target Model</label>
              <input
                type="text"
                value={targetModel}
                onChange={(e) => setTargetModel(e.target.value)}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: '1px solid var(--line-color)',
                  padding: '1rem',
                  color: 'var(--highlight-color)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '14px',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--highlight-color)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--line-color)'}
              />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: '0.5rem',
                opacity: 0.7
              }}>Prompt Payload</label>
              <input
                type="text"
                value={promptPayload}
                onChange={(e) => setPromptPayload(e.target.value)}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: '1px solid var(--line-color)',
                  padding: '1rem',
                  color: 'var(--highlight-color)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '14px',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--highlight-color)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--line-color)'}
              />
            </div>
            <button
              style={{
                background: 'transparent',
                border: '1px solid var(--line-color)',
                color: 'var(--highlight-color)',
                padding: '1rem 2rem',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'var(--text-color)';
                e.target.style.color = 'var(--bg-color)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent';
                e.target.style.color = 'var(--highlight-color)';
              }}
              onClick={() => alert('Request sent!')}
            >Send Request</button>
          </div>
        </div>

        <div style={{ padding: '2rem' }}>
          <div style={{ marginBottom: '2rem' }}>
            <span style={{
              display: 'block',
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '0.5rem',
              opacity: 0.7
            }}>Security</span>
            <div style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.5rem',
              marginBottom: '1rem',
              color: 'var(--highlight-color)'
            }}>API Configuration</div>
            <p style={{
              fontSize: '12px',
              opacity: 0.8,
              maxWidth: '600px',
              lineHeight: 1.6,
              marginBottom: '2rem'
            }}>Manage access tokens and rate limits.</p>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: '0.5rem',
                opacity: 0.7
              }}>Public Key</label>
              <input
                type="text"
                value="pk_live_51Ha7...9s8d"
                readOnly
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: '1px solid var(--line-color)',
                  padding: '1rem',
                  color: 'var(--highlight-color)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '14px',
                  outline: 'none',
                  opacity: 0.7
                }}
              />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: '0.5rem',
                opacity: 0.7
              }}>Rate Limit (RPM)</label>
              <input
                type="text"
                value={rateLimit}
                onChange={(e) => setRateLimit(e.target.value)}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: '1px solid var(--line-color)',
                  padding: '1rem',
                  color: 'var(--highlight-color)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '14px',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--highlight-color)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--line-color)'}
              />
            </div>
            <button
              style={{
                background: 'transparent',
                border: '1px solid var(--line-color)',
                color: 'var(--highlight-color)',
                padding: '1rem 2rem',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'var(--text-color)';
                e.target.style.color = 'var(--bg-color)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent';
                e.target.style.color = 'var(--highlight-color)';
              }}
              onClick={() => alert('Keys rotated!')}
            >Rotate Keys</button>
          </div>
        </div>
      </div>

      <div style={{
        padding: '1rem',
        borderBottom: '1px solid var(--line-color)',
        fontSize: '10px',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        opacity: 0.7,
        background: 'var(--bg-color)',
        position: 'sticky',
        top: 0
      }}>
        Live Traffic
      </div>
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '12px',
        padding: '2rem'
      }}>
        {logs.map((log, idx) => (
          <div
            key={idx}
            style={{
              display: 'grid',
              gridTemplateColumns: '100px 1fr 80px',
              gap: '1rem',
              padding: '0.5rem 0',
              borderBottom: '1px solid rgba(140, 158, 144, 0.2)',
              opacity: idx === 0 ? 1 : 0.8,
              color: idx === 0 ? 'var(--highlight-color)' : 'inherit'
            }}
          >
            <span style={{ opacity: 0.6 }}>{log.time}</span>
            <span>{log.msg}</span>
            <span style={{
              textAlign: 'right',
              color: log.statusClass === 'status-200' ? '#A3E635' : log.statusClass === 'status-500' ? '#FCA5A5' : '#F87171'
            }}>{log.status} {log.status === '200' ? 'OK' : 'ERR'}</span>
          </div>
        ))}
      </div>
    </>
  );
};

const ModelsContent = () => {
  return (
    <div style={{ padding: '3rem 2rem' }}>
      <h2 style={{
        fontFamily: 'var(--font-serif)',
        fontSize: '2rem',
        color: 'var(--highlight-color)',
        marginBottom: '1rem'
      }}>Model Registry</h2>
      <p style={{ opacity: 0.8, marginBottom: '2rem' }}>
        Manage and configure available AI models and their providers.
      </p>
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        padding: '2rem',
        border: '1px solid var(--line-color)'
      }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
          Model registry configuration interface would be displayed here.
        </p>
      </div>
    </div>
  );
};

const SecurityContent = () => {
  return (
    <div style={{ padding: '3rem 2rem' }}>
      <h2 style={{
        fontFamily: 'var(--font-serif)',
        fontSize: '2rem',
        color: 'var(--highlight-color)',
        marginBottom: '1rem'
      }}>API Security</h2>
      <p style={{ opacity: 0.8, marginBottom: '2rem' }}>
        Configure authentication, authorization, and access controls.
      </p>
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        padding: '2rem',
        border: '1px solid var(--line-color)'
      }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
          Security configuration interface would be displayed here.
        </p>
      </div>
    </div>
  );
};

const BalancerContent = () => {
  return (
    <div style={{ padding: '3rem 2rem' }}>
      <h2 style={{
        fontFamily: 'var(--font-serif)',
        fontSize: '2rem',
        color: 'var(--highlight-color)',
        marginBottom: '1rem'
      }}>Load Balancer</h2>
      <p style={{ opacity: 0.8, marginBottom: '2rem' }}>
        Monitor and configure load balancing across infrastructure.
      </p>
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        padding: '2rem',
        border: '1px solid var(--line-color)'
      }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
          Load balancer metrics and configuration would be displayed here.
        </p>
      </div>
    </div>
  );
};

const LogsContent = () => {
  return (
    <div style={{ padding: '3rem 2rem' }}>
      <h2 style={{
        fontFamily: 'var(--font-serif)',
        fontSize: '2rem',
        color: 'var(--highlight-color)',
        marginBottom: '1rem'
      }}>Live Logs</h2>
      <p style={{ opacity: 0.8, marginBottom: '2rem' }}>
        Real-time monitoring of all API requests and responses.
      </p>
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        padding: '2rem',
        border: '1px solid var(--line-color)'
      }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
          Real-time log streaming interface would be displayed here.
        </p>
      </div>
    </div>
  );
};

const SettingsContent = () => {
  return (
    <div style={{ padding: '3rem 2rem' }}>
      <h2 style={{
        fontFamily: 'var(--font-serif)',
        fontSize: '2rem',
        color: 'var(--highlight-color)',
        marginBottom: '1rem'
      }}>Settings</h2>
      <p style={{ opacity: 0.8, marginBottom: '2rem' }}>
        Configure global system settings and preferences.
      </p>
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        padding: '2rem',
        border: '1px solid var(--line-color)'
      }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
          System settings interface would be displayed here.
        </p>
      </div>
    </div>
  );
};

const App = () => {
  const [activeView, setActiveView] = useState('overview');

  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        -webkit-font-smoothing: antialiased;
      }
      
      body {
        background-color: var(--bg-color);
        color: var(--text-color);
        font-family: var(--font-display);
        font-size: 14px;
        line-height: 1.4;
        overflow-x: hidden;
      }
      
      ::-webkit-scrollbar {
        width: 6px;
      }
      ::-webkit-scrollbar-track {
        background: var(--bg-color);
        border-left: 1px solid var(--line-color);
      }
      ::-webkit-scrollbar-thumb {
        background: var(--line-color);
      }
      
      @media (max-width: 768px) {
        .main-container {
          grid-template-columns: 1fr !important;
        }
        .sidebar {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(styleElement);

    const linkElement = document.createElement('link');
    linkElement.href = 'https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap';
    linkElement.rel = 'stylesheet';
    document.head.appendChild(linkElement);

    return () => {
      document.head.removeChild(styleElement);
      document.head.removeChild(linkElement);
    };
  }, []);

  const renderContent = () => {
    switch (activeView) {
      case 'overview':
        return <OverviewContent />;
      case 'models':
        return <ModelsContent />;
      case 'security':
        return <SecurityContent />;
      case 'balancer':
        return <BalancerContent />;
      case 'logs':
        return <LogsContent />;
      case 'settings':
        return <SettingsContent />;
      default:
        return <OverviewContent />;
    }
  };

  return (
    <div style={{
      ...customStyles.root,
      height: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Header />
      <div className="main-container" style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '280px 1fr',
        overflow: 'hidden'
      }}>
        <Sidebar activeView={activeView} setActiveView={setActiveView} />
        <main className="content" style={{
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
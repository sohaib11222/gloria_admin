import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import http from '../lib/http';
import SdkGuide from '../components/docs/SdkGuide';
import './DocsFullscreen.css';

type DocCodeSample = {
  lang: string;
  label: string;
  code: string;
};

type DocEndpoint = {
  id: string;
  name: string;
  description?: string;
  method: string;
  path: string;
  headers?: { name: string; required: boolean; description?: string }[];
  query?: { name: string; required: boolean; type?: string; description?: string }[];
  body?: { name: string; required: boolean; type?: string; description?: string }[];
  responses?: { status: number; description?: string; bodyExample?: any }[];
  codeSamples?: DocCodeSample[];
};

type DocCategory = {
  id: string;
  name: string;
  description?: string;
  endpoints: DocEndpoint[];
};

const METHOD_COLORS: Record<string, string> = {
  GET: '#10b981',
  POST: '#3b82f6',
  PUT: '#f97316',
  DELETE: '#ef4444',
  PATCH: '#a855f7',
};

const DocsFullscreen: React.FC = () => {
  const { endpointId, view } = useParams<{ endpointId?: string; view?: string }>();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<DocCategory[]>([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState<DocEndpoint | null>(null);
  const [activeCode, setActiveCode] = useState<string>('curl');
  // Check if we should show SDK guide - either from view param or if endpointId is 'sdk'
  const shouldShowSdk = view === 'sdk' || endpointId === 'sdk';
  const [showSdkGuide, setShowSdkGuide] = useState<boolean>(shouldShowSdk);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);

  useEffect(() => {
    // Update showSdkGuide when route changes
    const shouldShow = view === 'sdk' || endpointId === 'sdk';
    setShowSdkGuide(shouldShow);
    
    http.get('/docs').then((res) => {
      setCategories(res.data);
      // Don't load endpoint if showing SDK guide
      if (shouldShow) {
        return;
      }
      if (endpointId && endpointId !== 'sdk') {
        const endpoint = res.data
          .flatMap(cat => cat.endpoints)
          .find(ep => ep.id === endpointId);
        if (endpoint) {
          setSelectedEndpoint(endpoint);
          setActiveCode(endpoint.codeSamples?.[0]?.lang ?? 'curl');
        }
      } else if (!view && !shouldShow) {
        const firstCat = res.data[0];
        if (firstCat && firstCat.endpoints && firstCat.endpoints[0]) {
          setSelectedEndpoint(firstCat.endpoints[0]);
          setActiveCode(firstCat.endpoints[0].codeSamples?.[0]?.lang ?? 'curl');
        }
      }
    }).catch((err) => {
      console.error('Failed to load docs:', err);
    });
  }, [endpointId, view]);

  return (
    <div className="docs-fullscreen">
      <header className="docs-header">
        <div className="docs-header-content">
          <h1 className="docs-logo">API Documentation</h1>
          <nav className="docs-nav">
            <button
              className={`docs-nav-btn ${showSdkGuide ? 'active' : ''}`}
              onClick={() => {
                setShowSdkGuide(true);
                setSelectedEndpoint(null);
                navigate('/docs-fullscreen/sdk', { replace: true });
              }}
            >
              SDK Guide
            </button>
            <div className="docs-nav-dropdown">
              <button className="docs-nav-btn">API Reference ▼</button>
              <div className="docs-nav-menu">
                {categories.map((cat) => (
                  <div key={cat.id} className="docs-nav-category">
                    <div className="docs-nav-category-title">{cat.name}</div>
                    {cat.endpoints.map((ep) => (
                      <button
                        key={ep.id}
                        className={`docs-nav-endpoint ${selectedEndpoint?.id === ep.id ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedEndpoint(ep);
                          setActiveCode(ep.codeSamples?.[0]?.lang ?? 'curl');
                          setShowSdkGuide(false);
                          navigate(`/docs-fullscreen/${ep.id}`, { replace: true });
                        }}
                      >
                        <span className="docs-nav-method" style={{ background: METHOD_COLORS[ep.method] || '#6b7280' }}>
                          {ep.method}
                        </span>
                        <span className="docs-nav-path">{ep.path}</span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </nav>
        </div>
      </header>

      <main className="docs-fullscreen-main">
        {showSdkGuide ? (
          <SdkGuide role="admin" />
        ) : selectedEndpoint ? (
          <div className="docs-content-wrapper">
            <aside 
              className={`docs-sidebar ${sidebarOpen ? 'open' : 'closed'}`}
            >
              <div className="docs-sidebar-header">
                <h3>API Endpoints</h3>
                <button 
                  className="docs-sidebar-toggle"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                >
                  {sidebarOpen ? '◀' : '▶'}
                </button>
              </div>
              {sidebarOpen && (
                <nav className="docs-sidebar-nav">
                  {categories.map((cat) => (
                    <div key={cat.id} className="docs-sidebar-category">
                      <div className="docs-sidebar-category-title">{cat.name}</div>
                      {cat.endpoints.map((ep) => (
                        <button
                          key={ep.id}
                          className={`docs-sidebar-endpoint ${selectedEndpoint?.id === ep.id ? 'active' : ''}`}
                          onClick={() => {
                            setSelectedEndpoint(ep);
                            setActiveCode(ep.codeSamples?.[0]?.lang ?? 'curl');
                            setShowSdkGuide(false);
                            navigate(`/docs-fullscreen/${ep.id}`, { replace: true });
                          }}
                        >
                          <span 
                            className="docs-nav-method" 
                            style={{ background: METHOD_COLORS[ep.method] || '#6b7280' }}
                          >
                            {ep.method}
                          </span>
                          <span className="docs-nav-path">{ep.path}</span>
                        </button>
                      ))}
                    </div>
                  ))}
                </nav>
              )}
            </aside>
            <div className="docs-endpoint-content">
            <div className="docs-endpoint-header">
              <h1>{selectedEndpoint.name}</h1>
              {selectedEndpoint.description && (
                <p className="docs-endpoint-description">{selectedEndpoint.description}</p>
              )}
              <div className="docs-endpoint-meta">
                <span className="docs-method-badge" style={{ background: METHOD_COLORS[selectedEndpoint.method] || '#6b7280' }}>
                  {selectedEndpoint.method}
                </span>
                <code className="docs-path-badge">{selectedEndpoint.path}</code>
              </div>
            </div>

            <section className="docs-section">
              <h2 className="docs-section-title">Request</h2>

              {selectedEndpoint.headers && selectedEndpoint.headers.length > 0 && (
                <div className="docs-param-group">
                  <h3 className="docs-param-title">Headers</h3>
                  <div className="docs-table-wrapper">
                    <table className="docs-table">
                      <thead>
                        <tr>
                          <th>Header</th>
                          <th>Required</th>
                          <th>Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedEndpoint.headers.map((h) => (
                          <tr key={h.name}>
                            <td><code className="docs-code-inline">{h.name}</code></td>
                            <td>
                              {h.required ? (
                                <span className="docs-required">Required</span>
                              ) : (
                                <span className="docs-optional">Optional</span>
                              )}
                            </td>
                            <td>{h.description ?? '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {selectedEndpoint.query && selectedEndpoint.query.length > 0 && (
                <div className="docs-param-group">
                  <h3 className="docs-param-title">Query Parameters</h3>
                  <div className="docs-table-wrapper">
                    <table className="docs-table">
                      <thead>
                        <tr>
                          <th>Parameter</th>
                          <th>Required</th>
                          <th>Type</th>
                          <th>Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedEndpoint.query.map((q) => (
                          <tr key={q.name}>
                            <td><code className="docs-code-inline">{q.name}</code></td>
                            <td>
                              {q.required ? (
                                <span className="docs-required">Required</span>
                              ) : (
                                <span className="docs-optional">Optional</span>
                              )}
                            </td>
                            <td><span className="docs-type">{q.type ?? 'string'}</span></td>
                            <td>{q.description ?? '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {selectedEndpoint.body && selectedEndpoint.body.length > 0 && (
                <div className="docs-param-group">
                  <h3 className="docs-param-title">Request Body</h3>
                  <div className="docs-table-wrapper">
                    <table className="docs-table">
                      <thead>
                        <tr>
                          <th>Field</th>
                          <th>Required</th>
                          <th>Type</th>
                          <th>Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedEndpoint.body.map((b) => (
                          <tr key={b.name}>
                            <td><code className="docs-code-inline">{b.name}</code></td>
                            <td>
                              {b.required ? (
                                <span className="docs-required">Required</span>
                              ) : (
                                <span className="docs-optional">Optional</span>
                              )}
                            </td>
                            <td><span className="docs-type">{b.type ?? 'string'}</span></td>
                            <td>{b.description ?? '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>

            {selectedEndpoint.responses && selectedEndpoint.responses.length > 0 && (
              <section className="docs-section">
                <h2 className="docs-section-title">Response</h2>
                {selectedEndpoint.responses.map((resp, idx) => (
                  <div key={idx} className="docs-response-card">
                    <div className="docs-response-header">
                      <span className={`docs-status-badge ${resp.status >= 200 && resp.status < 300 ? 'success' : resp.status >= 400 ? 'error' : 'warning'}`}>
                        {resp.status}
                      </span>
                      <span className="docs-response-description">{resp.description || 'Response'}</span>
                    </div>
                    {resp.bodyExample && (
                      <pre className="docs-code-block">
                        <code>{JSON.stringify(resp.bodyExample, null, 2)}</code>
                      </pre>
                    )}
                  </div>
                ))}
              </section>
            )}

            {selectedEndpoint.codeSamples && selectedEndpoint.codeSamples.length > 0 && (
              <section className="docs-section">
                <h2 className="docs-section-title">Code Samples</h2>
                <div className="docs-code-tabs">
                  {selectedEndpoint.codeSamples.map((cs) => (
                    <button
                      key={cs.lang}
                      className={`docs-code-tab ${activeCode === cs.lang ? 'active' : ''}`}
                      onClick={() => setActiveCode(cs.lang)}
                    >
                      {cs.label}
                    </button>
                  ))}
                </div>
                <pre className="docs-code-block">
                  <code>{selectedEndpoint.codeSamples.find((cs) => cs.lang === activeCode)?.code ?? '# No sample available'}</code>
                </pre>
              </section>
            )}
            </div>
          </div>
        ) : (
          <div className="docs-empty-state">
            <p>Select an endpoint from the navigation to view documentation</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default DocsFullscreen;


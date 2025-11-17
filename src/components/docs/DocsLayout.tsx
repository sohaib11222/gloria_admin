import React, { useEffect, useState } from 'react';
import http from '../../lib/http';
import SdkGuide from './SdkGuide';
import './docs.css';

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

const DocsLayout: React.FC = () => {
  const [categories, setCategories] = useState<DocCategory[]>([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState<DocEndpoint | null>(null);
  const [activeCode, setActiveCode] = useState<string>('curl');
  const [showSdkGuide, setShowSdkGuide] = useState<boolean>(false);

  useEffect(() => {
    // admin gets full docs
    http.get('/docs').then((res) => {
      setCategories(res.data);
      const firstCat = res.data[0];
      if (firstCat && firstCat.endpoints && firstCat.endpoints[0]) {
        setSelectedEndpoint(firstCat.endpoints[0]);
      }
    }).catch((err) => {
      console.error('Failed to load docs:', err);
    });
  }, []);

  return (
    <div className="docs-shell">
      <aside className="docs-sidebar">
        <div className="docs-cat">
          <button
            className={`docs-endpoint-btn ${showSdkGuide ? 'active' : ''}`}
            onClick={() => {
              setShowSdkGuide(true);
              setSelectedEndpoint(null);
            }}
            style={{ width: '100%', justifyContent: 'flex-start', padding: '0.5rem' }}
          >
            <span style={{ fontSize: '1rem', marginRight: '0.5rem' }}>📚</span>
            <span style={{ fontWeight: 600 }}>SDK Guide</span>
          </button>
        </div>
        {categories.map((cat) => (
          <div key={cat.id} className="docs-cat">
            <div className="docs-cat-title">{cat.name}</div>
            {cat.endpoints.map((ep) => (
              <button
                key={ep.id}
                className={`docs-endpoint-btn ${selectedEndpoint?.id === ep.id ? 'active' : ''}`}
                onClick={() => {
                  setSelectedEndpoint(ep);
                  setActiveCode(ep.codeSamples?.[0]?.lang ?? 'curl');
                  setShowSdkGuide(false);
                }}
              >
                <span className="method" style={{ background: METHOD_COLORS[ep.method] || '#6b7280' }}>
                  {ep.method}
                </span>
                <span className="path">{ep.path}</span>
              </button>
            ))}
          </div>
        ))}
      </aside>
      <main className="docs-main">
        {showSdkGuide ? (
          <SdkGuide role="admin" />
        ) : selectedEndpoint && (
          <>
            <h1>{selectedEndpoint.name}</h1>
            <p>{selectedEndpoint.description}</p>
            <div className="endpoint-meta">
              <span className="method-tag" style={{ background: METHOD_COLORS[selectedEndpoint.method] || '#6b7280' }}>
                {selectedEndpoint.method}
              </span>
              <code className="path-code">{selectedEndpoint.path}</code>
            </div>

            {selectedEndpoint.headers && selectedEndpoint.headers.length > 0 && (
              <section>
                <h2>Headers</h2>
                <table>
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
                        <td>{h.name}</td>
                        <td>{h.required ? 'yes' : 'no'}</td>
                        <td>{h.description ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            )}

            {selectedEndpoint.query && selectedEndpoint.query.length > 0 && (
              <section>
                <h2>Query Params</h2>
                <table>
                  <thead>
                    <tr>
                      <th>Param</th>
                      <th>Required</th>
                      <th>Type</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedEndpoint.query.map((q) => (
                      <tr key={q.name}>
                        <td>{q.name}</td>
                        <td>{q.required ? 'yes' : 'no'}</td>
                        <td>{q.type ?? '-'}</td>
                        <td>{q.description ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            )}

            {selectedEndpoint.body && selectedEndpoint.body.length > 0 && (
              <section>
                <h2>Body</h2>
                <table>
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
                        <td>{b.name}</td>
                        <td>{b.required ? 'yes' : 'no'}</td>
                        <td>{b.type ?? '-'}</td>
                        <td>{b.description ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            )}

            {selectedEndpoint.responses && selectedEndpoint.responses.length > 0 && (
              <section>
                <h2>Responses</h2>
                {selectedEndpoint.responses.map((resp, idx) => (
                  <div key={idx} style={{ marginBottom: '1rem' }}>
                    <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
                      {resp.status} {resp.description}
                    </div>
                    {resp.bodyExample && (
                      <pre className="code-block">
                        {JSON.stringify(resp.bodyExample, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </section>
            )}

            {(selectedEndpoint.codeSamples && selectedEndpoint.codeSamples.length > 0) && (
              <section>
                <h2>Code Samples</h2>
                <div className="code-tabs">
                  {selectedEndpoint.codeSamples.map((cs) => (
                    <button
                      key={cs.lang}
                      className={activeCode === cs.lang ? 'active' : ''}
                      onClick={() => setActiveCode(cs.lang)}
                    >
                      {cs.label}
                    </button>
                  ))}
                </div>
                <pre className="code-block">
                  {(selectedEndpoint.codeSamples).find((cs) => cs.lang === activeCode)?.code ??
                    '# No sample available'}
                </pre>
              </section>
            )}

            <section>
              <h2>Try it</h2>
              <p style={{ color: '#6b7280', marginBottom: '0.5rem' }}>Later we will wire this to real runner / SDKs. For now this is a placeholder.</p>
              <div className="try-box">
                <input type="text" defaultValue={selectedEndpoint.path} readOnly />
                <button>Send</button>
              </div>
            </section>

            <section>
              <h2>SDKs & Clients</h2>
              <div style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '1.5rem' }}>
                <p style={{ color: '#6b7280', marginBottom: '1rem', fontSize: '0.875rem' }}>
                  Use our official SDKs to integrate faster and handle authentication automatically:
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                  <div style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '0.375rem', padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ fontSize: '1.25rem' }}>📦</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Node.js</div>
                      <div style={{ fontSize: '0.75rem', color: '#10b981' }}>Available</div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowSdkGuide(true);
                      setSelectedEndpoint(null);
                    }}
                    style={{ backgroundColor: '#fff', border: '1px solid #10b981', borderRadius: '0.375rem', padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', width: '100%', textAlign: 'left' }}
                  >
                    <div style={{ fontSize: '1.25rem' }}>🐘</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>PHP</div>
                      <div style={{ fontSize: '0.75rem', color: '#10b981' }}>Available</div>
                    </div>
                  </button>
                  <div style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '0.375rem', padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ fontSize: '1.25rem' }}>🌐</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>JavaScript/TS</div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Coming soon</div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowSdkGuide(true);
                      setSelectedEndpoint(null);
                    }}
                    style={{ backgroundColor: '#fff', border: '1px solid #10b981', borderRadius: '0.375rem', padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', width: '100%', textAlign: 'left' }}
                  >
                    <div style={{ fontSize: '1.25rem' }}>🐹</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Go</div>
                      <div style={{ fontSize: '0.75rem', color: '#10b981' }}>Available</div>
                    </div>
                  </button>
                  <div style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '0.375rem', padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ fontSize: '1.25rem' }}>🐍</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Python</div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Planned</div>
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#dbeafe', border: '1px solid #bfdbfe', borderRadius: '0.375rem' }}>
                  <p style={{ fontSize: '0.75rem', color: '#1e40af', marginBottom: '0.5rem' }}>
                    💡 <strong>Note:</strong> Use our official SDKs to integrate faster and handle authentication automatically.
                  </p>
                  <button
                    onClick={() => {
                      setShowSdkGuide(true);
                      setSelectedEndpoint(null);
                    }}
                    style={{ fontSize: '0.75rem', color: '#1e40af', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    📚 View SDK Guide →
                  </button>
                </div>
              </div>
            </section>
          </>
        )}
        {!showSdkGuide && !selectedEndpoint && (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
            <p>Select an endpoint from the sidebar to view documentation</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default DocsLayout;


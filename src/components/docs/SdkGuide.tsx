import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import http from '../../lib/http';
import './docs.css';

type SdkType = 'javascript' | 'typescript' | 'go' | 'php' | 'python' | 'java' | 'perl';
type SectionType = 'quick-start' | 'installation' | 'api-endpoints';

type DocEndpoint = {
  id: string;
  name: string;
  method: string;
  path: string;
  description?: string;
};

type DocCategory = {
  id: string;
  name: string;
  description?: string;
  endpoints: DocEndpoint[];
};

const SdkGuide: React.FC<{ role?: 'agent' | 'source' | 'admin' }> = ({ role = 'admin' }) => {
  const [activeSdk, setActiveSdk] = useState<SdkType>('typescript');
  const [activeSection, setActiveSection] = useState<SectionType>('quick-start');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [categories, setCategories] = useState<DocCategory[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Load endpoints filtered by role
    http.get(`/docs/${role}`)
      .then((res) => {
        setCategories(res.data);
      })
      .catch((err) => {
        console.error('Failed to load endpoints:', err);
      });
  }, [role]);
  const prefaceText = {
    agent: 'Start here: login → approve agreement → availability → booking',
    source: 'Start here: login → offer agreement → locations → verification',
    admin: 'Start here: login → manage companies → agreements → health monitoring',
  };

  const sections: { id: SectionType; label: string }[] = [
    { id: 'quick-start', label: 'Quick Start' },
    { id: 'installation', label: 'Installation' },
    { id: 'api-endpoints', label: 'API Endpoints' },
  ];

  const sdks: { id: SdkType; name: string; icon: string }[] = [
    { id: 'typescript', name: 'TypeScript', icon: '📘' },
    { id: 'javascript', name: 'JavaScript', icon: '📦' },
    { id: 'go', name: 'Go', icon: '🐹' },
    { id: 'php', name: 'PHP', icon: '🐘' },
    { id: 'python', name: 'Python', icon: '🐍' },
    { id: 'java', name: 'Java', icon: '☕' },
    { id: 'perl', name: 'Perl', icon: '🐪' },
  ];

  const renderSection = (sectionId: SectionType) => {
    if (sectionId === 'api-endpoints') {
      return (
        <section style={{ marginTop: '0', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1f2937', marginBottom: '1rem' }}>Available API Endpoints</h2>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.5rem' }}>
            Click on any endpoint below to view detailed documentation, request/response examples, and code samples.
          </p>
          
          {categories.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
              Loading endpoints...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {categories.map((category) => (
                <div key={category.id} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '0.25rem', padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1f2937', marginBottom: '0.5rem' }}>
                    {category.name}
                  </h3>
                  {category.description && (
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
                      {category.description}
                    </p>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.75rem' }}>
                    {category.endpoints.map((endpoint) => {
                      const methodColor: Record<string, string> = {
                        GET: '#10b981',
                        POST: '#3b82f6',
                        PUT: '#f97316',
                        DELETE: '#ef4444',
                        PATCH: '#a855f7',
                        gRPC: '#8b5cf6',
                      };
                      const color = methodColor[endpoint.method] || '#6b7280';
                      
                      return (
                        <button
                          key={endpoint.id}
                          onClick={() => navigate(`/docs-fullscreen/${endpoint.id}`)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.75rem 1rem',
                            border: '1px solid #e5e7eb',
                            borderRadius: '0.25rem',
                            background: 'white',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#f9fafb';
                            e.currentTarget.style.borderColor = '#d1d5db';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'white';
                            e.currentTarget.style.borderColor = '#e5e7eb';
                          }}
                        >
                          <span
                            style={{
                              fontSize: '0.625rem',
                              color: 'white',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '0.25rem',
                              fontWeight: 600,
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              background: color,
                              flexShrink: 0,
                            }}
                          >
                            {endpoint.method}
                          </span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#1f2937', marginBottom: '0.25rem' }}>
                              {endpoint.name}
                            </div>
                            <code style={{ fontSize: '0.75rem', color: '#6b7280', fontFamily: 'Monaco, Menlo, monospace', wordBreak: 'break-all' }}>
                              {endpoint.path}
                            </code>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      );
    }
    
    if (sectionId === 'installation') {
      return (
        <section>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>Installation</h2>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>Install the {sdks.find(s => s.id === activeSdk)?.name} SDK using your package manager.</p>
          <div style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.25rem', padding: '1rem', marginTop: '1rem' }}>
            <pre style={{ margin: 0, fontSize: '0.875rem', fontFamily: 'Monaco, Menlo, monospace', whiteSpace: 'pre-wrap' }}>
              {activeSdk === 'typescript' || activeSdk === 'javascript' 
                ? `npm install axios\n# or\nyarn add axios\n# or\npnpm add axios`
                : activeSdk === 'go'
                ? `go get standard library\n# Use standard net/http package`
                : activeSdk === 'php'
                ? `composer require guzzlehttp/guzzle`
                : activeSdk === 'python'
                ? `pip install requests`
                : activeSdk === 'java'
                ? `// Java 11+ (includes HttpClient)\n// Add Gson for JSON:\n// Maven:\n<dependency>\n    <groupId>com.google.code.gson</groupId>\n    <artifactId>gson</artifactId>\n    <version>2.15.0</version>\n</dependency>`
                : `cpanm LWP::UserAgent JSON URI::Encode`}
            </pre>
          </div>
        </section>
      );
    }
    
    // Default: Quick Start section - render the SDK-specific content
    return null; // Will be handled by the existing code below
  };

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 80px)', backgroundColor: '#fafafa' }}>
      {/* Sidebar */}
      <aside 
        style={{ 
          width: sidebarOpen ? '280px' : '0',
          backgroundColor: '#ffffff',
          borderRight: '1px solid #e5e7eb',
          transition: 'width 0.2s ease-in-out',
          overflow: 'hidden',
          position: 'sticky',
          top: 0,
          height: 'calc(100vh - 80px)',
          overflowY: 'auto',
          flexShrink: 0,
          boxShadow: sidebarOpen ? '2px 0 4px rgba(0,0,0,0.05)' : 'none'
        }}
        className="sdk-sidebar"
      >
        <div style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', margin: 0 }}>SDK Guide</h2>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                background: 'none',
                border: '1px solid #e5e7eb',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                padding: '0.375rem 0.5rem',
                color: '#6b7280',
                fontSize: '0.75rem',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f9fafb';
                e.currentTarget.style.borderColor = '#d1d5db';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = '#e5e7eb';
              }}
              aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              {sidebarOpen ? '◀' : '▶'}
            </button>
          </div>
          
          {sidebarOpen && (
            <>
              {/* SDK Selector */}
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.75rem' }}>
                  Select SDK
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {sdks.map((sdk) => (
                    <button
                      key={sdk.id}
                      onClick={() => {
                        setActiveSdk(sdk.id);
                        setActiveSection('quick-start');
                      }}
                      style={{
                        padding: '0.75rem',
                        textAlign: 'left',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.375rem',
                        backgroundColor: activeSdk === sdk.id ? '#f1f5f9' : 'white',
                        color: activeSdk === sdk.id ? '#111827' : '#6b7280',
                        fontWeight: activeSdk === sdk.id ? 600 : 400,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                      onMouseEnter={(e) => {
                        if (activeSdk !== sdk.id) {
                          e.currentTarget.style.backgroundColor = '#f9fafb';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (activeSdk !== sdk.id) {
                          e.currentTarget.style.backgroundColor = 'white';
                        }
                      }}
                    >
                      <span>{sdk.icon}</span>
                      <span>{sdk.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Section Navigation */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.75rem' }}>
                  Sections
                </label>
                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      style={{
                        padding: '0.625rem 0.75rem',
                        textAlign: 'left',
                        border: 'none',
                        backgroundColor: activeSection === section.id ? '#f1f5f9' : 'transparent',
                        color: activeSection === section.id ? '#111827' : '#6b7280',
                        fontWeight: activeSection === section.id ? 600 : 400,
                        cursor: 'pointer',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        transition: 'all 0.15s'
                      }}
                      onMouseEnter={(e) => {
                        if (activeSection !== section.id) {
                          e.currentTarget.style.backgroundColor = '#f9fafb';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (activeSection !== section.id) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      {section.label}
                    </button>
                  ))}
                </nav>
              </div>
            </>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '2rem', maxWidth: '1000px', margin: '0 auto', minWidth: 0, backgroundColor: '#ffffff' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', color: '#111827' }}>
            {sdks.find(s => s.id === activeSdk)?.name} SDK
          </h1>
          <p style={{ color: '#6b7280', fontSize: '1rem' }}>
            Production-ready SDK for integrating with Gloria Connect Admin API
          </p>
        </div>

        {role && (
          <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '0.5rem' }}>
            <p style={{ margin: 0, fontWeight: 600, color: '#334155', fontSize: '0.875rem' }}>
              {prefaceText[role]}
            </p>
          </div>
        )}

        <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '2rem' }}>
          {activeSection === 'quick-start' && (
            <>
              {/* SDK Tabs Navigation - only show for Quick Start */}
              <section style={{ marginBottom: '2rem' }}>
                <div className="sdk-tabs" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '3px solid #e5e7eb', paddingBottom: '0.5rem', overflowX: 'auto' }}>
          <button
            className={`sdk-tab ${activeSdk === 'typescript' ? 'active' : ''}`}
            onClick={() => setActiveSdk('typescript')}
            onMouseEnter={(e) => {
              if (activeSdk !== 'typescript') {
                e.currentTarget.style.background = '#f9fafb';
              }
            }}
            onMouseLeave={(e) => {
              if (activeSdk !== 'typescript') {
                e.currentTarget.style.background = 'transparent';
              }
            }}
            style={{
              background: activeSdk === 'typescript' ? '#f9fafb' : 'transparent',
              border: 'none',
              padding: '0.625rem 1.25rem',
              fontSize: '0.875rem',
              fontWeight: activeSdk === 'typescript' ? 600 : 500,
              color: activeSdk === 'typescript' ? '#1f2937' : '#6b7280',
              cursor: 'pointer',
              borderBottom: activeSdk === 'typescript' ? '2px solid #475569' : '2px solid transparent',
              marginBottom: activeSdk === 'typescript' ? '-0.5rem' : '-0.5rem',
              transition: 'color 0.15s, border-color 0.15s',
              borderRadius: '0.25rem 0.25rem 0 0',
              whiteSpace: 'nowrap'
            }}
          >
            TypeScript
          </button>
          <button
            className={`sdk-tab ${activeSdk === 'javascript' ? 'active' : ''}`}
            onClick={() => setActiveSdk('javascript')}
            onMouseEnter={(e) => {
              if (activeSdk !== 'javascript') {
                e.currentTarget.style.background = '#f9fafb';
              }
            }}
            onMouseLeave={(e) => {
              if (activeSdk !== 'javascript') {
                e.currentTarget.style.background = 'transparent';
              }
            }}
            style={{
              background: activeSdk === 'javascript' ? '#f9fafb' : 'transparent',
              border: 'none',
              padding: '0.625rem 1.25rem',
              fontSize: '0.875rem',
              fontWeight: activeSdk === 'javascript' ? 600 : 500,
              color: activeSdk === 'javascript' ? '#1f2937' : '#6b7280',
              cursor: 'pointer',
              borderBottom: activeSdk === 'javascript' ? '2px solid #475569' : '2px solid transparent',
              marginBottom: activeSdk === 'javascript' ? '-0.5rem' : '-0.5rem',
              transition: 'color 0.15s, border-color 0.15s',
              borderRadius: '0.25rem 0.25rem 0 0',
              whiteSpace: 'nowrap'
            }}
          >
            JavaScript
          </button>
          <button
            className={`sdk-tab ${activeSdk === 'go' ? 'active' : ''}`}
            onClick={() => setActiveSdk('go')}
            onMouseEnter={(e) => {
              if (activeSdk !== 'go') {
                e.currentTarget.style.background = '#f9fafb';
              }
            }}
            onMouseLeave={(e) => {
              if (activeSdk !== 'go') {
                e.currentTarget.style.background = 'transparent';
              }
            }}
            style={{
              background: activeSdk === 'go' ? '#f9fafb' : 'transparent',
              border: 'none',
              padding: '0.625rem 1.25rem',
              fontSize: '0.875rem',
              fontWeight: activeSdk === 'go' ? 600 : 500,
              color: activeSdk === 'go' ? '#1f2937' : '#6b7280',
              cursor: 'pointer',
              borderBottom: activeSdk === 'go' ? '2px solid #475569' : '2px solid transparent',
              marginBottom: activeSdk === 'go' ? '-0.5rem' : '-0.5rem',
              transition: 'color 0.15s, border-color 0.15s',
              borderRadius: '0.25rem 0.25rem 0 0',
              whiteSpace: 'nowrap'
            }}
          >
            Go
          </button>
          <button
            className={`sdk-tab ${activeSdk === 'php' ? 'active' : ''}`}
            onClick={() => setActiveSdk('php')}
            onMouseEnter={(e) => {
              if (activeSdk !== 'php') {
                e.currentTarget.style.background = '#f9fafb';
              }
            }}
            onMouseLeave={(e) => {
              if (activeSdk !== 'php') {
                e.currentTarget.style.background = 'transparent';
              }
            }}
            style={{
              background: activeSdk === 'php' ? '#f9fafb' : 'transparent',
              border: 'none',
              padding: '0.625rem 1.25rem',
              fontSize: '0.875rem',
              fontWeight: activeSdk === 'php' ? 600 : 500,
              color: activeSdk === 'php' ? '#1f2937' : '#6b7280',
              cursor: 'pointer',
              borderBottom: activeSdk === 'php' ? '2px solid #475569' : '2px solid transparent',
              marginBottom: activeSdk === 'php' ? '-0.5rem' : '-0.5rem',
              transition: 'color 0.15s, border-color 0.15s',
              borderRadius: '0.25rem 0.25rem 0 0',
              whiteSpace: 'nowrap'
            }}
          >
            PHP
          </button>
          <button
            className={`sdk-tab ${activeSdk === 'python' ? 'active' : ''}`}
            onClick={() => setActiveSdk('python')}
            onMouseEnter={(e) => {
              if (activeSdk !== 'python') {
                e.currentTarget.style.background = '#f9fafb';
              }
            }}
            onMouseLeave={(e) => {
              if (activeSdk !== 'python') {
                e.currentTarget.style.background = 'transparent';
              }
            }}
            style={{
              background: activeSdk === 'python' ? '#f9fafb' : 'transparent',
              border: 'none',
              padding: '0.625rem 1.25rem',
              fontSize: '0.875rem',
              fontWeight: activeSdk === 'python' ? 600 : 500,
              color: activeSdk === 'python' ? '#1f2937' : '#6b7280',
              cursor: 'pointer',
              borderBottom: activeSdk === 'python' ? '2px solid #475569' : '2px solid transparent',
              marginBottom: activeSdk === 'python' ? '-0.5rem' : '-0.5rem',
              transition: 'color 0.15s, border-color 0.15s',
              borderRadius: '0.25rem 0.25rem 0 0',
              whiteSpace: 'nowrap'
            }}
          >
            Python
          </button>
          <button
            className={`sdk-tab ${activeSdk === 'java' ? 'active' : ''}`}
            onClick={() => setActiveSdk('java')}
            onMouseEnter={(e) => {
              if (activeSdk !== 'java') {
                e.currentTarget.style.background = '#f9fafb';
              }
            }}
            onMouseLeave={(e) => {
              if (activeSdk !== 'java') {
                e.currentTarget.style.background = 'transparent';
              }
            }}
            style={{
              background: activeSdk === 'java' ? '#f9fafb' : 'transparent',
              border: 'none',
              padding: '0.625rem 1.25rem',
              fontSize: '0.875rem',
              fontWeight: activeSdk === 'java' ? 600 : 500,
              color: activeSdk === 'java' ? '#1f2937' : '#6b7280',
              cursor: 'pointer',
              borderBottom: activeSdk === 'java' ? '2px solid #475569' : '2px solid transparent',
              marginBottom: activeSdk === 'java' ? '-0.5rem' : '-0.5rem',
              transition: 'color 0.15s, border-color 0.15s',
              borderRadius: '0.25rem 0.25rem 0 0',
              whiteSpace: 'nowrap'
            }}
          >
            Java
          </button>
          <button
            className={`sdk-tab ${activeSdk === 'perl' ? 'active' : ''}`}
            onClick={() => setActiveSdk('perl')}
            onMouseEnter={(e) => {
              if (activeSdk !== 'perl') {
                e.currentTarget.style.background = '#f9fafb';
              }
            }}
            onMouseLeave={(e) => {
              if (activeSdk !== 'perl') {
                e.currentTarget.style.background = 'transparent';
              }
            }}
            style={{
              background: activeSdk === 'perl' ? '#f9fafb' : 'transparent',
              border: 'none',
              padding: '0.625rem 1.25rem',
              fontSize: '0.875rem',
              fontWeight: activeSdk === 'perl' ? 600 : 500,
              color: activeSdk === 'perl' ? '#1f2937' : '#6b7280',
              cursor: 'pointer',
              borderBottom: activeSdk === 'perl' ? '2px solid #475569' : '2px solid transparent',
              marginBottom: activeSdk === 'perl' ? '-0.5rem' : '-0.5rem',
              transition: 'color 0.15s, border-color 0.15s',
              borderRadius: '0.25rem 0.25rem 0 0',
              whiteSpace: 'nowrap'
            }}
          >
            Perl
          </button>
        </div>
      </section>

      {/* TypeScript SDK Section */}
      {activeSdk === 'typescript' && (
      <section>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>TypeScript/Node.js Quick Start</h2>
        <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.25rem' }}>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#1f2937' }}>
            <strong>For Admin:</strong> Use direct REST API calls with axios or fetch to manage companies, agreements, health monitoring, and system administration.
          </p>
        </div>
        <div style={{ backgroundColor: '#1f2937', color: '#f9fafb', padding: '1.5rem', borderRadius: '0.25rem', marginTop: '1rem' }}>
          <pre style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5', fontFamily: 'Monaco, Menlo, monospace', whiteSpace: 'pre-wrap' }}>{`import axios from 'axios';

const API_BASE = 'http://localhost:8080';
let token = '';

// 1. Admin Login
const loginRes = await axios.post(\`\${API_BASE}/auth/login\`, {
  email: 'admin@example.com',
  password: 'password123'
});
token = loginRes.data.access;

// 2. Get Overview Dashboard
const overviewRes = await axios.get(
  \`\${API_BASE}/admin/overview\`,
  { headers: { Authorization: \`Bearer \${token}\` } }
);
console.log('Overview:', overviewRes.data);

// 3. List Companies (with filters)
const companiesRes = await axios.get(
  \`\${API_BASE}/admin/companies?type=AGENT&status=ACTIVE\`,
  { headers: { Authorization: \`Bearer \${token}\` } }
);
console.log('Companies:', companiesRes.data.items);

// 4. Get Company Details
const companyRes = await axios.get(
  \`\${API_BASE}/admin/companies/\${companyId}\`,
  { headers: { Authorization: \`Bearer \${token}\` } }
);
console.log('Company:', companyRes.data);

// 5. Create New Company
const newCompanyRes = await axios.post(
  \`\${API_BASE}/admin/companies\`,
  {
    companyName: 'New Agent Company',
    email: 'agent@example.com',
    type: 'AGENT',
    password: 'securePassword123',
    adapterType: 'grpc',
    grpcEndpoint: 'localhost:51062'
  },
  { headers: { Authorization: \`Bearer \${token}\` } }
);
console.log('Created:', newCompanyRes.data);

// 6. Update Company
await axios.patch(
  \`\${API_BASE}/admin/companies/\${companyId}\`,
  {
    companyName: 'Updated Company Name',
    status: 'SUSPENDED'
  },
  { headers: { Authorization: \`Bearer \${token}\` } }
);

// 7. Health Check
const healthRes = await axios.get(
  \`\${API_BASE}/admin/health\`,
  { headers: { Authorization: \`Bearer \${token}\` } }
);
console.log('Health:', healthRes.data);

// 8. List All Branches
const branchesRes = await axios.get(
  \`\${API_BASE}/admin/branches?limit=50&offset=0\`,
  { headers: { Authorization: \`Bearer \${token}\` } }
);
console.log('Branches:', branchesRes.data.items);

// 9. List Agreements
const agreementsRes = await axios.get(
  \`\${API_BASE}/admin/agreements?status=ACTIVE\`,
  { headers: { Authorization: \`Bearer \${token}\` } }
);
console.log('Agreements:', agreementsRes.data);

// 10. Get Endpoint Configurations
const endpointsRes = await axios.get(
  \`\${API_BASE}/admin/endpoints?type=SOURCE\`,
  { headers: { Authorization: \`Bearer \${token}\` } }
);
console.log('Endpoints:', endpointsRes.data.companies);

// 11. Update Company Endpoint
await axios.put(
  \`\${API_BASE}/admin/endpoints/\${companyId}\`,
  {
    grpcEndpoint: 'localhost:51063',
    adapterType: 'grpc'
  },
  { headers: { Authorization: \`Bearer \${token}\` } }
);

// 12. Get System Logs
const logsRes = await axios.get(
  \`\${API_BASE}/admin/logs?limit=100&level=ERROR\`,
  { headers: { Authorization: \`Bearer \${token}\` } }
);
console.log('Logs:', logsRes.data.items);

// 13. Create API Key
const apiKeyRes = await axios.post(
  \`\${API_BASE}/admin/api-keys\`,
  {
    companyId: companyId,
    name: 'Production Key',
    expiresAt: '2026-12-31T23:59:59Z'
  },
  { headers: { Authorization: \`Bearer \${token}\` } }
);
console.log('API Key:', apiKeyRes.data.key);`}</pre>
        </div>
        <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
          <p>
            <strong>Requirements:</strong> Node.js 18+, axios (npm install axios)
          </p>
        </div>
        </section>
      )}

      {/* JavaScript SDK Section */}
      {activeSdk === 'javascript' && (
        <section>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>JavaScript Quick Start</h2>
          <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.25rem' }}>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#1f2937' }}>
              <strong>For Admin:</strong> Use axios or fetch for direct REST API calls to manage the platform.
            </p>
          </div>
          <div style={{ backgroundColor: '#1f2937', color: '#f9fafb', padding: '1.5rem', borderRadius: '0.25rem', marginTop: '1rem' }}>
            <pre style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5', fontFamily: 'Monaco, Menlo, monospace', whiteSpace: 'pre-wrap' }}>{`const axios = require('axios');
// or in browser: <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>

const API_BASE = 'http://localhost:8080';
let token = '';

// Login and get token
async function login() {
  const res = await axios.post(\`\${API_BASE}/auth/login\`, {
    email: 'admin@example.com',
    password: 'password123'
  });
  token = res.data.access;
  return token;
}

// Get companies
async function getCompanies(type, status) {
  const res = await axios.get(\`\${API_BASE}/admin/companies\`, {
    params: { type, status },
    headers: { Authorization: \`Bearer \${token}\` }
  });
  return res.data.items;
}

// Create company
async function createCompany(companyData) {
  const res = await axios.post(
    \`\${API_BASE}/admin/companies\`,
    companyData,
    { headers: { Authorization: \`Bearer \${token}\` } }
  );
  return res.data;
}

// Health check
async function checkHealth() {
  const res = await axios.get(
    \`\${API_BASE}/admin/health\`,
    { headers: { Authorization: \`Bearer \${token}\` } }
  );
  return res.data;
}

// Example usage
(async () => {
  await login();
  const companies = await getCompanies('AGENT', 'ACTIVE');
  console.log('Active agents:', companies);
  
  const health = await checkHealth();
  console.log('System health:', health);
})();`}</pre>
          </div>
          <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
            <p>
              <strong>Requirements:</strong> Node.js 18+ or modern browser, axios (npm install axios)
            </p>
          </div>
        </section>
      )}

      {/* Go SDK Section */}
      {activeSdk === 'go' && (
      <section>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>Go Quick Start</h2>
        <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.25rem' }}>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#1f2937' }}>
            <strong>For Admin:</strong> Use standard Go net/http package for REST API calls.
          </p>
        </div>
        <div style={{ backgroundColor: '#1f2937', color: '#f9fafb', padding: '1.5rem', borderRadius: '0.25rem', marginTop: '1rem' }}>
          <pre style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5', fontFamily: 'Monaco, Menlo, monospace', whiteSpace: 'pre-wrap' }}>{`package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
)

const API_BASE = "http://localhost:8080"

type LoginRequest struct {
    Email    string \`json:"email"\`
    Password string \`json:"password"\`
}

type LoginResponse struct {
    Access string \`json:"access"\`
}

func login(email, password string) (string, error) {
    data, _ := json.Marshal(LoginRequest{Email: email, Password: password})
    req, _ := http.NewRequest("POST", API_BASE+"/auth/login", bytes.NewBuffer(data))
    req.Header.Set("Content-Type", "application/json")
    
    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        return "", err
    }
    defer resp.Body.Close()
    
    var loginResp LoginResponse
    json.NewDecoder(resp.Body).Decode(&loginResp)
    return loginResp.Access, nil
}

func getCompanies(token, companyType, status string) ([]byte, error) {
    url := API_BASE + "/admin/companies?type=" + companyType + "&status=" + status
    req, _ := http.NewRequest("GET", url, nil)
    req.Header.Set("Authorization", "Bearer "+token)
    
    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    
    body, _ := io.ReadAll(resp.Body)
    return body, nil
}

func createCompany(token string, companyData map[string]interface{}) ([]byte, error) {
    data, _ := json.Marshal(companyData)
    req, _ := http.NewRequest("POST", API_BASE+"/admin/companies", bytes.NewBuffer(data))
    req.Header.Set("Content-Type", "application/json")
    req.Header.Set("Authorization", "Bearer "+token)
    
    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    
    body, _ := io.ReadAll(resp.Body)
    return body, nil
}

func main() {
    token, _ := login("admin@example.com", "password123")
    
    companies, _ := getCompanies(token, "AGENT", "ACTIVE")
    fmt.Println("Companies:", string(companies))
    
    companyData := map[string]interface{}{
        "companyName": "New Company",
        "email":       "new@example.com",
        "type":        "AGENT",
        "password":    "secure123",
    }
    result, _ := createCompany(token, companyData)
    fmt.Println("Created:", string(result))
}`}</pre>
        </div>
        <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
          <p>
            <strong>Requirements:</strong> Go 1.18+, standard library only (net/http, encoding/json)
          </p>
        </div>
        </section>
      )}

      {/* PHP SDK Section */}
      {activeSdk === 'php' && (
      <section>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>PHP Quick Start</h2>
        <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.25rem' }}>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#1f2937' }}>
            <strong>For Admin:</strong> Use Guzzle HTTP client for REST API calls.
          </p>
        </div>
        <div style={{ backgroundColor: '#1f2937', color: '#f9fafb', padding: '1.5rem', borderRadius: '0.25rem', marginTop: '1rem' }}>
          <pre style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5', fontFamily: 'Monaco, Menlo, monospace', whiteSpace: 'pre-wrap' }}>{`<?php

require 'vendor/autoload.php';

use GuzzleHttp\\Client;

$API_BASE = 'http://localhost:8080';
$token = '';

// Login
$client = new Client(['base_uri' => $API_BASE]);
$loginRes = $client->post('/auth/login', [
    'json' => [
        'email' => 'admin@example.com',
        'password' => 'password123'
    ]
]);
$data = json_decode($loginRes->getBody(), true);
$token = $data['access'];

// Get companies
$companiesRes = $client->get('/admin/companies', [
    'query' => ['type' => 'AGENT', 'status' => 'ACTIVE'],
    'headers' => ['Authorization' => "Bearer $token"]
]);
$companies = json_decode($companiesRes->getBody(), true);
echo "Companies: " . json_encode($companies['items']) . PHP_EOL;

// Create company
$createRes = $client->post('/admin/companies', [
    'json' => [
        'companyName' => 'New Company',
        'email' => 'new@example.com',
        'type' => 'AGENT',
        'password' => 'secure123',
        'adapterType' => 'grpc',
        'grpcEndpoint' => 'localhost:51062'
    ],
    'headers' => ['Authorization' => "Bearer $token"]
]);
$newCompany = json_decode($createRes->getBody(), true);
echo "Created: " . json_encode($newCompany) . PHP_EOL;

// Health check
$healthRes = $client->get('/admin/health', [
    'headers' => ['Authorization' => "Bearer $token"]
]);
$health = json_decode($healthRes->getBody(), true);
echo "Health: " . json_encode($health) . PHP_EOL;

// Get branches
$branchesRes = $client->get('/admin/branches', [
    'query' => ['limit' => 50, 'offset' => 0],
    'headers' => ['Authorization' => "Bearer $token"]
]);
$branches = json_decode($branchesRes->getBody(), true);
echo "Branches: " . json_encode($branches['items']) . PHP_EOL;

// Update company
$companyId = 'company-id-here';
$updateRes = $client->patch("/admin/companies/$companyId", [
    'json' => [
        'companyName' => 'Updated Name',
        'status' => 'SUSPENDED'
    ],
    'headers' => ['Authorization' => "Bearer $token"]
]);

?>`}</pre>
        </div>
        <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
          <p>
            <strong>Requirements:</strong> PHP 8.0+, Guzzle HTTP (composer require guzzlehttp/guzzle)
          </p>
        </div>
        </section>
      )}

      {/* Python SDK Section */}
      {activeSdk === 'python' && (
      <section>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>Python Quick Start</h2>
        <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.25rem' }}>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#1f2937' }}>
            <strong>For Admin:</strong> Use requests library for REST API calls.
          </p>
        </div>
        <div style={{ backgroundColor: '#1f2937', color: '#f9fafb', padding: '1.5rem', borderRadius: '0.25rem', marginTop: '1rem' }}>
          <pre style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5', fontFamily: 'Monaco, Menlo, monospace', whiteSpace: 'pre-wrap' }}>{`import requests

API_BASE = 'http://localhost:8080'
token = ''

# Login
login_res = requests.post(f'{API_BASE}/auth/login', json={
    'email': 'admin@example.com',
    'password': 'password123'
})
token = login_res.json()['access']

# Get overview
headers = {'Authorization': f'Bearer {token}'}
overview_res = requests.get(f'{API_BASE}/admin/overview', headers=headers)
print('Overview:', overview_res.json())

# List companies
companies_res = requests.get(
    f'{API_BASE}/admin/companies',
    params={'type': 'AGENT', 'status': 'ACTIVE'},
    headers=headers
)
companies = companies_res.json()['items']
print('Companies:', companies)

# Create company
new_company_res = requests.post(
    f'{API_BASE}/admin/companies',
    json={
        'companyName': 'New Company',
        'email': 'new@example.com',
        'type': 'AGENT',
        'password': 'secure123',
        'adapterType': 'grpc',
        'grpcEndpoint': 'localhost:51062'
    },
    headers=headers
)
print('Created:', new_company_res.json())

# Health check
health_res = requests.get(f'{API_BASE}/admin/health', headers=headers)
print('Health:', health_res.json())

# Get branches
branches_res = requests.get(
    f'{API_BASE}/admin/branches',
    params={'limit': 50, 'offset': 0},
    headers=headers
)
print('Branches:', branches_res.json()['items'])

# Update company
company_id = 'company-id-here'
update_res = requests.patch(
    f'{API_BASE}/admin/companies/{company_id}',
    json={'companyName': 'Updated Name', 'status': 'SUSPENDED'},
    headers=headers
)
print('Updated:', update_res.json())

# Get agreements
agreements_res = requests.get(
    f'{API_BASE}/admin/agreements',
    params={'status': 'ACTIVE'},
    headers=headers
)
print('Agreements:', agreements_res.json())

# Error handling
try:
    response = requests.get(f'{API_BASE}/admin/companies/invalid-id', headers=headers)
    response.raise_for_status()
except requests.exceptions.HTTPError as e:
    print(f"HTTP Error: {e.response.status_code} - {e.response.text}")`}</pre>
        </div>
        <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
          <p>
            <strong>Requirements:</strong> Python 3.8+, requests library (pip install requests)
          </p>
        </div>
        </section>
      )}

      {/* Java SDK Section */}
      {activeSdk === 'java' && (
      <section>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>Java Quick Start</h2>
        <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.25rem' }}>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#1f2937' }}>
            <strong>For Admin:</strong> Use Java HttpClient or OkHttp for REST API calls.
          </p>
        </div>
        <div style={{ backgroundColor: '#1f2937', color: '#f9fafb', padding: '1.5rem', borderRadius: '0.25rem', marginTop: '1rem' }}>
          <pre style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5', fontFamily: 'Monaco, Menlo, monospace', whiteSpace: 'pre-wrap' }}>{`import java.net.http.*;
import java.net.URI;
import com.google.gson.Gson;
import java.util.*;

public class AdminClient {
    private static final String API_BASE = "http://localhost:8080";
    private static final Gson gson = new Gson();
    private String token = "";
    
    public String login(String email, String password) throws Exception {
        Map<String, String> loginData = Map.of(
            "email", email,
            "password", password
        );
        
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(API_BASE + "/auth/login"))
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(gson.toJson(loginData)))
            .build();
        
        HttpResponse<String> response = client.send(request, 
            HttpResponse.BodyHandlers.ofString());
        Map<String, Object> result = gson.fromJson(response.body(), Map.class);
        token = (String) result.get("access");
        return token;
    }
    
    public String getCompanies(String type, String status) throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        String url = API_BASE + "/admin/companies?type=" + type + "&status=" + status;
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(url))
            .header("Authorization", "Bearer " + token)
            .GET()
            .build();
        
        HttpResponse<String> response = client.send(request, 
            HttpResponse.BodyHandlers.ofString());
        return response.body();
    }
    
    public String createCompany(Map<String, Object> companyData) throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(API_BASE + "/admin/companies"))
            .header("Content-Type", "application/json")
            .header("Authorization", "Bearer " + token)
            .POST(HttpRequest.BodyPublishers.ofString(gson.toJson(companyData)))
            .build();
        
        HttpResponse<String> response = client.send(request, 
            HttpResponse.BodyHandlers.ofString());
        return response.body();
    }
    
    public static void main(String[] args) throws Exception {
        AdminClient admin = new AdminClient();
        admin.login("admin@example.com", "password123");
        
        String companies = admin.getCompanies("AGENT", "ACTIVE");
        System.out.println("Companies: " + companies);
        
        Map<String, Object> newCompany = Map.of(
            "companyName", "New Company",
            "email", "new@example.com",
            "type", "AGENT",
            "password", "secure123"
        );
        String created = admin.createCompany(newCompany);
        System.out.println("Created: " + created);
    }
}`}</pre>
        </div>
        <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
          <p>
            <strong>Requirements:</strong> Java 11+ (includes HttpClient), Gson for JSON (com.google.code.gson:gson)
          </p>
        </div>
        </section>
      )}

      {/* Perl SDK Section */}
      {activeSdk === 'perl' && (
      <section>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>Perl Quick Start</h2>
        <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.25rem' }}>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#1f2937' }}>
            <strong>For Admin:</strong> Use LWP::UserAgent and JSON modules for REST API calls.
          </p>
        </div>
        <div style={{ backgroundColor: '#1f2937', color: '#f9fafb', padding: '1.5rem', borderRadius: '0.25rem', marginTop: '1rem' }}>
          <pre style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5', fontFamily: 'Monaco, Menlo, monospace', whiteSpace: 'pre-wrap' }}>{`use strict;
use warnings;
use LWP::UserAgent;
use HTTP::Request;
use JSON;
use URI::Encode qw(uri_encode);

my $API_BASE = 'http://localhost:8080';
my $token = '';

sub login {
    my ($email, $password) = @_;
    my $ua = LWP::UserAgent->new;
    my $json = JSON->new;
    
    my $req = HTTP::Request->new('POST', "$API_BASE/auth/login");
    $req->header('Content-Type' => 'application/json');
    $req->content($json->encode({ email => $email, password => $password }));
    
    my $res = $ua->request($req);
    if ($res->is_success) {
        my $data = $json->decode($res->content);
        $token = $data->{access};
        return $token;
    }
    die "Login failed: " . $res->status_line;
}

sub get_companies {
    my ($type, $status) = @_;
    my $ua = LWP::UserAgent->new;
    my $json = JSON->new;
    
    my $url = "$API_BASE/admin/companies?type=" . uri_encode($type) . 
              "&status=" . uri_encode($status);
    my $req = HTTP::Request->new('GET', $url);
    $req->header('Authorization' => "Bearer $token");
    
    my $res = $ua->request($req);
    if ($res->is_success) {
        return $json->decode($res->content);
    }
    die "Request failed: " . $res->status_line;
}

sub create_company {
    my ($company_data) = @_;
    my $ua = LWP::UserAgent->new;
    my $json = JSON->new;
    
    my $req = HTTP::Request->new('POST', "$API_BASE/admin/companies");
    $req->header('Content-Type' => 'application/json');
    $req->header('Authorization' => "Bearer $token");
    $req->content($json->encode($company_data));
    
    my $res = $ua->request($req);
    if ($res->is_success) {
        return $json->decode($res->content);
    }
    die "Request failed: " . $res->status_line;
}

# Example usage
login('admin@example.com', 'password123');

my $companies = get_companies('AGENT', 'ACTIVE');
print "Companies: " . encode_json($companies->{items}) . "\\n";

my $new_company = {
    companyName => 'New Company',
    email       => 'new@example.com',
    type        => 'AGENT',
    password    => 'secure123'
};
my $created = create_company($new_company);
print "Created: " . encode_json($created) . "\\n";`}</pre>
        </div>
        <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
          <p>
            <strong>Requirements:</strong> Perl 5.10+, LWP::UserAgent, JSON, URI::Encode (cpanm LWP::UserAgent JSON URI::Encode)
          </p>
        </div>
        </section>
      )}
            </>
          )}
          {activeSection !== 'quick-start' && renderSection(activeSection)}
        </div>
      </main>
    </div>
  );
};

export default SdkGuide;


import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import http from '../../lib/http';
import './docs.css';

type SdkType = 'javascript' | 'typescript' | 'go' | 'php' | 'python' | 'java' | 'perl';

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

  return (
    <div className="docs-main">
      <h1>SDK Guide</h1>
      <p>Get started with Gloria Connect SDKs for integrating with our API.</p>

      {role && (
        <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.25rem' }}>
          <p style={{ margin: 0, fontWeight: 600, color: '#1e40af' }}>{prefaceText[role]}</p>
        </div>
      )}

      <section>
        <h2>Available SDKs</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
          {/* JavaScript Card */}
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.25rem', padding: '1.5rem', backgroundColor: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>📦</span>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>JavaScript</h3>
              <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', backgroundColor: '#10b981', color: 'white', borderRadius: '0.25rem', fontWeight: 500 }}>Available</span>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#374151', marginBottom: '1rem' }}>
              Production-ready SDK for Node.js 18+ and modern browsers.
            </p>
            <div style={{ fontSize: '0.875rem' }}>
              <p style={{ margin: '0.5rem 0', fontWeight: 600 }}>Features:</p>
              <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem', color: '#6b7280' }}>
                <li>Full API coverage</li>
                <li>Long-polling support</li>
                <li>Automatic retries</li>
                <li>TypeScript-friendly</li>
              </ul>
            </div>
          </div>

          {/* PHP Card */}
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.25rem', padding: '1.5rem', backgroundColor: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>🐘</span>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>PHP</h3>
              <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', backgroundColor: '#10b981', color: 'white', borderRadius: '0.25rem', fontWeight: 500 }}>Available</span>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#374151', marginBottom: '1rem' }}>
              Production-ready PHP SDK for server-side integration.
            </p>
            <div style={{ fontSize: '0.875rem' }}>
              <p style={{ margin: '0.5rem 0', fontWeight: 600 }}>Features:</p>
              <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem', color: '#6b7280' }}>
                <li>Generator-based streaming</li>
                <li>Full API coverage</li>
                <li>Automatic retries</li>
                <li>PSR-4 autoloading</li>
              </ul>
            </div>
          </div>

          {/* TypeScript Card */}
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.25rem', padding: '1.5rem', backgroundColor: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>📘</span>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>TypeScript</h3>
              <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', backgroundColor: '#10b981', color: 'white', borderRadius: '0.25rem', fontWeight: 500 }}>Available</span>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#374151', marginBottom: '1rem' }}>
              Production-ready TypeScript SDK with full type definitions.
            </p>
            <div style={{ fontSize: '0.875rem' }}>
              <p style={{ margin: '0.5rem 0', fontWeight: 600 }}>Features:</p>
              <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem', color: '#6b7280' }}>
                <li>Complete type definitions</li>
                <li>Full API coverage</li>
                <li>Long-polling support</li>
                <li>Tree-shakable builds</li>
              </ul>
            </div>
          </div>

          {/* Go Card */}
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.25rem', padding: '1.5rem', backgroundColor: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>🐹</span>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>Go</h3>
              <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', backgroundColor: '#10b981', color: 'white', borderRadius: '0.25rem', fontWeight: 500 }}>Available</span>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#374151', marginBottom: '1rem' }}>
              Production-ready Go SDK for high-performance integrations.
            </p>
            <div style={{ fontSize: '0.875rem' }}>
              <p style={{ margin: '0.5rem 0', fontWeight: 600 }}>Features:</p>
              <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem', color: '#6b7280' }}>
                <li>Channel-based streaming</li>
                <li>Full context support</li>
                <li>Standard library</li>
                <li>Type-safe API</li>
              </ul>
            </div>
          </div>

          {/* Python Card */}
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.25rem', padding: '1.5rem', backgroundColor: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>🐍</span>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>Python</h3>
              <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', backgroundColor: '#10b981', color: 'white', borderRadius: '0.25rem', fontWeight: 500 }}>Available</span>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#374151', marginBottom: '1rem' }}>
              Production-ready Python SDK for data science and automation.
            </p>
            <div style={{ fontSize: '0.875rem' }}>
              <p style={{ margin: '0.5rem 0', fontWeight: 600 }}>Features:</p>
              <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem', color: '#6b7280' }}>
                <li>Async iterator support</li>
                <li>Full API coverage</li>
                <li>Type hints</li>
                <li>Error handling</li>
              </ul>
            </div>
          </div>
          
          {/* Java Card */}
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.25rem', padding: '1.5rem', backgroundColor: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>☕</span>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>Java</h3>
              <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', backgroundColor: '#10b981', color: 'white', borderRadius: '0.25rem', fontWeight: 500 }}>Available</span>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#374151', marginBottom: '1rem' }}>
              Production-ready Java SDK with CompletableFuture support.
            </p>
            <div style={{ fontSize: '0.875rem' }}>
              <p style={{ margin: '0.5rem 0', fontWeight: 600 }}>Features:</p>
              <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem', color: '#6b7280' }}>
                <li>Async operations</li>
                <li>Full API coverage</li>
                <li>Maven/Gradle support</li>
                <li>Error handling</li>
              </ul>
            </div>
          </div>
          
          {/* Perl Card */}
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.25rem', padding: '1.5rem', backgroundColor: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>🐪</span>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>Perl</h3>
              <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', backgroundColor: '#10b981', color: 'white', borderRadius: '0.25rem', fontWeight: 500 }}>Available</span>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#374151', marginBottom: '1rem' }}>
              Production-ready Perl SDK for legacy systems.
            </p>
            <div style={{ fontSize: '0.875rem' }}>
              <p style={{ margin: '0.5rem 0', fontWeight: 600 }}>Features:</p>
              <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem', color: '#6b7280' }}>
                <li>Generator-based streaming</li>
                <li>Full API coverage</li>
                <li>CPAN support</li>
                <li>Error handling</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* SDK Tabs Navigation */}
      <section style={{ marginBottom: '2rem' }}>
        <div className="sdk-tabs" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '3px solid #e5e7eb', paddingBottom: '0.5rem', overflowX: 'auto' }}>
          <button
            className={`sdk-tab ${activeSdk === 'typescript' ? 'active' : ''}`}
            onClick={() => setActiveSdk('typescript')}
            style={{
              background: activeSdk === 'typescript' ? '#eff6ff' : 'transparent',
              border: 'none',
              padding: '0.625rem 1rem',
              fontSize: '0.875rem',
              fontWeight: activeSdk === 'typescript' ? 600 : 500,
              color: activeSdk === 'typescript' ? '#3b82f6' : '#6b7280',
              cursor: 'pointer',
              borderBottom: activeSdk === 'typescript' ? '2px solid #3b82f6' : '2px solid transparent',
              marginBottom: activeSdk === 'typescript' ? '-0.5rem' : '-0.5rem',
              transition: 'color 0.15s',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => {
              if (activeSdk !== 'typescript') {
                e.currentTarget.style.background = '#f3f4f6';
              }
            }}
            onMouseLeave={(e) => {
              if (activeSdk !== 'typescript') {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            TypeScript
          </button>
          <button
            className={`sdk-tab ${activeSdk === 'javascript' ? 'active' : ''}`}
            onClick={() => setActiveSdk('javascript')}
            style={{
              background: activeSdk === 'javascript' ? '#eff6ff' : 'transparent',
              border: 'none',
              padding: '0.625rem 1rem',
              fontSize: '0.875rem',
              fontWeight: activeSdk === 'javascript' ? 600 : 500,
              color: activeSdk === 'javascript' ? '#3b82f6' : '#6b7280',
              cursor: 'pointer',
              borderBottom: activeSdk === 'javascript' ? '2px solid #3b82f6' : '2px solid transparent',
              marginBottom: activeSdk === 'javascript' ? '-0.5rem' : '-0.5rem',
              transition: 'color 0.15s',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => {
              if (activeSdk !== 'javascript') {
                e.currentTarget.style.background = '#f3f4f6';
              }
            }}
            onMouseLeave={(e) => {
              if (activeSdk !== 'javascript') {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            JavaScript
          </button>
          <button
            className={`sdk-tab ${activeSdk === 'go' ? 'active' : ''}`}
            onClick={() => setActiveSdk('go')}
            style={{
              background: activeSdk === 'go' ? '#eff6ff' : 'transparent',
              border: 'none',
              padding: '0.625rem 1rem',
              fontSize: '0.875rem',
              fontWeight: activeSdk === 'go' ? 600 : 500,
              color: activeSdk === 'go' ? '#3b82f6' : '#6b7280',
              cursor: 'pointer',
              borderBottom: activeSdk === 'go' ? '2px solid #3b82f6' : '2px solid transparent',
              marginBottom: activeSdk === 'go' ? '-0.5rem' : '-0.5rem',
              transition: 'color 0.15s',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => {
              if (activeSdk !== 'go') {
                e.currentTarget.style.background = '#f3f4f6';
              }
            }}
            onMouseLeave={(e) => {
              if (activeSdk !== 'go') {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            Go
          </button>
          <button
            className={`sdk-tab ${activeSdk === 'php' ? 'active' : ''}`}
            onClick={() => setActiveSdk('php')}
            style={{
              background: activeSdk === 'php' ? '#eff6ff' : 'transparent',
              border: 'none',
              padding: '0.625rem 1.25rem',
              fontSize: '0.875rem',
              fontWeight: activeSdk === 'php' ? 600 : 500,
              color: activeSdk === 'php' ? '#3b82f6' : '#6b7280',
              cursor: 'pointer',
              borderBottom: activeSdk === 'php' ? '2px solid #3b82f6' : '2px solid transparent',
              marginBottom: activeSdk === 'php' ? '-0.5rem' : '-0.5rem',
              transition: 'color 0.15s',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => {
              if (activeSdk !== 'php') {
                e.currentTarget.style.background = '#f3f4f6';
              }
            }}
            onMouseLeave={(e) => {
              if (activeSdk !== 'php') {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            PHP
          </button>
          <button
            className={`sdk-tab ${activeSdk === 'python' ? 'active' : ''}`}
            onClick={() => setActiveSdk('python')}
            style={{
              background: activeSdk === 'python' ? '#eff6ff' : 'transparent',
              border: 'none',
              padding: '0.625rem 1.25rem',
              fontSize: '0.875rem',
              fontWeight: activeSdk === 'python' ? 600 : 500,
              color: activeSdk === 'python' ? '#3b82f6' : '#6b7280',
              cursor: 'pointer',
              borderBottom: activeSdk === 'python' ? '2px solid #3b82f6' : '2px solid transparent',
              marginBottom: activeSdk === 'python' ? '-0.5rem' : '-0.5rem',
              transition: 'color 0.15s',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => {
              if (activeSdk !== 'python') {
                e.currentTarget.style.background = '#f3f4f6';
              }
            }}
            onMouseLeave={(e) => {
              if (activeSdk !== 'python') {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            Python
          </button>
          <button
            className={`sdk-tab ${activeSdk === 'java' ? 'active' : ''}`}
            onClick={() => setActiveSdk('java')}
            style={{
              background: activeSdk === 'java' ? '#eff6ff' : 'transparent',
              border: 'none',
              padding: '0.625rem 1.25rem',
              fontSize: '0.875rem',
              fontWeight: activeSdk === 'java' ? 600 : 500,
              color: activeSdk === 'java' ? '#3b82f6' : '#6b7280',
              cursor: 'pointer',
              borderBottom: activeSdk === 'java' ? '2px solid #3b82f6' : '2px solid transparent',
              marginBottom: activeSdk === 'java' ? '-0.5rem' : '-0.5rem',
              transition: 'color 0.15s',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => {
              if (activeSdk !== 'java') {
                e.currentTarget.style.background = '#f3f4f6';
              }
            }}
            onMouseLeave={(e) => {
              if (activeSdk !== 'java') {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            Java
          </button>
          <button
            className={`sdk-tab ${activeSdk === 'perl' ? 'active' : ''}`}
            onClick={() => setActiveSdk('perl')}
            style={{
              background: activeSdk === 'perl' ? '#eff6ff' : 'transparent',
              border: 'none',
              padding: '0.625rem 1.25rem',
              fontSize: '0.875rem',
              fontWeight: activeSdk === 'perl' ? 600 : 500,
              color: activeSdk === 'perl' ? '#3b82f6' : '#6b7280',
              cursor: 'pointer',
              borderBottom: activeSdk === 'perl' ? '2px solid #3b82f6' : '2px solid transparent',
              marginBottom: activeSdk === 'perl' ? '-0.5rem' : '-0.5rem',
              transition: 'color 0.15s',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => {
              if (activeSdk !== 'perl') {
                e.currentTarget.style.background = '#f3f4f6';
              }
            }}
            onMouseLeave={(e) => {
              if (activeSdk !== 'perl') {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            Perl
          </button>
        </div>
      </section>

      {/* TypeScript SDK Section */}
      {activeSdk === 'typescript' && (
      <section>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>TypeScript/Node.js SDK</h1>
        <p style={{ fontSize: '1rem', color: '#6b7280', marginBottom: '2rem' }}>
          Production-ready TypeScript SDK for Node.js 18+ with full type definitions, async/await support, and both REST and gRPC transports.
        </p>

        <section>
          <h2>Installation</h2>
          <div style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.25rem', padding: '1rem', marginTop: '1rem' }}>
            <pre style={{ margin: 0, fontSize: '0.875rem', fontFamily: 'Monaco, Menlo, monospace' }}>{`npm install @carhire/nodejs-sdk
# or
yarn add @carhire/nodejs-sdk`}</pre>
          </div>
        </section>

        <section>
          <h2>Quick Start (REST)</h2>
          <div style={{ backgroundColor: '#1f2937', color: '#f9fafb', padding: '1.5rem', borderRadius: '0.25rem', marginTop: '1rem' }}>
            <pre style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5', fontFamily: 'Monaco, Menlo, monospace', whiteSpace: 'pre-wrap' }}>{`import { CarHireClient, Config, AvailabilityCriteria, BookingCreate } from '@carhire/nodejs-sdk';

const config = Config.forRest({
  baseUrl: 'https://your-gateway.example.com',
  token: 'Bearer <JWT>',
  apiKey: '<YOUR_API_KEY>', // Optional
  agentId: 'ag_123',
  callTimeoutMs: 12000,
  availabilitySlaMs: 120000,
  longPollWaitMs: 10000,
});

const client = new CarHireClient(config);

// Search availability
const criteria = AvailabilityCriteria.make({
  pickupLocode: 'PKKHI',
  returnLocode: 'PKLHE',
  pickupAt: new Date('2025-11-03T10:00:00Z'),
  returnAt: new Date('2025-11-05T10:00:00Z'),
  driverAge: 28,
  currency: 'USD',
  agreementRefs: ['AGR-001'],
});

for await (const chunk of client.getAvailability().search(criteria)) {
  console.log(\`[\${chunk.status}] items=\${chunk.items.length} cursor=\${chunk.cursor ?? 0}\`);
  if (chunk.status === 'COMPLETE') break;
}

// Create booking
const booking = BookingCreate.fromOffer({
  agreement_ref: 'AGR-001',
  supplier_id: 'SRC-AVIS',
  offer_id: 'off_123',
  driver: {
    firstName: 'Ali',
    lastName: 'Raza',
    email: 'ali@example.com',
    phone: '+92...',
    age: 28,
  },
});

const result = await client.getBooking().create(booking, 'idem-123');
console.log(result.supplierBookingRef);`}</pre>
          </div>
        </section>

        <section>
          <h2>Configuration</h2>
          <p>Both REST and gRPC transports are supported:</p>
          <div style={{ backgroundColor: '#1f2937', color: '#f9fafb', padding: '1.5rem', borderRadius: '0.25rem', marginTop: '1rem' }}>
            <pre style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5', fontFamily: 'Monaco, Menlo, monospace', whiteSpace: 'pre-wrap' }}>{`// REST Configuration
const restConfig = Config.forRest({
  baseUrl: 'https://api.example.com', // Required
  token: 'Bearer <JWT>', // Required
  apiKey: '<API_KEY>', // Optional
  agentId: 'ag_123', // Optional
  callTimeoutMs: 10000, // Default: 10000
  availabilitySlaMs: 120000, // Default: 120000
  longPollWaitMs: 10000, // Default: 10000
});

// gRPC Configuration
const grpcConfig = Config.forGrpc({
  host: 'api.example.com:50051', // Required
  caCert: '<CA_CERT>', // Required
  clientCert: '<CLIENT_CERT>', // Required
  clientKey: '<CLIENT_KEY>', // Required
  agentId: 'ag_123', // Optional
});`}</pre>
          </div>
        </section>

        <section>
          <h2>Error Handling</h2>
          <div style={{ backgroundColor: '#1f2937', color: '#f9fafb', padding: '1.5rem', borderRadius: '0.25rem', marginTop: '1rem' }}>
            <pre style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5', fontFamily: 'Monaco, Menlo, monospace', whiteSpace: 'pre-wrap' }}>{`import { TransportException } from '@carhire/nodejs-sdk';

try {
  await client.getBooking().create(booking, 'idem-123');
} catch (error) {
  if (error instanceof TransportException) {
    console.error(\`Status: \${error.statusCode}, Code: \${error.code}\`);
  }
  throw error;
}`}</pre>
          </div>
        </section>

        <section>
          <h2>Features</h2>
          <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', color: '#374151' }}>
            <li>Availability Search: Submit → Poll pattern with streaming results</li>
            <li>Booking Management: Create, modify, cancel, and check bookings</li>
            <li>Agreement Enforcement: All operations require valid agreement references</li>
            <li>Idempotency: Booking creation supports idempotency keys</li>
            <li>TypeScript Support: Full type definitions included</li>
            <li>Both REST and gRPC transports supported</li>
          </ul>
        </section>

        <section>
          <h2>Documentation Links</h2>
          <div style={{ marginTop: '1rem' }}>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ marginBottom: '0.75rem' }}>
                <a href="../../sdk/nodejs-agent/README.md" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
                  📖 Full README
                </a>
              </li>
            </ul>
          </div>
        </section>
        </section>
      )}

      {/* JavaScript SDK Section */}
      {activeSdk === 'javascript' && (
        <>
          <section>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>JavaScript SDK</h1>
            <p style={{ fontSize: '1rem', color: '#6b7280', marginBottom: '2rem' }}>
              Production-ready JavaScript SDK for Node.js 18+ and modern browsers. Same API as TypeScript SDK but without type definitions.
            </p>

            <h2>Installation</h2>
            <div style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.25rem', padding: '1rem', marginTop: '1rem' }}>
              <pre style={{ margin: 0, fontSize: '0.875rem', fontFamily: 'Monaco, Menlo, monospace' }}>{`npm install @carhire/nodejs-sdk
# or
yarn add @carhire/nodejs-sdk`}</pre>
            </div>
          </section>

          <section>
            <h2>Quick Start (REST)</h2>
            <div style={{ backgroundColor: '#1f2937', color: '#f9fafb', padding: '1.5rem', borderRadius: '0.25rem', marginTop: '1rem' }}>
              <pre style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5', fontFamily: 'Monaco, Menlo, monospace', whiteSpace: 'pre-wrap' }}>{`import { CarHireClient, Config, AvailabilityCriteria, BookingCreate } from '@carhire/nodejs-sdk';

const config = Config.forRest({
  baseUrl: 'https://your-gateway.example.com',
  token: 'Bearer <JWT>',
  apiKey: '<YOUR_API_KEY>', // Optional
  agentId: 'ag_123',
  callTimeoutMs: 12000,
  availabilitySlaMs: 120000,
  longPollWaitMs: 10000,
});

const client = new CarHireClient(config);

// Search availability
const criteria = AvailabilityCriteria.make({
  pickupLocode: 'PKKHI',
  returnLocode: 'PKLHE',
  pickupAt: new Date('2025-11-03T10:00:00Z'),
  returnAt: new Date('2025-11-05T10:00:00Z'),
  driverAge: 28,
  currency: 'USD',
  agreementRefs: ['AGR-001'],
});

for await (const chunk of client.getAvailability().search(criteria)) {
  console.log(\`[\${chunk.status}] items=\${chunk.items.length} cursor=\${chunk.cursor ?? 0}\`);
  if (chunk.status === 'COMPLETE') break;
}

// Create booking
const booking = BookingCreate.fromOffer({
  agreement_ref: 'AGR-001',
  supplier_id: 'SRC-AVIS',
  offer_id: 'off_123',
  driver: {
    firstName: 'Ali',
    lastName: 'Raza',
    email: 'ali@example.com',
    phone: '+92...',
    age: 28,
  },
});

const result = await client.getBooking().create(booking, 'idem-123');
console.log(result.supplierBookingRef);`}</pre>
            </div>
          </section>

          <section>
            <h2>Availability Streaming</h2>
            <p>The SDK uses async iterators for streaming availability results:</p>
            <div style={{ backgroundColor: '#1f2937', color: '#f9fafb', padding: '1.5rem', borderRadius: '0.25rem', marginTop: '1rem' }}>
              <pre style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5', fontFamily: 'Monaco, Menlo, monospace', whiteSpace: 'pre-wrap' }}>{`// The search() method returns an async iterator
for await (const chunk of client.getAvailability().search(criteria)) {
  // Process each chunk as it arrives
  console.log(\`Status: \${chunk.status}, Items: \${chunk.items.length}\`);
  
  // Break when complete
  if (chunk.status === 'COMPLETE') {
    break;
  }
}`}</pre>
            </div>
          </section>

          <section>
            <h2>Error Handling</h2>
            <div style={{ backgroundColor: '#1f2937', color: '#f9fafb', padding: '1.5rem', borderRadius: '0.25rem', marginTop: '1rem' }}>
              <pre style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5', fontFamily: 'Monaco, Menlo, monospace', whiteSpace: 'pre-wrap' }}>{`import { TransportException } from '@carhire/nodejs-sdk';

try {
  await client.getBooking().create(booking, 'idem-123');
} catch (error) {
  if (error instanceof TransportException) {
    console.error(\`Status: \${error.statusCode}, Code: \${error.code}\`);
    console.error('Message:', error.message);
  }
  throw error;
}`}</pre>
            </div>
          </section>

          <section>
            <h2>REST Endpoints</h2>
            <p>The SDK uses the following REST endpoints:</p>
            <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', color: '#374151' }}>
              <li><code>POST /availability/submit</code> - Submit availability request</li>
              <li><code>GET /availability/poll?request_id&since_seq&wait_ms</code> - Poll availability results</li>
              <li><code>POST /bookings</code> - Create booking (with Idempotency-Key header)</li>
              <li><code>{'PATCH /bookings/{supplierBookingRef}?agreement_ref'}</code> - Modify booking</li>
              <li><code>{'POST /bookings/{supplierBookingRef}/cancel?agreement_ref'}</code> - Cancel booking</li>
              <li><code>{'GET /bookings/{supplierBookingRef}?agreement_ref'}</code> - Check booking status</li>
            </ul>
          </section>

          <section>
            <h2>Documentation Links</h2>
            <div style={{ marginTop: '1rem' }}>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                <li style={{ marginBottom: '0.75rem' }}>
                  <a href="../../sdk/nodejs-agent/README.md" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
                    📖 Full README
                  </a>
                </li>
              </ul>
            </div>
          </section>
        </>
      )}

      {/* Go SDK Section */}
      {activeSdk === 'go' && (
      <section>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>Go SDK</h1>
        <p style={{ fontSize: '1rem', color: '#6b7280', marginBottom: '2rem' }}>
          Production-ready Go SDK for high-performance integrations with full type safety and channel-based streaming.
        </p>

        <section>
          <h2>Installation</h2>
          <div style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.25rem', padding: '1rem', marginTop: '1rem' }}>
            <pre style={{ margin: 0, fontSize: '0.875rem', fontFamily: 'Monaco, Menlo, monospace' }}>{`go get github.com/carhire/go-sdk
# or
go mod init your-project
go get ./go-agent`}</pre>
          </div>
        </section>

        <section>
          <h2>Quick Start (REST)</h2>
          <div style={{ backgroundColor: '#1f2937', color: '#f9fafb', padding: '1.5rem', borderRadius: '0.25rem', marginTop: '1rem' }}>
            <pre style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5', fontFamily: 'Monaco, Menlo, monospace', whiteSpace: 'pre-wrap' }}>{`package main

import (
    "context"
    "fmt"
    "time"
    "github.com/carhire/go-sdk"
)

func main() {
    config := sdk.Config{
        BaseURL: "https://your-gateway.example.com",
        Token: "Bearer <JWT>",
        APIKey: "<YOUR_API_KEY>", // Optional
        AgentID: "ag_123",
        CallTimeoutMs: 12000,
        AvailabilitySlaMs: 120000,
        LongPollWaitMs: 10000,
    }
    
    client := sdk.NewClient(config)
    ctx := context.Background()
    
    // Search availability
    criteria := sdk.AvailabilityCriteria{
        PickupLocode: "PKKHI",
        ReturnLocode: "PKLHE",
        PickupAt: time.Date(2025, 11, 3, 10, 0, 0, 0, time.UTC),
        ReturnAt: time.Date(2025, 11, 5, 10, 0, 0, 0, time.UTC),
        DriverAge: 28,
        Currency: "USD",
        AgreementRefs: []string{"AGR-001"},
    }
    
    chunks, err := client.Availability().Search(ctx, criteria)
    if err != nil {
        panic(err)
    }
    
    for chunk := range chunks {
        fmt.Printf("[%s] items=%d cursor=%d\\n", chunk.Status, len(chunk.Items), chunk.Cursor)
        if chunk.Status == "COMPLETE" {
            break
        }
    }
    
    // Create booking
    booking := sdk.BookingCreate{
        AgreementRef: "AGR-001",
        SupplierID: "SRC-AVIS",
        OfferID: "off_123",
        Driver: sdk.Driver{
            FirstName: "Ali",
            LastName: "Raza",
            Email: "ali@example.com",
            Phone: "+92...",
            Age: 28,
        },
    }
    
    result, err := client.Booking().Create(ctx, booking, "idem-123")
    if err != nil {
        panic(err)
    }
    fmt.Println(result.SupplierBookingRef)
}`}</pre>
          </div>
        </section>

        <section>
          <h2>Configuration</h2>
          <div style={{ backgroundColor: '#1f2937', color: '#f9fafb', padding: '1.5rem', borderRadius: '0.25rem', marginTop: '1rem' }}>
            <pre style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5', fontFamily: 'Monaco, Menlo, monospace', whiteSpace: 'pre-wrap' }}>{`// REST Configuration
config := sdk.Config{
    BaseURL: "https://api.example.com", // Required
    Token: "Bearer <JWT>", // Required
    APIKey: "<API_KEY>", // Optional
    AgentID: "ag_123", // Optional
    CallTimeoutMs: 10000, // Default: 10000
    AvailabilitySlaMs: 120000, // Default: 120000
    LongPollWaitMs: 10000, // Default: 10000
}

// gRPC Configuration
config := sdk.Config{
    Host: "api.example.com:50051", // Required
    CACert: "<CA_CERT>", // Required
    ClientCert: "<CLIENT_CERT>", // Required
    ClientKey: "<CLIENT_KEY>", // Required
    AgentID: "ag_123", // Optional
}`}</pre>
          </div>
        </section>

        <section>
          <h2>Error Handling</h2>
          <div style={{ backgroundColor: '#1f2937', color: '#f9fafb', padding: '1.5rem', borderRadius: '0.25rem', marginTop: '1rem' }}>
            <pre style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5', fontFamily: 'Monaco, Menlo, monospace', whiteSpace: 'pre-wrap' }}>{`result, err := client.Booking().Create(ctx, booking, "idem-123")
if err != nil {
    if sdkErr, ok := err.(*sdk.TransportException); ok {
        fmt.Printf("Status: %d, Code: %s\\n", sdkErr.StatusCode, sdkErr.Code)
        fmt.Printf("Message: %s\\n", sdkErr.Message)
    }
    return err
}`}</pre>
          </div>
        </section>

        <section>
          <h2>Features</h2>
          <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', color: '#374151' }}>
            <li>Availability Search: Submit → Poll pattern with streaming results</li>
            <li>Booking Management: Create, modify, cancel, and check bookings</li>
            <li>Agreement Enforcement: All operations require valid agreement references</li>
            <li>Idempotency: Booking creation supports idempotency keys</li>
            <li>Context Support: Full context.Context support for cancellation and timeouts</li>
            <li>Channel-based Streaming: Uses Go channels for availability polling</li>
          </ul>
        </section>

        <section>
          <h2>Requirements</h2>
          <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', color: '#374151' }}>
            <li>Go 1.18+</li>
            <li>Standard library: net/http, encoding/json, context</li>
            <li>For gRPC: google.golang.org/grpc and generated proto stubs</li>
          </ul>
        </section>

        <section>
          <h2>Documentation Links</h2>
          <div style={{ marginTop: '1rem' }}>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ marginBottom: '0.75rem' }}>
                <a href="../../sdk/go-agent/README.md" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
                  📖 Full README
                </a>
              </li>
            </ul>
          </div>
        </section>
        </section>
      )}

      {/* PHP SDK Section */}
      {activeSdk === 'php' && (
      <section>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>PHP SDK</h1>
        <p style={{ fontSize: '1rem', color: '#6b7280', marginBottom: '2rem' }}>
          Production-ready PHP SDK for server-side integration with generator-based streaming and full API coverage.
        </p>

        <section>
          <h2>Installation</h2>
          <div style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.25rem', padding: '1rem', marginTop: '1rem' }}>
            <pre style={{ margin: 0, fontSize: '0.875rem', fontFamily: 'Monaco, Menlo, monospace' }}>{`cd sdks/php-agent
composer install`}</pre>
          </div>
        </section>

        <section>
          <h2>Quick Start (REST)</h2>
          <div style={{ backgroundColor: '#1f2937', color: '#f9fafb', padding: '1.5rem', borderRadius: '0.25rem', marginTop: '1rem' }}>
            <pre style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5', fontFamily: 'Monaco, Menlo, monospace', whiteSpace: 'pre-wrap' }}>{`use HMS\\CarHire\\Config;
use HMS\\CarHire\\CarHireClient;
use HMS\\CarHire\\DTO\\AvailabilityCriteria;
use HMS\\CarHire\\DTO\\BookingCreate;

$config = Config::forRest([
  'baseUrl' => 'https://your-gateway.example.com/v1',
  'token'   => 'Bearer <JWT>',
  'apiKey'  => '<YOUR_API_KEY>', // Optional
  'agentId' => 'ag_123',
  'callTimeoutMs' => 12000,
  'availabilitySlaMs' => 120000,
  'longPollWaitMs' => 10000
]);

$client = new CarHireClient($config);

$criteria = AvailabilityCriteria::make(
  pickupLocode: 'PKKHI',
  returnLocode: 'PKLHE',
  pickupAt: new DateTimeImmutable('2025-11-03T10:00:00Z'),
  returnAt: new DateTimeImmutable('2025-11-05T10:00:00Z'),
  driverAge: 28,
  currency: 'USD',
  agreementRefs: ['AGR-001']
);

foreach ($client->availability()->search($criteria) as $chunk) {
  echo "[{$chunk->status}] items=" . count($chunk->items) . 
       " cursor=" . ($chunk->cursor ?? 0) . PHP_EOL;
}

$booking = BookingCreate::fromOffer([
  'agreement_ref' => 'AGR-001',
  'supplier_id'   => 'SRC-AVIS',
  'offer_id'      => 'off_123',
  'driver'        => [
    'firstName' => 'Ali',
    'lastName' => 'Raza',
    'email' => 'ali@example.com',
    'phone' => '+92...',
    'age' => 28
  ]
]);

$res = $client->booking()->create($booking, 'idem-123');
echo $res['supplierBookingRef'] ?? '';`}</pre>
          </div>
        </section>

        <section>
          <h2>Configuration</h2>
          <div style={{ backgroundColor: '#1f2937', color: '#f9fafb', padding: '1.5rem', borderRadius: '0.25rem', marginTop: '1rem' }}>
            <pre style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5', fontFamily: 'Monaco, Menlo, monospace', whiteSpace: 'pre-wrap' }}>{`// REST Configuration
$config = Config::forRest([
  'baseUrl' => 'https://api.example.com/v1', // Required
  'token' => 'Bearer <JWT>', // Required
  'apiKey' => '<API_KEY>', // Optional
  'agentId' => 'ag_123', // Optional
  'callTimeoutMs' => 10000, // Default: 10000
  'availabilitySlaMs' => 120000, // Default: 120000
  'longPollWaitMs' => 10000, // Default: 10000
]);

// gRPC Configuration
$grpcConfig = Config::forGrpc([
  'host' => 'api.example.com:50051', // Required
  'caCert' => '<CA_CERT>', // Required
  'clientCert' => '<CLIENT_CERT>', // Required
  'clientKey' => '<CLIENT_KEY>', // Required
  'agentId' => 'ag_123', // Optional
]);`}</pre>
          </div>
        </section>

        <section>
          <h2>Availability Streaming</h2>
          <p>The SDK uses generators for streaming availability results:</p>
          <div style={{ backgroundColor: '#1f2937', color: '#f9fafb', padding: '1.5rem', borderRadius: '0.25rem', marginTop: '1rem' }}>
            <pre style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5', fontFamily: 'Monaco, Menlo, monospace', whiteSpace: 'pre-wrap' }}>{`// The search() method returns a Generator
foreach ($client->availability()->search($criteria) as $chunk) {
  // Process each chunk as it arrives
  echo "Status: {$chunk->status}, Items: " . count($chunk->items) . PHP_EOL;
  
  // Break when complete
  if ($chunk->status === 'COMPLETE') {
    break;
  }
}`}</pre>
          </div>
        </section>

        <section>
          <h2>Error Handling</h2>
          <div style={{ backgroundColor: '#1f2937', color: '#f9fafb', padding: '1.5rem', borderRadius: '0.25rem', marginTop: '1rem' }}>
            <pre style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5', fontFamily: 'Monaco, Menlo, monospace', whiteSpace: 'pre-wrap' }}>{`use HMS\\CarHire\\Exceptions\\TransportException;

try {
  $result = $client->booking()->create($booking, 'idem-123');
} catch (TransportException $e) {
  echo "Transport error: " . $e->getMessage() . PHP_EOL;
  throw $e;
}`}</pre>
          </div>
        </section>

        <section>
          <h2>REST Endpoints</h2>
          <p>The SDK uses the following REST endpoints:</p>
            <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', color: '#374151' }}>
              <li><code>POST /availability/submit</code> - Submit availability request</li>
              <li><code>GET /availability/poll?request_id&since_seq&wait_ms</code> - Poll availability results</li>
              <li><code>POST /bookings</code> - Create booking (with Idempotency-Key header)</li>
              <li><code>{'PATCH /bookings/{supplierBookingRef}?agreement_ref'}</code> - Modify booking</li>
              <li><code>{'POST /bookings/{supplierBookingRef}/cancel?agreement_ref'}</code> - Cancel booking</li>
              <li><code>{'GET /bookings/{supplierBookingRef}?agreement_ref'}</code> - Check booking status</li>
            </ul>
        </section>

        <section>
          <h2>Documentation Links</h2>
          <div style={{ marginTop: '1rem' }}>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ marginBottom: '0.75rem' }}>
                <a href="../../sdk/php-agent/README.md" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
                  📖 Full README
                </a>
              </li>
            </ul>
          </div>
        </section>
        </section>
      )}

      {/* Python SDK Section */}
      {activeSdk === 'python' && (
      <section>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>Python SDK</h1>
        <p style={{ fontSize: '1rem', color: '#6b7280', marginBottom: '2rem' }}>
          Production-ready Python SDK for data science and automation with async iterator support and full type hints.
        </p>

        <section>
          <h2>Installation</h2>
          <div style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.25rem', padding: '1rem', marginTop: '1rem' }}>
            <pre style={{ margin: 0, fontSize: '0.875rem', fontFamily: 'Monaco, Menlo, monospace' }}>{`pip install carhire-python-sdk
# or
pip install -e .`}</pre>
          </div>
        </section>

        <section>
          <h2>Quick Start (REST)</h2>
          <div style={{ backgroundColor: '#1f2937', color: '#f9fafb', padding: '1.5rem', borderRadius: '0.25rem', marginTop: '1rem' }}>
            <pre style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5', fontFamily: 'Monaco, Menlo, monospace', whiteSpace: 'pre-wrap' }}>{`from datetime import datetime
from carhire import CarHireClient, Config, AvailabilityCriteria, BookingCreate

config = Config.for_rest({
    "baseUrl": "https://your-gateway.example.com",
    "token": "Bearer <JWT>",
    "apiKey": "<YOUR_API_KEY>",  # Optional
    "agentId": "ag_123",
    "callTimeoutMs": 12000,
    "availabilitySlaMs": 120000,
    "longPollWaitMs": 10000,
})

client = CarHireClient(config)

# Search availability
criteria = AvailabilityCriteria.make(
    pickup_locode="PKKHI",
    return_locode="PKLHE",
    pickup_at=datetime.fromisoformat("2025-11-03T10:00:00Z"),
    return_at=datetime.fromisoformat("2025-11-05T10:00:00Z"),
    driver_age=28,
    currency="USD",
    agreement_refs=["AGR-001"],
)

async for chunk in client.get_availability().search(criteria):
    print(f"[{chunk.status}] items={len(chunk.items)} cursor={chunk.cursor or 0}")
    if chunk.status == "COMPLETE":
        break

# Create booking
booking = BookingCreate.from_offer({
    "agreement_ref": "AGR-001",
    "supplier_id": "SRC-AVIS",
    "offer_id": "off_123",
    "driver": {
        "firstName": "Ali",
        "lastName": "Raza",
        "email": "ali@example.com",
        "phone": "+92...",
        "age": 28,
    },
})

result = await client.get_booking().create(booking, "idem-123")
print(result["supplierBookingRef"])`}</pre>
          </div>
        </section>

        <section>
          <h2>Configuration</h2>
          <div style={{ backgroundColor: '#1f2937', color: '#f9fafb', padding: '1.5rem', borderRadius: '0.25rem', marginTop: '1rem' }}>
            <pre style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5', fontFamily: 'Monaco, Menlo, monospace', whiteSpace: 'pre-wrap' }}>{`# REST Configuration
config = Config.for_rest({
    "baseUrl": "https://api.example.com",  # Required
    "token": "Bearer <JWT>",  # Required
    "apiKey": "<API_KEY>",  # Optional
    "agentId": "ag_123",  # Optional
    "callTimeoutMs": 10000,  # Default: 10000
    "availabilitySlaMs": 120000,  # Default: 120000
    "longPollWaitMs": 10000,  # Default: 10000
})

# gRPC Configuration
config = Config.for_grpc({
    "host": "api.example.com:50051",  # Required
    "caCert": "<CA_CERT>",  # Required
    "clientCert": "<CLIENT_CERT>",  # Required
    "clientKey": "<CLIENT_KEY>",  # Required
    "agentId": "ag_123",  # Optional
})`}</pre>
          </div>
        </section>

        <section>
          <h2>Error Handling</h2>
          <div style={{ backgroundColor: '#1f2937', color: '#f9fafb', padding: '1.5rem', borderRadius: '0.25rem', marginTop: '1rem' }}>
            <pre style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5', fontFamily: 'Monaco, Menlo, monospace', whiteSpace: 'pre-wrap' }}>{`from carhire import TransportException

try:
    await client.get_booking().create(booking, "idem-123")
except TransportException as e:
    print(f"Status: {e.status_code}, Code: {e.code}")
    print(f"Message: {e.message}")
    raise`}</pre>
          </div>
        </section>

        <section>
          <h2>Features</h2>
          <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', color: '#374151' }}>
            <li>Availability Search: Submit → Poll pattern with streaming results</li>
            <li>Booking Management: Create, modify, cancel, and check bookings</li>
            <li>Agreement Enforcement: All operations require valid agreement references</li>
            <li>Idempotency: Booking creation supports idempotency keys</li>
            <li>Type Hints: Full type annotations included</li>
            <li>Async/Await: Native async iterator support</li>
          </ul>
        </section>

        <section>
          <h2>Requirements</h2>
          <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', color: '#374151' }}>
            <li>Python 3.8+</li>
            <li>requests {'>='} 2.31.0</li>
            <li>grpcio {'>='} 1.60.0 (for gRPC transport)</li>
          </ul>
        </section>

        <section>
          <h2>Documentation Links</h2>
          <div style={{ marginTop: '1rem' }}>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ marginBottom: '0.75rem' }}>
                <a href="../../sdk/python-agent/README.md" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
                  📖 Full README
                </a>
              </li>
            </ul>
          </div>
        </section>
        </section>
      )}

      {/* Java SDK Section */}
      {activeSdk === 'java' && (
      <section>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>Java SDK</h1>
        <p style={{ fontSize: '1rem', color: '#6b7280', marginBottom: '2rem' }}>
          Production-ready Java SDK with CompletableFuture support for asynchronous operations.
        </p>

        <section>
          <h2>Installation</h2>
          <div style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.25rem', padding: '1rem', marginTop: '1rem' }}>
            <pre style={{ margin: 0, fontSize: '0.875rem', fontFamily: 'Monaco, Menlo, monospace' }}>{`<dependency>
    <groupId>com.carhire</groupId>
    <artifactId>carhire-java-sdk</artifactId>
    <version>1.0.0</version>
</dependency>`}</pre>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>Or install locally: <code>mvn install</code></p>
        </section>

        <section>
          <h2>Quick Start (REST)</h2>
          <div style={{ backgroundColor: '#1f2937', color: '#f9fafb', padding: '1.5rem', borderRadius: '0.25rem', marginTop: '1rem' }}>
            <pre style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5', fontFamily: 'Monaco, Menlo, monospace', whiteSpace: 'pre-wrap' }}>{`import com.carhire.sdk.*;
import java.util.*;

Map<String, Object> configData = new HashMap<>();
configData.put("baseUrl", "https://your-gateway.example.com");
configData.put("token", "Bearer <JWT>");
configData.put("apiKey", "<YOUR_API_KEY>"); // Optional
configData.put("agentId", "ag_123");
configData.put("callTimeoutMs", 12000);
configData.put("availabilitySlaMs", 120000);
configData.put("longPollWaitMs", 10000);

Config config = Config.forRest(configData);
CarHireClient client = new CarHireClient(config);

// Search availability
Map<String, Object> criteria = new HashMap<>();
criteria.put("pickup_unlocode", "PKKHI");
criteria.put("dropoff_unlocode", "PKLHE");
criteria.put("pickup_iso", "2025-11-03T10:00:00Z");
criteria.put("dropoff_iso", "2025-11-05T10:00:00Z");
criteria.put("driver_age", 28);
criteria.put("currency", "USD");
criteria.put("agreement_refs", Arrays.asList("AGR-001"));

client.getAvailability().search(criteria).forEach(chunkFuture -> {
    Map<String, Object> chunk = chunkFuture.join();
    System.out.println("Status: " + chunk.get("status"));
    if ("COMPLETE".equals(chunk.get("status"))) {
        // Process complete
    }
});

// Create booking
Map<String, Object> booking = new HashMap<>();
booking.put("agreement_ref", "AGR-001");
booking.put("supplier_id", "SRC-AVIS");
booking.put("offer_id", "off_123");

Map<String, Object> result = client.getBooking().create(booking, "idem-123").join();
System.out.println(result.get("supplierBookingRef"));`}</pre>
          </div>
        </section>

        <section>
          <h2>Configuration</h2>
          <div style={{ backgroundColor: '#1f2937', color: '#f9fafb', padding: '1.5rem', borderRadius: '0.25rem', marginTop: '1rem' }}>
            <pre style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5', fontFamily: 'Monaco, Menlo, monospace', whiteSpace: 'pre-wrap' }}>{`// REST Configuration
Map<String, Object> configData = new HashMap<>();
configData.put("baseUrl", "https://api.example.com"); // Required
configData.put("token", "Bearer <JWT>"); // Required
configData.put("apiKey", "<API_KEY>"); // Optional
configData.put("agentId", "ag_123"); // Optional
configData.put("callTimeoutMs", 10000); // Default: 10000
configData.put("availabilitySlaMs", 120000); // Default: 120000
configData.put("longPollWaitMs", 10000); // Default: 10000

Config config = Config.forRest(configData);

// gRPC Configuration
Map<String, Object> grpcConfig = new HashMap<>();
grpcConfig.put("host", "api.example.com:50051"); // Required
grpcConfig.put("caCert", "<CA_CERT>"); // Required
grpcConfig.put("clientCert", "<CLIENT_CERT>"); // Required
grpcConfig.put("clientKey", "<CLIENT_KEY>"); // Required

Config grpcConfigObj = Config.forGrpc(grpcConfig);`}</pre>
          </div>
        </section>

        <section>
          <h2>Error Handling</h2>
          <div style={{ backgroundColor: '#1f2937', color: '#f9fafb', padding: '1.5rem', borderRadius: '0.25rem', marginTop: '1rem' }}>
            <pre style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5', fontFamily: 'Monaco, Menlo, monospace', whiteSpace: 'pre-wrap' }}>{`try {
    Map<String, Object> result = client.getBooking().create(booking, "idem-123").join();
} catch (TransportException e) {
    System.err.println("Status: " + e.getStatusCode() + ", Code: " + e.getCode());
    throw e;
}`}</pre>
          </div>
        </section>

        <section>
          <h2>Features</h2>
          <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', color: '#374151' }}>
            <li>Availability Search: Submit → Poll pattern with streaming results</li>
            <li>Booking Management: Create, modify, cancel, and check bookings</li>
            <li>Agreement Enforcement: All operations require valid agreement references</li>
            <li>Idempotency: Booking creation supports idempotency keys</li>
            <li>Async Support: Uses CompletableFuture for asynchronous operations</li>
            <li>Error Handling: Comprehensive error handling with TransportException</li>
          </ul>
        </section>

        <section>
          <h2>Requirements</h2>
          <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', color: '#374151' }}>
            <li>Java 11+</li>
            <li>Maven 3.6+</li>
          </ul>
        </section>

        <section>
          <h2>Documentation Links</h2>
          <div style={{ marginTop: '1rem' }}>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ marginBottom: '0.75rem' }}>
                <a href="../../sdk/java-agent/README.md" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
                  📖 Full README
                </a>
              </li>
            </ul>
          </div>
        </section>
        </section>
      )}

      {/* Perl SDK Section */}
      {activeSdk === 'perl' && (
      <section>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>Perl SDK</h1>
        <p style={{ fontSize: '1rem', color: '#6b7280', marginBottom: '2rem' }}>
          Production-ready Perl SDK for legacy systems with generator-based streaming.
        </p>

        <section>
          <h2>Installation</h2>
          <div style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.25rem', padding: '1rem', marginTop: '1rem' }}>
            <pre style={{ margin: 0, fontSize: '0.875rem', fontFamily: 'Monaco, Menlo, monospace' }}>{`cpanm CarHire::SDK`}</pre>
          </div>
        </section>

        <section>
          <h2>Quick Start (REST)</h2>
          <div style={{ backgroundColor: '#1f2937', color: '#f9fafb', padding: '1.5rem', borderRadius: '0.25rem', marginTop: '1rem' }}>
            <pre style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5', fontFamily: 'Monaco, Menlo, monospace', whiteSpace: 'pre-wrap' }}>{`use CarHire::SDK;

my $config = CarHire::SDK::Config->for_rest({
    baseUrl => 'https://your-gateway.example.com',
    token   => 'Bearer <JWT>',
    apiKey  => '<YOUR_API_KEY>',  # Optional
    agentId => 'ag_123',
    callTimeoutMs     => 12000,
    availabilitySlaMs => 120000,
    longPollWaitMs    => 10000,
});

my $client = CarHire::SDK::Client->new($config);

# Search availability
my $criteria = {
    pickup_unlocode  => 'PKKHI',
    dropoff_unlocode => 'PKLHE',
    pickup_iso       => '2025-11-03T10:00:00Z',
    dropoff_iso      => '2025-11-05T10:00:00Z',
    driver_age       => 28,
    currency         => 'USD',
    agreement_refs   => ['AGR-001'],
};

for my $chunk ($client->availability()->search($criteria)) {
    print "[$chunk->{status}] items=" . scalar(@{$chunk->{items}}) . 
          " cursor=" . ($chunk->{cursor} || 0) . "\\n";
    last if $chunk->{status} eq 'COMPLETE';
}

# Create booking
my $booking = {
    agreement_ref => 'AGR-001',
    supplier_id   => 'SRC-AVIS',
    offer_id      => 'off_123',
    driver        => {
        firstName => 'Ali',
        lastName  => 'Raza',
        email     => 'ali@example.com',
        phone     => '+92...',
        age       => 28,
    },
};

my $result = $client->booking()->create($booking, 'idem-123');
print $result->{supplierBookingRef}, "\\n";`}</pre>
          </div>
        </section>

        <section>
          <h2>Configuration</h2>
          <div style={{ backgroundColor: '#1f2937', color: '#f9fafb', padding: '1.5rem', borderRadius: '0.25rem', marginTop: '1rem' }}>
            <pre style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5', fontFamily: 'Monaco, Menlo, monospace', whiteSpace: 'pre-wrap' }}>{`# REST Configuration
my $config = CarHire::SDK::Config->for_rest({
    baseUrl => 'https://api.example.com',  # Required
    token   => 'Bearer <JWT>',              # Required
    apiKey  => '<API_KEY>',                 # Optional
    agentId => 'ag_123',                    # Optional
    callTimeoutMs     => 10000,             # Default: 10000
    availabilitySlaMs => 120000,            # Default: 120000
    longPollWaitMs    => 10000,             # Default: 10000
});

# gRPC Configuration
my $grpcConfig = CarHire::SDK::Config->for_grpc({
    host       => 'api.example.com:50051',  # Required
    caCert     => '<CA_CERT>',              # Required
    clientCert => '<CLIENT_CERT>',          # Required
    clientKey  => '<CLIENT_KEY>',           # Required
    agentId    => 'ag_123',                 # Optional
});`}</pre>
          </div>
        </section>

        <section>
          <h2>Error Handling</h2>
          <div style={{ backgroundColor: '#1f2937', color: '#f9fafb', padding: '1.5rem', borderRadius: '0.25rem', marginTop: '1rem' }}>
            <pre style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5', fontFamily: 'Monaco, Menlo, monospace', whiteSpace: 'pre-wrap' }}>{`eval {
    my $result = $client->booking()->create($booking, 'idem-123');
    print $result->{supplierBookingRef}, "\\n";
};
if ($@) {
    warn "Error: $@\\n";
    die;
}`}</pre>
          </div>
        </section>

        <section>
          <h2>Features</h2>
          <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', color: '#374151' }}>
            <li>Availability Search: Submit → Poll pattern with streaming results</li>
            <li>Booking Management: Create, modify, cancel, and check bookings</li>
            <li>Agreement Enforcement: All operations require valid agreement references</li>
            <li>Idempotency: Booking creation supports idempotency keys</li>
            <li>Generator-based Streaming: Uses Perl generators for availability polling</li>
          </ul>
        </section>

        <section>
          <h2>Requirements</h2>
          <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', color: '#374151' }}>
            <li>Perl 5.10+</li>
            <li>LWP::UserAgent</li>
            <li>JSON</li>
            <li>HTTP::Request</li>
            <li>HTTP::Response</li>
            <li>Time::HiRes</li>
          </ul>
        </section>

        <section>
          <h2>Documentation Links</h2>
          <div style={{ marginTop: '1rem' }}>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ marginBottom: '0.75rem' }}>
                <a href="../../sdk/perl-agent/README.md" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
                  📖 Full README
                </a>
              </li>
            </ul>
          </div>
        </section>
        </section>
      )}

      {/* Available Endpoints Section */}
      <section style={{ marginTop: '3rem', marginBottom: '2rem' }}>
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
    </div>
  );
};

export default SdkGuide;


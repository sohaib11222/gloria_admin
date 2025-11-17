import React from 'react';
import './docs.css';

const SdkGuide: React.FC<{ role?: 'agent' | 'source' | 'admin' }> = ({ role = 'admin' }) => {
  const prefaceText = {
    agent: 'Start here: login → approve agreement → availability → booking',
    source: 'Start here: login → offer agreement → locations → verification',
    admin: 'Start here: login → manage companies → agreements → health monitoring',
  };

  return (
    <div className="docs-main">
      <h1>SDK Guide</h1>
      <p>Get started with Car Hire SDKs for integrating with our API.</p>

      {role && (
        <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '0.5rem' }}>
          <p style={{ margin: 0, fontWeight: 600, color: '#1e40af' }}>{prefaceText[role]}</p>
        </div>
      )}

      <section>
        <h2>Available SDKs</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
          {/* JavaScript Card */}
          <div style={{ border: '2px solid #10b981', borderRadius: '0.5rem', padding: '1.5rem', backgroundColor: '#f0fdf4' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>📦</span>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>JavaScript</h3>
              <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', backgroundColor: '#10b981', color: 'white', borderRadius: '9999px', fontWeight: 600 }}>Available</span>
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
          <div style={{ border: '2px solid #10b981', borderRadius: '0.5rem', padding: '1.5rem', backgroundColor: '#f0fdf4' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>🐘</span>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>PHP</h3>
              <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', backgroundColor: '#10b981', color: 'white', borderRadius: '9999px', fontWeight: 600 }}>Available</span>
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
          <div style={{ border: '2px solid #10b981', borderRadius: '0.5rem', padding: '1.5rem', backgroundColor: '#f0fdf4' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>📘</span>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>TypeScript</h3>
              <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', backgroundColor: '#10b981', color: 'white', borderRadius: '9999px', fontWeight: 600 }}>Available</span>
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
          <div style={{ border: '2px solid #10b981', borderRadius: '0.5rem', padding: '1.5rem', backgroundColor: '#f0fdf4' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>🐹</span>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>Go</h3>
              <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', backgroundColor: '#10b981', color: 'white', borderRadius: '9999px', fontWeight: 600 }}>Available</span>
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
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '1.5rem', backgroundColor: '#f9fafb', opacity: 0.7 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>🐍</span>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>Python</h3>
              <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', backgroundColor: '#9ca3af', color: 'white', borderRadius: '9999px', fontWeight: 600 }}>Coming Soon</span>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              Python SDK for data science and automation.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2>TypeScript Quick Start</h2>
        <div style={{ backgroundColor: '#1f2937', color: '#f9fafb', padding: '1.5rem', borderRadius: '0.5rem', marginTop: '1rem' }}>
          <pre style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5', fontFamily: 'Monaco, Menlo, monospace', whiteSpace: 'pre-wrap' }}>{`import { CarHireClient } from '@carhire/sdk';

const client = new CarHireClient({
  baseUrl: 'https://api.carhire.example.com',
});

// Login
const { access, user } = await client.auth.login('user@example.com', 'password');
client.setToken(access);

// Submit availability
const { request_id } = await client.availability.submit({
  pickup_unlocode: 'GBMAN',
  dropoff_unlocode: 'GBGLA',
  pickup_iso: '2025-01-15T10:00:00Z',
  dropoff_iso: '2025-01-20T10:00:00Z',
  driver_age: 30,
  residency_country: 'GB',
  vehicle_classes: ['ECONOMY'],
  agreement_refs: ['AG-2025-001'],
});

// Stream results
for await (const offers of client.availability.stream({ 
  requestId: request_id 
})) {
  console.log('New offers:', offers);
}`}</pre>
        </div>
        <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
          <p>
            <strong>Full Documentation:</strong>{' '}
            <a href="../../sdk/typescript/README.md" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
              README
            </a>{' '}
            |{' '}
            <a href="../../sdk/typescript/REFERENCE.md" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
              API Reference
            </a>
          </p>
        </div>
      </section>

      <section>
        <h2>JavaScript Quick Start</h2>
        <div style={{ backgroundColor: '#1f2937', color: '#f9fafb', padding: '1.5rem', borderRadius: '0.5rem', marginTop: '1rem' }}>
          <pre style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5', fontFamily: 'Monaco, Menlo, monospace', whiteSpace: 'pre-wrap' }}>{`import { CarHireClient } from '@carhire/sdk';

const client = new CarHireClient({
  baseUrl: 'https://api.carhire.example.com',
});

// Login
const { access } = await client.auth.login('user@example.com', 'password');
client.setToken(access);

// Submit availability
const { request_id } = await client.availability.submit({
  pickup_unlocode: 'GBMAN',
  dropoff_unlocode: 'GBGLA',
  pickup_iso: '2025-01-15T10:00:00Z',
  dropoff_iso: '2025-01-20T10:00:00Z',
  driver_age: 30,
  residency_country: 'GB',
  vehicle_classes: ['ECONOMY'],
  agreement_refs: ['AG-2025-001'],
});

// Stream results
for await (const offers of client.availability.stream({ 
  requestId: request_id 
})) {
  console.log('New offers:', offers);
}`}</pre>
        </div>
      </section>

      <section>
        <h2>Installation</h2>
        <div style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '1rem', marginTop: '1rem' }}>
          <pre style={{ margin: 0, fontSize: '0.875rem', fontFamily: 'Monaco, Menlo, monospace' }}>{`npm install @carhire/sdk
# or
yarn add @carhire/sdk
# or
pnpm add @carhire/sdk`}</pre>
        </div>
      </section>

      <section>
        <h2>Documentation Links</h2>
        <div style={{ marginTop: '1rem' }}>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li style={{ marginBottom: '0.75rem' }}>
              <a href="../../sdk/javascript/README.md" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
                📖 Full README
              </a>
            </li>
            <li style={{ marginBottom: '0.75rem' }}>
              <a href="../../sdk/javascript/REFERENCE.md" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
                📚 API Reference
              </a>
            </li>
            <li style={{ marginBottom: '0.75rem' }}>
              <a href="../../sdk/javascript/examples/" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
                💡 Examples
              </a>
            </li>
          </ul>
        </div>
      </section>

      <section>
        <h2>Availability Long-polling</h2>
        <p>The SDK supports multiple patterns for polling availability results:</p>
        <div style={{ backgroundColor: '#1f2937', color: '#f9fafb', padding: '1.5rem', borderRadius: '0.5rem', marginTop: '1rem' }}>
          <pre style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5', fontFamily: 'Monaco, Menlo, monospace', whiteSpace: 'pre-wrap' }}>{`// Async Iterator (Recommended)
for await (const offers of client.availability.stream({
  requestId: request_id,
  waitMs: 10000,
  overallTimeoutMs: 120000,
})) {
  console.log(\`Received \${offers.length} new offer(s)\`);
}

// Promise-based
const final = await client.availability.untilComplete({
  requestId: request_id,
  waitMs: 10000,
  overallTimeoutMs: 120000,
});`}</pre>
        </div>
      </section>

      <section>
        <h2>Error Handling</h2>
        <p>All errors are thrown as <code>SDKError</code> with structured information:</p>
        <div style={{ backgroundColor: '#1f2937', color: '#f9fafb', padding: '1.5rem', borderRadius: '0.5rem', marginTop: '1rem' }}>
          <pre style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5', fontFamily: 'Monaco, Menlo, monospace', whiteSpace: 'pre-wrap' }}>{`import { SDKError } from '@carhire/sdk';

try {
  await client.agreements.list();
} catch (error) {
  if (error instanceof SDKError) {
    console.error('Status:', error.status);
    console.error('Code:', error.code);
    console.error('Message:', error.message);
    console.error('Details:', error.details);
  }
}`}</pre>
        </div>
      </section>

      {/* Go SDK Section */}
      <section style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '2px solid #e5e7eb' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '1rem' }}>Go SDK</h1>
        <p style={{ fontSize: '1rem', color: '#6b7280', marginBottom: '2rem' }}>
          Production-ready Go SDK for high-performance integrations with full type safety and channel-based streaming.
        </p>

        <section>
          <h2>Go Quick Start</h2>
          <div style={{ backgroundColor: '#1f2937', color: '#f9fafb', padding: '1.5rem', borderRadius: '0.5rem', marginTop: '1rem' }}>
            <pre style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5', fontFamily: 'Monaco, Menlo, monospace', whiteSpace: 'pre-wrap' }}>{`package main

import (
    "context"
    "fmt"
    "time"
    
    "carhire/middleware-go/carhire"
)

func main() {
    cfg := carhire.DefaultConfig()
    cfg.BaseURL = "https://api.carhire.example.com"
    
    client := carhire.NewClient(cfg)
    ctx := context.Background()
    
    // Login
    loginResp, err := client.Auth.Login(ctx, "user@example.com", "password")
    if err != nil {
        panic(err)
    }
    client.SetToken(loginResp.Access)
    
    // Submit availability
    submitReq := carhire.AvailabilitySubmit{
        PickupUnlocode:   "GBMAN",
        DropoffUnlocode:  "GBGLA",
        PickupISO:        time.Now().Add(7 * 24 * time.Hour).Format(time.RFC3339),
        DropoffISO:       time.Now().Add(14 * 24 * time.Hour).Format(time.RFC3339),
        DriverAge:        30,
        ResidencyCountry: "GB",
        VehicleClasses:   []string{"ECONOMY"},
        AgreementRefs:    []string{"AG-2025-001"},
    }
    
    submitResp, err := client.Availability.Submit(ctx, submitReq)
    if err != nil {
        panic(err)
    }
    
    // Stream results
    opts := &carhire.PollOptions{
        Wait:           10 * time.Second,
        OverallTimeout: 120 * time.Second,
    }
    
    offersChan, errChan := client.Availability.Stream(ctx, submitResp.RequestID, opts)
    for offers := range offersChan {
        fmt.Printf("Received %d offer(s)\\n", len(offers))
    }
    if err := <-errChan; err != nil {
        fmt.Printf("Error: %v\\n", err)
    }
}`}</pre>
          </div>
        </section>

        <section>
          <h2>Installation</h2>
          <div style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '1rem', marginTop: '1rem' }}>
            <pre style={{ margin: 0, fontSize: '0.875rem', fontFamily: 'Monaco, Menlo, monospace' }}>{`go get carhire/middleware-go`}</pre>
          </div>
        </section>

        <section>
          <h2>Documentation Links</h2>
          <div style={{ marginTop: '1rem' }}>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ marginBottom: '0.75rem' }}>
                <a href="../../sdk/golang/README.md" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
                  📖 Full README
                </a>
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <a href="../../sdk/golang/REFERENCE.md" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
                  📚 API Reference
                </a>
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <a href="../../sdk/golang/examples/" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
                  💡 Examples
                </a>
              </li>
            </ul>
          </div>
        </section>

        <section>
          <h2>Availability Long-polling</h2>
          <p>The SDK supports channel-based streaming for real-time availability updates:</p>
          <div style={{ backgroundColor: '#1f2937', color: '#f9fafb', padding: '1.5rem', borderRadius: '0.5rem', marginTop: '1rem' }}>
            <pre style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5', fontFamily: 'Monaco, Menlo, monospace', whiteSpace: 'pre-wrap' }}>{`// Channel-based streaming (Recommended)
opts := &carhire.PollOptions{
    Wait:           10 * time.Second,
    OverallTimeout: 120 * time.Second,
}

offersChan, errChan := client.Availability.Stream(ctx, requestID, opts)
for offers := range offersChan {
    fmt.Printf("Received %d offer(s)\\n", len(offers))
}
if err := <-errChan; err != nil {
    fmt.Printf("Error: %v\\n", err)
}

// Promise-based completion
final, err := client.Availability.UntilComplete(ctx, requestID, opts)
if err != nil {
    panic(err)
}
fmt.Printf("Final status: %s\\n", final.Status)`}</pre>
          </div>
        </section>

        <section>
          <h2>Booking Pass-through</h2>
          <p>Create, modify, cancel, and check bookings with full context support:</p>
          <div style={{ backgroundColor: '#1f2937', color: '#f9fafb', padding: '1.5rem', borderRadius: '0.5rem', marginTop: '1rem' }}>
            <pre style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5', fontFamily: 'Monaco, Menlo, monospace', whiteSpace: 'pre-wrap' }}>{`// Create booking with idempotency
createReq := carhire.BookingCreateRequest{
    SupplierBookingRef: "BOOK-123",
    AgreementRef:        "AG-2025-001",
    PickupUnlocode:      "GBMAN",
    DropoffUnlocode:     "GBGLA",
    PickupISO:           time.Now().Add(7 * 24 * time.Hour).Format(time.RFC3339),
    DropoffISO:          time.Now().Add(14 * 24 * time.Hour).Format(time.RFC3339),
    DriverAge:           30,
    ResidencyCountry:    "GB",
    VehicleClass:        "ECONOMY",
}

booking, err := client.Bookings.Create(ctx, createReq, "")
if err != nil {
    panic(err)
}

// Check booking status
status, err := client.Bookings.Check(ctx, "BOOK-123")
if err != nil {
    panic(err)
}

// Cancel booking
cancelReq := carhire.BookingCancelRequest{
    SupplierBookingRef: "BOOK-123",
    AgreementRef:       "AG-2025-001",
}
cancelResp, err := client.Bookings.Cancel(ctx, cancelReq)
if err != nil {
    panic(err)
}`}</pre>
          </div>
        </section>

        <section>
          <h2>Error Handling</h2>
          <p>All errors are returned as <code>SDKError</code> with structured information:</p>
          <div style={{ backgroundColor: '#1f2937', color: '#f9fafb', padding: '1.5rem', borderRadius: '0.5rem', marginTop: '1rem' }}>
            <pre style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5', fontFamily: 'Monaco, Menlo, monospace', whiteSpace: 'pre-wrap' }}>{`import (
    "errors"
    "carhire/middleware-go/carhire"
)

agreements, err := client.Agreements.List(ctx, nil)
if err != nil {
    var sdkErr *carhire.SDKError
    if errors.As(err, &sdkErr) {
        fmt.Printf("Status: %d\\n", sdkErr.Status)
        fmt.Printf("Code: %s\\n", sdkErr.Code)
        fmt.Printf("Message: %s\\n", sdkErr.Message)
        fmt.Printf("Details: %v\\n", sdkErr.Details)
    } else {
        fmt.Printf("Network error: %v\\n", err)
    }
}`}</pre>
          </div>
        </section>

        <section>
          <h2>Retries Configuration</h2>
          <p>Enable automatic retries with exponential backoff for transient failures:</p>
          <div style={{ backgroundColor: '#1f2937', color: '#f9fafb', padding: '1.5rem', borderRadius: '0.5rem', marginTop: '1rem' }}>
            <pre style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5', fontFamily: 'Monaco, Menlo, monospace', whiteSpace: 'pre-wrap' }}>{`cfg := carhire.DefaultConfig()
cfg.BaseURL = "https://api.carhire.example.com"

// Enable retries globally
cfg.Retry = carhire.RetryConfig{
    Enabled:    true,
    MaxRetries: 3,
    Base:       300 * time.Millisecond,
    Factor:     2.0,
}

client := carhire.NewClient(cfg)

// Retries automatically apply to:
// - 5xx server errors
// - 429 (Too Many Requests)
// - Network timeouts
// - Idempotent operations (GET, HEAD, OPTIONS, PUT, DELETE)`}</pre>
          </div>
        </section>
      </section>

      {/* PHP SDK Section */}
      <section style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '2px solid #e5e7eb' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '1rem' }}>PHP SDK</h1>
        <p style={{ fontSize: '1rem', color: '#6b7280', marginBottom: '2rem' }}>
          Production-ready PHP SDK for server-side integration with generator-based streaming and full API coverage.
        </p>

        <section>
          <h2>PHP Quick Start</h2>
          <div style={{ backgroundColor: '#1f2937', color: '#f9fafb', padding: '1.5rem', borderRadius: '0.5rem', marginTop: '1rem' }}>
            <pre style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5', fontFamily: 'Monaco, Menlo, monospace', whiteSpace: 'pre-wrap' }}>{`<?php

require_once 'vendor/autoload.php';

use CarHire\\Client;

$client = new Client([
    'baseUrl' => 'https://api.carhire.example.com',
]);

// Login
$loginResponse = $client->auth->login('user@example.com', 'password');

// Submit availability
$submitResponse = $client->availability->submit([
    'pickup_unlocode' => 'GBMAN',
    'dropoff_unlocode' => 'GBGLA',
    'pickup_iso' => date('Y-m-d\\TH:i:s\\Z', time() + 7 * 24 * 3600),
    'dropoff_iso' => date('Y-m-d\\TH:i:s\\Z', time() + 14 * 24 * 3600),
    'driver_age' => 30,
    'residency_country' => 'GB',
    'vehicle_classes' => ['ECONOMY'],
    'agreement_refs' => ['AG-2025-001'],
]);

// Stream results
foreach ($client->availability->stream($submitResponse['request_id']) as $offers) {
    echo "Received " . count($offers) . " offer(s)\\n";
}`}</pre>
          </div>
        </section>

        <section>
          <h2>Installation</h2>
          <div style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '1rem', marginTop: '1rem' }}>
            <pre style={{ margin: 0, fontSize: '0.875rem', fontFamily: 'Monaco, Menlo, monospace' }}>{`composer require carhire/middleware-php`}</pre>
          </div>
        </section>

        <section>
          <h2>Documentation Links</h2>
          <div style={{ marginTop: '1rem' }}>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ marginBottom: '0.75rem' }}>
                <a href="../../sdk/php/README.md" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
                  📖 Full README
                </a>
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <a href="../../sdk/php/REFERENCE.md" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
                  📚 API Reference
                </a>
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <a href="../../sdk/php/examples/" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
                  💡 Examples
                </a>
              </li>
            </ul>
          </div>
        </section>

        <section>
          <h2>Availability Long-polling</h2>
          <p>The SDK supports generator-based streaming for real-time availability updates:</p>
          <div style={{ backgroundColor: '#1f2937', color: '#f9fafb', padding: '1.5rem', borderRadius: '0.5rem', marginTop: '1rem' }}>
            <pre style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5', fontFamily: 'Monaco, Menlo, monospace', whiteSpace: 'pre-wrap' }}>{`// Generator-based streaming (Recommended)
foreach ($client->availability->stream($requestId) as $offers) {
    echo "Received " . count($offers) . " offer(s)\\n";
}

// Blocking until complete
$final = $client->availability->untilComplete($requestId);
echo "Final status: {$final['status']}\\n";

// Custom options
$options = [
    'waitMs' => 15000,
    'overallTimeout' => 180000,
];
foreach ($client->availability->stream($requestId, $options) as $offers) {
    // Process offers...
}`}</pre>
          </div>
        </section>

        <section>
          <h2>Booking Pass-through</h2>
          <p>Create, modify, cancel, and check bookings with automatic idempotency:</p>
          <div style={{ backgroundColor: '#1f2937', color: '#f9fafb', padding: '1.5rem', borderRadius: '0.5rem', marginTop: '1rem' }}>
            <pre style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5', fontFamily: 'Monaco, Menlo, monospace', whiteSpace: 'pre-wrap' }}>{`// Create booking (idempotency key auto-generated)
$booking = $client->bookings->create([
    'agreement_ref' => 'AG-2025-001',
    'agent_booking_ref' => 'BOOK-123',
], 'custom-idempotency-key'); // Optional custom key

// Check booking status
$status = $client->bookings->check(
    'supplier-booking-ref',
    'AG-2025-001'
);

// Cancel booking
$cancelled = $client->bookings->cancel(
    'supplier-booking-ref',
    'AG-2025-001'
);`}</pre>
          </div>
        </section>

        <section>
          <h2>Error Handling</h2>
          <p>All errors are thrown as <code>CarHireException</code> with structured information:</p>
          <div style={{ backgroundColor: '#1f2937', color: '#f9fafb', padding: '1.5rem', borderRadius: '0.5rem', marginTop: '1rem' }}>
            <pre style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5', fontFamily: 'Monaco, Menlo, monospace', whiteSpace: 'pre-wrap' }}>{`use CarHire\\CarHireException;

try {
    $agreements = $client->agreements->list();
} catch (CarHireException $e) {
    echo "Status: {$e->status}\\n";
    echo "Code: {$e->sdkCode}\\n";
    echo "Message: {$e->getMessage()}\\n";
    echo "Details: " . json_encode($e->details, JSON_PRETTY_PRINT) . "\\n";
}`}</pre>
          </div>
        </section>

        <section>
          <h2>Retries Configuration</h2>
          <p>Enable automatic retries with exponential backoff for transient failures:</p>
          <div style={{ backgroundColor: '#1f2937', color: '#f9fafb', padding: '1.5rem', borderRadius: '0.5rem', marginTop: '1rem' }}>
            <pre style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5', fontFamily: 'Monaco, Menlo, monospace', whiteSpace: 'pre-wrap' }}>{`use CarHire\\Client;
use CarHire\\Retry;

$client = new Client([
    'baseUrl' => 'https://api.carhire.example.com',
    'retry' => new Retry(
        enabled: true,
        maxRetries: 3,
        baseMs: 300,
        factor: 2.0
    ),
]);

// Retries automatically apply to:
// - 5xx server errors
// - 429 (Too Many Requests)
// - Network timeouts (status 0)`}</pre>
          </div>
        </section>
      </section>
    </div>
  );
};

export default SdkGuide;


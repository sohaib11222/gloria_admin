import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import http from '../../lib/http';
import './docs.css';
import { SdkDownloadButton } from './SdkDownloadButton';

type SdkType = 'javascript' | 'typescript' | 'go' | 'php' | 'python' | 'java' | 'perl';
type SectionType = 'quick-start' | 'installation' | 'companies' | 'agreements' | 'health' | 'branches' | 'logs' | 'error-handling' | 'configuration' | 'testing' | 'troubleshooting' | 'best-practices' | 'api-reference' | 'api-endpoints';

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
    { id: 'companies', label: 'Companies' },
    { id: 'agreements', label: 'Agreements' },
    { id: 'health', label: 'Health Monitoring' },
    { id: 'branches', label: 'Branches' },
    { id: 'logs', label: 'Logs' },
    { id: 'error-handling', label: 'Error Handling' },
    { id: 'configuration', label: 'Configuration' },
    { id: 'testing', label: 'Testing' },
    { id: 'troubleshooting', label: 'Troubleshooting' },
    { id: 'best-practices', label: 'Best Practices' },
    { id: 'api-reference', label: 'API Reference' },
    { id: 'api-endpoints', label: 'API Endpoints' },
  ];

  const sdks: { id: SdkType; name: string; icon: string; downloadType: 'nodejs' | 'python' | 'php' | 'java' | 'go' | 'perl' }[] = [
    { id: 'typescript', name: 'TypeScript', icon: '📘', downloadType: 'nodejs' },
    { id: 'javascript', name: 'JavaScript', icon: '📦', downloadType: 'nodejs' },
    { id: 'go', name: 'Go', icon: '🐹', downloadType: 'go' },
    { id: 'php', name: 'PHP', icon: '🐘', downloadType: 'php' },
    { id: 'python', name: 'Python', icon: '🐍', downloadType: 'python' },
    { id: 'java', name: 'Java', icon: '☕', downloadType: 'java' },
    { id: 'perl', name: 'Perl', icon: '🐪', downloadType: 'perl' },
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
      const installationCode: Record<SdkType, string> = {
        typescript: `npm install axios
# or
yarn add axios
# or
pnpm add axios

# TypeScript types are included with axios`,
        javascript: `npm install axios
# or in browser: <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>`,
        go: `# Go standard library includes net/http and encoding/json
# No additional packages needed for basic REST API calls`,
        php: `composer require guzzlehttp/guzzle

# Add to composer.json:
# "require": {
#     "guzzlehttp/guzzle": "^7.0"
# }`,
        python: `pip install requests

# For async support (optional):
# pip install httpx`,
        java: `// Java 11+ includes HttpClient in java.net.http
// Add Gson for JSON parsing:
// Maven:
<dependency>
    <groupId>com.google.code.gson</groupId>
    <artifactId>gson</artifactId>
    <version>2.15.0</version>
</dependency>

// Gradle:
implementation 'com.google.code.gson:gson:2.15.0'`,
        perl: `cpanm LWP::UserAgent JSON URI::Encode

# or add to cpanfile:
# requires 'LWP::UserAgent';
# requires 'JSON';
# requires 'URI::Encode';`,
      };
      return (
        <section>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>Installation</h2>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
            Install the required HTTP client library for {sdks.find(s => s.id === activeSdk)?.name} to interact with the Gloria Connect Admin API.
          </p>
          <div style={{ backgroundColor: '#1f2937', color: '#f9fafb', padding: '1.5rem', borderRadius: '0.25rem', marginTop: '1rem' }}>
            <pre style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5', fontFamily: 'Monaco, Menlo, monospace', whiteSpace: 'pre-wrap' }}>
              {installationCode[activeSdk]}
            </pre>
          </div>
          <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '0.5rem' }}>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#334155' }}>
              <strong>Note:</strong> The Admin API uses standard REST endpoints. No SDK package is required - you can use any HTTP client library in your preferred language.
            </p>
          </div>
        </section>
      );
    }
    
    // Companies Management Section
    if (sectionId === 'companies') {
      const companiesCode: Record<SdkType, string> = {
        typescript: `import axios from 'axios';

const API_BASE = 'http://localhost:8080';
const token = 'your-admin-token';

// List companies with filters
const companiesRes = await axios.get(\`\${API_BASE}/admin/companies\`, {
  params: {
    type: 'AGENT',      // 'AGENT' | 'SOURCE'
    status: 'ACTIVE',  // 'ACTIVE' | 'PENDING_VERIFICATION' | 'SUSPENDED'
    limit: 50,
    offset: 0
  },
  headers: { Authorization: \`Bearer \${token}\` }
});
console.log('Companies:', companiesRes.data.items);

// Get company details
const companyRes = await axios.get(
  \`\${API_BASE}/admin/companies/\${companyId}\`,
  { headers: { Authorization: \`Bearer \${token}\` } }
);
console.log('Company:', companyRes.data);

// Create new company
const newCompanyRes = await axios.post(
  \`\${API_BASE}/admin/companies\`,
  {
    companyName: 'New Agent Company',
    email: 'agent@example.com',
    type: 'AGENT',
    password: 'securePassword123',
    adapterType: 'grpc',           // 'grpc' | 'rest'
    grpcEndpoint: 'localhost:51062', // Required if adapterType is 'grpc'
    httpEndpoint: 'https://...'     // Optional
  },
  { headers: { Authorization: \`Bearer \${token}\` } }
);
console.log('Created:', newCompanyRes.data);

// Update company
await axios.patch(
  \`\${API_BASE}/admin/companies/\${companyId}\`,
  {
    companyName: 'Updated Company Name',
    status: 'SUSPENDED',
    adapterType: 'rest'
  },
  { headers: { Authorization: \`Bearer \${token}\` } }
);

// Delete company (if supported)
await axios.delete(
  \`\${API_BASE}/admin/companies/\${companyId}\`,
  { headers: { Authorization: \`Bearer \${token}\` } }
);`,
        javascript: `const axios = require('axios');

const API_BASE = 'http://localhost:8080';
let token = 'your-admin-token';

// List companies
async function listCompanies(type, status) {
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

// Update company
async function updateCompany(companyId, updates) {
  const res = await axios.patch(
    \`\${API_BASE}/admin/companies/\${companyId}\`,
    updates,
    { headers: { Authorization: \`Bearer \${token}\` } }
  );
  return res.data;
}

// Example usage
const companies = await listCompanies('AGENT', 'ACTIVE');
console.log('Active agents:', companies);`,
        go: `package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "net/url"
)

const API_BASE = "http://localhost:8080"

func listCompanies(token, companyType, status string) ([]byte, error) {
    params := url.Values{}
    params.Add("type", companyType)
    params.Add("status", status)
    
    req, _ := http.NewRequest("GET", API_BASE+"/admin/companies?"+params.Encode(), nil)
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
    token := "your-admin-token"
    
    companies, _ := listCompanies(token, "AGENT", "ACTIVE")
    fmt.Println("Companies:", string(companies))
    
    companyData := map[string]interface{}{
        "companyName": "New Company",
        "email":       "new@example.com",
        "type":        "AGENT",
        "password":    "secure123",
    }
    result, _ := createCompany(token, companyData)
    fmt.Println("Created:", string(result))
}`,
        php: `<?php

require 'vendor/autoload.php';

use GuzzleHttp\\Client;

$API_BASE = 'http://localhost:8080';
$token = 'your-admin-token';

$client = new Client(['base_uri' => $API_BASE]);

// List companies
$companiesRes = $client->get('/admin/companies', [
    'query' => ['type' => 'AGENT', 'status' => 'ACTIVE'],
    'headers' => ['Authorization' => "Bearer $token"]
]);
$companies = json_decode($companiesRes->getBody(), true);
echo "Companies: " . json_encode($companies['items']) . PHP_EOL;

// Get company details
$companyRes = $client->get("/admin/companies/{$companyId}", [
    'headers' => ['Authorization' => "Bearer $token"]
]);
$company = json_decode($companyRes->getBody(), true);

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

// Update company
$updateRes = $client->patch("/admin/companies/{$companyId}", [
    'json' => [
        'companyName' => 'Updated Name',
        'status' => 'SUSPENDED'
    ],
    'headers' => ['Authorization' => "Bearer $token"]
]);

?>`,
        python: `import requests

API_BASE = 'http://localhost:8080'
token = 'your-admin-token'
headers = {'Authorization': f'Bearer {token}'}

# List companies
companies_res = requests.get(
    f'{API_BASE}/admin/companies',
    params={'type': 'AGENT', 'status': 'ACTIVE'},
    headers=headers
)
companies = companies_res.json()['items']
print('Companies:', companies)

# Get company details
company_res = requests.get(
    f'{API_BASE}/admin/companies/{company_id}',
    headers=headers
)
company = company_res.json()

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
new_company = new_company_res.json()

# Update company
update_res = requests.patch(
    f'{API_BASE}/admin/companies/{company_id}',
    json={'companyName': 'Updated Name', 'status': 'SUSPENDED'},
    headers=headers
)`,
        java: `import java.net.http.*;
import java.net.URI;
import com.google.gson.Gson;
import java.util.*;

public class CompaniesClient {
    private static final String API_BASE = "http://localhost:8080";
    private static final Gson gson = new Gson();
    private String token = "your-admin-token";
    
    public String listCompanies(String type, String status) throws Exception {
        String url = API_BASE + "/admin/companies?type=" + type + "&status=" + status;
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(url))
            .header("Authorization", "Bearer " + token)
            .GET()
            .build();
        
        HttpResponse<String> response = HttpClient.newHttpClient()
            .send(request, HttpResponse.BodyHandlers.ofString());
        return response.body();
    }
    
    public String createCompany(Map<String, Object> companyData) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(API_BASE + "/admin/companies"))
            .header("Content-Type", "application/json")
            .header("Authorization", "Bearer " + token)
            .POST(HttpRequest.BodyPublishers.ofString(gson.toJson(companyData)))
            .build();
        
        HttpResponse<String> response = HttpClient.newHttpClient()
            .send(request, HttpResponse.BodyHandlers.ofString());
        return response.body();
    }
    
    public static void main(String[] args) throws Exception {
        CompaniesClient client = new CompaniesClient();
        
        String companies = client.listCompanies("AGENT", "ACTIVE");
        System.out.println("Companies: " + companies);
        
        Map<String, Object> newCompany = Map.of(
            "companyName", "New Company",
            "email", "new@example.com",
            "type", "AGENT",
            "password", "secure123"
        );
        String created = client.createCompany(newCompany);
        System.out.println("Created: " + created);
    }
}`,
        perl: `use strict;
use warnings;
use LWP::UserAgent;
use HTTP::Request;
use JSON;
use URI::Encode qw(uri_encode);

my $API_BASE = 'http://localhost:8080';
my $token = 'your-admin-token';

sub list_companies {
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
my $companies = list_companies('AGENT', 'ACTIVE');
print "Companies: " . encode_json($companies->{items}) . "\\n";

my $new_company = {
    companyName => 'New Company',
    email       => 'new@example.com',
    type        => 'AGENT',
    password    => 'secure123'
};
my $created = create_company($new_company);
print "Created: " . encode_json($created) . "\\n";`,
      };
      return (
        <section>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>Companies Management</h2>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
            Manage companies (agents and sources) in the system. Create, update, list, and monitor company accounts.
          </p>
          <div style={{ backgroundColor: '#1f2937', color: '#f9fafb', padding: '1.5rem', borderRadius: '0.25rem', marginTop: '1rem' }}>
            <pre style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5', fontFamily: 'Monaco, Menlo, monospace', whiteSpace: 'pre-wrap' }}>
              {companiesCode[activeSdk]}
            </pre>
          </div>
          <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '0.5rem' }}>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#334155' }}>
              <strong>Endpoints:</strong> GET /admin/companies, GET /admin/companies/:id, POST /admin/companies, PATCH /admin/companies/:id
            </p>
          </div>
        </section>
      );
    }
    
    // Agreements Management Section
    if (sectionId === 'agreements') {
      const agreementsCode: Record<SdkType, string> = {
        typescript: `import axios from 'axios';

const API_BASE = 'http://localhost:8080';
const token = 'your-admin-token';

// List agreements with filters
const agreementsRes = await axios.get(\`\${API_BASE}/admin/agreements\`, {
  params: {
    status: 'ACTIVE',  // 'ACTIVE' | 'DRAFT' | 'OFFERED' | 'ACCEPTED' | 'REJECTED'
    agentId: 'agent-id', // Optional
    sourceId: 'source-id', // Optional
    limit: 50,
    offset: 0
  },
  headers: { Authorization: \`Bearer \${token}\` }
});
console.log('Agreements:', agreementsRes.data);

// Get agreement details
const agreementRes = await axios.get(
  \`\${API_BASE}/admin/agreements/\${agreementId}\`,
  { headers: { Authorization: \`Bearer \${token}\` } }
);
console.log('Agreement:', agreementRes.data);

// Create agreement
const newAgreementRes = await axios.post(
  \`\${API_BASE}/admin/agreements\`,
  {
    agentId: 'agent-id',
    sourceId: 'source-id',
    status: 'DRAFT'
  },
  { headers: { Authorization: \`Bearer \${token}\` } }
);

// Update agreement status
await axios.patch(
  \`\${API_BASE}/admin/agreements/\${agreementId}\`,
  { status: 'ACTIVE' },
  { headers: { Authorization: \`Bearer \${token}\` } }
);`,
        javascript: `const axios = require('axios');

const API_BASE = 'http://localhost:8080';
let token = 'your-admin-token';

// List agreements
async function listAgreements(status) {
  const res = await axios.get(\`\${API_BASE}/admin/agreements\`, {
    params: { status },
    headers: { Authorization: \`Bearer \${token}\` }
  });
  return res.data;
}

// Get agreement
async function getAgreement(agreementId) {
  const res = await axios.get(
    \`\${API_BASE}/admin/agreements/\${agreementId}\`,
    { headers: { Authorization: \`Bearer \${token}\` } }
  );
  return res.data;
}

// Example usage
const agreements = await listAgreements('ACTIVE');
console.log('Active agreements:', agreements);`,
        go: `func listAgreements(token, status string) ([]byte, error) {
    url := API_BASE + "/admin/agreements?status=" + status
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
}`,
        php: `// List agreements
$agreementsRes = $client->get('/admin/agreements', [
    'query' => ['status' => 'ACTIVE'],
    'headers' => ['Authorization' => "Bearer $token"]
]);
$agreements = json_decode($agreementsRes->getBody(), true);

// Get agreement details
$agreementRes = $client->get("/admin/agreements/{$agreementId}", [
    'headers' => ['Authorization' => "Bearer $token"]
]);
$agreement = json_decode($agreementRes->getBody(), true);`,
        python: `# List agreements
agreements_res = requests.get(
    f'{API_BASE}/admin/agreements',
    params={'status': 'ACTIVE'},
    headers=headers
)
agreements = agreements_res.json()

# Get agreement
agreement_res = requests.get(
    f'{API_BASE}/admin/agreements/{agreement_id}',
    headers=headers
)
agreement = agreement_res.json()`,
        java: `public String listAgreements(String status) throws Exception {
    String url = API_BASE + "/admin/agreements?status=" + status;
    HttpRequest request = HttpRequest.newBuilder()
        .uri(URI.create(url))
        .header("Authorization", "Bearer " + token)
        .GET()
        .build();
    
    HttpResponse<String> response = HttpClient.newHttpClient()
        .send(request, HttpResponse.BodyHandlers.ofString());
    return response.body();
}`,
        perl: `sub list_agreements {
    my ($status) = @_;
    my $url = "$API_BASE/admin/agreements?status=" . uri_encode($status);
    my $req = HTTP::Request->new('GET', $url);
    $req->header('Authorization' => "Bearer $token");
    
    my $res = $ua->request($req);
    if ($res->is_success) {
        return $json->decode($res->content);
    }
    die "Request failed: " . $res->status_line;
}`,
      };
      return (
        <section>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>Agreements Management</h2>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
            Manage agreements between agents and sources. View, create, and update agreement statuses.
          </p>
          <div style={{ backgroundColor: '#1f2937', color: '#f9fafb', padding: '1.5rem', borderRadius: '0.25rem', marginTop: '1rem' }}>
            <pre style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5', fontFamily: 'Monaco, Menlo, monospace', whiteSpace: 'pre-wrap' }}>
              {agreementsCode[activeSdk]}
            </pre>
          </div>
        </section>
      );
    }
    
    // Health Monitoring Section
    if (sectionId === 'health') {
      const healthCode: Record<SdkType, string> = {
        typescript: `import axios from 'axios';

const API_BASE = 'http://localhost:8080';
const token = 'your-admin-token';

// Health check
const healthRes = await axios.get(
  \`\${API_BASE}/admin/health\`,
  { headers: { Authorization: \`Bearer \${token}\` } }
);
console.log('Health:', healthRes.data);
// Response: { ok: true, checks: { db: 'ok', grpc_core: 'ok', mailer: 'ok' } }

// Get overview dashboard
const overviewRes = await axios.get(
  \`\${API_BASE}/admin/overview\`,
  { headers: { Authorization: \`Bearer \${token}\` } }
);
console.log('Overview:', overviewRes.data);
// Response: { agents: 10, sources: 5, agreements: 25, activeKeys: 3, last24hRequests: 150 }`,
        javascript: `// Health check
async function checkHealth() {
  const res = await axios.get(
    \`\${API_BASE}/admin/health\`,
    { headers: { Authorization: \`Bearer \${token}\` } }
  );
  return res.data;
}

// Get overview
async function getOverview() {
  const res = await axios.get(
    \`\${API_BASE}/admin/overview\`,
    { headers: { Authorization: \`Bearer \${token}\` } }
  );
  return res.data;
}

// Example usage
const health = await checkHealth();
console.log('System health:', health);

const overview = await getOverview();
console.log('Dashboard overview:', overview);`,
        go: `func checkHealth(token string) ([]byte, error) {
    req, _ := http.NewRequest("GET", API_BASE+"/admin/health", nil)
    req.Header.Set("Authorization", "Bearer "+token)
    
    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    
    body, _ := io.ReadAll(resp.Body)
    return body, nil
}`,
        php: `// Health check
$healthRes = $client->get('/admin/health', [
    'headers' => ['Authorization' => "Bearer $token"]
]);
$health = json_decode($healthRes->getBody(), true);
echo "Health: " . json_encode($health) . PHP_EOL;

// Get overview
$overviewRes = $client->get('/admin/overview', [
    'headers' => ['Authorization' => "Bearer $token"]
]);
$overview = json_decode($overviewRes->getBody(), true);`,
        python: `# Health check
health_res = requests.get(f'{API_BASE}/admin/health', headers=headers)
health = health_res.json()
print('Health:', health)

# Get overview
overview_res = requests.get(f'{API_BASE}/admin/overview', headers=headers)
overview = overview_res.json()
print('Overview:', overview)`,
        java: `public String checkHealth() throws Exception {
    HttpRequest request = HttpRequest.newBuilder()
        .uri(URI.create(API_BASE + "/admin/health"))
        .header("Authorization", "Bearer " + token)
        .GET()
        .build();
    
    HttpResponse<String> response = HttpClient.newHttpClient()
        .send(request, HttpResponse.BodyHandlers.ofString());
    return response.body();
}`,
        perl: `sub check_health {
    my $req = HTTP::Request->new('GET', "$API_BASE/admin/health");
    $req->header('Authorization' => "Bearer $token");
    
    my $res = $ua->request($req);
    if ($res->is_success) {
        return $json->decode($res->content);
    }
    die "Request failed: " . $res->status_line;
}`,
      };
      return (
        <section>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>Health Monitoring</h2>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
            Monitor system health and get dashboard overview metrics. Check database connectivity, gRPC services, and mailer status.
          </p>
          <div style={{ backgroundColor: '#1f2937', color: '#f9fafb', padding: '1.5rem', borderRadius: '0.25rem', marginTop: '1rem' }}>
            <pre style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5', fontFamily: 'Monaco, Menlo, monospace', whiteSpace: 'pre-wrap' }}>
              {healthCode[activeSdk]}
            </pre>
          </div>
        </section>
      );
    }
    
    // Branches Section
    if (sectionId === 'branches') {
      const branchesCode: Record<SdkType, string> = {
        typescript: `// List all branches
const branchesRes = await axios.get(
  \`\${API_BASE}/admin/branches\`,
  {
    params: { limit: 50, offset: 0 },
    headers: { Authorization: \`Bearer \${token}\` }
  }
);
console.log('Branches:', branchesRes.data.items);

// Get branch details
const branchRes = await axios.get(
  \`\${API_BASE}/admin/branches/\${branchId}\`,
  { headers: { Authorization: \`Bearer \${token}\` } }
);`,
        javascript: `async function listBranches(limit, offset) {
  const res = await axios.get(\`\${API_BASE}/admin/branches\`, {
    params: { limit, offset },
    headers: { Authorization: \`Bearer \${token}\` }
  });
  return res.data.items;
}`,
        go: `func listBranches(token string, limit, offset int) ([]byte, error) {
    url := fmt.Sprintf("%s/admin/branches?limit=%d&offset=%d", API_BASE, limit, offset)
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
}`,
        php: `$branchesRes = $client->get('/admin/branches', [
    'query' => ['limit' => 50, 'offset' => 0],
    'headers' => ['Authorization' => "Bearer $token"]
]);
$branches = json_decode($branchesRes->getBody(), true);`,
        python: `branches_res = requests.get(
    f'{API_BASE}/admin/branches',
    params={'limit': 50, 'offset': 0},
    headers=headers
)
branches = branches_res.json()['items']`,
        java: `public String listBranches(int limit, int offset) throws Exception {
    String url = API_BASE + "/admin/branches?limit=" + limit + "&offset=" + offset;
    HttpRequest request = HttpRequest.newBuilder()
        .uri(URI.create(url))
        .header("Authorization", "Bearer " + token)
        .GET()
        .build();
    
    HttpResponse<String> response = HttpClient.newHttpClient()
        .send(request, HttpResponse.BodyHandlers.ofString());
    return response.body();
}`,
        perl: `sub list_branches {
    my ($limit, $offset) = @_;
    my $url = "$API_BASE/admin/branches?limit=$limit&offset=$offset";
    my $req = HTTP::Request->new('GET', $url);
    $req->header('Authorization' => "Bearer $token");
    
    my $res = $ua->request($req);
    if ($res->is_success) {
        return $json->decode($res->content);
    }
    die "Request failed: " . $res->status_line;
}`,
      };
      return (
        <section>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>Branches</h2>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
            View and manage company branches. List all branches with pagination support.
          </p>
          <div style={{ backgroundColor: '#1f2937', color: '#f9fafb', padding: '1.5rem', borderRadius: '0.25rem', marginTop: '1rem' }}>
            <pre style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5', fontFamily: 'Monaco, Menlo, monospace', whiteSpace: 'pre-wrap' }}>
              {branchesCode[activeSdk]}
            </pre>
          </div>
        </section>
      );
    }
    
    // Logs Section
    if (sectionId === 'logs') {
      const logsCode: Record<SdkType, string> = {
        typescript: `// List system logs with filters
const logsRes = await axios.get(
  \`\${API_BASE}/admin/logs\`,
  {
    params: {
      level: 'ERROR',      // 'ERROR' | 'WARN' | 'INFO' | 'DEBUG'
      limit: 100,
      offset: 0,
      startDate: '2025-01-01T00:00:00Z', // Optional
      endDate: '2025-01-31T23:59:59Z'    // Optional
    },
    headers: { Authorization: \`Bearer \${token}\` }
  }
);
console.log('Logs:', logsRes.data.items);

// Get specific log entry
const logRes = await axios.get(
  \`\${API_BASE}/admin/logs/\${logId}\`,
  { headers: { Authorization: \`Bearer \${token}\` } }
);`,
        javascript: `async function listLogs(level, limit, offset) {
  const res = await axios.get(\`\${API_BASE}/admin/logs\`, {
    params: { level, limit, offset },
    headers: { Authorization: \`Bearer \${token}\` }
  });
  return res.data.items;
}

// Example: Get error logs
const errorLogs = await listLogs('ERROR', 100, 0);
console.log('Error logs:', errorLogs);`,
        go: `func listLogs(token, level string, limit, offset int) ([]byte, error) {
    url := fmt.Sprintf("%s/admin/logs?level=%s&limit=%d&offset=%d", 
        API_BASE, level, limit, offset)
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
}`,
        php: `$logsRes = $client->get('/admin/logs', [
    'query' => ['level' => 'ERROR', 'limit' => 100],
    'headers' => ['Authorization' => "Bearer $token"]
]);
$logs = json_decode($logsRes->getBody(), true);`,
        python: `logs_res = requests.get(
    f'{API_BASE}/admin/logs',
    params={'level': 'ERROR', 'limit': 100},
    headers=headers
)
logs = logs_res.json()['items']`,
        java: `public String listLogs(String level, int limit) throws Exception {
    String url = API_BASE + "/admin/logs?level=" + level + "&limit=" + limit;
    HttpRequest request = HttpRequest.newBuilder()
        .uri(URI.create(url))
        .header("Authorization", "Bearer " + token)
        .GET()
        .build();
    
    HttpResponse<String> response = HttpClient.newHttpClient()
        .send(request, HttpResponse.BodyHandlers.ofString());
    return response.body();
}`,
        perl: `sub list_logs {
    my ($level, $limit) = @_;
    my $url = "$API_BASE/admin/logs?level=" . uri_encode($level) . 
              "&limit=$limit";
    my $req = HTTP::Request->new('GET', $url);
    $req->header('Authorization' => "Bearer $token");
    
    my $res = $ua->request($req);
    if ($res->is_success) {
        return $json->decode($res->content);
    }
    die "Request failed: " . $res->status_line;
}`,
      };
      return (
        <section>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>System Logs</h2>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
            View and filter system logs. Monitor errors, warnings, and system events with date range and level filters.
          </p>
          <div style={{ backgroundColor: '#1f2937', color: '#f9fafb', padding: '1.5rem', borderRadius: '0.25rem', marginTop: '1rem' }}>
            <pre style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5', fontFamily: 'Monaco, Menlo, monospace', whiteSpace: 'pre-wrap' }}>
              {logsCode[activeSdk]}
            </pre>
          </div>
        </section>
      );
    }
    
    // Error Handling Section
    if (sectionId === 'error-handling') {
      const errorHandlingCode: Record<SdkType, string> = {
        typescript: `import axios, { AxiosError } from 'axios';

try {
  const res = await axios.get(\`\${API_BASE}/admin/companies/\${companyId}\`, {
    headers: { Authorization: \`Bearer \${token}\` }
  });
  console.log('Success:', res.data);
} catch (error) {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    if (axiosError.response) {
      // Server responded with error status
      console.error('Status:', axiosError.response.status);
      console.error('Error:', axiosError.response.data);
      
      switch (axiosError.response.status) {
        case 401:
          console.error('Unauthorized - check your token');
          break;
        case 403:
          console.error('Forbidden - insufficient permissions');
          break;
        case 404:
          console.error('Not found');
          break;
        case 500:
          console.error('Server error');
          break;
      }
    } else if (axiosError.request) {
      // Request made but no response
      console.error('Network error - no response received');
    } else {
      console.error('Error:', axiosError.message);
    }
  }
}

// Retry logic example
async function retryRequest(fn: () => Promise<any>, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}`,
        javascript: `async function makeRequest(url, options) {
  try {
    const res = await axios.get(url, options);
    return res.data;
  } catch (error) {
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
      
      // Handle specific status codes
      if (error.response.status === 401) {
        // Token expired, refresh it
        console.error('Token expired');
      }
    } else if (error.request) {
      console.error('Network error');
    }
    throw error;
  }
}`,
        go: `func makeRequest(url string, token string) ([]byte, error) {
    req, _ := http.NewRequest("GET", url, nil)
    req.Header.Set("Authorization", "Bearer "+token)
    
    client := &http.Client{Timeout: 10 * time.Second}
    resp, err := client.Do(req)
    if err != nil {
        return nil, fmt.Errorf("request failed: %w", err)
    }
    defer resp.Body.Close()
    
    if resp.StatusCode >= 400 {
        body, _ := io.ReadAll(resp.Body)
        return nil, fmt.Errorf("HTTP %d: %s", resp.StatusCode, string(body))
    }
    
    body, _ := io.ReadAll(resp.Body)
    return body, nil
}`,
        php: `try {
    $response = $client->get('/admin/companies/' . $companyId, [
        'headers' => ['Authorization' => "Bearer $token"]
    ]);
    $data = json_decode($response->getBody(), true);
} catch (\\GuzzleHttp\\Exception\\ClientException $e) {
    $statusCode = $e->getResponse()->getStatusCode();
    $errorBody = $e->getResponse()->getBody()->getContents();
    
    switch ($statusCode) {
        case 401:
            echo "Unauthorized\\n";
            break;
        case 403:
            echo "Forbidden\\n";
            break;
        case 404:
            echo "Not found\\n";
            break;
        default:
            echo "Error $statusCode: $errorBody\\n";
    }
} catch (\\GuzzleHttp\\Exception\\RequestException $e) {
    echo "Network error: " . $e->getMessage() . "\\n";
}`,
        python: `import requests
from requests.exceptions import HTTPError, RequestException

try:
    response = requests.get(
        f'{API_BASE}/admin/companies/{company_id}',
        headers=headers,
        timeout=10
    )
    response.raise_for_status()
    data = response.json()
except HTTPError as e:
    status_code = e.response.status_code
    if status_code == 401:
        print('Unauthorized - check your token')
    elif status_code == 403:
        print('Forbidden - insufficient permissions')
    elif status_code == 404:
        print('Not found')
    else:
        print(f'HTTP Error {status_code}: {e.response.text}')
except RequestException as e:
    print(f'Network error: {e}')`,
        java: `public String makeRequest(String url) throws Exception {
    HttpRequest request = HttpRequest.newBuilder()
        .uri(URI.create(url))
        .header("Authorization", "Bearer " + token)
        .timeout(Duration.ofSeconds(10))
        .GET()
        .build();
    
    HttpResponse<String> response = HttpClient.newHttpClient()
        .send(request, HttpResponse.BodyHandlers.ofString());
    
    if (response.statusCode() >= 400) {
        throw new Exception("HTTP " + response.statusCode() + ": " + response.body());
    }
    
    return response.body();
}`,
        perl: `sub make_request {
    my ($url) = @_;
    my $req = HTTP::Request->new('GET', $url);
    $req->header('Authorization' => "Bearer $token");
    
    my $res = $ua->request($req);
    if ($res->is_success) {
        return $json->decode($res->content);
    } else {
        my $status = $res->code;
        my $content = $res->content;
        
        if ($status == 401) {
            die "Unauthorized - check your token";
        } elsif ($status == 403) {
            die "Forbidden - insufficient permissions";
        } elsif ($status == 404) {
            die "Not found";
        } else {
            die "HTTP $status: $content";
        }
    }
}`,
      };
      return (
        <section>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>Error Handling</h2>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
            Handle errors gracefully with proper status code checking and retry logic. Common HTTP status codes: 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 500 (Server Error).
          </p>
          <div style={{ backgroundColor: '#1f2937', color: '#f9fafb', padding: '1.5rem', borderRadius: '0.25rem', marginTop: '1rem' }}>
            <pre style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5', fontFamily: 'Monaco, Menlo, monospace', whiteSpace: 'pre-wrap' }}>
              {errorHandlingCode[activeSdk]}
            </pre>
          </div>
        </section>
      );
    }
    
    // Configuration Section
    if (sectionId === 'configuration') {
      const configCode: Record<SdkType, string> = {
        typescript: `import axios from 'axios';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: 'http://localhost:8080',
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add request interceptor for auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken'); // or from your auth system
  if (token) {
    config.headers.Authorization = \`Bearer \${token}\`;
  }
  return config;
});

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired, redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Use the configured client
const companies = await apiClient.get('/admin/companies');`,
        javascript: `// Configure axios with defaults
const apiClient = axios.create({
  baseURL: 'http://localhost:8080',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

// Add auth interceptor
apiClient.interceptors.request.use(config => {
  config.headers.Authorization = \`Bearer \${getToken()}\`;
  return config;
});`,
        go: `// Create HTTP client with timeout
client := &http.Client{
    Timeout: 30 * time.Second,
}

// Helper function to add auth header
func addAuthHeader(req *http.Request, token string) {
    req.Header.Set("Authorization", "Bearer "+token)
    req.Header.Set("Content-Type", "application/json")
}`,
        php: `// Create Guzzle client with default config
$client = new Client([
    'base_uri' => 'http://localhost:8080',
    'timeout' => 30.0,
    'headers' => [
        'Content-Type' => 'application/json',
        'Authorization' => 'Bearer ' . $token
    ]
]);`,
        python: `import requests

# Create session with default config
session = requests.Session()
session.headers.update({
    'Content-Type': 'application/json',
    'Authorization': f'Bearer {token}'
})
session.timeout = 30

# Use session for all requests
response = session.get(f'{API_BASE}/admin/companies')`,
        java: `// Create HttpClient with timeout
HttpClient client = HttpClient.newBuilder()
    .connectTimeout(Duration.ofSeconds(10))
    .build();

// Helper method to create authenticated request
private HttpRequest createRequest(String endpoint) {
    return HttpRequest.newBuilder()
        .uri(URI.create(API_BASE + endpoint))
        .header("Authorization", "Bearer " + token)
        .header("Content-Type", "application/json")
        .timeout(Duration.ofSeconds(30))
        .build();
}`,
        perl: `# Configure UserAgent with timeout
my $ua = LWP::UserAgent->new;
$ua->timeout(30);

# Helper function to create authenticated request
sub create_request {
    my ($method, $endpoint) = @_;
    my $req = HTTP::Request->new($method, "$API_BASE$endpoint");
    $req->header('Authorization' => "Bearer $token");
    $req->header('Content-Type' => 'application/json');
    return $req;
}`,
      };
      return (
        <section>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>Configuration</h2>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
            Configure your HTTP client with authentication, timeouts, and default headers. Set up request/response interceptors for centralized error handling.
          </p>
          <div style={{ backgroundColor: '#1f2937', color: '#f9fafb', padding: '1.5rem', borderRadius: '0.25rem', marginTop: '1rem' }}>
            <pre style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5', fontFamily: 'Monaco, Menlo, monospace', whiteSpace: 'pre-wrap' }}>
              {configCode[activeSdk]}
            </pre>
          </div>
        </section>
      );
    }
    
    // Testing Section
    if (sectionId === 'testing') {
      const testingCode: Record<SdkType, string> = {
        typescript: `// Example test setup with Jest
import axios from 'axios';
import axiosMockAdapter from 'axios-mock-adapter';

const mock = new axiosMockAdapter(axios);

describe('Admin API Client', () => {
  beforeEach(() => {
    mock.reset();
  });
  
  it('should list companies', async () => {
    mock.onGet('/admin/companies').reply(200, {
      items: [
        { id: '1', companyName: 'Test Agent', type: 'AGENT' }
      ]
    });
    
    const res = await axios.get('/admin/companies');
    expect(res.data.items).toHaveLength(1);
  });
  
  it('should handle errors', async () => {
    mock.onGet('/admin/companies/invalid').reply(404, {
      error: 'NOT_FOUND'
    });
    
    try {
      await axios.get('/admin/companies/invalid');
    } catch (error) {
      expect(error.response.status).toBe(404);
    }
  });
});`,
        javascript: `// Mock API responses for testing
const mockCompanies = {
  items: [
    { id: '1', companyName: 'Test Agent', type: 'AGENT' }
  ]
};

// Test function
async function testListCompanies() {
  // In test environment, mock the API call
  if (process.env.NODE_ENV === 'test') {
    return mockCompanies;
  }
  
  // In production, make real API call
  const res = await axios.get('/admin/companies');
  return res.data;
}`,
        go: `// Example test with httptest
package main

import (
    "net/http"
    "net/http/httptest"
    "testing"
)

func TestListCompanies(t *testing.T) {
    // Create mock server
    server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.WriteHeader(http.StatusOK)
        w.Write([]byte(\`{"items": [{"id": "1", "companyName": "Test Agent"}]}\`))
    }))
    defer server.Close()
    
    // Test with mock server
    resp, err := http.Get(server.URL + "/admin/companies")
    if err != nil {
        t.Fatal(err)
    }
    // ... assertions
}`,
        php: `// PHPUnit test example
use PHPUnit\\Framework\\TestCase;
use GuzzleHttp\\Client;
use GuzzleHttp\\Handler\\MockHandler;
use GuzzleHttp\\HandlerStack;
use GuzzleHttp\\Psr7\\Response;

class AdminClientTest extends TestCase {
    public function testListCompanies() {
        $mock = new MockHandler([
            new Response(200, [], json_encode([
                'items' => [['id' => '1', 'companyName' => 'Test Agent']]
            ]))
        ]);
        
        $handlerStack = HandlerStack::create($mock);
        $client = new Client(['handler' => $handlerStack]);
        
        $response = $client->get('/admin/companies');
        $data = json_decode($response->getBody(), true);
        
        $this->assertCount(1, $data['items']);
    }
}`,
        python: `# pytest example with responses library
import pytest
import responses
import requests

@responses.activate
def test_list_companies():
    responses.add(
        responses.GET,
        'http://localhost:8080/admin/companies',
        json={'items': [{'id': '1', 'companyName': 'Test Agent'}]},
        status=200
    )
    
    response = requests.get('http://localhost:8080/admin/companies')
    assert response.status_code == 200
    assert len(response.json()['items']) == 1`,
        java: `// JUnit test example
import org.junit.jupiter.api.Test;
import java.net.http.*;
import static org.junit.jupiter.api.Assertions.*;

public class AdminClientTest {
    @Test
    public void testListCompanies() throws Exception {
        // Use mock server or test double
        // Example with WireMock or similar
        String mockResponse = "{\\"items\\": [{\\"id\\": \\"1\\"}]}";
        // ... test implementation
    }
}`,
        perl: `# Test::More example
use Test::More;
use Test::Mock::LWP::Conditional;

my $mock_ua = Test::Mock::LWP::Conditional->new;
$mock_ua->mock_response(
    GET => 'http://localhost:8080/admin/companies',
    HTTP::Response->new(200, 'OK', [], 
        '{"items": [{"id": "1", "companyName": "Test Agent"}]}')
);

my $companies = list_companies('AGENT', 'ACTIVE');
is(scalar(@{$companies->{items}}), 1, 'Should return one company');`,
      };
      return (
        <section>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>Testing</h2>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
            Set up tests for your admin API integration. Use mocking libraries to simulate API responses and test error handling.
          </p>
          <div style={{ backgroundColor: '#1f2937', color: '#f9fafb', padding: '1.5rem', borderRadius: '0.25rem', marginTop: '1rem' }}>
            <pre style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5', fontFamily: 'Monaco, Menlo, monospace', whiteSpace: 'pre-wrap' }}>
              {testingCode[activeSdk]}
            </pre>
          </div>
        </section>
      );
    }
    
    // Troubleshooting Section
    if (sectionId === 'troubleshooting') {
      return (
        <section>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>Troubleshooting</h2>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.75rem', color: '#1f2937' }}>Common Issues</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ padding: '1rem', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#1f2937' }}>401 Unauthorized</h4>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                  <strong>Cause:</strong> Invalid or expired authentication token.
                </p>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  <strong>Solution:</strong> Verify your token is correct and not expired. Re-authenticate if needed.
                </p>
              </div>
              <div style={{ padding: '1rem', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#1f2937' }}>403 Forbidden</h4>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                  <strong>Cause:</strong> Insufficient permissions. User is not an admin.
                </p>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  <strong>Solution:</strong> Ensure you're logged in as an admin user with ADMIN role.
                </p>
              </div>
              <div style={{ padding: '1rem', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#1f2937' }}>Network Timeout</h4>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                  <strong>Cause:</strong> Request taking too long or server unreachable.
                </p>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  <strong>Solution:</strong> Increase timeout settings, check network connectivity, verify API_BASE URL is correct.
                </p>
              </div>
              <div style={{ padding: '1rem', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#1f2937' }}>CORS Errors</h4>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                  <strong>Cause:</strong> Browser blocking cross-origin requests.
                </p>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  <strong>Solution:</strong> Use a proxy in development, or ensure backend CORS is configured correctly.
                </p>
              </div>
            </div>
          </div>
          <div style={{ marginTop: '1.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.75rem', color: '#1f2937' }}>Debug Tips</h3>
            <ul style={{ paddingLeft: '1.5rem', color: '#6b7280', fontSize: '0.875rem', lineHeight: '1.8' }}>
              <li>Enable request/response logging in your HTTP client</li>
              <li>Check the response body for detailed error messages</li>
              <li>Verify API_BASE URL matches your backend server</li>
              <li>Use browser DevTools Network tab to inspect requests</li>
              <li>Check system logs via GET /admin/logs endpoint</li>
              <li>Verify token format: "Bearer &lt;token&gt;"</li>
            </ul>
          </div>
        </section>
      );
    }
    
    // Best Practices Section
    if (sectionId === 'best-practices') {
      return (
        <section>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>Best Practices</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.75rem', color: '#1f2937' }}>Security</h3>
              <ul style={{ paddingLeft: '1.5rem', color: '#6b7280', fontSize: '0.875rem', lineHeight: '1.8' }}>
                <li>Never commit tokens or API keys to version control</li>
                <li>Use environment variables for sensitive configuration</li>
                <li>Implement token refresh logic for long-running applications</li>
                <li>Validate all input data before sending to API</li>
                <li>Use HTTPS in production environments</li>
                <li>Implement rate limiting on the client side</li>
              </ul>
            </div>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.75rem', color: '#1f2937' }}>Performance</h3>
              <ul style={{ paddingLeft: '1.5rem', color: '#6b7280', fontSize: '0.875rem', lineHeight: '1.8' }}>
                <li>Use connection pooling for multiple requests</li>
                <li>Implement request caching where appropriate</li>
                <li>Set appropriate timeout values (30s default)</li>
                <li>Use pagination for large data sets</li>
                <li>Avoid making unnecessary API calls</li>
                <li>Batch operations when possible</li>
              </ul>
            </div>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.75rem', color: '#1f2937' }}>Error Handling</h3>
              <ul style={{ paddingLeft: '1.5rem', color: '#6b7280', fontSize: '0.875rem', lineHeight: '1.8' }}>
                <li>Always handle network errors and timeouts</li>
                <li>Implement retry logic with exponential backoff</li>
                <li>Log errors for debugging but don't expose sensitive info</li>
                <li>Provide user-friendly error messages</li>
                <li>Handle 401 errors by refreshing authentication</li>
                <li>Validate response data structure before use</li>
              </ul>
            </div>
          </div>
        </section>
      );
    }
    
    // API Reference Section
    if (sectionId === 'api-reference') {
      const methodColor: Record<string, string> = {
        GET: '#10b981',
        POST: '#3b82f6',
        PUT: '#f97316',
        DELETE: '#ef4444',
        PATCH: '#a855f7',
      };
      
      return (
        <section>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#111827' }}>API Reference</h2>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
            Complete REST API endpoints used by the admin API. All endpoints require ADMIN role authentication.
          </p>
          <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#1f2937' }}>Authentication</h3>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
              All requests require: <code style={{ backgroundColor: '#e5e7eb', padding: '0.125rem 0.25rem', borderRadius: '0.25rem', fontSize: '0.75rem' }}>Authorization: Bearer &lt;token&gt;</code>
            </p>
          </div>
          <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse', 
              fontSize: '0.875rem',
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              overflow: 'hidden'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#111827', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Method</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#111827', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Endpoint</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#111827', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { method: 'GET', path: '/admin/health', desc: 'System health check' },
                  { method: 'GET', path: '/admin/overview', desc: 'Dashboard overview metrics' },
                  { method: 'GET', path: '/admin/companies', desc: 'List companies (filters: type, status)' },
                  { method: 'GET', path: '/admin/companies/:id', desc: 'Get company details' },
                  { method: 'POST', path: '/admin/companies', desc: 'Create new company' },
                  { method: 'PATCH', path: '/admin/companies/:id', desc: 'Update company' },
                  { method: 'GET', path: '/admin/agreements', desc: 'List agreements (filters: status, agentId, sourceId)' },
                  { method: 'GET', path: '/admin/branches', desc: 'List branches (pagination: limit, offset)' },
                  { method: 'GET', path: '/admin/logs', desc: 'List system logs (filters: level, date range)' },
                  { method: 'GET', path: '/admin/api-keys', desc: 'List API keys' },
                  { method: 'POST', path: '/admin/api-keys', desc: 'Create API key' },
                  { method: 'DELETE', path: '/admin/api-keys/:id', desc: 'Revoke API key' },
                  { method: 'GET', path: '/admin/whitelist', desc: 'List IP whitelist entries' },
                  { method: 'POST', path: '/admin/whitelist', desc: 'Add IP to whitelist' },
                ].map((ep, idx, array) => {
                  const methodBgColor = methodColor[ep.method] || '#6b7280';
                  return (
                    <tr 
                      key={idx} 
                      style={{ 
                        borderBottom: idx === array.length - 1 ? 'none' : '1px solid #e5e7eb',
                        transition: 'background-color 0.15s ease',
                        cursor: 'default'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f9fafb';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <td style={{ padding: '0.75rem 1rem', color: '#111827' }}>
                        <code style={{ 
                          backgroundColor: methodBgColor, 
                          color: 'white',
                          padding: '0.125rem 0.375rem', 
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          fontFamily: 'Monaco, Menlo, monospace'
                        }}>
                          {ep.method}
                        </code>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#111827' }}>
                        <code style={{ 
                          backgroundColor: '#f3f4f6', 
                          padding: '0.125rem 0.25rem', 
                          borderRadius: '0.25rem',
                          fontFamily: 'Monaco, Menlo, monospace',
                          fontSize: '0.875rem'
                        }}>
                          {ep.path}
                        </code>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#6b7280' }}>{ep.desc}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
                    <div key={sdk.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button
                        onClick={() => {
                          setActiveSdk(sdk.id);
                          setActiveSection('quick-start');
                        }}
                        style={{
                          flex: 1,
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
                      <SdkDownloadButton
                        sdkType={sdk.downloadType}
                        variant="icon-only"
                        className="sdk-download-btn"
                      />
                    </div>
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
      <main style={{ flex: 1, padding: '2rem', maxWidth: '1000px', margin: '0 auto', minWidth: 0 }}>
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', color: '#111827' }}>
              {sdks.find(s => s.id === activeSdk)?.name} SDK
            </h1>
            <p style={{ color: '#6b7280', fontSize: '1rem' }}>
              Production-ready SDK for integrating with Gloria Connect Admin API
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <SdkDownloadButton
              sdkType={sdks.find(s => s.id === activeSdk)?.downloadType || 'nodejs'}
              label={`Download ${sdks.find(s => s.id === activeSdk)?.name} SDK`}
              variant="default"
            />
          </div>
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


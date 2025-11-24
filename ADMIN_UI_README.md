# Admin UI System

This document describes the new Admin UI system that provides a comprehensive interface for testing and managing gRPC and HTTP connections.

## Features

### Authentication & Agreements
- Simple login system (no backend auth required)
- Terms of service agreement flow with server/local fallback
- Role-based access control (admin/viewer)

### Registration
- Agent registration with gRPC address, HTTP URL, and token management
- Source registration with gRPC address and HTTP URL
- Local storage persistence with server fallback

### Connectivity Testing
- Middleware health checks
- UI configuration display with feature flags
- gRPC connection testing for Source and Agent services
- Real-time test results with response times

### Source Testing
- **Locations**: Load available locations (wrapper first, HTTP fallback)
- **Availability**: Check vehicle availability with form inputs
- **Bookings**: Create/Modify/Cancel/Check bookings (when wrappers available)

### Agent Testing
- **Ping**: Basic connectivity test
- **Run Check**: Functional testing with sample payloads
- **Token Management**: Set, view, and delete agent tokens

## Architecture

### API Layer
- `src/api/http.ts`: HTTP client with error handling and base URL configuration
- `src/api/routes.ts`: Centralized route definitions for middleware endpoints
- `src/api/client.ts`: High-level API functions with fallback logic

### State Management
- `src/state/useAppStore.tsx`: React Context store for global application state
- Persistent storage for addresses, agreements, and configuration

### Routing & Guards
- `src/routes/ProtectedRoute.tsx`: Authentication guard
- `src/routes/RequireAgreement.tsx`: Agreement acceptance guard
- Automatic redirects based on authentication and agreement status

### Pages
- `src/pages/LoginPage.tsx`: Simple login form
- `src/pages/AgreementsPage.tsx`: Terms acceptance with markdown rendering
- `src/pages/RegistrationPage.tsx`: Agent and Source registration forms
- `src/pages/ConnectivityPage.tsx`: Connection testing and configuration
- `src/pages/SourcePage.tsx`: Source-specific testing interface
- `src/pages/AgentPage.tsx`: Agent-specific testing interface

## Configuration

### Environment Variables
```bash
VITE_MW_URL=http://localhost:8080  # Middleware base URL
```

### Feature Flags
The system respects feature flags from `/ui/config`:
- `grpcTesting`: Enable/disable gRPC testing buttons
- `verification`: Show/hide agreements tab
- `whitelist`: Future whitelist management
- `metrics`: Future metrics display

## Fallback Strategy

### Server Unavailable
- All endpoints gracefully fall back to local storage
- Clear messaging when server features are unavailable
- HTTP direct connections when middleware wrappers are missing

### Wrapper Unavailable
- Source operations fall back to direct HTTP calls
- Agent operations show guidance for manual testing
- Booking operations show "not available" message

## Usage Flow

1. **Login** → Simple email/password form
2. **Agreements** → Accept terms (server or local)
3. **Registration** → Configure Agent and Source addresses
4. **Connectivity** → Test connections and view configuration
5. **Source/Agent** → Perform specific testing operations

## Development

### Adding New Features
1. Add route to `src/api/routes.ts`
2. Implement client function in `src/api/client.ts`
3. Create page component
4. Add navigation item to `src/components/NavShell.tsx`
5. Update routing in `src/routes/index.tsx`

### Testing
- All HTTP calls include proper error handling
- Fallback mechanisms are tested for each endpoint
- Toast notifications provide user feedback
- Loading states prevent multiple simultaneous requests

## Legacy Compatibility

The original admin interface is preserved under `/legacy` routes to maintain backward compatibility while the new system is being adopted.

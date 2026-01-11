# Gloria Connect Admin Panel

A comprehensive admin panel for the Gloria Connect platform backend, built with React, Vite, and Tailwind CSS.

## Features

- **Dashboard**: Overview of system KPIs and recent activity
- **Sources Management**: Configure and monitor car rental source companies
- **Agents Management**: Manage car rental agent companies
- **Agreements**: Handle agreements between agents and sources
- **Availability Testing**: Real-time availability search testing
- **Bookings Testing**: Test booking operations (Create, Modify, Cancel, Check)
- **Verification**: Run verification tests for sources and agents
- **Health Monitoring**: Monitor system health and manage backoff policies
- **Metrics**: View system performance metrics with charts
- **Logs**: Browse system logs and debugging information
- **Settings**: System configuration and preferences

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS
- **State Management**: Jotai
- **Data Fetching**: TanStack Query (React Query)
- **HTTP Client**: Axios
- **Forms**: React Hook Form + Zod validation
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Charts**: Recharts
- **Notifications**: React Hot Toast

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Gloria Connect backend running on `http://localhost:8080`

## Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Create environment file**:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and set your API base URL and app name:
   ```
   VITE_MIDDLEWARE_URL=http://localhost:8080
   VITE_APP_NAME=Gloria Connect Admin
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   Navigate to `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Authentication

The admin panel requires authentication. You'll need to:

1. Have an admin user account in your backend
2. Login with valid credentials
3. The app will store the JWT token and user information

Demo credentials (if available in your backend):
- Email: `admin@example.com`
- Password: `password123`

## API Integration

The admin panel integrates with the following backend endpoints:

### Authentication
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user

### Companies
- `GET /companies?type=SOURCE` - List source companies
- `GET /companies?type=AGENT` - List agent companies
- `PATCH /companies/:id` - Update company settings

### Agreements
- `GET /agreements` - List agreements
- `POST /agreements` - Create agreement
- `POST /agreements/:id/accept` - Accept agreement

### Availability
- `POST /availability/submit` - Submit availability request
- `GET /availability/poll` - Poll for results

### Bookings
- `POST /bookings` - Create booking
- `PATCH /bookings/:ref` - Modify booking
- `POST /bookings/:ref/cancel` - Cancel booking
- `POST /bookings/:ref/check` - Check booking status

### Verification
- `POST /verification/source/run` - Run source verification
- `POST /verification/agent/run` - Run agent verification
- `GET /verification/status` - Get verification status

### Health & Monitoring
- `GET /admin/health` - Get system health
- `GET /admin/health/sources` - Get source health data
- `POST /admin/health/reset` - Reset health data
- `GET /metrics` - Get Prometheus metrics
- `GET /admin/logs` - Get system logs (optional)

### IP Whitelist (Optional)
- `GET /admin/whitelist` - List whitelist entries
- `POST /admin/whitelist` - Add whitelist entry
- `DELETE /admin/whitelist/:id` - Remove whitelist entry
- `POST /admin/whitelist/test` - Test whitelist access

## Features by Page

### Dashboard
- System KPIs (sources, agents, agreements, excluded sources)
- Recent verification results
- System health overview
- Quick action buttons

### Sources
- List all source companies
- Edit API endpoints
- Run health checks
- Reset health data
- Sync locations
- Manage IP whitelist

### Agents
- List all agent companies
- Offer agreements
- View agent details

### Agreements
- List all agreements
- Filter by status
- Accept agreements on behalf
- View agreement details

### Availability Tester
- Submit availability requests
- Real-time polling for results
- Display incremental offers
- Copy raw JSON responses

### Bookings Tester
- Create bookings with idempotency keys
- Modify existing bookings
- Cancel bookings
- Check booking status

### Verification
- Run source verification tests
- Run agent verification tests
- View step-by-step results
- Monitor test latencies

### Health
- Monitor source health metrics
- View slow rates and sample counts
- Manage backoff levels
- Reset health data

### Metrics
- View Prometheus metrics
- Real-time charts for latency and duration
- Configurable refresh intervals
- Parse histogram data

### Logs
- Browse system logs
- Filter by level, company, source
- View request IDs and endpoints
- Graceful fallback if logs API unavailable

### Settings
- System configuration toggles
- Backend information
- Environment details

## Error Handling

The app includes comprehensive error handling:

- **Network errors**: Automatic retry with exponential backoff
- **Authentication errors**: Automatic redirect to login
- **API errors**: User-friendly error messages via toast notifications
- **Missing endpoints**: Graceful fallbacks and feature detection

## Development

### Project Structure

```
src/
├── api/                 # API layer with axios
├── components/          # Reusable UI components
│   ├── layout/         # Layout components
│   └── ui/             # Basic UI components
├── lib/                # Utilities and configurations
├── pages/              # Page components
├── routes/             # Routing configuration
├── store/              # Jotai state management
└── main.jsx           # Application entry point
```

### Adding New Features

1. **API Integration**: Add new endpoints to `src/api/`
2. **Validation**: Add schemas to `src/lib/validators.ts`
3. **UI Components**: Create reusable components in `src/components/ui/`
4. **Pages**: Add new pages to `src/pages/`
5. **Routing**: Update `src/routes/index.tsx`

### State Management

The app uses Jotai for state management:

- **Authentication**: `src/store/auth.ts`
- **Global state**: Create new atoms as needed
- **Local state**: Use React hooks for component state

## Production Deployment

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Deploy the `dist` folder** to your web server

3. **Configure environment variables**:
   - Set `VITE_MIDDLEWARE_URL` to your production API URL
   - Set `VITE_APP_NAME` to the displayed app name

4. **Configure your web server** to serve the SPA:
   - All routes should serve `index.html`
   - Configure proper caching headers for static assets

## Troubleshooting

### Common Issues

1. **CORS errors**: Ensure your backend allows requests from the frontend domain
2. **Authentication issues**: Check that JWT tokens are properly configured
3. **API errors**: Verify backend endpoints are available and returning expected data
4. **Build errors**: Ensure all dependencies are installed and Node.js version is compatible

### Debug Mode

Enable debug logging by setting:
```
VITE_DEBUG=true
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
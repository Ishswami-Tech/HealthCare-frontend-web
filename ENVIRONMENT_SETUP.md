# Environment Configuration Guide

This document explains how to configure different environments (development, staging, production) for the Healthcare Frontend application.

## Environment Files

The application supports three main environments:

1. **Development** (`.env.development`) - Local development with Docker backend
2. **Staging** (`.env.staging`) - Pre-production testing environment
3. **Production** (`.env.production`) - Live production environment

## Quick Start

### Development

1. Copy `.env.example` to `.env.local` or use `.env.development`:
   ```bash
   cp .env.example .env.local
   ```

2. Update the API URL to point to your local Docker backend:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8088
   ```

3. Run the development server:
   ```bash
   npm run dev
   # or
   npm run dev:local
   ```

### Staging

1. Use `.env.staging` or create `.env.staging.local`:
   ```bash
   cp .env.staging .env.staging.local
   ```

2. Update staging-specific values:
   ```env
   NEXT_PUBLIC_API_URL=https://staging-api.ishswami.in
   ```

3. Build and start:
   ```bash
   npm run build:staging
   npm run start:staging
   ```

### Production

1. Use `.env.production` or create `.env.production.local`:
   ```bash
   cp .env.production .env.production.local
   ```

2. Update production-specific values:
   ```env
   NEXT_PUBLIC_API_URL=https://api.ishswami.in
   ```

3. Build and start:
   ```bash
   npm run build:prod
   npm run start:prod
   ```

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:8088` |
| `NEXT_PUBLIC_API_VERSION` | API version | `v1` |
| `NEXT_PUBLIC_CLINIC_ID` | Default clinic ID | `CL0002` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_WEBSOCKET_URL` | WebSocket server URL | Auto-generated from API URL |
| `NEXT_PUBLIC_ENABLE_REAL_TIME` | Enable real-time features | `true` |
| `NEXT_PUBLIC_ENABLE_VIDEO_CALLS` | Enable video calls | `true` |
| `NEXT_PUBLIC_ENABLE_NOTIFICATIONS` | Enable notifications | `true` |
| `NEXT_PUBLIC_ENABLE_ANALYTICS` | Enable analytics | `false` (dev), `true` (prod) |
| `NEXT_PUBLIC_DEBUG_BACKEND_STATUS` | Enable backend status debugging | `true` (dev), `false` (prod) |
| `NEXT_PUBLIC_LOG_LEVEL` | Logging level | `debug` (dev), `error` (prod) |

### Authentication Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `NEXT_PUBLIC_FACEBOOK_APP_ID` | Facebook OAuth app ID |
| `NEXT_PUBLIC_APPLE_CLIENT_ID` | Apple OAuth client ID |

## Environment Detection

The application automatically detects the environment based on:

1. `NODE_ENV` environment variable
2. `NEXT_PUBLIC_ENVIRONMENT` custom variable
3. API URL pattern (staging/production)

You can also use the environment utility:

```typescript
import { currentEnvironment, isDevelopment, isStaging, isProduction } from '@/lib/config/env';

if (isDevelopment) {
  // Development-only code
}

if (isProduction) {
  // Production-only code
}
```

## Build Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run dev:local` | Start development server with explicit env |
| `npm run build` | Build for current environment |
| `npm run build:dev` | Build for development |
| `npm run build:staging` | Build for staging |
| `npm run build:prod` | Build for production |
| `npm run start` | Start production server |
| `npm run start:dev` | Start development server |
| `npm run start:staging` | Start staging server |
| `npm run start:prod` | Start production server |

## Environment-Specific Configuration

### Development

- API URL: `http://localhost:8088`
- WebSocket: `ws://localhost:8088/socket.io`
- Debug: Enabled
- Analytics: Disabled
- Log Level: `debug`

### Staging

- API URL: `https://staging-api.ishswami.in`
- WebSocket: `wss://staging-api.ishswami.in/socket.io`
- Debug: Enabled
- Analytics: Enabled
- Log Level: `info`

### Production

- API URL: `https://api.ishswami.in`
- WebSocket: `wss://api.ishswami.in/socket.io`
- Debug: Disabled
- Analytics: Enabled
- Log Level: `error`

## Security Notes

1. **Never commit sensitive environment files**:
   - `.env.local`
   - `.env.*.local`
   - Files with secrets/keys

2. **Always commit**:
   - `.env.example`
   - `.env.development`
   - `.env.staging`
   - `.env.production` (without secrets)

3. **Use environment variables for secrets**:
   - API keys
   - OAuth client secrets
   - Database credentials
   - JWT secrets

## Troubleshooting

### API Connection Issues

1. Check that `NEXT_PUBLIC_API_URL` is correct
2. Verify the backend server is running
3. Check CORS settings if accessing from different origin
4. Verify WebSocket URL matches API URL protocol (http/ws, https/wss)

### Environment Not Detected

1. Ensure `NODE_ENV` is set correctly
2. Check that environment file exists
3. Restart the development server after changing env files
4. Clear Next.js cache: `rm -rf .next`

### Build Issues

1. Ensure all required environment variables are set
2. Check for typos in variable names
3. Verify environment file is in the root directory
4. Check Next.js version compatibility

## Best Practices

1. **Use `.env.local` for local overrides** - This file is git-ignored
2. **Document all variables in `.env.example`** - Keep it up to date
3. **Use environment-specific builds** - Don't use dev config in production
4. **Validate environment on startup** - The app validates required variables
5. **Use TypeScript for type safety** - Environment variables are typed

## Docker Deployment

When deploying with Docker, set environment variables in:

1. Docker Compose file:
   ```yaml
   environment:
     - NEXT_PUBLIC_API_URL=https://api.ishswami.in
   ```

2. Docker run command:
   ```bash
   docker run -e NEXT_PUBLIC_API_URL=https://api.ishswami.in ...
   ```

3. Kubernetes ConfigMap/Secrets:
   ```yaml
   env:
     - name: NEXT_PUBLIC_API_URL
       valueFrom:
         configMapKeyRef:
           name: app-config
           key: api-url
   ```

## CI/CD Integration

For CI/CD pipelines, set environment variables in your platform:

- **Vercel**: Project Settings → Environment Variables
- **Netlify**: Site Settings → Environment Variables
- **GitHub Actions**: Repository Secrets
- **GitLab CI**: CI/CD Variables

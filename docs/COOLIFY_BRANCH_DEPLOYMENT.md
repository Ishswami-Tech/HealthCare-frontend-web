# Coolify Mainline CI/CD

This frontend uses GitHub Actions as the release gate and Coolify as the runtime deployment platform.

The pipeline is mainline-only:

- pull requests to `main` run validation only
- pushes to `main` validate, deploy, and health-check
- manual dispatch supports deploying or rolling back to a specific commit SHA

## Coolify Setup

Create one Coolify application for this frontend repo:

- branch: `main`
- build pack: `Dockerfile`
- auto-deploy: disabled
- health check path: `/api/health`

Coolify keeps previous application images available for rollback, and the GitHub workflow rolls back to the last successful release tag if the new release fails health checks.

## Required GitHub Secrets

Add these repository secrets in GitHub:

- `COOLIFY_API_URL`
- `COOLIFY_API_TOKEN`
- `COOLIFY_APP_UUID`
- `COOLIFY_HEALTHCHECK_URL`

## Required Coolify Permissions

Create a Coolify API token with at least:

- `read`
- `write`
- `deploy`

Restrict the token to the team that owns this frontend app.

## What The Workflow Does

1. Runs lint, type-check, contract validation, and build checks.
2. Reads the currently deployed commit SHA from Coolify.
3. Updates the Coolify application to the target commit SHA.
4. Starts a deployment through the Coolify API.
5. Polls the app health endpoint until it returns `200`.
6. If the release fails health checks, restores the last successful tag and redeploys it automatically.
7. Marks the workflow as failed after rollback so the broken release is visible in GitHub Actions.

## Manual Rollback

Use GitHub Actions `workflow_dispatch` and provide the target commit SHA in `target_sha`.

That redeploys the app to the selected commit and uses the same health-check gate.

## Docker Build

The repository includes a production `Dockerfile` for Coolify:

- build stage runs `npm ci` and `npm run build`
- runtime stage launches the Next.js standalone server
- health endpoint is exposed at `/api/health`
- a successful production deploy moves the `coolify-prod-last-success` git tag to the healthy commit
- unhealthy deploys roll back to that tag
- if no previous successful deployment exists yet, the workflow fails with a clear error instead of guessing a fallback

## Production Runtime Variables

Keep Coolify environment values aligned with production:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_WEBSOCKET_URL`
- auth, payment, and feature-flag variables required by production

## Rollback Notes

- Coolify rollback images are for application code, not database or persistent-storage recovery.
- Keep database and volume backups separate.
- If a release changes persistence or schema, validate rollback compatibility before deploying.

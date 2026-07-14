# Ramin Starter Frontend

React Router SPA starter with feature-oriented query hooks, TanStack Query, Cognito OIDC authentication, generated OpenAPI types, and a Capacitor-ready build.

## Local Development

```bash
npm ci
cp .env.example .env
npm run dev
```

The development server runs at `http://localhost:5173` and expects the backend at `http://localhost:3000/api` by default.

## Verification

```bash
npm run verify
```

Verification type-checks, tests, and produces the static `build/client` output. Contract generation is intentionally separate because backend and frontend are independent repositories:

```bash
npm run contract:generate
```

Run contract generation when the sibling backend OpenAPI document changes, then commit the generated client update.

## GitHub Deployment

Frontend CI verifies pull requests and pushes to `main`. Deployment is intentionally manual through the `Deploy Static Site` workflow. Configure the repository variables emitted by Terraform's `github_frontend_repository_variables` output before running it.

The workflow builds with the Cognito and API variables, uploads immutable assets without deleting files that an older browser shell may still reference, applies separate cache headers to the app shell, waits for CloudFront invalidation, and checks the public URL. It authenticates through GitHub OIDC and requires no static AWS keys.

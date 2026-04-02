# Vercel Production Deployment Audit — 2026-04-02 (UTC)

## Scope requested
1. Identify active deployment in Vercel Project → Deployments.
2. Compare active deployment commit SHA with latest commit on GitHub `production` branch.
3. If different, trigger redeploy from latest commit with build cache cleared.
4. After redeploy is ready, verify live URL reflects expected change.
5. Capture screenshot of Deployments page (commit + status) for audit trail.

## Environment checks performed

```bash
pwd
# /workspace/SNBT
```

```bash
vercel --version
# /bin/bash: vercel: command not found
```

```bash
npx --yes vercel --version
# npm error code E403
# npm error 403 Forbidden - GET https://registry.npmjs.org/vercel
```

```bash
gh --version
# /bin/bash: gh: command not found
```

```bash
env | rg -i 'vercel|github|gh_|token|prod'
# GH_PAGER=cat
```

## Result
Audit execution is **blocked** in this container because:
- Vercel CLI is not installed and cannot be installed from npm registry (403 policy restriction).
- GitHub CLI is not installed.
- No Vercel/GitHub API token is exposed in environment variables.
- Local git repository has no configured remote URL, so `production` branch status on GitHub cannot be queried from this environment.

## Requested actions status
- [ ] Step 1 — Active deployment identified in Vercel dashboard.
- [ ] Step 2 — SHA comparison against GitHub `production` latest commit.
- [ ] Step 3 — Redeploy triggered with clear build cache.
- [ ] Step 4 — Live URL post-redeploy visual verification.
- [ ] Step 5 — Deployments-page screenshot captured.

## Minimum requirements to unblock
Provide at least one of the following in a follow-up run:
1. `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` and network access to Vercel API; or
2. Vercel CLI availability with authenticated session; and
3. GitHub repository remote + access token (`GITHUB_TOKEN` / `GH_TOKEN`) to read `production` branch head SHA.

Once available, the full audit + redeploy flow can be executed end-to-end.

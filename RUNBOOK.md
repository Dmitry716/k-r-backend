# k-r.by Incident Runbook (Backend)

## Scope

This runbook is for fast diagnostics and recovery when `k-r.by` or API endpoints fail.

---

## 1) External health check (from Windows PowerShell)

```powershell
curl.exe -I "https://k-r.by"
curl.exe -I "https://k-r.by/api/health"
curl.exe -I "https://k-r.by/api/monuments?limit=1"
```

Expected:
- all return `HTTP/1.1 200 OK`

Interpretation:
- site `200`, API `502/404` -> backend/proxy issue
- site `5xx` -> proxy/frontend issue

---

## 2) VPS container state

```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

Expected containers:
- `backend-backend-1` (`healthy`)
- `backend-db-1`
- `frontend-frontend-1`
- `frontend-proxy-1`

---

## 3) Local checks on VPS

```bash
curl -I http://localhost:3001/health
curl -I http://localhost:3001/api/health
curl -I "http://localhost:3001/api/monuments?limit=1"
curl -I http://localhost:3000
```

If local checks are OK but external checks fail, focus on Caddy/proxy/network.

---

## 4) Logs (backend and proxy)

```bash
docker logs --since 15m backend-backend-1
docker logs --since 15m frontend-proxy-1
```

Notes:
- Old `502` lines in proxy logs may be historical; prefer `--since` windows.
- `connect refused`/timeout on proxy upstream indicates routing/upstream issue.

---

## 5) Caddy upstream sanity

File:
- `/home/user/frontend/Caddyfile`

API and uploads must point to:
- `reverse_proxy backend:3001`

and not:
- `host.docker.internal:3001`

Quick check:
```bash
grep -n "reverse_proxy" /home/user/frontend/Caddyfile
```

---

## 6) GitHub Actions deploy status (backend)

From local PowerShell in backend repo:

```powershell
gh run list --workflow deploy.yml --limit 5
gh run view <RUN_ID> --log-failed
```

If default repo is not configured:
```powershell
gh repo set-default Dmitry716/k-r-backend
```

Alternative without default repo:
```powershell
gh run list -R Dmitry716/k-r-backend --workflow deploy.yml --limit 5
gh run view -R Dmitry716/k-r-backend <RUN_ID> --log-failed
```

Important:
- Use real run ID number, do not type angle brackets.

---

## 7) Known failure patterns and actions

### A) `ssh: unable to authenticate ... publickey`

Root cause:
- bad/missing `VPS_KEY` secret or key mismatch in `authorized_keys`

Fix:
1. Ensure deploy public key exists in `~/.ssh/authorized_keys` on VPS.
2. Update repo secret `VPS_KEY` with full private key.
3. Verify local key login:
   ```powershell
   ssh -i "$env:USERPROFILE\.ssh\k_rby_deploy" user@93.125.123.134 "echo OK_DEPLOY_KEY"
   ```
4. Re-run failed workflow.

### B) `git fetch ... HTTP 500` in deploy step

Root cause:
- temporary GitHub-side issue

Fix:
- re-run the job (usually succeeds on retry).

### C) API `502` via Caddy

Root cause:
- broken upstream route or backend unavailable

Fix:
1. Verify Caddy upstream points to `backend:3001`.
2. Check `backend-backend-1` health.
3. Restart proxy if config changed:
   ```bash
   cd /home/user/frontend && docker compose restart proxy
   ```

---

## 8) Deploy workflow baseline

Backend deploy workflow should include:
- smoke check to `http://localhost:3001/api/health`
- `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: "true"` in job `env`

---

## 9) Incident pattern: "works images are broken/404"

Symptoms:
- `/works` page shows broken image icons.
- `GET /api/works` returns records, but image URLs return `404`.

Quick triage:
```bash
curl -I "http://localhost:3001/api/static/works/%D0%A1-77.jpg"
docker compose exec -T backend sh -lc 'echo "$FRONTEND_PUBLIC_PATH"; ls -lah "$FRONTEND_PUBLIC_PATH/works" | head -n 10'
ls -lah /home/user/frontend/public/works | head -n 10
```

Expected:
- backend serves `200` for known file.
- backend container can read `$FRONTEND_PUBLIC_PATH/works`.

Root causes seen in production:
- wrong `FRONTEND_PUBLIC_PATH` in `/home/user/backend/.env`
- missing bind mount for frontend public files in backend compose
- mojibake filenames (`Ð...`/`Ñ...`) in `/home/user/frontend/public/works`

Required backend compose mount:
```yaml
services:
  backend:
    volumes:
      - /home/user/frontend/public:/home/user/frontend/public:ro
```

Mojibake repair (run on VPS):
```bash
sudo python3 - <<'PY'
from pathlib import Path
p = Path("/home/user/frontend/public/works")
for f in list(p.iterdir()):
    if not f.is_file():
        continue
    name = f.name
    if "Ð" not in name and "Ñ" not in name:
        continue
    fixed = name.encode("latin1").decode("utf-8")
    target = f.with_name(fixed)
    if not target.exists():
        f.rename(target)
PY
```

Mass validation (all works images):
```bash
python3 - <<'PY'
import json, urllib.request, urllib.parse, urllib.error
with urllib.request.urlopen("http://localhost:3001/api/works", timeout=20) as r:
    works = json.load(r).get("data", [])
ok, bad = 0, 0
for w in works:
    raw = w.get("image", "")
    path = raw.split("/api/static/", 1)[-1]
    url = "http://localhost:3001/api/static/" + urllib.parse.quote(path, safe="/._-")
    try:
        code = urllib.request.urlopen(urllib.request.Request(url, method="HEAD"), timeout=10).getcode()
    except urllib.error.HTTPError as e:
        code = e.code
    except Exception:
        code = 0
    if code == 200:
        ok += 1
    else:
        bad += 1
print(f"TOTAL={len(works)} OK={ok} BAD={bad}")
PY
```


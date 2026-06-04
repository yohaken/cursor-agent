# AGENTS.md

Guidance for AI agents working in this repository.

## Project status

This repository is currently a **greenfield placeholder** named `cursor-agent`. It contains only `README.md` and has no application source, dependency manifests, tests, or deployment configuration yet.

## Cursor Cloud specific instructions

### What exists today

- **Tracked files:** `README.md` only (plus this file once merged).
- **Services:** None. There is no `docker-compose`, no dev server, and no database to start.
- **Lint / test / build:** No project scripts are defined. Do not assume `npm test`, `make lint`, etc. exist until manifests are added.

### VM toolchain (available without repo setup)

The Cloud Agent VM already provides common tooling for when code is added:

| Tool | Notes |
|------|--------|
| **Node.js** | v22 via nvm (`node`, `npm`) |
| **Python** | 3.12 (`python3`) |
| **Git** | Repo is on `main`, tracking `origin/main` |

### Update script behavior

The VM startup update script is intentionally a **no-op** (`true`) until this repo declares dependencies (for example `package.json`, `requirements.txt`, or `pyproject.toml`). After adding those files, extend the update script in `.cursor/environment.json` / SetupVmEnvironment to run the appropriate install command (for example `npm ci` guarded by `[ -f package.json ]`).

### When application code is added

1. Document required services and start commands in `README.md` and expand this section.
2. Add the real install step to the VM update script.
3. List non-obvious gotchas here (port conflicts, env files, migrations, etc.)—not one-off setup steps.

### Quick verification (no app yet)

Until an application exists, “environment works” means:

```bash
cd /workspace
git status
node --version
python3 --version
```

All commands should succeed; `git status` should show a clean tree on `main` (or your feature branch).

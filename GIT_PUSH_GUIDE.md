# Git Push Guide (Already Cloned Repo)

This guide explains exactly how to push your local project changes to your GitHub repository after cloning.

---

## 1) Confirm you are in the project folder

Open terminal and run:

```bash
pwd
```

If needed, move into your repo:

```bash
cd "C:\Users\HP\OneDrive\Desktop\Federal-Housing-Corporation"
```

---

## 2) Check current Git status

```bash
git status
```

You will see:

- modified files (changed)
- untracked files (new)
- branch info (`main`, `master`, or a feature branch)

---

## 3) Make sure remote is connected to your GitHub repo

```bash
git remote -v
```

You should see something like:

- `origin https://github.com/<your-username>/<your-repo>.git`

If `origin` is missing, add it:

```bash
git remote add origin https://github.com/<your-username>/<your-repo>.git
```

---

## 4) Pull latest changes before pushing (important)

This avoids conflicts when GitHub has newer commits.

```bash
git pull origin main
```

If your default branch is `master`, use:

```bash
git pull origin master
```

---

## 5) Stage files

Stage all changes:

```bash
git add .
```

Or stage specific files:

```bash
git add frontend/src/services/api.ts
git add DEPLOYMENT_VERCEL_RENDER_GUIDE.md
```

Check staged result:

```bash
git status
```

---

## 6) Commit with a clear message

```bash
git commit -m "Add deployment guide and prepare frontend API config for production"
```

If Git says nothing to commit, it means files were not changed/staged.

---

## 7) Push to GitHub

### If branch is already tracked:

```bash
git push
```

### If this is the first push of this branch:

```bash
git push -u origin <branch-name>
```

Examples:

```bash
git push -u origin main
git push -u origin feature/deployment-guide
```

`-u` sets upstream so future pushes can use just `git push`.

---

## 8) Verify on GitHub

1. Open your repo on GitHub in browser.
2. Refresh page.
3. Confirm new commit appears in **Commits** and files are updated.

---

## 9) Recommended daily workflow

Use this sequence every time:

```bash
git pull origin main
git add .
git commit -m "Your message"
git push
```

If you work on feature branches:

```bash
git checkout -b feature/some-change
git add .
git commit -m "Implement some change"
git push -u origin feature/some-change
```

Then open a Pull Request on GitHub.

---

## 10) Common errors and fixes

### A) `fatal: not a git repository`

You are outside repo folder.

Fix:

```bash
cd "C:\Users\HP\OneDrive\Desktop\Federal-Housing-Corporation"
```

### B) `rejected` / `non-fast-forward`

Remote has commits you do not have.

Fix:

```bash
git pull origin main
# resolve conflicts if prompted
git add .
git commit -m "Resolve merge conflicts"
git push
```

### C) `src refspec main does not match any`

No commit exists yet, or branch name is different.

Fix:

```bash
git branch
git add .
git commit -m "Initial commit"
git push -u origin main
```

If branch is `master`, push `master`.

### D) Authentication failed

Use GitHub Personal Access Token (PAT) instead of password for HTTPS.

Quick fix:

1. Create PAT on GitHub with repo permissions.
2. Use GitHub username + PAT when prompted.
3. Optionally install Git Credential Manager to save credentials.

---

## 11) Files you should NOT push

Do not push secrets or local config files, for example:

- `.env`
- `.env.local`
- private keys
- API secrets

Use `.env.example` files for templates (safe to push).

---

## 12) One full practical example

```bash
cd "C:\Users\HP\OneDrive\Desktop\Federal-Housing-Corporation"
git status
git pull origin main
git add .
git commit -m "Add deployment docs and production setup improvements"
git push
```

---

## 13) Quick command reference

```bash
git status
git remote -v
git pull origin main
git add .
git commit -m "message"
git push
git push -u origin <branch>
git log --oneline -n 5
```


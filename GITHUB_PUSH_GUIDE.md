# Push to GitHub – Fix "fatal: Could not read from remote repository"

## 1. Flatten folders (only if you have a nested structure)

**Run these only if** your `package.json` is inside `C:\fraud-alert-system-v1\fraud-alert-system-v1\` and you want it at `C:\fraud-alert-system-v1\`.

Open **PowerShell** and run:

```powershell
cd C:\fraud-alert-system-v1

# If you have an inner 'fraud-alert-system-v1' folder:
if (Test-Path "fraud-alert-system-v1") {
  Get-ChildItem "fraud-alert-system-v1" -Force | ForEach-Object { Move-Item $_.FullName -Destination . -Force -ErrorAction SilentlyContinue }
  Remove-Item "fraud-alert-system-v1" -Recurse -Force -ErrorAction SilentlyContinue
  Write-Host "Flatten done. package.json should now be in C:\fraud-alert-system-v1"
} else {
  Write-Host "No nested folder – project is already flat."
}
```

Then delete the (now empty) inner folder if it still exists:

```powershell
Remove-Item "C:\fraud-alert-system-v1\fraud-alert-system-v1" -Recurse -Force -ErrorAction SilentlyContinue
```

**Note:** In the current repo there is no nested folder; `package.json` is already at `C:\fraud-alert-system-v1`. Use the commands above only if your machine has the nested layout.

---

## 2. Security updates (already done in this project)

- **OTP text:** The UI already shows **"OTP"** (not "Your Demo OTP is") in `src/lib/translations.js`.
- **IP tracking:** Checkout already calls `/api/ip/log` with `accountId`; if more than 2 distinct IPs for one account within 5 minutes, the API returns HIGH RISK and the UI shows **ACCOUNT BANNED**.

No extra changes needed unless you want to tweak copy or logic.

---

## 3. Git: remove and re-add `origin`

Run from `C:\fraud-alert-system-v1`:

```powershell
cd C:\fraud-alert-system-v1

# Remove current remote
git remote remove origin

# Re-add with HTTPS (use this when you push with a Personal Access Token)
git remote add origin https://github.com/vihaanj4ck/fraud-alert.git

# Confirm
git remote -v
```

You should see:

- `origin  https://github.com/vihaanj4ck/fraud-alert.git (fetch)`
- `origin  https://github.com/vihaanj4ck/fraud-alert.git (push)`

If your repo is under a different user/org or repo name, replace `vihaanj4ck/fraud-alert` in the URL.

---

## 4. Push using a Personal Access Token (PAT)

If you don’t have an SSH key on this laptop, use HTTPS + PAT.

### Create a PAT on GitHub

1. GitHub → **Settings** (your profile) → **Developer settings** → **Personal access tokens** → **Tokens (classic)**.
2. **Generate new token (classic)**.
3. Name it (e.g. `fraud-alert-push`), choose an expiry, and enable at least **repo**.
4. Generate and **copy the token once** (you won’t see it again).

### Push using the PAT

From `C:\fraud-alert-system-v1`:

```powershell
cd C:\fraud-alert-system-v1

# Stage and commit if you have changes
git add -A
git status
git commit -m "Your commit message"   # only if there are changes to commit

# Push (HTTPS + PAT)
git push -u origin main
```

When Git asks for credentials:

- **Username:** your GitHub username (e.g. `vihaanj4ck`).
- **Password:** paste your **Personal Access Token** (not your GitHub account password).

To avoid typing the PAT every time, you can cache it:

```powershell
git config --global credential.helper store
```

After the next successful `git push`, Git will save the credentials (including the PAT) for future pushes.

---

## Quick checklist

1. [ ] Flatten folders only if you have nested `fraud-alert-system-v1` (optional in current repo).
2. [ ] `git remote remove origin` then `git remote add origin https://github.com/vihaanj4ck/fraud-alert.git`.
3. [ ] Create a PAT on GitHub with **repo** scope.
4. [ ] `git add -A`, `git commit -m "..."` (if needed), then `git push -u origin main` and use PAT as password.

If you still get "Could not read from remote repository", double-check the repo URL and that the PAT has **repo** access and isn’t expired.

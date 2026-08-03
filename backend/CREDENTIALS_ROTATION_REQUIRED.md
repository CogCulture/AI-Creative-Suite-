# ⚠️ CREDENTIALS ROTATION REQUIRED

The Gmail app password that was previously stored in `backend/.env` has been removed from the file.

## What you MUST do immediately

1. **Revoke the exposed Gmail app password:**
   - Go to https://myaccount.google.com/apppasswords
   - Delete the app password for `tushar.yadav@cogculture.agency` that was in the .env
   - Generate a new app password

2. **Set the new credentials in your production .env on the VM:**
   ```
   MAIL_USERNAME=tushar.yadav@cogculture.agency
   MAIL_PASSWORD=<new app password>
   MAIL_FROM=tushar.yadav@cogculture.agency
   ```

3. **Check git history:**
   If the .env was ever committed, the old password is still in git history.
   Run: `git log --all --full-history -- backend/.env`
   If commits exist, you need to rewrite history or treat the credential as permanently exposed.

## Going forward
- Never put real credentials in .env files that are checked in
- Use environment variables injected at deploy time, or a secrets manager (AWS Secrets Manager, HashiCorp Vault, etc.)

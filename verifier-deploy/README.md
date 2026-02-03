# Concordium Verifier Service - Render Deployment

This directory contains the configuration to deploy the Concordium Credential Verification Service to Render.com for free.

## Deployment Steps

1. Go to https://render.com and sign up with GitHub (free, no credit card)

2. Click "New" > "Web Service"

3. Connect this GitHub repository

4. Configure the service:
   - **Name**: `concordium-verifier` (or your choice)
   - **Root Directory**: `verifier-deploy`
   - **Environment**: Docker
   - **Plan**: Free

5. Add environment variable:
   - **Key**: `ACCOUNT_KEY_BASE64`
   - **Value**: Your base64-encoded account key (see below)

6. Click "Create Web Service"

## Getting Your Base64 Key

Run this command locally:
```bash
base64 -i keys/private.export | tr -d '\n'
```

Copy the entire output and paste it as the `ACCOUNT_KEY_BASE64` environment variable in Render.

## Testing

After deployment, test with:
```bash
curl https://your-service-name.onrender.com/health
```

## Notes

- Free tier spins down after 15 minutes of inactivity (first request takes ~30s to wake)
- The account key is securely stored as an environment variable (not in the image)

#!/bin/sh
if [ -n "$ACCOUNT_KEY_BASE64" ]; then
  echo "$ACCOUNT_KEY_BASE64" | base64 -d > /keys/private.export
  echo "Account key written to /keys/private.export"
else
  echo "ERROR: ACCOUNT_KEY_BASE64 environment variable not set"
  exit 1
fi
exec /usr/local/bin/credential-verification-service

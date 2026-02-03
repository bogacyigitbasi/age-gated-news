FROM concordium/credential-verification-service:0.1.0

# Create keys directory
RUN mkdir -p /keys

# Create entrypoint script that decodes the base64 key at runtime
RUN echo '#!/bin/sh' > /entrypoint.sh && \
    echo 'if [ -n "$ACCOUNT_KEY_BASE64" ]; then' >> /entrypoint.sh && \
    echo '  echo "$ACCOUNT_KEY_BASE64" | base64 -d > /keys/private.export' >> /entrypoint.sh && \
    echo '  echo "Account key written to /keys/private.export"' >> /entrypoint.sh && \
    echo 'else' >> /entrypoint.sh && \
    echo '  echo "ERROR: ACCOUNT_KEY_BASE64 environment variable not set"' >> /entrypoint.sh && \
    echo '  exit 1' >> /entrypoint.sh && \
    echo 'fi' >> /entrypoint.sh && \
    echo 'exec /credential-verification-service' >> /entrypoint.sh && \
    chmod +x /entrypoint.sh

ENV CCD_NETWORK=testnet
ENV CCD_GRPC_IP=grpc.testnet.concordium.com
ENV CCD_GRPC_PORT=20000
ENV LOG_LEVEL=info
ENV ACCOUNT_KEYS_PATH=/keys/private.export

EXPOSE 8000

ENTRYPOINT ["/entrypoint.sh"]

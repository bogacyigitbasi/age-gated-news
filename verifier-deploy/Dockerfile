# Copy binary from Concordium image
FROM --platform=linux/amd64 concordium/credential-verification-service:0.1.0 AS concordium

# Use Debian slim (glibc-based)
FROM --platform=linux/amd64 debian:bookworm-slim

# Install required libs first
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    libstdc++6 \
    && rm -rf /var/lib/apt/lists/*

# Create keys directory
RUN mkdir -p /keys

# Copy entrypoint
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Copy only the binary from Concordium (Debian already has compatible glibc)
COPY --from=concordium /usr/local/bin/credential-verification-service /usr/local/bin/credential-verification-service

# Environment variables using the correct names from CLI help
ENV CREDENTIAL_VERIFICATION_SERVICE_NODE_GRPC_ENDPOINT=https://grpc.testnet.concordium.com:20000
ENV CREDENTIAL_VERIFICATION_SERVICE_ACCOUNT=/keys/private.export
ENV CREDENTIAL_VERIFICATION_SERVICE_API_ADDRESS=0.0.0.0:8000
ENV CREDENTIAL_VERIFICATION_SERVICE_MONITORING_ADDRESS=0.0.0.0:8001
ENV CREDENTIAL_VERIFICATION_SERVICE_LOG_LEVEL=info

EXPOSE 8000

ENTRYPOINT ["/entrypoint.sh"]

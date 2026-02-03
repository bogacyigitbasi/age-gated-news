# Stage 1: Prepare files and get busybox (for shell)
FROM alpine:3.19 AS builder

RUN mkdir -p /app/keys

COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Stage 2: Final image
FROM concordium/credential-verification-service:0.1.0

# Copy busybox (provides /bin/sh) from Alpine since base image has no shell
COPY --from=builder /bin/busybox /bin/busybox
COPY --from=builder /bin/sh /bin/sh
COPY --from=builder /bin/base64 /bin/base64

COPY --from=builder /app/entrypoint.sh /entrypoint.sh
COPY --from=builder /app/keys /keys

ENV CCD_NETWORK=testnet
ENV CCD_GRPC_IP=grpc.testnet.concordium.com
ENV CCD_GRPC_PORT=20000
ENV LOG_LEVEL=info
ENV ACCOUNT_KEYS_PATH=/keys/private.export

EXPOSE 8000

ENTRYPOINT ["/entrypoint.sh"]

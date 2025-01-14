# Build stage
FROM docker.io/library/golang:alpine AS builder

RUN apk add --no-cache \
    curl \
    gcc \
    g++ \
    musl-dev \
    build-base \
    libc6-compat

ARG HUGO_VERSION
ENV HUGO_VERSION=${HUGO_VERSION:-0.111.3}

RUN mkdir $HOME/src && \
    cd $HOME/src && \
    curl -L https://github.com/gohugoio/hugo/archive/refs/tags/v${HUGO_VERSION}.tar.gz | tar -xz && \
    cd "hugo-${HUGO_VERSION}" && \
    go install --tags extended

# Runtime stage
FROM docker.io/library/golang:alpine

WORKDIR /src

# Install python and python-pip
RUN apk add --no-cache \
    python3 \
    py3-pip \
    py3-click \
    py3-yaml \
    wget \
    unzip

# Copy Hugo binary from builder
COPY --from=builder /go/bin/hugo /usr/local/bin/hugo

# Copy the entrypoint script
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Set the entrypoint
ENTRYPOINT ["/app/entrypoint.sh"]

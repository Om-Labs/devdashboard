# Multi-stage build for Claude Code UI
FROM node:24-alpine AS base

# Install system dependencies for native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git \
    bash \
    && rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the React application
RUN npm run build

# Production stage
FROM node:24-alpine AS production

# Install runtime dependencies and build tools for native modules
RUN apk add --no-cache \
    bash \
    git \
    python3 \
    make \
    g++ \
    curl \
    && rm -rf /var/cache/apk/*

# Install GitHub CLI
RUN curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg \
    && chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | tee /etc/apt/sources.list.d/github-cli.list > /dev/null || true

# For Alpine, install GitHub CLI differently
RUN apk add --no-cache github-cli || \
    (curl -sSL https://github.com/cli/cli/releases/latest/download/gh_*_linux_amd64.tar.gz | tar -xz -C /tmp && \
     mv /tmp/gh_*/bin/gh /usr/local/bin/ && \
     rm -rf /tmp/gh_*)

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S claude -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from build stage
COPY --from=base /app/dist ./dist
COPY --from=base /app/server ./server
COPY --from=base /app/public ./public

# Create necessary directories
RUN mkdir -p /app/database && \
    mkdir -p /home/claude/.claude/projects && \
    chown -R claude:nodejs /app && \
    chown -R claude:nodejs /home/claude

# Switch to non-root user
USER claude

# Expose port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3002/api/config', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# Start the application
CMD ["npm", "start"] 
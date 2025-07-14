# Docker Setup for Claude Code UI

This document provides instructions for running Claude Code UI using Docker.

## Quick Start

### Using Docker Compose (Recommended)

1. **Build and run the application:**
   ```bash
   docker-compose up --build
   ```

2. **Access the application:**
   Open your browser and navigate to `http://localhost:3002`

3. **Stop the application:**
   ```bash
   docker-compose down
   ```

### Using Docker directly

1. **Build the image:**
   ```bash
   docker build -t claude-code-ui .
   ```

2. **Run the container:**
   ```bash
   docker run -d \
     --name claude-code-ui \
     -p 3002:3002 \
     -v claude_projects:/home/claude/.claude/projects \
     -v claude_database:/app/database \
     claude-code-ui
   ```

3. **Access the application:**
   Open your browser and navigate to `http://localhost:3002`

## Configuration

### Environment Variables

You can customize the application by setting environment variables:

- `PORT`: Server port (default: 3002)
- `NODE_ENV`: Environment mode (default: production)
- `HOME`: Home directory for the claude user (default: /home/claude)

### Volumes

The application uses several volumes for data persistence:

- `claude_projects`: Stores Claude project files
- `claude_database`: Stores the SQLite database

### Development with Docker

For development, you can mount your local workspace:

```bash
docker run -d \
  --name claude-code-ui-dev \
  -p 3002:3002 \
  -v claude_projects:/home/claude/.claude/projects \
  -v claude_database:/app/database \
  -v $(pwd)/workspace:/workspace:ro \
  claude-code-ui
```

## Troubleshooting

### Check container logs:
```bash
docker logs claude-code-ui
```

### Access container shell:
```bash
docker exec -it claude-code-ui /bin/bash
```

### Health check:
The container includes a health check that verifies the API is responding:
```bash
docker ps
```

### Clean up:
```bash
# Stop and remove containers
docker-compose down

# Remove volumes (WARNING: This will delete all data)
docker volume rm claudecodeui_claude_projects claudecodeui_claude_database

# Remove images
docker rmi claude-code-ui
```

## Security Notes

- The application runs as a non-root user (`claude`)
- The container includes only necessary runtime dependencies
- Health checks ensure the application is running properly
- Volumes are used for data persistence without exposing host directories

## Production Deployment

For production deployment, consider:

1. Using a reverse proxy (nginx, traefik)
2. Setting up SSL/TLS certificates
3. Configuring proper logging
4. Setting up monitoring and alerting
5. Using Docker secrets for sensitive configuration

Example with nginx reverse proxy:
```yaml
version: '3.8'
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - claude-code-ui
    restart: unless-stopped

  claude-code-ui:
    build: .
    expose:
      - "3002"
    environment:
      - NODE_ENV=production
      - PORT=3002
    volumes:
      - claude_projects:/home/claude/.claude/projects
      - claude_database:/app/database
    restart: unless-stopped

volumes:
  claude_projects:
  claude_database:
``` 
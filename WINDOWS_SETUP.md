# Windows Setup Guide for Claude Code UI

This guide explains how to run Claude Code UI in Docker and configure it to work with your Windows X: drive repositories.

## How It Works

The Claude Code UI application discovers projects from `~/.claude/projects/` directory, which contains metadata about your Claude CLI sessions. However, the actual project files are stored in their original locations (your X: drive repositories).

When you run Claude CLI in a project directory, it creates session files in `~/.claude/projects/` that reference the actual project paths. The UI reads these session files to discover your projects and their actual file locations.

## Quick Start for Windows Users

### Option 1: Use the Windows-specific Docker Compose file

1. **Use the provided Windows configuration:**
   ```bash
   docker-compose -f docker-compose.windows.yml up --build
   ```

2. **Access the application:**
   Open your browser and navigate to `http://localhost:3002`

### Option 2: Create your own custom configuration

1. **Create a custom docker-compose.yml:**
   ```yaml
   version: '3.8'
   
   services:
     claude-code-ui:
       build:
         context: .
         dockerfile: Dockerfile
       ports:
         - "3002:3002"
       environment:
         - NODE_ENV=production
         - PORT=3002
         - HOME=/home/claude
       volumes:
         # Mount the Claude projects directory for persistence
         - claude_projects:/home/claude/.claude/projects
         # Mount the database directory for persistence
         - claude_database:/app/database
         # Mount your Windows X: drive repositories
         - /x/Repos:/workspace:ro
       restart: unless-stopped
   
   volumes:
     claude_projects:
       driver: local
     claude_database:
       driver: local
   ```

2. **Run the application:**
   ```bash
   docker-compose up --build
   ```

## Setting Up Your Projects

### Step 1: Initialize Claude CLI in Your Projects

Before the UI can discover your projects, you need to run Claude CLI in each project directory at least once:

1. **Navigate to your project directory:**
   ```bash
   cd /x/Repos/your-project-name
   ```

2. **Run Claude CLI:**
   ```bash
   claude
   ```

3. **Have a brief conversation or just exit:**
   This creates the necessary session files in `~/.claude/projects/`

### Step 2: Verify Project Discovery

1. **Start the Docker container:**
   ```bash
   docker-compose -f docker-compose.windows.yml up --build
   ```

2. **Open the UI:** `http://localhost:3002`

3. **Check the sidebar:** Your projects should appear in the project list

## Understanding the Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Windows Host                           │
│  ┌─────────────────┐    ┌─────────────────┐              │
│  │   X:\Repos\     │    │   Docker        │              │
│  │   your-project  │◄──►│   Container     │              │
│  │   (actual files)│    │   /workspace/   │              │
│  └─────────────────┘    └─────────────────┘              │
└─────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                        ┌─────────────────┐
                        │   Claude Code   │
                        │   UI Server     │
                        │   ~/.claude/    │
                        │   projects/     │
                        └─────────────────┘
```

### How Project Discovery Works

1. **Claude CLI Sessions:** When you run `claude` in a project directory, it creates session files in `~/.claude/projects/`
2. **Session Metadata:** These session files contain the actual project path (`cwd` field)
3. **UI Discovery:** The UI reads these session files to discover your projects and their real file locations
4. **File Access:** The UI accesses your actual project files through the mounted volume

## Troubleshooting

### "No projects found" Error

**Problem:** The UI shows no projects even after running Claude CLI in your directories.

**Solutions:**
1. **Verify Claude CLI is installed:**
   ```bash
   claude --version
   ```

2. **Check if sessions were created:**
   ```bash
   docker exec -it claude-code-ui ls -la /home/claude/.claude/projects/
   ```

3. **Run Claude CLI in your project directories:**
   ```bash
   cd /x/Repos/your-project
   claude
   # Have a brief conversation or just exit
   ```

### File Access Issues

**Problem:** Can't access files or get permission errors.

**Solutions:**
1. **Check volume mounting:**
   ```bash
   docker exec -it claude-code-ui ls -la /workspace/
   ```

2. **Verify file permissions:**
   ```bash
   docker exec -it claude-code-ui ls -la /workspace/your-project
   ```

3. **Check Windows file sharing:**
   - Ensure Docker Desktop has access to your X: drive
   - In Docker Desktop settings, go to "Resources" → "File sharing"
   - Add your X: drive if it's not already listed

### Docker Desktop Configuration

1. **Enable file sharing:**
   - Open Docker Desktop
   - Go to Settings → Resources → File sharing
   - Add your X: drive to the list

2. **Restart Docker Desktop** after making changes

## Advanced Configuration

### Mounting Specific Projects

If you want to mount only specific projects instead of the entire Repos directory:

```yaml
volumes:
  # Mount specific projects
  - /x/Repos/project1:/workspace/project1:ro
  - /x/Repos/project2:/workspace/project2:ro
  - /x/Repos/project3:/workspace/project3:ro
```

### Using Different Drive Letters

If your repositories are on a different drive (e.g., D: drive):

```yaml
volumes:
  # Mount D: drive repositories
  - /d/Repos:/workspace:ro
```

### Development Mode

For development with hot reloading:

```yaml
environment:
  - NODE_ENV=development
  - PORT=3002
  - HOME=/home/claude
volumes:
  # Mount source code for development
  - ./src:/app/src:ro
  - ./public:/app/public:ro
```

## Security Considerations

- **Read-only mounting:** The workspace is mounted as read-only (`:ro`) to prevent accidental modifications
- **Container isolation:** The application runs in a container with limited access to host files
- **User permissions:** The container runs as a non-root user for security

## Next Steps

1. **Start with one project:** Initialize Claude CLI in one of your repositories
2. **Test the UI:** Verify the project appears in the interface
3. **Add more projects:** Repeat the process for other repositories
4. **Configure tools:** Enable the tools you need in the UI settings

## Support

If you encounter issues:

1. **Check container logs:**
   ```bash
   docker logs claude-code-ui
   ```

2. **Access container shell:**
   ```bash
   docker exec -it claude-code-ui /bin/bash
   ```

3. **Verify file system access:**
   ```bash
   docker exec -it claude-code-ui ls -la /workspace/
   ``` 
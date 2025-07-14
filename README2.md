# Claude Code UI Architecture and Docker Implementation

## Overview

Claude Code UI is a web-based interface for the Claude Code CLI that runs in a Docker container. This document explains how the system works, particularly focusing on the Docker containerization and Claude Code CLI integration.

## Key Concepts

### 1. Claude Code CLI Installation

**Important:** The Claude Code CLI (`@anthropic-ai/claude-code`) is installed **inside** the Docker container, not on the host machine. The host computer does **not** need Claude installed.

Here's how it works:

- The Dockerfile includes `@anthropic-ai/claude-code` as a dependency in `package.json`
- During the Docker build process, npm installs Claude Code CLI inside the container
- The container provides the complete runtime environment including Node.js, the CLI, and all dependencies

### 2. Terminal Interaction Architecture

The Dashboard doesn't directly interact with the host computer's terminal. Instead, it creates a **virtualized terminal environment** inside the Docker container:

1. **Web Terminal (Frontend)**: Uses xterm.js to provide a terminal UI in the browser
2. **PTY (Pseudo-Terminal)**: The server uses `node-pty` to spawn shell processes inside the container
3. **Process Isolation**: All commands run in the container's isolated environment, not on the host

## System Architecture

```mermaid
graph TB
    subgraph "Host Computer"
        Browser[Web Browser<br/>Port 3002]
        Docker[Docker Engine]
    end
    
    subgraph "Docker Container"
        subgraph "Frontend (React)"
            UI[Web UI<br/>- Terminal Component<br/>- Chat Interface<br/>- File Explorer]
        end
        
        subgraph "Backend (Node.js)"
            Express[Express Server<br/>Port 3002]
            WS[WebSocket Server<br/>- /ws for chat<br/>- /shell for terminal]
            PTY[node-pty<br/>Terminal Emulator]
            Claude[Claude Code CLI<br/>@anthropic-ai/claude-code]
        end
        
        subgraph "Container Filesystem"
            Projects[/home/claude/.claude/projects<br/>Claude project metadata]
            Workspace[/workspace<br/>Optional mounted directory]
            AppData[/app<br/>Application code]
            DB[/app/database<br/>SQLite database]
        end
    end
    
    subgraph "Host Filesystem"
        HostProjects[Host Projects<br/>./workspace]
        HostDB[Host Database<br/>./database]
    end
    
    Browser -->|HTTP/WS| Express
    UI -->|WebSocket| WS
    WS -->|spawn| PTY
    PTY -->|exec| Claude
    Claude -->|reads/writes| Projects
    
    Docker -->|volume mount| Projects
    Docker -->|volume mount| Workspace
    Docker -->|volume mount| DB
    
    HostProjects -.->|mounted as| Workspace
    HostDB -.->|persisted to| DB
```

## How It Works

### 1. Container Startup Flow

```mermaid
sequenceDiagram
    participant User
    participant Docker
    participant Container
    participant NPM
    participant Server
    
    User->>Docker: docker-compose up
    Docker->>Container: Create container from Dockerfile
    Container->>NPM: npm install (including claude-code)
    NPM->>Container: Install all dependencies
    Container->>Server: npm start
    Server->>Server: Start Express on port 3002
    Server->>Server: Initialize WebSocket server
    Server->>User: Ready at http://localhost:3002
```

### 2. Claude Code CLI Execution Flow

```mermaid
sequenceDiagram
    participant Browser
    participant WebSocket
    participant Server
    participant PTY
    participant Claude CLI
    
    Browser->>WebSocket: Send command
    WebSocket->>Server: Process command
    Server->>PTY: spawn('claude', args)
    PTY->>Claude CLI: Execute in container
    Claude CLI->>Claude CLI: Process with AI
    Claude CLI->>PTY: Stream output
    PTY->>Server: Capture output
    Server->>WebSocket: Send response
    WebSocket->>Browser: Display result
```

### 3. File System Architecture

The container uses several volume mounts to persist data:

1. **claude_projects**: Stores Claude's project metadata
   - Host: Docker volume
   - Container: `/home/claude/.claude/projects`

2. **claude_database**: Stores application database
   - Host: Docker volume  
   - Container: `/app/database`

3. **workspace**: Optional development directory
   - Host: `./workspace`
   - Container: `/workspace` (read-only)

## Key Components

### Frontend (React + Vite)
- **Terminal Component**: Uses xterm.js for terminal emulation
- **Chat Interface**: WebSocket-based real-time messaging
- **File Explorer**: Browse and edit project files
- **Monaco Editor**: VSCode-like code editing

### Backend (Node.js + Express)
- **Express Server**: Handles HTTP requests and serves the frontend
- **WebSocket Server**: Manages real-time connections for:
  - Chat messages (`/ws`)
  - Terminal sessions (`/shell`)
- **PTY Handler**: Creates pseudo-terminals for CLI interaction
- **Claude CLI Integration**: Spawns and manages Claude processes

### Security Features
- **JWT Authentication**: Protects API endpoints
- **Process Isolation**: Commands run in container, not on host
- **Read-only Mounts**: Workspace mounted as read-only by default
- **Non-root User**: Container runs as 'claude' user, not root

## Git and GitHub Integration

### ✅ Git Functionality Included

The Docker container includes **full git functionality**:

1. **Git Installation**: Git is installed in the container (`git` package in Dockerfile:34)
2. **Complete Git API**: Comprehensive REST API for all git operations
3. **GitHub Integration**: Full support for GitHub repositories via HTTPS and SSH

### Git Features Available

#### Core Git Operations
- **Status**: View modified, added, deleted, and untracked files
- **Diff**: View changes for individual files or commits
- **Commit**: Stage and commit changes with custom messages
- **Branch Management**: Create, list, and checkout branches
- **History**: View commit log with author, date, and stats

#### Remote Repository Operations
- **Fetch**: Download latest changes from remote
- **Pull**: Fetch and merge remote changes
- **Push**: Upload local commits to remote repository
- **Publish**: Set upstream and push new branches
- **Remote Status**: Check ahead/behind commit counts

#### Advanced Features
- **Smart Remote Detection**: Automatically detects origin and upstream branches
- **Conflict Detection**: Identifies and reports merge conflicts
- **File Operations**: Discard changes, delete untracked files
- **Auto Commit Messages**: AI-generated commit messages based on changes

### GitHub Integration Details

```mermaid
graph LR
    subgraph "Container Git Setup"
        Git[Git CLI<br/>Installed in container]
        API[Git REST API<br/>30+ endpoints]
        UI[Git Panel UI<br/>Visual git interface]
    end
    
    subgraph "GitHub Integration"
        HTTPS[HTTPS Authentication<br/>Username/Token]
        SSH[SSH Authentication<br/>SSH Keys]
        Repos[GitHub Repositories<br/>Public & Private]
    end
    
    subgraph "Operations"
        Clone[git clone]
        Push[git push]
        Pull[git pull]
        Fetch[git fetch]
    end
    
    Git --> HTTPS
    Git --> SSH
    HTTPS --> Repos
    SSH --> Repos
    API --> Operations
    Operations --> Repos
```

### Authentication Options

#### 1. HTTPS with Personal Access Token
```bash
# Configure git in container terminal
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Clone with token
git clone https://username:token@github.com/username/repo.git

# Or configure credential helper
git config --global credential.helper store
```

#### 2. SSH Key Authentication
```bash
# Generate SSH key in container
ssh-keygen -t ed25519 -C "your.email@example.com"

# Add to SSH agent
ssh-add ~/.ssh/id_ed25519

# Add public key to GitHub account
cat ~/.ssh/id_ed25519.pub
```

### Using Git with Claude Code UI

1. **Visual Interface**: Use the Git Panel in the sidebar for GUI operations
2. **Terminal Access**: Use the integrated terminal for advanced git commands
3. **Claude Integration**: Claude can execute git commands directly
4. **File Editing**: Edit files with syntax highlighting and git diff integration

### Container Git Environment

The container provides a complete git environment:
- **User Configuration**: Set up once, persists via volumes
- **SSH Keys**: Store in container for GitHub authentication  
- **Credential Storage**: Save GitHub tokens securely
- **Git History**: Full access to repository history and branches

## Environment Configuration

### Quick Setup with .env

1. **Copy the example file**:
   ```bash
   cp .env.example .env
   ```

2. **Configure essential variables** in your `.env` file:
   ```bash
   # Required: Claude AI API Key
   ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
   
   # Required: GitHub Integration
   GITHUB_USERNAME=your-username
   GITHUB_EMAIL=your.email@example.com
   GITHUB_PAT=ghp_your-personal-access-token
   
   # Optional: Custom Port
   PORT=3002
   ```

3. **Start the container**:
   ```bash
   # Standard setup
   docker-compose up -d
   
   # Windows setup (if using Windows-specific compose file)
   docker-compose -f docker-compose.windows.yml up -d
   ```

**Important:** The `.env` file must be in the same directory as your `docker-compose.yml` file for environment variables to be loaded properly.

### Complete Environment Variables

#### 🤖 Claude AI Configuration
```bash
# Anthropic API Key (required)
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here

# API endpoint (optional, for enterprise/proxy setups)
ANTHROPIC_API_URL=https://api.anthropic.com

# Default model (optional)
CLAUDE_DEFAULT_MODEL=claude-3-5-sonnet-20241022

# Permission mode: default, ask, plan, allow
CLAUDE_PERMISSION_MODE=default

# Additional directories for Claude access
CLAUDE_ADDITIONAL_DIRS=/workspace,/custom-path

# Custom system prompt
CLAUDE_SYSTEM_PROMPT="You are a helpful coding assistant."

# Skip permissions (not recommended)
CLAUDE_SKIP_PERMISSIONS=false
```

#### 🐙 GitHub Integration
```bash
# GitHub credentials (auto-configures git)
GITHUB_USERNAME=your-username
GITHUB_EMAIL=your.email@example.com
GITHUB_PAT=ghp_your-personal-access-token

# GitHub API endpoint (for enterprise)
GITHUB_API_URL=https://api.github.com

# Auto-configure git on startup
GITHUB_AUTO_CONFIG=true
```

#### 🔧 Git Configuration
```bash
# Git user info (fallback if GitHub not set)
GIT_USER_NAME=Your Name
GIT_USER_EMAIL=your.email@example.com

# Credential helper
GIT_CREDENTIAL_HELPER=store
```

#### 🌐 Server Configuration
```bash
# Server port
PORT=3002

# JWT secret (change in production!)
JWT_SECRET=your-secure-secret-here

# Optional API key for additional security
API_KEY=your-api-key

# CORS origins
CORS_ORIGINS=http://localhost:3000,http://localhost:3002
```

#### 🎙️ Audio Transcription
```bash
# OpenAI API key for speech-to-text
OPENAI_API_KEY=sk-your-openai-key
```

### Auto-Configuration Features

When the container starts, it automatically:

1. **Configures git** with GitHub credentials
2. **Authenticates GitHub CLI** with your PAT
3. **Sets up credential helpers** for seamless git operations
4. **Applies Claude settings** from environment variables

### Getting Your API Keys

#### Anthropic API Key
1. Visit [Anthropic Console](https://console.anthropic.com/settings/keys)
2. Create a new API key
3. Copy and paste into `ANTHROPIC_API_KEY`

#### GitHub Personal Access Token
1. Go to [GitHub Settings > Tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Select scopes: `repo`, `user`, `workflow`
4. Copy token and paste into `GITHUB_PAT`

#### OpenAI API Key (Optional)
1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new secret key
3. Copy and paste into `OPENAI_API_KEY`

## Benefits of This Architecture

1. **No Host Installation Required**: Everything runs in the container
2. **Consistent Environment**: Same behavior across different host systems
3. **Isolation**: Claude operations are isolated from the host system
4. **Easy Updates**: Update the container image to get new features
5. **Multiple Instances**: Run multiple containers for different projects
6. **Full Git Integration**: Complete git functionality with GitHub support

## Common Misconceptions

❌ **Myth**: The host computer needs Claude Code CLI installed
✅ **Reality**: Claude Code CLI is installed inside the container

❌ **Myth**: The dashboard accesses the host's terminal directly
✅ **Reality**: It creates isolated terminal sessions inside the container

❌ **Myth**: Claude can access any file on the host system
✅ **Reality**: Claude can only access mounted volumes and container files

## Development vs Production

- **Development**: Mount local directories for live code editing
- **Production**: Use only Docker volumes for better isolation
- **Scaling**: Can run multiple container instances behind a load balancer

## Troubleshooting

### General Issues
1. **Claude command not found**: The CLI is installed in the container, not on host
2. **Permission errors**: Check volume mount permissions and user mappings
3. **Can't access host files**: Only mounted directories are accessible
4. **WebSocket errors**: Ensure port 3002 is not blocked by firewall

### Git and GitHub Issues

#### Authentication Problems
- **"Permission denied (publickey)"**: SSH key not added to GitHub account
- **"Authentication failed"**: Check GitHub personal access token
- **"Could not resolve hostname"**: Network connectivity issue

#### Common Git Errors
- **"Not a git repository"**: Initialize with `git init` first
- **"No remote configured"**: Add remote with `git remote add origin <url>`
- **"Push rejected"**: Pull latest changes before pushing
- **"Merge conflicts"**: Resolve conflicts manually in the editor

#### Solutions
```bash
# Set up git authentication in container terminal
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# For HTTPS (use GitHub personal access token)
git config --global credential.helper store

# For SSH (generate and add key to GitHub)
ssh-keygen -t ed25519 -C "your.email@example.com"
cat ~/.ssh/id_ed25519.pub  # Add this to GitHub
```

### Environment Variable Issues

#### API Key Problems
- **"API key not configured"**: Set `ANTHROPIC_API_KEY` in .env file
- **"Invalid API key"**: Check your Anthropic Console for the correct key
- **"GitHub authentication failed"**: Verify `GITHUB_PAT` is set and has correct permissions

#### Configuration Not Applied
- **Environment variables ignored**: Ensure .env file is in the project root
- **Git not auto-configured**: Check `GITHUB_AUTO_CONFIG=true` is set
- **Wrong Claude model**: Verify `CLAUDE_DEFAULT_MODEL` is a valid model name

#### Quick Fixes
```bash
# Check if .env file exists and is readable
ls -la .env

# Verify environment variables are loaded
docker-compose exec claude-code-ui env | grep ANTHROPIC

# Restart container to apply new .env changes
docker-compose restart

# Check git configuration
docker-compose exec claude-code-ui git config --list --global
```
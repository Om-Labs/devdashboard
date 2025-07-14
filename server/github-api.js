import { Octokit } from '@octokit/rest';

/**
 * Create an authenticated Octokit instance
 */
function createOctokit() {
  const auth = process.env.GITHUB_PAT;
  const baseUrl = process.env.GITHUB_API_URL || 'https://api.github.com';
  
  if (!auth) {
    throw new Error('GitHub Personal Access Token (GITHUB_PAT) not configured');
  }
  
  return new Octokit({
    auth,
    baseUrl,
    userAgent: 'claude-code-ui/1.0.0'
  });
}

/**
 * Get authenticated user information
 */
export async function getAuthenticatedUser() {
  try {
    const octokit = createOctokit();
    const { data } = await octokit.rest.users.getAuthenticated();
    return { success: true, user: data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * List user repositories
 */
export async function getUserRepositories(options = {}) {
  try {
    const octokit = createOctokit();
    const { data } = await octokit.rest.repos.listForAuthenticatedUser({
      sort: 'updated',
      per_page: 30,
      ...options
    });
    return { success: true, repositories: data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Create a new repository
 */
export async function createRepository(repoData) {
  try {
    const octokit = createOctokit();
    const { data } = await octokit.rest.repos.createForAuthenticatedUser(repoData);
    return { success: true, repository: data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get repository information
 */
export async function getRepository(owner, repo) {
  try {
    const octokit = createOctokit();
    const { data } = await octokit.rest.repos.get({ owner, repo });
    return { success: true, repository: data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Create a pull request
 */
export async function createPullRequest(owner, repo, pullData) {
  try {
    const octokit = createOctokit();
    const { data } = await octokit.rest.pulls.create({
      owner,
      repo,
      ...pullData
    });
    return { success: true, pullRequest: data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * List pull requests
 */
export async function listPullRequests(owner, repo, options = {}) {
  try {
    const octokit = createOctokit();
    const { data } = await octokit.rest.pulls.list({
      owner,
      repo,
      state: 'open',
      per_page: 30,
      ...options
    });
    return { success: true, pullRequests: data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Create an issue
 */
export async function createIssue(owner, repo, issueData) {
  try {
    const octokit = createOctokit();
    const { data } = await octokit.rest.issues.create({
      owner,
      repo,
      ...issueData
    });
    return { success: true, issue: data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * List issues
 */
export async function listIssues(owner, repo, options = {}) {
  try {
    const octokit = createOctokit();
    const { data } = await octokit.rest.issues.listForRepo({
      owner,
      repo,
      state: 'open',
      per_page: 30,
      ...options
    });
    return { success: true, issues: data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Test GitHub API connection
 */
export async function testGitHubConnection() {
  try {
    const result = await getAuthenticatedUser();
    if (result.success) {
      return {
        success: true,
        message: `Connected as ${result.user.login}`,
        user: result.user
      };
    } else {
      return {
        success: false,
        error: result.error
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
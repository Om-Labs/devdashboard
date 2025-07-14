import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Auto-configure git with environment variables on container startup
 */
export async function autoConfigureGit() {
  if (process.env.GITHUB_AUTO_CONFIG !== 'true') {
    console.log('📝 Git auto-configuration disabled');
    return;
  }

  console.log('🔧 Auto-configuring git with environment variables...');

  try {
    // Set git user name
    const userName = process.env.GITHUB_USERNAME || process.env.GIT_USER_NAME;
    if (userName) {
      await execAsync(`git config --global user.name "${userName}"`);
      console.log('✅ Git user.name set to:', userName);
    }

    // Set git user email
    const userEmail = process.env.GITHUB_EMAIL || process.env.GIT_USER_EMAIL;
    if (userEmail) {
      await execAsync(`git config --global user.email "${userEmail}"`);
      console.log('✅ Git user.email set to:', userEmail);
    }

    // Set credential helper
    const credentialHelper = process.env.GIT_CREDENTIAL_HELPER || 'store';
    await execAsync(`git config --global credential.helper ${credentialHelper}`);
    console.log('✅ Git credential.helper set to:', credentialHelper);

    // Configure GitHub CLI if PAT is provided
    if (process.env.GITHUB_PAT) {
      try {
        // Configure GitHub CLI with the PAT
        await execAsync(`echo "${process.env.GITHUB_PAT}" | gh auth login --with-token`);
        console.log('🔑 GitHub CLI authenticated successfully');
        
        // Set GitHub CLI to use HTTPS for git operations
        await execAsync('gh config set git_protocol https');
        console.log('✅ GitHub CLI configured to use HTTPS for git');
      } catch (error) {
        console.warn('⚠️ GitHub CLI configuration failed:', error.message);
      }
    }

    // Set default branch name
    await execAsync('git config --global init.defaultBranch main');
    console.log('✅ Git default branch set to: main');

    // Set safe directory for container
    await execAsync('git config --global --add safe.directory "*"');
    console.log('✅ Git safe directory configured for container');

    console.log('🎉 Git auto-configuration completed successfully');
  } catch (error) {
    console.error('❌ Git auto-configuration failed:', error.message);
  }
}

/**
 * Get current git configuration
 */
export async function getGitConfig() {
  try {
    const [userName, userEmail, credentialHelper] = await Promise.all([
      execAsync('git config --global user.name').catch(() => ({ stdout: '' })),
      execAsync('git config --global user.email').catch(() => ({ stdout: '' })),
      execAsync('git config --global credential.helper').catch(() => ({ stdout: '' }))
    ]);

    return {
      userName: userName.stdout.trim(),
      userEmail: userEmail.stdout.trim(),
      credentialHelper: credentialHelper.stdout.trim(),
      isConfigured: !!(userName.stdout.trim() && userEmail.stdout.trim())
    };
  } catch (error) {
    console.error('Error getting git config:', error);
    return {
      userName: '',
      userEmail: '',
      credentialHelper: '',
      isConfigured: false
    };
  }
}

/**
 * Configure git with provided credentials
 */
export async function configureGit(config) {
  try {
    if (config.userName) {
      await execAsync(`git config --global user.name "${config.userName}"`);
    }
    
    if (config.userEmail) {
      await execAsync(`git config --global user.email "${config.userEmail}"`);
    }
    
    if (config.credentialHelper) {
      await execAsync(`git config --global credential.helper ${config.credentialHelper}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Error configuring git:', error);
    return { success: false, error: error.message };
  }
}
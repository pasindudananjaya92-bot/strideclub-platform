import { db } from '../db/index.ts';
import { logAgentAction } from '../db/agentLogs.ts';

export interface GitHubRepoStatus {
  connected: boolean;
  repoName?: string;
  owner?: string;
  defaultBranch?: string;
  lastCommitSha?: string;
  lastCommitMessage?: string;
  error?: string;
}

export interface GitHubFileItem {
  name: string;
  path: string;
  sha: string;
  size: number;
  type: 'file' | 'dir';
  download_url?: string;
}

function getGitHubCredentials() {
  const token = process.env.GITHUB_ACCESS_TOKEN || process.env.GITHUB_TOKEN || process.env.VITE_GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO || process.env.VITE_GITHUB_REPO; // Format: "owner/repo" or just repo name if GITHUB_OWNER is set
  const owner = process.env.GITHUB_OWNER || (repo && repo.includes('/') ? repo.split('/')[0] : '');
  const repoName = repo && repo.includes('/') ? repo.split('/')[1] : repo;

  return { token, owner, repoName, fullName: owner && repoName ? `${owner}/${repoName}` : repo };
}

/**
 * Checks connectivity to the target GitHub repository using the secure Access Token.
 */
export async function checkGitHubStatus(): Promise<GitHubRepoStatus> {
  const { token, owner, repoName, fullName } = getGitHubCredentials();

  if (!token || !fullName) {
    return {
      connected: false,
      error: 'GITHUB_ACCESS_TOKEN or GITHUB_REPO environment variable is not configured in Vercel / .env',
    };
  }

  try {
    const res = await fetch(`https://api.github.com/repos/${fullName}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'StrideClub-Agent-Sync',
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      return {
        connected: false,
        error: `GitHub API responded with status ${res.status}: ${errText}`,
      };
    }

    const data = await res.json();

    // Get latest commit on default branch
    let lastCommitSha = '';
    let lastCommitMessage = '';
    try {
      const branchRes = await fetch(`https://api.github.com/repos/${fullName}/commits/${data.default_branch || 'main'}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'StrideClub-Agent-Sync',
        },
      });
      if (branchRes.ok) {
        const commitData = await branchRes.json();
        lastCommitSha = commitData.sha?.substring(0, 7) || '';
        lastCommitMessage = commitData.commit?.message || '';
      }
    } catch {
      // commit lookup is optional
    }

    return {
      connected: true,
      repoName: data.name,
      owner: data.owner?.login,
      defaultBranch: data.default_branch || 'main',
      lastCommitSha,
      lastCommitMessage,
    };
  } catch (error: any) {
    return {
      connected: false,
      error: error.message || 'Failed to connect to GitHub API',
    };
  }
}

/**
 * Lists files in a directory of the GitHub Repository
 */
export async function listGitHubFiles(dirPath: string = ''): Promise<GitHubFileItem[]> {
  const { token, fullName } = getGitHubCredentials();
  if (!token || !fullName) {
    throw new Error('GitHub credentials not configured');
  }

  const res = await fetch(`https://api.github.com/repos/${fullName}/contents/${dirPath}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'StrideClub-Agent-Sync',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to list files in ${dirPath}: ${res.statusText}`);
  }

  const data = await res.json();
  if (!Array.isArray(data)) {
    return [];
  }

  return data.map((item: any) => ({
    name: item.name,
    path: item.path,
    sha: item.sha,
    size: item.size,
    type: item.type === 'dir' ? 'dir' : 'file',
    download_url: item.download_url,
  }));
}

/**
 * Creates or updates a file directly in the user's GitHub Repository using the GitHub Contents API.
 */
export async function commitFileToGitHub(params: {
  filePath: string;
  content: string;
  commitMessage: string;
  branch?: string;
}): Promise<{ success: boolean; commitSha?: string; url?: string; error?: string }> {
  const { token, fullName } = getGitHubCredentials();
  if (!token || !fullName) {
    return {
      success: false,
      error: 'GITHUB_ACCESS_TOKEN and GITHUB_REPO must be configured in Vercel / .env',
    };
  }

  try {
    const branch = params.branch || 'main';
    let existingSha: string | undefined;

    // Check if the file already exists to get its SHA
    try {
      const getRes = await fetch(`https://api.github.com/repos/${fullName}/contents/${params.filePath}?ref=${branch}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'StrideClub-Agent-Sync',
        },
      });

      if (getRes.ok) {
        const fileData = await getRes.json();
        existingSha = fileData.sha;
      }
    } catch {
      // File doesn't exist yet, which is fine
    }

    const base64Content = Buffer.from(params.content, 'utf-8').toString('base64');

    const putRes = await fetch(`https://api.github.com/repos/${fullName}/contents/${params.filePath}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'User-Agent': 'StrideClub-Agent-Sync',
      },
      body: JSON.stringify({
        message: params.commitMessage || `Autonomous Agent: Update ${params.filePath}`,
        content: base64Content,
        sha: existingSha,
        branch,
      }),
    });

    if (!putRes.ok) {
      const errText = await putRes.text();
      return {
        success: false,
        error: `GitHub Commit failed (${putRes.status}): ${errText}`,
      };
    }

    const result = await putRes.json();

    // Log telemetry
    await logAgentAction({
      systemName: 'GITHUB REPOSITORY SYNC AGENT',
      actionType: 'github_commit',
      description: `Autonomous commit to ${fullName}/${params.filePath}: "${params.commitMessage}"`,
      status: 'success',
      metrics: {
        repo: fullName,
        filePath: params.filePath,
        commitSha: result.commit?.sha?.substring(0, 7),
      },
    });

    return {
      success: true,
      commitSha: result.commit?.sha,
      url: result.content?.html_url,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to commit file to GitHub',
    };
  }
}

/**
 * Commits a batch of files directly to the GitHub repository.
 */
export async function uploadMultipleFilesToGitHub(params: {
  files: Array<{ filePath: string; content: string }>;
  commitMessage: string;
  branch?: string;
}): Promise<{
  success: boolean;
  uploadedCount: number;
  results: Array<{ filePath: string; success: boolean; error?: string }>;
  error?: string;
}> {
  const { token, fullName } = getGitHubCredentials();
  if (!token || !fullName) {
    return {
      success: false,
      uploadedCount: 0,
      results: [],
      error: 'GITHUB_ACCESS_TOKEN and GITHUB_REPO must be configured in Vercel / .env',
    };
  }

  const results: Array<{ filePath: string; success: boolean; error?: string }> = [];
  let uploadedCount = 0;

  for (const item of params.files) {
    const res = await commitFileToGitHub({
      filePath: item.filePath,
      content: item.content,
      commitMessage: params.commitMessage || `Autonomous Agent: Upload ${item.filePath}`,
      branch: params.branch,
    });

    results.push({
      filePath: item.filePath,
      success: res.success,
      error: res.error,
    });

    if (res.success) {
      uploadedCount++;
    }
  }

  return {
    success: uploadedCount > 0,
    uploadedCount,
    results,
  };
}


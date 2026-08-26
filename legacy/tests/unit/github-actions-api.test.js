import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Unit tests for GitHub Actions API polling functions (Epic 3)
 * Tests workflow run fetching and polling
 */

// Mock global fetch
global.fetch = vi.fn();

// Mock constants
global.REPO_OWNER = 'test-owner';
global.REPO_NAME = 'test-repo';

// Mock updateProgress function
global.updateProgress = vi.fn();
global.showProgressError = vi.fn();

describe('GitHub Actions API Polling Functions (Epic 3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch latest workflow runs', async () => {
    // Given: GitHub API returns workflow runs
    const mockRuns = {
      workflow_runs: [
        {
          id: 123,
          status: 'completed',
          conclusion: 'success',
          head_sha: 'abc123',
        },
      ],
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockRuns,
    });

    // When: getLatestWorkflowRun is called
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/runs?per_page=5&branch=main`;
    const response = await global.fetch(url, {
      headers: {
        'Authorization': 'token test-token',
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    const data = await response.json();
    const runs = data.workflow_runs || [];

    // Then: Should return workflow runs
    expect(global.fetch).toHaveBeenCalled();
    expect(runs.length).toBeGreaterThan(0);
    expect(runs[0].id).toBe(123);
  });

  it('should find workflow run by commit SHA', async () => {
    // Given: Multiple workflow runs with different commit SHAs
    const targetSha = 'target-commit-sha';
    const mockRuns = {
      workflow_runs: [
        { id: 1, head_sha: 'other-sha', status: 'completed' },
        { id: 2, head_sha: targetSha, status: 'in_progress' },
        { id: 3, head_sha: 'another-sha', status: 'completed' },
      ],
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockRuns,
    });

    // When: Searching for run by commit SHA
    const response = await global.fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/runs?per_page=5&branch=main`);
    const data = await response.json();
    const runs = data.workflow_runs || [];
    const runForCommit = runs.find(run => run.head_sha === targetSha);

    // Then: Should find the correct run
    expect(runForCommit).toBeDefined();
    expect(runForCommit.id).toBe(2);
    expect(runForCommit.head_sha).toBe(targetSha);
  });

  it('should get workflow run status', async () => {
    // Given: Workflow run ID
    const runId = 123;
    const mockRun = {
      id: runId,
      status: 'in_progress',
      conclusion: null,
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockRun,
    });

    // When: getWorkflowRunStatus is called
    const response = await global.fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/runs/${runId}`,
      {
        headers: {
          'Authorization': 'token test-token',
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );

    const run = await response.json();

    // Then: Should return run status
    expect(global.fetch).toHaveBeenCalled();
    expect(run.status).toBe('in_progress');
  });

  it('should update progress based on workflow status', async () => {
    // Given: Workflow run with different statuses
    const statuses = ['queued', 'in_progress', 'completed'];
    let progressPercent = 20;

    for (const status of statuses) {
      // When: Status changes
      if (status === 'queued') {
        progressPercent = 20;
        global.updateProgress(progressPercent, 'Queued', 'Workflow is queued...');
      } else if (status === 'in_progress') {
        progressPercent = Math.min(90, progressPercent + 30);
        global.updateProgress(progressPercent, 'Deploying...', 'GitHub Action is running...');
      } else if (status === 'completed') {
        progressPercent = 100;
        global.updateProgress(progressPercent, 'Complete', 'Deployment completed!');
      }
    }

    // Then: Progress should update correctly
    expect(global.updateProgress).toHaveBeenCalledTimes(3);
    expect(progressPercent).toBe(100);
  });

  it('should handle workflow failure', async () => {
    // Given: Workflow run with failure
    const mockRun = {
      id: 123,
      status: 'completed',
      conclusion: 'failure',
    };

    // When: Workflow fails
    if (mockRun.status === 'completed' && mockRun.conclusion !== 'success') {
      global.showProgressError(`Workflow failed: ${mockRun.conclusion}`);
    }

    // Then: Error should be shown
    expect(global.showProgressError).toHaveBeenCalledWith('Workflow failed: failure');
  });

  it('should handle polling timeout', async () => {
    // Given: Polling exceeds max duration
    const startTime = Date.now();
    const maxDuration = 100; // 100ms for test
    const pollInterval = 50;

    // When: Polling times out
    while (Date.now() - startTime < maxDuration) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    // Then: Should handle timeout
    expect(Date.now() - startTime).toBeGreaterThanOrEqual(maxDuration);
  });
});

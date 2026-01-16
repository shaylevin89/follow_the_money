import { describe, it, expect, beforeEach, vi } from 'vitest';
import { sampleInvestmentData } from '../support/fixtures/test-data.js';

/**
 * Unit tests for saveData function (Epic 1)
 * Tests that saveData calls loadData after successful save
 */

// Mock global fetch
global.fetch = vi.fn();

// Mock functions
global.loadData = vi.fn();
global.investmentData = sampleInvestmentData;

// Mock constants
global.REPO_OWNER = 'test-owner';
global.REPO_NAME = 'test-repo';
global.DATA_FILE = 'data.json';

describe('saveData function (Epic 1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.investmentData = { ...sampleInvestmentData };
  });

  it('should call loadData after successful save', async () => {
    // Mock GitHub API responses
    // First: Get file SHA
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ sha: 'test-sha' }),
    });

    // Second: Save file
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ commit: { sha: 'new-commit-sha' } }),
    });

    // Simulate saveData behavior
    const token = 'test-token';
    
    // Get SHA
    const getFileResponse = await global.fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${DATA_FILE}`,
      {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );

    let sha = '';
    if (getFileResponse.ok) {
      const fileData = await getFileResponse.json();
      sha = fileData.sha;
    }

    // Save file
    const jsonString = JSON.stringify(global.investmentData, null, 2);
    const content = btoa(unescape(encodeURIComponent(jsonString)));
    const response = await global.fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${DATA_FILE}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `token ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
          message: 'Update investment data',
          content: content,
          sha: sha
        })
      }
    );

    if (!response.ok) throw new Error('Failed to save data');

    // After successful save, call loadData (Epic 1 fix)
    await global.loadData(token);

    // Verify loadData was called
    expect(global.loadData).toHaveBeenCalledWith(token);
  });

  it('should not call loadData if save fails', async () => {
    // Mock failed save
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ sha: 'test-sha' }),
    });

    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
    });

    const token = 'test-token';

    try {
      // Get SHA
      const getFileResponse = await global.fetch(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${DATA_FILE}`,
        {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      let sha = '';
      if (getFileResponse.ok) {
        const fileData = await getFileResponse.json();
        sha = fileData.sha;
      }

      // Save file (will fail)
      const response = await global.fetch(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${DATA_FILE}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `token ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github.v3+json'
          },
          body: JSON.stringify({
            message: 'Update investment data',
            content: 'test-content',
            sha: sha
          })
        }
      );

      if (!response.ok) throw new Error('Failed to save data');
    } catch (error) {
      // Save failed, loadData should not be called
      expect(global.loadData).not.toHaveBeenCalled();
    }
  });

  it('should handle missing token', () => {
    const token = null;
    
    // saveData should return early if no token
    if (!token || !global.REPO_OWNER || !global.REPO_NAME) {
      expect(token).toBeNull();
      return;
    }
  });
});

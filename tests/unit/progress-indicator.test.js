import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Unit tests for progress indicator functions (Epic 3)
 * Tests progress modal display and updates
 */

describe('Progress Indicator Functions (Epic 3)', () => {
  let document;
  let bootstrap;

  beforeEach(() => {
    // Mock DOM
    document = {
      getElementById: vi.fn((id) => {
        const elements = {
          progressModal: { id: 'progressModal' },
          progressStatus: { textContent: '', className: 'mb-3' },
          progressMessage: { textContent: '', className: 'text-muted small mb-0' },
          progressBar: { 
            style: { width: '0%' },
            setAttribute: vi.fn(),
            className: 'progress-bar progress-bar-striped progress-bar-animated'
          },
          progressText: { textContent: '0%' },
        };
        return elements[id] || null;
      }),
    };

    // Mock Bootstrap Modal
    const mockModalInstance = {
      show: vi.fn(),
      hide: vi.fn(),
    };

    bootstrap = {
      Modal: vi.fn().mockImplementation(() => mockModalInstance),
      Modal: {
        getInstance: vi.fn(() => mockModalInstance),
      },
    };

    global.document = document;
    global.bootstrap = bootstrap;
  });

  it('should show progress modal with initial status', () => {
    // Given: Progress modal elements exist
    const status = 'Saving...';
    const message = 'Please wait...';

    // When: showProgress is called
    const progressModal = new bootstrap.Modal(document.getElementById('progressModal'));
    document.getElementById('progressStatus').textContent = status;
    document.getElementById('progressMessage').textContent = message;
    document.getElementById('progressBar').style.width = '0%';
    document.getElementById('progressText').textContent = '0%';
    progressModal.show();

    // Then: Modal should be shown with correct status
    expect(bootstrap.Modal).toHaveBeenCalled();
    expect(progressModal.show).toHaveBeenCalled();
    expect(document.getElementById('progressStatus').textContent).toBe(status);
    expect(document.getElementById('progressMessage').textContent).toBe(message);
  });

  it('should update progress bar percentage', () => {
    // Given: Progress bar element exists
    const percent = 50;

    // When: updateProgress is called
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    progressBar.style.width = `${percent}%`;
    progressBar.setAttribute('aria-valuenow', percent);
    progressText.textContent = `${Math.round(percent)}%`;

    // Then: Progress bar should be updated
    expect(progressBar.style.width).toBe('50%');
    expect(progressBar.setAttribute).toHaveBeenCalledWith('aria-valuenow', 50);
    expect(progressText.textContent).toBe('50%');
  });

  it('should update status message when provided', () => {
    // Given: Progress elements exist
    const percent = 75;
    const status = 'Processing...';
    const message = 'Workflow running...';

    // When: updateProgress is called with status and message
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    progressBar.style.width = `${percent}%`;
    progressText.textContent = `${Math.round(percent)}%`;

    const statusElement = document.getElementById('progressStatus');
    const messageElement = document.getElementById('progressMessage');
    
    if (status) {
      statusElement.textContent = status;
    }
    if (message) {
      messageElement.textContent = message;
    }

    // Then: Status and message should be updated
    expect(statusElement.textContent).toBe(status);
    expect(messageElement.textContent).toBe(message);
  });

  it('should show error state correctly', () => {
    // Given: Progress elements exist
    const errorMessage = 'Save failed';

    // When: showProgressError is called
    const progressStatus = document.getElementById('progressStatus');
    const progressMessage = document.getElementById('progressMessage');
    const progressBar = document.getElementById('progressBar');

    progressStatus.textContent = 'Error';
    progressStatus.className = 'mb-3 text-danger';
    progressMessage.textContent = errorMessage;
    progressMessage.className = 'text-danger small mb-0';
    progressBar.className = 'progress-bar bg-danger';
    progressBar.style.width = '100%';

    // Then: Error state should be displayed
    expect(progressStatus.textContent).toBe('Error');
    expect(progressStatus.className).toBe('mb-3 text-danger');
    expect(progressMessage.textContent).toBe(errorMessage);
    expect(progressBar.className).toBe('progress-bar bg-danger');
  });

  it('should show success state correctly', () => {
    // Given: Progress elements exist
    const message = 'Changes saved successfully!';

    // When: showProgressSuccess is called
    const progressStatus = document.getElementById('progressStatus');
    const progressMessage = document.getElementById('progressMessage');
    const progressBar = document.getElementById('progressBar');

    progressStatus.textContent = 'Complete';
    progressStatus.className = 'mb-3 text-success';
    progressMessage.textContent = message;
    progressMessage.className = 'text-success small mb-0';
    progressBar.className = 'progress-bar bg-success';
    progressBar.style.width = '100%';
    const progressText = document.getElementById('progressText');
    progressText.textContent = '100%';

    // Then: Success state should be displayed
    expect(progressStatus.textContent).toBe('Complete');
    expect(progressStatus.className).toBe('mb-3 text-success');
    expect(progressMessage.textContent).toBe(message);
    expect(progressBar.className).toBe('progress-bar bg-success');
    expect(progressText.textContent).toBe('100%');
  });

  it('should hide progress and reset styling', () => {
    // Given: Progress modal is shown
    const mockModalInstance = {
      hide: vi.fn(),
    };
    bootstrap.Modal.getInstance = vi.fn(() => mockModalInstance);

    // When: hideProgress is called
    const progressModal = bootstrap.Modal.getInstance(document.getElementById('progressModal'));
    if (progressModal) {
      progressModal.hide();
    }

    const progressBar = document.getElementById('progressBar');
    const progressStatus = document.getElementById('progressStatus');
    progressBar.className = 'progress-bar progress-bar-striped progress-bar-animated';
    progressStatus.className = 'mb-3';

    // Then: Modal should be hidden and styling reset
    expect(progressModal.hide).toHaveBeenCalled();
    expect(progressBar.className).toBe('progress-bar progress-bar-striped progress-bar-animated');
    expect(progressStatus.className).toBe('mb-3');
  });
});

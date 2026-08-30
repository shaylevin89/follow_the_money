<script>
  let { onsubmit, requireCurrent = true } = $props();

  let current = $state('');
  let next = $state('');
  let confirm = $state('');
  let error = $state('');
  let submitting = $state(false);

  async function handleSubmit(e) {
    e.preventDefault();
    error = '';

    if (next.length < 8) {
      error = 'New password must be at least 8 characters.';
      return;
    }
    if (next !== confirm) {
      error = 'Passwords do not match.';
      return;
    }

    submitting = true;
    try {
      await onsubmit(current, next);
      current = '';
      next = '';
      confirm = '';
    } catch (e) {
      error = e.message;
    } finally {
      submitting = false;
    }
  }
</script>

<form onsubmit={handleSubmit}>
  {#if requireCurrent}
    <label>
      Current password
      <input
        type="password"
        bind:value={current}
        autocomplete="current-password"
        required
      />
    </label>
  {/if}
  <label>
    New password
    <input type="password" bind:value={next} autocomplete="new-password" required />
  </label>
  <label>
    Confirm new password
    <input type="password" bind:value={confirm} autocomplete="new-password" required />
  </label>
  {#if error}
    <p class="field-error">{error}</p>
  {/if}
  <button class="btn btn-primary" type="submit" disabled={submitting}>
    {submitting ? 'Saving…' : 'Change password'}
  </button>
</form>

<style>
  form {
    display: grid;
    gap: 0.9rem;
  }

  label {
    display: grid;
    gap: 0.3rem;
    font-weight: 600;
    font-size: 0.9rem;
  }
</style>

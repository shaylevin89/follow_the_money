<script>
  import ChangePassword from './ChangePassword.svelte';

  let { authed, mustChange, onlogin, onchangepassword, children } = $props();

  let username = $state('');
  let password = $state('');
  let error = $state('');
  let submitting = $state(false);

  async function handleSubmit(e) {
    e.preventDefault();
    error = '';
    submitting = true;
    try {
      await onlogin(username, password);
    } catch (e) {
      error = e.message;
    } finally {
      submitting = false;
    }
  }
</script>

{#if !authed}
  <div class="gate">
    <form class="card" onsubmit={handleSubmit}>
      <h2>Sign in</h2>
      <label>
        Username
        <input type="text" bind:value={username} autocomplete="username" required />
      </label>
      <label>
        Password
        <input
          type="password"
          bind:value={password}
          autocomplete="current-password"
          required
        />
      </label>
      {#if error}
        <p class="field-error">{error}</p>
      {/if}
      <button class="btn btn-primary" type="submit" disabled={submitting}>
        {submitting ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  </div>
{:else if mustChange}
  <div class="gate">
    <div class="card">
      <h2>Choose a new password</h2>
      <ChangePassword onsubmit={onchangepassword} />
    </div>
  </div>
{:else}
  {@render children()}
{/if}

<style>
  .gate {
    min-height: 100dvh;
    display: grid;
    place-items: center;
    padding: 1rem;
  }

  .card {
    width: min(92vw, 420px);
    display: grid;
    gap: 0.9rem;
  }

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

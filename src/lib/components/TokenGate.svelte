<script>
  let { hasToken, onsave, children } = $props();

  let value = $state('');
</script>

{#if hasToken}
  {@render children()}
{:else}
  <div class="gate">
    <form
      class="card"
      onsubmit={(e) => {
        e.preventDefault();
        if (value.trim()) onsave(value.trim());
      }}
    >
      <h2>Connect to GitHub</h2>
      <p class="muted">
        Paste a GitHub personal access token with access to your data repository.
        It is stored only in this browser.
      </p>
      <label>
        Personal access token
        <input type="password" bind:value autocomplete="off" placeholder="ghp_…" />
      </label>
      <button class="btn btn-primary" type="submit" disabled={!value.trim()}>Save token</button>
    </form>
  </div>
{/if}

<style>
  .gate {
    min-height: 100dvh;
    display: grid;
    place-items: center;
    padding: 1rem;
  }

  form {
    width: min(92vw, 420px);
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

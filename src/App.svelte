<script>
  import { getToken, setToken } from './lib/data/token.js';
  import { createGithubClient } from './lib/data/github.js';
  import { getUsdToIlsRate } from './lib/data/rates.js';
  import { createPortfolioStore } from './lib/stores/portfolio.js';
  import { REPO_OWNER, REPO_NAME, DATA_FILE } from './lib/config.js';
  import { view, toast } from './lib/stores/ui.js';
  import NavBar from './lib/components/NavBar.svelte';
  import Toasts from './lib/components/Toasts.svelte';
  import TokenGate from './lib/components/TokenGate.svelte';
  import Dashboard from './views/Dashboard.svelte';
  import Assets from './views/Assets.svelte';
  import AssetDetail from './views/AssetDetail.svelte';
  import CheckIn from './views/CheckIn.svelte';
  import Settings from './views/Settings.svelte';

  let token = $state(
    getToken({ storage: localStorage, location: window.location, history: window.history })
  );
  let portfolio = $state(null);
  let rate = $state(3.65);

  $effect(() => {
    if (token && !portfolio) {
      const client = createGithubClient({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: DATA_FILE,
        token,
      });
      const store = createPortfolioStore(client);
      portfolio = store;
      store.load().catch((e) => toast(`Failed to load data: ${e.message}`, 'error', 6000));
      getUsdToIlsRate({ storage: localStorage }).then((r) => (rate = r));
    }
  });

  function saveToken(value) {
    setToken(localStorage, value);
    token = value;
  }

  const pstate = $derived(portfolio ? portfolio.state : null);
</script>

<TokenGate hasToken={!!token} onsave={saveToken}>
  {#snippet children()}
    <NavBar />
    <main>
      {#if pstate && $pstate.conflict}
        <div class="card conflict" role="alert">
          <strong>Data changed elsewhere.</strong>
          <span>Reload to get the latest version, then redo your last change.</span>
          <button class="btn btn-primary" onclick={() => portfolio.reload()}>Reload</button>
        </div>
      {/if}

      {#if !pstate || $pstate.loading}
        <p class="muted loading">Loading your portfolio…</p>
      {:else if $pstate.error && !$pstate.data}
        <div class="card">
          <p class="negative">Could not load data: {$pstate.error}</p>
          <button class="btn btn-primary" onclick={() => portfolio.reload()}>Retry</button>
        </div>
      {:else if $pstate.data}
        {#if $view.name === 'dashboard'}
          <Dashboard {portfolio} {rate} />
        {:else if $view.name === 'assets'}
          <Assets {portfolio} {rate} />
        {:else if $view.name === 'asset'}
          <AssetDetail {portfolio} {rate} id={$view.params.id} />
        {:else if $view.name === 'checkin'}
          <CheckIn {portfolio} />
        {:else if $view.name === 'settings'}
          <Settings {portfolio} onclearToken={() => (token = null)} />
        {/if}
      {/if}
    </main>
    <Toasts />
  {/snippet}
</TokenGate>

<style>
  main {
    max-width: 960px;
    margin: 0 auto;
    padding: 1rem 1rem calc(var(--nav-height) + env(safe-area-inset-bottom) + 1.5rem);
  }

  .loading {
    text-align: center;
    padding: 3rem 0;
  }

  .conflict {
    display: grid;
    gap: 0.5rem;
    margin-bottom: 1rem;
    border-left: 4px solid var(--warning);
  }

  @media (min-width: 768px) {
    main {
      padding-top: calc(56px + 1.5rem);
    }
  }
</style>

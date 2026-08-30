<script>
  import { createApiClient, AuthError } from './lib/data/api.js';
  import { getUsdToIlsRate } from './lib/data/rates.js';
  import { createPortfolioStore } from './lib/stores/portfolio.js';
  import { view, toast, initHistory } from './lib/stores/ui.js';
  import NavBar from './lib/components/NavBar.svelte';
  import Toasts from './lib/components/Toasts.svelte';
  import LoginGate from './lib/components/LoginGate.svelte';
  import Dashboard from './views/Dashboard.svelte';
  import Assets from './views/Assets.svelte';
  import AssetDetail from './views/AssetDetail.svelte';
  import CheckIn from './views/CheckIn.svelte';
  import Settings from './views/Settings.svelte';

  const api = createApiClient();
  const portfolio = createPortfolioStore(api);
  const pstate = portfolio.state;

  $effect(() => initHistory());

  let authed = $state(false);
  let mustChange = $state(false);
  let username = $state('');
  let rate = $state(3.65);
  let loaded = $state(false);

  function loadAppData() {
    portfolio.load().catch((e) => {
      if (!(e instanceof AuthError)) {
        toast(`Failed to load data: ${e.message}`, 'error', 6000);
      }
    });
    getUsdToIlsRate({ storage: localStorage }).then((r) => (rate = r));
    loaded = true;
  }

  $effect(() => {
    api
      .me()
      .then((res) => {
        authed = true;
        mustChange = !!res.mustChangePassword;
        username = res.username;
        if (!mustChange) loadAppData();
      })
      .catch((e) => {
        if (e instanceof AuthError) {
          authed = false;
        } else {
          toast(`Failed to check session: ${e.message}`, 'error', 6000);
        }
      });
  });

  // Session expired mid-use: flip back to the login screen. Edge-triggered
  // (fires only when authRequired newly becomes true) so that re-logging in
  // and reloading — which clears authRequired asynchronously — doesn't get
  // undone by this effect re-running on the store's other, unrelated
  // updates while the stale flag is still true.
  let wasAuthRequired = false;
  $effect(() => {
    const isAuthRequired = $pstate.authRequired;
    if (isAuthRequired && !wasAuthRequired) {
      authed = false;
      loaded = false;
    }
    wasAuthRequired = isAuthRequired;
  });

  async function handleLogin(loginUsername, password) {
    const res = await api.login(loginUsername, password);
    authed = true;
    mustChange = !!res.mustChangePassword;
    username = loginUsername;
    if (!mustChange) loadAppData();
  }

  async function handleChangePassword(current, next) {
    await api.changePassword(current, next);
    mustChange = false;
    if (!loaded) loadAppData();
  }

  function handleLogout() {
    authed = false;
    mustChange = false;
    loaded = false;
  }
</script>

<LoginGate {authed} {mustChange} onlogin={handleLogin} onchangepassword={handleChangePassword}>
  {#snippet children()}
    <NavBar {username} />
    <header class="appbar">
      <span class="app-name">Follow the Money</span>
      <span class="whoami muted">@{username}</span>
    </header>
    <main>
      {#if $pstate.loading || (!$pstate.data && !$pstate.error)}
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
          <Settings {portfolio} {api} {username} onlogout={handleLogout} />
        {/if}
      {/if}
    </main>
    <Toasts />
  {/snippet}
</LoginGate>

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

  .appbar {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    max-width: 960px;
    margin: 0 auto;
    padding: 0.75rem 1rem 0;
  }

  .app-name {
    font-weight: 700;
    font-size: 0.95rem;
  }

  .whoami {
    font-size: 0.85rem;
  }

  @media (min-width: 768px) {
    /* Desktop shows the username in the top nav instead. */
    .appbar {
      display: none;
    }
  }

  @media (min-width: 768px) {
    main {
      padding-top: calc(56px + 1.5rem);
    }
  }
</style>

<script>
  import { view, navigate } from '../stores/ui.js';

  let { username = '' } = $props();

  const items = [
    { name: 'dashboard', label: 'Dashboard', icon: 'M3 13h4v8H3zM10 9h4v12h-4zM17 4h4v17h-4z' },
    { name: 'assets', label: 'Assets', icon: 'M4 5h16v4H4zM4 11h16v4H4zM4 17h10v3H4z' },
    { name: 'checkin', label: 'Check-in', icon: 'M9 11l3 3 8-8M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11' },
    { name: 'settings', label: 'Settings', icon: 'M12 8a4 4 0 100 8 4 4 0 000-8zM19 12a7 7 0 01-.1 1.2l2 1.6-2 3.4-2.4-1a7 7 0 01-2 1.2L14 21h-4l-.5-2.6a7 7 0 01-2-1.2l-2.4 1-2-3.4 2-1.6A7 7 0 015 12a7 7 0 01.1-1.2l-2-1.6 2-3.4 2.4 1a7 7 0 012-1.2L10 3h4l.5 2.6a7 7 0 012 1.2l2.4-1 2 3.4-2 1.6c.06.4.1.8.1 1.2z' },
  ];

  // 'asset' detail view highlights the Assets tab.
  const activeTab = (current, name) =>
    current === name || (name === 'assets' && current === 'asset');
</script>

<nav aria-label="Main navigation">
  {#each items as item (item.name)}
    <button
      class:active={activeTab($view.name, item.name)}
      aria-current={activeTab($view.name, item.name) ? 'page' : undefined}
      onclick={() => navigate(item.name)}
    >
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d={item.icon} />
      </svg>
      <span>{item.label}</span>
    </button>
  {/each}
  {#if username}
    <span class="whoami muted">@{username}</span>
  {/if}
</nav>

<style>
  nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    background: var(--surface);
    border-top: 1px solid var(--border);
    padding-bottom: env(safe-area-inset-bottom);
    z-index: 20;
  }

  button {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 0.5rem 0 0.4rem;
    min-height: var(--nav-height);
    background: none;
    border: none;
    color: var(--muted);
    font-size: 0.72rem;
  }

  button.active {
    color: var(--accent);
    font-weight: 600;
  }

  /* Username lives in the mobile appbar below 768px. */
  .whoami {
    display: none;
  }

  @media (min-width: 768px) {
    nav {
      top: 0;
      bottom: auto;
      border-top: none;
      border-bottom: 1px solid var(--border);
      justify-content: center;
      gap: 0.5rem;
      padding: 0 1rem;
    }

    button {
      flex: 0 0 auto;
      flex-direction: row;
      gap: 0.5rem;
      padding: 0 1.1rem;
      font-size: 0.9rem;
      min-height: 56px;
    }

    .whoami {
      display: flex;
      align-items: center;
      font-size: 0.88rem;
      margin-left: 0.75rem;
    }
  }
</style>

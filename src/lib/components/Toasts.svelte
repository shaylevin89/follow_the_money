<script>
  import { toasts } from '../stores/ui.js';
</script>

<div class="toasts" role="status" aria-live="polite">
  {#each $toasts as t (t.id)}
    <div class="toast {t.kind}">{t.message}</div>
  {/each}
</div>

<style>
  .toasts {
    position: fixed;
    bottom: calc(var(--nav-height) + env(safe-area-inset-bottom) + 12px);
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    gap: 8px;
    z-index: 50;
    width: min(92vw, 420px);
  }

  .toast {
    background: var(--surface);
    color: var(--text);
    border: 1px solid var(--border);
    border-left: 4px solid var(--positive);
    border-radius: var(--radius-sm);
    box-shadow: var(--shadow);
    padding: 0.7rem 1rem;
  }

  .toast.error {
    border-left-color: var(--negative);
  }

  @media (min-width: 768px) {
    .toasts {
      bottom: 20px;
    }
  }
</style>

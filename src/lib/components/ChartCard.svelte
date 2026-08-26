<script>
  import Chart from 'chart.js/auto';

  let { title, buildConfig, height = 240 } = $props();

  let canvas = $state(null);
  let chart = null;

  export function themeTokens() {
    const style = getComputedStyle(document.documentElement);
    const read = (name, fallback) => style.getPropertyValue(name).trim() || fallback;
    return {
      text: read('--text', '#0f172a'),
      muted: read('--muted', '#64748b'),
      border: read('--border', '#e2e8f0'),
      surface: read('--surface', '#ffffff'),
      series: [read('--viz-1', '#2a78d6'), read('--viz-2', '#eb6834')],
    };
  }

  $effect(() => {
    if (!canvas) return;
    const config = buildConfig(themeTokens());
    chart = new Chart(canvas, config);
    return () => {
      chart?.destroy();
      chart = null;
    };
  });
</script>

<section class="card">
  <h3>{title}</h3>
  <div class="chart-wrap" style="height: {height}px">
    <canvas bind:this={canvas} aria-label={title}></canvas>
  </div>
</section>

<style>
  h3 {
    font-size: 1rem;
    color: var(--muted);
    font-weight: 600;
  }

  .chart-wrap {
    position: relative;
  }
</style>

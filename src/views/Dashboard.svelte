<script>
  import { totalValueIls } from '../lib/domain/money.js';
  import { profitBreakdown } from '../lib/domain/profit.js';
  import { portfolioHistory, typeHistoryByYear } from '../lib/domain/history.js';
  import {
    portfolioHistoryConfig,
    liquidityConfig,
    typeConfig,
    currencyConfig,
    topAssetsConfig,
    typeHistoryConfig,
  } from '../lib/charts.js';
  import { portfolioStats } from '../lib/domain/stats.js';
  import { settings } from '../lib/stores/settings.js';
  import SummaryCard from '../lib/components/SummaryCard.svelte';
  import ChartCard from '../lib/components/ChartCard.svelte';

  let { portfolio, rate } = $props();

  const pstate = $derived(portfolio.state);

  const investments = $derived($pstate.data.investments);
  const metadata = $derived($pstate.data.metadata);
  const total = $derived(totalValueIls(investments, rate));
  const monthly = $derived(profitBreakdown(investments, metadata, rate, 30));
  const yearly = $derived(profitBreakdown(investments, metadata, rate, 365));
  const history = $derived(portfolioHistory(investments, rate));
  const stats = $derived(portfolioStats(investments, rate, $settings.stalenessMonths));
  const typeHistory = $derived(typeHistoryByYear(investments, rate));
</script>

<h1>Dashboard</h1>

<div class="summaries">
  <SummaryCard label="Total value" value={total} />
  <SummaryCard label="Monthly profit" value={monthly.total} details={monthly.details} />
  <SummaryCard label="Yearly profit" value={yearly.total} details={yearly.details} />
</div>

<div class="stats" role="list">
  <span class="stat" role="listitem"><strong>{stats.activeCount}</strong> active assets</span>
  <span class="stat" role="listitem">
    <strong class:warn={stats.staleCount > 0}>{stats.staleCount}</strong> need an update
  </span>
  <span class="stat" role="listitem"><strong>{stats.liquidPct.toFixed(0)}%</strong> liquid</span>
</div>

<div class="charts">
  {#key rate}
    <div class="wide">
      <ChartCard
        title="Portfolio over time"
        height={260}
        buildConfig={(theme) => portfolioHistoryConfig(history, theme)}
      />
    </div>
    <ChartCard
      title="Liquidity"
      buildConfig={(theme) => liquidityConfig(investments, rate, theme)}
    />
    <ChartCard
      title="Currency split"
      buildConfig={(theme) => currencyConfig(investments, rate, theme)}
    />
    <ChartCard
      title="By investment type"
      height={300}
      buildConfig={(theme) => typeConfig(investments, rate, theme)}
    />
    <ChartCard
      title="Top assets"
      height={220}
      buildConfig={(theme) => topAssetsConfig(investments, rate, theme, 5)}
    />
    {#if typeHistory.years.length > 1}
      <div class="wide">
        <ChartCard
          title="By type over the years"
          height={320}
          buildConfig={(theme) => typeHistoryConfig(typeHistory, theme)}
        />
      </div>
    {/if}
  {/key}
</div>

<style>
  h1 {
    font-size: 1.4rem;
    margin-bottom: 0.9rem;
  }

  .summaries {
    display: grid;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .stats {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-bottom: 1rem;
  }

  .stat {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 999px;
    padding: 0.35rem 0.85rem;
    font-size: 0.85rem;
    color: var(--muted);
  }

  .stat strong {
    color: var(--text);
    font-variant-numeric: tabular-nums;
  }

  .stat strong.warn {
    color: var(--warning);
  }

  .charts {
    display: grid;
    gap: 0.75rem;
  }

  @media (min-width: 768px) {
    .summaries {
      grid-template-columns: repeat(3, 1fr);
      align-items: start;
    }

    .charts {
      grid-template-columns: repeat(2, 1fr);
    }

    .wide {
      grid-column: 1 / -1;
    }
  }
</style>

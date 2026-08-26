<script>
  import { totalValueIls } from '../lib/domain/money.js';
  import { profitBreakdown } from '../lib/domain/profit.js';
  import { portfolioHistory } from '../lib/domain/history.js';
  import { portfolioHistoryConfig, liquidityConfig, typeConfig } from '../lib/charts.js';
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
</script>

<h1>Dashboard</h1>

<div class="summaries">
  <SummaryCard label="Total value" value={total} />
  <SummaryCard label="Monthly profit" value={monthly.total} details={monthly.details} />
  <SummaryCard label="Yearly profit" value={yearly.total} details={yearly.details} />
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
      title="By investment type"
      height={300}
      buildConfig={(theme) => typeConfig(investments, rate, theme)}
    />
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

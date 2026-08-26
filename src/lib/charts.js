// Pure Chart.js config builders. Theme colors are injected so components can
// resolve CSS custom properties at render time (light/dark aware).
import { activeInvestments, currentAmount } from './domain/investments.js';
import { toIls, formatIls } from './domain/money.js';

function baseScales(theme, { money = true } = {}) {
  return {
    x: {
      ticks: { color: theme.muted },
      grid: { color: 'transparent' },
      border: { color: theme.border },
    },
    y: {
      ticks: {
        color: theme.muted,
        ...(money ? { callback: (v) => formatIls(v) } : {}),
      },
      grid: { color: theme.border },
      border: { display: false },
    },
  };
}

const tooltipMoney = {
  callbacks: {
    label: (ctx) => ` ${formatIls(ctx.parsed.y ?? ctx.parsed.x ?? ctx.parsed)}`,
  },
};

export function portfolioHistoryConfig(points, theme) {
  return {
    type: 'line',
    data: {
      labels: points.map((p) => p.date),
      datasets: [
        {
          label: 'Portfolio value',
          data: points.map((p) => Math.round(p.total)),
          borderColor: theme.series[0],
          backgroundColor: `${theme.series[0]}33`,
          borderWidth: 2,
          pointRadius: 0,
          pointHitRadius: 12,
          fill: true,
          tension: 0.25,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: tooltipMoney,
      },
      scales: baseScales(theme),
    },
  };
}

export function liquidityConfig(investments, usdToIlsRate, theme) {
  const active = activeInvestments(investments);
  const sum = (pred) =>
    Math.round(
      active
        .filter(pred)
        .reduce((s, inv) => s + toIls(currentAmount(inv), inv.currency, usdToIlsRate), 0)
    );
  return {
    type: 'doughnut',
    data: {
      labels: ['Liquid', 'Not liquid'],
      datasets: [
        {
          data: [sum((i) => i.is_liquid), sum((i) => !i.is_liquid)],
          backgroundColor: [theme.series[0], theme.series[1]],
          borderColor: theme.surface || '#fff',
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: { position: 'bottom', labels: { color: theme.text, boxWidth: 14 } },
        tooltip: {
          callbacks: { label: (ctx) => ` ${ctx.label}: ${formatIls(ctx.parsed)}` },
        },
      },
    },
  };
}

export function typeConfig(investments, usdToIlsRate, theme) {
  const totals = new Map();
  for (const inv of activeInvestments(investments)) {
    const ils = toIls(currentAmount(inv), inv.currency, usdToIlsRate);
    totals.set(inv.investment_type, (totals.get(inv.investment_type) || 0) + ils);
  }
  const entries = [...totals.entries()]
    .map(([type, total]) => [type, Math.round(total)])
    .filter(([, total]) => total > 0)
    .sort((a, b) => b[1] - a[1]);

  return {
    type: 'bar',
    data: {
      labels: entries.map(([type]) => type),
      datasets: [
        {
          label: 'Value',
          data: entries.map(([, total]) => total),
          backgroundColor: theme.series[0],
          borderRadius: 4,
          maxBarThickness: 22,
        },
      ],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: (ctx) => ` ${formatIls(ctx.parsed.x)}` },
        },
      },
      scales: {
        x: {
          ticks: { color: theme.muted, callback: (v) => formatIls(v) },
          grid: { color: theme.border },
          border: { display: false },
        },
        y: {
          ticks: { color: theme.text },
          grid: { color: 'transparent' },
          border: { color: theme.border },
        },
      },
    },
  };
}

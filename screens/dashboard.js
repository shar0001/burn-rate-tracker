/* ============================================================
   Dashboard Screen - メインダッシュボード
   ============================================================ */

const DashboardScreen = (() => {
  let container;

  function init() {
    container = document.getElementById('screen-dashboard');
    render();
  }

  function render() {
    const burnRate = Store.getBurnRate();
    const utilPct = Store.getUtilizationPct();
    const exhaustTime = Store.getExhaustionTime();
    const remaining = Store.getRemainingBudget();
    const total = Store.getBudget().total;
    const transactions = Store.getTransactions().slice(0, 6);
    const alertLevel = Store.getAlertLevel();

    // SVG ring calculations
    const radius = 88;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference - (utilPct / 100) * circumference;

    // Burn rate progress (percentage of a "normal" 12-hour shoot at ¥100k/hr)
    const burnPctNormalized = Math.min((burnRate / 100000) * 100, 100);

    // Exhaustion time formatting
    let exhaustStr = '--:--';
    let exhaustLabel = '予測なし';
    if (exhaustTime) {
      exhaustStr = exhaustTime.getHours().toString().padStart(2, '0') + ':' + exhaustTime.getMinutes().toString().padStart(2, '0');
      exhaustLabel = '枯渇予測時刻';
    }

    // Alert color classes
    let ringColor = 'var(--primary-container)';
    let alertBorderColor = 'var(--tertiary)';
    if (alertLevel === 'critical') {
      ringColor = 'var(--error)';
      alertBorderColor = 'var(--error)';
    } else if (alertLevel === 'warning') {
      ringColor = 'var(--tertiary)';
    }

    container.innerHTML = `
      <div class="space-y-lg stagger">

        <!-- Burn Rate + Alert Cards -->
        <div class="space-y" style="display:grid;grid-template-columns:1fr;gap:var(--space-md);">

          <!-- Burn Rate Card -->
          <div class="glass-panel" style="overflow:hidden;position:relative;">
            <div class="flex justify-between items-center mb-sm">
              <span class="stat-card__label">リアルタイム・バーンレート</span>
              <span class="material-symbols-outlined color-secondary" style="font-size:18px;">bolt</span>
            </div>
            <div class="flex items-center gap-sm">
              <span class="font-headline" style="font-size:2rem;font-weight:300;color:var(--secondary-container);" id="dash-burn-rate">${Store.formatYen(burnRate)}</span>
              <span class="text-body" style="color:rgba(0,227,253,0.7);">/hr</span>
            </div>
            <div class="progress-bar mt-md">
              <div class="progress-bar__fill progress-bar__fill--secondary" style="width:${burnPctNormalized}%;"></div>
            </div>
          </div>

          <!-- Exhaustion Alert -->
          <div class="glass-panel alert-card" style="border-left-color:${alertBorderColor};">
            <div class="alert-card__header">
              <span class="material-symbols-outlined alert-card__icon" style="font-variation-settings:'FILL' 1;color:${alertBorderColor};">warning</span>
              <span class="alert-card__label" style="color:${alertBorderColor};">予算枯渇予測アラート</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="font-headline" style="font-size:2.5rem;font-weight:200;letter-spacing:-0.03em;" id="dash-exhaust-time">${exhaustStr}</span>
              <span class="text-label color-muted">${exhaustLabel}</span>
            </div>
          </div>
        </div>

        <!-- Budget Ring Chart -->
        <section class="glass-panel text-center">
          <h2 class="text-label mb-lg">現在の予算ステータス</h2>
          <div class="ring-chart">
            <svg class="ring-chart__svg" width="192" height="192">
              <circle cx="96" cy="96" r="${radius}" fill="transparent"
                stroke="var(--surface-container-lowest)" stroke-width="6"></circle>
              <circle cx="96" cy="96" r="${radius}" fill="transparent"
                stroke="${ringColor}" stroke-width="12"
                stroke-dasharray="${circumference}"
                stroke-dashoffset="${dashOffset}"
                stroke-linecap="round"
                style="transition:stroke-dashoffset 1s ease;"></circle>
            </svg>
            <div class="ring-chart__center">
              <span class="ring-chart__value" id="dash-util-pct">${utilPct.toFixed(1)}%</span>
              <span class="ring-chart__label">消化率</span>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-md);margin-top:var(--space-xl);">
            <div style="background:var(--surface-container-lowest);padding:var(--space-sm) var(--space-md);border-radius:var(--radius-lg);border-left:2px solid rgba(46,91,255,0.3);">
              <p class="text-label-sm color-muted">総予算</p>
              <p class="font-headline" style="font-size:1.125rem;font-weight:500;">${Store.formatYenCompact(total)}</p>
            </div>
            <div style="background:var(--surface-container-lowest);padding:var(--space-sm) var(--space-md);border-radius:var(--radius-lg);border-left:2px solid rgba(67,70,86,0.3);">
              <p class="text-label-sm color-muted">残予算</p>
              <p class="font-headline" style="font-size:1.125rem;font-weight:500;${remaining < 0 ? 'color:var(--error);' : ''}">${Store.formatYenCompact(remaining)}</p>
            </div>
          </div>
        </section>

        <!-- Category Breakdown -->
        <section>
          <div class="section-header">
            <h3 class="section-header__title">カテゴリ別支出</h3>
          </div>
          <div class="glass-panel--compact glass-panel">
            ${renderCategoryBreakdown()}
          </div>
        </section>

        <!-- Recent Transactions -->
        <section>
          <div class="section-header">
            <h3 class="section-header__title">最近の取引</h3>
            <span class="section-header__link">すべて表示</span>
          </div>
          <div class="space-y-sm">
            ${transactions.map(tx => renderTransactionRow(tx)).join('')}
          </div>
        </section>

      </div>
    `;
  }

  function renderCategoryBreakdown() {
    const breakdown = Store.getCategoryBreakdown();
    const totalSpent = Store.getTotalSpent();
    const entries = Object.entries(breakdown).sort((a, b) => b[1] - a[1]);

    if (entries.length === 0) {
      return '<p class="text-body color-muted text-center" style="padding:var(--space-lg);">まだ支出がありません</p>';
    }

    const colors = ['var(--primary-container)', 'var(--secondary-container)', 'var(--tertiary)', 'var(--primary)', 'var(--error)', '#9c27b0', '#4caf50', '#ff9800'];

    return entries.map(([cat, amount], i) => {
      const catInfo = Store.CATEGORIES[cat] || { label: cat, icon: 'receipt_long', emoji: '📝' };
      const pct = totalSpent > 0 ? ((amount / totalSpent) * 100).toFixed(1) : '0';
      const color = colors[i % colors.length];
      return `
        <div class="flex items-center justify-between" style="padding:var(--space-sm) 0;${i < entries.length - 1 ? 'border-bottom:0.5px solid var(--outline-variant);' : ''}">
          <div class="flex items-center gap-sm">
            <div style="width:8px;height:8px;border-radius:50%;background:${color};flex-shrink:0;"></div>
            <span class="text-body-sm">${catInfo.emoji} ${catInfo.label}</span>
          </div>
          <div class="flex items-center gap-md">
            <span class="text-body-sm" style="font-weight:600;">${Store.formatYen(amount)}</span>
            <span class="text-label-sm color-muted" style="min-width:40px;text-align:right;">${pct}%</span>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderTransactionRow(tx) {
    const catInfo = Store.CATEGORIES[tx.category] || { label: tx.category, icon: 'receipt_long' };
    const isPending = tx.status === 'pending';

    return `
      <div class="tx-row">
        <div class="tx-row__left">
          <div class="tx-row__icon">
            <span class="material-symbols-outlined">${catInfo.icon}</span>
          </div>
          <div class="tx-row__info">
            <span class="tx-row__name">${tx.merchant}</span>
            <span class="tx-row__category">${catInfo.label}${isPending ? ' · 承認待ち' : ''}</span>
          </div>
        </div>
        <div class="tx-row__right">
          <span class="tx-row__amount ${isPending ? '' : 'tx-row__amount--highlight'}">${Store.formatYen(tx.amount)}</span>
          <span class="tx-row__time">${Store.formatTime(tx.timestamp)}</span>
        </div>
      </div>
    `;
  }

  function updateLiveStats() {
    const burnEl = document.getElementById('dash-burn-rate');
    const exhaustEl = document.getElementById('dash-exhaust-time');
    const utilEl = document.getElementById('dash-util-pct');

    if (burnEl) burnEl.textContent = Store.formatYen(Store.getBurnRate());
    if (utilEl) utilEl.textContent = Store.getUtilizationPct().toFixed(1) + '%';
    if (exhaustEl) {
      const t = Store.getExhaustionTime();
      if (t) {
        exhaustEl.textContent = t.getHours().toString().padStart(2, '0') + ':' + t.getMinutes().toString().padStart(2, '0');
      }
    }
  }

  return { init, render, updateLiveStats };
})();

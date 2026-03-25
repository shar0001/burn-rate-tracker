/* ============================================================
   Settings Screen - 予算・アラート設定
   ============================================================ */

const SettingsScreen = (() => {
  let container;

  function init() {
    container = document.getElementById('screen-settings');
    render();
  }

  function render() {
    const budget = Store.getBudget();
    const alerts = Store.getAlerts();
    const operational = Store.getOperationalBudget();
    const contingency = Store.getContingencyAmount();
    const totalSpent = Store.getTotalSpent();
    const utilPct = Store.getUtilizationPct();

    // SVG donut for allocation preview
    const radius = 70;
    const circ = 2 * Math.PI * radius;
    const operPct = ((operational - totalSpent) / budget.total) * 100;
    const contPct = (contingency / budget.total) * 100;
    const spentPct = (totalSpent / budget.total) * 100;

    container.innerHTML = `
      <div class="space-y-lg stagger">

        <!-- Header -->
        <div>
          <p class="text-label color-muted">SYSTEM CONFIGURATION</p>
          <h2 class="text-headline-lg" style="font-weight:300;">予算とアラート設定</h2>
        </div>

        <!-- Base Budget -->
        <section class="glass-panel">
          <div class="flex items-center gap-sm mb-md">
            <span class="material-symbols-outlined color-primary" style="font-size:18px;font-variation-settings:'FILL' 1;">account_balance</span>
            <span class="text-label">基本予算構成</span>
          </div>

          <div class="space-y">
            <div class="form-group">
              <label class="form-label">基本予算 (Base Budget)</label>
              <input type="text" class="form-input form-input--lg" id="setting-budget"
                value="${Store.formatYen(budget.total)}" inputmode="numeric">
            </div>
            <div class="form-group">
              <label class="form-label">予備費率 (Contingency %)</label>
              <div class="flex items-center gap-md">
                <input type="range" class="range-slider" id="setting-contingency"
                  min="0" max="30" step="1" value="${budget.contingencyPct}" style="flex:1;">
                <span class="font-headline" style="font-size:1.25rem;min-width:50px;text-align:right;" id="contingency-display">${budget.contingencyPct}%</span>
              </div>
            </div>

            <!-- Budget Preview -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-sm);margin-top:var(--space-sm);">
              <div style="background:var(--surface-container-lowest);padding:var(--space-sm);border-radius:var(--radius-md);">
                <p class="text-label-sm color-muted">運用予算</p>
                <p class="font-headline" style="font-size:1rem;" id="preview-operational">${Store.formatYenCompact(operational)}</p>
              </div>
              <div style="background:var(--surface-container-lowest);padding:var(--space-sm);border-radius:var(--radius-md);">
                <p class="text-label-sm color-muted">予備費</p>
                <p class="font-headline color-tertiary" style="font-size:1rem;" id="preview-contingency">${Store.formatYenCompact(contingency)}</p>
              </div>
            </div>
          </div>
        </section>

        <!-- Alert Thresholds -->
        <section class="glass-panel">
          <div class="flex items-center gap-sm mb-md">
            <span class="material-symbols-outlined color-tertiary" style="font-size:18px;font-variation-settings:'FILL' 1;">notifications_active</span>
            <span class="text-label">アラート閾値設定</span>
          </div>

          <div class="space-y-lg">
            <!-- Warning -->
            <div class="form-group">
              <div class="flex justify-between items-center">
                <label class="form-label">警告 (Warning)</label>
                <span class="font-headline color-tertiary" id="alert-warning-display">${alerts.warningPct}%</span>
              </div>
              <input type="range" class="range-slider" id="setting-warning"
                min="30" max="100" step="5" value="${alerts.warningPct}"
                style="accent-color:var(--tertiary);">
            </div>

            <!-- Critical -->
            <div class="form-group">
              <div class="flex justify-between items-center">
                <label class="form-label">重要 (Critical)</label>
                <span class="font-headline color-error" id="alert-critical-display">${alerts.criticalPct}%</span>
              </div>
              <input type="range" class="range-slider" id="setting-critical"
                min="50" max="100" step="5" value="${alerts.criticalPct}">
            </div>

            <!-- Overdrive -->
            <div class="form-group">
              <div class="flex justify-between items-center">
                <label class="form-label">限界 (Overdrive)</label>
                <span class="font-headline" style="color:var(--error);font-weight:700;" id="alert-overdrive-display">${alerts.overdrivePct}%</span>
              </div>
              <input type="range" class="range-slider" id="setting-overdrive"
                min="70" max="100" step="5" value="${alerts.overdrivePct}">
            </div>
          </div>
        </section>

        <!-- Notification Settings -->
        <section class="glass-panel">
          <div class="flex items-center gap-sm mb-md">
            <span class="material-symbols-outlined color-primary" style="font-size:18px;font-variation-settings:'FILL' 1;">send</span>
            <span class="text-label">通知設定</span>
          </div>

          <div class="space-y">
            <div class="flex justify-between items-center" style="padding:var(--space-sm) 0;">
              <div class="flex items-center gap-sm">
                <span class="material-symbols-outlined color-muted" style="font-size:20px;">phone_iphone</span>
                <span class="text-body">プッシュ通知</span>
              </div>
              <div class="toggle ${alerts.pushEnabled ? 'active' : ''}" id="toggle-push" role="switch" aria-checked="${alerts.pushEnabled}"></div>
            </div>
            <div style="border-top:0.5px solid var(--outline-variant);"></div>
            <div class="flex justify-between items-center" style="padding:var(--space-sm) 0;">
              <div class="flex items-center gap-sm">
                <span class="material-symbols-outlined color-muted" style="font-size:20px;">tag</span>
                <span class="text-body">Slack 連携</span>
              </div>
              <div class="toggle ${alerts.slackEnabled ? 'active' : ''}" id="toggle-slack" role="switch" aria-checked="${alerts.slackEnabled}"></div>
            </div>
          </div>
        </section>

        <!-- Save & Actions -->
        <button class="btn btn--primary" id="btn-save-settings">
          <span class="material-symbols-outlined" style="font-size:18px;">save</span>
          設定を保存する
        </button>

        <div style="margin-top:var(--space-xl);border-top:0.5px solid var(--outline-variant);padding-top:var(--space-lg);">
          <p class="text-label color-muted mb-md">データ管理</p>
          <button class="btn btn--outline" id="btn-reset-data" style="border-color:var(--error);color:var(--error);">
            <span class="material-symbols-outlined" style="font-size:18px;">delete_forever</span>
            データをリセット
          </button>
        </div>

        <div style="height:var(--space-xl);"></div>
      </div>
    `;

    bindEvents();
  }

  function bindEvents() {
    // Budget input
    const budgetInput = document.getElementById('setting-budget');
    budgetInput.addEventListener('focus', () => {
      const raw = budgetInput.value.replace(/[^0-9]/g, '');
      budgetInput.value = raw;
    });
    budgetInput.addEventListener('blur', () => {
      const val = parseInt(budgetInput.value.replace(/[^0-9]/g, '')) || 0;
      budgetInput.value = Store.formatYen(val);
    });

    // Contingency slider
    const contSlider = document.getElementById('setting-contingency');
    contSlider.addEventListener('input', () => {
      const val = parseInt(contSlider.value);
      document.getElementById('contingency-display').textContent = val + '%';
      // Live preview
      const budgetVal = parseInt(budgetInput.value.replace(/[^0-9]/g, '')) || Store.getBudget().total;
      const cont = budgetVal * (val / 100);
      const oper = budgetVal - cont;
      document.getElementById('preview-operational').textContent = Store.formatYenCompact(oper);
      document.getElementById('preview-contingency').textContent = Store.formatYenCompact(cont);
    });

    // Alert sliders
    const warningSlider = document.getElementById('setting-warning');
    const criticalSlider = document.getElementById('setting-critical');
    const overdriveSlider = document.getElementById('setting-overdrive');

    warningSlider.addEventListener('input', () => {
      document.getElementById('alert-warning-display').textContent = warningSlider.value + '%';
    });
    criticalSlider.addEventListener('input', () => {
      document.getElementById('alert-critical-display').textContent = criticalSlider.value + '%';
    });
    overdriveSlider.addEventListener('input', () => {
      document.getElementById('alert-overdrive-display').textContent = overdriveSlider.value + '%';
    });

    // Toggles
    document.getElementById('toggle-push').addEventListener('click', function() {
      this.classList.toggle('active');
    });
    document.getElementById('toggle-slack').addEventListener('click', function() {
      this.classList.toggle('active');
    });

    // Save button
    document.getElementById('btn-save-settings').addEventListener('click', () => {
      const budgetVal = parseInt(budgetInput.value.replace(/[^0-9]/g, '')) || Store.getBudget().total;
      const contPct = parseInt(contSlider.value);
      const warnPct = parseInt(warningSlider.value);
      const critPct = parseInt(criticalSlider.value);
      const overPct = parseInt(overdriveSlider.value);
      const pushOn = document.getElementById('toggle-push').classList.contains('active');
      const slackOn = document.getElementById('toggle-slack').classList.contains('active');

      Store.updateBudget({ total: budgetVal, contingencyPct: contPct });
      Store.updateAlerts({
        warningPct: warnPct,
        criticalPct: critPct,
        overdrivePct: overPct,
        pushEnabled: pushOn,
        slackEnabled: slackOn,
      });

      App.showToast('設定を保存しました', 'success');
    });

    // Reset button
    document.getElementById('btn-reset-data').addEventListener('click', () => {
      if (confirm('すべてのデータをリセットしますか？この操作は取り消せません。')) {
        Store.reset();
        App.showToast('データをリセットしました', 'warning');
        render();
        DashboardScreen.render();
        StaffScreen.render();
      }
    });
  }

  return { init, render };
})();

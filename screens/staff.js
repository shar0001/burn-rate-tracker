/* ============================================================
   Staff Screen - スタッフ別ウォレット管理
   ============================================================ */

const StaffScreen = (() => {
  let container;

  function init() {
    container = document.getElementById('screen-staff');
    render();
  }

  function render() {
    const staff = Store.getStaff();
    const totalAllocated = staff.reduce((sum, s) => sum + s.allocated, 0);
    const liveBurnPct = Store.getUtilizationPct();

    container.innerHTML = `
      <div class="space-y-lg stagger">

        <!-- Header -->
        <div>
          <h2 class="text-headline-lg" style="font-weight:300;">スタッフ小口現金管理</h2>
          <p class="text-label color-muted mt-xs">STAFF WALLETS & UTILIZATION</p>
        </div>

        <!-- Summary Cards -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-md);">
          <div class="glass-panel glass-panel--compact">
            <p class="text-label-sm color-muted">総配分額</p>
            <p class="font-headline" style="font-size:1.5rem;font-weight:300;color:var(--secondary-container);">${Store.formatYenCompact(totalAllocated)}</p>
          </div>
          <div class="glass-panel glass-panel--compact">
            <p class="text-label-sm color-muted">ライブ消化率</p>
            <p class="font-headline" style="font-size:1.5rem;font-weight:300;">${liveBurnPct.toFixed(0)}%</p>
          </div>
        </div>

        <!-- Staff List -->
        <div class="space-y">
          ${staff.map(s => renderStaffCard(s)).join('')}
        </div>

        <!-- Add Staff Button -->
        <button class="btn btn--outline" id="btn-add-staff" style="border-style:dashed;">
          <span class="material-symbols-outlined" style="font-size:18px;">add</span>
          スタッフを追加
        </button>

      </div>
    `;

    // Event listeners
    document.getElementById('btn-add-staff').addEventListener('click', showAddStaffModal);

    // Top-up buttons
    document.querySelectorAll('.staff-topup-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const staffId = btn.dataset.staffId;
        showTopUpModal(staffId);
      });
    });
  }

  function renderStaffCard(s) {
    const spent = Store.getStaffSpent(s.id);
    const remaining = Store.getStaffRemaining(s.id);
    const utilPct = Store.getStaffUtilization(s.id);
    const isLow = remaining < s.allocated * 0.2;

    // Color based on utilization
    let progressClass = 'progress-bar__fill--primary';
    let borderColor = 'var(--primary-container)';
    if (utilPct > 90) {
      progressClass = 'progress-bar__fill--error';
      borderColor = 'var(--error)';
    } else if (utilPct > 75) {
      progressClass = 'progress-bar__fill--tertiary';
      borderColor = 'var(--tertiary)';
    }

    return `
      <div class="staff-card" style="border-left-color:${borderColor};">
        <div class="staff-card__header">
          <div class="staff-card__profile">
            <div class="staff-card__avatar">${s.avatar}</div>
            <div>
              <div class="staff-card__name">${s.name}</div>
              <div class="staff-card__role">${s.role}</div>
            </div>
          </div>
          <div class="staff-card__balance">
            <div class="staff-card__balance-label">残高</div>
            <div class="staff-card__balance-value" style="${isLow ? 'color:var(--error);' : ''}">${Store.formatYen(remaining)}</div>
          </div>
        </div>
        <div class="staff-card__footer">
          <div class="flex items-center gap-sm" style="flex:1;">
            <span class="staff-card__utilization-label">利用率</span>
            <div class="progress-bar" style="flex:1;">
              <div class="${progressClass} progress-bar__fill" style="width:${Math.min(utilPct, 100)}%;"></div>
            </div>
            <span class="text-label-sm" style="min-width:30px;text-align:right;">${utilPct.toFixed(0)}%</span>
          </div>
          <button class="btn btn--sm btn--outline staff-topup-btn" data-staff-id="${s.id}" style="margin-left:var(--space-sm);width:auto;padding:4px 12px;">
            <span class="material-symbols-outlined" style="font-size:14px;">add_card</span>
          </button>
        </div>
      </div>
    `;
  }

  function showAddStaffModal() {
    const overlay = document.getElementById('modal-quick-add');
    const content = overlay.querySelector('.modal-content');

    content.innerHTML = `
      <div class="modal-handle"></div>
      <div class="modal-header">
        <h2 class="text-headline">スタッフを追加</h2>
        <button class="btn--icon" onclick="document.getElementById('modal-quick-add').classList.remove('active')">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      <div class="space-y">
        <div class="form-group">
          <label class="form-label">氏名</label>
          <input type="text" class="form-input" id="new-staff-name" placeholder="例: 鈴木 太郎">
        </div>
        <div class="form-group">
          <label class="form-label">役職</label>
          <input type="text" class="form-input" id="new-staff-role" placeholder="例: サードPM">
        </div>
        <div class="form-group">
          <label class="form-label">仮払金額 (¥)</label>
          <input type="number" class="form-input form-input--lg" id="new-staff-amount" placeholder="0" inputmode="numeric">
        </div>
        <button class="btn btn--secondary mt-md" id="submit-add-staff">
          <span class="material-symbols-outlined" style="font-size:18px;">person_add</span>
          追加する
        </button>
      </div>
    `;

    overlay.classList.add('active');

    document.getElementById('submit-add-staff').addEventListener('click', () => {
      const name = document.getElementById('new-staff-name').value.trim();
      const role = document.getElementById('new-staff-role').value.trim();
      const amount = parseInt(document.getElementById('new-staff-amount').value) || 0;

      if (!name) {
        App.showToast('氏名を入力してください', 'warning');
        return;
      }

      const initials = name.split(/\s+/).map(n => n.charAt(0)).join('').slice(0, 2);
      Store.addStaff({ name, role: role || 'スタッフ', allocated: amount, avatar: initials });

      overlay.classList.remove('active');
      App.showToast(`${name} を追加しました`, 'success');
      render();

      // Restore original modal content
      restoreQuickAddModal();
    });

    overlay.addEventListener('click', function handler(e) {
      if (e.target === overlay) {
        overlay.classList.remove('active');
        restoreQuickAddModal();
        overlay.removeEventListener('click', handler);
      }
    });
  }

  function showTopUpModal(staffId) {
    const staff = Store.getStaffById(staffId);
    if (!staff) return;

    const overlay = document.getElementById('modal-quick-add');
    const content = overlay.querySelector('.modal-content');

    content.innerHTML = `
      <div class="modal-handle"></div>
      <div class="modal-header">
        <h2 class="text-headline">${staff.name} - 追加配分</h2>
        <button class="btn--icon" onclick="document.getElementById('modal-quick-add').classList.remove('active')">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      <div class="space-y">
        <div class="glass-panel glass-panel--compact mb-md">
          <div class="flex justify-between">
            <span class="text-body-sm color-muted">現在の配分額</span>
            <span class="text-body-sm" style="font-weight:600;">${Store.formatYen(staff.allocated)}</span>
          </div>
          <div class="flex justify-between mt-xs">
            <span class="text-body-sm color-muted">使用済み</span>
            <span class="text-body-sm" style="font-weight:600;">${Store.formatYen(Store.getStaffSpent(staffId))}</span>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">追加金額 (¥)</label>
          <input type="number" class="form-input form-input--lg" id="topup-amount" placeholder="0" inputmode="numeric">
        </div>
        <button class="btn btn--primary mt-md" id="submit-topup">
          <span class="material-symbols-outlined" style="font-size:18px;">add_card</span>
          追加投入
        </button>
      </div>
    `;

    overlay.classList.add('active');

    document.getElementById('submit-topup').addEventListener('click', () => {
      const amount = parseInt(document.getElementById('topup-amount').value) || 0;
      if (amount <= 0) {
        App.showToast('金額を入力してください', 'warning');
        return;
      }

      Store.updateStaff(staffId, { allocated: staff.allocated + amount });
      overlay.classList.remove('active');
      App.showToast(`${staff.name} に ${Store.formatYen(amount)} を追加しました`, 'success');
      render();
      restoreQuickAddModal();
    });
  }

  function restoreQuickAddModal() {
    // Rebuild the original quick add modal on next open via App init
    setTimeout(() => {
      const content = document.querySelector('#modal-quick-add .modal-content');
      content.innerHTML = `
        <div class="modal-handle"></div>
        <div class="modal-header">
          <h2 class="text-headline">クイック支出入力</h2>
          <button class="btn--icon" id="modal-quick-close">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div class="space-y">
          <div class="form-group">
            <label class="form-label"><span class="material-symbols-outlined" style="font-size:14px;">payments</span> 金額 (¥)</label>
            <input type="number" class="form-input form-input--lg" id="quick-amount" placeholder="0" inputmode="numeric">
          </div>
          <div class="form-group">
            <label class="form-label">店名・内容</label>
            <input type="text" class="form-input" id="quick-merchant" placeholder="例: カフェ、タクシー代">
          </div>
          <div class="form-group">
            <label class="form-label">カテゴリ</label>
            <div class="flex gap-sm" style="flex-wrap:wrap;" id="quick-categories">
              <button class="chip chip--success quick-cat active" data-cat="food">🍱 弁当・ケータリング</button>
              <button class="chip quick-cat" data-cat="transport">🚕 交通費</button>
              <button class="chip quick-cat" data-cat="equipment">📷 機材</button>
              <button class="chip quick-cat" data-cat="supplies">📦 備品</button>
              <button class="chip quick-cat" data-cat="venue">🏢 ロケ費</button>
              <button class="chip quick-cat" data-cat="other">📝 その他</button>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">スタッフ</label>
            <select class="form-input" id="quick-staff" style="font-size:0.875rem;">
              <option value="">-- PM直接 --</option>
            </select>
          </div>
          <button class="btn btn--primary mt-md" id="quick-submit">
            <span class="material-symbols-outlined" style="font-size:18px;">check_circle</span>
            記録する
          </button>
        </div>
      `;

      // Re-bind close
      document.getElementById('modal-quick-close')?.addEventListener('click', () => {
        document.getElementById('modal-quick-add').classList.remove('active');
      });
    }, 300);
  }

  return { init, render };
})();

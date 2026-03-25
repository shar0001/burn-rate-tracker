/* ============================================================
   App - ルーティング・初期化・グローバル制御
   リアルタイム・バーンレート・トラッカー
   ============================================================ */

const App = (() => {
  let currentScreen = 'dashboard';

  function init() {
    // データ読み込み
    Store.load();

    // ナビゲーション初期化
    initNavigation();

    // クイック追加モーダル初期化
    initQuickAdd();

    // 各スクリーン初期化
    DashboardScreen.init();
    ReceiptsScreen.init();
    StaffScreen.init();
    SettingsScreen.init();

    // ヘッダー更新
    updateHeader();

    // データ変更監視
    window.addEventListener('store:updated', () => {
      updateHeader();
      DashboardScreen.render();
      StaffScreen.render();
    });

    // 自動更新（バーンレートのリアルタイム感）
    setInterval(() => {
      if (currentScreen === 'dashboard') {
        updateHeader();
        DashboardScreen.updateLiveStats();
      }
    }, 30000); // 30秒ごと
  }

  function initNavigation() {
    const navItems = document.querySelectorAll('.nav-bottom__item');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const screen = item.dataset.screen;
        navigateTo(screen);
      });
    });
  }

  function navigateTo(screenName) {
    currentScreen = screenName;

    // ナビ更新
    document.querySelectorAll('.nav-bottom__item').forEach(item => {
      item.classList.toggle('active', item.dataset.screen === screenName);
    });

    // スクリーン切替
    document.querySelectorAll('.screen').forEach(screen => {
      screen.classList.remove('active');
    });
    const targetScreen = document.getElementById('screen-' + screenName);
    if (targetScreen) {
      targetScreen.classList.add('active');
    }

    // FAB表示制御（設定画面では非表示）
    const fab = document.getElementById('fab-quick-add');
    fab.style.display = screenName === 'settings' ? 'none' : 'flex';

    // スクロールトップ
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function updateHeader() {
    const totalEl = document.getElementById('header-live-total');
    const total = Store.getTotalCommitted();
    totalEl.textContent = 'LIVE: ' + Store.formatYenCompact(total);
  }

  // ---- Quick Add Modal ----
  function initQuickAdd() {
    const fab = document.getElementById('fab-quick-add');
    const overlay = document.getElementById('modal-quick-add');
    const closeBtn = document.getElementById('modal-quick-close');
    const submitBtn = document.getElementById('quick-submit');
    const catBtns = document.querySelectorAll('.quick-cat');
    let selectedCat = 'food';

    fab.addEventListener('click', () => {
      overlay.classList.add('active');
      // スタッフ選択肢を更新
      const select = document.getElementById('quick-staff');
      select.innerHTML = '<option value="">-- PM直接 --</option>';
      Store.getStaff().forEach(s => {
        select.innerHTML += `<option value="${s.id}">${s.name}</option>`;
      });
    });

    closeBtn.addEventListener('click', () => {
      overlay.classList.remove('active');
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('active');
    });

    catBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        catBtns.forEach(b => {
          b.classList.remove('active', 'chip--success');
        });
        btn.classList.add('active', 'chip--success');
        selectedCat = btn.dataset.cat;
      });
    });

    submitBtn.addEventListener('click', () => {
      const amount = parseInt(document.getElementById('quick-amount').value);
      const merchant = document.getElementById('quick-merchant').value.trim();
      const staffId = document.getElementById('quick-staff').value || null;

      if (!amount || amount <= 0) {
        showToast('金額を入力してください', 'warning');
        return;
      }

      Store.addTransaction({
        amount,
        merchant: merchant || Store.CATEGORIES[selectedCat].label,
        category: selectedCat,
        staffId,
      });

      // リセット
      document.getElementById('quick-amount').value = '';
      document.getElementById('quick-merchant').value = '';
      document.getElementById('quick-staff').value = '';
      overlay.classList.remove('active');

      showToast(`${Store.formatYen(amount)} を記録しました`, 'success');
    });
  }

  // ---- Toast ----
  function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const icon = document.getElementById('toast-icon');
    const msg = document.getElementById('toast-message');

    toast.className = 'toast';
    if (type === 'warning') {
      toast.classList.add('toast--warning');
      icon.textContent = 'warning';
      icon.className = 'material-symbols-outlined color-tertiary';
    } else if (type === 'error') {
      toast.classList.add('toast--error');
      icon.textContent = 'error';
      icon.className = 'material-symbols-outlined color-error';
    } else {
      icon.textContent = 'check_circle';
      icon.className = 'material-symbols-outlined color-secondary';
    }
    msg.textContent = message;

    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }

  // DOMContentLoaded
  document.addEventListener('DOMContentLoaded', init);

  return { navigateTo, showToast };
})();

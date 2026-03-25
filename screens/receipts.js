/* ============================================================
   Receipts Screen - 領収書スキャン & OCR承認
   ============================================================ */

const ReceiptsScreen = (() => {
  let container;
  let mockScanData = null;

  const MOCK_RECEIPTS = [
    { merchant: 'TOKYO BISTRO ARC', amount: 7480, date: '2023-10-24', category: 'food', confidence: 98.4 },
    { merchant: 'BLUE BOTTLE SHIBUYA', amount: 1860, date: '2023-10-24', category: 'food', confidence: 95.2 },
    { merchant: 'NIHON KOTSU CO.', amount: 5420, date: '2023-10-23', category: 'transport', confidence: 97.8 },
    { merchant: 'AMAZON.CO.JP', amount: 42800, date: '2023-10-23', category: 'supplies', confidence: 99.1 },
  ];

  function init() {
    container = document.getElementById('screen-receipts');
    render();
  }

  function render() {
    const recentScans = Store.getTransactions()
      .filter(t => t.status === 'approved')
      .slice(0, 5);

    container.innerHTML = `
      <div class="space-y-lg stagger">

        <!-- Scanner Section -->
        <section>
          <div class="flex items-center justify-between mb-sm" style="padding:0 var(--space-sm);">
            <span class="text-label color-muted">スキャナー プレビュー</span>
            <div id="scan-status"></div>
          </div>

          <div class="scanner-preview glass-panel" id="scanner-area" style="cursor:pointer;">
            <div id="scanner-content" style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:var(--space-md);">
              <span class="material-symbols-outlined" style="font-size:48px;color:var(--on-surface-variant);opacity:0.5;">photo_camera</span>
              <p class="text-body color-muted text-center">タップして領収書を撮影<br><span class="text-label-sm">または画像ファイルを選択</span></p>
            </div>
            <div class="scanner-preview__corner scanner-preview__corner--tl"></div>
            <div class="scanner-preview__corner scanner-preview__corner--tr"></div>
            <div class="scanner-preview__corner scanner-preview__corner--bl"></div>
            <div class="scanner-preview__corner scanner-preview__corner--br"></div>
            <input type="file" accept="image/*" capture="environment" id="scanner-input" style="display:none;">
          </div>
        </section>

        <!-- OCR Results (hidden initially) -->
        <section id="ocr-results" style="display:none;">
          <div class="flex items-center gap-sm mb-md">
            <span class="material-symbols-outlined color-primary" style="font-variation-settings:'FILL' 1;">analytics</span>
            <h2 class="text-headline">抽出されたデータ</h2>
          </div>

          <div class="bento-grid">
            <!-- Merchant (Full Width) -->
            <div class="bento-grid__item bento-grid__item--full glass-panel glass-panel--compact">
              <span class="text-label color-muted mb-xs">加盟店</span>
              <div class="flex justify-between items-center">
                <span class="font-headline" style="font-size:1.25rem;" id="ocr-merchant">---</span>
                <span class="material-symbols-outlined color-secondary" style="font-variation-settings:'FILL' 1;">verified</span>
              </div>
            </div>

            <!-- Amount -->
            <div class="bento-grid__item glass-panel glass-panel--compact" style="border-left:2px solid rgba(0,227,253,0.4);">
              <span class="text-label color-muted">合計金額</span>
              <span class="font-headline" style="font-size:1.5rem;font-weight:700;color:var(--secondary-container);" id="ocr-amount">---</span>
            </div>

            <!-- Date -->
            <div class="bento-grid__item glass-panel glass-panel--compact">
              <span class="text-label color-muted">日付</span>
              <span class="font-body" style="font-size:1.125rem;" id="ocr-date">---</span>
            </div>

            <!-- Category -->
            <div class="bento-grid__item glass-panel glass-panel--compact">
              <span class="text-label color-muted">カテゴリー</span>
              <div class="flex items-center gap-xs" id="ocr-category">
                <span class="material-symbols-outlined color-primary" style="font-size:16px;">restaurant</span>
                <span class="font-body" style="font-size:1.125rem;">---</span>
              </div>
            </div>

            <!-- Confidence -->
            <div class="bento-grid__item glass-panel glass-panel--compact">
              <span class="text-label color-muted">信頼度</span>
              <span class="font-headline color-tertiary" style="font-size:1.125rem;font-weight:700;" id="ocr-confidence">---</span>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="space-y mt-lg">
            <button class="btn btn--primary" id="ocr-approve">
              <span class="material-symbols-outlined" style="font-size:18px;">check_circle</span>
              承認して保存 (APPROVE)
            </button>
            <button class="btn btn--outline" id="ocr-edit">
              <span class="material-symbols-outlined" style="font-size:18px;">edit</span>
              修正する (EDIT)
            </button>
          </div>
        </section>

        <!-- Scan History -->
        <section>
          <div class="section-header">
            <h3 class="section-header__title">最近のスキャン履歴</h3>
            <span class="section-header__link">すべて表示</span>
          </div>
          <div class="glass-panel glass-panel--compact space-y-sm" id="scan-history">
            ${recentScans.length > 0 ? recentScans.map(tx => renderScanHistoryRow(tx)).join('') : '<p class="text-body color-muted text-center" style="padding:var(--space-lg);">スキャン履歴がありません</p>'}
          </div>
        </section>

      </div>
    `;

    // Event listeners
    const scannerArea = document.getElementById('scanner-area');
    const scannerInput = document.getElementById('scanner-input');

    scannerArea.addEventListener('click', () => {
      scannerInput.click();
    });

    scannerInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) handleScan(file);
    });

    const approveBtn = document.getElementById('ocr-approve');
    const editBtn = document.getElementById('ocr-edit');

    if (approveBtn) {
      approveBtn.addEventListener('click', handleApprove);
    }
    if (editBtn) {
      editBtn.addEventListener('click', handleEdit);
    }
  }

  function handleScan(file) {
    // Show loading state
    const statusEl = document.getElementById('scan-status');
    statusEl.innerHTML = `<span class="chip chip--warning"><span class="material-symbols-outlined" style="font-size:12px;animation:spin 1s linear infinite;">sync</span> スキャン中...</span>`;

    // Show image preview
    const contentEl = document.getElementById('scanner-content');
    const reader = new FileReader();
    reader.onload = (e) => {
      contentEl.innerHTML = `<img src="${e.target.result}" alt="領収書" style="width:100%;height:100%;object-fit:cover;border-radius:var(--radius-lg);opacity:0.8;filter:grayscale(30%);">`;
    };
    reader.readAsDataURL(file);

    // Simulate OCR with random mock data
    setTimeout(() => {
      const mockIdx = Math.floor(Math.random() * MOCK_RECEIPTS.length);
      mockScanData = { ...MOCK_RECEIPTS[mockIdx] };

      statusEl.innerHTML = `<span class="chip chip--success"><span class="material-symbols-outlined" style="font-size:12px;">check_circle</span> SUCCESS</span>`;

      showOCRResults(mockScanData);
    }, 1500);
  }

  function showOCRResults(data) {
    const resultsEl = document.getElementById('ocr-results');
    resultsEl.style.display = 'block';

    const catInfo = Store.CATEGORIES[data.category] || Store.CATEGORIES.other;

    document.getElementById('ocr-merchant').textContent = data.merchant;
    document.getElementById('ocr-amount').textContent = Store.formatYen(data.amount);
    document.getElementById('ocr-date').textContent = data.date;
    document.getElementById('ocr-category').innerHTML = `
      <span class="material-symbols-outlined color-primary" style="font-size:16px;">${catInfo.icon}</span>
      <span class="font-body" style="font-size:1.125rem;">${catInfo.label}</span>
    `;
    document.getElementById('ocr-confidence').textContent = data.confidence + '%';

    // Scroll to results
    resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function handleApprove() {
    if (!mockScanData) return;

    Store.addTransaction({
      amount: mockScanData.amount,
      merchant: mockScanData.merchant,
      category: mockScanData.category,
      staffId: null,
      status: 'approved',
    });

    App.showToast(`${Store.formatYen(mockScanData.amount)} を承認しました`, 'success');
    mockScanData = null;

    // Reset scanner
    setTimeout(() => render(), 500);
  }

  function handleEdit() {
    if (!mockScanData) return;

    // Pre-fill quick add modal with OCR data
    document.getElementById('quick-amount').value = mockScanData.amount;
    document.getElementById('quick-merchant').value = mockScanData.merchant;
    document.getElementById('modal-quick-add').classList.add('active');

    mockScanData = null;
    document.getElementById('ocr-results').style.display = 'none';
  }

  function renderScanHistoryRow(tx) {
    const catInfo = Store.CATEGORIES[tx.category] || Store.CATEGORIES.other;
    return `
      <div class="flex items-center justify-between" style="padding:var(--space-sm) 0;border-bottom:0.5px solid var(--outline-variant);">
        <div class="flex items-center gap-sm">
          <span class="material-symbols-outlined color-muted" style="font-size:18px;">${catInfo.icon}</span>
          <div>
            <p class="text-body-sm">${tx.merchant}</p>
            <p class="text-label-sm color-muted">${Store.formatDate(tx.timestamp)}</p>
          </div>
        </div>
        <div class="flex items-center gap-sm">
          <span class="chip chip--success" style="padding:2px 8px;font-size:9px;">APPROVED</span>
          <span class="text-body-sm" style="font-weight:600;">${Store.formatYen(tx.amount)}</span>
        </div>
      </div>
    `;
  }

  // Add spin animation
  if (!document.getElementById('spin-style')) {
    const style = document.createElement('style');
    style.id = 'spin-style';
    style.textContent = '@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }';
    document.head.appendChild(style);
  }

  return { init, render };
})();

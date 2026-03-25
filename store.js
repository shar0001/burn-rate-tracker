/* ============================================================
   Store - データモデル & LocalStorage永続化
   リアルタイム・バーンレート・トラッカー
   ============================================================ */

const Store = (() => {
  const STORAGE_KEY = 'obsidian_command_data';

  // カテゴリ定義
  const CATEGORIES = {
    food: { label: '弁当・ケータリング', icon: 'restaurant', emoji: '🍱' },
    transport: { label: '交通費', icon: 'local_taxi', emoji: '🚕' },
    equipment: { label: '機材', icon: 'camera_roll', emoji: '📷' },
    supplies: { label: '備品', icon: 'inventory_2', emoji: '📦' },
    venue: { label: 'ロケ費', icon: 'location_on', emoji: '🏢' },
    talent: { label: 'タレント費', icon: 'person', emoji: '🎭' },
    postproduction: { label: 'ポスプロ', icon: 'movie_edit', emoji: '🎬' },
    other: { label: 'その他', icon: 'receipt_long', emoji: '📝' },
  };

  // デフォルトデータ
  function getDefaultData() {
    const now = Date.now();
    return {
      budget: {
        total: 12500000,         // ¥12,500,000
        contingencyPct: 10,      // 10%
        currency: 'JPY',
        projectName: 'Project Obsidian',
        fiscalYear: 'FY2024',
      },
      alerts: {
        warningPct: 70,
        criticalPct: 85,
        overdrivePct: 95,
        pushEnabled: true,
        slackEnabled: false,
      },
      staff: [
        { id: 's1', name: '田中 健太', role: 'プロダクションマネージャー', allocated: 200000, avatar: 'KT' },
        { id: 's2', name: '佐藤 美咲', role: 'リードスタイリスト', allocated: 250000, avatar: 'MS' },
        { id: 's3', name: '山本 浩志', role: 'キーグリップ', allocated: 150000, avatar: 'HY' },
        { id: 's4', name: '伊藤 ユキ', role: 'ケータリングリード', allocated: 120000, avatar: 'YI' },
      ],
      transactions: [
        { id: 't1', timestamp: now - 3600000 * 2, amount: 450000, merchant: 'Arri Rental Tokyo', category: 'equipment', staffId: null, status: 'approved' },
        { id: 't2', timestamp: now - 3600000 * 4, amount: 85200, merchant: 'ケータリングサービス', category: 'food', staffId: 's4', status: 'approved' },
        { id: 't3', timestamp: now - 3600000 * 6, amount: 12400, merchant: 'ロケ地移動タクシー', category: 'transport', staffId: 's1', status: 'approved' },
        { id: 't4', timestamp: now - 3600000 * 8, amount: 5420, merchant: 'BLUE BOTTLE SHIBUYA', category: 'food', staffId: 's2', status: 'approved' },
        { id: 't5', timestamp: now - 3600000 * 10, amount: 1860, merchant: 'コンビニ（備品）', category: 'supplies', staffId: 's1', status: 'approved' },
        { id: 't6', timestamp: now - 3600000 * 12, amount: 42800, merchant: 'Amazon.co.jp', category: 'supplies', staffId: null, status: 'approved' },
        { id: 't7', timestamp: now - 3600000 * 1, amount: 18000, merchant: 'スタジオ延長料金', category: 'venue', staffId: null, status: 'pending' },
        { id: 't8', timestamp: now - 3600000 * 0.5, amount: 7480, merchant: 'TOKYO BISTRO ARC', category: 'food', staffId: 's2', status: 'pending' },
      ],
      shootStartTime: now - 3600000 * 12, // 12時間前に撮影開始
      _version: 1,
    };
  }

  let data = null;

  function load() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        data = JSON.parse(stored);
      } else {
        data = getDefaultData();
        save();
      }
    } catch (e) {
      console.warn('Store: Failed to load, using defaults', e);
      data = getDefaultData();
    }
    return data;
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Store: Failed to save', e);
    }
    // 変更通知
    window.dispatchEvent(new CustomEvent('store:updated'));
  }

  function reset() {
    data = getDefaultData();
    save();
  }

  // ---- Budget ----
  function getBudget() { return data.budget; }
  function updateBudget(updates) {
    Object.assign(data.budget, updates);
    save();
  }

  // ---- Alerts ----
  function getAlerts() { return data.alerts; }
  function updateAlerts(updates) {
    Object.assign(data.alerts, updates);
    save();
  }

  // ---- Staff ----
  function getStaff() { return data.staff; }
  function getStaffById(id) { return data.staff.find(s => s.id === id); }
  function addStaff(staff) {
    staff.id = 's' + Date.now();
    data.staff.push(staff);
    save();
    return staff;
  }
  function updateStaff(id, updates) {
    const s = data.staff.find(s => s.id === id);
    if (s) { Object.assign(s, updates); save(); }
  }
  function removeStaff(id) {
    data.staff = data.staff.filter(s => s.id !== id);
    save();
  }

  // ---- Transactions ----
  function getTransactions() {
    return data.transactions.sort((a, b) => b.timestamp - a.timestamp);
  }
  function addTransaction(tx) {
    tx.id = 't' + Date.now();
    tx.timestamp = tx.timestamp || Date.now();
    tx.status = tx.status || 'approved';
    data.transactions.push(tx);
    save();
    return tx;
  }
  function updateTransaction(id, updates) {
    const tx = data.transactions.find(t => t.id === id);
    if (tx) { Object.assign(tx, updates); save(); }
  }
  function removeTransaction(id) {
    data.transactions = data.transactions.filter(t => t.id !== id);
    save();
  }

  // ---- Calculations ----
  function getTotalSpent() {
    return data.transactions
      .filter(t => t.status === 'approved')
      .reduce((sum, t) => sum + t.amount, 0);
  }

  function getTotalPending() {
    return data.transactions
      .filter(t => t.status === 'pending')
      .reduce((sum, t) => sum + t.amount, 0);
  }

  function getTotalCommitted() {
    return getTotalSpent() + getTotalPending();
  }

  function getRemainingBudget() {
    return data.budget.total - getTotalCommitted();
  }

  function getContingencyAmount() {
    return data.budget.total * (data.budget.contingencyPct / 100);
  }

  function getOperationalBudget() {
    return data.budget.total - getContingencyAmount();
  }

  function getBurnRate() {
    const elapsedMs = Date.now() - data.shootStartTime;
    const elapsedHours = elapsedMs / (1000 * 60 * 60);
    if (elapsedHours <= 0) return 0;
    return Math.round(getTotalSpent() / elapsedHours);
  }

  function getUtilizationPct() {
    const total = data.budget.total;
    if (total <= 0) return 0;
    return (getTotalCommitted() / total) * 100;
  }

  function getExhaustionTime() {
    const burnRate = getBurnRate();
    if (burnRate <= 0) return null;
    const remaining = getRemainingBudget();
    const hoursLeft = remaining / burnRate;
    const exhaustTime = new Date(Date.now() + hoursLeft * 3600000);
    return exhaustTime;
  }

  function getStaffSpent(staffId) {
    return data.transactions
      .filter(t => t.staffId === staffId && t.status === 'approved')
      .reduce((sum, t) => sum + t.amount, 0);
  }

  function getStaffRemaining(staffId) {
    const staff = getStaffById(staffId);
    if (!staff) return 0;
    return staff.allocated - getStaffSpent(staffId);
  }

  function getStaffUtilization(staffId) {
    const staff = getStaffById(staffId);
    if (!staff || staff.allocated <= 0) return 0;
    return (getStaffSpent(staffId) / staff.allocated) * 100;
  }

  function getCategoryBreakdown() {
    const breakdown = {};
    data.transactions.filter(t => t.status === 'approved').forEach(t => {
      if (!breakdown[t.category]) breakdown[t.category] = 0;
      breakdown[t.category] += t.amount;
    });
    return breakdown;
  }

  function getAlertLevel() {
    const pct = getUtilizationPct();
    if (pct >= data.alerts.overdrivePct) return 'critical';
    if (pct >= data.alerts.criticalPct) return 'warning';
    if (pct >= data.alerts.warningPct) return 'caution';
    return 'normal';
  }

  // ---- Formatting Helpers ----
  function formatYen(amount) {
    return '¥' + Math.abs(amount).toLocaleString('ja-JP');
  }

  function formatYenCompact(amount) {
    if (Math.abs(amount) >= 1000000) {
      return '¥' + (amount / 1000000).toFixed(1) + 'M';
    }
    if (Math.abs(amount) >= 1000) {
      return '¥' + (amount / 1000).toFixed(1) + 'k';
    }
    return '¥' + amount.toLocaleString('ja-JP');
  }

  function formatTime(timestamp) {
    const d = new Date(timestamp);
    return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
  }

  function formatDate(timestamp) {
    const d = new Date(timestamp);
    return d.getFullYear() + '-' + (d.getMonth() + 1).toString().padStart(2, '0') + '-' + d.getDate().toString().padStart(2, '0');
  }

  return {
    CATEGORIES,
    load, save, reset,
    getBudget, updateBudget,
    getAlerts, updateAlerts,
    getStaff, getStaffById, addStaff, updateStaff, removeStaff,
    getTransactions, addTransaction, updateTransaction, removeTransaction,
    getTotalSpent, getTotalPending, getTotalCommitted,
    getRemainingBudget, getContingencyAmount, getOperationalBudget,
    getBurnRate, getUtilizationPct, getExhaustionTime,
    getStaffSpent, getStaffRemaining, getStaffUtilization,
    getCategoryBreakdown, getAlertLevel,
    formatYen, formatYenCompact, formatTime, formatDate,
  };
})();

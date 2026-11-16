/**
 * File    : js/components/status-badge.js
 * Komponen: <ba-status-badge> — badge status stok.
 * Indikator: 1.3 Conditional (v-if / v-else-if / v-else), 1.2 v-bind :class & :style.
 *
 * Props  : qty (Number), safety (Number)
 * Logika : qty === 0 → Kosong (merah) | qty < safety → Menipis (oranye) | selain itu Aman (hijau)
 */
Vue.component('ba-status-badge', {
  props: {
    qty: { type: Number, required: true },
    safety: { type: Number, required: true }
  },

  computed: {
    // Satu sumber kebenaran status, dipakai template & warna badge
    status: function () {
      if (this.qty === 0) {
        return { key: 'kosong', label: 'Kosong', icon: '✕', warna: '#dc2626' };
      }
      if (this.qty < this.safety) {
        return { key: 'menipis', label: 'Menipis', icon: '⚠', warna: '#f59e0b' };
      }
      return { key: 'aman', label: 'Aman', icon: '✓', warna: '#16a34a' };
    }
  },

  template: '#tpl-status-badge'
});

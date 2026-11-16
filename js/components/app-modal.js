/**
 * File    : js/components/app-modal.js
 * Komponen: <app-modal> — modal umum (konfirmasi hapus, dsb).
 * Indikator: 1.1 props + $emit, 1.2 v-bind, 1.7 UI konsisten.
 *
 * Props : show (Boolean), title (String), confirmLabel, cancelLabel, danger (Boolean)
 * Emits : confirm, close
 * Slot  : isi konten modal
 */
Vue.component('app-modal', {
  props: {
    show: { type: Boolean, default: false },
    title: { type: String, default: 'Konfirmasi' },
    confirmLabel: { type: String, default: 'Ya' },
    cancelLabel: { type: String, default: 'Batal' },
    danger: { type: Boolean, default: false }
  },

  template: '#tpl-modal'
});

/**
 * File    : js/components/stock-table.js
 * Komponen: <ba-stock-table> — halaman Stok Bahan Ajar.
 * Indikator:
 *   1.2 v-for + filter kustom (currency, satuan) & v-html catatan
 *   1.3 dependent filter, empty state, tooltip v-show
 *   1.4 computed filteredStok / sortedStok / kategoriOptions (dependen)
 *   1.5 watcher filterUpbjj → reset filter kategori
 *   1.6 create/update/delete + validasi + @keyup.enter + @mouseenter/@mouseleave
 *
 * Props  : stok (Array), upbjjList (Array), kategoriList (Array)
 * Emits  : create-stok, update-stok ({ kodeLama, data }), delete-stok (kode)
 */
Vue.component('ba-stock-table', {
  props: {
    stok: { type: Array, required: true },
    upbjjList: { type: Array, default: function () { return []; } },
    kategoriList: { type: Array, default: function () { return []; } }
  },

  data: function () {
    return {
      filterUpbjj: 'Semua',
      filterKategori: 'Semua',
      onlyReorder: false,
      sortBy: 'judul',
      formOpen: false,
      editingKode: null,
      deleteTarget: null,
      // Tooltip posisinya fixed (mengikuti kursor) supaya tidak terpotong tabel
      tooltip: { show: false, html: '', x: 0, y: 0 }
    };
  },

  computed: {
    // Dependent options: kategori hanya yang tersedia di UT-Daerah terpilih
    kategoriOptions: function () {
      if (this.filterUpbjj === 'Semua') return this.kategoriList;

      var kategoriTerpakai = this.stok
        .filter(function (s) { return s.upbjj === this.filterUpbjj; }, this)
        .map(function (s) { return s.kategori; });

      return this.kategoriList.filter(function (k) {
        return kategoriTerpakai.indexOf(k) !== -1;
      });
    },

    filteredStok: function () {
      var upbjj = this.filterUpbjj;
      var kategori = this.filterKategori;
      var onlyReorder = this.onlyReorder;

      return this.stok.filter(function (s) {
        if (upbjj !== 'Semua' && s.upbjj !== upbjj) return false;
        if (kategori !== 'Semua' && s.kategori !== kategori) return false;
        if (onlyReorder && !(s.qty < s.safety || s.qty === 0)) return false;
        return true;
      });
    },

    sortedStok: function () {
      var by = this.sortBy;

      return this.filteredStok.slice().sort(function (a, b) {
        if (by === 'qty') return a.qty - b.qty;
        if (by === 'harga') return a.harga - b.harga;
        return String(a.judul).localeCompare(String(b.judul), 'id');
      });
    },

    // Baris yang sedang diedit (null = mode tambah baru)
    editingItem: function () {
      if (!this.editingKode) return null;

      return this.stok.filter(function (s) {
        return s.kode === this.editingKode;
      }, this)[0] || null;
    },

    jumlahReorder: function () {
      return this.stok.filter(function (s) {
        return s.qty < s.safety || s.qty === 0;
      }).length;
    }
  },

  watch: {
    // Wajib: saat UT-Daerah berubah, kategori tidak relevan lagi → reset
    filterUpbjj: function (newVal) {
      this.filterKategori = 'Semua';
      console.log('[watcher filterUpbjj] UT-Daerah →', newVal, '| filter kategori direset ke "Semua"');
    }
  },

  methods: {
    statusStok: function (item) {
      if (item.qty === 0) return 'Kosong';
      return item.qty < item.safety ? 'Menipis' : 'Aman';
    },

    resetFilter: function () {
      this.filterUpbjj = 'Semua';
      this.filterKategori = 'Semua';
      this.onlyReorder = false;
      this.sortBy = 'judul';
    },

    openCreate: function () {
      this.editingKode = null;
      this.formOpen = true;
      this.$nextTick(function () {
        if (this.$refs.form) this.$refs.form.focusFirst();
      });
    },

    openEdit: function (item) {
      this.editingKode = item.kode;
      this.formOpen = true;
      this.$nextTick(function () {
        if (this.$refs.form) this.$refs.form.focusFirst();
      });
    },

    closeForm: function () {
      this.formOpen = false;
      this.editingKode = null;
      // Panel ditutup setelah simpan/batal → kosongkan form untuk input berikutnya
      if (this.$refs.form) this.$refs.form.resetForm();
    },

    toggleForm: function () {
      if (this.formOpen) {
        this.closeForm();
      } else {
        this.openCreate();
      }
    },

    handleSave: function (payload) {
      var kodeBaru = payload.kode.toLowerCase();
      var editing = this.editingKode;

      // Kode MK adalah identitas baris → cegah duplikat
      var bentrok = this.stok.some(function (s) {
        return s.kode.toLowerCase() === kodeBaru && s.kode !== editing;
      });

      if (bentrok) {
        if (this.$refs.form) this.$refs.form.setError('kode', 'Kode MK sudah dipakai.');
        return;
      }

      if (editing) {
        this.$emit('update-stok', { kodeLama: editing, data: payload });
      } else {
        this.$emit('create-stok', payload);
      }
      this.closeForm();
    },

    openModal: function (item) {
      this.deleteTarget = item;
    },

    cancelDelete: function () {
      this.deleteTarget = null;
    },

    confirmDelete: function () {
      if (!this.deleteTarget) return;
      this.$emit('delete-stok', this.deleteTarget.kode);
      this.deleteTarget = null;
    },

    showTooltip: function (item, event) {
      this.tooltip = {
        show: true,
        html: item.catatanHTML || 'Tidak ada catatan.',
        x: Math.min(event.clientX + 14, window.innerWidth - 300),
        y: event.clientY + 16
      };
    },

    hideTooltip: function () {
      this.tooltip.show = false;
    }
  },

  template: '#tpl-stock'
});

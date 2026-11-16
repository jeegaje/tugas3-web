/**
 * File    : js/components/order-form.js
 * Komponen: <ba-order-form> — form create & update bahan ajar (mode ditentukan prop item).
 * Indikator: 1.3 (v-if mode create/edit), 1.6 (form, validasi, @keyup.enter).
 *
 * Props  : item (Object|null — null = tambah baru), kategoriList (Array), upbjjList (Array)
 * Emits  : save (payload bahan ajar), cancel
 */
(function () {
  'use strict';

  function blankForm() {
    return {
      kode: '',
      judul: '',
      kategori: '',
      upbjj: '',
      lokasiRak: '',
      harga: '',
      qty: '',
      safety: '',
      catatanHTML: ''
    };
  }

  function blankErrors() {
    return { kode: '', judul: '', kategori: '', upbjj: '', harga: '', qty: '', safety: '' };
  }

  // Nilai angka valid: terisi, berupa angka, dan >= 0
  function angkaValid(value) {
    return value !== '' && value !== null && isFinite(Number(value)) && Number(value) >= 0;
  }

  Vue.component('ba-order-form', {
    props: {
      item: { type: Object, default: null },
      kategoriList: { type: Array, default: function () { return []; } },
      upbjjList: { type: Array, default: function () { return []; } }
    },

    data: function () {
      return {
        form: blankForm(),
        errors: blankErrors()
      };
    },

    computed: {
      isEdit: function () {
        return !!this.item;
      }
    },

    watch: {
      // Saat baris di-klik Edit, salin data ke form; saat ditutup, kosongkan form
      item: function (val) {
        if (!val) {
          this.resetForm();
          return;
        }
        this.form = {
          kode: val.kode,
          judul: val.judul,
          kategori: val.kategori,
          upbjj: val.upbjj,
          lokasiRak: val.lokasiRak || '',
          harga: val.harga,
          qty: val.qty,
          safety: val.safety,
          catatanHTML: val.catatanHTML || ''
        };
        this.errors = blankErrors();
      }
    },

    methods: {
      focusFirst: function () {
        if (this.$refs.kode) this.$refs.kode.focus();
      },

      resetForm: function () {
        this.form = blankForm();
        this.errors = blankErrors();
      },

      // Dipakai parent untuk menampilkan error yang butuh data di luar form (mis. kode duplikat)
      setError: function (field, message) {
        this.errors[field] = message;
      },

      validate: function () {
        var f = this.form;
        var e = blankErrors();

        if (!f.kode) e.kode = 'Kode MK wajib diisi.';
        if (!f.judul) e.judul = 'Nama MK wajib diisi.';
        if (!f.kategori) e.kategori = 'Pilih kategori.';
        if (!f.upbjj) e.upbjj = 'Pilih UT-Daerah.';
        if (!angkaValid(f.harga)) e.harga = 'Harga harus angka ≥ 0.';
        if (!angkaValid(f.qty)) e.qty = 'Jumlah stok harus angka ≥ 0.';
        if (!angkaValid(f.safety)) e.safety = 'Safety stok harus angka ≥ 0.';

        this.errors = e;

        return !Object.keys(e).some(function (key) { return e[key]; });
      },

      submit: function () {
        if (!this.validate()) return;

        var f = this.form;

        this.$emit('save', {
          kode: f.kode.trim(),
          judul: f.judul.trim(),
          kategori: f.kategori,
          upbjj: f.upbjj,
          lokasiRak: (f.lokasiRak || '').trim(),
          harga: Number(f.harga),
          qty: Number(f.qty),
          safety: Number(f.safety),
          catatanHTML: f.catatanHTML || ''
        });
        // Form dikosongkan oleh parent saat panel ditutup (closeForm),
        // supaya error dari parent (mis. kode duplikat) tetap terlihat.
      }
    },

    template: '#tpl-order-form'
  });
})();

/**
 * File    : js/components/do-tracking.js
 * Komponen: <ba-do-tracking> — halaman Tracking Delivery Order.
 * Indikator:
 *   1.2 tanggalID / tanggalWaktu / currency / v-for perjalanan
 *   1.3 v-if empty state, v-show ? (detail memakai v-if)
 *   1.4 computed hasilPencarian, selectedDO, perjalananUrut, nextNoDo (prop dari root)
 *   1.5 watcher selectedPaket → set total & detail isi paket
 *   1.6 @keyup.enter cari/simpan, @keyup.esc reset, validasi NIM/Nama
 *
 * Props  : tracking (Array hasil normalisasi), paket (Array), pengirimanList (Array),
 *          nextNoDo (String — nomor DO otomatis dari root)
 * Emits  : add-do (payload DO baru), add-perjalanan ({ noDO, keterangan })
 */
(function () {
  'use strict';

  function pad2(n) {
    return n < 10 ? '0' + n : String(n);
  }

  // Tanggal hari ini (local time) untuk default <input type="date">
  function todayISO() {
    var d = new Date();
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  function blankForm() {
    return { nim: '', nama: '', ekspedisi: '', tanggalKirim: todayISO() };
  }

  function blankErrors() {
    return { nim: '', nama: '', ekspedisi: '', paket: '' };
  }

  Vue.component('ba-do-tracking', {
    props: {
      tracking: { type: Array, required: true },
      paket: { type: Array, default: function () { return []; } },
      pengirimanList: { type: Array, default: function () { return []; } },
      nextNoDo: { type: String, default: '' }
    },

    data: function () {
      return {
        keyword: '',
        submitted: '',
        selectedNoDO: this.tracking.length ? this.tracking[0].noDO : null,
        selectedPaket: '',
        isiPaket: [],
        total: 0,
        form: blankForm(),
        errors: blankErrors(),
        perjalananBaru: '',
        errorPerjalanan: ''
      };
    },

    computed: {
      // Pencarian satu input: cocok ke Nomor DO ATAU NIM
      hasilPencarian: function () {
        var q = this.submitted.toLowerCase();
        if (!q) return this.tracking;

        return this.tracking.filter(function (d) {
          return d.noDO.toLowerCase().indexOf(q) !== -1 ||
            String(d.nim).toLowerCase().indexOf(q) !== -1;
        });
      },

      selectedDO: function () {
        var noDO = this.selectedNoDO;
        var adaTerpilih = this.tracking.some(function (d) { return d.noDO === noDO; });
        if (adaTerpilih) {
          // Tetap tampil walau tidak masuk hasil pencarian terbaru
          return this.tracking.filter(function (d) { return d.noDO === noDO; })[0];
        }
        return this.hasilPencarian[0] || null;
      },

      // Urut kronologis, tanpa mengubah array asli di props
      perjalananUrut: function () {
        if (!this.selectedDO) return [];
        return this.selectedDO.perjalanan.slice().sort(function (a, b) {
          if (a.waktu === b.waktu) return 0;
          return a.waktu < b.waktu ? -1 : 1;
        });
      },

      paketDO: function () {
        if (!this.selectedDO) return null;
        return this.findPaket(this.selectedDO.paket);
      }
    },

    watch: {
      // Wajib: saat paket dipilih, ambil detail isi & total harga otomatis
      selectedPaket: function (newVal) {
        var paket = this.findPaket(newVal);
        this.isiPaket = paket ? paket.isi.slice() : [];
        this.total = paket ? paket.harga : 0;
        console.log('[watcher selectedPaket] paket →', newVal || '(kosong)',
          '| total →', this.total);
      }
    },

    methods: {
      findPaket: function (kode) {
        if (!kode) return null;
        return this.paket.filter(function (p) { return p.kode === kode; })[0] || null;
      },

      paketLabel: function (kode) {
        var p = this.findPaket(kode);
        return p ? p.kode + ' — ' + p.nama : (kode || '-');
      },

      ekspedisiLabel: function (kode) {
        var e = this.pengirimanList.filter(function (p) { return p.kode === kode; })[0];
        return e ? e.nama : (kode || '-');
      },

      // Enter → kunci keyword, pilih hasil pertama
      searchDO: function () {
        this.submitted = this.keyword.trim();
        var first = this.hasilPencarian[0];
        this.selectedNoDO = first ? first.noDO : null;
        this.errorPerjalanan = '';
      },

      // Esc → bersihkan pencarian dan tampilkan semua DO
      resetSearch: function () {
        this.keyword = '';
        this.submitted = '';
        this.selectedNoDO = this.tracking.length ? this.tracking[0].noDO : null;
        this.errorPerjalanan = '';
      },

      validasiDO: function () {
        var f = this.form;
        var e = blankErrors();

        if (!f.nim) {
          e.nim = 'NIM wajib diisi.';
        } else if (!/^\d+$/.test(f.nim)) {
          e.nim = 'NIM harus berupa angka.';
        }
        if (!f.nama) e.nama = 'Nama wajib diisi.';
        if (!f.ekspedisi) e.ekspedisi = 'Pilih ekspedisi.';
        if (!this.selectedPaket) e.paket = 'Pilih paket bahan ajar.';

        this.errors = e;

        return !Object.keys(e).some(function (key) { return e[key]; });
      },

      tambahDO: function () {
        if (!this.validasiDO()) return;

        var f = this.form;
        var noDOBaru = this.nextNoDo;

        this.$emit('add-do', {
          nim: f.nim.trim(),
          nama: f.nama.trim(),
          ekspedisi: f.ekspedisi,
          paket: this.selectedPaket,
          tanggalKirim: f.tanggalKirim || todayISO(),
          total: this.total
        });

        // Tampilkan DO yang baru dibuat
        this.keyword = '';
        this.submitted = '';
        this.selectedNoDO = noDOBaru;
        this.resetFormDO();
      },

      resetFormDO: function () {
        this.form = blankForm();
        this.errors = blankErrors();
        this.selectedPaket = '';
        this.isiPaket = [];
        this.total = 0;
      },

      tambahPerjalanan: function () {
        var teks = this.perjalananBaru.trim();

        if (!this.selectedDO) {
          this.errorPerjalanan = 'Pilih DO terlebih dahulu.';
          return;
        }
        if (!teks) {
          this.errorPerjalanan = 'Keterangan progress wajib diisi.';
          return;
        }

        this.errorPerjalanan = '';
        this.$emit('add-perjalanan', {
          noDO: this.selectedDO.noDO,
          keterangan: teks
        });
        this.perjalananBaru = '';
      }
    },

    template: '#tpl-tracking'
  });
})();

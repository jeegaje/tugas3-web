/**
 * File    : js/app.js
 * Fungsi  : Entry point — filter global, root instance Vue, state tab, dan CRUD data.
 * Indikator:
 *   1.1 root mengatur tab (tanpa vue-router), registrasi komponen via komponen file
 *   1.2 filter kustom: currency, satuan, tanggalID, tanggalWaktu
 *   1.4 computed nextNoDO + methods addStok/updateStok/deleteStok/addDO/addPerjalanan
 *   1.5 watcher tab untuk reset posisi scroll saat ganti halaman
 */
(function () {
  'use strict';

  Vue.config.productionTip = false;

  // File template → id x-template (id ini yang dirujuk template: '#tpl-...')
  var TEMPLATES = [
    { file: 'status-badge', id: 'tpl-status-badge' },
    { file: 'app-modal', id: 'tpl-modal' },
    { file: 'order-form', id: 'tpl-order-form' },
    { file: 'stock-table', id: 'tpl-stock' },
    { file: 'do-tracking', id: 'tpl-tracking' }
  ];

  var BULAN = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  function pad2(n) {
    return n < 10 ? '0' + n : String(n);
  }

  // '2025-08-25' → '25 Agustus 2025'
  function formatTanggalID(value) {
    if (!value) return '-';

    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));
    if (!m) return String(value);

    return parseInt(m[3], 10) + ' ' + BULAN[parseInt(m[2], 10) - 1] + ' ' + m[1];
  }

  // Date → '2025-08-25 10:12:20' (waktu lokal)
  function formatTanggalWaktu(value) {
    if (!value) return '-';
    if (!(value instanceof Date)) return String(value);

    return value.getFullYear() + '-' + pad2(value.getMonth() + 1) + '-' + pad2(value.getDate()) +
      ' ' + pad2(value.getHours()) + ':' + pad2(value.getMinutes()) + ':' + pad2(value.getSeconds());
  }

  function seq3(n) {
    return n < 10 ? '00' + n : (n < 100 ? '0' + n : String(n));
  }

  /* ---------------- Filter global (indikator 1.2) ---------------- */

  Vue.filter('currency', function (value) {
    var n = Number(value);
    if (!isFinite(n)) return '-';
    return 'Rp ' + n.toLocaleString('id-ID');
  });

  Vue.filter('satuan', function (value) {
    var n = Number(value);
    if (!isFinite(n)) return '-';
    return n.toLocaleString('id-ID') + ' buah';
  });

  Vue.filter('tanggalID', formatTanggalID);
  Vue.filter('tanggalWaktu', formatTanggalWaktu);

  /* ---------------- Root instance ---------------- */

  function mount(data) {
    new Vue({
      el: '#app',

      data: {
        tab: 'stok',
        upbjjList: data.upbjjList,
        kategoriList: data.kategoriList,
        pengirimanList: data.pengirimanList,
        paket: data.paket,
        stok: data.stok,
        tracking: data.tracking,
        toast: '',
        toastTimer: null
      },

      computed: {
        // DO{tahun}-{seq:03d}, urutan = jumlah DO tahun berjalan + 1
        nextNoDO: function () {
          var tahun = new Date().getFullYear();
          var prefix = 'DO' + tahun + '-';
          var seq = this.tracking.filter(function (d) {
            return d.noDO.indexOf(prefix) === 0;
          }).length + 1;

          var nomor;
          do {
            nomor = prefix + seq3(seq);
            seq += 1;
          } while (this.tracking.some(function (d) { return d.noDO === nomor; }));

          return nomor;
        }
      },

      watch: {
        // Saat pindah tab, halaman kembali ke atas (state filter tetap karena v-show)
        tab: function (newVal, oldVal) {
          console.log('[watcher tab]', oldVal, '→', newVal);
          if (typeof window.scrollTo === 'function') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }
      },

      methods: {
        flash: function (message) {
          var self = this;
          this.toast = message;
          clearTimeout(this.toastTimer);
          this.toastTimer = setTimeout(function () {
            self.toast = '';
          }, 2600);
        },

        /* ----- Stok ----- */
        addStok: function (item) {
          this.stok.push(item);
          this.flash('Bahan ajar ' + item.kode + ' ditambahkan.');
        },

        updateStok: function (payload) {
          var self = this;
          var index = this.stok.findIndex(function (s) {
            return s.kode === payload.kodeLama;
          });

          if (index === -1) return;
          this.$set(this.stok, index, payload.data);
          this.flash('Bahan ajar ' + payload.data.kode + ' diperbarui.');
        },

        deleteStok: function (kode) {
          var index = this.stok.findIndex(function (s) { return s.kode === kode; });
          if (index === -1) return;

          this.stok.splice(index, 1);
          this.flash('Bahan ajar ' + kode + ' dihapus.');
        },

        /* ----- Tracking DO ----- */
        addDO: function (payload) {
          var noDO = this.nextNoDO;

          this.tracking.push({
            noDO: noDO,
            nim: payload.nim,
            nama: payload.nama,
            status: 'Diproses',
            ekspedisi: payload.ekspedisi,
            tanggalKirim: payload.tanggalKirim,
            paket: payload.paket,
            total: payload.total,
            perjalanan: []
          });

          this.flash('Delivery Order ' + noDO + ' berhasil dibuat.');
        },

        addPerjalanan: function (payload) {
          var doItem = this.tracking.filter(function (d) {
            return d.noDO === payload.noDO;
          })[0];

          if (!doItem) return;

          doItem.perjalanan.push({
            waktu: formatTanggalWaktu(new Date()),
            keterangan: payload.keterangan
          });

          this.flash('Progress ' + payload.noDO + ' ditambahkan.');
        }
      }
    });
  }

  function showBootError(err) {
    var boot = document.getElementById('boot');
    if (!boot) return;

    boot.classList.add('boot--error');
    boot.innerHTML = '<strong>Aplikasi gagal dimuat.</strong><br>' +
      err.message +
      '<br><br>Jalankan lewat server statis, misalnya <code>python3 -m http.server 8000</code>, ' +
      'lalu buka <code>http://localhost:8000</code> (bukan file://).';
  }

  // Template harus ada di DOM sebelum root instance dibuat
  ApiService.loadTemplates(TEMPLATES)
    .then(function () { return ApiService.loadData(); })
    .then(function (data) {
      mount(data);
      var boot = document.getElementById('boot');
      if (boot) boot.remove();
    })
    .catch(showBootError);
})();

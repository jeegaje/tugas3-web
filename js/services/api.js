/**
 * File    : js/services/api.js
 * Fungsi  : Satu pintu akses data — memuat dataBahanAjar.json dan template x-template.
 * Indikator: 1.1 Component & Template (template eksternal), 1.2 v-for (data normalisasi).
 *
 * Catatan: template dimuat dengan fetch() lalu disisipkan sebagai
 * <script type="text/x-template">. Tag <script type="text/x-template" src="...">
 * tidak dipakai karena browser tidak mengunduh script dengan tipe non-JavaScript.
 */
(function (global) {
  'use strict';

  var DATA_URL = 'data/dataBahanAjar.json';
  var TEMPLATE_DIR = 'templates/';

  function fetchText(url) {
    return fetch(url).then(function (res) {
      if (!res.ok) throw new Error('Gagal memuat ' + url + ' (HTTP ' + res.status + ')');
      return res.text();
    });
  }

  function fetchJSON(url) {
    return fetchText(url).then(function (text) {
      return JSON.parse(text);
    });
  }

  /**
   * JSON asli menyimpan tracking sebagai array objek berkunci nomor DO:
   *   [ { "DO2025-0001": { ...detail } }, ... ]
   * Dinormalkan menjadi [ { noDO, ...detail } ] agar mudah di-v-for dan dicari.
   * Data dummy memuat DO2025-0001 dua kali, duplikat dibuang saat load.
   */
  function normalizeTracking(rawList) {
    var result = [];

    (rawList || []).forEach(function (entry) {
      Object.keys(entry).forEach(function (noDO) {
        var sudahAda = result.some(function (item) { return item.noDO === noDO; });
        if (sudahAda) return;

        var detail = entry[noDO] || {};
        var item = Object.assign({ noDO: noDO }, detail);
        if (!Array.isArray(item.perjalanan)) item.perjalanan = [];
        result.push(item);
      });
    });

    return result;
  }

  function loadData() {
    return fetchJSON(DATA_URL).then(function (data) {
      return {
        upbjjList: data.upbjjList || [],
        kategoriList: data.kategoriList || [],
        pengirimanList: data.pengirimanList || [],
        paket: data.paket || [],
        stok: data.stok || [],
        tracking: normalizeTracking(data.tracking)
      };
    });
  }

  /**
   * list: [{ file: 'stock-table', id: 'tpl-stock' }, ...]
   * Setiap file dibaca, lalu semua <script type="text/x-template"> di dalamnya
   * dipindahkan ke <body> supaya bisa dirujuk komponen via template: '#tpl-...'.
   */
  function loadTemplates(list) {
    return Promise.all(list.map(function (tpl) {
      var url = TEMPLATE_DIR + tpl.file + '.html';

      return fetchText(url).then(function (html) {
        var holder = document.createElement('template');
        holder.innerHTML = html;

        var scripts = holder.content.querySelectorAll('script[type="text/x-template"]');
        if (!scripts.length) {
          throw new Error(url + ' tidak berisi <script type="text/x-template">');
        }

        Array.prototype.forEach.call(scripts, function (node) {
          document.body.appendChild(node);
        });

        if (!document.getElementById(tpl.id)) {
          throw new Error('Template #' + tpl.id + ' tidak ditemukan di ' + url);
        }
      });
    }));
  }

  global.ApiService = {
    loadData: loadData,
    loadTemplates: loadTemplates
  };
})(window);

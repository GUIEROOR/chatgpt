/* IPA Tool Enhanced loader for Loon. Core is compressed and cached locally after first load. */
(function () {
  "use strict";
  var VERSION = "2.0.0";
  var CACHE_KEY = "ipa.tool.enhanced.core." + VERSION;
  var PART_COUNT = 7;
  var EXPECTED_LENGTH = 52232;
  var BASE = "https://raw.githubusercontent.com/GUIEROOR/chatgpt/main/Loon/IPA-Tool-Local/.parts/IPAToolEnhanced.lz64.";
  var ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

  function cached() { try { return $persistentStore.read(CACHE_KEY) || ""; } catch (_) { return ""; } }
  function save(source) { try { return $persistentStore.write(source, CACHE_KEY); } catch (_) { return false; } }
  function valid(source) { return source.length > 50000 && source.indexOf("IPA Tool Local for Loon") >= 0 && source.indexOf("main();") >= 0; }

  function part(index, retry) {
    return new Promise(function (resolve, reject) {
      var suffix = String(index).padStart(2, "0");
      $httpClient.get({
        url: BASE + suffix, timeout: 20, "auto-redirect": true, "auto-cookie": false,
        alpn: retry ? "h1" : "h2", headers: { "Cache-Control": "no-cache", "User-Agent": "Loon IPA Tool/" + VERSION }
      }, function (error, response, data) {
        var status = response && (response.status || response.statusCode) || 0;
        if (!error && status >= 200 && status < 300 && data) return resolve(String(data).trim());
        if (!retry) return setTimeout(function () { part(index, 1).then(resolve, reject); }, 250 + index * 20);
        reject(new Error("核心分片 " + suffix + " 下载失败：" + (error || "HTTP " + status)));
      });
    });
  }

  async function fetchCompressed() {
    var all = [];
    for (var start = 1; start <= PART_COUNT; start += 4) {
      var jobs = [];
      for (var i = start; i < start + 4 && i <= PART_COUNT; i++) jobs.push(part(i, 0));
      all = all.concat(await Promise.all(jobs));
    }
    var input = all.join("");
    if (input.length !== EXPECTED_LENGTH) throw new Error("核心分片长度校验失败");
    var source = decompress(input);
    if (!valid(source)) throw new Error("核心解压校验失败");
    return source;
  }

  function decompress(input) {
    if (input == null) return "";
    if (input === "") return null;
    var dictionary = [], result = [], data = { val: ALPHABET.indexOf(input.charAt(0)), position: 32, index: 1 };
    var enlargeIn = 4, dictSize = 4, numBits = 3, entry = "", c, bits = 0, maxpower = 4, power = 1, resb, i;
    for (i = 0; i < 3; i++) dictionary[i] = String(i);
    while (power !== maxpower) {
      resb = data.val & data.position; data.position >>= 1;
      if (data.position === 0) { data.position = 32; data.val = ALPHABET.indexOf(input.charAt(data.index++)); }
      bits |= (resb > 0 ? 1 : 0) * power; power <<= 1;
    }
    if (bits === 0 || bits === 1) {
      var count = bits === 0 ? 8 : 16; bits = 0; maxpower = Math.pow(2, count); power = 1;
      while (power !== maxpower) {
        resb = data.val & data.position; data.position >>= 1;
        if (data.position === 0) { data.position = 32; data.val = ALPHABET.indexOf(input.charAt(data.index++)); }
        bits |= (resb > 0 ? 1 : 0) * power; power <<= 1;
      }
      c = String.fromCharCode(bits);
    } else if (bits === 2) return "";
    dictionary[3] = c; var w = c; result.push(c);
    while (true) {
      if (data.index > input.length) return "";
      bits = 0; maxpower = Math.pow(2, numBits); power = 1;
      while (power !== maxpower) {
        resb = data.val & data.position; data.position >>= 1;
        if (data.position === 0) { data.position = 32; data.val = ALPHABET.indexOf(input.charAt(data.index++)); }
        bits |= (resb > 0 ? 1 : 0) * power; power <<= 1;
      }
      c = bits;
      if (c === 0 || c === 1) {
        var width = c === 0 ? 8 : 16; bits = 0; maxpower = Math.pow(2, width); power = 1;
        while (power !== maxpower) {
          resb = data.val & data.position; data.position >>= 1;
          if (data.position === 0) { data.position = 32; data.val = ALPHABET.indexOf(input.charAt(data.index++)); }
          bits |= (resb > 0 ? 1 : 0) * power; power <<= 1;
        }
        dictionary[dictSize++] = String.fromCharCode(bits); c = dictSize - 1; enlargeIn--;
      } else if (c === 2) return result.join("");
      if (enlargeIn === 0) { enlargeIn = Math.pow(2, numBits); numBits++; }
      if (dictionary[c] != null) entry = dictionary[c];
      else if (c === dictSize) entry = w + w.charAt(0);
      else return null;
      result.push(entry); dictionary[dictSize++] = w + entry.charAt(0); enlargeIn--; w = entry;
      if (enlargeIn === 0) { enlargeIn = Math.pow(2, numBits); numBits++; }
    }
  }

  function fail(error) {
    var message = String(error && error.message || error || "未知错误");
    try { $persistentStore.write("", CACHE_KEY); } catch (_) {}
    try { $notification.post("IPA 工具箱增强版", "核心加载失败", message); } catch (_) {}
    if (typeof $request !== "undefined") return $done({ response: { status: 500, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }, body: JSON.stringify({ success: false, error: message }) } });
    return $done();
  }

  (async function () {
    try {
      var source = cached();
      if (!valid(source)) { source = await fetchCompressed(); save(source); }
      eval(source);
    } catch (error) { fail(error); }
  })();
})();

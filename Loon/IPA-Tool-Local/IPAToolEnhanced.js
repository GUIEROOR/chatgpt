/* IPA Tool Enhanced loader for Loon. Core is compressed and cached locally after first load. */
(function () {
  "use strict";

  var LOADER_VERSION = "2.0.1";
  var CORE_VERSION = "2.0.0";
  var CACHE_KEY = "ipa.tool.enhanced.core." + LOADER_VERSION;
  var LEGACY_CACHE_KEY = "ipa.tool.enhanced.core." + CORE_VERSION;
  var PART_COUNT = 7;
  var EXPECTED_LENGTH = 52232;
  var BASE = "https://raw.githubusercontent.com/GUIEROOR/chatgpt/main/Loon/IPA-Tool-Local/.parts/IPAToolEnhanced.lz64.";
  var PANEL_URL = "https://apple-api.com/ipa-tool";
  var ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

  function readKey(key) { try { return $persistentStore.read(key) || ""; } catch (_) { return ""; } }
  function save(source) { try { return $persistentStore.write(source, CACHE_KEY); } catch (_) { return false; } }
  function valid(source) { return source.length > 50000 && source.indexOf("IPA Tool Local for Loon") >= 0 && source.indexOf("main();") >= 0; }

  function patchSource(source) {
    return String(source || "")
      .replace('var APP_VERSION = "2.0.0";', 'var APP_VERSION = "2.0.1";')
      .replace('var BASE_ORIGIN = "http://ipa-tool.local";', 'var BASE_ORIGIN = "https://apple-api.com/ipa-tool";')
      .replace('本地地址 ipa-tool.local', '面板地址 apple-api.com/ipa-tool');
  }

  function mappedRequest() {
    if (typeof $request === "undefined") return undefined;
    var request = {};
    Object.keys($request || {}).forEach(function (key) { request[key] = $request[key]; });
    try {
      var url = new URL(String(request.url || ""));
      var host = String(url.hostname || "").toLowerCase();
      var path = String(url.pathname || "/").replace(/\/+$/, "") || "/";
      var isPanel = (host === "apple-api.com" || host === "www.apple-api.com") &&
        (path === "/ipa-tool" || path === "/favicon.ico" || path.indexOf("/api/") === 0);
      if (isPanel) {
        var mappedPath = path === "/ipa-tool" ? "/" : path;
        request.url = "http://ipa-tool.local" + mappedPath + (url.search || "");
      }
    } catch (_) {}
    return request;
  }

  function part(index, retry) {
    return new Promise(function (resolve, reject) {
      var suffix = String(index).padStart(2, "0");
      $httpClient.get({
        url: BASE + suffix,
        timeout: 20,
        "auto-redirect": true,
        "auto-cookie": false,
        alpn: retry ? "h1" : "h2",
        headers: { "Cache-Control": "no-cache", "User-Agent": "Loon IPA Tool/" + LOADER_VERSION }
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
      for (var i = start; i < start + 4 && i <= PART_COUNT; i += 1) jobs.push(part(i, 0));
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
    for (i = 0; i < 3; i += 1) dictionary[i] = String(i);
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
      if (enlargeIn === 0) { enlargeIn = Math.pow(2, numBits); numBits += 1; }
      if (dictionary[c] != null) entry = dictionary[c];
      else if (c === dictSize) entry = w + w.charAt(0);
      else return null;
      result.push(entry); dictionary[dictSize++] = w + entry.charAt(0); enlargeIn--; w = entry;
      if (enlargeIn === 0) { enlargeIn = Math.pow(2, numBits); numBits += 1; }
    }
  }

  function run(source) {
    source = patchSource(source);
    if (!valid(source)) throw new Error("本地核心缓存校验失败");
    save(source);
    (function ($request) { eval(source); })(mappedRequest());
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
      if (typeof $request === "undefined") {
        $notification.post("IPA 工具箱增强版", "控制面板", "点击通知打开控制面板。", { openUrl: PANEL_URL });
        return $done();
      }
      var source = readKey(CACHE_KEY) || readKey(LEGACY_CACHE_KEY);
      if (!valid(source)) source = await fetchCompressed();
      run(source);
    } catch (error) { fail(error); }
  })();
})();

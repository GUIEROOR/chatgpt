/* IPA Tool Enhanced loader for Loon. Core source is cached locally after first load. */
(function () {
  "use strict";

  var CORE_VERSION = "2.0.0";
  var CACHE_KEY = "ipa.tool.enhanced.core." + CORE_VERSION;
  var PART_COUNT = 6;
  var EXPECTED_BASE64_LENGTH = 121424;
  var RAW_BASE = "https://raw.githubusercontent.com/GUIEROOR/chatgpt/main/Loon/IPA-Tool-Local/.parts/IPAToolEnhanced.js.b64.";

  function readCache() {
    try { return $persistentStore.read(CACHE_KEY) || ""; } catch (error) { return ""; }
  }

  function writeCache(source) {
    try { return $persistentStore.write(source, CACHE_KEY); } catch (error) { return false; }
  }

  function fetchPart(index, attempt) {
    return new Promise(function (resolve, reject) {
      var suffix = String(index).padStart(2, "0");
      $httpClient.get({
        url: RAW_BASE + suffix,
        timeout: 20,
        "auto-redirect": true,
        "auto-cookie": false,
        alpn: attempt > 0 ? "h1" : "h2",
        headers: { "Cache-Control": "no-cache", "User-Agent": "Loon IPA Tool Enhanced Loader/" + CORE_VERSION }
      }, function (error, response, data) {
        var status = response && (response.status || response.statusCode) || 0;
        if (!error && status >= 200 && status < 300 && data) return resolve(String(data).trim());
        if (attempt < 1) return setTimeout(function () {
          fetchPart(index, attempt + 1).then(resolve, reject);
        }, 250 + index * 20);
        reject(new Error("核心分片 " + suffix + " 下载失败：" + (error || "HTTP " + status)));
      });
    });
  }

  async function fetchAllParts() {
    var parts = [];
    for (var start = 1; start <= PART_COUNT; start += 4) {
      var tasks = [];
      for (var i = start; i < start + 4 && i <= PART_COUNT; i += 1) tasks.push(fetchPart(i, 0));
      var batch = await Promise.all(tasks);
      parts = parts.concat(batch);
    }
    var base64 = parts.join("");
    if (base64.length !== EXPECTED_BASE64_LENGTH) throw new Error("核心分片长度校验失败");
    return decodeBase64Utf8(base64);
  }

  function decodeBase64Utf8(input) {
    var alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    var bytes = [];
    var buffer = 0;
    var bits = 0;
    for (var i = 0; i < input.length; i += 1) {
      var ch = input.charAt(i);
      if (ch === "=") break;
      var value = alphabet.indexOf(ch);
      if (value < 0) continue;
      buffer = (buffer << 6) | value;
      bits += 6;
      if (bits >= 8) {
        bits -= 8;
        bytes.push((buffer >> bits) & 255);
      }
    }
    var output = "";
    for (var p = 0; p < bytes.length;) {
      var b1 = bytes[p++];
      var code;
      if (b1 < 128) code = b1;
      else if ((b1 & 224) === 192) code = ((b1 & 31) << 6) | (bytes[p++] & 63);
      else if ((b1 & 240) === 224) code = ((b1 & 15) << 12) | ((bytes[p++] & 63) << 6) | (bytes[p++] & 63);
      else {
        code = ((b1 & 7) << 18) | ((bytes[p++] & 63) << 12) | ((bytes[p++] & 63) << 6) | (bytes[p++] & 63);
      }
      if (code <= 65535) output += String.fromCharCode(code);
      else {
        code -= 65536;
        output += String.fromCharCode(55296 + (code >> 10), 56320 + (code & 1023));
      }
    }
    return output;
  }

  function validSource(source) {
    return source.length > 50000 && source.indexOf("IPA Tool Local for Loon") >= 0 && source.indexOf("main();") >= 0;
  }

  function run(source) {
    if (!validSource(source)) throw new Error("本地核心缓存校验失败");
    eval(source);
  }

  function finishWithError(error) {
    var message = String(error && error.message || error || "未知错误");
    try { $persistentStore.write("", CACHE_KEY); } catch (ignored) {}
    try { $notification.post("IPA 工具箱增强版", "核心加载失败", message); } catch (ignored2) {}
    if (typeof $request !== "undefined") {
      return $done({ response: { status: 500, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }, body: JSON.stringify({ success: false, error: message }) } });
    }
    return $done();
  }

  (async function () {
    try {
      var source = readCache();
      if (!validSource(source)) {
        source = await fetchAllParts();
        writeCache(source);
      }
      run(source);
    } catch (error) {
      finishWithError(error);
    }
  })();
})();

/* IPA Tool Enhanced loader for Loon. Full core is assembled once and cached in persistentStore. */
(function () {
  "use strict";

  var LOADER_VERSION = "2.0.5";
  var CACHE_KEY = "ipa.tool.enhanced.core." + LOADER_VERSION;
  var EXPECTED_LENGTH = 97636;
  var CORE_BASE = "https://raw.githubusercontent.com/GUIEROOR/chatgpt/main/Loon/IPA-Tool-Local/.core/IPAToolEnhanced.js.part.";
  var CORE_PARTS = [
    "01", "02", "03", "04", "05a", "05b", "06a", "06b", "07a", "07b",
    "08a", "08b", "09a1", "09a2", "09b1", "09b2", "10a1", "10a2", "10b1", "10b2"
  ];

  function readCache() {
    try { return $persistentStore.read(CACHE_KEY) || ""; } catch (_) { return ""; }
  }

  function writeCache(source) {
    try { return $persistentStore.write(source, CACHE_KEY); } catch (_) { return false; }
  }

  function valid(source) {
    source = String(source || "");
    return source.length === EXPECTED_LENGTH &&
      source.indexOf('var APP_VERSION = "' + LOADER_VERSION + '";') >= 0 &&
      source.indexOf("IPA Tool Local for Loon") >= 0 &&
      source.indexOf("serialNumber: \"0\"") >= 0 &&
      source.indexOf("main();") >= 0;
  }

  function fetchPart(suffix, retry) {
    return new Promise(function (resolve, reject) {
      $httpClient.get({
        url: CORE_BASE + suffix + "?v=" + LOADER_VERSION,
        timeout: 20,
        "auto-redirect": true,
        "auto-cookie": false,
        alpn: retry ? "h1" : "h2",
        headers: {
          "Cache-Control": "no-cache",
          "User-Agent": "Loon IPA Tool Loader/" + LOADER_VERSION
        }
      }, function (error, response, data) {
        var status = response && (response.status || response.statusCode) || 0;
        if (!error && status >= 200 && status < 300 && data != null) return resolve(String(data));
        if (!retry) {
          return setTimeout(function () {
            fetchPart(suffix, true).then(resolve, reject);
          }, 250);
        }
        reject(new Error("核心分片 " + suffix + " 下载失败：" + (error || "HTTP " + status)));
      });
    });
  }

  async function fetchCore() {
    var parts = [];
    for (var start = 0; start < CORE_PARTS.length; start += 4) {
      var jobs = CORE_PARTS.slice(start, start + 4).map(function (suffix) { return fetchPart(suffix, false); });
      parts = parts.concat(await Promise.all(jobs));
    }
    var source = parts.join("");
    if (!valid(source)) throw new Error("核心分片拼接校验失败，长度 " + source.length + "/" + EXPECTED_LENGTH);
    return source;
  }

  function fail(error) {
    var message = String(error && error.message || error || "未知错误");
    try { $persistentStore.write("", CACHE_KEY); } catch (_) {}
    try { $notification.post("IPA 工具箱增强版", "核心加载失败", message); } catch (_) {}
    if (typeof $request !== "undefined") {
      return $done({ response: {
        status: 500,
        headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
        body: JSON.stringify({ success: false, error: message })
      } });
    }
    return $done();
  }

  (async function () {
    try {
      var source = readCache();
      if (!valid(source)) {
        source = await fetchCore();
        writeCache(source);
      }
      eval(source);
    } catch (error) {
      fail(error);
    }
  })();
})();

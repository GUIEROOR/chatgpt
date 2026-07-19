/* IPA Tool Enhanced loader for Loon. Core is compressed and cached locally after first load. */
(function () {
  "use strict";

  var LOADER_VERSION = "2.0.4";
  var CORE_VERSION = "2.0.0";
  var CACHE_KEY = "ipa.tool.enhanced.core." + LOADER_VERSION;
  var LEGACY_CACHE_KEYS = ["ipa.tool.enhanced.core.2.0.3", "ipa.tool.enhanced.core.2.0.2", "ipa.tool.enhanced.core.2.0.1", "ipa.tool.enhanced.core." + CORE_VERSION];
  var PART_COUNT = 7;
  var EXPECTED_LENGTH = 52232;
  var BASE = "https://raw.githubusercontent.com/GUIEROOR/chatgpt/main/Loon/IPA-Tool-Local/.parts/IPAToolEnhanced.lz64.";
  var PANEL_URL = "https://apple-api.com/ipa-tool";
  var ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

  function readKey(key) { try { return $persistentStore.read(key) || ""; } catch (_) { return ""; } }
  function save(source) { try { return $persistentStore.write(source, CACHE_KEY); } catch (_) { return false; } }
  function valid(source) { return source.length > 50000 && source.indexOf("IPA Tool Local for Loon") >= 0 && source.indexOf("main();") >= 0; }

  function patchSource(source) {
    source = String(source || "");
    source = source.replace(/var APP_VERSION = "2\.0\.[0-4]";/, 'var APP_VERSION = "2.0.4";');
    source = source.replace('var BASE_ORIGIN = "http://ipa-tool.local";', 'var BASE_ORIGIN = "https://apple-api.com/ipa-tool";');
    source = source.replace("本地地址 ipa-tool.local", "面板地址 apple-api.com/ipa-tool");
    source = source.replace('var appleId = String(input.appleId || "").trim();', 'var appleId = String(input.appleId || "").trim().replace(/^＋/, "+"); if (/^[+0-9 ()-]+$/.test(appleId)) appleId = appleId.replace(/[ ()-]/g, "");');
    if (source.indexOf("function normalizeCountry(value, fallback)") < 0) {
      source = source.replace('  function defaultState() {\n    var country = String(args.default_country || "us").trim().toLowerCase();\n    if (!/^[a-z]{2}$/.test(country)) country = "us";', '  function normalizeCountry(value, fallback) {\n    var raw = String(value || "").trim().toLowerCase().replace(/_/g, "-");\n    var aliases = { zh: "cn", "zh-cn": "cn", "cn-zh": "cn", "中国": "cn", "中国大陆": "cn", china: "cn", mainland: "cn", "zh-hans": "cn", hk: "hk", "zh-hk": "hk", "香港": "hk", mo: "mo", "zh-mo": "mo", "澳门": "mo", tw: "tw", "zh-tw": "tw", "zh-hant": "tw", "台湾": "tw", "臺灣": "tw", us: "us", "en-us": "us", "美国": "us", jp: "jp", "ja-jp": "jp", "日本": "jp", kr: "kr", "ko-kr": "kr", "韩国": "kr", sg: "sg", "新加坡": "sg" };\n    if (aliases[raw]) return aliases[raw];\n    if (/^[a-z]{2}$/.test(raw)) return raw;\n    var safeFallback = String(fallback || "us").trim().toLowerCase();\n    return /^[a-z]{2}$/.test(safeFallback) ? safeFallback : "us";\n  }\n\n  function defaultState() {\n    var country = normalizeCountry(args.default_country, "us");');
    }
    source = source.replace('    if (!state.settings.country) { state.settings.country = "us"; dirty = true; }', '    var normalizedStoredCountry = normalizeCountry(state.settings.country, "us");\n    if (state.settings.country !== normalizedStoredCountry) { state.settings.country = normalizedStoredCountry; dirty = true; }');
    source = source.replace('  async function searchApps(term, country, limit) {\n    if (!term) throw new Error("请输入应用名称或关键词");', '  async function searchApps(term, country, limit) {\n    if (!term) throw new Error("请输入应用名称或关键词");\n    country = normalizeCountry(country, "us");');
    source = source.replace('  async function lookupApp(appId, country) {\n    var url =', '  async function lookupApp(appId, country) {\n    country = normalizeCountry(country, "us");\n    var url =');
    source = source.split('String(parsed.query.country || state.settings.country || "us").toLowerCase()').join('normalizeCountry(parsed.query.country, state.settings.country || "us")');
    source = source.replace('      var country = String(body.country || state.settings.country || "us").toLowerCase();\n      if (!/^[a-z]{2}$/.test(country)) throw new Error("商店地区必须是两位代码");', '      var country = normalizeCountry(body.country, state.settings.country || "us");');
    source = source.replace('<input id="country" maxlength="2" autocapitalize="none">', '<input id="country" maxlength="12" autocapitalize="none" autocorrect="off" spellcheck="false" placeholder="cn / us / hk">');
    source = source.replace('<input id="settingCountry" maxlength="2">', '<input id="settingCountry" maxlength="12" autocapitalize="none" autocorrect="off" spellcheck="false" placeholder="cn / us / hk">');
    if (source.indexOf('function normalizeCountryInput(value)') < 0) {
      source = source.replace('function renderSearchHistory(items){', 'function normalizeCountryInput(value){const raw=String(value||" ").trim().toLowerCase().replace(/_/g,"-");const aliases={zh:"cn","zh-cn":"cn","cn-zh":"cn","中国":"cn","中国大陆":"cn",china:"cn",mainland:"cn","zh-hans":"cn",hk:"hk","zh-hk":"hk","香港":"hk",mo:"mo","zh-mo":"mo","澳门":"mo",tw:"tw","zh-tw":"tw","zh-hant":"tw","台湾":"tw","臺灣":"tw",us:"us","en-us":"us","美国":"us",jp:"jp","ja-jp":"jp","日本":"jp",kr:"kr","ko-kr":"kr","韩国":"kr",sg:"sg","新加坡":"sg"};return aliases[raw]||(/^[a-z]{2}$/.test(raw)?raw:"")}\nfunction renderSearchHistory(items){');
    }
    source = source.replace("async function search(term,country){term=String(term||'').trim();country=String(country||DEFAULT_COUNTRY).trim().toLowerCase();if(!term)return;", "async function search(term,country){term=String(term||'').trim();const originalCountry=String(country||DEFAULT_COUNTRY).trim();country=normalizeCountryInput(originalCountry)||normalizeCountryInput(DEFAULT_COUNTRY)||'us';$('#country').value=country;if(!term)return;");
    source = source.replace("$('#settingsForm').addEventListener('submit',async e=>{e.preventDefault();try{await api('/api/settings',{method:'POST',body:{country:$('#settingCountry').value,cacheHours:$('#cacheHours').value}});$('#country').value=$('#settingCountry').value;showStatus('设置已保存','good');refresh()}catch(err){showStatus(err.message,'error')}});", "$('#settingsForm').addEventListener('submit',async e=>{e.preventDefault();try{const country=normalizeCountryInput($('#settingCountry').value);if(!country)throw new Error('请输入有效的商店地区，例如 cn、us、hk；zh 会自动转换为 cn');$('#settingCountry').value=country;await api('/api/settings',{method:'POST',body:{country,cacheHours:$('#cacheHours').value}});$('#country').value=country;showStatus('设置已保存：'+country.toUpperCase(),'good');refresh()}catch(err){showStatus(err.message,'error')}});");
    if (source.indexOf("function isTwoFactorChallenge(response)") < 0) {
      source = source.replace('  function validateLoginResponse(response) {', '  function isTwoFactorChallenge(response) {\n    var text = "";\n    try { text = JSON.stringify(response || {}); } catch (_) { text = String(response || ""); }\n    return /MZFinance\\.BadLogin\\.Configurator_message|验证码|验证代码|安全码|双重|two[ -]?factor|two[ -]?step|verification code|trusted device/i.test(text);\n  }\n\n  function validateLoginResponse(response, hasCode) {');
    } else {
      source = source.replace('  function validateLoginResponse(response) {', '  function validateLoginResponse(response, hasCode) {');
      source = source.replace('/验证码|验证代码|安全码|双重|two[ -]?factor|two[ -]?step|verification code|trusted device/i', '/MZFinance\\.BadLogin\\.Configurator_message|验证码|验证代码|安全码|双重|two[ -]?factor|two[ -]?step|verification code|trusted device/i');
    }
    source = source.replace('      loginError.code = failureType;\n      if (/验证码|verification|two.?factor|安全码|双重/i.test(customerMessage)) {\n        loginError.message = "需要双重认证验证码，请输入 6 位验证码后重新登录";\n      }', '      loginError.code = failureType;\n      loginError.status = 401;\n      if (isTwoFactorChallenge(response)) {\n        loginError.code = "TWO_FACTOR_REQUIRED";\n        loginError.requiresTwoFactor = true;\n        loginError.message = hasCode ? "验证码无效或已过期，请获取新的 6 位验证码后重试；若仍失败，请确认 Apple ID 和密码" : "Apple 返回登录验证挑战，请输入受信任设备上的 6 位验证码；若没有收到验证码，请先确认 Apple ID 和密码";\n      }');
    source = source.replace('      loginError.code = failureType;\n      loginError.status = 401;\n      if (isTwoFactorChallenge(response)) {\n        loginError.code = "TWO_FACTOR_REQUIRED";\n        loginError.requiresTwoFactor = true;\n        loginError.message = "Apple 需要双重认证，请输入 6 位验证码后继续登录";\n      }', '      loginError.code = failureType;\n      loginError.status = 401;\n      if (isTwoFactorChallenge(response)) {\n        loginError.code = "TWO_FACTOR_REQUIRED";\n        loginError.requiresTwoFactor = true;\n        loginError.message = hasCode ? "验证码无效或已过期，请获取新的 6 位验证码后重试；若仍失败，请确认 Apple ID 和密码" : "Apple 返回登录验证挑战，请输入受信任设备上的 6 位验证码；若没有收到验证码，请先确认 Apple ID 和密码";\n      }');
    source = source.replace('    validateLoginResponse(parsed);', '    validateLoginResponse(parsed, !!code);');
    source = source.replace('  function fail(error) {\n    var message = error && error.message ? error.message : String(error);\n    return { success: false, data: null, error: message, timestamp: nowISO() };\n  }', '  function fail(error) {\n    var message = error && error.message ? error.message : String(error);\n    return { success: false, data: null, error: message, code: error && error.code ? String(error.code) : "", requiresTwoFactor: !!(error && error.requiresTwoFactor), timestamp: nowISO() };\n  }');
    source = source.replace("if(!r.ok||data&&data.success===false)throw new Error(data&&data.error||data&&data.message||('HTTP '+r.status));", "if(!r.ok||data&&data.success===false){const err=new Error(data&&data.error||data&&data.message||('HTTP '+r.status));if(data&&typeof data==='object'){err.code=data.code||'';err.requiresTwoFactor=!!data.requiresTwoFactor}throw err}");
    var oldHtml = "          <div class=\"field\"><label>Apple ID</label><input id=\"appleId\" type=\"email\" autocomplete=\"username\" required placeholder=\"name@example.com\"></div>\n          <div class=\"field\"><label>密码</label><input id=\"password\" type=\"password\" autocomplete=\"current-password\" required></div>\n          <div class=\"field small\"><label>双重认证验证码</label><input id=\"code\" inputmode=\"numeric\" maxlength=\"6\" placeholder=\"可选\"></div>\n        </div>\n        <div class=\"actions\"><button type=\"submit\">登录并保存会话</button><button id=\"refreshSessionBtn\" class=\"secondary\" type=\"button\">刷新 Cookie</button></div>\n";
    var newHtml = "          <div class=\"field\"><label>Apple ID</label><input id=\"appleId\" type=\"text\" autocomplete=\"username\" autocapitalize=\"none\" autocorrect=\"off\" spellcheck=\"false\" required placeholder=\"邮箱或手机号（例如 +86138...）\"></div>\n          <div class=\"field\"><label>密码</label><input id=\"password\" type=\"password\" autocomplete=\"current-password\" required></div>\n          <div id=\"twoFactorRow\" class=\"field small hidden\"><label>双重认证验证码</label><input id=\"code\" type=\"text\" inputmode=\"numeric\" autocomplete=\"one-time-code\" maxlength=\"6\" pattern=\"[0-9]{6}\" placeholder=\"6 位数字\"><div class=\"sub\">输入 Apple 发送到受信任设备的验证码</div></div>\n        </div>\n        <div class=\"actions\"><button id=\"loginBtn\" type=\"submit\">登录并保存会话</button><button id=\"refreshSessionBtn\" class=\"secondary\" type=\"button\">刷新 Cookie</button></div>\n";
    if (source.indexOf(oldHtml) >= 0) source = source.replace(oldHtml, newHtml);
    var oldHandler = "$('#loginForm').addEventListener('submit',async e=>{e.preventDefault();showStatus('正在登录 Apple ID…');try{const a=await api('/api/login',{method:'POST',body:{appleId:$('#appleId').value,password:$('#password').value,code:$('#code').value}});$('#password').value='';$('#code').value='';showStatus('登录成功：'+a.appleId,'good');refresh()}catch(err){showStatus(err.message,'error')}});\n";
    var newHandler = "function setTwoFactorMode(enabled){const row=$('#twoFactorRow'),button=$('#loginBtn'),code=$('#code');row.classList.toggle('hidden',!enabled);code.required=!!enabled;button.textContent=enabled?'提交验证码并登录':'登录并保存会话';if(!enabled)code.value=''}\n$('#loginForm').addEventListener('submit',async e=>{e.preventDefault();const code=$('#code').value.trim();showStatus(code?'正在验证双重认证码…':'正在登录 Apple ID…');try{const a=await api('/api/login',{method:'POST',body:{appleId:$('#appleId').value,password:$('#password').value,code}});$('#password').value='';setTwoFactorMode(false);showStatus('登录成功：'+a.appleId,'good');refresh()}catch(err){if(/MZFinance\\.BadLogin\\.Configurator_message|双重|验证码|安全码|two[ -]?factor|verification code/i.test(err.message)){setTwoFactorMode(true);showStatus('Apple 需要双重认证，请输入 6 位验证码后继续登录','warn');setTimeout(()=>{$('#code').focus();$('#twoFactorRow').scrollIntoView({behavior:'smooth',block:'center'})},80)}else{showStatus(err.message,'error')}}});\n";
    if (source.indexOf(oldHandler) >= 0) source = source.replace(oldHandler, newHandler);
    if (source.indexOf('id="appleId" type="text"') < 0 || source.indexOf('id="twoFactorRow"') < 0 || source.indexOf("setTwoFactorMode") < 0 || source.indexOf("MZFinance\\.BadLogin\\.Configurator_message") < 0 || source.indexOf("TWO_FACTOR_REQUIRED") < 0 || source.indexOf("function normalizeCountry(value, fallback)") < 0) throw new Error("登录与双重认证热修复未能应用，请更新或重新安装插件");
    return source;
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
      var source = readKey(CACHE_KEY);
      for (var i = 0; !valid(source) && i < LEGACY_CACHE_KEYS.length; i += 1) source = readKey(LEGACY_CACHE_KEYS[i]);
      if (!valid(source)) source = await fetchCompressed();
      run(source);
    } catch (error) { fail(error); }
  })();
})();

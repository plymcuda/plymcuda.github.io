(function () {
  var demos = window.CV_DEMOS;
  var container = document.getElementById('demos-container');
  if (!demos || !container) return;

  var rateLimitState = {};
  var globalTimestamps = [];
  var globalCooldownUntil = 0;
  var RATE_LIMIT_MSG = 'Thanks for trying this out — we hope it was interesting. Feel free to reach out or contact me.';
  var RATE_LIMIT_STORAGE_KEY = 'cv-demos-ratelimit';
  var PER_DEMO_CAP = 5;
  var GLOBAL_CAP = 12;
  var WINDOW_MS = 60000;
  var COOLDOWN_MS = 13 * 60 * 1000;

  function loadRateLimitState() {
    try {
      var raw = sessionStorage.getItem(RATE_LIMIT_STORAGE_KEY);
      if (!raw) return;
      var parsed = JSON.parse(raw);
      if (parsed.state && typeof parsed.state === 'object') rateLimitState = parsed.state;
      if (Array.isArray(parsed.globalTimestamps)) globalTimestamps = parsed.globalTimestamps;
      if (typeof parsed.globalCooldownUntil === 'number') globalCooldownUntil = parsed.globalCooldownUntil;
    } catch (e) {}
  }

  function saveRateLimitState() {
    try {
      sessionStorage.setItem(RATE_LIMIT_STORAGE_KEY, JSON.stringify({
        state: rateLimitState,
        globalTimestamps: globalTimestamps,
        globalCooldownUntil: globalCooldownUntil
      }));
    } catch (e) {}
  }

  function tryRecordDemoCall(demoId) {
    var now = Date.now();
    if (globalCooldownUntil && now < globalCooldownUntil) { saveRateLimitState(); return { allowed: false }; }
    if (!rateLimitState[demoId]) rateLimitState[demoId] = { timestamps: [], cooldownUntil: 0 };
    var s = rateLimitState[demoId];
    if (now < s.cooldownUntil) { saveRateLimitState(); return { allowed: false }; }
    globalTimestamps = globalTimestamps.filter(function (t) { return now - t < WINDOW_MS; });
    if (globalTimestamps.length >= GLOBAL_CAP) {
      globalCooldownUntil = now + COOLDOWN_MS;
      saveRateLimitState();
      return { allowed: false };
    }
    s.timestamps = s.timestamps.filter(function (t) { return now - t < WINDOW_MS; });
    if (s.timestamps.length >= PER_DEMO_CAP) {
      s.cooldownUntil = now + COOLDOWN_MS;
      saveRateLimitState();
      return { allowed: false };
    }
    s.timestamps.push(now);
    globalTimestamps.push(now);
    saveRateLimitState();
    return { allowed: true };
  }

  loadRateLimitState();

  function showRateLimitMessage(resultEl) {
    resultEl.classList.remove('loading', 'error');
    resultEl.classList.add('done');
    resultEl.textContent = '';
    var p = document.createElement('p');
    p.className = 'demo-result-rate-msg';
    p.textContent = RATE_LIMIT_MSG;
    resultEl.appendChild(p);
  }

  function buildRequestSection(demo) {
    var frag = [];
    frag.push((demo.method || 'GET') + ' ' + demo.url);
    if (demo.headers && typeof demo.headers === 'object') {
      Object.keys(demo.headers).forEach(function (k) {
        frag.push(k + ': ' + demo.headers[k]);
      });
    }
    if (demo.body) {
      var bodyStr = typeof demo.body === 'string' ? demo.body : JSON.stringify(demo.body, null, 2);
      try {
        var parsed = JSON.parse(bodyStr);
        bodyStr = JSON.stringify(parsed, null, 2);
      } catch (e) {}
      frag.push('');
      frag.push(bodyStr);
    }
    return frag.join('\n');
  }

  function buildMaltaEventsCard(demo) {
    var card = document.createElement('div');
    card.className = 'demo-card demo-card--malta-events';
    card.setAttribute('data-demo', demo.id);

    var title = document.createElement('h4');
    title.className = 'demo-card-title';
    title.textContent = demo.title;
    card.appendChild(title);

    var desc = document.createElement('p');
    desc.className = 'demo-card-desc';
    desc.textContent = demo.description;
    card.appendChild(desc);

    var controls = document.createElement('div');
    controls.className = 'demo-malta-controls';

    var radioWrap = document.createElement('div');
    radioWrap.className = 'demo-malta-radios';
    var radioLabel = document.createElement('span');
    radioLabel.className = 'demo-malta-label';
    radioLabel.textContent = 'Dataset:';
    radioWrap.appendChild(radioLabel);
    var earthquakesRadio = document.createElement('input');
    earthquakesRadio.type = 'radio';
    earthquakesRadio.name = 'malta-dataset-' + demo.id;
    earthquakesRadio.id = 'malta-eq-' + demo.id;
    earthquakesRadio.value = 'earthquakes';
    earthquakesRadio.checked = true;
    var eqLabel = document.createElement('label');
    eqLabel.htmlFor = 'malta-eq-' + demo.id;
    eqLabel.textContent = 'Earthquakes';
    radioWrap.appendChild(earthquakesRadio);
    radioWrap.appendChild(eqLabel);
    var stormyRadio = document.createElement('input');
    stormyRadio.type = 'radio';
    stormyRadio.name = 'malta-dataset-' + demo.id;
    stormyRadio.id = 'malta-stormy-' + demo.id;
    stormyRadio.value = 'stormy';
    var stormyLabel = document.createElement('label');
    stormyLabel.htmlFor = 'malta-stormy-' + demo.id;
    stormyLabel.textContent = 'Stormy days';
    radioWrap.appendChild(stormyRadio);
    radioWrap.appendChild(stormyLabel);
    controls.appendChild(radioWrap);

    var sliderWrap = document.createElement('div');
    sliderWrap.className = 'demo-malta-slider-wrap';
    var sliderLabel = document.createElement('label');
    sliderLabel.htmlFor = 'malta-years-' + demo.id;
    sliderLabel.className = 'demo-malta-label';
    sliderLabel.textContent = 'Years back: ';
    var yearsVal = document.createElement('span');
    yearsVal.className = 'demo-malta-years-value';
    yearsVal.textContent = '5';
    sliderLabel.appendChild(yearsVal);
    sliderLabel.appendChild(document.createTextNode(' years'));
    sliderWrap.appendChild(sliderLabel);
    var slider = document.createElement('input');
    slider.type = 'range';
    slider.min = 1;
    slider.max = 10;
    slider.value = 5;
    slider.id = 'malta-years-' + demo.id;
    slider.className = 'demo-malta-slider';
    slider.setAttribute('aria-label', 'Years to look back, 1 to 10');
    sliderWrap.appendChild(slider);
    controls.appendChild(sliderWrap);

    var limitWrap = document.createElement('div');
    limitWrap.className = 'demo-malta-years-wrap';
    var limitLabel = document.createElement('label');
    limitLabel.htmlFor = 'malta-limit-' + demo.id;
    limitLabel.className = 'demo-malta-label';
    limitLabel.textContent = 'Result limit: ';
    limitWrap.appendChild(limitLabel);
    var limitSelect = document.createElement('select');
    limitSelect.id = 'malta-limit-' + demo.id;
    limitSelect.className = 'demo-malta-select';
    [5, 10, 15, 20].forEach(function (n) {
      var opt = document.createElement('option');
      opt.value = n;
      opt.textContent = n;
      limitSelect.appendChild(opt);
    });
    limitWrap.appendChild(limitSelect);
    controls.appendChild(limitWrap);

    card.appendChild(controls);

    var resultEl = document.createElement('div');
    resultEl.className = 'demo-result';
    resultEl.setAttribute('aria-live', 'polite');
    card.appendChild(resultEl);

    var runBtn = document.createElement('button');
    runBtn.type = 'button';
    runBtn.className = 'demo-card-btn';
    runBtn.textContent = 'Run request';
    runBtn.setAttribute('aria-label', 'Run ' + demo.title);
    card.appendChild(runBtn);

    var maltaRef = document.createElement('div');
    maltaRef.className = 'demo-card-reference';
    maltaRef.textContent = 'EMSC, USGS, Open-Meteo';
    card.appendChild(maltaRef);

    slider.addEventListener('input', function () { yearsVal.textContent = slider.value; });

    function renderMaltaResult(resultEl, dataset, years, meta, text, useFallback) {
      resultEl.classList.remove('loading', 'error');
      resultEl.classList.add('done');
      resultEl.textContent = '';
      if (meta) {
        var metaDiv = document.createElement('div');
        metaDiv.className = 'demo-result-meta';
        metaDiv.textContent = meta;
        resultEl.appendChild(metaDiv);
      }
      var textDiv = document.createElement('div');
      textDiv.className = 'demo-result-text';
      textDiv.textContent = text;
      resultEl.appendChild(textDiv);
      if (dataset === 'earthquakes') {
        var credit = document.createElement('p');
        credit.className = 'demo-result-credit';
        credit.appendChild(document.createTextNode('Malta: '));
        var a1 = document.createElement('a');
        a1.href = 'https://www.emsc-csem.org';
        a1.target = '_blank';
        a1.rel = 'noopener';
        a1.textContent = 'SeismicPortal (EMSC)';
        credit.appendChild(a1);
        if (useFallback) credit.appendChild(document.createTextNode(' · USGS fallback'));
        resultEl.appendChild(credit);
      }
    }

    runBtn.addEventListener('click', function () {
      if (!tryRecordDemoCall(demo.id).allowed) {
        showRateLimitMessage(resultEl);
        return;
      }
      var years = parseInt(slider.value, 10);
      var limit = parseInt(limitSelect.value, 10);
      var dataset = earthquakesRadio.checked ? 'earthquakes' : 'stormy';
      resultEl.textContent = '';
      resultEl.classList.add('loading');
      resultEl.classList.remove('error', 'done');
      runBtn.disabled = true;

      if (dataset === 'stormy') {
        var end = new Date();
        var start = new Date();
        start.setFullYear(start.getFullYear() - years);
        var startStr = start.toISOString().slice(0, 10);
        var endStr = end.toISOString().slice(0, 10);
        var url = 'https://archive-api.open-meteo.com/v1/archive?latitude=35.9&longitude=14.5&start_date=' + startStr + '&end_date=' + endStr + '&daily=precipitation_sum,wind_gusts_10m_max&timezone=Europe/Malta';
        fetch(url)
          .then(function (r) { return r.json(); })
          .then(function (data) {
            if (!data || !data.daily || !data.daily.time) {
              resultEl.classList.remove('loading');
              resultEl.classList.add('done');
              resultEl.textContent = 'No data for this period.';
              return;
            }
            var times = data.daily.time;
            var precip = data.daily.precipitation_sum || [];
            var wind = data.daily.wind_gusts_10m_max || [];
            var scores = times.map(function (_, i) {
              return { date: times[i], p: precip[i] || 0, w: wind[i] || 0, score: (precip[i] || 0) + (wind[i] || 0) * 0.5 };
            });
            scores.sort(function (a, b) { return b.score - a.score; });
            var top = scores.slice(0, Math.min(limit, 5));
            var text = top.length ? top.map(function (x) { return x.date + ': precip ' + x.p + ' mm, max wind ' + x.w + ' km/h'; }).join('\n') : 'No stormy days in range.';
            var meta = 'Malta · last ' + years + ' year(s) · limit ' + limit;
            resultEl.classList.remove('loading');
            renderMaltaResult(resultEl, 'stormy', years, meta, text, false);
          })
          .catch(function () {
            resultEl.classList.remove('loading');
            resultEl.classList.add('error');
            resultEl.textContent = 'Failed to fetch weather archive.';
          })
          .then(function () { runBtn.disabled = false; });
        return;
      }

      var start = new Date();
      start.setFullYear(start.getFullYear() - years);
      var startStr = start.toISOString().slice(0, 10).replace(/-/g, '');
      var emscUrl = 'https://www.seismicportal.eu/fdsnws/event/1/query?format=json&limit=' + limit + '&minlat=35&maxlat=36&minlon=14&maxlon=16&start=' + startStr;
      fetch(emscUrl)
        .then(function (r) { return r.json(); })
        .then(function (data) {
          var events = Array.isArray(data) ? data : (data && data.events) ? data.events : [];
          var text = events.length ? events.slice(0, limit).map(function (e) {
            var mag = e.mag !== undefined ? e.mag : (e.magnitude && e.magnitude.value) ? e.magnitude.value : '—';
            var time = e.time || e.originTime || e.datetime || '—';
            var loc = (e.location || e.place || e.region || '').trim() || '—';
            return time + ' M' + mag + ' ' + loc;
          }).join('\n') : '';
          var useFallback = false;
          if (!text && events.length === 0) throw new Error('EMSC empty');
          renderMaltaResult(resultEl, 'earthquakes', years, 'Malta · last ' + years + ' year(s) · limit ' + limit + ' (EMSC)', text || 'No earthquakes in this period for the Malta region.', useFallback);
        })
        .catch(function () {
          var usgsUrl = 'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&limit=' + limit + '&minlatitude=35&maxlatitude=36&minlongitude=14&maxlongitude=16&starttime=' + start.toISOString();
          return fetch(usgsUrl).then(function (r) { return r.json(); }).then(function (geo) {
            var features = (geo && geo.features) ? geo.features : [];
            var text = features.length ? features.map(function (f) {
              var p = f.properties || {};
              var mag = p.mag != null ? p.mag : '—';
              var time = p.time ? new Date(p.time).toISOString() : '—';
              var loc = (p.place || '').trim() || '—';
              return time + ' M' + mag + ' ' + loc;
            }).join('\n') : 'No earthquakes in this period for the Malta region.';
            renderMaltaResult(resultEl, 'earthquakes', years, 'Malta · last ' + years + ' year(s) · limit ' + limit + ' (USGS)', text, true);
          });
        })
        .catch(function () {
          resultEl.classList.remove('loading');
          resultEl.classList.add('error');
          resultEl.textContent = 'Could not load earthquake data (EMSC or USGS).';
        })
        .then(function () { runBtn.disabled = false; });
    });

    return card;
  }

  function buildKeypairCard(demo) {
    var card = document.createElement('div');
    card.className = 'demo-card demo-card--keypair';
    card.setAttribute('data-demo', demo.id);

    var titleRow = document.createElement('div');
    titleRow.className = 'demo-card-title-row';
    var title = document.createElement('h4');
    title.className = 'demo-card-title';
    title.textContent = demo.title;
    titleRow.appendChild(title);
    var infoBtn = document.createElement('button');
    infoBtn.type = 'button';
    infoBtn.className = 'demo-card-info-btn';
    infoBtn.setAttribute('aria-label', 'What does this do?');
    infoBtn.innerHTML = '<span aria-hidden="true">&#8505;</span><span class="demo-card-info-tooltip">The keys are generated safely locally in your browser.</span>';
    titleRow.appendChild(infoBtn);
    card.appendChild(titleRow);

    var desc = document.createElement('p');
    desc.className = 'demo-card-desc';
    desc.textContent = demo.description;
    card.appendChild(desc);

    var keypairState = { privatePem: null, publicPem: null, fingerprint: null };

    function arrayBufferToBase64(buf) {
      var bytes = new Uint8Array(buf);
      var bin = '';
      for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
      return typeof btoa !== 'undefined' ? btoa(bin) : '';
    }

    function toPem(label, derBase64) {
      var lines = [];
      for (var i = 0; i < derBase64.length; i += 64) lines.push(derBase64.slice(i, i + 64));
      return '-----BEGIN ' + label + '-----\n' + lines.join('\n') + '\n-----END ' + label + '-----';
    }

    function sha256Fingerprint(buf) {
      return crypto.subtle.digest('SHA-256', buf).then(function (hash) {
        var bytes = new Uint8Array(hash);
        var hex = '';
        for (var i = 0; i < bytes.length; i++) hex += ('0' + bytes[i].toString(16)).slice(-2);
        return hex.match(/.{1,2}/g).join(':');
      });
    }

    var statusEl = document.createElement('div');
    statusEl.className = 'demo-keypair-status';
    statusEl.setAttribute('aria-live', 'polite');
    card.appendChild(statusEl);

    var btnWrap = document.createElement('div');
    btnWrap.className = 'demo-keypair-buttons';

    var genBtn = document.createElement('button');
    genBtn.type = 'button';
    genBtn.className = 'demo-card-btn';
    genBtn.textContent = 'Generate key pair';
    genBtn.setAttribute('aria-label', 'Generate RSA key pair');
    btnWrap.appendChild(genBtn);

    var dlPrivate = document.createElement('button');
    dlPrivate.type = 'button';
    dlPrivate.className = 'demo-card-btn demo-card-btn--secondary';
    dlPrivate.textContent = 'Download Private Key';
    dlPrivate.setAttribute('aria-label', 'Download private key as PEM file');
    dlPrivate.disabled = true;
    btnWrap.appendChild(dlPrivate);

    var dlPublic = document.createElement('button');
    dlPublic.type = 'button';
    dlPublic.className = 'demo-card-btn demo-card-btn--secondary';
    dlPublic.textContent = 'Download Public Key';
    dlPublic.setAttribute('aria-label', 'Download public key as PEM file');
    dlPublic.disabled = true;
    btnWrap.appendChild(dlPublic);

    card.appendChild(btnWrap);

    var keypairRef = document.createElement('div');
    keypairRef.className = 'demo-card-reference';
    keypairRef.textContent = 'Web Crypto API';
    card.appendChild(keypairRef);

    genBtn.addEventListener('click', function () {
      if (!tryRecordDemoCall(demo.id).allowed) {
        statusEl.textContent = RATE_LIMIT_MSG;
        statusEl.className = 'demo-keypair-status demo-keypair-status--rate-limited';
        return;
      }
      if (!window.crypto || !crypto.subtle) {
        statusEl.textContent = 'Web Crypto API is not available in this browser.';
        statusEl.className = 'demo-keypair-status demo-keypair-status--error';
        return;
      }
      statusEl.textContent = 'Generating…';
      statusEl.className = 'demo-keypair-status';
      genBtn.disabled = true;

      crypto.subtle.generateKey(
        { name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
        true,
        ['encrypt', 'decrypt']
      ).then(function (keyPair) {
        return Promise.all([
          crypto.subtle.exportKey('pkcs8', keyPair.privateKey),
          crypto.subtle.exportKey('spki', keyPair.publicKey)
        ]).then(function (exports) {
          var privateDer = exports[0];
          var publicDer = exports[1];
          keypairState.privatePem = toPem('PRIVATE KEY', arrayBufferToBase64(privateDer));
          keypairState.publicPem = toPem('PUBLIC KEY', arrayBufferToBase64(publicDer));
          return sha256Fingerprint(publicDer).then(function (fp) {
            keypairState.fingerprint = fp;
          });
        });
      }).then(function () {
        statusEl.className = 'demo-keypair-status demo-keypair-status--done';
        statusEl.innerHTML = '';
        statusEl.appendChild(document.createTextNode('Key pair generated. Store the private key securely. '));
        var fpSpan = document.createElement('span');
        fpSpan.className = 'demo-keypair-fingerprint';
        fpSpan.textContent = 'SHA-256 fingerprint: ' + keypairState.fingerprint;
        statusEl.appendChild(fpSpan);
        dlPrivate.disabled = false;
        dlPublic.disabled = false;
      }).catch(function (err) {
        statusEl.className = 'demo-keypair-status demo-keypair-status--error';
        statusEl.textContent = 'Error: ' + (err.message || 'Key generation failed');
      }).then(function () {
        genBtn.disabled = false;
      });
    });

    function downloadPem(filename, pem) {
      var blob = new Blob([pem], { type: 'application/x-pem-file' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    }

    dlPrivate.addEventListener('click', function () {
      if (keypairState.privatePem) downloadPem('private-key.pem', keypairState.privatePem);
    });
    dlPublic.addEventListener('click', function () {
      if (keypairState.publicPem) downloadPem('public-key.pem', keypairState.publicPem);
    });

    return card;
  }

  demos.forEach(function (demo) {
    if (demo.type === 'malta-events') {
      container.appendChild(buildMaltaEventsCard(demo));
      return;
    }
    if (demo.type === 'keypair') {
      container.appendChild(buildKeypairCard(demo));
      return;
    }

    var card = document.createElement('div');
    card.className = 'demo-card';
    card.setAttribute('data-demo', demo.id);

    var title = document.createElement('h4');
    title.className = 'demo-card-title';
    title.textContent = demo.title;
    card.appendChild(title);

    var desc = document.createElement('p');
    desc.className = 'demo-card-desc';
    desc.textContent = demo.description;
    card.appendChild(desc);

    var requestSection = document.createElement('div');
    requestSection.className = 'demo-request';
    var requestLabel = document.createElement('span');
    requestLabel.className = 'demo-section-label';
    requestLabel.textContent = 'Request';
    requestSection.appendChild(requestLabel);
    var requestContent = document.createElement('pre');
    requestContent.className = 'demo-request-content';
    requestContent.textContent = buildRequestSection(demo);
    requestSection.appendChild(requestContent);
    card.appendChild(requestSection);

    var responseSection = document.createElement('div');
    responseSection.className = 'demo-response';
    var responseLabel = document.createElement('span');
    responseLabel.className = 'demo-section-label';
    responseLabel.textContent = 'Response';
    responseSection.appendChild(responseLabel);
    var resultWrap = document.createElement('div');
    resultWrap.className = 'demo-result';
    resultWrap.setAttribute('aria-live', 'polite');
    resultWrap.setAttribute('aria-label', 'Response');
    resultWrap.textContent = '— Run request to see response.';
    responseSection.appendChild(resultWrap);
    card.appendChild(responseSection);

    var runBtn = document.createElement('button');
    runBtn.type = 'button';
    runBtn.className = 'demo-card-btn';
    runBtn.textContent = 'Run request';
    runBtn.setAttribute('aria-label', 'Run ' + demo.title);
    card.appendChild(runBtn);

    if (demo.url) {
      var refDiv = document.createElement('div');
      refDiv.className = 'demo-card-reference';
      try {
        var refLink = document.createElement('a');
        refLink.href = demo.url;
        refLink.target = '_blank';
        refLink.rel = 'noopener';
        refLink.textContent = demo.url.replace(/^https?:\/\//, '').split('/')[0];
        refDiv.appendChild(refLink);
      } catch (e) {}
      card.appendChild(refDiv);
    }

    runBtn.addEventListener('click', function () {
      var resultEl = card.querySelector('.demo-result');
      if (!tryRecordDemoCall(demo.id).allowed) {
        showRateLimitMessage(resultEl);
        return;
      }
      resultEl.textContent = '';
      resultEl.classList.remove('error', 'done');
      resultEl.classList.add('loading');
      runBtn.disabled = true;
      runBtn.textContent = 'Loading…';

      var opts = { method: demo.method || 'GET' };
      if (demo.headers) opts.headers = demo.headers;
      if (demo.body) opts.body = demo.body;

      var fetchUrl = demo.fetchUrl || demo.url;
      var getData = demo.getData || function (r) { return r.json(); };

      fetch(fetchUrl, opts)
        .then(function (r) {
          if (!r.ok) throw new Error(r.status + ' ' + r.statusText);
          return getData(r);
        })
        .then(function (data) {
          var out = demo.format ? demo.format(data) : { text: JSON.stringify(data, null, 2), meta: null };
          resultEl.classList.remove('loading');
          resultEl.classList.add('done');
          if (out.meta) {
            var meta = document.createElement('div');
            meta.className = 'demo-result-meta';
            meta.textContent = out.meta;
            resultEl.appendChild(meta);
          }
          if (out.imageUrl) {
            var imgWrap = document.createElement('div');
            imgWrap.className = 'demo-result-image-wrap';
            var img = document.createElement('img');
            img.src = out.imageUrl;
            img.alt = out.text || 'API image';
            img.className = 'demo-result-image';
            imgWrap.appendChild(img);
            resultEl.appendChild(imgWrap);
          }
          var text = document.createElement('div');
          text.className = 'demo-result-text';
          text.textContent = typeof out.text === 'string' ? out.text : JSON.stringify(out.text);
          resultEl.appendChild(text);
        })
        .catch(function (err) {
          resultEl.classList.remove('loading');
          resultEl.classList.add('error');
          resultEl.textContent = 'Error: ' + (err.message || 'Request failed');
        })
        .then(function () {
          runBtn.disabled = false;
          runBtn.textContent = 'Run request';
        });
    });

    container.appendChild(card);
  });
})();

(function () {
  var demos = window.CV_DEMOS;
  var container = document.getElementById('demos-container');
  if (!demos || !container) return;

  var rateLimitState = {};
  var RATE_LIMIT_MSG = 'Thanks for trying this out — we hope it was interesting. Feel free to reach out or contact me.';

  function tryRecordDemoCall(demoId) {
    var now = Date.now();
    if (!rateLimitState[demoId]) rateLimitState[demoId] = { timestamps: [], cooldownUntil: 0 };
    var s = rateLimitState[demoId];
    if (now < s.cooldownUntil) return { allowed: false };
    s.timestamps = s.timestamps.filter(function (t) { return now - t < 60000; });
    if (s.timestamps.length >= 5) {
      s.cooldownUntil = now + 13 * 60 * 1000;
      return { allowed: false };
    }
    s.timestamps.push(now);
    return { allowed: true };
  }

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
    limitSelect.setAttribute('aria-label', 'Maximum number of results');
    [5, 10, 15, 20].forEach(function (n) {
      var opt = document.createElement('option');
      opt.value = n;
      opt.textContent = n;
      if (n === 5) opt.selected = true;
      limitSelect.appendChild(opt);
    });
    limitWrap.appendChild(limitSelect);
    controls.appendChild(limitWrap);

    card.appendChild(controls);

    var requestSection = document.createElement('div');
    requestSection.className = 'demo-request';
    var requestLabel = document.createElement('span');
    requestLabel.className = 'demo-section-label';
    requestLabel.textContent = 'Request';
    requestSection.appendChild(requestLabel);
    var requestContent = document.createElement('pre');
    requestContent.className = 'demo-request-content';
    requestContent.textContent = 'Select dataset and years, then Run request.';
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

    slider.addEventListener('input', function () {
      yearsVal.textContent = slider.value;
    });

    runBtn.addEventListener('click', function () {
      var resultEl = card.querySelector('.demo-result');
      if (!tryRecordDemoCall(demo.id).allowed) {
        showRateLimitMessage(resultEl);
        return;
      }
      var years = parseInt(slider.value, 10);
      var limit = parseInt(limitSelect.value, 10);
      var dataset = card.querySelector('input[name="malta-dataset-' + demo.id + '"]:checked').value;
      var end = new Date();
      var start = new Date();
      start.setFullYear(start.getFullYear() - years);
      var startStr = start.toISOString().slice(0, 10);
      var endStr = end.toISOString().slice(0, 10);

      var emscUrl = 'https://www.seismicportal.eu/fdsnws/event/1/query?format=json&nodata=404&minlatitude=35.8&maxlatitude=36.05&minlongitude=14.1&maxlongitude=14.6&starttime=' + startStr + '&endtime=' + endStr + '&limit=' + limit + '&orderby=time';
      var usgsUrl = 'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minlatitude=35.8&maxlatitude=36.05&minlongitude=14.1&maxlongitude=14.6&starttime=' + startStr + '&endtime=' + endStr + '&limit=' + limit + '&orderby=time';

      var url;
      if (dataset === 'earthquakes') {
        url = emscUrl;
      } else {
        url = 'https://archive-api.open-meteo.com/v1/archive?latitude=35.9&longitude=14.5&start_date=' + startStr + '&end_date=' + endStr + '&daily=precipitation_sum,wind_gusts_10m_max&timezone=Europe/Malta';
      }

      requestContent.textContent = 'GET ' + url;

      resultEl.textContent = '';
      resultEl.classList.remove('error', 'done');
      resultEl.classList.add('loading');
      runBtn.disabled = true;
      runBtn.textContent = 'Loading…';

      function parseQuakeFeatures(data) {
        var features = (data && data.features) || [];
        return features.map(function (f, i) {
          var p = f.properties || f;
          var timeVal = p.time || p.Time;
          var date = timeVal ? new Date(timeVal).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
          var mag = p.mag != null ? p.mag : (p.Magnitude != null ? p.Magnitude : '—');
          var place = (p.place || p.EventLocationName || p.flynn_region || p.title || '—').replace(/^[^,]*,\s*/, '');
          return (i + 1) + '. ' + date + ' · Mag ' + mag + ' · ' + place;
        }).join('\n');
      }

      function runEarthquakes(apiUrl, useFallback) {
        return fetch(apiUrl)
          .then(function (r) {
            if (r.status === 204 || r.status === 404) return { features: [] };
            if (!r.ok) throw new Error(r.status + ' ' + r.statusText);
            return r.json();
          })
          .then(function (data) {
            var features = (data && data.features) || [];
            var text = features.length === 0
              ? 'No earthquakes in this period for the Malta region.'
              : parseQuakeFeatures(data);
            var meta = 'Malta · last ' + years + ' year(s) · limit ' + limit + (useFallback ? ' (USGS)' : ' (EMSC)');
            requestContent.textContent = 'GET ' + apiUrl;
            renderMaltaResult(resultEl, dataset, years, meta, text, useFallback);
          })
          .catch(function (err) {
            if (!useFallback && dataset === 'earthquakes') {
              return runEarthquakes(usgsUrl, true);
            }
            resultEl.classList.remove('loading');
            resultEl.classList.add('error');
            resultEl.textContent = 'Error: ' + (err.message || 'Request failed');
          })
          .then(function () {
            runBtn.disabled = false;
            runBtn.textContent = 'Run request';
          });
      }

      function renderMaltaResult(resultEl, dataset, years, meta, text, useFallback) {
        resultEl.classList.remove('loading');
        resultEl.classList.add('done');
        var metaEl = document.createElement('div');
        metaEl.className = 'demo-result-meta';
        metaEl.textContent = meta;
        resultEl.appendChild(metaEl);
        var textEl = document.createElement('div');
        textEl.className = 'demo-result-text';
        textEl.textContent = text;
        resultEl.appendChild(textEl);
        if (dataset === 'earthquakes') {
          var credit = document.createElement('div');
          credit.className = 'demo-result-credit';
          var emscLink = document.createElement('a');
          emscLink.href = 'https://www.emsc-csem.org';
          emscLink.target = '_blank';
          emscLink.rel = 'noopener';
          emscLink.textContent = 'EMSC';
          credit.appendChild(document.createTextNode('Data: '));
          credit.appendChild(emscLink);
          credit.appendChild(document.createTextNode(' · Malta: '));
          var smrgLink = document.createElement('a');
          smrgLink.href = 'https://seismic.research.um.edu.mt';
          smrgLink.target = '_blank';
          smrgLink.rel = 'noopener';
          smrgLink.textContent = 'SMRG';
          credit.appendChild(smrgLink);
          credit.appendChild(document.createTextNode(' · '));
          var eqTrackLink = document.createElement('a');
          eqTrackLink.href = 'https://earthquaketrack.com/p/malta/recent';
          eqTrackLink.target = '_blank';
          eqTrackLink.rel = 'noopener';
          eqTrackLink.textContent = 'Earthquake Track';
          credit.appendChild(eqTrackLink);
          resultEl.appendChild(credit);
        }
      }

      if (dataset === 'earthquakes') {
        runEarthquakes(emscUrl, false);
        return;
      }

      fetch(url)
        .then(function (r) {
          if (!r.ok) throw new Error(r.status + ' ' + r.statusText);
          return r.json();
        })
        .then(function (data) {
          var daily = data.daily;
          var text;
          var meta = 'Malta · last ' + years + ' year(s) · limit ' + limit;
          if (!daily || !daily.time || !daily.time.length) {
            text = 'No daily data for this period.';
          } else {
            var days = daily.time.map(function (t, i) {
              return {
                date: t,
                precip: daily.precipitation_sum && daily.precipitation_sum[i] != null ? daily.precipitation_sum[i] : 0,
                wind: daily.wind_gusts_10m_max && daily.wind_gusts_10m_max[i] != null ? daily.wind_gusts_10m_max[i] : 0
              };
            });
            days.sort(function (a, b) {
              var scoreA = a.precip + (a.wind || 0) / 10;
              var scoreB = b.precip + (b.wind || 0) / 10;
              return scoreB - scoreA;
            });
            var topN = days.slice(0, limit);
            text = topN.length === 0 ? 'No data.' : topN.map(function (d, i) {
              var dateStr = d.date;
              try { dateStr = new Date(d.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); } catch (e) {}
              return (i + 1) + '. ' + dateStr + ' · ' + (d.precip != null ? d.precip.toFixed(1) : '0') + ' mm rain · ' + (d.wind != null ? Math.round(d.wind) : '—') + ' km/h gusts';
            }).join('\n');
          }
          resultEl.classList.remove('loading');
          resultEl.classList.add('done');
          var metaEl = document.createElement('div');
          metaEl.className = 'demo-result-meta';
          metaEl.textContent = meta;
          resultEl.appendChild(metaEl);
          var textEl = document.createElement('div');
          textEl.className = 'demo-result-text';
          textEl.textContent = text;
          resultEl.appendChild(textEl);
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

    return card;
  }

  demos.forEach(function (demo) {
    if (demo.type === 'malta-events') {
      container.appendChild(buildMaltaEventsCard(demo));
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

      fetch(demo.url, opts)
        .then(function (r) {
          if (!r.ok) throw new Error(r.status + ' ' + r.statusText);
          return r.json();
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

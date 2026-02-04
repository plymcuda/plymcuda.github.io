/**
 * API & integration demos – config for interactive examples on the CV site.
 * Add or edit entries to showcase REST, GraphQL, or other API skills.
 */
window.CV_DEMOS = [
  {
    id: 'weather',
    title: 'Weather API (Open-Meteo)',
    description: 'REST GET – current weather for a location. Same family of APIs we use for the sidebar.',
    type: 'rest',
    url: 'https://api.open-meteo.com/v1/forecast?latitude=35.8997&longitude=14.5147&current=temperature_2m,weather_code,wind_speed_10m&timezone=Europe/Malta',
    method: 'GET',
    format: function (data) {
      if (!data || !data.current) return { text: 'No data', meta: null };
      var c = data.current;
      var desc = c.weather_code === 0 ? 'Clear' : c.weather_code <= 3 ? 'Cloudy' : c.weather_code <= 49 ? 'Fog' : c.weather_code <= 67 ? 'Rain' : c.weather_code <= 82 ? 'Snow' : 'Thunder';
      return {
        text: (c.temperature_2m != null ? Math.round(c.temperature_2m) + '°C' : '—') + ' · ' + desc + (c.wind_speed_10m != null ? ' · Wind ' + c.wind_speed_10m + ' km/h' : ''),
        meta: 'Malta (lat/lon 35.9, 14.5)'
      };
    }
  },
  {
    id: 'rest-post',
    title: 'REST API (JSONPlaceholder)',
    description: 'REST GET – fetch a sample post. Useful for testing integrations and Postman flows.',
    type: 'rest',
    url: 'https://jsonplaceholder.typicode.com/posts/1',
    method: 'GET',
    format: function (data) {
      if (!data) return { text: 'No data', meta: null };
      return {
        text: data.body || '',
        meta: 'Post #' + (data.id || '') + ': ' + (data.title || '')
      };
    }
  },
  {
    id: 'graphql',
    title: 'GraphQL (Countries API)',
    description: 'GraphQL query – fetch country by code. Similar pattern to GQL schema exploration.',
    type: 'graphql',
    url: 'https://countries.trevorblades.com/graphql',
    method: 'POST',
    body: JSON.stringify({
      query: 'query { country(code: "MT") { name capital emoji currency } }'
    }),
    headers: { 'Content-Type': 'application/json' },
    format: function (data) {
      if (!data || !data.data || !data.data.country) return { text: 'No data', meta: null };
      var c = data.data.country;
      var parts = [c.name, c.capital && 'Capital: ' + c.capital, c.currency && 'Currency: ' + c.currency].filter(Boolean);
      return {
        text: (c.emoji || '') + ' ' + parts.join(' · '),
        meta: 'Query: country(code: "MT")'
      };
    }
  },
  {
    id: 'malta-events',
    title: 'Malta: Earthquakes or Stormy days',
    description: 'Choose a dataset and how far back to search (1–10 years). User is also able to select from 5 - 20 results. Earthquakes: Malta region via EMSC (European-Mediterranean Seismological Centre); USGS used if EMSC is unavailable. Stormy days: Open-Meteo historical (wind + rain).',
    type: 'malta-events'
  }
];

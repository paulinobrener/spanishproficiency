
async function loadData() {
  const url = window.APP_CONFIG.dataUrl;
  const resp = await fetch(url, { cache: "no-store" });
  const data = await resp.json();
  return data;
}

function clean(s) {
  return String(s == null ? "" : s).trim();
}

function uniqueSorted(list, key) {
  const set = new Set(list.map(x => clean(x[key])).filter(Boolean));
  return Array.from(set).sort((a,b) => a.localeCompare(b));
}

function applyFilters(data, filters) {
  const query = clean(filters.query).toLowerCase();
  const byCountry = clean(filters.country).toLowerCase();
  const byLevel = clean(filters.level).toLowerCase();
  const bySpeaker = clean(filters.speaker).toLowerCase();

  return data.filter(row => {
    const country = clean(row['Country']).toLowerCase();
    const level = clean(row['Level']).toLowerCase();
    const speaker = clean(row['Speaker']).toLowerCase();
    const task = clean(row['Task']).toLowerCase();

    if (byCountry && country !== byCountry) return false;
    if (byLevel && level !== byLevel) return false;
    if (bySpeaker && speaker !== bySpeaker) return false;

    if (query) {
      const haystack = [country, level, speaker, task].join(' ');
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

function renderOptions(select, values) {
  select.innerHTML = '<option value="">All</option>' + values.map(v => `<option value="${v}">${v}</option>`).join('');
}

function setFromParams() {
  const p = new URLSearchParams(location.search);
  return {
    query: p.get('q') || '',
    country: p.get('country') || '',
    level: p.get('level') || '',
    speaker: p.get('speaker') || ''
  };
}

function updateParams(filters) {
  const p = new URLSearchParams();
  if (filters.query) p.set('q', filters.query);
  if (filters.country) p.set('country', filters.country);
  if (filters.level) p.set('level', filters.level);
  if (filters.speaker) p.set('speaker', filters.speaker);
  const qs = p.toString();
  const newUrl = qs ? `${location.pathname}?${qs}` : location.pathname;
  history.replaceState({}, '', newUrl);
}

function renderList(container, rows) {
  container.innerHTML = '';
  const tpl = document.getElementById('card-template');
  rows.forEach(r => {
    const node = tpl.content.cloneNode(true);
    const title = node.querySelector('.title');
    const meta = node.querySelector('.meta');
    const link = node.querySelector('.link');

    title.textContent = `${clean(r['Task'])} (${clean(r['Level'])})`;
    const regionText = clean(r['Region']) ? ' · Region: ' + clean(r['Region']) : '';
    meta.textContent = `Speaker: ${clean(r['Speaker'])} · Country: ${clean(r['Country'])}${regionText}`;
    link.href = clean(r['Link']);

    container.appendChild(node);
  });
}

(async function init() {
  const data = await loadData();

  const search = document.getElementById('search');
  const country = document.getElementById('country');
  const level = document.getElementById('level');
  const speaker = document.getElementById('speaker');
  const clear = document.getElementById('clear');
  const share = document.getElementById('share');
  const results = document.getElementById('results');
  const count = document.getElementById('count');

  renderOptions(country, uniqueSorted(data, 'Country'));
  renderOptions(level, uniqueSorted(data, 'Level'));
  renderOptions(speaker, uniqueSorted(data, 'Speaker'));

  const initial = setFromParams();
  search.value = initial.query;
  country.value = initial.country;
  level.value = initial.level;
  speaker.value = initial.speaker;

  function currentFilters() {
    return {
      query: search.value,
      country: country.value,
      level: level.value,
      speaker: speaker.value
    };
  }

  function refresh() {
    const filters = currentFilters();
    updateParams(filters);
    const rows = applyFilters(data, filters);
    count.textContent = `${rows.length} result${rows.length === 1 ? '' : 's'}`;
    renderList(results, rows);
  }

  search.addEventListener('input', refresh);
  country.addEventListener('change', refresh);
  level.addEventListener('change', refresh);
  speaker.addEventListener('change', refresh);

  clear.addEventListener('click', () => {
    search.value = '';
    country.value = '';
    level.value = '';
    speaker.value = '';
    refresh();
  });

  share.addEventListener('click', async () => {
    const url = location.href;
    try {
      await navigator.clipboard.writeText(url);
      share.textContent = 'Link copied';
      setTimeout(() => { share.textContent = 'Share this view'; }, 1500);
    } catch (e) {
      alert('Copy the URL from your address bar.');
    }
  });

  refresh();
})();

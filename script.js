
/* Bilingual labels */
const labels = {
  es: {
    appTitle: "Explorador de Videos de Español",
    country: "País",
    region: "Región",
    speaker: "Presentador",
    level: "Nivel",
    topic: "Tema",
    search: "Buscar",
    searchPlaceholder: "Buscar...",
    clear: "Limpiar filtros",
    watch: "Ver video",
    footer: "Resultados basados en tu selección",
    noResults: "Sin resultados"
  },
  en: {
    appTitle: "Spanish Video Explorer",
    country: "Country",
    region: "Region",
    speaker: "Speaker",
    level: "Level",
    topic: "Topic",
    search: "Search",
    searchPlaceholder: "Search...",
    clear: "Clear filters",
    watch: "Watch video",
    footer: "Results based on your selection",
    noResults: "No results"
  }
};

const state = {
  lang: "es",
  data: [],
  filters: { country: [], region: [], speaker: [], level: [], topic: [], q: "" },
};

const els = {
  title: document.getElementById("app-title"),
  lang: document.getElementById("lang-select"),
  country: document.getElementById("country-filter"),
  region: document.getElementById("region-filter"),
  speaker: document.getElementById("speaker-filter"),
  level: document.getElementById("level-filter"),
  topic: document.getElementById("topic-filter"),
  search: document.getElementById("search-input"),
  clear: document.getElementById("clear-btn"),
  results: document.getElementById("results"),
  lblCountry: document.getElementById("lbl-country"),
  lblRegion: document.getElementById("lbl-region"),
  lblSpeaker: document.getElementById("lbl-speaker"),
  lblLevel: document.getElementById("lbl-level"),
  lblTopic: document.getElementById("lbl-topic"),
  lblSearch: document.getElementById("lbl-search"),
  footerNote: document.getElementById("footer-note"),
  cardTpl: document.getElementById("card-template")
};

function t(key){ return labels[state.lang][key]; }

function setTexts(){
  els.title.textContent = t("appTitle");
  els.lblCountry.textContent = t("country");
  els.lblRegion.textContent = t("region");
  els.lblSpeaker.textContent = t("speaker");
  els.lblLevel.textContent = t("level");
  els.lblTopic.textContent = t("topic");
  els.lblSearch.textContent = t("search");
  els.search.placeholder = t("searchPlaceholder");
  els.clear.textContent = t("clear");
  els.footerNote.textContent = t("footer");
}

function uniqueValues(arr, key){
  const s = new Set();
  arr.forEach(r => {
    const v = (r[key] ?? "").trim();
    if(v) s.add(v);
  });
  return Array.from(s).sort((a,b)=>a.localeCompare(b));
}

function fillMultiSelect(selectEl, values){
  selectEl.innerHTML = "";
  values.forEach(v=>{
    const opt = document.createElement("option");
    opt.value = v;
    opt.textContent = v;
    selectEl.appendChild(opt);
  });
}

function getSelected(selectEl){
  return Array.from(selectEl.selectedOptions).map(o=>o.value);
}

function applyFilters(){
  const f = state.filters;
  const q = f.q.toLowerCase();
  const out = state.data.filter(row => {
    function inSel(val, arr){ return arr.length===0 || arr.includes((val||"").trim()); }
    const text = [row.Title,row.Description,row.Speaker,row.Country,row.Region,row.Topic]
      .join(" ").toLowerCase();
    return inSel(row.Country, f.country) &&
           inSel(row.Region, f.region) &&
           inSel(row.Speaker, f.speaker) &&
           inSel(row.Level, f.level) &&
           inSel(row.Topic, f.topic) &&
           (q==="" || text.includes(q));
  });
  render(out);
}

function render(rows){
  els.results.innerHTML = "";
  if(rows.length===0){
    const p = document.createElement("p");
    p.textContent = t("noResults");
    p.className = "meta";
    els.results.appendChild(p);
    return;
  }
  rows.forEach(r=>{
    const node = els.cardTpl.content.cloneNode(true);
    const art = node.querySelector(".card");
    const thumb = node.querySelector(".thumb");
    const title = node.querySelector(".title");
    const meta = node.querySelector(".meta");
    const desc = node.querySelector(".desc");
    const btn = node.querySelector(".btn");

    title.textContent = r.Title || "";
    meta.textContent = [r.Speaker, r.Country, r.Region, r.Level, r.Topic].filter(Boolean).join(" · ");
    desc.textContent = r.Description || "";
    btn.textContent = t("watch");
    btn.href = r.URL || "#";

    if(r.Thumbnail){
      thumb.style.backgroundImage = `url('${r.Thumbnail}')`;
      thumb.style.backgroundSize = "cover";
      thumb.style.backgroundPosition = "center";
    } else {
      thumb.setAttribute("aria-label", r.Title || "");
    }
    els.results.appendChild(node);
  });
}

function clearFilters(){
  state.filters = { country: [], region: [], speaker: [], level: [], topic: [], q: "" };
  els.country.selectedIndex = -1;
  els.region.selectedIndex = -1;
  els.speaker.selectedIndex = -1;
  els.level.selectedIndex = -1;
  els.topic.selectedIndex = -1;
  els.search.value = "";
  applyFilters();
}

async function loadData(){
  const res = await fetch("data.csv");
  const text = await res.text();
  const [header, ...lines] = text.trim().split(/\r?\n/);
  const cols = header.split(",");
  const data = lines.map(line=>{
    // Simple CSV split, handles commas inside quotes
    const cells = [];
    let cur = "", inQ = false;
    for(let i=0;i<line.length;i++){
      const ch = line[i];
      if(ch === '"'){
        inQ = !inQ;
      }else if(ch === "," && !inQ){
        cells.push(cur); cur = "";
      }else{
        cur += ch;
      }
    }
    cells.push(cur);
    const obj = {};
    cols.forEach((c,idx)=>{
      obj[c.trim()] = (cells[idx]||"").replace(/^"|"$/g,"");
    });
    return obj;
  });
  state.data = data;
  const countries = uniqueValues(data, "Country");
  const regions = uniqueValues(data, "Region");
  const speakers = uniqueValues(data, "Speaker");
  const levels = uniqueValues(data, "Level");
  const topics = uniqueValues(data, "Topic");

  fillMultiSelect(els.country, countries);
  fillMultiSelect(els.region, regions);
  fillMultiSelect(els.speaker, speakers);
  fillMultiSelect(els.level, levels);
  fillMultiSelect(els.topic, topics);

  applyFilters();
}

function bindEvents(){
  els.lang.addEventListener("change", () => {
    state.lang = els.lang.value;
    setTexts();
    applyFilters();
  });
  els.country.addEventListener("change", ()=>{ state.filters.country = getSelected(els.country); applyFilters(); });
  els.region.addEventListener("change", ()=>{ state.filters.region = getSelected(els.region); applyFilters(); });
  els.speaker.addEventListener("change", ()=>{ state.filters.speaker = getSelected(els.speaker); applyFilters(); });
  els.level.addEventListener("change", ()=>{ state.filters.level = getSelected(els.level); applyFilters(); });
  els.topic.addEventListener("change", ()=>{ state.filters.topic = getSelected(els.topic); applyFilters(); });
  els.search.addEventListener("input", ()=>{ state.filters.q = els.search.value.trim(); applyFilters(); });
  els.clear.addEventListener("click", clearFilters);
}

document.addEventListener("DOMContentLoaded", async () => {
  setTexts();
  bindEvents();
  await loadData();
});

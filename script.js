
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

// Accept multiple possible header names for each field
const COL_ALIASES = {
  ID: ["ID","Id","id"],
  Title: ["Title","Título","Titulo"],
  URL: ["URL","Link","Enlace"],
  Country: ["Country","País","Pais"],
  Region: ["Region","Región","Region/State","Provincia"],
  Speaker: ["Speaker","Presentador","Ponente","Instructor"],
  Level: ["Level","Nivel"],
  Topic: ["Topic","Tema","Category","Categoría","Categoria"],
  Language: ["Language","Idioma"],
  Description: ["Description","Descripción","Descripcion","Notes"],
  Thumbnail: ["Thumbnail","Image","Imagen","Thumb","Poster"]
};

function pick(obj, keys){
  for(const k of keys){
    if(Object.prototype.hasOwnProperty.call(obj, k) && String(obj[k]).trim()!==""){
      return String(obj[k]).trim();
    }
  }
  return "";
}

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

function uniqueValues(arr, acc){
  const s = new Set();
  arr.forEach(r => {
    const v = acc(r).trim();
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
  // ensure nothing is selected initially
  selectEl.selectedIndex = -1;
}

function getSelected(selectEl){
  return Array.from(selectEl.selectedOptions).map(o=>o.value);
}

function applyFilters(){
  const f = state.filters;
  const q = f.q.toLowerCase();
  const out = state.data.filter(row => {
    function inSel(val, arr){ return arr.length===0 || arr.includes(val); }
    const Country = row.Country;
    const Region = row.Region;
    const Speaker = row.Speaker;
    const Level   = row.Level;
    const Topic   = row.Topic;
    const text = [row.Title,row.Description,Speaker,Country,Region,Topic].join(" ").toLowerCase();
    return inSel(Country, f.country) &&
           inSel(Region, f.region) &&
           inSel(Speaker, f.speaker) &&
           inSel(Level, f.level) &&
           inSel(Topic, f.topic) &&
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
  for(const el of [els.country,els.region,els.speaker,els.level,els.topic]){
    el.selectedIndex = -1;
  }
  els.search.value = "";
  applyFilters();
}

async function loadData(){
  const res = await fetch("data.csv");
  const csvText = await res.text();

  const parsed = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: h => String(h).replace(/^\ufeff/,'').trim() // remove BOM & spaces
  });

  const rows = parsed.data.map(row => {
    // normalize columns using aliases
    const normalized = {
      ID: pick(row, COL_ALIASES.ID),
      Title: pick(row, COL_ALIASES.Title),
      URL: pick(row, COL_ALIASES.URL),
      Country: pick(row, COL_ALIASES.Country),
      Region: pick(row, COL_ALIASES.Region),
      Speaker: pick(row, COL_ALIASES.Speaker),
      Level: pick(row, COL_ALIASES.Level),
      Topic: pick(row, COL_ALIASES.Topic),
      Language: pick(row, COL_ALIASES.Language),
      Description: pick(row, COL_ALIASES.Description),
      Thumbnail: pick(row, COL_ALIASES.Thumbnail)
    };
    // collapse spaces
    for(const k in normalized){ normalized[k] = (normalized[k]||"").replace(/\s+/g," ").trim(); }
    return normalized;
  }).filter(r => r.Title || r.URL); // keep only meaningful rows

  state.data = rows;

  // Populate filter menus from full dataset
  fillMultiSelect(els.country, uniqueValues(rows, r=>r.Country||""));
  fillMultiSelect(els.region,  uniqueValues(rows, r=>r.Region||""));
  fillMultiSelect(els.speaker, uniqueValues(rows, r=>r.Speaker||""));
  fillMultiSelect(els.level,   uniqueValues(rows, r=>r.Level||""));
  fillMultiSelect(els.topic,   uniqueValues(rows, r=>r.Topic||""));

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
  els.search.addEventListener("input", ()=>{ state.filters.q = els.search.value.trim().toLowerCase(); applyFilters(); });
  els.clear.addEventListener("click", clearFilters);
}

document.addEventListener("DOMContentLoaded", async () => {
  setTexts();
  bindEvents();
  await loadData();
});

const totkData = window.AMIIBO_DATA;
const gamesData = window.GAME_AMIIBO_DATA;
const i18nData = window.I18N_DATA || {};

const state = {
  query: "",
  series: "all",
  tag: "all",
  tier: "all",
  gameId: "all",
  lang: "zh-CN"
};

const grid = document.querySelector("#amiiboGrid");
const resultCount = document.querySelector("#resultCount");
const searchInput = document.querySelector("#searchInput");
const seriesFilters = document.querySelector("#seriesFilters");
const tagFilters = document.querySelector("#tagFilters");
const dropIndex = document.querySelector("#dropIndex");
const dialog = document.querySelector("#detailDialog");
const dialogBody = document.querySelector("#dialogBody");
const gameGrid = document.querySelector("#gameGrid");
const gameDetailBar = document.querySelector("#gameDetailBar");
const gameDetailName = document.querySelector("#gameDetailName");
const gameDetailType = document.querySelector("#gameDetailType");
const gameDetailConfidence = document.querySelector("#gameDetailConfidence");
const gameDetailSource = document.querySelector("#gameDetailSource");
const currentGameInfo = document.querySelector("#currentGameInfo");
const languageSelect = document.querySelector("#languageSelect");

const defaultLang = i18nData.defaultLang || "zh-CN";
const supportedLangs = (i18nData.languages || [{ code: "zh-CN", label: "简体中文" }]).map(function(lang) { return lang.code; });

const confidenceText = {
  "zh-CN": { high: "高置信度", medium: "中置信度（待核验）", low: "低置信度（推测）" },
  "zh-TW": { high: "高可信度", medium: "中可信度（待核驗）", low: "低可信度（推測）" },
  en: { high: "High confidence", medium: "Medium confidence", low: "Low confidence" }
};

function t(key, values) {
  var pack = (i18nData.ui && (i18nData.ui[state.lang] || i18nData.ui[defaultLang])) || {};
  var fallback = (i18nData.ui && i18nData.ui[defaultLang]) || {};
  var text = pack[key] || fallback[key] || key;
  Object.keys(values || {}).forEach(function(name) {
    text = text.replace("{" + name + "}", values[name]);
  });
  return text;
}

function trTerm(value) {
  if (!value) return "";
  var terms = i18nData.terms || {};
  if (state.lang === "zh-CN") return value;
  if (state.lang === "zh-TW") return (terms["zh-TW"] && terms["zh-TW"][value]) || value;
  return (terms[state.lang] && terms[state.lang][value]) || (terms.en && terms.en[value]) || value;
}

function normalizeLang(value) {
  var lang = normalize(value).replace("_", "-");
  if (!lang) return "";
  if (i18nData.aliases && i18nData.aliases[lang]) return i18nData.aliases[lang];
  if (supportedLangs.includes(lang)) return lang;
  var primary = lang.split("-")[0];
  if (supportedLangs.includes(primary)) return primary;
  return "";
}

function getInitialLang() {
  var params = new URLSearchParams(window.location.search);
  var queryLang = normalizeLang(params.get("lang"));
  if (queryLang) return queryLang;

  var storedLang = normalizeLang(localStorage.getItem("amiibo-guide-lang"));
  if (storedLang) return storedLang;

  var browserLangs = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language];
  for (var i = 0; i < browserLangs.length; i += 1) {
    var browserLang = normalizeLang(browserLangs[i]);
    if (browserLang) return browserLang;
  }
  return defaultLang;
}

function isChineseLang() {
  return state.lang === "zh-CN" || state.lang === "zh-TW";
}

function confidenceLabel(value) {
  var pack = confidenceText[state.lang] || confidenceText.en;
  return pack[value] || "";
}

function tierLabel(tier) {
  return t(tier);
}

function gameText(game, field) {
  var localized = i18nData.games && i18nData.games[state.lang] && i18nData.games[state.lang][game.id];
  var fallback = i18nData.games && i18nData.games.en && i18nData.games.en[game.id];
  if (localized && localized[field]) return localized[field];
  if (!isChineseLang() && fallback && fallback[field]) return fallback[field];
  return game[field] || game.name || "";
}

function itemDisplayName(item) {
  return isChineseLang() ? (item.cnName || item.name) : (item.name || item.cnName);
}

function itemSeries(item) {
  if (item._gameId && gamesData && gamesData.games) {
    var game = gamesData.games.find(function(entry) { return entry.id === item._gameId; });
    if (game && !isChineseLang()) return gameText(game, "shortName");
  }
  return item.series;
}

function itemGameName(item) {
  if (!item._gameId || !gamesData || !gamesData.games) return item._gameShortName || "";
  var game = gamesData.games.find(function(entry) { return entry.id === item._gameId; });
  return game ? gameText(game, "shortName") : item._gameShortName;
}

function normalize(value) {
  return String(value || "").toLowerCase().trim();
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function buildAllAmiibos() {
  const items = [];

  totkData.amiibos.forEach(function(item) {
    items.push(Object.assign({}, item, { _gameId: "totk", _gameShortName: "王国之泪" }));
  });
  items.push(Object.assign({}, totkData.genericAmiibo, { _gameId: "totk", _gameShortName: "王国之泪" }));

  if (gamesData && gamesData.games) {
    gamesData.games.forEach(function(game) {
      if (game.id === "totk" || !game.entries) return;
      game.entries.forEach(function(entry) {
        items.push({
          id: entry.id,
          name: entry.amiiboName,
          cnName: entry.cnName,
          series: entry.amiiboSeries || game.shortName,
          era: game.id,
          character: entry.character,
          image: entry.image,
          status: entry.status || "available",
          common: entry.common || [],
          rare: entry.rare || [],
          special: entry.special || [],
          tags: entry.tags || [],
          note: entry.note || "",
          _gameId: game.id,
          _gameShortName: game.shortName,
          _confidence: entry.confidence || "medium",
          _entrySources: entry.sources || []
        });
      });
    });
  }

  return items;
}

const allAmiibos = buildAllAmiibos();

function itemText(item) {
  var terms = i18nData.terms || {};
  var langPack = terms[state.lang] || {};
  var enPack = terms.en || {};
  var tr = function(v) { return state.lang === "zh-CN" ? "" : (langPack[v] || enPack[v] || ""); };
  return [
    item.name,
    item.cnName,
    tr(item.cnName),
    item.series,
    tr(item.series),
    item.character,
    tr(item.character),
    item.note,
    tr(item.note),
    item._gameShortName,
    ...(item.common || []),
    ...(item.common || []).map(function(x){ return tr(x); }),
    ...(item.rare || []),
    ...(item.rare || []).map(function(x){ return tr(x); }),
    ...(item.special || []),
    ...(item.special || []).map(function(x){ return tr(x); }),
    ...(item.tags || []),
    ...(item.tags || []).map(function(x){ return tr(x); })
  ].join(" ");
}

function makeButton(label, value, group, activeValue) {
  var button = document.createElement("button");
  button.type = "button";
  button.className = "chip " + (value === activeValue ? "active" : "");
  button.textContent = label;
  button.dataset[group] = value;
  return button;
}

function renderGameCards() {
  if (!gamesData || !gamesData.games || !gameGrid) return;

  var html = '<button type="button" class="game-card' + (state.gameId === "all" ? " active" : "") + '" data-game="all">' +
    '<div class="game-card-cover" style="background:linear-gradient(135deg,rgba(99,208,189,0.3),rgba(216,183,95,0.2))">' +
    '<span style="font-size:32px">🎮</span></div>' +
    '<div class="game-card-info"><strong>' + t("allGames") + '</strong><small>' + allAmiibos.length + ' ' + t("items") + '</small></div></button>';

  gamesData.games.forEach(function(game) {
    var count = 0;
    if (game.id === "totk") {
      count = totkData.amiibos.length + 1;
    } else if (game.entries) {
      count = game.entries.length;
    }
    html += '<button type="button" class="game-card' + (state.gameId === game.id ? " active" : "") + '" data-game="' + game.id + '">' +
      '<div class="game-card-cover"><img src="' + game.cover + '" alt="' + gameText(game, "cnName") + '"></div>' +
      '<div class="game-card-info"><strong>' + gameText(game, "shortName") + '</strong><small>' + count + ' ' + t("items") + '</small></div></button>';
  });

  gameGrid.innerHTML = html;
}

function updateGameDetailBar() {
  if (state.gameId === "all") {
    gameDetailBar.style.display = "none";
    return;
  }

  var game = gamesData.games.find(function(g) { return g.id === state.gameId; });
  if (!game) return;

  gameDetailBar.style.display = "";
  gameDetailName.textContent = gameText(game, "cnName");
  gameDetailType.textContent = trTerm(gameText(game, "supportType")) || "";
  gameDetailConfidence.textContent = confidenceLabel(game.confidence);

  if (game.sources && game.sources.length > 0) {
    gameDetailSource.style.display = "";
    gameDetailSource.href = game.sources[0].url;
    gameDetailSource.textContent = t("source") + ": " + game.sources[0].name;
  } else {
    gameDetailSource.style.display = "none";
  }
}

function renderFilters() {
  var visible = allAmiibos.filter(function(item) {
    return state.gameId === "all" || item._gameId === state.gameId;
  });

  var series = unique(visible.map(function(item) { return item.series; }));
  seriesFilters.replaceChildren(
    makeButton(t("all"), "all", "series", state.series),
    series.map(function(name) { return makeButton(trTerm(name), name, "series", state.series); }).reduce(function(frag, btn) { frag.appendChild(btn); return frag; }, document.createDocumentFragment())
  );

  var tags = unique(visible.flatMap(function(item) { return item.tags || []; }));
  tagFilters.replaceChildren(
    makeButton(t("all"), "all", "tag", state.tag),
    tags.map(function(tag) { return makeButton(trTerm(tag), tag, "tag", state.tag); }).reduce(function(frag, btn) { frag.appendChild(btn); return frag; }, document.createDocumentFragment())
  );
}

function itemMatches(item) {
  if (state.gameId !== "all" && item._gameId !== state.gameId) return false;

  var query = normalize(state.query);
  var matchQuery = !query || normalize(itemText(item)).includes(query);
  var matchSeries = state.series === "all" || item.series === state.series;
  var matchTag = state.tag === "all" || (item.tags || []).includes(state.tag);
  var matchTier = state.tier === "all" || (item[state.tier] || []).length > 0;
  return matchQuery && matchSeries && matchTag && matchTier;
}

function renderTier(label, items, type) {
  if (!items || !items.length) return "";
  return '<div class="tier-row">' +
    '<span class="tier-label">' + label + '</span>' +
    '<div class="pill-list">' +
    items.map(function(name) {
      return '<span class="pill ' + type + '"><img src="assets/images/ui/drop-placeholder.svg" alt="" loading="lazy">' + trTerm(name) + '</span>';
    }).join("") +
    '</div></div>';
}

function cardTemplate(item) {
  var statusLabel = item.status === "future" ? t("future") : t("available");
  var confLabel = "";
  if (item._gameId !== "totk" && item._confidence && item._confidence !== "high") {
    confLabel = '<span class="confidence-badge ' + item._confidence + '">' + confidenceLabel(item._confidence) + '</span>';
  }
  var displayName = itemDisplayName(item);
  var seriesName = itemSeries(item);
  var gameName = itemGameName(item);
  return '<article class="amiibo-card">' +
    '<div class="amiibo-art">' +
    '<img src="' + item.image + '" data-fallback="' + (item.sourceImage || "") + '" alt="' + displayName + ' amiibo" loading="lazy">' +
    '</div>' +
    '<div class="amiibo-body">' +
    '<div class="card-top">' +
    '<div><h3>' + displayName + '</h3>' +
    '<p>' + item.name + ' · ' + trTerm(seriesName) + (gameName ? ' · ' + gameName : '') + '</p></div>' +
    '<span class="status ' + (item.status === "future" ? "future" : "") + '">' + statusLabel + '</span>' +
    '</div>' +
    confLabel +
    '<div class="tier-list">' +
    renderTier(tierLabel("special"), item.special, "special") +
    renderTier(tierLabel("rare"), item.rare, "rare") +
    renderTier(tierLabel("common"), item.common, "common") +
    '</div>' +
    '<div class="tag-line">' + (item.tags || []).map(function(tag) { return '<span class="tag">#' + trTerm(tag) + '</span>'; }).join("") + '</div>' +
    '<button class="detail-button" type="button" data-detail="' + item.id + '">' + t("details") + '</button>' +
    '</div></article>';
}

function renderCards() {
  var results = allAmiibos.filter(itemMatches);
  resultCount.textContent = t("showing", { shown: results.length, total: allAmiibos.length });
  grid.innerHTML = results.map(cardTemplate).join("");
  grid.querySelectorAll("img").forEach(function(img) {
    img.addEventListener("error", function() {
      var fallback = img.dataset.fallback;
      if (fallback && img.src !== fallback) {
        img.src = fallback;
      } else {
        img.src = "assets/images/ui/amiibo-placeholder.svg";
      }
    });
  });
}

function renderDropIndex() {
  var visible = allAmiibos.filter(function(item) {
    return state.gameId === "all" || item._gameId === state.gameId;
  });
  var drops = unique(visible.flatMap(function(item) {
    return (item.special || []).concat(item.rare || []).concat(item.common || []);
  })).sort(function(a, b) { return a.localeCompare(b, "zh-CN"); });

  dropIndex.innerHTML = drops.map(function(drop) {
    return '<button class="drop-button" type="button" data-drop="' + drop + '">' + trTerm(drop) + '</button>';
  }).join("");
}

function renderSources() {
  document.querySelector("#updatedAt").textContent = "2026-05-15";
  document.querySelector("#sourceCopy").innerHTML = t("sourceCopy", { date: '<span id="updatedAt">2026-05-15</span>' });

  var allSources = totkData.sources.slice();
  if (gamesData && gamesData.games) {
    gamesData.games.forEach(function(game) {
      if (game.sources) {
        game.sources.forEach(function(s) {
          if (!allSources.find(function(x) { return x.url === s.url; })) {
            allSources.push(s);
          }
        });
      }
    });
  }

  document.querySelector("#sourceList").innerHTML = allSources
    .map(function(source) {
      return '<li><a href="' + source.url + '" target="_blank" rel="noreferrer">' + source.name + '</a></li>';
    }).join("");
}

function renderStats() {
  var specialCount = unique(allAmiibos.flatMap(function(item) { return item.special || []; })).length;
  document.querySelector("#statTotal").textContent = allAmiibos.length;
  document.querySelector("#statSpecial").textContent = specialCount;
}

function openDetail(id) {
  var item = allAmiibos.find(function(entry) { return entry.id === id; });
  if (!item) return;

  var confInfo = "";
  if (item._gameId !== "totk" && item._confidence) {
    confInfo = '<p class="eyebrow">' + confidenceLabel(item._confidence) + '</p>';
  }
  var displayName = itemDisplayName(item);
  var seriesName = itemSeries(item);
  var gameName = itemGameName(item);

  dialogBody.innerHTML = '<div class="dialog-layout">' +
    '<img src="' + item.image + '" alt="' + displayName + ' amiibo">' +
    '<div>' +
    '<p class="eyebrow">' + trTerm(seriesName) + (gameName ? ' · ' + gameName : '') + '</p>' +
    '<h2>' + displayName + '</h2>' +
    '<p>' + item.name + ' · ' + item.character + '</p>' +
    confInfo +
    '<div class="tier-list">' +
    renderTier(tierLabel("special"), item.special, "special") +
    renderTier(tierLabel("rare"), item.rare, "rare") +
    renderTier(tierLabel("common"), item.common, "common") +
    '</div>' +
    '<p>' + trTerm(item.note || "") + '</p>' +
    '<div class="tag-line">' + (item.tags || []).map(function(tag) { return '<span class="tag">#' + trTerm(tag) + '</span>'; }).join("") + '</div>' +
    '</div></div>';

  var img = dialogBody.querySelector("img");
  img.addEventListener("error", function() {
    img.src = item.sourceImage || "assets/images/ui/amiibo-placeholder.svg";
  });
  dialog.showModal();
}

function applyAndRender() {
  renderFilters();
  renderGameCards();
  updateGameDetailBar();
  renderCards();
  renderDropIndex();
  renderStats();
}

function setupLanguageSelect() {
  if (!languageSelect) return;
  languageSelect.innerHTML = (i18nData.languages || []).map(function(lang) {
    return '<option value="' + lang.code + '">' + lang.label + '</option>';
  }).join("");
  languageSelect.value = state.lang;
}

function updateUrlLang(lang) {
  var url = new URL(window.location.href);
  url.searchParams.set("lang", lang);
  window.history.replaceState({}, "", url.pathname + url.search + url.hash);
}

function updateSeo() {
  var seoPack = (i18nData.seo && (i18nData.seo[state.lang] || i18nData.seo[defaultLang])) || {};
  document.documentElement.lang = state.lang;
  if (seoPack.title) document.title = seoPack.title;

  var description = document.querySelector('meta[name="description"]');
  var keywords = document.querySelector('meta[name="keywords"]');
  var ogTitle = document.querySelector('meta[property="og:title"]');
  var ogDescription = document.querySelector('meta[property="og:description"]');
  var twitterTitle = document.querySelector('meta[name="twitter:title"]');
  var twitterDescription = document.querySelector('meta[name="twitter:description"]');

  if (description && seoPack.description) description.content = seoPack.description;
  if (keywords && seoPack.keywords) keywords.content = seoPack.keywords;
  if (ogTitle && seoPack.title) ogTitle.content = seoPack.title;
  if (ogDescription && seoPack.description) ogDescription.content = seoPack.description;
  if (twitterTitle && seoPack.title) twitterTitle.content = seoPack.title;
  if (twitterDescription && seoPack.description) twitterDescription.content = seoPack.description;

  document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(function(link) { link.remove(); });
  (i18nData.languages || []).forEach(function(lang) {
    var link = document.createElement("link");
    link.rel = "alternate";
    link.hreflang = lang.code;
    link.href = "https://amiibo-guide.pages.dev/?lang=" + encodeURIComponent(lang.code);
    document.head.appendChild(link);
  });
}

function applyStaticText() {
  document.querySelectorAll("[data-i18n]").forEach(function(node) {
    node.textContent = t(node.dataset.i18n);
  });
  searchInput.placeholder = t("searchPlaceholder");
  document.querySelector("#closeDialog").setAttribute("aria-label", t("closeDetail"));
  currentGameInfo.textContent = state.gameId === "all" ? t("currentHint") : t("current", { game: itemGameName({ _gameId: state.gameId }) });
}

function applyLanguage(lang, options) {
  state.lang = normalizeLang(lang) || defaultLang;
  if (languageSelect) languageSelect.value = state.lang;
  updateSeo();
  applyStaticText();
  renderSources();
  applyAndRender();
  if (!options || options.persist !== false) {
    localStorage.setItem("amiibo-guide-lang", state.lang);
    updateUrlLang(state.lang);
  }
}

document.addEventListener("click", function(event) {
  var gameButton = event.target.closest("[data-game]");
  var seriesButton = event.target.closest("[data-series]");
  var tagButton = event.target.closest("[data-tag]");
  var tierButton = event.target.closest("[data-tier]");
  var detailButton = event.target.closest("[data-detail]");
  var dropButton = event.target.closest("[data-drop]");
  var quickButton = event.target.closest("[data-quick]");

  if (gameButton) {
    state.gameId = gameButton.dataset.game;
    state.series = "all";
    state.tag = "all";
    state.tier = "all";
    searchInput.value = "";
    state.query = "";
    document.querySelectorAll("[data-tier]").forEach(function(b) { b.classList.remove("active"); });

    document.querySelectorAll(".game-card").forEach(function(card) {
      card.classList.toggle("active", card.dataset.game === state.gameId);
    });

    updateGameDetailBar();
    if (state.gameId !== "all") {
      currentGameInfo.textContent = t("current", { game: (gameButton.querySelector("strong") ? gameButton.querySelector("strong").textContent : t("allGames")) });
    } else {
      currentGameInfo.textContent = t("currentHint");
    }

    applyAndRender();
  }

  if (seriesButton) {
    state.series = seriesButton.dataset.series;
    applyAndRender();
  }

  if (tagButton) {
    state.tag = tagButton.dataset.tag;
    applyAndRender();
  }

  if (tierButton) {
    var nextTier = tierButton.dataset.tier;
    state.tier = state.tier === nextTier ? "all" : nextTier;
    document.querySelectorAll("[data-tier]").forEach(function(button) {
      button.classList.toggle("active", button.dataset.tier === state.tier);
    });
    renderCards();
  }

  if (detailButton) {
    openDetail(detailButton.dataset.detail);
  }

  if (dropButton) {
    state.query = dropButton.dataset.drop;
    searchInput.value = state.query;
    applyAndRender();
    document.querySelector("#finder").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (quickButton) {
    state.query = quickButton.dataset.quick;
    searchInput.value = state.query;
    applyAndRender();
    document.querySelector("#finder").scrollIntoView({ behavior: "smooth", block: "start" });
  }
});

searchInput.addEventListener("input", function(event) {
  state.query = event.target.value;
  renderCards();
});

document.querySelector("#resetFilters").addEventListener("click", function() {
  state.query = "";
  state.series = "all";
  state.tag = "all";
  state.tier = "all";
  state.gameId = "all";
  searchInput.value = "";
  document.querySelectorAll("[data-tier]").forEach(function(button) { button.classList.remove("active"); });
  document.querySelectorAll(".game-card").forEach(function(card) {
    card.classList.toggle("active", card.dataset.game === "all");
  });
  gameDetailBar.style.display = "none";
  currentGameInfo.textContent = t("currentHint");
  applyAndRender();
});

document.querySelector("#closeDialog").addEventListener("click", function() { dialog.close(); });

if (languageSelect) {
  languageSelect.addEventListener("change", function(event) {
    applyLanguage(event.target.value);
  });
}

state.lang = getInitialLang();
setupLanguageSelect();
applyStaticText();
updateSeo();
renderGameCards();
updateGameDetailBar();
renderStats();
renderFilters();
renderCards();
renderDropIndex();
renderSources();

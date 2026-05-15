const totkData = window.AMIIBO_DATA;
const gamesData = window.GAME_AMIIBO_DATA;

const state = {
  query: "",
  series: "all",
  tag: "all",
  tier: "all",
  gameId: "all"
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

const tierMap = {
  special: "特殊",
  rare: "稀有",
  common: "常见"
};

const confidenceMap = {
  high: "高置信度",
  medium: "中置信度（待核验）",
  low: "低置信度（推测）"
};

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
  return [
    item.name,
    item.cnName,
    item.series,
    item.character,
    item.note,
    item._gameShortName,
    ...(item.common || []),
    ...(item.rare || []),
    ...(item.special || []),
    ...(item.tags || [])
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
    '<div class="game-card-info"><strong>全部游戏</strong><small>' + allAmiibos.length + ' 条</small></div></button>';

  gamesData.games.forEach(function(game) {
    var count = 0;
    if (game.id === "totk") {
      count = totkData.amiibos.length + 1;
    } else if (game.entries) {
      count = game.entries.length;
    }
    html += '<button type="button" class="game-card' + (state.gameId === game.id ? " active" : "") + '" data-game="' + game.id + '">' +
      '<div class="game-card-cover"><img src="' + game.cover + '" alt="' + game.cnName + '"></div>' +
      '<div class="game-card-info"><strong>' + game.shortName + '</strong><small>' + count + ' 条</small></div></button>';
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
  gameDetailName.textContent = game.cnName;
  gameDetailType.textContent = game.supportType || "";
  gameDetailConfidence.textContent = confidenceMap[game.confidence] || "";

  if (game.sources && game.sources.length > 0) {
    gameDetailSource.style.display = "";
    gameDetailSource.href = game.sources[0].url;
    gameDetailSource.textContent = "来源: " + game.sources[0].name;
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
    makeButton("全部", "all", "series", state.series),
    series.map(function(name) { return makeButton(name, name, "series", state.series); }).reduce(function(frag, btn) { frag.appendChild(btn); return frag; }, document.createDocumentFragment())
  );

  var tags = unique(visible.flatMap(function(item) { return item.tags || []; }));
  tagFilters.replaceChildren(
    makeButton("全部", "all", "tag", state.tag),
    tags.map(function(tag) { return makeButton(tag, tag, "tag", state.tag); }).reduce(function(frag, btn) { frag.appendChild(btn); return frag; }, document.createDocumentFragment())
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
      return '<span class="pill ' + type + '"><img src="assets/images/ui/drop-placeholder.svg" alt="" loading="lazy">' + name + '</span>';
    }).join("") +
    '</div></div>';
}

function cardTemplate(item) {
  var statusLabel = item.status === "future" ? "待确认" : "可用";
  var confLabel = "";
  if (item._gameId !== "totk" && item._confidence && item._confidence !== "high") {
    confLabel = '<span class="confidence-badge ' + item._confidence + '">' + confidenceMap[item._confidence] + '</span>';
  }
  return '<article class="amiibo-card">' +
    '<div class="amiibo-art">' +
    '<img src="' + item.image + '" data-fallback="' + (item.sourceImage || "") + '" alt="' + (item.cnName || item.name) + ' amiibo 图片" loading="lazy">' +
    '</div>' +
    '<div class="amiibo-body">' +
    '<div class="card-top">' +
    '<div><h3>' + (item.cnName || item.name) + '</h3>' +
    '<p>' + item.name + ' · ' + item.series + (item._gameShortName ? ' · ' + item._gameShortName : '') + '</p></div>' +
    '<span class="status ' + (item.status === "future" ? "future" : "") + '">' + statusLabel + '</span>' +
    '</div>' +
    confLabel +
    '<div class="tier-list">' +
    renderTier("特殊", item.special, "special") +
    renderTier("稀有", item.rare, "rare") +
    renderTier("常见", item.common, "common") +
    '</div>' +
    '<div class="tag-line">' + (item.tags || []).map(function(tag) { return '<span class="tag">#' + tag + '</span>'; }).join("") + '</div>' +
    '<button class="detail-button" type="button" data-detail="' + item.id + '">查看详情</button>' +
    '</div></article>';
}

function renderCards() {
  var results = allAmiibos.filter(itemMatches);
  resultCount.textContent = "显示 " + results.length + " / " + allAmiibos.length + " 条";
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
    return '<button class="drop-button" type="button" data-drop="' + drop + '">' + drop + '</button>';
  }).join("");
}

function renderSources() {
  document.querySelector("#updatedAt").textContent = "2026-05-15";

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
    confInfo = '<p class="eyebrow">' + confidenceMap[item._confidence] + '</p>';
  }

  dialogBody.innerHTML = '<div class="dialog-layout">' +
    '<img src="' + item.image + '" alt="' + (item.cnName || item.name) + ' amiibo 图片">' +
    '<div>' +
    '<p class="eyebrow">' + item.series + (item._gameShortName ? ' · ' + item._gameShortName : '') + '</p>' +
    '<h2>' + (item.cnName || item.name) + '</h2>' +
    '<p>' + item.name + ' · ' + item.character + '</p>' +
    confInfo +
    '<div class="tier-list">' +
    renderTier("特殊掉落", item.special, "special") +
    renderTier("稀有掉落", item.rare, "rare") +
    renderTier("常见掉落", item.common, "common") +
    '</div>' +
    '<p>' + (item.note || "") + '</p>' +
    '<div class="tag-line">' + (item.tags || []).map(function(tag) { return '<span class="tag">#' + tag + '</span>'; }).join("") + '</div>' +
    '</div></div>';

  var img = dialogBody.querySelector("img");
  img.addEventListener("error", function() {
    img.src = item.sourceImage || "assets/images/ui/amiibo-placeholder.svg";
  });
  dialog.showModal();
}

function applyAndRender() {
  renderFilters();
  renderCards();
  renderDropIndex();
  renderStats();
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
      currentGameInfo.textContent = "当前：" + (gameButton.querySelector("strong") ? gameButton.querySelector("strong").textContent : "全部");
    } else {
      currentGameInfo.textContent = "点击游戏卡片切换当前游戏";
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
  currentGameInfo.textContent = "点击游戏卡片切换当前游戏";
  applyAndRender();
});

document.querySelector("#closeDialog").addEventListener("click", function() { dialog.close(); });

document.querySelector(".lang-switch").addEventListener("click", function() {
  alert("语言切换功能已预留：当前第一版为中文，后续可接入英文数据。");
});

renderGameCards();
updateGameDetailBar();
renderStats();
renderFilters();
renderCards();
renderDropIndex();
renderSources();

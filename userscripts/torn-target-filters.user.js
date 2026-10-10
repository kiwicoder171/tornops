// ==UserScript==
// @name         Torn Faction War Target Filters & Quick-Attack
// @namespace    https://github.com/torn-faction-suite/userscripts
// @version      1.0.0
// @description  Instant-value filter panel for Torn Ranked Wars: filters hospital/traveling targets and highlights optimal targets.
// @author       Torn Faction Suite
// @match        https://www.torn.com/factions.php*
// @match        https://www.torn.com/page.php?sid=attack*
// @grant        GM_setValue

// @grant        GM_getValue
// @run-at       document-idle
// ==/UserScript==

(function () {
  "use strict";

  const STORAGE_KEY = "TORN_TARGET_FILTERS_CONFIG";
  const config = GM_getValue(STORAGE_KEY, {
    hideHospital: true,
    hideTraveling: true,
    hideHighLevel: false,
    maxLevel: 75,
  });

  function saveConfig() {
    GM_setValue(STORAGE_KEY, config);
    applyFilters();
  }

  // Build Floating UI Panel
  function injectFilterHUD() {
    if (document.getElementById("tfs-target-hud")) return;

    const hud = document.createElement("div");
    hud.id = "tfs-target-hud";
    hud.style.position = "fixed";
    hud.style.bottom = "20px";
    hud.style.right = "20px";
    hud.style.zIndex = "999999";
    hud.style.background = "#1e293b";
    hud.style.color = "#f8fafc";
    hud.style.padding = "12px 16px";
    hud.style.borderRadius = "8px";
    hud.style.border = "1px solid #334155";
    hud.style.boxShadow = "0 8px 24px rgba(0,0,0,0.5)";
    hud.style.fontSize = "13px";
    hud.style.fontFamily = "sans-serif";
    hud.style.width = "220px";

    hud.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; border-bottom:1px solid #334155; padding-bottom:6px;">
        <strong style="color:#38bdf8;">🎯 War Target Filters</strong>
        <span id="tfs-toggle-btn" style="cursor:pointer; font-size:11px; color:#94a3b8;">[Hide]</span>
      </div>
      <div id="tfs-hud-body">
        <label style="display:flex; align-items:center; gap:6px; margin-bottom:6px; cursor:pointer;">
          <input type="checkbox" id="tfs-hide-hosp" ${config.hideHospital ? "checked" : ""}>
          <span>Hide Hospital</span>
        </label>
        <label style="display:flex; align-items:center; gap:6px; margin-bottom:6px; cursor:pointer;">
          <input type="checkbox" id="tfs-hide-travel" ${config.hideTraveling ? "checked" : ""}>
          <span>Hide Traveling</span>
        </label>
        <label style="display:flex; align-items:center; gap:6px; margin-bottom:6px; cursor:pointer;">
          <input type="checkbox" id="tfs-hide-level" ${config.hideHighLevel ? "checked" : ""}>
          <span>Max Level:</span>
          <input type="number" id="tfs-max-level" value="${config.maxLevel}" style="width:45px; background:#0f172a; border:1px solid #475569; color:#fff; padding:2px; border-radius:4px;">
        </label>
        <div style="margin-top:10px; font-size:11px; color:#64748b; text-align:center;">
          Torn Faction Suite
        </div>
      </div>
    `;

    document.body.appendChild(hud);

    document.getElementById("tfs-hide-hosp").addEventListener("change", (e) => {
      config.hideHospital = e.target.checked;
      saveConfig();
    });

    document.getElementById("tfs-hide-travel").addEventListener("change", (e) => {
      config.hideTraveling = e.target.checked;
      saveConfig();
    });

    document.getElementById("tfs-hide-level").addEventListener("change", (e) => {
      config.hideHighLevel = e.target.checked;
      saveConfig();
    });

    document.getElementById("tfs-max-level").addEventListener("change", (e) => {
      config.maxLevel = parseInt(e.target.value, 10) || 100;
      saveConfig();
    });

    document.getElementById("tfs-toggle-btn").addEventListener("click", () => {
      const body = document.getElementById("tfs-hud-body");
      if (body.style.display === "none") {
        body.style.display = "block";
        document.getElementById("tfs-toggle-btn").innerText = "[Hide]";
      } else {
        body.style.display = "none";
        document.getElementById("tfs-toggle-btn").innerText = "[Show]";
      }
    });
  }

  // Filter enemy war list member rows
  function applyFilters() {
    const memberRows = document.querySelectorAll(".members-list li, .faction-war-list li");
    memberRows.forEach((row) => {
      let shouldHide = false;
      const text = row.innerText.toLowerCase();

      if (config.hideHospital && (text.includes("hospital") || text.includes("in hospital"))) {
        shouldHide = true;
      }

      if (config.hideTraveling && (text.includes("traveling") || text.includes("abroad") || text.includes("in flight"))) {
        shouldHide = true;
      }

      if (config.hideHighLevel) {
        const levelMatch = text.match(/lvl\s*(\d+)|level\s*(\d+)/i);
        if (levelMatch) {
          const lvl = parseInt(levelMatch[1] || levelMatch[2], 10);
          if (lvl > config.maxLevel) shouldHide = true;
        }
      }

      row.style.display = shouldHide ? "none" : "";
    });
  }

  // Periodic check and DOM observer
  setInterval(() => {
    if (window.location.href.includes("factions.php")) {
      injectFilterHUD();
      applyFilters();
    }
  }, 1500);
})();

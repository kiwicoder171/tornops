// ==UserScript==
// @name         Torn Faction Armory Restock Warning
// @namespace    https://github.com/torn-faction-suite/userscripts
// @version      1.0.0
// @description  Warns faction leaders and members when medical supplies (Morphine, FAKs, Blood Bags) in armory fall below safety thresholds.
// @author       Torn Faction Suite
// @match        https://www.torn.com/factions.php*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  "use strict";

  const THRESHOLDS = {
    morphine: 50,
    firstAidKit: 50,
    smallFirstAidKit: 30,
    bloodBag: 40,
  };

  function checkArmoryStock() {
    const armoryList = document.querySelector(".armory-items-list, .items-list");
    if (!armoryList) return;

    const warnings = [];
    const itemRows = armoryList.querySelectorAll("li, .item-row");

    itemRows.forEach((row) => {
      const text = row.innerText.toLowerCase();
      const countMatch = text.match(/x\s*(\d+)|qty:\s*(\d+)|\((\d+)\)/);
      const count = countMatch ? parseInt(countMatch[1] || countMatch[2] || countMatch[3], 10) : null;

      if (count !== null) {
        if (text.includes("morphine") && count < THRESHOLDS.morphine) {
          warnings.push(`Morphine: ${count} left (Threshold: ${THRESHOLDS.morphine})`);
        } else if (text.includes("first aid kit") && !text.includes("small") && count < THRESHOLDS.firstAidKit) {
          warnings.push(`First Aid Kit: ${count} left (Threshold: ${THRESHOLDS.firstAidKit})`);
        } else if (text.includes("blood bag") && count < THRESHOLDS.bloodBag) {
          warnings.push(`Blood Bags: ${count} left (Threshold: ${THRESHOLDS.bloodBag})`);
        }
      }
    });

    if (warnings.length > 0) {
      renderWarningBanner(warnings);
    }
  }

  function renderWarningBanner(warnings) {
    if (document.getElementById("tfs-armory-warning")) return;

    const banner = document.createElement("div");
    banner.id = "tfs-armory-warning";
    banner.style.margin = "10px 0";
    banner.style.padding = "12px 16px";
    banner.style.background = "#7f1d1d";
    banner.style.border = "1px solid #ef4444";
    banner.style.borderRadius = "6px";
    banner.style.color = "#fee2e2";
    banner.style.fontFamily = "sans-serif";
    banner.style.fontSize = "13px";

    banner.innerHTML = `
      <div style="font-weight:bold; margin-bottom:4px; display:flex; align-items:center; gap:6px;">
        ⚠️ LOW ARMORY RESERVES DETECTED
      </div>
      <ul style="margin:0; padding-left:20px;">
        ${warnings.map((w) => `<li>${w}</li>`).join("")}
      </ul>
    `;

    const container = document.querySelector(".content-wrapper, .faction-main-wrap") || document.body;
    container.insertBefore(banner, container.firstChild);
  }

  setInterval(checkArmoryStock, 3000);
})();

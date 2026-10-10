// ==UserScript==
// @name         Torn Energy & Travel Desktop Notifier
// @namespace    https://github.com/torn-faction-suite/userscripts
// @version      1.0.0
// @description  Dispatches browser desktop notifications when your energy hits 100/150 or when you land abroad.
// @author       Torn Faction Suite
// @match        https://www.torn.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  "use strict";

  let lastNotifiedEnergy = 0;
  let hasNotifiedLanding = false;

  // Request browser notification permissions
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }

  function sendDesktopNotification(title, body) {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: "https://www.torn.com/favicon.ico",
      });
    }
  }

  function checkStatus() {
    // Check Energy Bar
    const energyBar = document.querySelector("#barEnergy .bar-value, [aria-label*='Energy']");
    if (energyBar) {
      const match = energyBar.innerText.match(/(\d+)\s*\/\s*(\d+)/);
      if (match) {
        const currentEnergy = parseInt(match[1], 10);
        const maxEnergy = parseInt(match[2], 10);

        if (currentEnergy >= maxEnergy && lastNotifiedEnergy < maxEnergy) {
          sendDesktopNotification(
            "⚡ Full Energy Reached!",
            `Your energy has hit ${currentEnergy}/${maxEnergy}. Train or attack now to prevent energy waste.`
          );
          lastNotifiedEnergy = currentEnergy;
        } else if (currentEnergy < maxEnergy) {
          lastNotifiedEnergy = currentEnergy;
        }
      }
    }

    // Check Travel Status
    const travelContainer = document.querySelector(".travel-home, .travel-abroad, [class*='travel']");
    if (travelContainer) {
      const text = travelContainer.innerText.toLowerCase();
      if ((text.includes("landed") || text.includes("arrived")) && !hasNotifiedLanding) {
        sendDesktopNotification(
          "✈️ Flight Arrived!",
          "You have touched down at your destination. Purchase items quickly before flight muggers arrive."
        );
        hasNotifiedLanding = true;
      } else if (text.includes("traveling") || text.includes("flying")) {
        hasNotifiedLanding = false;
      }
    }
  }

  setInterval(checkStatus, 5000);
})();

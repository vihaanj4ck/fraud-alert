(function () {
  const scanBtn = document.getElementById("scanBtn");
  const urlDisplay = document.getElementById("urlDisplay");
  const scoreSection = document.getElementById("scoreSection");
  const loading = document.getElementById("loading");
  const scoreValue = document.getElementById("scoreValue");
  const scoreStatus = document.getElementById("scoreStatus");
  const progressCircle = document.getElementById("progressCircle");

  const circumference = 2 * Math.PI * 54; // r=54

  function setProgress(percent, status, reasons) {
    const clamped = Math.min(100, Math.max(0, percent));
    const offset = circumference - (clamped / 100) * circumference;
    progressCircle.style.strokeDashoffset = offset;

    progressCircle.classList.remove("safe", "warning", "danger");
    if (clamped > 80) progressCircle.classList.add("safe");
    else if (clamped >= 50) progressCircle.classList.add("warning");
    else progressCircle.classList.add("danger");

    const card = document.querySelector(".glass-card");
    card.classList.remove("theme-danger", "theme-suspicious", "theme-secure");
    if (clamped < 50) card.classList.add("theme-danger");
    else if (clamped <= 80) card.classList.add("theme-suspicious");
    else card.classList.add("theme-secure");

    scoreValue.textContent = Math.round(clamped);
    scoreStatus.textContent = status || getStatusText(clamped);

    const listEl = document.getElementById("detectionDetailsList");
    listEl.innerHTML = "";
    const items = Array.isArray(reasons) ? reasons : [];
    if (items.length === 0) {
      listEl.appendChild(
        Object.assign(document.createElement("li"), {
          className: "detection-details-item none",
          textContent: "No issues detected",
        })
      );
    } else {
      items.forEach((r) => {
        listEl.appendChild(
          Object.assign(document.createElement("li"), {
            className: "detection-details-item",
            textContent: r,
          })
        );
      });
    }
  }

  function getStatusText(percent) {
    if (percent > 80) return "SECURE";
    if (percent >= 50) return "SUSPICIOUS";
    return "DANGEROUS";
  }

  function showUrl(url) {
    const span = urlDisplay.querySelector(".url-text") || document.createElement("span");
    span.className = "url-text";
    span.textContent = url || "No site loaded";
    urlDisplay.innerHTML = "";
    urlDisplay.appendChild(span);
  }

  scanBtn.addEventListener("click", async () => {
    try {
      scanBtn.disabled = true;
      loading.classList.add("visible");
      scoreSection.classList.remove("visible");

      const response = await chrome.runtime.sendMessage({ action: "scanUrl" });

      loading.classList.remove("visible");
      scoreSection.classList.add("visible");

      if (response.success) {
        showUrl(response.url);
        const data = response.data;
        setProgress(
          data.safetyPercentage ?? data.safety ?? 0,
          data.message,
          data.findings ?? data.reasons
        );
      } else {
        setProgress(0, response.error || "Scan failed", [
          response.error || "Scan failed",
        ]);
      }
    } catch (err) {
      loading.classList.remove("visible");
      scoreSection.classList.add("visible");
      setProgress(0, err.message || "Scan failed", [
        err.message || "Scan failed",
      ]);
    } finally {
      scanBtn.disabled = false;
    }
  });

  // Load current URL on open
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    showUrl(tabs[0]?.url || null);
  });
})();

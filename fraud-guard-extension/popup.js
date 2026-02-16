// Fetch is in background.js – set API_BASE_URL there to your production Vercel URL with https://
// e.g. https://your-app.vercel.app (API path /api/scan-url is appended there)
// API returns: { safetyScore, safetyPercentage, message, reasoning, isSecureProtocol }
const API_BASE_URL = "https://your-app.vercel.app";

(function () {
  const scanBtn = document.getElementById("scanBtn");
  const urlDisplay = document.getElementById("urlDisplay");
  const scoreSection = document.getElementById("scoreSection");
  const loading = document.getElementById("loading");
  const scoreValue = document.getElementById("scoreValue");
  const scoreStatus = document.getElementById("scoreStatus");
  const progressCircle = document.getElementById("progressCircle");
  const protocolStatus = document.getElementById("protocolStatus");
  const protocolIcon = document.getElementById("protocolIcon");
  const protocolLabel = document.getElementById("protocolLabel");

  const circumference = 2 * Math.PI * 54;

  function getScoreColor(percent) {
    if (percent >= 70) return { stroke: "#22c55e", text: "#22c55e" };
    if (percent >= 40) return { stroke: "#eab308", text: "#eab308" };
    return { stroke: "#ef4444", text: "#ef4444" };
  }

  function setProtocolStatus(isSecureProtocol) {
    if (!protocolStatus || !protocolIcon || !protocolLabel) return;
    if (isSecureProtocol === undefined) {
      protocolStatus.classList.remove("visible", "secure", "insecure");
      protocolStatus.setAttribute("aria-hidden", "true");
      return;
    }
    protocolStatus.setAttribute("aria-hidden", "false");
    protocolStatus.classList.add("visible");
    protocolStatus.classList.remove("secure", "insecure");
    if (isSecureProtocol) {
      protocolStatus.classList.add("secure");
      protocolIcon.textContent = "\uD83D\uDD12";
      protocolIcon.setAttribute("title", "Secure (HTTPS)");
      protocolLabel.textContent = "Secure (HTTPS)";
    } else {
      protocolStatus.classList.add("insecure");
      protocolIcon.textContent = "\uD83D\uDD13";
      protocolIcon.setAttribute("title", "Insecure (HTTP)");
      protocolLabel.textContent = "Insecure (HTTP)";
    }
  }

  function setProgress(percent, status, reasons, isSecureProtocol) {
    const clamped = Math.min(100, Math.max(0, percent));
    const offset = circumference - (clamped / 100) * circumference;
    progressCircle.style.strokeDashoffset = offset;

    const colors = getScoreColor(clamped);
    progressCircle.style.stroke = colors.stroke;

    const card = document.querySelector(".glass-card");
    card.classList.remove("theme-danger", "theme-suspicious", "theme-secure");
    if (clamped < 40) card.classList.add("theme-danger");
    else if (clamped < 70) card.classList.add("theme-suspicious");
    else card.classList.add("theme-secure");

    scoreValue.textContent = Math.round(clamped);
    scoreValue.style.color = colors.text;
    scoreStatus.textContent = status || getStatusText(clamped);

    setProtocolStatus(isSecureProtocol);

    const listEl = document.getElementById("detectionDetailsList");
    if (listEl) {
      listEl.innerHTML = "";
      const items = Array.isArray(reasons) ? reasons : [];
      items.forEach((r) => {
        listEl.appendChild(
          Object.assign(document.createElement("li"), {
            className: "detection-details-item",
            textContent: String(r),
          })
        );
      });
    }
  }

  function getStatusText(percent) {
    if (percent >= 70) return "SECURE";
    if (percent >= 40) return "SUSPICIOUS";
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

      // Clear AI Insights immediately so old "No Insight" messages never persist
      const listEl = document.getElementById("detectionDetailsList");
      if (listEl) listEl.innerHTML = "";

      const response = await chrome.runtime.sendMessage({ action: "scanUrl" });

      loading.classList.remove("visible");
      scoreSection.classList.add("visible");

      if (response && response.success) {
        showUrl(response.url);
        const data = response.data || {};
        const raw =
          data.safetyScore ?? data.safetyPercentage ?? data.safety ?? 0;
        const score = Math.min(
          100,
          Math.max(0, Number(raw) || 0)
        );
        const reasons = Array.isArray(data.reasoning)
          ? data.reasoning
          : Array.isArray(data.findings)
            ? data.findings
            : [];
        const message =
          typeof data.message === "string" ? data.message : undefined;
        const isSecureProtocol = data.isSecureProtocol;
        setProgress(score, message, reasons, isSecureProtocol);
      } else {
        setProgress(
          0,
          response.error || "Scan failed",
          [response.error || "Scan failed"],
          undefined
        );
      }
    } catch (err) {
      loading.classList.remove("visible");
      scoreSection.classList.add("visible");
      setProgress(
        0,
        err.message || "Scan failed",
        [err.message || "Scan failed"],
        undefined
      );
    } finally {
      scanBtn.disabled = false;
    }
  });

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    showUrl(tabs[0]?.url || null);
  });
})();

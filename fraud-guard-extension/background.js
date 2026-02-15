// Background: analyze URL, collect page data, send to /api/scan-url
const API_BASE = "http://localhost:3000";

function analyzeUrl(url) {
  if (!url || typeof url !== "string") {
    return { dots: 0, length: 0, hasAt: false, longOrManyDots: false };
  }
  const trimmed = url.trim();
  const dots = (trimmed.match(/\./g) || []).length;
  const length = trimmed.length;
  const hasAt = trimmed.includes("@");
  const longOrManyDots = length > 75 || dots > 3;
  return { dots, length, hasAt, longOrManyDots };
}

const EXTRACT_PAGE_SCRIPT = () => {
  const getPageOrigin = () => {
    try {
      return window.location.origin || "";
    } catch {
      return "";
    }
  };
  const isExternal = (href, pageOrigin) => {
    if (!href || typeof href !== "string") return false;
    try {
      const u = new URL(href, window.location.href);
      return u.origin !== pageOrigin;
    } catch {
      return false;
    }
  };
  const pageOrigin = getPageOrigin();
  const meta =
    document.querySelector('meta[name="description"]') ||
    document.querySelector('meta[property="og:description"]');
  const metaDescription = (meta && meta.getAttribute("content")) || "";
  const title = document.title || "";
  const links = document.querySelectorAll("a[href]");
  let nullLinksCount = 0;
  links.forEach((a) => {
    const h = (a.getAttribute("href") || "").trim();
    if (
      h === "#" ||
      h === "" ||
      h === "javascript:void(0)" ||
      h === "javascript:;"
    )
      nullLinksCount++;
  });
  let externalImages = 0,
    totalImages = 0;
  for (let i = 0; i < document.images.length; i++) {
    const src = document.images[i].src;
    if (!src) continue;
    totalImages++;
    if (isExternal(src, pageOrigin)) externalImages++;
  }
  let externalScripts = 0,
    totalScripts = 0;
  const scriptDomains = {};
  const scripts = document.querySelectorAll("script[src]");
  for (let i = 0; i < scripts.length; i++) {
    const src = scripts[i].src;
    if (!src) continue;
    totalScripts++;
    try {
      const u = new URL(src, window.location.href);
      if (u.origin !== pageOrigin) {
        externalScripts++;
        scriptDomains[u.hostname] = true;
      }
    } catch (_) {}
  }
  return {
    title,
    metaDescription,
    nullLinksCount,
    totalLinks: links.length,
    externalImages,
    totalImages,
    externalScripts,
    totalScripts,
    distinctScriptDomains: Object.keys(scriptDomains).length,
  };
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action !== "scanUrl") return;

  (async () => {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      const url = tab?.url || null;

      if (!url) {
        return { success: false, error: "No active tab" };
      }

      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        return { success: false, error: "Cannot scan this page" };
      }

      const urlAnalysis = analyzeUrl(url);

      let pageData = {
        title: "",
        metaDescription: "",
        nullLinksCount: 0,
        totalLinks: 0,
        externalImages: 0,
        totalImages: 0,
        externalScripts: 0,
        totalScripts: 0,
        distinctScriptDomains: 0,
      };

      try {
        const fromContent = await new Promise((resolve) => {
          chrome.tabs.sendMessage(tab.id, { action: "getPageData" }, (r) => {
            if (chrome.runtime.lastError) resolve(null);
            else resolve(r);
          });
        });
        if (fromContent?.success && fromContent.data) {
          pageData = fromContent.data;
        } else {
          const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: EXTRACT_PAGE_SCRIPT,
          });
          if (results?.[0]?.result) {
            pageData = results[0].result;
          }
        }
      } catch (e) {
        const results = await chrome.scripting
          .executeScript({
            target: { tabId: tab.id },
            func: EXTRACT_PAGE_SCRIPT,
          })
          .catch(() => null);
        if (results?.[0]?.result) pageData = results[0].result;
      }

      const base = (await chrome.storage.local.get("apiBase")).apiBase || API_BASE;
      const res = await fetch(`${base}/api/scan-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          pageTitle: pageData.title,
          metaDescription: pageData.metaDescription,
          nullLinksCount: pageData.nullLinksCount,
          totalLinks: pageData.totalLinks,
          externalImages: pageData.externalImages,
          totalImages: pageData.totalImages,
          externalScripts: pageData.externalScripts,
          totalScripts: pageData.totalScripts,
          distinctScriptDomains: pageData.distinctScriptDomains ?? 0,
          urlDots: urlAnalysis.dots,
          urlLength: urlAnalysis.length,
          urlHasAt: urlAnalysis.hasAt,
          urlLongOrManyDots: urlAnalysis.longOrManyDots,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || `Request failed: ${res.status}` };
      }

      return { success: true, url, data };
    } catch (err) {
      return { success: false, error: err.message || "Network error" };
    }
  })().then(sendResponse);

  return true;
});

chrome.runtime.onInstalled.addListener(() => {
  console.log("Fraud Guard extension installed");
});

/**
 * Content script: scrapes page title, meta description, null links,
 * and external vs same-origin counts for images and scripts.
 */
function getPageOrigin() {
  try {
    return window.location.origin || "";
  } catch {
    return "";
  }
}

function isExternal(href, pageOrigin) {
  if (!href || typeof href !== "string") return false;
  try {
    const u = new URL(href, window.location.href);
    return u.origin !== pageOrigin;
  } catch {
    return false;
  }
}

function scrapePageData() {
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
    ) {
      nullLinksCount++;
    }
  });
  const totalLinks = links.length;

  let externalImages = 0;
  let totalImages = 0;
  const imgs = document.images;
  for (let i = 0; i < imgs.length; i++) {
    const src = imgs[i].src;
    if (!src) continue;
    totalImages++;
    if (isExternal(src, pageOrigin)) externalImages++;
  }

  let externalScripts = 0;
  let totalScripts = 0;
  const scriptDomains = new Set();
  const scripts = document.querySelectorAll("script[src]");
  for (let i = 0; i < scripts.length; i++) {
    const src = scripts[i].src;
    if (!src) continue;
    totalScripts++;
    try {
      const u = new URL(src, window.location.href);
      if (u.origin !== pageOrigin) {
        externalScripts++;
        scriptDomains.add(u.hostname);
      }
    } catch (_) {}
  }

  return {
    title,
    metaDescription,
    nullLinksCount,
    totalLinks,
    externalImages,
    totalImages,
    externalScripts,
    totalScripts,
    distinctScriptDomains: scriptDomains.size,
  };
}

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === "getPageData") {
    try {
      sendResponse({ success: true, data: scrapePageData() });
    } catch (e) {
      sendResponse({ success: false, error: e.message });
    }
  }
  return true;
});

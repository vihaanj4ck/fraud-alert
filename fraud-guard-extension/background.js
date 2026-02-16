// Background: extract page data via executeScript for reasoning-based security engine
// Production: use https:// only to avoid CORS/redirect blocks on Vercel
const API_BASE_URL = "https://fraud-alertv3.vercel.app";

/**
 * Injected into the tab. Extracts:
 * - Full URL, Page Title
 * - meta description, og:title
 * - Count of <a> tags: total, external domain count, empty (# / javascript:void(0)) count
 */
function extractPageData() {
  const fullUrl = window.location.href || "";
  const pageTitle = document.title || "";

  const descMeta =
    document.querySelector('meta[name="description"]') ||
    document.querySelector('meta[property="og:description"]');
  const metaDescription = (descMeta && descMeta.getAttribute("content")) || "";

  const ogTitleMeta = document.querySelector('meta[property="og:title"]');
  const ogTitle = (ogTitleMeta && ogTitleMeta.getAttribute("content")) || "";

  const pageOrigin = window.location.origin || "";
  let totalLinks = 0;
  let externalLinks = 0;
  let emptyLinks = 0;

  const anchors = document.querySelectorAll("a[href]");
  anchors.forEach((a) => {
    const href = (a.getAttribute("href") || "").trim();
    totalLinks += 1;
    if (
      !href ||
      href === "#" ||
      href === "javascript:void(0)" ||
      href === "javascript:;" ||
      href.startsWith("javascript:")
    ) {
      emptyLinks += 1;
      return;
    }
    try {
      const u = new URL(href, pageOrigin);
      if (u.origin !== pageOrigin) {
        externalLinks += 1;
      }
    } catch (_) {
      emptyLinks += 1;
    }
  });

  return {
    fullUrl,
    pageTitle,
    metaDescription,
    ogTitle,
    totalLinks,
    externalLinks,
    emptyLinks,
  };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action !== "scanUrl") return;

  (async () => {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      const url = request.url || tab?.url || null;

      if (!url) {
        return { success: false, error: "No active tab" };
      }

      // Only skip pages that cannot be scanned (browser internals / blank)
      const isUnscannable =
        url.startsWith("chrome://") ||
        url === "about:blank" ||
        url.startsWith("about:blank");
      if (isUnscannable) {
        return { success: false, error: "Cannot scan this page (chrome:// or about:blank)" };
      }

      // Force-scan everything else: http, https, and any TLD (.xyz, .top, etc.)
      const isSecureProtocol = url.startsWith("https://");

      let pageData = {
        fullUrl: url,
        pageTitle: "",
        metaDescription: "",
        ogTitle: "",
        totalLinks: 0,
        externalLinks: 0,
        emptyLinks: 0,
      };

      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: extractPageData,
        });
        if (results?.[0]?.result) {
          pageData = results[0].result;
        } else {
          pageData.fullUrl = url;
        }
      } catch (e) {
        console.warn("[Fraud Guard] executeScript failed:", e);
        pageData.fullUrl = url;
      }

      const apiBase =
        (await chrome.storage.local.get("apiBase")).apiBase || API_BASE_URL;
      const fetchUrl = `${apiBase.replace(/^http:\/\//i, "https://")}/api/scan-url`;

      let res;
      try {
        res = await fetch(fetchUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: pageData.fullUrl,
            pageTitle: pageData.pageTitle,
            metaDescription: pageData.metaDescription,
            ogTitle: pageData.ogTitle,
            totalLinks: pageData.totalLinks,
            externalLinks: pageData.externalLinks,
            emptyLinks: pageData.emptyLinks,
            isSecureProtocol,
          }),
        });
      } catch (fetchErr) {
        return {
          success: false,
          error: "Security Server unreachable. Please check your internet or Vercel logs.",
        };
      }

      let data;
      try {
        data = await res.json();
      } catch (parseErr) {
        return {
          success: false,
          error: "Security Server unreachable. Please check your internet or Vercel logs.",
        };
      }
      if (!res.ok) {
        return {
          success: false,
          error: data.error || `Request failed: ${res.status}`,
        };
      }

      console.log("Vercel Response:", data);
      return { success: true, url: pageData.fullUrl, data };
    } catch (err) {
      return {
        success: false,
        error: "Security Server unreachable. Please check your internet or Vercel logs.",
      };
    }
  })().then(sendResponse);

  return true;
});

chrome.runtime.onInstalled.addListener(() => {
  console.log("Fraud Guard extension installed");
});

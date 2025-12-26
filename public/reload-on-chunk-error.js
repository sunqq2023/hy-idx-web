/**
 * 处理 Vite 动态导入失败的问题
 * 当检测到 chunk 加载失败时，自动刷新页面
 * 优化 Android WebView 兼容性
 */
(function () {
  var RELOAD_KEY = "chunk-error-reloaded";
  var RELOAD_TIMESTAMP_KEY = "chunk-error-reload-time";
  var RELOAD_COOLDOWN = 5000; // 5秒冷却时间，避免频繁刷新

  function shouldReload() {
    try {
      var hasReloaded = sessionStorage.getItem(RELOAD_KEY);
      var lastReloadTime = sessionStorage.getItem(RELOAD_TIMESTAMP_KEY);

      // 如果从未刷新过，允许刷新
      if (!hasReloaded) {
        return true;
      }

      // 如果已经刷新过，检查是否超过冷却时间
      if (lastReloadTime) {
        var timeSinceReload = Date.now() - parseInt(lastReloadTime, 10);
        if (timeSinceReload > RELOAD_COOLDOWN) {
          // 超过冷却时间，清除标记并允许刷新
          sessionStorage.removeItem(RELOAD_KEY);
          sessionStorage.removeItem(RELOAD_TIMESTAMP_KEY);
          return true;
        }
      }

      return false;
    } catch (e) {
      // sessionStorage 不可用时，允许刷新
      console.warn("sessionStorage 不可用:", e);
      return true;
    }
  }

  function performReload() {
    try {
      sessionStorage.setItem(RELOAD_KEY, "true");
      sessionStorage.setItem(RELOAD_TIMESTAMP_KEY, String(Date.now()));
    } catch (e) {
      console.warn("无法设置 sessionStorage:", e);
    }

    console.log("正在刷新页面...");
    setTimeout(function () {
      window.location.reload();
    }, 100);
  }

  function isChunkError(message) {
    if (!message) return false;

    var errorPatterns = [
      "Failed to fetch dynamically imported module",
      "Importing a module script failed",
      "Failed to load module script",
      "error loading dynamically imported module",
      "dynamically imported module",
      "chunks/",
      "/chunks/",
    ];

    var lowerMessage = String(message).toLowerCase();
    return errorPatterns.some(function (pattern) {
      return lowerMessage.includes(pattern.toLowerCase());
    });
  }

  // 监听全局错误事件
  window.addEventListener(
    "error",
    function (event) {
      var message = event.message || "";
      var filename = event.filename || "";

      // 检查是否是 chunk 加载失败
      if (isChunkError(message) || isChunkError(filename)) {
        console.warn("检测到 chunk 加载失败:", {
          message: message,
          filename: filename,
        });

        event.preventDefault();
        event.stopPropagation();

        if (shouldReload()) {
          console.log("首次检测到错误，准备刷新页面...");
          performReload();
        } else {
          console.error(
            "页面已在冷却期内刷新过。如果问题持续，请手动清除浏览器缓存。",
          );
        }

        return false;
      }
    },
    true,
  );

  // 监听未捕获的 Promise rejection（某些情况下动态导入失败会触发这个）
  window.addEventListener(
    "unhandledrejection",
    function (event) {
      var reason = event.reason;
      var message = reason?.message || String(reason || "");

      if (isChunkError(message)) {
        console.warn("检测到 Promise rejection (chunk 错误):", message);

        event.preventDefault();
        event.stopPropagation();

        if (shouldReload()) {
          console.log("检测到 chunk Promise 错误，准备刷新页面...");
          performReload();
        } else {
          console.error(
            "页面已在冷却期内刷新过。如果问题持续，请手动清除浏览器缓存。",
          );
        }
      }
    },
    true,
  );

  // 页面加载成功后清除刷新标记（延迟清除，确保页面完全加载）
  window.addEventListener("load", function () {
    setTimeout(function () {
      try {
        sessionStorage.removeItem(RELOAD_KEY);
        sessionStorage.removeItem(RELOAD_TIMESTAMP_KEY);
        console.log("页面加载成功，已清除刷新标记");
      } catch (e) {
        console.warn("无法清除 sessionStorage:", e);
      }
    }, 1000);
  });

  // 监听 DOMContentLoaded 作为备用（某些 Android WebView 可能不触发 load）
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      setTimeout(function () {
        try {
          sessionStorage.removeItem(RELOAD_KEY);
          sessionStorage.removeItem(RELOAD_TIMESTAMP_KEY);
          console.log("DOM 加载完成，已清除刷新标记");
        } catch (e) {
          console.warn("无法清除 sessionStorage:", e);
        }
      }, 2000);
    });
  }

  console.log("Chunk 错误处理脚本已加载 (Android 优化版)");
})();

var activityEvents, script_loaded = !1;

if (void 0 === __isPSA) var __isPSA = !1;

if (void 0 === uLTS) {
  var uLTS = new MutationObserver(e => {});
  uLTS.observe(document.documentElement, { childList: !0, subtree: !0 });
}

function loadJSscripts() {
  if (script_loaded) return;

  void 0 !== uLTS && uLTS.disconnect();
  void 0 !== window.yett && window.yett.unblock();
  script_loaded = !0;

  document
    .querySelectorAll("iframe[data-src], script[data-src]")
    .forEach(e => {
      if (e.dataset.src) e.src = e.dataset.src;
    });

  document.querySelectorAll("link[data-href]").forEach(e => {
    if (e.dataset.href) e.href = e.dataset.href;
  });

  document
    .querySelectorAll("script[type='text/lazyload']")
    .forEach(e => {
      var t = document.createElement("script");
      for (var a = 0; a < e.attributes.length; a++) {
        var r = e.attributes[a];
        t.setAttribute(r.name, r.value);
      }
      t.type = "text/javascript";
      t.innerHTML = e.innerHTML;
      e.parentNode.insertBefore(t, e);
      e.parentNode.removeChild(e);
    });

  document.dispatchEvent(new CustomEvent("asyncLazyLoad"));

  setTimeout(function () {
    document.dispatchEvent(new CustomEvent("loadBarInjector"));
  }, 1000);
}

/* Load on user interaction */
["mousedown","mousemove","keydown","scroll","touchstart","click","keypress","touchmove"]
  .forEach(function (e) {
    window.addEventListener(e, loadJSscripts, !1);
  });

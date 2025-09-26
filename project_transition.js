// project_transition.js
(function () {
  // helper: convert "700ms" or "0.7s" -> milliseconds number
  function durationMs(val) {
    if (!val) return 700;
    val = val.trim();
    if (val.endsWith('ms')) return parseFloat(val);
    if (val.endsWith('s')) return parseFloat(val) * 1000;
    return parseFloat(val);
  }

  // read duration from CSS var
  const rootStyle = getComputedStyle(document.documentElement);
  const duration = durationMs(rootStyle.getPropertyValue('--transition-duration') || '700ms');

  // Delegated click listener: catches links added later too
  document.addEventListener('click', async function (e) {
    const link = e.target.closest('.transition-link');
    if (!link) return; // not our target

    // allow modifier keys/open-in-new-tab to behave normally
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || link.target === '_blank') return;

    e.preventDefault();
    const href = link.getAttribute('href') || '';

    // Find image inside the link; fall back to just navigate if none
    const img = link.querySelector('.transition-img');
    if (!img) {
      window.location = href;
      return;
    }

    // get bounding rect of source image
    const rect = img.getBoundingClientRect();

    // create overlay
    const overlay = document.createElement('div');
    overlay.className = 'transition-overlay';

    // optionally match body background color if available
    const bodyBg = getComputedStyle(document.body).backgroundColor;
    if (bodyBg && bodyBg !== 'rgba(0, 0, 0, 0)' && bodyBg !== 'transparent') {
      overlay.style.background = bodyBg;
    } else {
      // fallback uses CSS var --overlay-color
      overlay.style.background = getComputedStyle(document.documentElement).getPropertyValue('--overlay-color') || '#fff';
    }

    // clone the image and position it exactly over original
    const clone = img.cloneNode(true);
    clone.classList.add('transition-clone');
    Object.assign(clone.style, {
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      margin: '0',
      opacity: '1',
    });

    // append overlay & clone (overlay below clone)
    document.body.appendChild(overlay);
    document.body.appendChild(clone);

    // compute translation to center the clone
    const viewportCenterX = window.innerWidth / 2;
    const viewportCenterY = window.innerHeight / 2;
    const imgCenterX = rect.left + rect.width / 2;
    const imgCenterY = rect.top + rect.height / 2;
    const deltaX = viewportCenterX - imgCenterX;
    const deltaY = viewportCenterY - imgCenterY;

    // scale so clone will cover viewport (slight overshoot)
    const scaleX = (window.innerWidth * 1.05) / rect.width;
    const scaleY = (window.innerHeight * 1.05) / rect.height;
    const scale = Math.max(scaleX, scaleY);

    // force reflow so starting position is registered
    // (read layout)
    clone.getBoundingClientRect();

    // animate: move/scale clone and fade overlay in/out
    requestAnimationFrame(() => {
      clone.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(${scale})`;
      clone.style.opacity = '0';
      overlay.style.opacity = '1';
      overlay.style.pointerEvents = 'auto';
    });

    // wait for both transitions to end (clone + overlay).
    // Use transitionend; fallback to timeout in case of issues.
    await new Promise(resolve => {
      let done = 0;
      function onEnd(e) {
        // only count transform/opacity transitions
        if (e.propertyName !== 'transform' && e.propertyName !== 'opacity') return;
        done++;
        if (done >= 2) {
          cleanup();
          resolve();
        }
      }
      function cleanup() {
        clone.removeEventListener('transitionend', onEnd);
        overlay.removeEventListener('transitionend', onEnd);
      }
      clone.addEventListener('transitionend', onEnd);
      overlay.addEventListener('transitionend', onEnd);

      // safety timeout (duration + cushion)
      setTimeout(() => {
        cleanup();
        resolve();
      }, duration + 120);
    });

    // remove animated nodes and navigate
    try { clone.remove(); } catch (err) { /* noop */ }
    try { overlay.remove(); } catch (err) { /* noop */ }

    // If you're using fetch-injection SPA behavior, replace this with your loader:
    // await loadPageIntoMainContent(href);
    window.location = href;
  });
})();

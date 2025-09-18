(function () {
  const DURATION = 2000; // milliseconds - match CSS transition durations
  const links = document.querySelectorAll('.transition-link');

  links.forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      const href = link.getAttribute('href');
      const img = link.querySelector('.transition-img');

      // If there's no image (or no transition desired), just navigate
      if (!img) {
        window.location = href;
        return;
      }

      // Get bounding rect for the image
      const rect = img.getBoundingClientRect();

      // Create clone
      const clone = img.cloneNode(true);
      clone.classList.add('transition-clone');

      // Size & position the clone exactly over the original
      clone.style.left = `${rect.left}px`;
      clone.style.top = `${rect.top}px`;
      clone.style.width = `${rect.width}px`;
      clone.style.height = `${rect.height}px`;
      clone.style.margin = '0';

      // Create overlay
      const overlay = document.createElement('div');
      overlay.className = 'transition-overlay';

      // Try to match the page background (so fade feels natural)
      const bodyBg = window.getComputedStyle(document.body).backgroundColor;
      if (bodyBg && bodyBg !== 'rgba(0, 0, 0, 0)' && bodyBg !== 'transparent') {
        overlay.style.background = bodyBg;
      } else {
        // fallback color (adjust to taste: white, black, or other)
        overlay.style.background = '#ffffff';
      }

      // Append overlay then clone (overlay below clone)
      document.body.appendChild(overlay);
      document.body.appendChild(clone);

      // Compute center offsets (move clone's center to viewport center)
      const viewportCenterX = window.innerWidth / 2;
      const viewportCenterY = window.innerHeight / 2;
      const imgCenterX = rect.left + rect.width / 2;
      const imgCenterY = rect.top + rect.height / 2;
      const deltaX = viewportCenterX - imgCenterX;
      const deltaY = viewportCenterY - imgCenterY;

      // Compute scale to cover viewport (slightly overshoot)
      const scaleX = (window.innerWidth * 1.05) / rect.width;
      const scaleY = (window.innerHeight * 1.05) / rect.height;
      const scale = Math.max(scaleX, scaleY);

      // Ensure initial transform is applied
      clone.style.transform = 'translate(0px, 0px) scale(1)';
      clone.style.opacity = '1';
      overlay.style.opacity = '0';

      // Force layout so transitions will run
      // eslint-disable-next-line no-unused-expressions
      clone.offsetWidth;

      // Animate: clone moves+scales and overlay fades in
      requestAnimationFrame(() => {
        clone.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(${scale})`;
        clone.style.opacity = '0';
        overlay.style.opacity = '1';
      });

      // Cleanup & navigate after animation ends
      setTimeout(() => {
        // remove elements
        try { clone.remove(); } catch (err) {}
        try { overlay.remove(); } catch (err) {}

        // finally navigate
        window.location = href;
      }, DURATION + 20);
    });
  });
})();
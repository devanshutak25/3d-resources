// Shared HTML page shell for the standalone SEO pages (section, subsection, tag).
// One source of truth for <head>, header, breadcrumb, footer, back-to-top so the
// page types can't drift apart. Body content + JSON-LD are passed in by caller.

const SITE_URL = 'https://3d.devanshutak.xyz';
const REPO_URL = 'https://github.com/devanshutak25/3d-resources';

function escHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function pageShell({ canonicalUrl, ogImage, pageTitle, desc, noindex, jsonLd,
                     breadcrumbHtml, headerHtml, subNavHtml, htmlBody, navHtml, lastUpdated }) {
  const robots = noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#000000">
  <title>${pageTitle}</title>
  <meta name="description" content="${desc}">
  <meta name="robots" content="${robots}">
  <meta name="author" content="Devanshu Tak">
  <link rel="canonical" href="${canonicalUrl}">
  <link rel="alternate" type="application/atom+xml" title="3D Resources: latest additions" href="/feed.xml">

  <meta property="og:title" content="${pageTitle}">
  <meta property="og:description" content="${desc}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:type" content="website">
  <meta property="og:image" content="${ogImage}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${pageTitle}">
  <meta name="twitter:description" content="${desc}">
  <meta name="twitter:image" content="${ogImage}">

  <script type="application/ld+json">
${JSON.stringify(jsonLd, null, 2)}
  </script>

  <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
  <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preconnect" href="https://api.fontshare.com" crossorigin>
  <link rel="preconnect" href="https://cdn.fontshare.com" crossorigin>
  <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
  <style>
    body { margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; line-height: 1.55; background: #0d1117; color: #e6edf3; }
    .wrapper { max-width: 1100px; margin: 0 auto; padding: 1.25rem 1.25rem 3rem; }
    header { display: flex; justify-content: space-between; padding-bottom: 0.5rem; align-items: center; gap: 1rem; }
    h1 { font-size: clamp(1.6rem, 4vw, 2.2rem); line-height: 1.2; margin: 0.8rem 0 0.6rem; }
    a { color: #58a6ff; }
    .skip-link { position: absolute; left: -9999px; }
    .skip-link:focus { left: 0; top: 0; padding: 0.5rem 0.8rem; background: #388bfd; color: #fff; }
  </style>
  <link rel="preload" as="style" href="/assets/css/style.css" onload="this.onload=null;this.rel='stylesheet'">
  <link rel="stylesheet" href="/assets/css/style.css" media="print" onload="this.media='all'">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" media="print" onload="this.media='all'">
  <link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=clash-grotesk@400,500,600,700&display=swap" media="print" onload="this.media='all'">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@mdi/font@7.4.47/css/materialdesignicons.min.css" media="print" onload="this.media='all'">
  <noscript>
    <link rel="stylesheet" href="/assets/css/style.css">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap">
    <link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=clash-grotesk@400,500,600,700&display=swap">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@mdi/font@7.4.47/css/materialdesignicons.min.css">
  </noscript>
</head>
<body>
  <a href="#main-content" class="skip-link">Skip to main content</a>
  <div class="wrapper">
    <header>
      ${headerHtml}
    </header>
    <nav class="breadcrumb" aria-label="Breadcrumb">${breadcrumbHtml}</nav>
    <main id="main-content" tabindex="-1">
${subNavHtml || ''}      ${htmlBody}
    </main>
    <nav class="section-nav" aria-label="Page navigation">
      ${navHtml}
    </nav>
    <a href="#main-content" class="back-to-top" aria-label="Back to top">
      <i class="mdi mdi-arrow-up" aria-hidden="true"></i>
    </a>
    <footer class="site-footer">
      <p><a href="/">3d.devanshutak.xyz</a> · <a href="${REPO_URL}">GitHub</a> · <small>Last updated ${lastUpdated}</small></p>
    </footer>
    <script>
      (function(){
        var btn = document.querySelector('.back-to-top');
        if (!btn) return;
        function onScroll(){
          if (window.scrollY > 600) btn.classList.add('visible');
          else btn.classList.remove('visible');
        }
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
      })();
    </script>
  </div>
</body>
</html>`;
}

module.exports = { SITE_URL, REPO_URL, escHtml, pageShell };

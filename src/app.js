/**
 * Client-side application
 * Loads presentation JSON, builds it, and initializes Reveal.js
 */

import Reveal from 'reveal.js';
import RevealNotes from 'reveal.js/plugin/notes/notes.esm.js';
import { buildPresentation } from './index-browser.js';
import { validatePresentation } from './validator/index.js';
import {
  buildRecommendations,
  calculateFitScore,
  createIssue,
  getFitSeverity,
  toIssueKey
} from './utils/fit-guidance.js';

// Get presentation path from URL parameter or default to hello-world
const params = new URLSearchParams(window.location.search);
const presentationPath = params.get('presentation') || './examples/hello-world.json';
const PRESENTATION_MODE_STORAGE_KEY = 'agentic-presentation-mode';
const WARNINGS_VISIBILITY_STORAGE_KEY = 'agentic-presentation-warnings';
const presentationRole = getPresentationRole();
let mermaidLoaderPromise = null;
let prismLoaderPromise = null;
let mathRendererPromise = null;
let presentationWarningsBySlide = new Map();
let latestPresentationValidation = null;
let latestPresentationAudit = null;
let presentationModeEnabled = getInitialPresentationMode();
let warningsVisible = getInitialWarningsVisibility();
let revealInstance = null;
let presentationSyncChannel = null;
window.__presentationValidation = null;
window.__presentationAudit = null;
window.__presentationAgentReport = null;
window.__presentationMode = {
  enabled: presentationModeEnabled,
  mode: presentationModeEnabled ? 'presentation' : 'authoring',
  warningsVisible
};
window.__presentationRole = presentationRole;
window.__getPresentationValidation = () => latestPresentationValidation;
window.__getPresentationAudit = () => latestPresentationAudit;
window.__getPresentationAgentReport = () => window.__presentationAgentReport;

/**
 * Load and render presentation
 */
async function loadAndRenderPresentation() {
  try {
    document.body.classList.toggle('audience-screen', presentationRole === 'audience');
    document.getElementById('loading').style.display = 'flex';

    const response = await fetch(presentationPath);
    if (!response.ok) {
      throw new Error(`Failed to load presentation: ${response.statusText}`);
    }

    const presentationData = await response.json();
    const validationResult = validatePresentation(presentationData);
    publishPresentationValidation(validationResult);
    presentationWarningsBySlide = indexWarningsBySlide(validationResult.warnings);
    const built = buildPresentation(presentationData);

    document.title = built.metadata.title || 'Presentation';

    const styleEl = document.createElement('style');
    styleEl.textContent = built.themeCSS;
    document.head.appendChild(styleEl);

    const slidesContainer = document.querySelector('.reveal .slides');
    slidesContainer.innerHTML = built.slidesHTML;

    await hydrateRenderedImages(slidesContainer);

    document.getElementById('loading').style.display = 'none';

    const controls = built.metadata.controls || {
      slideNumbers: false,
      progress: true,
      showNotes: false
    };

    await Reveal.initialize({
      hash: true,
      controls: presentationRole === 'audience' ? false : true,
      progress: presentationRole === 'audience' ? false : controls.progress,
      center: false,
      transition: 'slide',
      slideNumber: presentationRole === 'audience' ? false : (controls.slideNumbers ? 'c/t' : false),
      showNotes: controls.showNotes,
      width: built.dimensions.width,
      height: built.dimensions.height,
      margin: 0.04,
      minScale: 0.3,
      maxScale: 1.5,
      overview: true,
      plugins: [RevealNotes]
    });
    revealInstance = Reveal;

    await initializeMermaidIfNeeded(slidesContainer);
    await renderMathContent(slidesContainer);
    await highlightCodeIfNeeded(slidesContainer);
    createShortcutsHelp();

    const auditControls = createLayoutAuditControls();
    createSettingsControls(auditControls);
    applyPresentationMode(presentationModeEnabled, auditControls, { persist: false });
    applyWarningsVisibility(warningsVisible, auditControls, { persist: false });
    const scheduleLayoutAudit = createLayoutAuditScheduler(Reveal, auditControls);

    bindLayoutAuditEvents(Reveal, scheduleLayoutAudit);
    setupPresentationSync(Reveal);
    scheduleLayoutAudit();

    console.log('Presentation loaded successfully:', built.metadata.title);
  } catch (error) {
    console.error('Error loading presentation:', error);
    document.getElementById('loading').innerHTML = `
      <div style="color: #DC2626; text-align: center;">
        <h2>Error Loading Presentation</h2>
        <p>${error.message}</p>
        <p><a href="?presentation=./examples/hello-world.json">Try hello-world example</a></p>
      </div>
    `;
  }
}

/**
 * Normalize Mermaid SVG output so large diagrams scale predictably inside slides.
 */
function normalizeMermaidDiagrams() {
  document.querySelectorAll('.mermaid svg').forEach(svg => {
    const width = Number.parseFloat(svg.getAttribute('width'));
    const height = Number.parseFloat(svg.getAttribute('height'));

    if (!svg.getAttribute('viewBox') && Number.isFinite(width) && Number.isFinite(height)) {
      svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    }

    svg.removeAttribute('width');
    svg.removeAttribute('height');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.style.width = '100%';
    svg.style.height = 'auto';
    svg.style.maxWidth = '100%';
  });
}

async function renderMathContent(root) {
  const mathTargets = Array.from(root.querySelectorAll([
    '.text-element',
    '.bullet-list',
    '.callout-content',
    '.callout-title',
    '.image-caption',
    '.table-caption',
    '.code-caption'
  ].join(', '))).filter(element => containsMathSyntax(element.textContent));

  if (mathTargets.length === 0) {
    return;
  }

  const renderMathInElement = await loadMathRenderer();

  mathTargets.forEach(element => {
    renderMathInElement(element, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false },
        { left: '\\(', right: '\\)', display: false },
        { left: '\\[', right: '\\]', display: true }
      ],
      throwOnError: false,
      strict: 'ignore',
      ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'option']
    });
  });
}

async function initializeMermaidIfNeeded(root) {
  if (!root.querySelector('.mermaid')) {
    return;
  }

  const mermaid = await loadMermaid();
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'loose',
    theme: 'base',
    themeVariables: {
      primaryColor: '#2563EB',
      primaryTextColor: '#1E293B',
      primaryBorderColor: '#E2E8F0',
      lineColor: '#64748B',
      background: '#F8FAFC',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    flowchart: {
      htmlLabels: true,
      curve: 'basis',
      useMaxWidth: true,
      padding: 20
    }
  });

  await mermaid.run({
    querySelector: '.mermaid'
  });

  normalizeMermaidDiagrams();
}

async function highlightCodeIfNeeded(root) {
  const codeBlocks = Array.from(root.querySelectorAll('code[class^="language-"], code[class*=" language-"]'));
  if (codeBlocks.length === 0) {
    return;
  }

  const Prism = await loadPrism();
  Prism.highlightAll();
}

function containsMathSyntax(text = '') {
  return /(\$\$[\s\S]+?\$\$)|(\$(?!\s)[^$\n]+\$)|(\\\([\s\S]+?\\\))|(\\\[[\s\S]+?\\\])/.test(text);
}

async function loadMermaid() {
  if (!mermaidLoaderPromise) {
    mermaidLoaderPromise = import('mermaid').then(module => module.default);
  }

  return mermaidLoaderPromise;
}

async function loadPrism() {
  if (!prismLoaderPromise) {
    prismLoaderPromise = (async () => {
      const Prism = (await import('prismjs')).default;
      await Promise.all([
        import('prismjs/components/prism-javascript'),
        import('prismjs/components/prism-typescript'),
        import('prismjs/components/prism-python'),
        import('prismjs/components/prism-java'),
        import('prismjs/components/prism-go'),
        import('prismjs/components/prism-rust'),
        import('prismjs/components/prism-json'),
        import('prismjs/components/prism-css'),
        import('prismjs/components/prism-markup')
      ]);
      return Prism;
    })();
  }

  return prismLoaderPromise;
}

async function loadMathRenderer() {
  if (!mathRendererPromise) {
    mathRendererPromise = (async () => {
      await import('katex/dist/katex.min.css');
      const module = await import('katex/contrib/auto-render/auto-render.js');
      return module.default;
    })();
  }

  return mathRendererPromise;
}

/**
 * Resolve image metadata before the deck becomes visible.
 */
async function hydrateRenderedImages(root) {
  const images = Array.from(root.querySelectorAll('.image-element img'));
  const initialSlide = getInitialSlideElement(root);
  const initialImages = initialSlide
    ? Array.from(initialSlide.querySelectorAll('.image-element img'))
    : [];
  const deferredImages = images.filter(img => !initialImages.includes(img));

  initialImages.forEach(img => {
    img.loading = 'eager';
  });

  deferredImages.forEach(img => {
    void prepareRenderedImage(img);
  });

  await Promise.all(initialImages.map(prepareRenderedImage));
}

async function prepareRenderedImage(img) {
  await waitForImageReady(img);

  if (!img.naturalWidth || !img.naturalHeight) {
    return;
  }

  img.setAttribute('width', String(img.naturalWidth));
  img.setAttribute('height', String(img.naturalHeight));

  const figure = img.closest('.image-element');
  if (figure) {
    figure.dataset.imageReady = 'true';
    figure.style.setProperty('--image-natural-width', `${img.naturalWidth}px`);
    figure.style.setProperty('--image-natural-height', `${img.naturalHeight}px`);
  }
}

function waitForImageReady(img) {
  if (img.complete && img.naturalWidth > 0) {
    return img.decode ? img.decode().catch(() => {}) : Promise.resolve();
  }

  return new Promise(resolve => {
    const finish = () => resolve();
    img.addEventListener('load', finish, { once: true });
    img.addEventListener('error', finish, { once: true });
  });
}

function getInitialSlideElement(root) {
  const hash = window.location.hash.replace(/^#\/?/, '');
  if (!hash) {
    return root.querySelector('section');
  }

  return root.querySelector(`section#${CSS.escape(decodeURIComponent(hash))}`) || root.querySelector('section');
}

/**
 * Create keyboard shortcuts help button and overlay.
 */
function createShortcutsHelp() {
  if (document.getElementById('shortcuts-btn')) {
    return;
  }

  const shortcuts = [
    { key: ',', description: 'Open presentation settings' },
    { key: 'P', description: 'Toggle presentation mode' },
    { key: 'S', description: 'Speaker notes (popup)' },
    { key: 'O', description: 'Slide overview' },
    { key: 'F', description: 'Fullscreen' },
    { key: 'Esc', description: 'Exit overview / pause' },
    { key: '\u2190 \u2192', description: 'Navigate slides' },
    { key: 'Home', description: 'First slide' },
    { key: 'End', description: 'Last slide' },
    { key: 'B / .', description: 'Blackout screen' },
    { key: '?', description: 'Toggle this help' }
  ];

  const overlay = document.createElement('div');
  overlay.id = 'shortcuts-overlay';
  overlay.innerHTML = `
    <div class="shortcuts-panel">
      <h3>Keyboard Shortcuts</h3>
      <dl>
        ${shortcuts.map(shortcut => `
          <div class="shortcut-row">
            <dt><kbd>${shortcut.key}</kbd></dt>
            <dd>${shortcut.description}</dd>
          </div>
        `).join('')}
      </dl>
      <p class="shortcuts-dismiss">Press <kbd>?</kbd> or <kbd>Esc</kbd> to close</p>
    </div>
  `;
  document.body.appendChild(overlay);

  const button = document.createElement('button');
  button.id = 'shortcuts-btn';
  button.type = 'button';
  button.setAttribute('aria-label', 'Keyboard shortcuts');
  button.textContent = '?';
  document.body.appendChild(button);

  function toggle() {
    const visible = overlay.classList.toggle('visible');
    button.classList.toggle('active', visible);
  }

  function hide() {
    overlay.classList.remove('visible');
    button.classList.remove('active');
  }

  button.addEventListener('click', event => {
    event.stopPropagation();
    toggle();
  });

  overlay.addEventListener('click', event => {
    if (event.target === overlay) {
      hide();
    }
  });

  document.addEventListener('keydown', event => {
    if (event.key === '?' && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      event.stopPropagation();
      toggle();
    } else if (event.key === 'Escape' && overlay.classList.contains('visible')) {
      hide();
    }
  }, true);
}

function createSettingsControls(auditControls) {
  if (presentationRole === 'audience') {
    return null;
  }

  const existingButton = document.getElementById('settings-btn');
  const existingPanel = document.getElementById('settings-panel');
  if (existingButton && existingPanel) {
    syncSettingsControls();
    return { button: existingButton, panel: existingPanel };
  }

  const button = document.createElement('button');
  button.id = 'settings-btn';
  button.type = 'button';
  button.setAttribute('aria-label', 'Presentation settings');
  button.textContent = 'Settings';
  document.body.appendChild(button);

  const panel = document.createElement('div');
  panel.id = 'settings-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'false');
  panel.innerHTML = `
    <div class="settings-panel-card">
      <h3>Presentation Settings</h3>
      <div class="settings-section">
        <p class="settings-section-title">Mode</p>
        <label class="settings-choice">
          <input type="radio" name="presentation-mode" value="authoring">
          <span>Authoring</span>
        </label>
        <label class="settings-choice">
          <input type="radio" name="presentation-mode" value="presentation">
          <span>Presentation</span>
        </label>
      </div>
      <div class="settings-section">
        <p class="settings-section-title">Diagnostics</p>
        <label class="settings-toggle">
          <input type="checkbox" id="settings-warnings-toggle">
          <span>Show warnings and fit overlays</span>
        </label>
      </div>
      <div class="settings-section">
        <p class="settings-section-title">Presenter Tools</p>
        <button type="button" data-settings-action="presenter">Open Presenter View</button>
        <button type="button" data-settings-action="audience">Open Audience Screen</button>
        <button type="button" data-settings-action="shortcuts">Keyboard Shortcuts</button>
      </div>
    </div>
  `;
  document.body.appendChild(panel);

  const closeSettings = () => {
    panel.classList.remove('visible');
    button.classList.remove('active');
  };

  button.addEventListener('click', event => {
    event.stopPropagation();
    panel.classList.toggle('visible');
    button.classList.toggle('active', panel.classList.contains('visible'));
    syncSettingsControls();
  });

  panel.addEventListener('click', event => {
    event.stopPropagation();
  });

  panel.querySelectorAll('input[name="presentation-mode"]').forEach(input => {
    input.addEventListener('change', event => {
      applyPresentationMode(event.target.value === 'presentation', auditControls);
    });
  });

  panel.querySelector('#settings-warnings-toggle').addEventListener('change', event => {
    applyWarningsVisibility(event.target.checked, auditControls);
  });

  panel.querySelector('[data-settings-action="presenter"]').addEventListener('click', () => {
    closeSettings();
    applyPresentationMode(true, auditControls);
    openPresenterView();
  });

  panel.querySelector('[data-settings-action="audience"]').addEventListener('click', () => {
    closeSettings();
    openAudienceScreen();
  });

  panel.querySelector('[data-settings-action="shortcuts"]').addEventListener('click', () => {
    closeSettings();
    document.getElementById('shortcuts-btn')?.click();
  });

  document.addEventListener('click', event => {
    if (!panel.contains(event.target) && event.target !== button) {
      closeSettings();
    }
  });

  document.addEventListener('keydown', event => {
    if (event.key.toLowerCase() === 'p' && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      applyPresentationMode(!presentationModeEnabled, auditControls);
    } else if (event.key === ',' && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      panel.classList.toggle('visible');
      button.classList.toggle('active', panel.classList.contains('visible'));
      syncSettingsControls();
    } else if (event.key === 'Escape' && panel.classList.contains('visible')) {
      closeSettings();
    }
  });

  syncSettingsControls();
  return { button, panel };
}

function applyPresentationMode(enabled, auditControls, options = {}) {
  const { persist = true } = options;
  presentationModeEnabled = enabled;
  document.body.classList.toggle('presentation-mode', enabled);
  document.body.dataset.presentationMode = enabled ? 'presentation' : 'authoring';
  syncSettingsControls();

  if (persist) {
    window.localStorage.setItem(PRESENTATION_MODE_STORAGE_KEY, enabled ? 'presentation' : 'authoring');
  }

  if (enabled && auditControls?.overlay) {
    auditControls.overlay.classList.remove('visible');
  }

  publishPresentationState();
  publishAgentReport();

  if (auditControls) {
    updateLayoutAudit(auditControls);
  }
}

function applyWarningsVisibility(enabled, auditControls, options = {}) {
  const { persist = true } = options;
  warningsVisible = enabled;
  document.body.classList.toggle('warnings-hidden', !enabled);
  syncSettingsControls();

  if (persist) {
    window.localStorage.setItem(WARNINGS_VISIBILITY_STORAGE_KEY, enabled ? 'visible' : 'hidden');
  }

  if (!enabled && auditControls?.overlay) {
    auditControls.overlay.classList.remove('visible');
  }

  publishPresentationState();
  publishAgentReport();

  if (auditControls) {
    updateLayoutAudit(auditControls);
  }
}

function syncSettingsControls() {
  const button = document.getElementById('settings-btn');
  const panel = document.getElementById('settings-panel');
  if (!button || !panel) {
    return;
  }

  button.classList.toggle('active', panel.classList.contains('visible'));
  button.title = presentationModeEnabled
    ? 'Presentation mode is active. Open settings to change delivery options.'
    : 'Authoring mode is active. Open settings to change delivery options.';

  const modeValue = presentationModeEnabled ? 'presentation' : 'authoring';
  panel.querySelectorAll('input[name="presentation-mode"]').forEach(input => {
    input.checked = input.value === modeValue;
  });

  const warningsToggle = panel.querySelector('#settings-warnings-toggle');
  if (warningsToggle) {
    warningsToggle.checked = warningsVisible;
    warningsToggle.disabled = presentationRole === 'audience';
  }
}

function openPresenterView() {
  const notesPlugin = revealInstance?.getPlugin?.('notes');
  if (notesPlugin?.open) {
    notesPlugin.open();
  }
}

function openAudienceScreen() {
  const url = new URL(window.location.href);
  url.searchParams.set('presentation', presentationPath);
  url.searchParams.set('role', 'audience');
  url.searchParams.set('mode', 'presentation');
  window.open(url.toString(), 'agentic-audience-screen');
}

/**
 * Build the author-facing layout audit UI.
 */
function createLayoutAuditControls() {
  const existingButton = document.getElementById('layout-audit-btn');
  const existingOverlay = document.getElementById('layout-audit-overlay');

  if (existingButton && existingOverlay) {
    return {
      button: existingButton,
      overlay: existingOverlay,
      summary: existingOverlay.querySelector('[data-layout-audit-summary]'),
      list: existingOverlay.querySelector('[data-layout-audit-list]')
    };
  }

  const button = document.createElement('button');
  button.id = 'layout-audit-btn';
  button.type = 'button';
  button.hidden = true;
  button.setAttribute('aria-label', 'Open presentation audit');
  document.body.appendChild(button);

  const overlay = document.createElement('div');
  overlay.id = 'layout-audit-overlay';
  overlay.innerHTML = `
    <div class="layout-audit-panel" role="dialog" aria-modal="true" aria-labelledby="layout-audit-title">
      <h3 id="layout-audit-title">Presentation Audit</h3>
      <p data-layout-audit-summary>No layout issues or author warnings detected.</p>
      <div class="layout-audit-list" data-layout-audit-list></div>
    </div>
  `;
  document.body.appendChild(overlay);

  const summary = overlay.querySelector('[data-layout-audit-summary]');
  const list = overlay.querySelector('[data-layout-audit-list]');

  button.addEventListener('click', () => {
    overlay.classList.add('visible');
  });

  overlay.addEventListener('click', event => {
    if (event.target === overlay) {
      overlay.classList.remove('visible');
    }
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && overlay.classList.contains('visible')) {
      overlay.classList.remove('visible');
    }
  });

  return { button, overlay, summary, list };
}

/**
 * Schedule layout audit work into a single animation frame.
 */
function createLayoutAuditScheduler(revealInstance, controls) {
  let frame = null;

  return function scheduleLayoutAudit() {
    if (frame !== null) {
      cancelAnimationFrame(frame);
    }

    frame = requestAnimationFrame(() => {
      frame = null;
      updateResponsiveMediaLayout();
      revealInstance.layout();
      updateResponsiveMediaLayout();
      updateLayoutAudit(controls);
    });
  };
}

/**
 * Re-run layout checks when Reveal state or media changes.
 */
function bindLayoutAuditEvents(revealInstance, scheduleLayoutAudit) {
  revealInstance.on('ready', scheduleLayoutAudit);
  revealInstance.on('slidechanged', scheduleLayoutAudit);
  revealInstance.on('overviewshown', scheduleLayoutAudit);
  revealInstance.on('overviewhidden', scheduleLayoutAudit);
  window.addEventListener('resize', scheduleLayoutAudit);

  document.querySelectorAll('img').forEach(image => {
    if (!image.complete) {
      image.addEventListener('load', scheduleLayoutAudit, { once: true });
      image.addEventListener('error', scheduleLayoutAudit, { once: true });
    }
  });

  if (document.fonts?.ready) {
    document.fonts.ready.then(scheduleLayoutAudit).catch(() => {});
  }
}

/**
 * Inspect slides for overflow and dense text blocks.
 */
function updateLayoutAudit(controls) {
  const slides = Array.from(document.querySelectorAll('.reveal .slides > section'));
  const allSlideAudits = slides.map((section, index) => inspectSlide(section, index));
  const issues = allSlideAudits
    .filter(result => result.issues.length > 0 || result.warnings.length > 0)
    .sort((a, b) => {
      if (a.score !== b.score) {
        return a.score - b.score;
      }
      return b.warnings.length - a.warnings.length;
    });

  renderLayoutAudit(controls, issues, allSlideAudits);
}

function inspectSlide(section, slideIndex) {
  const shell = section.querySelector('.slide-shell') || section;
  const issues = [];
  const warnings = presentationWarningsBySlide.get(slideIndex) || [];

  const verticalOverflow = Math.ceil(shell.scrollHeight - shell.clientHeight);
  const horizontalOverflow = Math.ceil(shell.scrollWidth - shell.clientWidth);

  if (verticalOverflow > 2) {
    issues.push(createIssue('slide-overflow-vertical', `Content exceeds slide height by ${verticalOverflow}px.`, 34));
  }

  if (horizontalOverflow > 2) {
    issues.push(createIssue('slide-overflow-horizontal', `Content exceeds slide width by ${horizontalOverflow}px.`, 28));
  }

  issues.push(...findOverflowingContainers(section, '.mermaid-frame', 'Mermaid diagram'));
  issues.push(...findOverflowingContainers(section, '.table-element', 'Table'));
  issues.push(...findOverflowingContainers(section, '.code-element pre', 'Code block'));
  issues.push(...findDenseTextBlocks(section, shell.clientHeight));
  issues.push(...findDenseMediaCompositions(section));

  if (issues.length > 0) {
    section.dataset.slideOverflow = 'true';
  } else {
    delete section.dataset.slideOverflow;
  }

  const findings = issues.map(issue => ({
    ...issue,
    code: issue.kind,
    severity: issue.penalty >= 28 ? 'error' : 'warning',
    suggestion: getLayoutSuggestion(issue.kind)
  }));
  const score = calculateFitScore(findings);
  const severity = getFitSeverity(score);
  const recommendations = buildRecommendations(findings);

  section.dataset.fitScore = String(score);
  section.dataset.fitSeverity = severity;

  return {
    slideId: section.id || `slide-${slideIndex + 1}`,
    slideIndex,
    number: section.dataset.slideNumber || '?',
    title: section.dataset.slideTitle || section.id || 'Untitled slide',
    issues: findings,
    warnings,
    score,
    severity,
    overflow: findings.some(issue => issue.code.startsWith('slide-overflow')),
    recommendations
  };
}

function findOverflowingContainers(section, selector, label) {
  const issues = [];

  section.querySelectorAll(selector).forEach(container => {
    const overflowY = Math.ceil(container.scrollHeight - container.clientHeight);
    const overflowX = Math.ceil(container.scrollWidth - container.clientWidth);
    const toleranceY = getOverflowTolerance(container.clientHeight);
    const toleranceX = getOverflowTolerance(container.clientWidth);

    if (overflowY > toleranceY || overflowX > toleranceX) {
      const parts = [];
      if (overflowY > toleranceY) {
        parts.push(`${overflowY}px vertically`);
      }
      if (overflowX > toleranceX) {
        parts.push(`${overflowX}px horizontally`);
      }
      issues.push(createIssue(`${toIssueKey(label)}-overflow`, `${label} exceeds its frame by ${parts.join(' and ')}.`, 18));
    }
  });

  return issues;
}

function findDenseTextBlocks(section, slideHeight) {
  const issues = [];
  const blocks = section.querySelectorAll('.text-element, .bullet-list, .callout-content');

  blocks.forEach((block, index) => {
    const lineCount = estimateLineCount(block);
    const height = block.getBoundingClientRect().height;

    if (lineCount >= 12 || height > slideHeight * 0.45) {
      issues.push(createIssue('dense-text', `Text block ${index + 1} is dense (${lineCount} lines).`, 12));
    }
  });

  return issues.slice(0, 2);
}

function findDenseMediaCompositions(section) {
  const issues = [];
  const groups = section.querySelectorAll('.slide-content, .column-left, .column-right');

  groups.forEach((group, index) => {
    const children = Array.from(group.children);
    const mediaBlocks = children.filter(child =>
      child.classList.contains('image-element') ||
      child.classList.contains('mermaid-element') ||
      child.classList.contains('code-element') ||
      child.classList.contains('table-element')
    );

    if (mediaBlocks.length === 0) {
      return;
    }

    const totalHeight = children.reduce((sum, child) => sum + child.getBoundingClientRect().height, 0);
    const mediaHeight = mediaBlocks.reduce((sum, child) => sum + child.getBoundingClientRect().height, 0);
    const groupHeight = group.clientHeight || group.getBoundingClientRect().height;

    if (mediaBlocks.length >= 2 && mediaHeight > groupHeight * 0.68) {
      issues.push(createIssue('dense-media', `Content area ${index + 1} is visually dense: multiple media blocks dominate the slide.`, 24));
    } else if (children.length >= 5 && totalHeight > groupHeight * 0.9) {
      issues.push(createIssue('dense-media', `Content area ${index + 1} is visually dense and may read as crowded.`, 18));
    }
  });

  return issues.slice(0, 1);
}

function estimateLineCount(element) {
  const computed = window.getComputedStyle(element);
  const lineHeight = Number.parseFloat(computed.lineHeight);

  if (!Number.isFinite(lineHeight) || lineHeight <= 0) {
    return 0;
  }

  return Math.round(element.getBoundingClientRect().height / lineHeight);
}

function getOverflowTolerance(size) {
  return Math.max(8, Math.round(size * 0.05));
}

function updateResponsiveMediaLayout() {
  document.querySelectorAll('.image-element').forEach(updateResponsiveImageLayout);
  document.querySelectorAll('.mermaid-element, .code-element, .table-element').forEach(updateResponsiveMediaBudget);
}

function updateResponsiveImageLayout(figure) {
  const frame = figure.querySelector('.image-frame');
  const img = figure.querySelector('img');

  if (!frame || !img || !img.naturalWidth || !img.naturalHeight) {
    return;
  }

  const { width: availableWidth, height: availableHeight } = measureAvailableSpace(figure);
  const requestedWidth = parseRequestedSize(frame.dataset.requestedWidth, availableWidth);
  const requestedHeight = parseRequestedSize(frame.dataset.requestedHeight, availableHeight);

  let targetWidth = requestedWidth ?? img.naturalWidth;
  let targetHeight = requestedHeight ?? img.naturalHeight;

  if (requestedWidth !== null && requestedHeight === null) {
    targetHeight = img.naturalHeight * (targetWidth / img.naturalWidth);
  } else if (requestedWidth === null && requestedHeight !== null) {
    targetWidth = img.naturalWidth * (targetHeight / img.naturalHeight);
  }

  const scale = Math.min(
    1,
    availableWidth / targetWidth,
    availableHeight / targetHeight
  );

  const displayWidth = Math.max(1, Math.round(targetWidth * scale));
  const displayHeight = Math.max(1, Math.round(targetHeight * scale));

  frame.style.width = `${displayWidth}px`;
  frame.style.height = `${displayHeight}px`;
  frame.style.setProperty('--image-frame-max-height', `${displayHeight}px`);

  img.style.width = `${displayWidth}px`;
  img.style.height = `${displayHeight}px`;
}

function updateResponsiveMediaBudget(element) {
  const target = element.classList.contains('mermaid-element')
    ? element.querySelector('.mermaid-frame')
    : element.matches('.code-element, .table-element')
      ? element
      : null;

  if (!target) {
    return;
  }

  const { height } = measureAvailableSpace(element);
  target.style.setProperty('--media-frame-max-height', `${height}px`);
  target.style.setProperty('--media-svg-max-height', `${Math.max(160, height - 24)}px`);
}

function measureAvailableSpace(element) {
  const parent = element.parentElement;

  if (!parent) {
    return { width: 0, height: 0 };
  }

  const styles = window.getComputedStyle(parent);
  const gap = Number.parseFloat(styles.rowGap || styles.gap) || 0;
  const siblings = Array.from(parent.children).filter(child => child !== element);
  const occupiedHeight = siblings.reduce((sum, child) => sum + child.getBoundingClientRect().height, 0);

  return {
    width: Math.max(160, parent.clientWidth),
    height: Math.max(180, parent.clientHeight - occupiedHeight - gap * siblings.length)
  };
}

function parseRequestedSize(value, reference) {
  if (!value || value === 'auto') {
    return null;
  }

  if (value.endsWith('%')) {
    const percent = Number.parseFloat(value);
    return Number.isFinite(percent) ? reference * (percent / 100) : null;
  }

  if (value.endsWith('px')) {
    const pixels = Number.parseFloat(value);
    return Number.isFinite(pixels) ? pixels : null;
  }

  const numeric = Number.parseFloat(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function renderLayoutAudit(controls, issues, allSlideAudits) {
  const { button, summary, list } = controls;

  if (issues.length === 0) {
    button.hidden = true;
    button.textContent = 'Presentation Audit';
    summary.textContent = 'No layout issues or author warnings detected.';
    list.innerHTML = '';
    publishPresentationAudit(allSlideAudits);
    return;
  }

  const issueCount = issues.filter(issue => issue.issues.length > 0).length;
  const warningCount = issues.filter(issue => issue.warnings.length > 0).length;
  const worstScore = issueCount > 0 ? Math.min(...issues.map(issue => issue.score)) : 100;
  button.hidden = presentationModeEnabled || !warningsVisible || presentationRole === 'audience';
  button.textContent = `${issues.length} Slide${issues.length === 1 ? ' Needs' : 's Need'} Review`;
  summary.textContent = buildAuditSummary(issueCount, warningCount, worstScore);

  list.innerHTML = issues.map(issue => `
    <div class="layout-audit-item">
      <strong>Slide ${escapeHtml(issue.number)}: ${escapeHtml(issue.title)}</strong>
      <div class="layout-audit-meta">
        <span class="layout-audit-score layout-audit-score-${issue.severity}">Fit ${issue.score}</span>
        <span class="layout-audit-severity">${escapeHtml(issue.severity)}</span>
        ${issue.warnings.length > 0 ? `<span class="layout-audit-warning-badge">${issue.warnings.length} warning${issue.warnings.length === 1 ? '' : 's'}</span>` : ''}
      </div>
      ${issue.recommendations.length > 0 ? `
        <p class="layout-audit-recommendation">${escapeHtml(issue.recommendations[0])}</p>
      ` : ''}
      ${issue.issues.length > 0 ? `
        <p class="layout-audit-section-title">Layout findings</p>
        ${renderAuditFindings(issue.issues)}
      ` : ''}
      ${issue.warnings.length > 0 ? `
        <p class="layout-audit-section-title">Author warnings</p>
        ${renderAuditFindings(issue.warnings)}
      ` : ''}
    </div>
  `).join('');

  publishPresentationAudit(allSlideAudits);
}

function buildAuditSummary(issueCount, warningCount, worstScore) {
  if (issueCount === 0) {
    return `${warningCount} slide${warningCount === 1 ? ' has' : 's have'} author warnings. No blocking layout issues detected.`;
  }

  const issueText = `${issueCount} slide${issueCount === 1 ? ' needs' : ' need'} layout changes`;
  const warningText = warningCount > 0
    ? ` ${warningCount} slide${warningCount === 1 ? ' has' : 's have'} author warnings.`
    : '';

  return `${issueText}.${warningText} Worst fit score: ${worstScore}/100.`;
}

function getLayoutSuggestion(code) {
  const suggestions = {
    'slide-overflow-vertical': 'Reduce total content height or move one block to a new slide.',
    'slide-overflow-horizontal': 'Narrow wide content, shorten long strings, or switch to a more suitable layout.',
    'mermaid-diagram-overflow': 'Simplify the Mermaid diagram or dedicate a full slide to it.',
    'table-overflow': 'Reduce the number of rows or columns, or summarize the table.',
    'code-block-overflow': 'Trim the code sample or move details to an appendix slide.',
    'dense-text': 'Shorten the copy, reduce bullets, or split the narrative across slides.',
    'dense-media': 'Reduce one media block or give the largest visual its own slide.'
  };

  return suggestions[code] || 'Adjust this slide so the content fits more comfortably.';
}

function renderAuditFindings(findings) {
  return `<ul>
    ${findings.map(finding => `
      <li class="layout-audit-finding">
        <span class="layout-audit-code">${escapeHtml(finding.code)}</span>
        <span class="layout-audit-message">${escapeHtml(finding.message)}</span>
        ${finding.suggestion ? `<span class="layout-audit-hint">${escapeHtml(finding.suggestion)}</span>` : ''}
      </li>
    `).join('')}
  </ul>`;
}

function publishPresentationValidation(result) {
  latestPresentationValidation = {
    presentationPath,
    generatedAt: new Date().toISOString(),
    valid: result.valid,
    summary: {
      errorCount: result.errors?.length || 0,
      warningCount: result.warnings.length
    },
    errors: result.errors || [],
    warnings: result.warnings
  };

  window.__presentationValidation = latestPresentationValidation;
  publishPresentationState();
  publishAgentReport();
}

function publishPresentationAudit(issues) {
  const summary = {
    slideCount: issues.length,
    layoutIssueCount: issues.filter(issue => issue.issues.length > 0).length,
    warningSlideCount: issues.filter(issue => issue.warnings.length > 0).length,
    worstFitScore: issues.length > 0 ? Math.min(...issues.map(issue => issue.score)) : 100
  };

  latestPresentationAudit = {
    presentationPath,
    generatedAt: new Date().toISOString(),
    summary,
    slides: issues.map(issue => ({
      slideId: issue.slideId,
      slideIndex: issue.slideIndex,
      slideNumber: issue.number,
      title: issue.title,
      fitScore: issue.score,
      fitSeverity: issue.severity,
      overflow: issue.overflow,
      recommendations: issue.recommendations,
      layoutFindings: issue.issues,
      authorWarnings: issue.warnings
    }))
  };

  window.__presentationAudit = latestPresentationAudit;
  publishPresentationState();
  publishAgentReport();
  window.dispatchEvent(new CustomEvent('presentation-audit-updated', {
    detail: latestPresentationAudit
  }));
}

function publishAgentReport() {
  window.__presentationAgentReport = {
    presentationPath,
    role: presentationRole,
    mode: window.__presentationMode,
    validation: latestPresentationValidation,
    audit: latestPresentationAudit
  };
}

function publishPresentationState() {
  window.__presentationMode = {
    enabled: presentationModeEnabled,
    mode: presentationModeEnabled ? 'presentation' : 'authoring',
    warningsVisible
  };
}

function getInitialPresentationMode() {
  if (presentationRole === 'audience') {
    return true;
  }

  const mode = params.get('mode');
  if (mode === 'present' || mode === 'presentation') {
    return true;
  }
  if (mode === 'author' || mode === 'authoring') {
    return false;
  }

  return window.localStorage.getItem(PRESENTATION_MODE_STORAGE_KEY) === 'presentation';
}

function getInitialWarningsVisibility() {
  if (presentationRole === 'audience') {
    return false;
  }

  const warnings = params.get('warnings');
  if (warnings === 'off' || warnings === 'hidden') {
    return false;
  }
  if (warnings === 'on' || warnings === 'visible') {
    return true;
  }

  const stored = window.localStorage.getItem(WARNINGS_VISIBILITY_STORAGE_KEY);
  return stored !== 'hidden';
}

function getPresentationRole() {
  const role = params.get('role');
  return role === 'audience' ? 'audience' : 'controller';
}

function setupPresentationSync(reveal) {
  if (!window.BroadcastChannel) {
    return;
  }

  const channelName = `agentic-presentation-sync:${presentationPath}`;
  presentationSyncChannel = new BroadcastChannel(channelName);

  if (presentationRole === 'audience') {
    presentationSyncChannel.addEventListener('message', event => {
      const payload = event.data;
      if (payload?.type !== 'state' || !payload.state) {
        return;
      }

      if (typeof reveal.setState === 'function') {
        reveal.setState(payload.state);
        return;
      }

      reveal.slide(payload.state.indexh, payload.state.indexv, payload.state.indexf);
    });
    return;
  }

  const broadcastState = () => {
    presentationSyncChannel.postMessage({
      type: 'state',
      state: reveal.getState()
    });
  };

  reveal.on('ready', broadcastState);
  reveal.on('slidechanged', broadcastState);
  reveal.on('fragmentshown', broadcastState);
  reveal.on('fragmenthidden', broadcastState);
  broadcastState();
}

function indexWarningsBySlide(warnings) {
  return warnings.reduce((map, warning) => {
    const match = warning.path.match(/\/presentation\/slides\/(\d+)/);
    if (!match) {
      return map;
    }

    const slideIndex = Number.parseInt(match[1], 10);
    const existing = map.get(slideIndex) || [];
    existing.push(warning);
    map.set(slideIndex, existing);
    return map;
  }, new Map());
}

function escapeHtml(text) {
  if (!text) {
    return '';
  }

  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    '\'': '&#039;'
  };

  return text.replace(/[&<>"']/g, match => map[match]);
}

// Load presentation when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadAndRenderPresentation);
} else {
  loadAndRenderPresentation();
}

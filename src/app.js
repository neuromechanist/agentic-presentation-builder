/**
 * Client-side application
 * Loads presentation JSON, builds it, and initializes Reveal.js
 */

import Reveal from 'reveal.js';
import RevealNotes from 'reveal.js/plugin/notes/notes.esm.js';
import mermaid from 'mermaid';
import Prism from 'prismjs';
import { buildPresentation } from './index-browser.js';

// Import Prism languages
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markup';

// Get presentation path from URL parameter or default to hello-world
const params = new URLSearchParams(window.location.search);
const presentationPath = params.get('presentation') || './examples/hello-world.json';

/**
 * Load and render presentation
 */
async function loadAndRenderPresentation() {
  try {
    // Show loading indicator
    document.getElementById('loading').style.display = 'flex';

    // Fetch presentation JSON
    const response = await fetch(presentationPath);
    if (!response.ok) {
      throw new Error(`Failed to load presentation: ${response.statusText}`);
    }

    const presentationData = await response.json();

    // Build presentation
    const built = buildPresentation(presentationData);

    // Update document title
    document.title = built.metadata.title || 'Presentation';

    // Inject theme CSS
    const styleEl = document.createElement('style');
    styleEl.textContent = built.themeCSS;
    document.head.appendChild(styleEl);

    // Inject slides HTML
    const slidesContainer = document.querySelector('.reveal .slides');
    slidesContainer.innerHTML = built.slidesHTML;

    // Hide loading indicator
    document.getElementById('loading').style.display = 'none';

    // Initialize Mermaid
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
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

    // Get controls from metadata
    const controls = built.metadata.controls || {
      slideNumbers: false,
      progress: true,
      showNotes: false
    };

    // Initialize Reveal.js
    await Reveal.initialize({
      hash: true,
      controls: true,
      progress: controls.progress,
      center: false,
      transition: 'slide',
      slideNumber: controls.slideNumbers ? 'c/t' : false,
      showNotes: controls.showNotes,
      width: built.dimensions.width,
      height: built.dimensions.height,
      margin: 0.04,
      minScale: 0.3,
      maxScale: 1.5,
      // Overview mode configuration
      overview: true,
      plugins: [RevealNotes]
    });

    // Render Mermaid diagrams
    await mermaid.run({
      querySelector: '.mermaid'
    });

    // Highlight code blocks
    Prism.highlightAll();

    // Create keyboard shortcuts help overlay
    createShortcutsHelp();

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
 * Create keyboard shortcuts help button and overlay
 */
function createShortcutsHelp() {
  const shortcuts = [
    { key: 'S', description: 'Speaker notes (popup)' },
    { key: 'O', description: 'Slide overview' },
    { key: 'F', description: 'Fullscreen' },
    { key: 'Esc', description: 'Exit overview / pause' },
    { key: '\u2190 \u2192', description: 'Navigate slides' },
    { key: 'Home', description: 'First slide' },
    { key: 'End', description: 'Last slide' },
    { key: 'B / .', description: 'Blackout screen' },
    { key: '?', description: 'Toggle this help' },
  ];

  // Build overlay HTML
  const overlay = document.createElement('div');
  overlay.id = 'shortcuts-overlay';
  overlay.innerHTML = `
    <div class="shortcuts-panel">
      <h3>Keyboard Shortcuts</h3>
      <dl>
        ${shortcuts.map(s => `
          <div class="shortcut-row">
            <dt><kbd>${s.key}</kbd></dt>
            <dd>${s.description}</dd>
          </div>
        `).join('')}
      </dl>
      <p class="shortcuts-dismiss">Press <kbd>?</kbd> or <kbd>Esc</kbd> to close</p>
    </div>
  `;
  document.body.appendChild(overlay);

  // Help button
  const btn = document.createElement('button');
  btn.id = 'shortcuts-btn';
  btn.setAttribute('aria-label', 'Keyboard shortcuts');
  btn.textContent = '?';
  document.body.appendChild(btn);

  // Toggle logic
  function toggle() {
    const visible = overlay.classList.toggle('visible');
    btn.classList.toggle('active', visible);
  }

  function hide() {
    overlay.classList.remove('visible');
    btn.classList.remove('active');
  }

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggle();
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) hide();
  });

  // Keyboard: ? to toggle, Esc to close
  document.addEventListener('keydown', (e) => {
    if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      e.stopPropagation();
      toggle();
    } else if (e.key === 'Escape' && overlay.classList.contains('visible')) {
      hide();
    }
  }, true);
}

// Load presentation when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadAndRenderPresentation);
} else {
  loadAndRenderPresentation();
}

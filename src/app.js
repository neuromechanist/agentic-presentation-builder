/**
 * Client-side application
 * Loads presentation JSON, builds it, and initializes Reveal.js
 */

import Reveal from 'reveal.js';
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
      overviewSeparator: 1.5,
      overviewScale: 0.2,
      overviewTransition: 'slide'
    });

    // Render Mermaid diagrams
    await mermaid.run({
      querySelector: '.mermaid'
    });

    // Highlight code blocks
    Prism.highlightAll();

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

// Load presentation when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadAndRenderPresentation);
} else {
  loadAndRenderPresentation();
}

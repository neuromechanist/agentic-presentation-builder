/**
 * Client-side application
 * Loads presentation JSON, builds it, and initializes Reveal.js
 */

import Reveal from 'reveal.js';
import mermaid from 'mermaid';
import { buildPresentation } from './index-browser.js';

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
        curve: 'basis'
      }
    });

    // Initialize Reveal.js
    await Reveal.initialize({
      hash: true,
      controls: true,
      progress: true,
      center: false,
      transition: 'slide',
      slideNumber: 'c/t',
      width: built.dimensions.width,
      height: built.dimensions.height,
      margin: 0.04,
      minScale: 0.3,
      maxScale: 1.5
    });

    // Render Mermaid diagrams
    await mermaid.run({
      querySelector: '.mermaid'
    });

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

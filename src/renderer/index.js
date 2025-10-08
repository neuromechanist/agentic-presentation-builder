/**
 * HTML Renderer
 * Converts parsed presentation object to Reveal.js HTML
 */

import { markdownToHtml } from '../utils/markdown-browser.js';

/**
 * Render presentation to HTML
 * @param {object} presentation - Parsed presentation object
 * @returns {string} HTML string
 */
export function renderPresentation(presentation) {
  const slides = presentation.slides
    .map(slide => renderSlide(slide))
    .join('\n');

  return slides;
}

/**
 * Render a single slide
 * @param {object} slide - Slide object
 * @returns {string} HTML string
 */
function renderSlide(slide) {
  const bgAttr = slide.background ? ` data-background="${escapeHtml(slide.background)}"` : '';
  const transitionAttr = slide.transition !== 'slide' ? ` data-transition="${slide.transition}"` : '';

  // Group elements by position area and sort by order
  const elementsByArea = groupElementsByArea(slide.elements);

  // Render based on layout
  let slideContent;
  switch (slide.layout) {
    case 'two-column':
      slideContent = renderTwoColumnLayout(elementsByArea);
      break;
    case 'title':
      slideContent = renderTitleLayout(elementsByArea);
      break;
    case 'blank':
      slideContent = renderBlankLayout(elementsByArea);
      break;
    case 'single-column':
    default:
      slideContent = renderSingleColumnLayout(elementsByArea);
  }

  return `<section id="${slide.id}"${bgAttr}${transitionAttr}>\n${slideContent}\n</section>`;
}

/**
 * Group elements by position area and sort by order
 * @param {Array} elements - Array of elements
 * @returns {object} Elements grouped by area
 */
function groupElementsByArea(elements) {
  const grouped = {};

  elements.forEach(element => {
    const area = element.position.area;
    if (!grouped[area]) {
      grouped[area] = [];
    }
    grouped[area].push(element);
  });

  // Sort each area by order
  Object.keys(grouped).forEach(area => {
    grouped[area].sort((a, b) => a.position.order - b.position.order);
  });

  return grouped;
}

/**
 * Render single column layout
 */
function renderSingleColumnLayout(elementsByArea) {
  const parts = [];

  if (elementsByArea.header) {
    parts.push('<div class="slide-header">');
    parts.push(elementsByArea.header.map(renderElement).join('\n'));
    parts.push('</div>');
  }

  if (elementsByArea.center) {
    parts.push('<div class="title-slide-content">');
    parts.push(elementsByArea.center.map(renderElement).join('\n'));
    parts.push('</div>');
  }

  if (elementsByArea.content) {
    parts.push('<div class="slide-content">');
    parts.push(elementsByArea.content.map(renderElement).join('\n'));
    parts.push('</div>');
  }

  if (elementsByArea.footer) {
    parts.push('<div class="slide-footer">');
    parts.push(elementsByArea.footer.map(renderElement).join('\n'));
    parts.push('</div>');
  }

  return parts.join('\n');
}

/**
 * Render two column layout
 */
function renderTwoColumnLayout(elementsByArea) {
  const parts = [];

  if (elementsByArea.header) {
    parts.push('<div class="slide-header">');
    parts.push(elementsByArea.header.map(renderElement).join('\n'));
    parts.push('</div>');
  }

  parts.push('<div class="two-column-layout">');

  if (elementsByArea.left) {
    parts.push('<div class="column-left">');
    parts.push(elementsByArea.left.map(renderElement).join('\n'));
    parts.push('</div>');
  }

  if (elementsByArea.right) {
    parts.push('<div class="column-right">');
    parts.push(elementsByArea.right.map(renderElement).join('\n'));
    parts.push('</div>');
  }

  parts.push('</div>');

  if (elementsByArea.footer) {
    parts.push('<div class="slide-footer">');
    parts.push(elementsByArea.footer.map(renderElement).join('\n'));
    parts.push('</div>');
  }

  return parts.join('\n');
}

/**
 * Render title layout
 */
function renderTitleLayout(elementsByArea) {
  const parts = ['<div class="title-slide-content">'];

  if (elementsByArea.center) {
    parts.push(elementsByArea.center.map(renderElement).join('\n'));
  }

  parts.push('</div>');
  return parts.join('\n');
}

/**
 * Render blank layout
 */
function renderBlankLayout(elementsByArea) {
  const allElements = [];

  Object.values(elementsByArea).forEach(elements => {
    allElements.push(...elements);
  });

  return allElements.map(renderElement).join('\n');
}

/**
 * Render an element based on type
 * @param {object} element - Element object
 * @returns {string} HTML string
 */
function renderElement(element) {
  switch (element.type) {
    case 'text':
      return renderTextElement(element);
    case 'bullets':
      return renderBulletsElement(element);
    case 'image':
      return renderImageElement(element);
    case 'mermaid':
      return renderMermaidElement(element);
    case 'callout':
      return renderCalloutElement(element);
    default:
      return '';
  }
}

/**
 * Render text element
 */
function renderTextElement(element) {
  const html = markdownToHtml(element.content);
  const styleAttr = buildStyleAttribute(element.style);

  return `<div class="text-element ${getSizeClass(element.style.fontSize)}" ${styleAttr}>${html}</div>`;
}

/**
 * Render bullets element
 */
function renderBulletsElement(element) {
  const listType = element.bulletStyle === 'number' ? 'ol' : 'ul';
  const listClass = `bullet-list style-${element.bulletStyle}`;
  const styleAttr = buildStyleAttribute(element.style);

  const items = element.items.map(item => {
    if (typeof item === 'string') {
      return `<li>${markdownToHtml(item)}</li>`;
    } else {
      // Nested bullet
      const childrenHtml = item.children
        ? `<ul>${item.children.map(child => `<li>${markdownToHtml(child)}</li>`).join('')}</ul>`
        : '';
      return `<li>${markdownToHtml(item.text)}${childrenHtml}</li>`;
    }
  }).join('\n');

  return `<${listType} class="${listClass} ${getSizeClass(element.style.fontSize)}" ${styleAttr}>\n${items}\n</${listType}>`;
}

/**
 * Render image element
 */
function renderImageElement(element) {
  const src = escapeHtml(element.src);
  const alt = escapeHtml(element.alt);
  const widthStyle = element.width !== 'auto' ? `width: ${element.width};` : '';
  const heightStyle = element.height !== 'auto' ? `height: ${element.height};` : '';
  const style = widthStyle || heightStyle ? ` style="${widthStyle}${heightStyle}"` : '';

  let html = `<div class="image-element">`;
  html += `<img src="${src}" alt="${alt}"${style}>`;

  if (element.caption) {
    html += `<div class="image-caption">${markdownToHtml(element.caption)}</div>`;
  }

  html += `</div>`;
  return html;
}

/**
 * Render mermaid element
 */
function renderMermaidElement(element) {
  // Don't escape - Mermaid.js needs raw diagram syntax
  const diagram = element.diagram;

  return `<div class="mermaid-element">
  <div class="mermaid">
${diagram}
  </div>
</div>`;
}

/**
 * Render callout element
 */
function renderCalloutElement(element) {
  const calloutType = element.calloutType || 'info';
  const content = markdownToHtml(element.content);

  let html = `<div class="callout callout-${calloutType}">`;

  if (element.title) {
    html += `<div class="callout-title">${escapeHtml(element.title)}</div>`;
  }

  html += `<div class="callout-content">${content}</div>`;
  html += `</div>`;

  return html;
}

/**
 * Build style attribute from style object
 */
function buildStyleAttribute(style) {
  const styles = [];

  if (style.alignment && style.alignment !== 'left') {
    styles.push(`text-align: ${style.alignment}`);
  }

  if (style.color) {
    styles.push(`color: ${style.color}`);
  }

  if (style.fontWeight && style.fontWeight !== 'normal') {
    const weight = style.fontWeight === 'bold' ? '700' : style.fontWeight === 'light' ? '300' : '400';
    styles.push(`font-weight: ${weight}`);
  }

  return styles.length > 0 ? `style="${styles.join('; ')}"` : '';
}

/**
 * Get CSS class for font size
 */
function getSizeClass(fontSize) {
  return `size-${fontSize}`;
}

/**
 * Escape HTML
 */
function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

export default {
  renderPresentation
};

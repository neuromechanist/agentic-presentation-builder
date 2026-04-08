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
  const total = presentation.slides.length;
  const slides = presentation.slides
    .map((slide, index) => renderSlide(slide, index, total))
    .join('\n');

  return slides;
}

/**
 * Render a single slide
 * @param {object} slide - Slide object
 * @param {number} index - Slide index for numbering
 * @param {number} total - Total number of slides
 * @returns {string} HTML string
 */
function renderSlide(slide, index, total) {
  const bgAttr = slide.background ? ` data-background="${escapeHtml(slide.background)}"` : '';
  const transitionAttr = slide.transition !== 'slide' ? ` data-transition="${slide.transition}"` : '';
  const layoutAttr = ` data-layout="${escapeHtml(slide.layout)}"`;

  // Add slide number and title data attributes for overview mode
  const slideNumber = index + 1;
  const slideNumberAttr = ` data-slide-number="${slideNumber}"`;
  const slideTitleAttr = slide.title ? ` data-slide-title="${escapeHtml(slide.title)}"` : '';

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

  // Add speaker notes if present
  if (slide.speakerNotes) {
    slideContent += `\n<aside class="notes">${escapeHtml(slide.speakerNotes)}</aside>`;
  }

  return `<section id="${slide.id}"${bgAttr}${transitionAttr}${layoutAttr}${slideNumberAttr}${slideTitleAttr}>\n<div class="slide-shell">\n${slideContent}\n</div>\n</section>`;
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
    case 'code':
      return renderCodeElement(element);
    case 'table':
      return renderTableElement(element);
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
  const animation = buildAnimationAttributes(element.animation);

  const classes = ['text-element', getSizeClass(element.style.fontSize), ...animation.classes].join(' ');
  const attrs = [styleAttr, animation.attributes].filter(a => a).join(' ');

  return `<div class="${classes}" ${attrs}>${html}</div>`;
}

/**
 * Render bullets element
 */
function renderBulletsElement(element) {
  const listType = element.bulletStyle === 'number' ? 'ol' : 'ul';
  const styleAttr = buildStyleAttribute(element.style);
  const animation = buildAnimationAttributes(element.animation);

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

  const classes = ['bullet-list', `style-${element.bulletStyle}`, getSizeClass(element.style.fontSize), ...animation.classes].join(' ');
  const attrs = [styleAttr, animation.attributes].filter(a => a).join(' ');

  return `<${listType} class="${classes}" ${attrs}>\n${items}\n</${listType}>`;
}

/**
 * Render image element
 */
function renderImageElement(element) {
  const src = escapeHtml(element.src);
  const alt = escapeHtml(element.alt);
  const widthStyle = element.width !== 'auto' ? `width: ${element.width};` : '';
  const heightStyle = element.height !== 'auto' ? `height: ${element.height};` : '';
  const frameStyle = widthStyle || heightStyle ? ` style="${widthStyle}${heightStyle}"` : '';
  const animation = buildAnimationAttributes(element.animation);
  const widthMode = element.width === 'auto' ? 'auto' : 'fixed';
  const heightMode = element.height === 'auto' ? 'auto' : 'fixed';
  const sizingMode = widthMode === 'auto' && heightMode === 'auto'
    ? 'natural'
    : widthMode === 'auto'
      ? 'height-driven'
      : heightMode === 'auto'
        ? 'width-driven'
        : 'bounded';

  const classes = ['image-element', ...animation.classes].join(' ');
  const attrs = animation.attributes ? ` ${animation.attributes}` : '';

  let html = `<figure class="${classes}" data-image-sizing="${sizingMode}"${attrs}>`;
  html += `<div class="image-frame" data-width-mode="${widthMode}" data-height-mode="${heightMode}" data-requested-width="${escapeHtml(element.width)}" data-requested-height="${escapeHtml(element.height)}"${frameStyle}>`;
  html += `<img src="${src}" alt="${alt}" loading="lazy" decoding="async">`;
  html += `</div>`;

  if (element.caption) {
    html += `<figcaption class="image-caption">${markdownToHtml(element.caption)}</figcaption>`;
  }

  html += `</figure>`;
  return html;
}

/**
 * Render mermaid element
 */
function renderMermaidElement(element) {
  // Don't escape - Mermaid.js needs raw diagram syntax
  const diagram = element.diagram;
  const animation = buildAnimationAttributes(element.animation);

  const classes = ['mermaid-element', ...animation.classes].join(' ');
  const attrs = animation.attributes ? ` ${animation.attributes}` : '';

  return `<div class="${classes}"${attrs}>
  <div class="mermaid-frame">
    <div class="mermaid" data-mermaid-theme="${escapeHtml(element.theme || 'default')}">
${diagram}
    </div>
  </div>
</div>`;
}

/**
 * Render callout element
 */
function renderCalloutElement(element) {
  const calloutType = element.calloutType || 'info';
  const content = markdownToHtml(element.content);
  const animation = buildAnimationAttributes(element.animation);

  const classes = ['callout', `callout-${calloutType}`, ...animation.classes].join(' ');
  const attrs = animation.attributes ? ` ${animation.attributes}` : '';

  let html = `<div class="${classes}"${attrs}>`;

  if (element.title) {
    html += `<div class="callout-title">${escapeHtml(element.title)}</div>`;
  }

  html += `<div class="callout-content">${content}</div>`;
  html += `</div>`;

  return html;
}

/**
 * Render code element
 */
function renderCodeElement(element) {
  const code = escapeHtml(element.code);
  const language = element.language || 'javascript';
  const animation = buildAnimationAttributes(element.animation);

  const classes = ['code-element', ...animation.classes].join(' ');
  const attrs = animation.attributes ? ` ${animation.attributes}` : '';

  let html = `<div class="${classes}"${attrs}>`;

  if (element.caption) {
    html += `<div class="code-caption">${escapeHtml(element.caption)}</div>`;
  }

  // Use pre/code with language class for syntax highlighting
  html += `<pre${element.lineNumbers ? ' class="line-numbers"' : ''}><code class="language-${language}">${code}</code></pre>`;

  html += `</div>`;
  return html;
}

/**
 * Render table element
 */
function renderTableElement(element) {
  const animation = buildAnimationAttributes(element.animation);

  const classes = ['table-element', ...animation.classes].join(' ');
  const attrs = animation.attributes ? ` ${animation.attributes}` : '';

  let html = `<div class="${classes}"${attrs}>`;

  if (element.caption) {
    html += `<div class="table-caption">${escapeHtml(element.caption)}</div>`;
  }

  html += '<table><thead><tr>';
  element.headers.forEach(header => {
    html += `<th>${escapeHtml(header)}</th>`;
  });
  html += '</tr></thead><tbody>';

  element.rows.forEach(row => {
    html += '<tr>';
    row.forEach(cell => {
      html += `<td>${escapeHtml(cell)}</td>`;
    });
    html += '</tr>';
  });

  html += '</tbody></table>';
  html += `</div>`;
  return html;
}

/**
 * Build animation classes and attributes for an element
 * @param {object} animation - Animation object
 * @returns {object} Object with classes and attributes
 */
function buildAnimationAttributes(animation) {
  if (!animation || animation.type === 'none') {
    return { classes: [], attributes: '' };
  }

  const classes = [];
  const attributes = [];

  // Add fragment class if enabled
  if (animation.fragment) {
    classes.push('fragment');

    // Map animation type to Reveal.js fragment animation classes
    const animationTypeMap = {
      'fade': 'fade-in',
      'slide-up': 'fade-up',
      'slide-down': 'fade-down',
      'zoom': 'zoom-in'
    };

    const revealClass = animationTypeMap[animation.type] || 'fade-in';
    classes.push(revealClass);

    // Add fragment index if specified
    if (animation.index !== undefined) {
      attributes.push(`data-fragment-index="${animation.index}"`);
    }
  }

  return {
    classes,
    attributes: attributes.join(' ')
  };
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

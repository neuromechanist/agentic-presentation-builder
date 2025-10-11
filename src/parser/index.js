/**
 * Parser module - Converts validated JSON to presentation object
 */

/**
 * Parse presentation JSON into structured object
 * @param {object} presentationData - Validated presentation JSON
 * @returns {object} Parsed presentation object
 */
export function parsePresentation(presentationData) {
  const { metadata, slides } = presentationData.presentation;

  return {
    metadata: parseMetadata(metadata),
    slides: slides.map((slide, index) => parseSlide(slide, index))
  };
}

/**
 * Parse metadata
 * @param {object} metadata - Metadata object
 * @returns {object} Parsed metadata
 */
function parseMetadata(metadata) {
  return {
    title: metadata.title,
    author: metadata.author || '',
    description: metadata.description || '',
    theme: metadata.theme || 'default',
    aspectRatio: metadata.aspectRatio || '16:9',
    controls: metadata.controls || {
      slideNumbers: false,
      progress: true,
      showNotes: false
    },
    customTheme: metadata.customTheme || null
  };
}

/**
 * Parse individual slide
 * @param {object} slide - Slide object
 * @param {number} index - Slide index
 * @returns {object} Parsed slide
 */
function parseSlide(slide, index) {
  return {
    id: slide.id || `slide-${index}`,
    layout: slide.layout || 'single-column',
    background: slide.background || null,
    transition: slide.transition || 'slide',
    speakerNotes: slide.speakerNotes || null,
    elements: slide.elements.map((element, elemIndex) =>
      parseElement(element, elemIndex)
    )
  };
}

/**
 * Parse element based on type
 * @param {object} element - Element object
 * @param {number} index - Element index
 * @returns {object} Parsed element
 */
function parseElement(element, index) {
  const baseElement = {
    type: element.type,
    position: parsePosition(element.position),
    animation: element.animation || null,
    id: `element-${index}`
  };

  switch (element.type) {
    case 'text':
      return {
        ...baseElement,
        content: element.content,
        style: parseTextStyle(element.style)
      };

    case 'bullets':
      return {
        ...baseElement,
        items: element.items,
        bulletStyle: element.bulletStyle || 'disc',
        style: parseTextStyle(element.style)
      };

    case 'image':
      return {
        ...baseElement,
        src: element.src,
        alt: element.alt || '',
        width: element.width || 'auto',
        height: element.height || 'auto',
        caption: element.caption || null
      };

    case 'mermaid':
      return {
        ...baseElement,
        diagram: element.diagram,
        theme: element.theme || 'default'
      };

    case 'callout':
      return {
        ...baseElement,
        calloutType: element.calloutType || 'info',
        content: element.content,
        title: element.title || null
      };

    case 'code':
      return {
        ...baseElement,
        code: element.code,
        language: element.language || 'javascript',
        caption: element.caption || null,
        lineNumbers: element.lineNumbers !== false
      };

    case 'table':
      return {
        ...baseElement,
        headers: element.headers,
        rows: element.rows,
        caption: element.caption || null
      };

    default:
      throw new Error(`Unknown element type: ${element.type}`);
  }
}

/**
 * Parse text style
 * @param {object} style - Style object
 * @returns {object} Parsed style
 */
function parseTextStyle(style = {}) {
  return {
    fontSize: style.fontSize || 'medium',
    alignment: style.alignment || 'left',
    color: style.color || null,
    fontWeight: style.fontWeight || 'normal'
  };
}

/**
 * Parse position
 * @param {object} position - Position object
 * @returns {object} Parsed position
 */
function parsePosition(position = {}) {
  return {
    area: position.area || 'content',
    order: position.order || 0
  };
}

export default {
  parsePresentation
};

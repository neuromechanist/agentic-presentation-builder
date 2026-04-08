/**
 * Non-fatal presentation warnings for author feedback.
 * These do not block rendering; they flag likely readability and authoring issues.
 */

const MEDIA_TYPES = new Set(['image', 'mermaid', 'code', 'table']);

export function getPresentationWarnings(presentationData) {
  const slides = presentationData?.presentation?.slides || [];
  const warnings = [];

  slides.forEach((slide, slideIndex) => {
    const elements = slide.elements || [];
    const title = slide.title || slide.id || `slide-${slideIndex + 1}`;
    const pathBase = `/presentation/slides/${slideIndex}`;
    const slideContext = {
      slideId: slide.id || `slide-${slideIndex + 1}`,
      slideIndex,
      slideTitle: title
    };

    const textElements = elements.filter(element => element.type === 'text');
    const bulletElements = elements.filter(element => element.type === 'bullets');
    const mediaElements = elements.filter(element => MEDIA_TYPES.has(element.type));
    const animatedElements = elements.filter(element => element.animation?.fragment);

    const totalWords = textElements.reduce((sum, element) => sum + countWords(element.content), 0);
    const totalBulletItems = bulletElements.reduce((sum, element) => sum + countBulletItems(element.items || []), 0);

    if (totalWords > 60) {
      warnings.push(createWarning(
        'dense-copy',
        `${pathBase}/elements`,
        `Slide copy is dense (${totalWords} words). Consider splitting the narrative or shortening text.`,
        'Split the text across slides or reduce the amount of prose on this slide.',
        slideContext
      ));
    }

    if (totalBulletItems > 6) {
      warnings.push(createWarning(
        'dense-bullets',
        `${pathBase}/elements`,
        `Slide has ${totalBulletItems} bullet items. Consider reducing the list or splitting it across slides.`,
        'Trim the list to the most important points or continue it on a follow-up slide.',
        slideContext
      ));
    }

    if (mediaElements.length >= 2) {
      warnings.push(createWarning(
        'dense-media',
        `${pathBase}/elements`,
        `Slide contains ${mediaElements.length} heavy media blocks. It may feel visually crowded at presentation size.`,
        'Reduce one media block or dedicate a separate slide to the larger visual.',
        slideContext
      ));
    }

    if (mediaElements.length >= 2 && usesFixedPixelImageSizing(elements)) {
      warnings.push(createWarning(
        'fixed-image-sizing',
        `${pathBase}/elements`,
        'Slide mixes multiple media blocks with fixed pixel image sizing. Prefer percentage widths for more predictable slide composition.',
        'Change image width values like `900px` to slide-relative values like `55%` when exact pixel control is not required.',
        slideContext
      ));
    }

    if (animatedElements.length > 5) {
      warnings.push(createWarning(
        'fragment-overuse',
        `${pathBase}/elements`,
        `Slide uses ${animatedElements.length} fragments. Too many sequential reveals can slow the presentation.`,
        'Reduce fragment count or combine adjacent reveals into fewer steps.',
        slideContext
      ));
    }

    elements.forEach((element, elementIndex) => {
      if (element.type === 'image' && !element.alt?.trim()) {
        warnings.push(createWarning(
          'missing-image-alt',
          `${pathBase}/elements/${elementIndex}`,
          'Image is missing alt text. Add a concise description for accessibility and author clarity.',
          'Add an `alt` field describing the image content and its purpose on the slide.',
          slideContext
        ));
      }

      if (element.type === 'mermaid' && countMermaidNodes(element.diagram) > 10) {
        warnings.push(createWarning(
          'complex-mermaid',
          `${pathBase}/elements/${elementIndex}`,
          'Mermaid diagram is complex. Consider simplifying it or dedicating a full slide to the diagram.',
          'Remove lower-priority nodes or move the diagram to a dedicated slide.',
          slideContext
        ));
      }
    });
  });

  return warnings;
}

function createWarning(code, path, message, suggestion, slideContext) {
  return {
    code,
    severity: 'warning',
    path,
    message,
    suggestion,
    ...slideContext
  };
}

function countWords(text = '') {
  return text
    .replace(/[#*_`>\-\n]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .length;
}

function countBulletItems(items) {
  return items.reduce((sum, item) => {
    if (typeof item === 'string') {
      return sum + 1;
    }
    const children = Array.isArray(item.children) ? item.children.length : 0;
    return sum + 1 + children;
  }, 0);
}

function countMermaidNodes(diagram = '') {
  const matches = diagram.match(/\[[^\]]+\]|\([^)]+\)|\{[^}]+\}|>[^\n<]+</g);
  return matches ? matches.length : 0;
}

function usesFixedPixelImageSizing(elements) {
  return elements.some(element =>
    element.type === 'image' &&
    (isPixelSize(element.width) || isPixelSize(element.height))
  );
}

function isPixelSize(value) {
  return typeof value === 'string' && value.endsWith('px');
}

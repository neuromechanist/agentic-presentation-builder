/**
 * Browser HTML renderer.
 * Converts parsed presentation objects to Reveal.js markup using browser markdown utilities.
 */

import { markdownToHtml } from "../utils/markdown-browser.js";
import { createPresentationRenderer } from "./shared.js";

export const { renderPresentation } =
  createPresentationRenderer(markdownToHtml);

export default {
  renderPresentation,
};

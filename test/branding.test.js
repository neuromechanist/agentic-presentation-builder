import test from "node:test";
import assert from "node:assert/strict";
import { parsePresentation } from "../src/parser/index.js";
import { renderPresentation } from "../src/renderer/index.js";

function render(metadata, slides) {
  return renderPresentation(
    parsePresentation({ presentation: { metadata, slides } }),
  );
}

const LOGO = {
  src: "./assets/logos/sccn.svg",
  alt: "SCCN",
  position: "bottom-left",
  margin: "2%",
  size: "7%",
};

const SLIDES = [
  { id: "title", layout: "title", elements: [] },
  { id: "divider", layout: "title", elements: [] },
  {
    id: "content",
    layout: "single-column",
    elements: [
      {
        type: "text",
        content: "## Hi",
        position: { area: "header" },
      },
    ],
  },
];

test("branding overlay is rendered on slides as a fixed corner element", () => {
  const html = render({ title: "Branding", branding: { logo: LOGO } }, SLIDES);
  const matches = html.match(/class="slide-brand"/g) || [];
  assert.equal(matches.length, 3, "one overlay per slide by default");
  assert.match(html, /data-pos="bottom-left"/);
  assert.match(html, /--brand-size:7%/);
  assert.match(html, /--brand-margin:2%/);
  assert.match(html, /src="\.\/assets\/logos\/sccn\.svg"/);
  assert.match(html, /alt="SCCN"/);
  // The overlay must live directly inside the section, not inside slide-shell.
  assert.match(html, /<\/div>\n<div class="slide-brand"[^>]*><img/);
  // The section carries the edge/side so header/footer can inset on the logo side.
  assert.match(html, /<section[^>]*data-brand-edge="bottom"[^>]*data-brand-side="left"/);
});

test("exclude hides the logo by slide id and by layout", () => {
  const html = render(
    {
      title: "Branding",
      branding: { logo: { ...LOGO, exclude: ["title"] } },
    },
    SLIDES,
  );
  // "title" matches the title slide (id) and the divider (layout: title).
  const matches = html.match(/class="slide-brand"/g) || [];
  assert.equal(matches.length, 1, "only the content slide keeps the logo");
});

test("invalid position falls back to bottom-left", () => {
  const html = render(
    { title: "Branding", branding: { logo: { ...LOGO, position: "middle" } } },
    [SLIDES[2]],
  );
  assert.match(html, /data-pos="bottom-left"/);
});

test("opacity is emitted as a CSS variable", () => {
  const html = render(
    { title: "Branding", branding: { logo: { ...LOGO, opacity: 0.9 } } },
    [SLIDES[2]],
  );
  assert.match(html, /--brand-opacity:0\.9/);
});

test("no branding metadata produces no overlay", () => {
  const html = render({ title: "No branding" }, SLIDES);
  assert.doesNotMatch(html, /class="slide-brand"/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createAutoRotate, installAutoRotate } from '../src/utils/auto-rotate.js';
import { validatePresentation } from '../src/validator/index.js';
import { parsePresentation } from '../src/parser/index.js';
import { renderPresentation } from '../src/renderer/index.js';

function clock() { let next = 0; const pending = new Map(); return { pending, setTimer(fn, delay) { pending.set(++next, { fn, delay }); return next; }, clearTimer(id) { pending.delete(id); }, tick() { const [id, item] = pending.entries().next().value; pending.delete(id); item.fn(); } }; }
test('auto rotation is opt-in, reset creates one fresh timer, pause stops it', () => {
  const c = clock(); let count = 0;
  const rotate = createAutoRotate({ advance: () => count++, ...c });
  assert.equal(c.pending.size, 0); rotate.start(); assert.equal(c.pending.size, 1);
  assert.equal([...c.pending.values()][0].delay, 15000);
  rotate.reset(); assert.equal(c.pending.size, 1); c.tick(); assert.equal(count, 1);
  rotate.pause(); assert.equal(c.pending.size, 0);
});
test('video/hidden holds block advancement, resume waits full interval, dispose clears', () => {
  const c = clock(); let held = false, count = 0;
  const rotate = createAutoRotate({ advance: () => count++, blocked: () => held, ...c });
  rotate.start(); held = true; rotate.reset(); assert.equal(c.pending.size, 0);
  assert.equal(rotate.getState().held, true); held = false; rotate.reset();
  assert.equal([...c.pending.values()][0].delay, 15000); c.tick(); assert.equal(count, 1);
  rotate.setInterval(2); assert.equal(rotate.getState().seconds, 5);
  rotate.setInterval(200); assert.equal(rotate.getState().seconds, 120);
  rotate.dispose(); assert.equal(c.pending.size, 0);
});
test('video schema validates and renders explicit click-to-play loop with native controls', () => {
  const deck = { presentation: { metadata: { title:'video', controls:{autoRotate:true,autoRotateInterval:15} }, slides: [{ elements:[{type:'video',src:'demo.mp4',poster:'demo.jpg',loop:true,alt:'Demo',width:'90%',height:'650px'}] }] } };
  assert.equal(validatePresentation(deck).valid, true);
  const html = renderPresentation(parsePresentation(deck));
  assert.match(html, /<video data-ignore playsinline preload="metadata" controls loop/);
  assert.doesNotMatch(html, /autoplay/); assert.match(html, /aria-label="Demo"/);
  deck.presentation.metadata.controls.autoRotateInterval = 0;
  assert.equal(validatePresentation(deck).valid, false);
});
test('toolbar starts off and video events hold auto-rotation; teardown removes listeners', () => {
  const dom = new JSDOM('<div class="reveal"><section><video></video></section></div>', { pretendToBeVisual:true });
  const doc = dom.window.document; const callbacks = new Map();
  const reveal = { getCurrentSlide:()=>doc.querySelector('section'), on:(n,fn)=>callbacks.set(n,fn), off:n=>callbacks.delete(n), isLastSlide:()=>false, next:()=>{}, isPaused:()=>false };
  const dispose = installAutoRotate(reveal, {showControls:true,document:doc});
  const button = doc.querySelector('button'); assert.equal(button.getAttribute('aria-pressed'),'false');
  button.click(); assert.equal(button.getAttribute('aria-pressed'),'true');
  const video = doc.querySelector('video'); Object.defineProperty(video,'paused',{value:false,configurable:true});
  video.dispatchEvent(new dom.window.Event('play')); assert.match(doc.querySelector('[role=status]').textContent,/Waiting/);
  button.click(); assert.equal(doc.querySelector('[role=status]').textContent,'Off');
  dispose(); assert.equal(callbacks.size,0); assert.equal(doc.querySelector('.auto-rotate-controls'),null);
});

test('navigation pauses departed video and toolbar arrows remain available', () => {
  const dom = new JSDOM('<div class="reveal"><section><video></video></section></div>', { pretendToBeVisual:true });
  const doc = dom.window.document, callbacks = new Map(); let pauses = 0;
  const video = doc.querySelector('video'); video.pause = () => pauses++;
  const reveal = { getCurrentSlide:()=>doc.querySelector('section'), on:(n,fn)=>callbacks.set(n,fn), off:n=>callbacks.delete(n), isLastSlide:()=>false, next:()=>{}, isPaused:()=>false };
  const dispose = installAutoRotate(reveal,{showControls:true,document:doc});
  callbacks.get('slidechanged')({previousSlide:doc.querySelector('section')}); assert.equal(pauses,1);
  let keys = 0; doc.addEventListener('keydown',()=>keys++);
  doc.querySelector('button').dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));
  assert.equal(keys,1);
  doc.querySelector('button').dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:' ',bubbles:true}));
  assert.equal(keys,1); dispose();
});

/** A fresh dwell interval after every interaction; playback is always opt-in. */
export function createAutoRotate({ advance, blocked = () => false, onChange = () => {}, interval = 15, setTimer = setTimeout, clearTimer = clearTimeout }) {
  let running = false;
  let timer = null;
  let seconds = Math.min(120, Math.max(5, Number(interval) || 15));
  function reset() {
    if (timer !== null) clearTimer(timer);
    timer = null;
    const held = running && blocked();
    onChange({ running, held, seconds });
    if (running && !held) timer = setTimer(() => { timer = null; if (!blocked()) advance(); reset(); }, seconds * 1000);
  }
  return {
    start() { running = true; reset(); },
    pause() { running = false; reset(); },
    reset,
    setInterval(value) { seconds = Math.min(120, Math.max(5, Number(value) || 15)); reset(); },
    getState() { return { running, held: running && blocked(), seconds }; },
    dispose() { running = false; if (timer !== null) clearTimer(timer); timer = null; }
  };
}

/** Collapse the panel, never its accessible entry point or a focused control. */
export function installControlVisibility(toolbar, { setTimer = setTimeout, clearTimer = clearTimeout } = {}) {
  const panel = toolbar.querySelector('.auto-rotate-panel');
  const menu = toolbar.querySelector('.auto-rotate-menu');
  let timer = null;
  let hovered = false;
  const cancel = () => { if (timer !== null) clearTimer(timer); timer = null; };
  const setOpen = open => {
    panel.hidden = !open;
    menu.setAttribute('aria-expanded', String(open));
  };
  const schedule = () => {
    cancel();
    timer = setTimer(() => {
      timer = null;
      if (!hovered && !toolbar.contains(toolbar.ownerDocument.activeElement)) setOpen(false);
    }, 10000);
  };
  const reveal = () => { setOpen(true); schedule(); };
  const enter = event => { if (event.pointerType !== 'touch') { hovered = true; reveal(); } };
  const leave = () => { hovered = false; schedule(); };
  const focus = event => { if (event.target !== menu) reveal(); };
  const toggle = () => {
    // A tap or keyboard activation always opens a collapsed panel.
    if (panel.hidden) reveal();
    else { setOpen(false); cancel(); }
  };
  const escape = event => {
    if (event.key !== 'Escape') return;
    event.stopPropagation();
    menu.focus();
    setOpen(false);
    cancel();
  };
  toolbar.addEventListener('pointerenter', enter);
  toolbar.addEventListener('pointerleave', leave);
  toolbar.addEventListener('focusin', focus);
  toolbar.addEventListener('focusout', schedule);
  toolbar.addEventListener('pointerdown', schedule);
  toolbar.addEventListener('keydown', escape);
  menu.addEventListener('click', toggle);
  schedule();
  return () => {
    cancel();
    toolbar.removeEventListener('pointerenter', enter);
    toolbar.removeEventListener('pointerleave', leave);
    toolbar.removeEventListener('focusin', focus);
    toolbar.removeEventListener('focusout', schedule);
    toolbar.removeEventListener('pointerdown', schedule);
    toolbar.removeEventListener('keydown', escape);
    menu.removeEventListener('click', toggle);
  };
}

export function installSettingsAutoHide(panel, button, { setTimer = setTimeout, clearTimer = clearTimeout } = {}) {
  let timer = null, hovered = false, openedByHover = false;
  const cancel = () => { if (timer !== null) clearTimer(timer); timer = null; };
  const sync = () => {
    button.setAttribute('aria-expanded', String(panel.classList.contains('visible')));
    cancel();
    if (!panel.classList.contains('visible')) return;
    timer = setTimer(() => {
      timer = null;
      if (!hovered && !panel.contains(panel.ownerDocument.activeElement)) {
        panel.classList.remove('visible');
        button.classList.remove('active');
        button.setAttribute('aria-expanded', 'false');
      }
    }, 10000);
  };
  const enter = () => { hovered = true; cancel(); };
  const leave = () => { hovered = false; sync(); };
  const show = event => {
    if (event.pointerType !== 'mouse') return;
    openedByHover = !panel.classList.contains('visible');
    panel.classList.add('visible'); button.classList.add('active'); sync();
  };
  // The pointer may reveal the panel just before its activation click arrives.
  // Do not let that same click immediately toggle it closed.
  const activate = event => {
    if (!openedByHover || !panel.classList.contains('visible')) return;
    openedByHover = false;
    event.stopImmediatePropagation();
    sync();
  };
  const escape = event => {
    if (event.key === 'Escape') { button.focus(); panel.classList.remove('visible'); button.classList.remove('active'); sync(); }
  };
  const Observer = panel.ownerDocument.defaultView.MutationObserver;
  const observer = new Observer(sync);
  observer.observe(panel, { attributes:true, attributeFilter:['class'] });
  panel.addEventListener('pointerenter', enter);
  panel.addEventListener('pointerleave', leave);
  panel.addEventListener('focusout', sync);
  panel.addEventListener('keydown', escape);
  button.addEventListener('pointerenter', show);
  button.addEventListener('click', activate, true);
  button.setAttribute('aria-controls', panel.id);
  sync();
  return () => {
    cancel(); observer.disconnect();
    panel.removeEventListener('pointerenter', enter); panel.removeEventListener('pointerleave', leave);
    panel.removeEventListener('focusout', sync); panel.removeEventListener('keydown', escape);
    button.removeEventListener('pointerenter', show);
    button.removeEventListener('click', activate, true);
  };
}

export function installAutoRotate(reveal, { showControls = false, interval = 15, document: doc = document } = {}) {
  const win = doc.defaultView;
  const root = doc.querySelector('.reveal');
  let overview = false;
  const playing = () => Array.from(reveal.getCurrentSlide()?.querySelectorAll('video,audio') || []).some(media => !media.paused && !media.ended);
  const settingsPanel = doc.querySelector('#settings-panel');
  const settingsButton = doc.querySelector('#settings-btn');
  const settingsCard = settingsPanel?.querySelector('.settings-panel-card');
  const toolbar = showControls ? doc.createElement('div') : null;
  let button, select, status, disposeVisibility;
  if (toolbar) {
    toolbar.className = 'auto-rotate-controls';
    toolbar.setAttribute('role', 'group');
    toolbar.setAttribute('aria-label', 'Slideshow auto-rotation');
    toolbar.innerHTML = '<div class="auto-rotate-panel" id="auto-rotate-panel"><button type="button" aria-pressed="false">Start auto-rotate</button><label>Every <select aria-label="Seconds per slide"><option value="10">10 seconds</option><option value="15">15 seconds</option><option value="20">20 seconds</option><option value="30">30 seconds</option><option value="60">60 seconds</option></select></label><span role="status" aria-live="polite">Off</span></div><button class="auto-rotate-menu" type="button" aria-label="Slideshow settings" aria-controls="auto-rotate-panel" aria-expanded="true" title="Slideshow settings">☰</button>';
    [button, select, status] = [toolbar.querySelector('button'), toolbar.querySelector('select'), toolbar.querySelector('span')];
    if (!Array.from(select.options).some(option => +option.value === interval)) select.add(new win.Option(`${interval} seconds`, interval));
    select.value = String(interval);
    if (settingsCard && settingsButton) {
      toolbar.classList.add('auto-rotate-embedded');
      toolbar.querySelector('.auto-rotate-menu').remove();
      settingsCard.appendChild(toolbar);
      disposeVisibility = installSettingsAutoHide(settingsPanel, settingsButton);
    } else {
      doc.body.appendChild(toolbar);
      disposeVisibility = installControlVisibility(toolbar);
    }
  }
  const controller = createAutoRotate({
    interval,
    blocked: () => doc.hidden || overview || reveal.isPaused?.() || playing() || Boolean(toolbar?.contains(doc.activeElement) && doc.activeElement === select),
    advance: () => { if (reveal.isLastSlide() && !reveal.availableFragments?.().next) reveal.slide(0); else reveal.next(); },
    onChange: ({ running, held }) => {
      if (!toolbar) return;
      button.textContent = running ? 'Pause auto-rotate' : 'Start auto-rotate';
      button.setAttribute('aria-pressed', String(running));
      status.textContent = !running ? 'Off' : held ? 'Waiting for video / interaction' : 'On · loops at end';
    }
  });
  const toggle = () => controller.getState().running ? controller.pause() : controller.start();
  const changeInterval = () => controller.setInterval(select.value);
  const reset = () => controller.reset();
  const onSlide = event => {
    event.previousSlide?.querySelectorAll('video,audio').forEach(media => media.pause());
    reset();
  };
  const showOverview = () => { overview = true; reset(); };
  const hideOverview = () => { overview = false; reset(); };
  const stopMediaKeys = event => { if (event.target.closest('video,audio')) event.stopPropagation(); };
  const stopKeys = event => {
    if (event.target === select || [' ', 'Enter'].includes(event.key)) event.stopPropagation();
  };
  button?.addEventListener('click', toggle);
  select?.addEventListener('change', changeInterval);
  toolbar?.addEventListener('keydown', stopKeys);
  toolbar?.addEventListener('focusin', reset);
  toolbar?.addEventListener('focusout', reset);
  // Capture non-bubbling media events, including looped playback.
  for (const name of ['play', 'pause', 'ended', 'error']) root?.addEventListener(name, reset, true);
  root?.addEventListener('keydown', stopMediaKeys);
  doc.addEventListener('visibilitychange', reset);
  const events = { slidechanged: onSlide, fragmentshown: reset, fragmenthidden: reset, overviewshown: showOverview, overviewhidden: hideOverview, paused: reset, resumed: reset };
  Object.entries(events).forEach(([name, callback]) => reveal.on(name, callback));
  return () => {
    controller.dispose();
    disposeVisibility?.();
    toolbar?.remove();
    root?.removeEventListener('keydown', stopMediaKeys);
    for (const name of ['play', 'pause', 'ended', 'error']) root?.removeEventListener(name, reset, true);
    doc.removeEventListener('visibilitychange', reset);
    Object.entries(events).forEach(([name, callback]) => reveal.off(name, callback));
  };
}

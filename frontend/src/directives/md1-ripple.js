/**
 * md1-ripple.js
 * Vue 3 directive that adds an MDL-faithful ripple to any element.
 *
 * Ripple behaviour sourced from reference/mdl/src/ripple/ripple.js:
 *   - Originates at click point (clientX/Y relative to element bounds)
 *   - Expands with linear-out-slow-in easing (cubic-bezier(0, 0, 0.2, 1)) — _variables.scss
 *   - Opacity: 0.3 visible → 0 on release — _ripple.scss
 *   - Transition: transform + size 0.3s, opacity 0.6s — _ripple.scss
 *   - Touch-start suppresses subsequent mousedown (ignoringMouseDown_ pattern)
 *
 * Usage:
 *   <el-button v-md1-ripple>...</el-button>
 *   Auto-applied to all .el-button elements via global afterMount in main.js.
 *
 * Color:
 *   Light ripple (on dark surfaces) : rgba(255,255,255,0.3)
 *   Dark  ripple (on light surfaces): rgba(0,0,0,0.12)
 *   Pass `dark` modifier for dark ripple: v-md1-ripple.dark
 */

const EASE_DECELERATE = 'cubic-bezier(0, 0, 0.2, 1)'; // linear-out-slow-in from MDL

function createRippleEl(dark) {
  const el = document.createElement('span');
  el.className = 'md1-ripple-wave';
  Object.assign(el.style, {
    position:      'absolute',
    borderRadius:  '50%',
    width:         '1px',
    height:        '1px',
    pointerEvents: 'none',
    transform:     'translate(-50%, -50%) scale(0.0001, 0.0001)',
    opacity:       '0',
    background:    dark ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.3)',
  });
  return el;
}

function mount(el, binding) {
  if (binding.value === false) return;
  const dark = binding.modifiers?.dark ?? false;

  // Host element must be positioned for absolute child
  const pos = getComputedStyle(el).position;
  if (pos === 'static') el.style.position = 'relative';
  el.style.overflow = 'hidden';

  let ignoringMouseDown = false;

  function trigger(x, y) {
    const rect  = el.getBoundingClientRect();
    const size  = Math.sqrt(rect.width * rect.width + rect.height * rect.height) * 2 + 2;
    const wave  = createRippleEl(dark);

    wave.style.width  = size + 'px';
    wave.style.height = size + 'px';
    wave.style.left   = x + 'px';
    wave.style.top    = y + 'px';
    wave.style.opacity = '0.3';                        // is-visible from MDL

    el.appendChild(wave);

    // next frame → expand (is-animating from MDL)
    requestAnimationFrame(() => {
      wave.style.transition =
        `transform 0.3s ${EASE_DECELERATE}, ` +
        `width 0.3s ${EASE_DECELERATE}, ` +
        `height 0.3s ${EASE_DECELERATE}, ` +
        `opacity 0.6s ${EASE_DECELERATE}`;
      wave.style.transform = 'translate(-50%, -50%) scale(1)';
    });

    function release() {
      wave.style.opacity = '0';
      wave.addEventListener('transitionend', () => wave.remove(), { once: true });
      el.removeEventListener('mouseup',    release);
      el.removeEventListener('mouseleave', release);
      el.removeEventListener('touchend',   release);
      el.removeEventListener('blur',       release);
    }

    el.addEventListener('mouseup',    release);
    el.addEventListener('mouseleave', release);
    el.addEventListener('touchend',   release);
    el.addEventListener('blur',       release);
  }

  function onMousedown(e) {
    if (ignoringMouseDown) { ignoringMouseDown = false; return; }
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    trigger(x, y);
  }

  function onTouchstart(e) {
    ignoringMouseDown = true;
    const rect   = el.getBoundingClientRect();
    const touch  = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    trigger(x, y);
  }

  el._md1Ripple = { onMousedown, onTouchstart };
  el.addEventListener('mousedown',  onMousedown);
  el.addEventListener('touchstart', onTouchstart, { passive: true });
}

function unmount(el) {
  if (el._md1Ripple) {
    el.removeEventListener('mousedown',  el._md1Ripple.onMousedown);
    el.removeEventListener('touchstart', el._md1Ripple.onTouchstart);
    delete el._md1Ripple;
  }
}

export const md1Ripple = {
  mounted:   mount,
  updated:   (el, binding) => { unmount(el); mount(el, binding); },
  unmounted: unmount,
};

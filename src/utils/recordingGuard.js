/**
 * Tiny singleton so navigation UI (BottomNav, etc.) can ask whether it's safe
 * to leave while a route is being recorded. RouteTracker registers a handler
 * that pops a confirm dialog; if no recording is active, navigation proceeds.
 */
let active = false;
let handler = null; // () => void  — shows the "stop recording?" dialog

const recordingGuard = {
  setActive(v) { active = !!v; },
  isActive() { return active; },
  setHandler(fn) { handler = fn; },

  /** Run `proceed()` to navigate, unless recording is active — then intercept
   *  and show the dialog. Returns true if it intercepted. */
  tryLeave(proceed) {
    if (active && handler) { handler(); return true; }
    if (typeof proceed === 'function') proceed();
    return false;
  },
};

export default recordingGuard;

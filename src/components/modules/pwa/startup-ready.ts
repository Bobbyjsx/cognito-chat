type ReadyListener = () => void;

let ready = false;
const listeners = new Set<ReadyListener>();

export function markStartupReady() {
  if (ready) return;
  ready = true;
  listeners.forEach((listener) => listener());
  listeners.clear();
}

export function subscribeStartupReady(listener: ReadyListener) {
  if (ready) {
    listener();
    return () => {};
  }

  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

declare global {
  interface Window {
    __COGNITO_STARTUP_AT?: number;
  }
}

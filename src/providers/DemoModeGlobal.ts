// Simple global accessor for demo mode state

let isDemo = false;

export function setDemoMode(value: boolean) {
  isDemo = value;
}

export function getDemoMode() {
  return isDemo;
}

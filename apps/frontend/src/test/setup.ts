import '@testing-library/jest-dom'

// jsdom does not provide a working localStorage when --localstorage-file is
// missing or misconfigured. Provide a minimal in-memory implementation so that
// any component or hook that reads/writes localStorage works in tests.
const store: Record<string, string> = {}
const localStorageMock: Storage = {
  getItem: (key) => store[key] ?? null,
  setItem: (key, value) => { store[key] = String(value) },
  removeItem: (key) => { delete store[key] },
  clear: () => { Object.keys(store).forEach((k) => delete store[k]) },
  get length() { return Object.keys(store).length },
  key: (index) => Object.keys(store)[index] ?? null,
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

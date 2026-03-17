const store = {};
module.exports = {
  setItem: jest.fn((k, v) => {
    store[k] = v;
    return Promise.resolve();
  }),
  getItem: jest.fn((k) => Promise.resolve(store[k] ?? null)),
  removeItem: jest.fn((k) => {
    delete store[k];
    return Promise.resolve();
  }),
  clear: jest.fn(() => {
    Object.keys(store).forEach((k) => delete store[k]);
    return Promise.resolve();
  }),
};

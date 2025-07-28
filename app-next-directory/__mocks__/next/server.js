module.exports = {
  createMocks: ({ method, json }) => ({
    req: { method, json },
    res: {},
  }),
};

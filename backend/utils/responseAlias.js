const withAliases = (handler, map) => (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (body && typeof body === "object" && !Array.isArray(body)) {
      Object.entries(map).forEach(([from, to]) => {
        if (body[from] !== undefined && body[to] === undefined) {
          body[to] = body[from];
        }
      });
    }
    return originalJson(body);
  };
  return handler(req, res, next);
};

module.exports = { withAliases };

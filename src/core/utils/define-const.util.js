function deepFreeze(obj, _visited = new WeakSet()) {
  // Handle primitives and null
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  // Avoid infinite recursion on circular references
  if (_visited.has(obj)) {
    return obj;
  }
  _visited.add(obj);

  // Freeze properties (string & symbol keys)
  const props = [
    ...Object.getOwnPropertyNames(obj),
    ...Object.getOwnPropertySymbols(obj),
  ];

  for (const prop of props) {
    // eslint-disable-next-line security/detect-object-injection
    const value = obj[prop];
    if (typeof value === 'object' && value !== null) {
      deepFreeze(value, _visited);
    }
  }

  return Object.freeze(obj);
}

function defineConst(obj) {
  return deepFreeze(obj);
}

module.exports = { deepFreeze, defineConst };
// export { deepFreeze, defineConst };

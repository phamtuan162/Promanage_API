const extractErrors = (error) => {
  if (!error?.inner) return {};
  return Object.fromEntries(
    error.inner.map(({ path, message }) => [path, message])
  );
};

module.exports = {
  extractErrors,
};

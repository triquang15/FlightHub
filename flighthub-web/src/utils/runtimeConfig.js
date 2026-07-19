const runtimeConfig =
  typeof window !== "undefined" && window.__FLIGHTHUB_CONFIG__
    ? window.__FLIGHTHUB_CONFIG__
    : {};

export const getRuntimeConfig = (key, fallback = "") => {
  const runtimeValue = runtimeConfig[key];
  if (runtimeValue !== undefined && runtimeValue !== null && runtimeValue !== "") {
    return runtimeValue;
  }

  const buildValue = import.meta.env[key];
  if (buildValue !== undefined && buildValue !== null && buildValue !== "") {
    return buildValue;
  }

  return fallback;
};


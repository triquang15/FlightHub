// ============================
// DEVICE ID GENERATOR
// ============================

export const getDeviceId = () => {
  let deviceId = localStorage.getItem("deviceId");

  if (!deviceId) {
    const userAgent = navigator.userAgent
      .toLowerCase()
      .includes("chrome")
      ? "chrome"
      : "browser";

    const platform = navigator.platform || "web";

    deviceId = `web-${userAgent}-${platform}-${Date.now()}`;

    localStorage.setItem("deviceId", deviceId);
  }

  return deviceId;
};
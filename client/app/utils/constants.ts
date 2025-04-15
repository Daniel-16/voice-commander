const getWebSocketURL = () => {
  if (typeof window === "undefined") return "";

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const hostname = window.location.hostname;

  const port = process.env.NEXT_PUBLIC_WS_PORT || "8080";

  return `${protocol}//${hostname}:${port}`;
};

export const WS_URL = getWebSocketURL();

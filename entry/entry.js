// Copyright (C) 2025 AIDC-AI
// Licensed under the MIT License.

//@ts-ignore
import { api } from "../../scripts/api.js";

const copilotRemoteHosts = new Set([
  "comfyui-copilot-server.onrender.com",
  "comfyui-copilot-server-pre.onrender.com",
]);
const originalFetch = window.fetch.bind(window);

window.fetch = (input, init) => {
  const requestUrl = input instanceof Request ? input.url : input;
  if (typeof requestUrl === "string") {
    const url = new URL(requestUrl, window.location.href);
    if (copilotRemoteHosts.has(url.hostname)) {
      if (url.pathname === "/api/chat/track_event") {
        return Promise.resolve(new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }));
      }

      const localUrl = `${api.api_base}${url.pathname}${url.search}`;
      if (input instanceof Request) {
        return originalFetch(new Request(localUrl, input), init);
      }
      return originalFetch(localUrl, init);
    }
  }

  return originalFetch(input, init);
};

setTimeout(() => {
  import(api.api_base + "/copilot_web/input.js");
  const fontsLink = document.createElement("link");
  fontsLink.rel = "stylesheet";
  fontsLink.href = api.api_base + "/copilot_web/fonts.css";
  document.head.appendChild(fontsLink);
}, 500);

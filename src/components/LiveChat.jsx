import { useEffect } from "react";

const CRISP_ID = import.meta.env.VITE_CRISP_WEBSITE_ID || "";

/**
 * Crisp live chat. Replies from the Crisp iOS/Android app on your phone.
 * Set VITE_CRISP_WEBSITE_ID in .env / Vercel after creating a free Crisp inbox.
 */
export default function LiveChat() {
  useEffect(() => {
    if (!CRISP_ID || typeof window === "undefined") return undefined;

    window.$crisp = window.$crisp || [];
    window.CRISP_WEBSITE_ID = CRISP_ID;

    if (document.getElementById("crisp-chat-loader")) return undefined;

    const script = document.createElement("script");
    script.id = "crisp-chat-loader";
    script.src = "https://client.crisp.chat/l.js";
    script.async = true;
    document.head.appendChild(script);

    return undefined;
  }, []);

  return null;
}

export function openLiveChat() {
  if (typeof window === "undefined") return false;
  if (window.$crisp) {
    try {
      window.$crisp.push(["do", "chat:open"]);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

export function contactEmail() {
  return "info@wellpept.com";
}

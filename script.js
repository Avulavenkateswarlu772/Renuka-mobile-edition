// src/lib/kalki-core.js  — zero DOM, zero side-effects

export const MODEL_NAMES = [
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
];

export const VOICE_STOP_PHRASES = new Set([
  "stop", "stop voice", "stop voice chat", "stop voice mode",
  "stop listening", "stop talking", "end voice chat", "end conversation",
  "voice off", "turn off voice", "turn off voice chat",
  "pause voice", "pause voice chat", "cancel voice", "cancel voice chat",
  "quit voice", "quit voice chat", "goodbye", "that's all", "that's enough",
  "aapu", "aapeyi", "aapey", "aapandi", "voice aapu", "voice aapeyi",
  "voice aapey", "voice aapandi", "chaalu", "chalu",
  "ఆపు", "ఆపేయి", "ఆపండి", "చాలు", "వాయిస్ ఆపు", "వాయిస్ ఆపేయి",
  "వాయిస్ ఆపండి", "మాట్లాడటం ఆపు", "మాట్లాడడం ఆపండి",
  "వినడం ఆపు", "వినడం ఆపండి",
]);

export const SKILL_REGISTRY = {
  whatsapp:   { name: "WhatsApp",              keywords: /\bwhatsapp|message|reply|chat\b/i },
  youtube:    { name: "YouTube",               keywords: /\b(youtube|video)\b/i },
  search:     { name: "Web Search",            keywords: /\b(search|google|web|news|weather)\b/i },
  email:      { name: "Email",                 keywords: /\b(email|mail|gmail|outlook)\b/i },
  calendar:   { name: "Calendar",              keywords: /\b(calendar|schedule|meeting|event)\b/i },
  tasks:      { name: "Tasks and Reminders",   keywords: /\b(task|reminder|todo)\b/i },
  drive:      { name: "Cloud Files",           keywords: /\b(drive|file|folder|upload|download)\b/i },
  documents:  { name: "Documents",             keywords: /\b(pdf|word|docx|excel|xlsx|spreadsheet|powerpoint|pptx)\b/i },
  travel:     { name: "Travel",                keywords: /\b(flight|hotel|travel|trip)\b/i },
  places:     { name: "Places and Restaurants",keywords: /\b(restaurant|place|shop|directions)\b/i },
  prices:     { name: "Price Comparison",      keywords: /\b(price|cost|cheap|compare|buy)\b/i },
  media:      { name: "Image and Media",       keywords: /\b(image|photo|picture|edit)\b/i },
  automation: { name: "Multi-step Automation", keywords: /\b(automate|automation|workflow)\b/i },
  memory:     { name: "Personal Memory",       keywords: /\b(remember|memory|save this)\b/i },
};

export function detectSkill(text) {
  return Object.entries(SKILL_REGISTRY)
    .find(([, skill]) => skill.keywords.test(text))?.[0] || null;
}

export function normalizeVoiceStopPhrase(text) {
  return String(text || "").normalize("NFC").toLowerCase()
    .replace(/^\s*(?:kalki|కల్కి)[,\s]*/i, "")
    .replace(/[.,!?;:…]+/g, " ")
    .replace(/\s+/g, " ").trim()
    .replace(/\s+(?:please|now)$/i, "").trim();
}

export function detectEverydayTool(text) {
  if (/\b(time|what time|samayam)\b/i.test(text)) return "time";
  if (/\b(weather|temperature|varsham)\b/i.test(text)) return "weather";
  if (/\b(timer|countdown|alarm)\b/i.test(text)) return "timer";
  if (/\b(dice|roll|coin|flip|head|tail)\b/i.test(text)) return "dice";
  if (/\b(joke|funny)\b/i.test(text)) return "joke";
  if (/\b(motivat|inspire|quote)\b/i.test(text)) return "motivation";
  if (/\b(tech news|ai news)\b/i.test(text)) return "techNews";
  if (/\b(translate|telugu lo)\b/i.test(text)) return "translate";
  if (/\b(currency|convert|exchange rate|rupees?|inr|dollar)\b/i.test(text)) return "currency";
  if (/\b(meaning|define|dictionary)\b/i.test(text)) return "meaning";
  if (/\b(password)\b/i.test(text)) return "password";
  if (/\b(wikipedia|wiki)\b/i.test(text)) return "wikipedia";
  if (/\b(open|launch)\s+(youtube|yt)\b/i.test(text)) return "openYouTube";
  if (/\b(open|launch)\s+google\b/i.test(text)) return "openGoogle";
  if (/\b(youtube)\b.*\b(song|search|play)\b/i.test(text)) return "youtubeSearch";
  if (/\b(bitcoin|btc)\b/i.test(text)) return "bitcoin";
  return null;
}

export function normalizeCommand(text) {
  return text.trim()
    .replace(/\b(chey|cheyyi|cheyyandi|kavali)\b/gi, "do")
    .replace(/\b(teruvu|open\s+chey|open\s+cheyyi)\b/gi, "open")
    .replace(/\b(pampu|pampinch(u|andi)?|send\s+chey)\b/gi, "send")
    .replace(/\b(cheppu|chepp(u|andi)?|teliyajey)\b/gi, "tell me")
    .replace(/\b(latest)\s+AI\s+(news|vishayalu)\b/gi, "search latest AI news")
    .replace(/\s+/g, " ").trim();
}

export function isExplicitAction(text) {
  return /\b(open|launch|start|send|reply|message|tell|search|find|create|add|schedule|show|read|do)\b/i.test(text)
      || /చెప్పు|పంపు|చూడు|వెతుకు|తెరువు|చేయి|చెయ్/i.test(text);
}

const DESKTOP_NAMES = "calculator|calc|notes|notepad|text editor|browser|web browser";

export function detectDesktopAction(text) {
  const normalized = normalizeCommand(text).replace(/[.!?]+$/g, "").trim();
  const forward = normalized.match(new RegExp(`^(?:please\\s+)?(?:open|launch|start)\\s+(?:the\\s+)?(${DESKTOP_NAMES})(?:\\s+please)?$`, "i"));
  const reverse = normalized.match(new RegExp(`^(${DESKTOP_NAMES})\\s+(?:open|launch|start)$`, "i"));
  const requested = (forward?.[1] || reverse?.[1] || "").toLowerCase();
  if (!requested) return null;
  if (requested === "calculator" || requested === "calc") return { id: "calculator", label: "Calculator" };
  if (["notes", "notepad", "text editor"].includes(requested)) return { id: "notes", label: "the text editor" };
  return { id: "browser", label: "a blank tab in your default browser" };
}

export function plausibleGeminiKey(value) {
  return /^(?:AIza[A-Za-z0-9_-]{20,96}|AQ\.[A-Za-z0-9_-]{20,96})$/.test(value);
}

export function conversationPreferences() {
  try {
    return Object.assign(
      {},
      JSON.parse(localStorage.getItem("kalki.preferences") || "{}"),
      JSON.parse(localStorage.getItem("kalki.conversation") || "{}")
    );
  } catch { return {}; }
}

export interface SafetyFilterResult {
  isFlagged: boolean;
  reasons: string[];
  category: "fraud" | "off_platform_payment" | "contact_sharing" | "prohibited" | null;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
}

const UPI_HANDLE_REGEX = /[a-zA-Z0-9.\-_]{2,256}@(upi|ybl|axl|ibl|icici|okicici|okaxis|okhdfcbank|paytm|postbank|barodampay|sbi)/i;
const PAYMENT_KEYWORDS_REGEX = /(gpay|paytm|phonepe|google pay|bhim|g-pay|paytm me|send money|advance payment|token amount|direct transfer|bank transfer|account number|ifsc)/i;
const PHONE_NUMBER_REGEX = /(?:\+91|91)?[\s\.-]?[6-9]\d{9}\b/;
const DISGUISED_PHONE_REGEX = /[6-9](?:\s*[\d\s.-]){8,14}\d/;
const OFF_PLATFORM_LINKS_REGEX = /(wa\.me|t\.me|telegram|whatsapp|instagram|ig:|dm me at|contact me on|call me at)/i;
const FRAUD_KEYWORDS_REGEX = /(counterfeit|reproduction|fake bill|advance deposit|gift card|crypto|usdt|bitcoin|bank wire|escrow bypass)/i;

export function evaluateChatSafety(text?: string): SafetyFilterResult {
  if (!text || text.trim().length === 0) {
    return { isFlagged: false, reasons: [], category: null, severity: "LOW" };
  }

  const reasons: string[] = [];
  let category: SafetyFilterResult["category"] = null;
  let severity: SafetyFilterResult["severity"] = "LOW";

  // Check 1: UPI Handles & Direct Off-Platform Payment Requests
  if (UPI_HANDLE_REGEX.test(text)) {
    reasons.push("UPI Handle Detected (Potential Off-Platform Payment)");
    category = "off_platform_payment";
    severity = "CRITICAL";
  } else if (PAYMENT_KEYWORDS_REGEX.test(text)) {
    reasons.push("Off-Platform Payment Keyword Detected (GPay/Paytm/Bank)");
    category = "off_platform_payment";
    severity = "HIGH";
  }

  // Check 2: Phone Numbers & Disguised Contact Sharing
  if (PHONE_NUMBER_REGEX.test(text)) {
    reasons.push("Phone Number Sharing Detected");
    if (!category) category = "contact_sharing";
    if (severity === "LOW") severity = "MEDIUM";
  } else if (DISGUISED_PHONE_REGEX.test(text) && text.replace(/\D/g, "").length >= 10) {
    reasons.push("Disguised Contact Number Detected");
    if (!category) category = "contact_sharing";
    if (severity === "LOW") severity = "MEDIUM";
  }

  // Check 3: External Messaging Links (WhatsApp/Telegram)
  if (OFF_PLATFORM_LINKS_REGEX.test(text)) {
    reasons.push("External Contact / Messenger Link Detected");
    if (!category) category = "contact_sharing";
    if (severity === "LOW" || severity === "MEDIUM") severity = "HIGH";
  }

  // Check 4: Fraud / Prohibited Goods Keywords
  if (FRAUD_KEYWORDS_REGEX.test(text)) {
    reasons.push("Fraudulent / Prohibited Keyword Detected");
    category = "fraud";
    severity = "CRITICAL";
  }

  const isFlagged = reasons.length > 0;

  return {
    isFlagged,
    reasons,
    category,
    severity
  };
}

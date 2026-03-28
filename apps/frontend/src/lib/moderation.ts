export type ViolationType = 'phone' | 'email' | 'social' | 'banking' | 'offplatform'

export interface ModerationResult {
  flagged: boolean
  type: ViolationType
  label: string
  details: string
}

export function checkMessage(text: string): ModerationResult | null {
  const lower = text.toLowerCase()

  // Phone numbers — 7+ digit sequences (with optional spaces, dashes, dots, parens, +)
  if (/(\+?\d[\d\s\-().]{6,}\d)/.test(text)) {
    return { flagged: true, type: 'phone', label: 'Phone Number Detected', details: 'Sharing phone numbers is not allowed on this platform.' }
  }

  // Email addresses
  if (/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/.test(text)) {
    return { flagged: true, type: 'email', label: 'Email Address Detected', details: 'Sharing email addresses is not allowed. All communication must stay on-platform.' }
  }

  // Social media handles (@username)
  if (/@[a-zA-Z0-9_]{3,}/.test(text)) {
    return { flagged: true, type: 'social', label: 'Social Handle Detected', details: 'Sharing social media handles is not allowed on this platform.' }
  }

  // Off-platform apps / communication tools
  const offPlatformKeywords = [
    'whatsapp', 'telegram', 'signal', 'discord', 'facebook',
    'instagram', 'twitter', 'linkedin', 'snapchat', 'skype',
    'wechat', 'viber', 'line app', 'zoom meeting', 'google meet',
    'dm me', 'text me', 'call me', 'ring me', 'contact me outside',
    'reach me on', 'find me on', 'add me on', 'message me on',
  ]
  const matchedApp = offPlatformKeywords.find(k => lower.includes(k))
  if (matchedApp) {
    return { flagged: true, type: 'offplatform', label: 'Off-Platform Contact Attempt', details: `Attempting to move communication to "${matchedApp}" violates platform policy.` }
  }

  // Banking / payment details
  const bankingKeywords = [
    'iban', 'sort code', 'routing number', 'account number',
    'bank transfer', 'wire transfer', 'swift code', 'bic code',
    'crypto wallet', 'bitcoin address', 'eth address', 'wallet address',
    'paypal.me', 'cashapp', 'venmo', 'zelle',
  ]
  const matchedBank = bankingKeywords.find(k => lower.includes(k))
  if (matchedBank) {
    return { flagged: true, type: 'banking', label: 'Financial Details Detected', details: 'Sharing banking or payment details outside the platform is prohibited.' }
  }

  return null
}

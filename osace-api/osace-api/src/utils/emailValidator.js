// src/utils/emailValidator.js

// Listă extinsă de domenii cunoscute pentru adrese de email temporare / de unică folosință (throwaway)
const DISPOSABLE_DOMAINS = new Set([
  // Servicii clasice de temp-mail
  'mailinator.com', 'mailinator.net', 'mailinator.org',
  'tempmail.com', 'temp-mail.org', 'temp-mail.io', 'tempmail.net', 'tempmailaddress.com',
  '10minutemail.com', '10minutemail.net', '10minmail.com', '10minuteemail.com',
  'guerrillamail.com', 'guerrillamail.net', 'guerrillamail.biz', 'guerrillamail.org',
  'guerrillamailblock.com', 'sharklasers.com', 'grr.la', 'pokemail.net', 'spam4.me',
  'yopmail.com', 'yopmail.fr', 'yopmail.net', 'cool.fr.nf', 'jetable.fr.nf',
  'trashmail.com', 'trashmail.net', 'trashmail.me', 'trashmail.org',
  'dispostable.com', 'maildrop.cc', 'inboxkitten.com', 'mohmal.com',
  'crazymailing.com', 'throwawaymail.com', 'getnada.com', 'nada.ltd',
  'burnermail.io', 'fakemailgenerator.com', 'generator.email',
  'emailondeck.com', 'tempail.com', 'mytemp.email', 'dropmail.me',
  'internxt.com', 'minuteinbox.com', 'mohmal.in', 'chacuo.net',
  'yaxun.org', 'bupkis.org', 'armyspy.com', 'cuvox.de', 'dayrep.com',
  'fleckens.hu', 'gustr.com', 'jourrapide.com', 'rhyta.com', 'superrito.com',
  'teleworm.us', 'einrot.com',
]);

// Cuvinte cheie / tipare suspecte în numele domeniului
const SUSPICIOUS_DOMAIN_PATTERNS = [
  'tempmail',
  'throwaway',
  'disposable',
  'fakeinbox',
  'trashmail',
  '10minute',
  'generator',
];

// TLD-uri cu risc extrem de ridicat pentru spam/servicii temporare (menționat explicit .su de către utilizator)
const BLOCKED_TLDS = new Set([
  'su', // Soviet Union TLD, asociat masiv cu servicii de mail temporar / abuz
]);

/**
 * Verifică dacă adresa de email are un format valid și dacă domeniul nu este de unică folosință / temporar.
 * @param {string} email 
 * @returns {{ valid: boolean, error?: string }}
 */
function validateRegistrationEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Adresa de email este obligatorie.' };
  }

  const normalized = email.trim().toLowerCase();
  
  // Format de bază email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalized) || normalized.length > 254) {
    return { valid: false, error: 'Formatul adresei de email este invalid.' };
  }

  const parts = normalized.split('@');
  if (parts.length !== 2) {
    return { valid: false, error: 'Adresă de email invalidă.' };
  }

  const domain = parts[1];
  const domainParts = domain.split('.');
  const tld = domainParts[domainParts.length - 1];

  // 1. Verificare TLD blocat (ex: .su)
  if (BLOCKED_TLDS.has(tld)) {
    return { valid: false, error: 'Domeniile de email de pe această extensie (.su) nu sunt permise.' };
  }

  // 2. Verificare domeniu în lista neagră de temp-mail
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return { valid: false, error: 'Adresele de email temporare sau de unică folosință nu sunt permise.' };
  }

  // 3. Verificare tipare generice de temp-mail în domeniu (ex: ceva-tempmail-12.com)
  for (const pattern of SUSPICIOUS_DOMAIN_PATTERNS) {
    if (domain.includes(pattern)) {
      return { valid: false, error: 'Adresele de email temporare sau de unică folosință nu sunt permise.' };
    }
  }

  return { valid: true };
}

module.exports = {
  validateRegistrationEmail,
  DISPOSABLE_DOMAINS,
  BLOCKED_TLDS,
};

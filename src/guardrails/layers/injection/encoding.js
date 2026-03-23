/**
 * Guard Rails - Encoding Detection & Decoding
 * Detecta e decodifica mensagens ofuscadas
 */

import { ENCODING_PATTERNS } from './patterns.js';

/**
 * Tenta detectar se a mensagem contém encoding suspeito
 */
export function detectEncoding(message) {
  const detections = [];

  // Base64
  const base64Match = message.match(ENCODING_PATTERNS.base64);
  if (base64Match) {
    const decoded = tryDecodeBase64(base64Match[0]);
    if (decoded) {
      detections.push({
        type: 'base64',
        original: base64Match[0],
        decoded,
        suspicious: isSuspiciousText(decoded),
      });
    }
  }

  // Hex encoding
  const hexMatch = message.match(ENCODING_PATTERNS.hex);
  if (hexMatch) {
    const decoded = tryDecodeHex(hexMatch[0]);
    if (decoded) {
      detections.push({
        type: 'hex',
        original: hexMatch[0],
        decoded,
        suspicious: isSuspiciousText(decoded),
      });
    }
  }

  // Unicode escape
  const unicodeMatch = message.match(ENCODING_PATTERNS.unicode);
  if (unicodeMatch) {
    const decoded = tryDecodeUnicode(unicodeMatch[0]);
    if (decoded) {
      detections.push({
        type: 'unicode',
        original: unicodeMatch[0],
        decoded,
        suspicious: isSuspiciousText(decoded),
      });
    }
  }

  // Homoglyph detection
  if (ENCODING_PATTERNS.homoglyph.test(message)) {
    detections.push({
      type: 'homoglyph',
      original: message,
      decoded: null,
      suspicious: true,
    });
  }

  // Character padding
  if (ENCODING_PATTERNS.charPad.test(message)) {
    detections.push({
      type: 'char_pad',
      original: message,
      decoded: null,
      suspicious: true,
    });
  }

  return detections;
}

/**
 * Normaliza a mensagem (remove encoding para análise)
 * Retorna texto decodificado ou null se não conseguir
 */
export function normalizeMessage(message) {
  let normalized = message;

  // Decodificar base64 inline
  const base64Regex = /[A-Za-z0-9+\/]{30,}={0,2}/g;
  normalized = normalized.replace(base64Regex, (match) => {
    const decoded = tryDecodeBase64(match);
    return decoded || match;
  });

  // Decodificar hex
  const hexRegex = /(?:\\x[0-9a-fA-F]{2})+/g;
  normalized = normalized.replace(hexRegex, (match) => {
    const decoded = tryDecodeHex(match);
    return decoded || match;
  });

  // Decodificar unicode
  const unicodeRegex = /(?:\\u[0-9a-fA-F]{4})+/g;
  normalized = normalized.replace(unicodeRegex, (match) => {
    const decoded = tryDecodeUnicode(match);
    return decoded || match;
  });

  // Normalizar char padding (remover pontos/espacos entre letras)
  normalized = normalized.replace(/\b([a-zA-Z])\s*[·\.]\s*([a-zA-Z])\s*[·\.]\s*([a-zA-Z])/g, '$1$2$3');

  // Normalizar espaços extras
  normalized = normalized.replace(/\s+/g, ' ').trim();

  return normalized;
}

// ═══════════════════════════════════════════════════
// Helper functions
// ═══════════════════════════════════════════════════

function tryDecodeBase64(str) {
  try {
    // Validar se é base64 válido
    if (!/^[A-Za-z0-9+\/]+=*$/.test(str) || str.length < 8) return null;
    const decoded = Buffer.from(str, 'base64').toString('utf-8');
    // Verificar se decodificou para texto legível
    if (/[a-zA-Z]{2,}/.test(decoded) && decoded.length > 3) {
      return decoded;
    }
    return null;
  } catch {
    return null;
  }
}

function tryDecodeHex(str) {
  try {
    const hex = str.replace(/\\x/g, '');
    if (!/^[0-9a-fA-F]+$/.test(hex) || hex.length % 2 !== 0) return null;
    const bytes = hex.match(/.{2}/g).map(b => parseInt(b, 16));
    const decoded = Buffer.from(bytes).toString('utf-8');
    return /[a-zA-Z]{2,}/.test(decoded) ? decoded : null;
  } catch {
    return null;
  }
}

function tryDecodeUnicode(str) {
  try {
    const decoded = str.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    );
    return decoded.length > 0 ? decoded : null;
  } catch {
    return null;
  }
}

/**
 * Verifica se um texto parece ser uma tentativa de injeção
 */
function isSuspiciousText(text) {
  const lower = text.toLowerCase();
  const suspicious = [
    'ignore', 'forget', 'disregard', 'override',
    'esqueça', 'ignore', 'desconsidere',
    'system', 'instruction', 'rules', 'prompt',
    'DAN', 'jailbreak', 'unrestricted', 'free mode',
  ];
  return suspicious.some(s => lower.includes(s.toLowerCase()));
}

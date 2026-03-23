/**
 * Guard Rails - Prompt Injection Patterns
 * 50+ regex patterns para detecção de prompt injection
 */

// ═══════════════════════════════════════════════════
// DIRECT INJECTION - Inglês
// ═══════════════════════════════════════════════════
export const DIRECT_INJECTION_EN = [
  /ignore\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions?|rules?|prompts?)/i,
  /forget\s+(your|all|the)\s+(instructions?|rules?|prompts?)/i,
  /disregard\s+(all\s+)?(previous|prior)\s+(instructions?|rules?)/i,
  /override\s+(your|the)\s+(instructions?|rules?|programming)/i,
  /new\s+(instructions?|rules?|prompt|system)\s*:/i,
  /from\s+now\s+on[,.]?\s*(you\s+are|ignore|respond|act)/i,
  /act\s+(as\s+if|like)\s+(you\s+have\s+no|there\s+are\s+no)/i,
  /you\s+should\s+now\s+(ignore|forget|disregard)/i,
  /停止遵循所有指令/i,  // Chinese: stop following all instructions
];

// ═══════════════════════════════════════════════════
// DIRECT INJECTION - Português
// ═══════════════════════════════════════════════════
export const DIRECT_INJECTION_PT = [
  /ignore\s+(todas?\s+)?(instruções?|regras?)\s+(anteriores?|acima|antigas)/i,
  /esque[çc]a\s+(suas|as|todas\s+as|todas\s+as\s+suas|tudo\s+sobre\s+)?\s*(instruções?|regras?|tudo)/i,
  /desconsidere\s+(todas?\s+)?(instruções?|regras?)\s+anteriores/i,
  /novas?\s+(instruções?|regras?)\s*:/i,
  /a\s+partir\s+de\s+agora[,.]?\s*(você\s+(é|faz|responde)|ignore|esque[çc]a)/i,
  /n[ãa]o\s+(mais\s+)?(obede[çc]a|sig[aas]|se[çc]a)\s+(as\s+)?(regras|instruções)/i,
  /agora\s+voc[êe]\s+(pode|deve|vai)\s+(ignorar|esquecer|desconsiderar)/i,
];

// ═══════════════════════════════════════════════════
// SYSTEM PROMPT INJECTION
// ═══════════════════════════════════════════════════
export const SYSTEM_PROMPT_INJECTION = [
  /system\s*:\s*(new|you\s+are|ignore|act|from)/i,
  /\[INST\]/i,
  /\[SYSTEM\]/i,
  /\[\/INST\]/i,
  /<\|im_start\|>/i,
  /<\|im_end\|>/i,
  /<\|begin_of_text\|>/i,
  /<\|end_of_text\|>/i,
  /<\|system\|>/i,
  /<\|user\|>/i,
  /<\|assistant\|>/i,
  /```system/i,
];

// ═══════════════════════════════════════════════════
// ROLE/IDENTITY CHANGE
// ═══════════════════════════════════════════════════
export const ROLE_CHANGE = [
  // English
  /you\s+are\s+now\s+(DAN|evil|free|unrestricted|hacked|changed|different)/i,
  /act\s+as\s+(DAN|evil|unrestricted|no\s+rules|a\s+different)/i,
  /pretend\s+(to\s+be|you\s+are)\s+(DAN|evil|free|someone\s+else)/i,
  /from\s+now\s+on\s+(you\s+are|you'?ll\s+be|act\s+as)/i,
  /roleplay\s+as\s+(a\s+)?(villain|evil|unrestricted)/i,
  /enter\s+(DAN|developer|god|hacker)\s+mode/i,
  
  // Portuguese
  /agora\s+você\s+é\s+(livre|outro|diferente|sem\s+regras|vilão)/i,
  /fing(?:a|ir)\s+(que\s+)?(você\s+é|você\s+foi|é\s+um)/i,
  /faz(?:er)?\s+(de\s+conta\s+que\s+)?(você\s+é|é\s+um)/i,
  /seja\s+(um\s+)?(vilão|mau|diferente|outro)/i,
  /modo\s+(livre|deus|desenvolvedor|hacker|DAN)/i,
  
  // Jailbreak references
  /DAN\s+(mode|prompt|jailbreak)/i,
  /do\s+anything\s+now/i,
  /god\s+mode/i,
  /developer\s+mode/i,
  /jailbreak/i,
];

// ═══════════════════════════════════════════════════
// PROMPT LEAKING
// ═══════════════════════════════════════════════════
export const PROMPT_LEAKING = [
  /what\s+(are|is)\s+your\s+(instructions?|rules?|prompts?|system\s+prompt)/i,
  /show\s+(me\s+)?(your|the)\s+(instructions?|rules?|prompts?|code|programming)/i,
  /repeat\s+(your|the)\s+(instructions?|rules?|prompts?)/i,
  /print\s+(your|the)\s+(instructions?|rules?|prompts?|system\s+message)/i,
  /what\s+(can|do)\s+you\s+(tell\s+me\s+about)\s+your/i,
  /what\s+(are|is)\s+your\s+system\s+(instructions?|rules?|prompt)/i,
  /quais?\s+(são|saem?)\s+(suas|as)\s+(instruções?|regras?)/i,
  /me\s+(conte|dig[aai]|mostre)\s+(suas|as)\s+(instruções?|regras?|configurações?)/i,
  /qual\s+(é|será?|são)\s+(suas?|os?)\s+(instruções?|regras|prompt|system|config)/i,
  /me\s+(diga|conte|fale|mostra)\s+(suas?|os?)\s+(instruções?|regras|segredos)/i,
  /o\s+que\s+(você\s+)?(foi|foi\s+)?(programado|instruído|dito|ensinado)/i,
];

// ═══════════════════════════════════════════════════
// ROLE PLAY INJECTION
// ═══════════════════════════════════════════════════
export const ROLEPLAY_INJECTION = [
  // Games
  /vamos\s+(jogar|brincar|fazer\s+um\s+jogo)/i,
  /let'?s\s+(play|game|roleplay|role[- ]?play)/i,
  /jog(?:ar|o)\s+(de\s+)?(roleplay|role[- ]?play|imagine)/i,
  
  // Persona shifting
  /imagine\s+(que|you\s+are|você\s+é)/i,
  /fing(?:a|ir)\s+(que|you\s+are|você\s+é)/i,
  /pretend\s+(that|you\s+are|to\s+be)/i,
  /suponha\s+(que|você\s+é)/i,
  
  // Character creation
  /cri(?:ar|e)\s+um?\s+(personagem|character|persona|papel)/i,
  /desenvolv(?:a|er)\s+um?\s+(personagem|character|persona)/i,
  /seja\s+(um|uma)\s+(personagem|character)/i,
  
  // Story/poem escapes - bloqueia se envolver personagem que ignora regras
  /personagem\s+.*\s+(ignora|esquece)\s+.*regra/i,
  /personagem\s+.*\s+(sem\s+regras|livre|sem\s+restric)/i,
  /escrev(?:a|er)\s+.*\s+(ignora|esquece)\s+.*\s+regra/i,
  /write\s+.*\s+(ignore|forget)\s+.*\s+rules/i,
  
  // "Just for fun" escape
  /só\s+por\s+(diversão|zoe|zuação|brincadeira|piada)/i,
  /just\s+(for\s+)?(fun|joke|laugh|practice)/i,
  /é\s+(só|apenas)\s+(uma\s+)?(brincadeira|zoe|piada)/i,
];

// ═══════════════════════════════════════════════════
// FEW-SHOT INJECTION
// ═══════════════════════════════════════════════════
export const FEWSHOT_INJECTION = [
  /complete\s+(this\s+)?(conversation|dialog|chat|message)/i,
  /complete\s+(o\s+)?(diálogo|conversa|chat|mensagem)/i,
  
  // Dialogue with injected response
  /assistant\s*:\s*(ignore|forget|you\s+are|você\s+é|vou\s+ignorar)/i,
  /escolar\s+ai\s*:\s*(ignore|forget|you\s+are|você\s+é|vou\s+ignorar)/i,
  /bot\s*:\s*(ignore|forget|you\s+are|você\s+é|vou\s+ignorar)/i,
  /tutor\s*:\s*(ignore|forget|you\s+are|você\s+é|vou\s+ignorar)/i,
  
  // Fill in the blank injection
  /preencha\s+(o\s+)?(vazio|blank|lacuna)/i,
  /fill\s+(in\s+the\s+)?(blank|gap)/i,
  /continue\s+(a\s+)?(história|story|resposta|answer)/i,
  
  // "Translate this" with hidden injection
  /traduza?\s+(isto|isso|this|do\s+inglês)/i,
  /translate\s+(this|the\s+following)/i,
];

// ═══════════════════════════════════════════════════
// ENCODING/OBFUSCATION
// ═══════════════════════════════════════════════════
export const ENCODING_PATTERNS = {
  // Suspicious base64 patterns (likely encoded instructions)
  base64: /[A-Za-z0-9+\/]{30,}={0,2}/,
  
  // Hex encoding
  hex: /(?:\\x[0-9a-fA-F]{2}){5,}/,
  
  // Unicode escape
  unicode: /(?:\\u[0-9a-fA-F]{4}){5,}/,
  
  // Greek/Cyrillic characters mixed with Latin (homoglyph)
  homoglyph: /[\u0370-\u03FF\u0400-\u04FF\u0530-\u058F\u0590-\u05FF]{3,}.*[a-zA-Z]{3,}|[a-zA-Z]{3,}.*[\u0370-\u03FF\u0400-\u04FF\u0530-\u058F\u0590-\u05FF]{3,}/,
  
  // Character padding (a·b·c·d or a.b.c.d) - só com · ou . (não espaço)
  charPad: /[a-zA-Z][·\.][a-zA-Z][·\.][a-zA-Z]/,
  
  // ROT13-ish patterns (common substitutions)
  leet: /(?:4|3|1|0|5|7|8|9|\$|@)(?:[a-zA-Z]\s*){5,}/i,
};

// ═══════════════════════════════════════════════════
// MANIPULATION (from guardrails v2)
// ═══════════════════════════════════════════════════
export const MANIPULATION = [
  /como\s+(manipular|controlar|enganar|subornar|intimidar)\s+(alguém|pessoa|amigos|colegas)/i,
  /como\s+(convencer|forçar|obrigar)\s+(alguém|pessoa|criança)\s+(a\s+)?(fazer|aceitar|concordar)/i,
  /como\s+(fazer\s+)?(alguém|pessoa)\s+(fazer|aceitar|concordar)\s+o\s+que\s+(ela|você)\s+(não\s+)?quer/i,
];

// ═══════════════════════════════════════════════════
// COMBINED: Todos os patterns de injeção
// ═══════════════════════════════════════════════════
export const ALL_INJECTION_PATTERNS = [
  ...DIRECT_INJECTION_EN,
  ...DIRECT_INJECTION_PT,
  ...SYSTEM_PROMPT_INJECTION,
  ...ROLE_CHANGE,
  ...PROMPT_LEAKING,
  ...ROLEPLAY_INJECTION,
  ...FEWSHOT_INJECTION,
  ...MANIPULATION,
];

// Nomes para logging
export const PATTERN_NAMES = {
  [DIRECT_INJECTION_EN[0].source]: 'direct_en_ignore',
  [DIRECT_INJECTION_EN[1].source]: 'direct_en_forget',
  [DIRECT_INJECTION_PT[0].source]: 'direct_pt_ignore',
  [DIRECT_INJECTION_PT[1].source]: 'direct_pt_esquecer',
  [SYSTEM_PROMPT_INJECTION[0].source]: 'system_prompt_prefix',
  [ROLE_CHANGE[0].source]: 'role_change_en',
  [ROLE_CHANGE[5].source]: 'jailbreak_DAN',
  [PROMPT_LEAKING[0].source]: 'prompt_leaking_en',
  [ROLEPLAY_INJECTION[0].source]: 'roleplay_game',
  [FEWSHOT_INJECTION[0].source]: 'fewshot_complete',
};

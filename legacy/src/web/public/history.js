/**
 * Dashboard History - Utilitários para o Histórico de Conversas
 * T-007 | Reports System
 */

/**
 * Formatar data para DD/MM/YYYY
 */
export function formatDate(date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Formatar hora para HH:MM
 */
export function formatTime(date) {
  const d = new Date(date);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Formatar tempo relativo (há X minutos, há X horas, ontem)
 */
export function formatRelativeTime(date) {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now - d;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'agora';
  if (diffMinutes < 60) return `há ${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''}`;
  if (diffHours < 24) return `há ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
  if (diffDays === 1) return 'ontem';
  if (diffDays < 7) return `há ${diffDays} dias`;
  return formatDate(date);
}

/**
 * Ícone de status
 */
export function statusIcon(status) {
  const s = status?.toLowerCase();
  if (s === 'approved' || s === 'aprovado') return '🟢';
  if (s === 'blocked' || s === 'bloqueado') return '🔴';
  return '⚪';
}

/**
 * Truncar texto
 */
export function truncateText(text, maxLength = 50) {
  if (!text || text.length <= maxLength) return text || '';
  return text.substring(0, maxLength) + '...';
}

/**
 * Montar query string (ignorar vazios)
 */
export function buildQueryString(params) {
  const parts = [];
  for (const [key, value] of Object.entries(params)) {
    if (value !== '' && value !== null && value !== undefined) {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    }
  }
  return parts.join('&');
}

/**
 * Debounce function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Agrupar conversas por data (formatada)
 */
export function groupByDate(conversations) {
  const groups = {};
  for (const conv of conversations) {
    const dateKey = formatDate(conv.createdAt);
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(conv);
  }
  return groups;
}

/**
 * Calcular estatísticas
 */
export function calculateStats(conversations) {
  if (!conversations || conversations.length === 0) {
    return {
      total: 0,
      approved: 0,
      blocked: 0,
      blockedRate: '0',
      totalTokens: 0,
    };
  }

  const total = conversations.length;
  const approved = conversations.filter(c => c.status === 'approved').length;
  const blocked = conversations.filter(c => c.status === 'blocked').length;
  const totalTokens = conversations.reduce((sum, c) => sum + (c.tokens || 0), 0);

  return {
    total,
    approved,
    blocked,
    blockedRate: total > 0 ? ((blocked / total) * 100).toFixed(1) : '0',
    totalTokens,
  };
}

/**
 * Exportar conversas para CSV
 */
export function exportToCSV(conversations) {
  const headers = ['Data', 'Hora', 'Pergunta', 'Resposta', 'Status', 'Motivo'];
  const rows = conversations.map(conv => {
    const d = new Date(conv.createdAt);
    return [
      formatDate(d),
      formatTime(d),
      `"${(conv.input || '').replace(/"/g, '""')}"`,
      `"${(conv.output || '').replace(/"/g, '""')}"`,
      conv.status || '',
      conv.blockReason || '',
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

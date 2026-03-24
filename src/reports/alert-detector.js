/**
 * AlertDetector
 * Detecta e gerencia alertas de conteúdo inadequado
 */

export class AlertDetector {
  constructor() {
    this.hourlyCounts = new Map(); // childId -> { count, resetAt, attempts }
    this.lastAlertSent = new Map(); // childId -> timestamp
    this.dailyAlertCounts = new Map(); // parentId -> { count, date }
  }

  /**
   * Registrar um bloqueio e verificar threshold
   */
  async recordBlock(childId, blockData) {
    this.maybeResetCounter(childId);

    const state = this.hourlyCounts.get(childId) || {
      count: 0,
      resetAt: Date.now() + (60 * 60 * 1000),
      attempts: [],
    };

    state.count++;
    state.attempts.push({
      input: blockData.input?.substring(0, 100),
      reason: blockData.reason,
      timestamp: new Date().toISOString(),
    });

    this.hourlyCounts.set(childId, state);

    return {
      count: state.count,
      shouldAlert: state.count >= 3,
      attempts: state.attempts,
    };
  }

  /**
   * Verificar se contador precisa ser resetado (passou 1 hora)
   */
  maybeResetCounter(childId) {
    const state = this.hourlyCounts.get(childId);
    if (state && Date.now() > state.resetAt) {
      state.count = 0;
      state.resetAt = Date.now() + (60 * 60 * 1000);
      state.attempts = [];
    }
  }

  /**
   * Verificar threshold (3 bloqueios/hora)
   */
  async checkThreshold(childId) {
    this.maybeResetCounter(childId);

    const state = this.hourlyCounts.get(childId);

    if (!state || state.count < 3) {
      return { shouldAlert: false, attemptCount: state?.count || 0 };
    }

    return {
      shouldAlert: true,
      attemptCount: state.count,
      attempts: state.attempts,
    };
  }

  /**
   * Verificar se deve enviar alerta (cooldown de 1 hora)
   */
  shouldSendAlert(childId) {
    const lastSent = this.lastAlertSent.get(childId);

    if (!lastSent) {
      return true;
    }

    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    return lastSent < oneHourAgo;
  }

  /**
   * Verificar limite diário de alertas por pai
   */
  checkDailyLimit(parentId) {
    const today = new Date().toISOString().split('T')[0];
    const state = this.dailyAlertCounts.get(parentId);

    if (!state || state.date !== today) {
      this.dailyAlertCounts.set(parentId, { count: 0, date: today });
      return { canSend: true, remaining: 5 };
    }

    return {
      canSend: state.count < 5,
      remaining: Math.max(0, 5 - state.count),
    };
  }

  /**
   * Incrementar contador diário de alertas
   */
  incrementDailyCount(parentId) {
    const today = new Date().toISOString().split('T')[0];
    const state = this.dailyAlertCounts.get(parentId) || { count: 0, date: today };

    if (state.date !== today) {
      state.count = 0;
      state.date = today;
    }

    state.count++;
    this.dailyAlertCounts.set(parentId, state);
  }

  /**
   * Enviar alerta (marca timestamp)
   */
  async sendAlert(parentId, childId, attempts) {
    if (!this.shouldSendAlert(childId)) {
      return { sent: false, reason: 'cooldown' };
    }

    const dailyCheck = this.checkDailyLimit(parentId);
    if (!dailyCheck.canSend) {
      return { sent: false, reason: 'daily_limit', remaining: dailyCheck.remaining };
    }

    // Marcar envio
    this.lastAlertSent.set(childId, Date.now());
    this.incrementDailyCount(parentId);

    // Aqui seria chamado o EmailSender
    return {
      sent: true,
      alertData: {
        childId,
        attempts,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Obter alertas ativos para uma criança
   */
  getActiveAlerts(childId) {
    this.maybeResetCounter(childId);

    const state = this.hourlyCounts.get(childId);

    return {
      childId,
      count: state?.count || 0,
      attempts: state?.attempts || [],
      resetAt: state?.resetAt || null,
    };
  }

  /**
   * Resetar contador manualmente (para testes)
   */
  resetHourlyCounter(childId) {
    const state = this.hourlyCounts.get(childId);
    if (state) {
      state.count = 0;
      state.attempts = [];
    }
  }

  /**
   * Limpar todos os dados (para testes)
   */
  clear() {
    this.hourlyCounts.clear();
    this.lastAlertSent.clear();
    this.dailyAlertCounts.clear();
  }
}

export const alertDetector = new AlertDetector();

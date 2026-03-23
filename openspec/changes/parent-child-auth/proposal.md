# 📋 Proposal: Cadastro Pai & Filho + Autenticação

**Change ID:** parent-child-auth
**Data:** 2026-03-23
**Autor:** Robert
**Status:** PROPOSED → Pending Aprovação

---

## Resumo

Sistema completo de cadastro e autenticação para controle parental:
- Pai se cadastra via Google OAuth ou email+senha
- Pai cadastra filho(s) com nickname+senha (pois pode não ter email)
- Filho faz login e usa a IA com guardrails ativos
- Pai gerencia filhos no dashboard

## Justificativa

Sem autenticação, não há:
- Controle parental real (pai não sabe quem está usando)
- Relatórios individuais por filho
- Possibilidade de desativar acesso
- Auditoria de quem perguntou o quê

## Escopo

| Incluído | Excluído |
|----------|----------|
| Cadastro pai (Google OAuth) | Pagamento/assinatura |
| Cadastro filho (nickname+senha) | Notificações push |
| Login pai + filho | Multi-dispositivo sync |
| Dashboard gestão filhos | Histórico ilimitado |
| JWT auth (access+refresh) | Admin panel |
| Prisma + PostgreSQL | Migrations automáticas |
| Frontend (login, cadastro, dashboard) | Mobile app |

## Risco Principal

**Segurança de crianças** — se o sistema de auth for comprometido, dados de menores ficam expostos. Mitigação: bcrypt, JWT curto, rate limiting, sem dados sensíveis do filho (CPF etc).

## Decisões Pendentes

- [ ] Usar Google OAuth só ou OAuth + email/senha para o pai?
- [ ] Sessão do filho: 2h fixo ou configurável pelo pai?
- [ ] Pai recebe email quando filho cadastra tentativa de login?

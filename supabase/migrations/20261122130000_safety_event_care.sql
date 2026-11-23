-- Tatá IA · M-22/M-26 · safety_event passa a registrar a decisão "responder com cuidado".
-- A decisão 'care' é uma resposta liberada com cuidado extra (política por categoria).

alter table public.safety_event drop constraint if exists safety_event_decision_check;
alter table public.safety_event
  add constraint safety_event_decision_check
  check (decision in ('allow', 'care', 'redirect', 'block', 'crisis'));

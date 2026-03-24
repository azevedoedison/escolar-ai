# 📋 Casos de Uso - Testes E2E Playwright

## 🔐 MÓDULO 1: Autenticação de Pais

### 1.1 Registro de Pai
| ID | Caso de Uso | Prioridade |
|----|-------------|------------|
| PAI-001 | Registrar com dados válidos | 🔴 Alta |
| PAI-002 | Registrar com email já existente | 🔴 Alta |
| PAI-003 | Registrar com senha fraca | 🟡 Média |
| PAI-004 | Registrar com campos vazios | 🔴 Alta |
| PAI-005 | Registrar com email inválido | 🟡 Média |

### 1.2 Login de Pai
| ID | Caso de Uso | Prioridade |
|----|-------------|------------|
| PAI-006 | Login com credenciais válidas | 🔴 Alta |
| PAI-007 | Login com senha incorreta | 🔴 Alta |
| PAI-008 | Login com email inexistente | 🔴 Alta |
| PAI-009 | Login com campos vazios | 🟡 Média |
| PAI-010 | Redirecionamento após login | 🔴 Alta |

### 1.3 Logout de Pai
| ID | Caso de Uso | Prioridade |
|----|-------------|------------|
| PAI-011 | Logout limpa sessão | 🟡 Média |
| PAI-012 | Redirecionamento após logout | 🟡 Média |

---

## 👶 MÓDULO 2: Gestão de Filhos (CRUD)

### 2.1 Cadastro de Filho
| ID | Caso de Uso | Prioridade |
|----|-------------|------------|
| FIL-001 | Cadastrar filho com dados válidos | 🔴 Alta |
| FIL-002 | Cadastrar com nickname duplicado | 🟡 Média |
| FIL-003 | Cadastrar com idade fora do range (6-14) | 🟡 Média |
| FIL-004 | Cadastrar com campos obrigatórios vazios | 🔴 Alta |
| FIL-005 | Cadastrar múltiplos filhos | 🟡 Média |

### 2.2 Listagem de Filhos
| ID | Caso de Uso | Prioridade |
|----|-------------|------------|
| FIL-006 | Listar filhos cadastrados | 🔴 Alta |
| FIL-007 | Lista vazia (sem filhos) | 🟡 Média |
| FIL-008 | Contagem de conversas por filho | 🟡 Média |

### 2.3 Edição de Filho
| ID | Caso de Uso | Prioridade |
|----|-------------|------------|
| FIL-009 | Editar nome do filho | 🟡 Média |
| FIL-010 | Editar idade do filho | 🟡 Média |
| FIL-011 | Cancelar edição | 🟢 Baixa |

### 2.4 Ativar/Desativar Filho
| ID | Caso de Uso | Prioridade |
|----|-------------|------------|
| FIL-012 | Desativar filho | 🟡 Média |
| FIL-013 | Reativar filho | 🟡 Média |
| FIL-014 | Filho desativado não consegue login | 🔴 Alta |

### 2.5 Reset de Senha
| ID | Caso de Uso | Prioridade |
|----|-------------|------------|
| FIL-015 | Redefinir senha do filho | 🟡 Média |

---

## 👦 MÓDULO 3: Autenticação de Crianças

### 3.1 Login de Criança
| ID | Caso de Uso | Prioridade |
|----|-------------|------------|
| KID-001 | Login com nickname e senha válidos | 🔴 Alta |
| KID-002 | Login com senha incorreta | 🔴 Alta |
| KID-003 | Login com nickname inexistente | 🟡 Média |
| KID-004 | Login de filho desativado | 🟡 Média |
| KID-005 | Modal de login abre no dashboard | 🔴 Alta |

---

## 💬 MÓDULO 4: Chat

### 4.1 Envio de Mensagens
| ID | Caso de Uso | Prioridade |
|----|-------------|------------|
| CHAT-001 | Enviar pergunta válida | 🔴 Alta |
| CHAT-002 | Enviar mensagem vazia | 🟡 Média |
| CHAT-003 | Enviar mensagem muito longa (>500 chars) | 🟡 Média |
| CHAT-004 | Enviar mensagem muito curta (<2 chars) | 🟡 Média |

### 4.2 Resposta da IA
| ID | Caso de Uso | Prioridade |
|----|-------------|------------|
| CHAT-005 | Resposta recebida com sucesso | 🔴 Alta |
| CHAT-006 | Timeout na resposta da IA | 🟡 Média |
| CHAT-007 | Resposta com emoji e formatação | 🟢 Baixa |

### 4.3 Guard Rails - Input
| ID | Caso de Uso | Prioridade |
|----|-------------|------------|
| GR-001 | Pergunta escolar passa | 🔴 Alta |
| GR-002 | Prompt injection é bloqueado | 🔴 Alta |
| GR-003 | Palavra proibida é bloqueada | 🔴 Alta |
| GR-004 | Conteúdo sensível (suicídio) é bloqueado | 🔴 Alta |
| GR-005 | Drogas são bloqueadas | 🔴 Alta |
| GR-006 | Fora de contexto (youtuber) é bloqueado | 🔴 Alta |

### 4.4 Guard Rails - Output
| ID | Caso de Uso | Prioridade |
|----|-------------|------------|
| GR-007 | Output seguro é exibido | 🟡 Média |
| GR-008 | Output perigoso é filtrado | 🟡 Média |

### 4.5 Histórico no Chat
| ID | Caso de Uso | Prioridade |
|----|-------------|------------|
| CHAT-008 | Histórico aparece no chat | 🟡 Média |
| CHAT-009 | Últimas 10 mensagens mantidas | 🟢 Baixa |

---

## 📊 MÓDULO 5: Dashboard do Pai

### 5.1 Visualização Geral
| ID | Caso de Uso | Prioridade |
|----|-------------|------------|
| DSH-001 | Dashboard carrega após login | 🔴 Alta |
| DSH-002 | Lista de filhos exibida | 🔴 Alta |
| DSH-003 | Estatísticas por filho | 🟡 Média |

### 5.2 Navegação
| ID | Caso de Uso | Prioridade |
|----|-------------|------------|
| DSH-004 | Botão "Conversar" abre chat | 🔴 Alta |
| DSH-005 | Botão "Histórico" abre histórico | 🔴 Alta |
| DSH-006 | Botão "Voltar" retorna ao dashboard | 🔴 Alta |

---

## 📚 MÓDULO 6: Histórico de Conversas

### 6.1 Visualização
| ID | Caso de Uso | Prioridade |
|----|-------------|------------|
| HIS-001 | Página de histórico carrega | 🔴 Alta |
| HIS-002 | Lista de conversas exibida | 🔴 Alta |
| HIS-003 | Timeline por data | 🟡 Média |
| HIS-004 | Ícones de status (🟢/🔴) | 🟡 Média |

### 6.2 Filtros
| ID | Caso de Uso | Prioridade |
|----|-------------|------------|
| HIS-005 | Filtrar por filho | 🔴 Alta |
| HIS-006 | Filtrar por status (aprovado/bloqueado) | 🟡 Média |
| HIS-007 | Buscar por texto | 🟡 Média |
| HIS-008 | Busca com menos de 2 caracteres | 🟢 Baixa |

### 6.3 Detalhes da Conversa
| ID | Caso de Uso | Prioridade |
|----|-------------|------------|
| HIS-009 | Modal de detalhes abre | 🟡 Média |
| HIS-010 | Pergunta completa exibida | 🟡 Média |
| HIS-011 | Resposta completa exibida | 🟡 Média |
| HIS-012 | Motivo de bloqueio (se aplicável) | 🟡 Média |

### 6.4 Exportação
| ID | Caso de Uso | Prioridade |
|----|-------------|------------|
| HIS-013 | Exportar CSV funciona | 🟡 Média |
| HIS-014 | CSV contém dados corretos | 🟡 Média |

---

## 📈 MÓDULO 7: Estatísticas e Alertas

### 7.1 Estatísticas
| ID | Caso de Uso | Prioridade |
|----|-------------|------------|
| STAT-001 | Total de perguntas exibido | 🟡 Média |
| STAT-002 | Total de bloqueios exibido | 🟡 Média |
| STAT-003 | Taxa de bloqueio calculada | 🟡 Média |
| STAT-004 | Tópicos favoritos listados | 🟡 Média |

### 7.2 Alertas
| ID | Caso de Uso | Prioridade |
|----|-------------|------------|
| ALERT-001 | Alerta exibido após 3 bloqueios/hora | 🟡 Média |
| ALERT-002 | Modal de detalhes do alerta | 🟡 Média |

---

## 🔧 MÓDULO 8: Configurações

### 8.1 Retenção de Dados
| ID | Caso de Uso | Prioridade |
|----|-------------|------------|
| SET-001 | Visualizar configuração atual | 🟢 Baixa |
| SET-002 | Alterar período de retenção | 🟢 Baixa |

---

## 📱 MÓDULO 9: Responsividade

| ID | Caso de Uso | Prioridade |
|----|-------------|------------|
| RES-001 | Layout mobile (< 600px) | 🟡 Média |
| RES-002 | Layout tablet (600-1024px) | 🟢 Baixa |
| RES-003 | Layout desktop (> 1024px) | 🟡 Média |

---

## 🌐 MÓDULO 10: Navegação e Fluxo

| ID | Caso de Uso | Prioridade |
|----|-------------|------------|
| NAV-001 | Fluxo completo: Registrar → Adicionar filho → Chat → Histórico | 🔴 Alta |
| NAV-002 | Fluxo: Login pai → Ver histórico → Filtrar → Ver detalhes | 🔴 Alta |
| NAV-003 | Acesso sem autenticação redireciona | 🟡 Média |
| NAV-004 | Browser back/forward funciona | 🟡 Média |

---

## 📊 RESUMO

| Módulo | Total Testes | 🔴 Alta | 🟡 Média | 🟢 Baixa |
|--------|--------------|---------|----------|----------|
| 1. Auth Pai | 12 | 6 | 6 | 0 |
| 2. Gestão Filhos | 15 | 2 | 11 | 2 |
| 3. Auth Criança | 5 | 2 | 3 | 0 |
| 4. Chat + Guard Rails | 16 | 10 | 5 | 1 |
| 5. Dashboard | 6 | 4 | 2 | 0 |
| 6. Histórico | 14 | 2 | 11 | 1 |
| 7. Estatísticas | 6 | 0 | 6 | 0 |
| 8. Configurações | 2 | 0 | 0 | 2 |
| 9. Responsividade | 3 | 0 | 1 | 2 |
| 10. Navegação | 4 | 2 | 2 | 0 |
| **TOTAL** | **83** | **28** | **47** | **8** |

---

## 🎯 Ordem Sugerida de Implementação

1. **Sprint 1 (Prioridade Alta):** Módulos 1, 3, 4 (Auth + Chat + Guard Rails)
2. **Sprint 2:** Módulos 2, 5, 10 (CRUD + Dashboard + Fluxo)
3. **Sprint 3:** Módulo 6 (Histórico completo)
4. **Sprint 4:** Módulos 7, 8, 9 (Stats, Config, Responsividade)

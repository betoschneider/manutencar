# ManutenCar 🚗

ManutenCar é uma aplicação web para gerenciamento de manutenção veicular com suporte a autenticação tradicional e Google OAuth. O sistema permite que usuários cadastrem seus veículos, registrem manutenções realizadas (com custos de serviço e peças), visualizem o histórico e recebam alertas automáticos baseados em quilometragem ou tempo.

## 🚀 Funcionalidades

-   **Autenticação de Usuários:** Registro e Login seguros (JWT) com email/senha **ou Google OAuth**.
-   **Limite de Contas (ACCOUNT_QUOTE):** Controle quantas contas podem ser criadas no sistema (0 = ilimitado). Exibe mensagem de erro amigável quando o limite é atingido.
-   **Gestão de Veículos:** Cadastro, edição e listagem de veículos (Marca, Modelo, Ano, KM, Placa).
-   **Registro de Manutenção:** Lançamento de serviços realizados com controle de custos (Peças e Mão de obra).
-   **Alertas Inteligentes:** O sistema avisa automaticamente quando uma manutenção está vencida por tempo ou quilometragem.
-   **Assistente Mecânico IA (BYOK):** Integração com inteligência artificial (OpenAI, Gemini, Claude) usando a própria chave de API do usuário para analisar o histórico do veículo, diagnosticar problemas crônicos do modelo e sugerir manutenções preventivas urgentes.
-   **Padronização Automática:** Normalização inteligente da nomenclatura de serviços registrados utilizando IA para manter o histórico limpo e analítico.
-   **Histórico Detalhado:** Visualização completa de todas as manutenções realizadas em cada veículo com exportação para CSV.
-   **Dashboard com Gráficos e Projeções:** Visualização gráfica dos gastos, médias mensais e estimativas de manutenções futuras para os próximos 12 meses.
-   **Painel Administrativo:** Gestão dos tipos de manutenção e seus intervalos padrão.
-   **Tema:** Suporte a modo Claro e Escuro.

## 🛠️ Tecnologias Utilizadas

### Backend
-   **Linguagem:** Python 3.12
-   **Framework:** FastAPI
-   **Banco de Dados:** SQLite (via SQLAlchemy)
-   **Autenticação:** OAuth2 com JWT (Passlib/Jose)
-   **Inteligência Artificial (LLMs):** Integrações nativas com OpenAI, Google Gemini e Anthropic Claude.
-   **Segurança (BYOK):** Gerenciamento seguro e criptografia para chaves de API customizadas.

### Frontend
-   **Biblioteca:** React (via CDN)
-   **Servidor Web:** Nginx (para servir arquivos estáticos e roteamento SPA)
-   **Estilização:** Tailwind CSS
-   **Gráficos:** Recharts
-   **HTTP Client:** Axios

### Infraestrutura
-   **Containerização:** Docker & Docker Compose (Arquitetura de múltiplos containers)
-   **Proxy Reverso Interno:** Nginx (dentro do container frontend)
-   **CI/CD:** GitHub Actions

## 📦 Como Rodar o Projeto

### Pré-requisitos
-   Docker e Docker Compose instalados.

### Configuração do Ambiente

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/betoschneider/manutencar.git
    cd manutencar
    ```

2.  **Configure as variáveis de ambiente (opcional):**
    Copie o arquivo de exemplo e ajuste conforme necessário:
    ```bash
    cp env.example .env
    ```
    Variáveis disponíveis:

    | Variável | Descrição | Padrão |
    |----------|-----------|--------|
    | `ACCOUNT_QUOTE` | Limite máximo de contas (0 = ilimitado) | `0` |
    | `GOOGLE_CLIENT_ID` | ID do cliente OAuth do Google | (vazio) |
    | `GOOGLE_CLIENT_SECRET` | Segredo do cliente OAuth do Google | (vazio) |
    | `ENCRYPTION_KEY` | Chave para criptografia das API Keys | (gerada automaticamente) |
    | `GLOBAL_DASHBOARD_TOKEN` | Token para acesso ao painel global | (vazio) |

3.  **Inicie a aplicação com Docker Compose:**
    ```bash
    docker compose up --build -d
    ```
    *Isso irá construir as imagens do backend (FastAPI) e frontend (Nginx) de forma independente.*

4.  **Acesse a aplicação:**
    -   **Frontend (Interface do Usuário):** [http://localhost:8511](http://localhost:8511)
    -   **Backend (Documentação da API):** [http://localhost:8090/docs](http://localhost:8090/docs)

### Google OAuth (Login com Google)

Para habilitar o login com Google:

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Crie um projeto e configure a tela de consentimento OAuth
3. Crie uma credencial do tipo "ID do cliente OAuth 2.0" para "Aplicativo Web"
4. Adicione `http://localhost:8511` como "Origens JavaScript autorizadas"
5. Adicione `http://localhost:8511/login` como "URIs de redirecionamento autorizados"
6. Defina `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` no arquivo `.env`
7. Reinicie os containers: `docker compose up --build -d`

> **Nota:** O botão "Entrar com Google" aparece nas páginas de Login e Cadastro. Se o `GOOGLE_CLIENT_ID` não estiver configurado, uma mensagem "Google OAuth não configurado" é exibida no lugar do botão.

### Migrations com Alembic

O esquema do banco de dados é versionado usando Alembic. Ao subir o container, as migrations pendentes são aplicadas automaticamente via `entrypoint.sh`.

- **Gerenciar novas migrations (desenvolvimento local):**
  ```bash
  cd backend
  source .venv/bin/activate
  alembic revision --autogenerate -m "descricao da mudanca"
  alembic upgrade head
  ```

- **Verificar status:**
  ```bash
  alembic current
  ```

### Simplificação da Arquitetura

- Backend e Frontend rodam em containers Docker independentes
- Frontend é servido pelo Nginx (não pelo FastAPI)
- Chamadas de API são roteadas via proxy reverso (`/api/` → backend:8090)
- Banco de dados SQLite persistido em volume Docker

## 🔧 Estrutura de Produção (Docker)

O projeto separa as responsabilidades em dois containers principais:

-   **Frontend Container (Nginx):** Serve os arquivos `index.html`, `App.js` e outros scripts React. Ele também gerencia o proxy para a API, enviando chamadas de `/api/*` diretamente para o container do backend.
-   **Backend Container (FastAPI):** Serve exclusivamente a API REST e a documentação interativa.

Esta arquitetura garante que a aplicação seja resiliente e escalável, seguindo as melhores práticas de ambientes modernos.

## 📝 Licença

Este projeto é de uso livre para fins de aprendizado e desenvolvimento pessoal.
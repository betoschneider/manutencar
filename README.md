# ManutenCar 🚗

ManutenCar é uma aplicação web cumpre bem o seu papel para gerenciamento de manutenção veicular. O sistema permite que usuários cadastrem seus veículos, registrem manutenções realizadas (com custos de serviço e peças), visualizem o histórico e recebam alertas automáticos baseados em quilometragem ou tempo.

## 🚀 Funcionalidades

-   **Autenticação de Usuários:** Registro e Login seguros (JWT).
-   **Gestão de Veículos:** Cadastro, edição e listagem de veículos (Marca, Modelo, Ano, KM, Placa).
-   **Registro de Manutenção:** Lançamento de serviços realizados com controle de custos (Peças e Mão de obra).
-   **Alertas Inteligentes:** O sistema avisa automaticamente quando uma manutenção está vencida por tempo ou quilometragem.
-   **Histórico Detalhado:** Visualização completa de todas as manutenções realizadas em cada veículo.
-   **Dashboard com Gráficos:** Visualização gráfica dos gastos e quantidade de manutenções nos últimos 12 meses.
-   **Painel Administrativo:** Gestão dos tipos de manutenção e seus intervalos padrão.
-   **Tema:** Suporte a modo Claro e Escuro.

## 🛠️ Tecnologias Utilizadas

### Backend
-   **Linguagem:** Python 3.12
-   **Framework:** FastAPI
-   **Banco de Dados:** SQLite (via SQLAlchemy)
-   **Autenticação:** OAuth2 com JWT (Passlib/Jose)

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

### Passo a Passo

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/betoschneider/manutencar.git
    cd manutencar
    ```

2.  **Inicie a aplicação com Docker Compose:**
    ```bash
    docker-compose up --build -d
    ```
    *Isso irá construir as imagens do backend (FastAPI) e frontend (Nginx) de forma independente.*

3.  **Acesse a aplicação:**
    -   **Frontend (Interface do Usuário):** [http://localhost:8511](http://localhost:8511)
    -   **Backend (Documentação da API):** [http://localhost:8090/docs](http://localhost:8090/docs)

## 🔧 Estrutura de Produção (Docker)

O projeto separa as responsabilidades em dois containers principais:

-   **Frontend Container (Nginx):** Serve os arquivos `index.html`, `App.js` e outros scripts React. Ele também gerencia o proxy para a API, enviando chamadas de `/api/*` diretamente para o container do backend.
-   **Backend Container (FastAPI):** Serve exclusivamente a API REST e a documentação interativa.

Esta arquitetura garante que a aplicação seja resiliente e escalável, seguindo as melhores práticas de ambientes modernos.

## 📝 Licença

Este projeto é de uso livre para fins de aprendizado e desenvolvimento pessoal.
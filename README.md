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
-   **Estilização:** Tailwind CSS
-   **Gráficos:** Recharts
-   **HTTP Client:** Axios

### Infraestrutura
-   **Containerização:** Docker & Docker Compose
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

2.  **Crie o arquivo `.env`:**
    Crie um arquivo `.env` na raiz do projeto com as configurações desejadas (consulte a seção de Configuração acima).

3.  **Inicie a aplicação com Docker Compose:**
    ```bash
    docker-compose up --build
    ```
    *Isso irá construir as imagens do backend e frontend e iniciar os containers.*

4.  **Acesse a aplicação:**
    -   **Aplicação Completa:** [http://localhost:8090](http://localhost:8090)
    -   **Documentação da API (Docs):** [http://localhost:8090/docs](http://localhost:8090/docs)

## 🔧 Desenvolvimento Local (Sem Docker)

Se preferir rodar localmente sem Docker:

1.  **Prepare o ambiente:**
    ```bash
    python -m venv venv
    source venv/bin/activate # (Linux/Mac) ou venv\Scripts\activate (Windows)
    pip install -r requirements.txt
    ```

2.  **Inicie o servidor:**
    ```bash
    uvicorn main:app --reload --port 8090
    ```
    *A aplicação frontend (HTML/JS) é servida automaticamente pelo FastAPI.*

## 📝 Licença

Este projeto é de uso livre para fins de aprendizado e desenvolvimento pessoal.
# 🏭 ControlSys - Industrial WMS (Warehouse Management System)

> Sistema robusto para gestão de almoxarifado industrial, focado em controle de estoque via **QR Code**, **rastreabilidade de usuários** e **dashboards analíticos** para apoio à tomada de decisão.

---

## 📋 Sobre o Projeto

O **ControlSys** foi desenvolvido para substituir planilhas manuais e processos baseados em papel em ambientes industriais.
O sistema permite que gestores controlem o inventário em tempo real, gerem etiquetas QR Code para ativos, monitorem níveis de estoque mínimo e auditem todas as movimentações (entradas e saídas) realizadas pela equipe.

A aplicação utiliza uma arquitetura moderna, separando **Frontend (Angular)** e **Backend (Python FastAPI)**, garantindo maior performance, segurança e escalabilidade.

---

## 🚀 Funcionalidades Principais

### 📦 Gestão de Estoque

* **CRUD Completo de Itens**
  Cadastro com Nome, Categoria, Localização Física (Corredor/Prateleira), Estoque Atual e Estoque Mínimo.
* **Upload de Fotos**
  Armazenamento de imagens reais dos produtos para fácil identificação.
* **Importação em Massa**
  Importação de itens via planilhas Excel (.xlsx).
* **Controle de Estoque Mínimo**
  Alertas visuais quando um item atinge nível crítico.

---

### 🏷️ Tecnologia QR Code

* **Geração Automática**
  Criação instantânea de QR Codes únicos para cada item.
* **Central de Etiquetas**
  Interface dedicada para busca e impressão de etiquetas formatadas.
* **Leitura Mobile**
  Scanner integrado via câmera (webcam ou celular) para registrar entradas e saídas rapidamente.

---

### 📊 Dashboard e BI

* **KPIs em Tempo Real**

  * Total de Itens
  * Itens em Estoque Crítico
  * Usuários Ativos
* **Gráficos Interativos**

  * Fluxo de Movimentação (Pizza: Entradas vs. Saídas)
  * Top 5 Itens Mais Movimentados (Barras)
* **Exportação de Relatórios**

  * Auditoria completa em Excel (.xlsx)

---

### 🔐 Segurança e Experiência do Usuário

* **Autenticação JWT**

  * Senhas criptografadas com Bcrypt
  * Proteção de rotas no frontend (Guards)
* **Controle de Acesso (RBAC)**

  * **Admin:** Acesso total (Dashboard, Cadastros e Relatórios)
  * **Comum:** Acesso restrito à tela de Movimentação (Scanner)
* **Feedback Visual**

  * Notificações (Toast) para sucesso/erro
  * Modais de confirmação para ações destrutivas

---

## 🛠️ Tecnologias Utilizadas

### Frontend (Client-Side)

* **Framework:** Angular 17+ (Standalone Components)
* **Estilização:** SCSS (Sass) com Design System próprio (*Kinross Theme*)
* **Gráficos:** Chart.js / ng2-charts
* **Scanner QR Code:** @zxing/ngx-scanner
* **Ícones:** Google Material Icons

### Backend (Server-Side)

* **Linguagem:** Python 3.10+
* **Framework:** FastAPI
* **Banco de Dados:** SQLite (SQLAlchemy ORM)
* **Segurança:** Passlib (Bcrypt Hashing)
* **Processamento de Dados:** Pandas / OpenPyXL
* **Imagens e QR Code:** Pillow / qrcode
* **Upload de Arquivos:** python-multipart / aiofiles

---

## ⚙️ Instalação e Execução

### Pré-requisitos

* Node.js v18+
* Python 3.10+
* Git

---

### 1️⃣ Backend (Python FastAPI)

```bash
# Acesse a pasta do backend
cd backend

# (Opcional) Crie e ative um ambiente virtual
python -m venv venv
# Windows
.\venv\Scripts\activate
# Linux / Mac
source venv/bin/activate

# Instale as dependências
pip install fastapi uvicorn sqlalchemy pandas openpyxl passlib[bcrypt] python-multipart aiofiles qrcode[pil]

# Crie a pasta de uploads (se não existir)
mkdir uploads

# Inicie o servidor
uvicorn main:app --reload
```

📍 Backend disponível em: `http://localhost:8000`

---

### 2️⃣ Frontend (Angular)

```bash
# Acesse a pasta do frontend
cd frontend

# Instale as dependências
npm install

# Inicie a aplicação
ng serve
```

📍 Frontend disponível em: `http://localhost:4200`

---

## 🔑 Acesso Inicial

No primeiro acesso, o sistema cria automaticamente um usuário administrador padrão:

* **Usuário:** `admin`
* **Senha:** `admin123`

> ⚠️ **Recomendação:** Crie um novo usuário administrador e altere a senha imediatamente após o primeiro login.

---

## 📂 Estrutura do Projeto

```
ControlSys/
├── backend/
│   ├── uploads/            # Imagens dos produtos
│   ├── estoque.db          # Banco de dados SQLite
│   ├── main.py             # API principal
│   └── ...
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── admin/       # Dashboard e CRUDs
│   │   │   ├── components/  # Toasts, Modais, Componentes reutilizáveis
│   │   │   ├── guards/      # Proteção de rotas
│   │   │   ├── login/       # Autenticação
│   │   │   ├── movimentacao/# Scanner e movimentações
│   │   │   └── services/    # Comunicação com a API
│   └── ...
└── README.md
```

---

## 📱 Acesso via Celular (Scanner)

Para utilizar a câmera do celular como leitor de QR Code:

1. Descubra o IP do computador (ex: `192.168.1.15`)
2. Inicie o backend:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

3. Inicie o frontend:

```bash
ng serve --host 0.0.0.0
```

4. No celular, acesse:

```
http://192.168.1.15:4200
```

---

## 👨‍💻 Desenvolvedor

**Riquelmy**
*Analista de Dados Industrial*

---

## 📝 Licença

Este projeto está licenciado sob a licença **MIT**.
Consulte o arquivo LICENSE para mais informações.

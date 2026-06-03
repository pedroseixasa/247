# Backend - Barbearia 247

Sistema de reservas para barbearias com autenticação, SMS e painel admin.

## Requisitos

- Node.js 14+
- MongoDB (local ou cloud como MongoDB Atlas)
- Conta Twilio (para SMS)

## Instalação

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Editar `.env` com suas credenciais:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/barbearia
JWT_SECRET=seu_secret_key_super_seguro_aqui_mude_isto
TWILIO_ACCOUNT_SID=seu_sid
TWILIO_AUTH_TOKEN=seu_token
TWILIO_PHONE_NUMBER=+351912345678
```

### 3. Inicializar base de dados

```bash
node seed.js
```

Isto cria:

- **Admin**: diogo@barbearia247.pt / admin123
- **Barber 1**: barbeiro1@247barbearia.pt / barber123
- **Barber 2**: barbeiro2@247barbearia.pt / barber123
- **9 Services** predefinidos

Para criar/atualizar as duas contas de barbeiro com dados personalizados, usa também:

```bash
npm run createbarbers
```

Podes definir `BARBER_1_NAME`, `BARBER_1_EMAIL`, `BARBER_1_PASSWORD`, `BARBER_1_PHOTO` e os equivalentes `BARBER_2_*` no `.env`.

### 4. Iniciar servidor

Desenvolvimento:

```bash
npm run dev
```

Produção:

```bash
npm start
```

Servidor estará em `http://localhost:5000`

### 5. Teste local do admin

Se estiveres a abrir [admin/index.html](../admin/index.html) diretamente no browser ou via Live Server, o painel usa `http://localhost:5000/api` em vez da API de produção.

- Abre primeiro o backend com `npm run dev`
- Mantém o MongoDB local ou o `MONGODB_URI` apontado para um Atlas de teste
- Usa as credenciais seed do admin para validar o login local sem tocar no ambiente em produção

### 6. Backend em produção sem frontend

Se o backend já estiver publicado em produção e o frontend ainda não, podes criar ou atualizar as duas contas de barbeiro diretamente na base de produção executando o script com as variáveis de produção carregadas:

```bash
npm run createbarbers
```

Esse script usa `BARBER_1_*` e `BARBER_2_*` para nome, email, password, telefone e foto, e faz upsert por email para não duplicar contas.

### 7. Perfis de barbeiro

Os barbeiros entram em [admin/barber-login.html](../admin/barber-login.html) e só veem:

- `Perfil`
- `Ausências`
- `Reservas`
- `Dashboard` com faturação própria

## API Endpoints

### Autenticação

- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Dados do barbeiro atual

### Reservas (Público)

- `POST /api/reservations` - Criar nova reserva
- `GET /api/reservations/barber/:barberId?date=2024-02-20` - Listar reservas

### Admin (Apenas Diogo - role: admin)

- `GET /api/admin/barbers` - Listar barbeiros
- `PATCH /api/admin/barbers/:barberId` - Atualizar barbeiro
- `GET /api/admin/services` - Listar serviços
- `POST /api/admin/services` - Criar serviço
- `PATCH /api/admin/services/:serviceId` - Atualizar serviço
- `DELETE /api/admin/services/:serviceId` - Deletar serviço
- `GET /api/admin/settings` - Dados do site
- `POST /api/admin/content` - Atualizar conteúdo

## Fluxo de Reserva

1. Cliente preenche modal no site
2. API valida dados e cria reserva
3. SMS é enviado automaticamente para confirmar
4. Barbeiro vê reserva no painel
5. Pode mudar status para confirmed/cancelled/completed

## Configurar Twilio

1. Ir em https://www.twilio.com
2. Registar (grátis com créditos)
3. Copiar Account SID e Auth Token
4. Comprar número de telefone (PT)
5. Adicionar em `.env`

## Segurança

⚠️ TODO (antes de produção):

- Mudar JWT_SECRET para algo aleatório forte
- Mudar passwords dos barbeiros
- Ativar HTTPS
- Adicionar rate limiting
- Validação mais rigorosa de inputs

## Estrutura de Pastas

```
backend/
├── src/
│   ├── models/        (Schemas MongoDB)
│   ├── routes/        (Endpoints)
│   ├── controllers/   (Lógica)
│   └── middleware/    (Auth)
├── server.js          (Entrada)
├── seed.js            (Iniciar DB)
├── .env               (Config)
└── package.json
```

## Deploy

Opções recomendadas:

- **Render** - Fácil, grátis
- **Railway** - Simples
- **Heroku** - Pago
- **DigitalOcean** - Controlo total

## Suporte

Para dúvidas, checar logs do servidor:

```bash
npm run dev
```

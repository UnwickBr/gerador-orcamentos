# Gerador de Orcamentos em PDF

Site para preencher dados, gerar o layout do orcamento e exportar PDF. Agora com backend Node.js + SQLite para controlar o numero do orcamento e autenticar usuarios.

## Funcionalidades

- Campos do formulario iniciam em branco.
- Numero do orcamento vem do banco de dados (SQLite).
- Cada clique em `Gerar Orcamento` salva um registro no banco.
- Login com usuario e senha.
- Painel de administracao para criar usuarios.
- Perfis `admin` e `user`.
- Adicao/remocao de itens com total automatico.
- Pre-visualizacao do documento antes de baixar.
- Exportacao para PDF no navegador.

## Requisitos

- Node.js 18+ instalado.

## Como executar localmente

1. Abra terminal na pasta do projeto.
2. Instale as dependencias:

```bash
npm install
```

3. Inicie o servidor:

```bash
npm start
```

4. Acesse no navegador:

`http://localhost:3000`

## Acesso inicial

- Usuario admin padrao: `fariavictor@live.com`
- Senha padrao: `01043678vV@`

Ao abrir `http://localhost:3000`, a pagina inicial sera o login.
Depois de autenticar, o sistema redireciona para `/app`.
Para criar conta comum, use o botao `Criar Login e Senha` na tela de login.
Como admin, acesse `/users` para criar novos logins e novos administradores.

## Banco de dados

- Arquivo SQLite: `data/budgets.db`
- Tabelas: `budgets` e `users`
- O numero do orcamento e o `id` auto incremento da tabela.

## Estrutura

- `index.html`: interface do formulario e pre-visualizacao.
- `styles.css`: visual da pagina e da folha.
- `app.js`: logica do frontend (itens, preview, PDF e chamadas API).
- `server.js`: API e persistencia SQLite.
- `login.html` e `login.js`: autenticacao.
- `users.html` e `users.js`: gestao de usuarios (admin).
- `package.json`: scripts e dependencias Node.

## Publicar no GitHub

```bash
git add .
git commit -m "feat: numeracao por banco SQLite"
git push
```

## Observacao importante

Como agora existe backend + banco, nao e mais compativel com GitHub Pages puro (estatico).

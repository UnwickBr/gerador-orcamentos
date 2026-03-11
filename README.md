# Gerador de Orcamentos em PDF

Projeto web para preencher dados de orcamento, visualizar em tempo real e gerar um arquivo PDF pronto para envio ao cliente.

## Funcionalidades

- Formulario completo para dados da empresa, cliente e condicoes do orcamento.
- Adicao e remocao dinamica de itens.
- Calculo automatico do total geral.
- Pre-visualizacao no formato de folha de orcamento.
- Geracao de PDF no navegador.
- Numero de orcamento incremental salvo no `localStorage`.

## Como executar

1. Baixe/clone este repositorio.
2. Abra o arquivo `index.html` no navegador.

Opcional com servidor local:

```bash
# Python 3
python -m http.server 5500
```

Acesse `http://localhost:5500`.

## Estrutura

- `index.html`: interface e template de pre-visualizacao.
- `styles.css`: estilos da pagina e do layout para impressao/PDF.
- `app.js`: regras de negocio, itens, calculos e geracao do PDF.

## Publicar no GitHub

1. Crie um repositorio no GitHub, por exemplo: `gerador-orcamentos-pdf`.
2. Na pasta do projeto, rode:

```bash
git init
git add .
git commit -m "feat: gerador de orcamentos com exportacao para PDF"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/gerador-orcamentos-pdf.git
git push -u origin main
```

3. (Opcional) Ative o GitHub Pages em `Settings > Pages` para publicar o site.

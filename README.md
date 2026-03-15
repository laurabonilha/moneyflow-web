# 💸 MoneyFlow Web

Interface frontend do **MoneyFlow**, um sistema de controle de gastos pessoais com design inspirado em fintechs modernas.

## 📋 Descrição

SPA (Single Page Application) desenvolvida com HTML, CSS e JavaScript puro, consumindo a API REST do MoneyFlow. Permite visualizar o saldo, registrar receitas e despesas, gerenciar categorias e acompanhar o histórico financeiro por mês.

## 🚀 Como executar

1. Certifique-se de que a **API do MoneyFlow** está rodando em `http://localhost:5000`
2. Abra o arquivo `index.html` diretamente no navegador

> Nenhuma instalação de dependências é necessária. Todos os recursos externos (Bootstrap, Chart.js, Google Fonts) são carregados via CDN.

## 🗂️ Estrutura

```
moneyflow-web/
├── index.html   # Estrutura HTML da SPA
├── style.css    # Estilos personalizados
├── app.js       # Lógica JavaScript e chamadas à API
└── README.md
```

## 🔌 Rotas da API consumidas

| Método | Rota | Onde é usada |
|--------|------|-------------|
| GET | `/resumo` | Dashboard — cards de saldo |
| GET | `/resumo/categorias` | Dashboard — gráfico de pizza |
| GET | `/transacoes` | Dashboard — últimas transações |
| GET | `/transacoes/mes/:ano/:mes` | Transações — filtro por mês |
| GET | `/transacoes/:id` | Utilitário interno |
| POST | `/transacoes` | Formulário de nova transação |
| DELETE | `/transacoes/:id` | Botão excluir transação |
| GET | `/categorias` | Select de categorias + listagem |
| GET | `/categorias/:id` | Utilitário interno |
| POST | `/categorias` | Formulário de nova categoria |
| DELETE | `/categorias/:id` | Botão excluir categoria |
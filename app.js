/* ═══════════════════════════════════════════════════
   FINTRACK — app.js
   SPA em JavaScript Vanilla
   Todas as chamadas à API estão mapeadas aqui
═══════════════════════════════════════════════════ */

const API_URL = 'http://localhost:5000';

// Estado global da aplicação
const estado = {
    secaoAtiva: 'dashboard',
    mesAtual: new Date().getMonth() + 1,
    anoAtual: new Date().getFullYear(),
    grafico: null,
};

const MESES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

/* ══════════════════════════════════════════════════
   INICIALIZAÇÃO
══════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    atualizarData();
    verificarAPI();
    navegarPara('dashboard', document.querySelector('.nav-item.active'));
    configurarPreviewCategoria();
    definirDataHoje();
});

function atualizarData() {
    const el = document.getElementById('topbarDate');
    const agora = new Date();
    el.textContent = agora.toLocaleDateString('pt-BR', {
        weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
    });
}

function definirDataHoje() {
    const hoje = new Date().toISOString().split('T')[0];
    const input = document.getElementById('txData');
    if (input) input.value = hoje;
}

/* ══════════════════════════════════════════════════
   VERIFICAÇÃO DE CONEXÃO COM A API
══════════════════════════════════════════════════ */
async function verificarAPI() {
    const dot = document.getElementById('statusDot');
    const text = document.getElementById('statusText');
    try {
        const res = await fetch(`${API_URL}/categorias`);
        if (res.ok) {
            dot.className = 'status-dot online';
            text.textContent = 'API conectada';
        } else {
            throw new Error();
        }
    } catch {
        dot.className = 'status-dot offline';
        text.textContent = 'API offline';
    }
}

/* ══════════════════════════════════════════════════
   NAVEGAÇÃO SPA
══════════════════════════════════════════════════ */
function navegarPara(secao, linkEl) {
    // Esconde todas as seções
    document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));

    // Mostra a seção correta
    document.getElementById(`section-${secao}`).classList.add('active');

    // Atualiza título da topbar
    const titulos = { dashboard: 'Dashboard', transacoes: 'Transações', categorias: 'Categorias' };
    document.getElementById('pageTitle').textContent = titulos[secao] || secao;

    // Atualiza item ativo na nav
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    if (linkEl) linkEl.classList.add('active');

    // Fecha sidebar em mobile
    if (window.innerWidth <= 860) {
        document.getElementById('sidebar').classList.remove('open');
    }

    estado.secaoAtiva = secao;

    // Carrega os dados da seção
    if (secao === 'dashboard') carregarDashboard();
    if (secao === 'transacoes') carregarTransacoes();
    if (secao === 'categorias') carregarCategorias();

    return false;
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const main = document.querySelector('.main-content');
    if (window.innerWidth <= 860) {
        sidebar.classList.toggle('open');
    } else {
        sidebar.classList.toggle('collapsed');
        main.classList.toggle('expanded');
    }
}

/* ══════════════════════════════════════════════════
   DASHBOARD
══════════════════════════════════════════════════ */
async function carregarDashboard() {
    await Promise.all([
        carregarResumo(),
        carregarGraficoCategorias(),
        carregarTransacoesRecentes(),
    ]);
}

// GET /resumo
async function carregarResumo() {
    try {
        const res = await fetch(`${API_URL}/resumo`);
        const data = await res.json();

        const saldo = data.saldo ?? 0;
        const receitas = data.total_receitas ?? 0;
        const despesas = data.total_despesas ?? 0;

        const elSaldo = document.getElementById('cardSaldo');
        const elReceitas = document.getElementById('cardReceitas');
        const elDespesas = document.getElementById('cardDespesas');
        const elBadge = document.getElementById('badgeSaldo');

        elSaldo.textContent = formatarMoeda(saldo);
        elReceitas.textContent = formatarMoeda(receitas);
        elDespesas.textContent = formatarMoeda(despesas);

        elSaldo.className = 'card-value ' + (saldo >= 0 ? 'positivo' : 'negativo');
        elBadge.textContent = saldo >= 0 ? '▲ Positivo' : '▼ Negativo';

    } catch (e) {
        console.error('Erro ao carregar resumo:', e);
    }
}

// GET /resumo/categorias
async function carregarGraficoCategorias() {
    try {
        const res = await fetch(`${API_URL}/resumo/categorias`);
        const data = await res.json();

        const comDados = data.filter(c => c.total > 0);
        const emptyEl = document.getElementById('chartEmpty');
        const canvas = document.getElementById('graficoCategorias');

        if (comDados.length === 0) {
            canvas.style.display = 'none';
            emptyEl.style.display = 'block';
            return;
        }

        canvas.style.display = 'block';
        emptyEl.style.display = 'none';

        const labels = comDados.map(c => `${c.icone || '📦'} ${c.categoria}`);
        const values = comDados.map(c => c.total);
        const cores = comDados.map(c => c.cor || '#1DB954');

        // Destrói gráfico anterior se existir
        if (estado.grafico) estado.grafico.destroy();

        estado.grafico = new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    data: values,
                    backgroundColor: cores,
                    borderWidth: 2,
                    borderColor: '#ffffff',
                    hoverOffset: 6,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                cutout: '68%',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: ctx => ` ${formatarMoeda(ctx.raw)}`
                        }
                    }
                }
            }
        });

        // Legenda personalizada
        const legendEl = document.getElementById('chartLegend');
        legendEl.innerHTML = comDados.map(c => `
      <div class="legend-item">
        <div class="legend-dot" style="background:${c.cor || '#1DB954'}"></div>
        <span>${c.icone || '📦'} ${c.categoria}</span>
      </div>
    `).join('');

    } catch (e) {
        console.error('Erro ao carregar gráfico:', e);
    }
}

// GET /transacoes (últimas 5 para o dashboard)
async function carregarTransacoesRecentes() {
    try {
        const res = await fetch(`${API_URL}/transacoes`);
        const data = await res.json();

        const container = document.getElementById('recentTransactions');
        const ultimas = data.slice(0, 5);

        if (ultimas.length === 0) {
            container.innerHTML = '<div class="empty-state">Nenhuma transação registrada.</div>';
            return;
        }

        container.innerHTML = ultimas.map(t => renderTransactionItem(t, false)).join('');

    } catch (e) {
        console.error('Erro ao carregar transações recentes:', e);
    }
}

/* ══════════════════════════════════════════════════
   TRANSAÇÕES
══════════════════════════════════════════════════ */
async function carregarTransacoes() {
    atualizarLabelMes();
    await carregarTransacoesPorMes();
    await popularSelectCategorias();
}

function atualizarLabelMes() {
    document.getElementById('mesLabel').textContent =
        `${MESES[estado.mesAtual - 1]} ${estado.anoAtual}`;
}

function mudarMes(direcao) {
    estado.mesAtual += direcao;
    if (estado.mesAtual > 12) { estado.mesAtual = 1; estado.anoAtual++; }
    if (estado.mesAtual < 1) { estado.mesAtual = 12; estado.anoAtual--; }
    atualizarLabelMes();
    carregarTransacoesPorMes();
}

// GET /transacoes/mes/<ano>/<mes>
async function carregarTransacoesPorMes() {
    const container = document.getElementById('listaTransacoes');
    container.innerHTML = '<div class="empty-state">Carregando...</div>';

    try {
        const res = await fetch(`${API_URL}/transacoes/mes/${estado.anoAtual}/${estado.mesAtual}`);
        const data = await res.json();

        if (data.length === 0) {
            container.innerHTML = '<div class="empty-state">Nenhuma transação neste mês.</div>';
            return;
        }

        container.innerHTML = data.map(t => renderTransactionItem(t, true)).join('');

    } catch (e) {
        container.innerHTML = '<div class="empty-state">Erro ao carregar transações.</div>';
    }
}

// GET /transacoes/:id  (chamado ao clicar em um item para detalhes futuros)
async function buscarTransacao(id) {
    try {
        const res = await fetch(`${API_URL}/transacoes/${id}`);
        const data = await res.json();
        return data;
    } catch (e) {
        console.error('Erro ao buscar transação:', e);
    }
}

// POST /transacoes
async function submitTransacao(event) {
    event.preventDefault();

    const payload = {
        descricao: document.getElementById('txDescricao').value.trim(),
        valor: parseFloat(document.getElementById('txValor').value),
        tipo: document.getElementById('txTipo').value,
        categoria_id: document.getElementById('txCategoria').value || null,
        data: document.getElementById('txData').value,
    };

    if (!payload.descricao || !payload.valor || !payload.tipo || !payload.data) {
        mostrarToast('Preencha todos os campos obrigatórios.', 'erro');
        return;
    }

    try {
        const res = await fetch(`${API_URL}/transacoes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (res.ok) {
            mostrarToast('Transação registrada com sucesso!', 'sucesso');
            document.getElementById('formTransacao').reset();
            definirDataHoje();
            carregarTransacoesPorMes();
        } else {
            const err = await res.json();
            mostrarToast(err.erro || 'Erro ao registrar transação.', 'erro');
        }
    } catch (e) {
        mostrarToast('Não foi possível conectar à API.', 'erro');
    }
}

// DELETE /transacoes/:id
async function deletarTransacao(id) {
    if (!confirm('Deseja realmente excluir esta transação?')) return;

    try {
        const res = await fetch(`${API_URL}/transacoes/${id}`, { method: 'DELETE' });

        if (res.ok) {
            mostrarToast('Transação excluída.', 'sucesso');
            carregarTransacoesPorMes();
            if (estado.secaoAtiva === 'dashboard') carregarDashboard();
        } else {
            mostrarToast('Erro ao excluir transação.', 'erro');
        }
    } catch {
        mostrarToast('Não foi possível conectar à API.', 'erro');
    }
}

/* ══════════════════════════════════════════════════
   CATEGORIAS
══════════════════════════════════════════════════ */
async function carregarCategorias() {
    const container = document.getElementById('listaCategorias');
    const countEl = document.getElementById('catCount');
    container.innerHTML = '<div class="empty-state">Carregando...</div>';

    // GET /categorias
    try {
        const res = await fetch(`${API_URL}/categorias`);
        const data = await res.json();

        countEl.textContent = `${data.length} categoria${data.length !== 1 ? 's' : ''}`;

        if (data.length === 0) {
            container.innerHTML = '<div class="empty-state" style="grid-column:1/-1">Nenhuma categoria criada ainda.</div>';
            return;
        }

        container.innerHTML = data.map(c => renderCategoryCard(c)).join('');

    } catch {
        container.innerHTML = '<div class="empty-state">Erro ao carregar categorias.</div>';
    }
}

// GET /categorias/:id  (usado para popular o select de transações)
async function buscarCategoria(id) {
    try {
        const res = await fetch(`${API_URL}/categorias/${id}`);
        const data = await res.json();
        return data;
    } catch (e) {
        console.error('Erro ao buscar categoria:', e);
    }
}

// POST /categorias
async function submitCategoria(event) {
    event.preventDefault();

    const payload = {
        nome: document.getElementById('catNome').value.trim(),
        icone: document.getElementById('catIcone').value.trim() || '📦',
        cor: document.getElementById('catCor').value,
    };

    if (!payload.nome) {
        mostrarToast('O nome da categoria é obrigatório.', 'erro');
        return;
    }

    try {
        const res = await fetch(`${API_URL}/categorias`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (res.ok) {
            mostrarToast('Categoria criada com sucesso!', 'sucesso');
            document.getElementById('formCategoria').reset();
            document.getElementById('catCor').value = '#2ECC71';
            resetarPreview();
            carregarCategorias();
        } else if (res.status === 409) {
            let msgErro = 'Já existe uma categoria com este nome.';
            try {
                const err = await res.json();
                if (err.erro) msgErro = err.erro;
            } catch (e) {}
            mostrarToast(msgErro, 'erro');
        } else {
            let msgErro = 'Erro ao criar categoria.';
            try {
                const err = await res.json();
                msgErro = err.erro || msgErro;
            } catch (e) {}
            mostrarToast(msgErro, 'erro');
        }
    } catch {
        mostrarToast('Não foi possível conectar à API.', 'erro');
    }
}

// DELETE /categorias/:id
async function deletarCategoria(id) {
    if (!confirm('Deseja realmente excluir esta categoria?')) return;

    try {
        const res = await fetch(`${API_URL}/categorias/${id}`, { method: 'DELETE' });

        if (res.ok) {
            mostrarToast('Categoria excluída.', 'sucesso');
            carregarCategorias();
        } else {
            mostrarToast('Erro ao excluir categoria.', 'erro');
        }
    } catch {
        mostrarToast('Não foi possível conectar à API.', 'erro');
    }
}

/* ══════════════════════════════════════════════════
   HELPERS — RENDERIZAÇÃO
══════════════════════════════════════════════════ */
function renderTransactionItem(t, comDelete) {
    const icone = t.categoria_icone || (t.tipo === 'receita' ? '💰' : '💸');
    const prefix = t.tipo === 'receita' ? '+' : '-';
    const data = t.data ? formatarData(t.data) : '';
    const cat = t.categoria_nome || 'Sem categoria';

    return `
    <div class="transaction-item">
      <div class="tx-icon ${t.tipo}">${icone}</div>
      <div class="tx-info">
        <div class="tx-desc">${escapeHtml(t.descricao)}</div>
        <div class="tx-meta">${cat} · ${data}</div>
      </div>
      <div class="tx-amount ${t.tipo}">${prefix} ${formatarMoeda(t.valor)}</div>
      ${comDelete ? `<button class="tx-delete" onclick="deletarTransacao(${t.id})" title="Excluir">✕</button>` : ''}
    </div>
  `;
}

function renderCategoryCard(c) {
    const bgColor = hexToRgba(c.cor || '#1DB954', 0.12);
    return `
    <div class="category-card" style="border-color:${c.cor || '#1DB954'}20; background:${bgColor}">
      <button class="cat-delete" onclick="deletarCategoria(${c.id})" title="Excluir">✕</button>
      <div class="cat-icon" style="background:${hexToRgba(c.cor || '#1DB954', 0.15)}">
        ${c.icone || '📦'}
      </div>
      <div class="cat-name">${escapeHtml(c.nome)}</div>
    </div>
  `;
}

async function popularSelectCategorias() {
    try {
        const res = await fetch(`${API_URL}/categorias`);
        const data = await res.json();
        const sel = document.getElementById('txCategoria');
        sel.innerHTML = '<option value="">Sem categoria</option>' +
            data.map(c => `<option value="${c.id}">${c.icone || ''} ${c.nome}</option>`).join('');
    } catch { }
}

/* ── Preview de categoria ── */
function configurarPreviewCategoria() {
    const nomeInput = document.getElementById('catNome');
    const iconeInput = document.getElementById('catIcone');
    const corInput = document.getElementById('catCor');

    if (!nomeInput) return;

    nomeInput.addEventListener('input', atualizarPreview);
    iconeInput.addEventListener('input', atualizarPreview);
    corInput.addEventListener('input', atualizarPreview);
}

function atualizarPreview() {
    const nome = document.getElementById('catNome').value || 'Nova Categoria';
    const icone = document.getElementById('catIcone').value || '📦';
    const cor = document.getElementById('catCor').value || '#2ECC71';

    document.getElementById('previewName').textContent = nome;
    document.getElementById('previewIcon').textContent = icone;

    const card = document.getElementById('previewCard');
    card.style.borderColor = cor;
    card.style.background = hexToRgba(cor, 0.08);
}

function resetarPreview() {
    document.getElementById('previewName').textContent = 'Nova Categoria';
    document.getElementById('previewIcon').textContent = '📦';
    const card = document.getElementById('previewCard');
    card.style.borderColor = '';
    card.style.background = '';
}

/* ══════════════════════════════════════════════════
   HELPERS — UTILITÁRIOS
══════════════════════════════════════════════════ */
function formatarMoeda(valor) {
    return (valor ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarData(dataStr) {
    if (!dataStr) return '';
    const [ano, mes, dia] = dataStr.split('-');
    return `${dia}/${mes}/${ano}`;
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str || ''));
    return div.innerHTML;
}

function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}

function mostrarToast(mensagem, tipo = 'sucesso') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    toast.innerHTML = `<span>${tipo === 'sucesso' ? '✓' : '✕'}</span> ${mensagem}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}
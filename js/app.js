let PRODUCTS = [];

function money(v) {
  return 'R$ ' + Number(v).toFixed(2).replace('.', ',');
}

function showNotice(msg) {
  const el = document.querySelector('.notice');
  if (!el) return;
  el.textContent = msg; el.style.display = 'block';
  setTimeout(() => el.style.display = 'none', 2200);
}

function setPage(url) { window.location.href = url; }


async function loadProducts() {
  const box = document.querySelector('#menu-items');
  if (!box) return;

  const token = localStorage.getItem('token');

  if (!token) {
    box.textContent = 'Faça login para carregar os produtos.';
    return;
  }

  box.textContent = 'Carregando produtos...';

  try {
    const resposta = await fetch(
      'http://localhost:8082/api/produtos/ativos',
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!resposta.ok) {
      throw new Error(`Erro HTTP ${resposta.status}`);
    }

    PRODUCTS = await resposta.json();
    renderProducts();

  } catch (erro) {
    console.error('Erro ao carregar produtos:', erro);
    box.textContent =
      'Não foi possível carregar os produtos. Verifique a API e tente novamente.';
  }
}

function renderProducts() {
  const box = document.querySelector('#menu-items');
  if (!box) return;

  box.replaceChildren();

  if (!PRODUCTS.length) {
    box.textContent = 'Nenhum produto ativo cadastrado.';
    return;
  }

  PRODUCTS.forEach(produto => {
    const row = document.createElement('div');
    row.className = 'menu-row';

    const nome = document.createElement('span');
    nome.className = 'menu-name';
    nome.textContent = produto.nome;

    const preco = document.createElement('span');
    preco.className = 'price';
    preco.textContent = money(produto.preco);

    const botao = document.createElement('button');
    botao.className = 'btn small-btn';
    botao.textContent = 'ADICIONAR';
    botao.addEventListener('click', () => addMenuItem(produto.id));

    row.append(nome, preco, botao);
    box.appendChild(row);
  });
}


async function handleLogin(e) {
  e.preventDefault();

  const email = document.querySelector('#email').value.trim();
  const senha = document.querySelector('#senha').value;
  const botao = document.querySelector('#login-form button[type="submit"]');

  botao.disabled = true;
  botao.textContent = 'ENTRANDO...';

  try {
    const resposta = await fetch('http://localhost:8082/api/usuarios/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, senha })
    });


    const textoResposta = await resposta.text();

    let dados = {};

    try {
      dados = textoResposta ? JSON.parse(textoResposta) : {};
    } catch {
      dados = {};
    }

    if (!resposta.ok) {
      showNotice(
        resposta.status === 401 || resposta.status === 403
          ? 'E-mail ou senha inválidos.'
          : dados.message || dados.mensagem || 'Erro ao realizar login.'
      );
      return;
    }

    if (!dados.token) {
      showNotice('A API não retornou o token de acesso.');
      return;
    }

    localStorage.setItem('token', dados.token);
    localStorage.setItem('logged', '1');

    if (dados.usuario) {
      localStorage.setItem('usuario', JSON.stringify(dados.usuario));
    } else {
      localStorage.setItem('usuario', JSON.stringify({
        nome: dados.nome,
        email: dados.email,
        perfil: dados.perfil
      }));
    }

    setPage('mesas.html');

  } catch (erro) {
    console.error('Erro ao realizar login:', erro);
    showNotice('Não foi possível conectar à API. Verifique se ela está ativa.');
  } finally {
    botao.disabled = false;
    botao.textContent = 'ENTRAR';
  }
}


function handleSignup(e) {
  e.preventDefault();
  showNotice('Cadastro salvo com sucesso.');
  setTimeout(() => setPage('index.html'), 700);
}


function addMenuItem(productId) {
  const produto = PRODUCTS.find(p => p.id === productId);

  if (!produto) {
    showNotice('Produto não encontrado.');
    return;
  }

  const cart = JSON.parse(localStorage.getItem('cart') || '[]');

  const existing = cart.find(item =>
    item.id === produto.id ||
    (!item.id && item.name === produto.nome)
  );

  if (existing) {
    existing.qty++;
    existing.id = produto.id;
    existing.name = produto.nome;
    existing.price = Number(produto.preco);
  } else {
    cart.push({
      id: produto.id,
      name: produto.nome,
      price: Number(produto.preco),
      qty: 1
    });
  }

  localStorage.setItem('cart', JSON.stringify(cart));
  renderSummary();
}


function renderSummary() {
  const box = document.querySelector('#summary-items');
  const totalEl = document.querySelector('#summary-total');
  if (!box) return;
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  box.innerHTML = '';
  let total = 0;
  cart.forEach(i => {
    total += i.price * i.qty;
    const row = document.createElement('div');
    row.className = 'summary-row';
    row.innerHTML = `<span>${i.name} x${i.qty}</span><span>${money(i.price * i.qty)}</span>`;
    box.appendChild(row);
  });
  totalEl.textContent = money(total);
}


async function sendToKitchen() {
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const comandaId = localStorage.getItem('comandaId');
  const token = localStorage.getItem('token');

  if (!cart.length) {
    showNotice('Adicione pelo menos um item.');
    return;
  }

  if (!comandaId || !token) {
    showNotice('Comanda ou login não encontrado.');
    return;
  }

  const botao = document.querySelector(
    '[onclick="sendToKitchen()"]'
  );

  if (botao) {
    botao.disabled = true;
    botao.textContent = 'ENVIANDO...';
  }

  try {
    for (const item of cart) {
      if (!item.id) {
        throw new Error('Produto sem ID: ' + item.name);
      }

      const resposta = await fetch(
        `http://localhost:8082/api/comandas/${comandaId}/itens`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json; charset=utf-8'
          },
          body: JSON.stringify({
            produtoId: item.id,
            quantidade: item.qty
          })
        }
      );

      if (!resposta.ok) {
        throw new Error(
          `Erro HTTP ${resposta.status} ao enviar ${item.name}`
        );
      }

      // Remove somente o item já salvo com sucesso.
      const pendentes = JSON.parse(
        localStorage.getItem('cart') || '[]'
      );

      const restantes = pendentes.filter(
        p => p.id !== item.id
      );

      localStorage.setItem('cart', JSON.stringify(restantes));
    }

    showNotice('Pedido enviado para a cozinha!');
    setTimeout(() => setPage('cozinha.html'), 700);

  } catch (erro) {
    console.error('Erro ao enviar pedido:', erro);
    showNotice('Erro ao enviar: ' + erro.message);

    // Os itens ainda não enviados permanecem no carrinho.
    renderSummary();

  } finally {
    if (botao) {
      botao.disabled = false;
      botao.textContent = 'ENVIAR PARA COZINHA';
    }
  }
}


function openTable(table, status) {
  if (status === 'OCUPADA') {
    localStorage.setItem('cart', JSON.stringify([
      { name: 'Hambúrguer Artesanal', price: 28, qty: 2 },
      { name: 'Batata Frita', price: 12, qty: 1 }
    ]));
  } else {
    localStorage.setItem('cart', '[]');
  }
  setPage('novo-pedido.html');
}

function updateKitchen() {
  showNotice('Pedidos atualizados.');
}


async function carregarMesas() {
  const container = document.querySelector('#lista-mesas');
  if (!container) return;

  const token = localStorage.getItem('token');

  if (!token) {
    container.textContent = 'Faça login para visualizar as mesas.';
    return;
  }

  try {
    const resposta = await fetch('http://localhost:8082/api/mesas', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!resposta.ok) {
      throw new Error(`Erro HTTP ${resposta.status}`);
    }

    const mesas = await resposta.json();

    mesas.sort((a, b) => a.numero - b.numero);
    container.replaceChildren();

    mesas.forEach(mesa => {
      const card = document.createElement('article');
      card.className = 'table-card card';

      const titulo = document.createElement('div');
      titulo.className = 'table-title';
      titulo.textContent = `Mesa ${String(mesa.numero).padStart(2, '0')}`;

      const status = document.createElement('div');
      status.className = mesa.ocupada ? 'status' : 'status gray';
      status.textContent = mesa.ocupada ? 'OCUPADA' : 'LIVRE';

      const botao = document.createElement('button');
      botao.className = 'btn table-btn';
      botao.textContent = mesa.ocupada
        ? 'ABRIR COMANDA'
        : 'NOVA COMANDA';


      botao.addEventListener('click', async () => {
        botao.disabled = true;
        botao.textContent = 'AGUARDE...';

        try {
          const token = localStorage.getItem('token');

          if (!token) {
            throw new Error('Faça login novamente.');
          }


          const headers = {
            Authorization: `Bearer ${token}`
          };

          // Se estiver livre, abre uma nova comanda.
          if (!mesa.ocupada) {
            const abertura = await fetch(
              `http://localhost:8082/api/comandas/abrir/${mesa.id}`,
              { method: 'POST', headers }
            );

            if (!abertura.ok) {
              throw new Error(`Erro ao abrir comanda: ${abertura.status}`);
            }
          }

          // Consulta a comanda aberta, independentemente
          // do resultado retornado pelo POST.
          const respostaComanda = await fetch(
            `http://localhost:8082/api/comandas/mesa/${mesa.id}`,
            { method: 'GET', headers, cache: 'no-store' }
          );

          if (!respostaComanda.ok) {
            throw new Error(`Erro ao consultar comanda: ${respostaComanda.status}`);
          }

          const comanda = await respostaComanda.json();

          if (!comanda.id) {
            throw new Error('A API não retornou o ID da comanda.');
          }

          localStorage.setItem('mesaSelecionada', String(mesa.id));
          localStorage.setItem('numeroMesa', String(mesa.numero));
          localStorage.setItem('comandaId', String(comanda.id));
          localStorage.setItem('cart', '[]');

          console.log('Mesa:', mesa.numero, '| Comanda:', comanda.id);

          setPage('novo-pedido.html');


        } catch (erro) {
          console.error('Erro ao abrir comanda:', erro);
          showNotice('Não foi possível abrir a comanda.');
          botao.disabled = false;
          botao.textContent = mesa.ocupada
            ? 'ABRIR COMANDA'
            : 'NOVA COMANDA';
        }
      });

      card.append(titulo, status, botao);
      container.appendChild(card);
    });

  } catch (erro) {
    console.error('Erro ao carregar mesas:', erro);
    container.textContent = 'Não foi possível carregar as mesas.';
  }
}



function atualizarIdentificacaoComanda() {
  const mesa = localStorage.getItem('numeroMesa');
  const comanda = localStorage.getItem('comandaId');

  document.querySelector('#numero-mesa').textContent =
    mesa ? String(mesa).padStart(2, '0') : '--';

  document.querySelector('#numero-comanda').textContent =
    comanda ? String(comanda).padStart(3, '0') : '---';
}


async function carregarPedidosCozinha() {
  const container = document.querySelector('#lista-pedidos-cozinha');
  if (!container) return;

  const token = localStorage.getItem('token');

  if (!token) {
    container.textContent = 'Faça login para visualizar os pedidos.';
    return;
  }

  try {
    const resposta = await fetch(
      'http://localhost:8082/api/cozinha/itens',
      {
        headers: {
          Authorization: `Bearer ${token}`
        },
        cache: 'no-store'
      }
    );

    if (!resposta.ok) {
      throw new Error(`Erro HTTP ${resposta.status}`);
    }

    const itens = await resposta.json();

    container.replaceChildren();

    if (!itens.length) {
      container.textContent = 'Nenhum pedido na cozinha.';
      return;
    }

    itens.forEach(item => {
      const card = document.createElement('article');
      card.className = 'order-card card';

      const titulo = document.createElement('div');
      titulo.className = 'card-title';

      // O número da mesa vem da comanda associada ao item.
      const numeroMesa = item.comanda?.mesa?.numero;
      titulo.textContent = numeroMesa
        ? `Mesa ${String(numeroMesa).padStart(2, '0')}`
        : `Comanda #${item.comanda?.id || '---'}`;

      const status = document.createElement('div');
      status.className = 'status';
      status.textContent = item.status.replaceAll('_', ' ');

      const produtos = document.createElement('div');
      produtos.className = 'items';
      produtos.textContent =
        `${item.quantidade}x ${item.produto?.nome || 'Produto'}`;

      const botao = document.createElement('button');
      botao.className = 'btn order-btn';

      if (item.status === 'PENDENTE') {
        botao.textContent = 'INICIAR PREPARO';
        botao.addEventListener('click', () =>
          atualizarStatusCozinha(item.id, 'EM_PREPARO')
        );
      } else if (item.status === 'EM_PREPARO') {
        botao.textContent = 'MARCAR COMO PRONTO';
        botao.addEventListener('click', () =>
          atualizarStatusCozinha(item.id, 'PRONTO')
        );
      } else {
        botao.textContent = 'PRONTO';
        botao.disabled = true;
      }

      card.append(titulo, status, produtos, botao);
      container.appendChild(card);
    });

  } catch (erro) {
    console.error('Erro ao carregar cozinha:', erro);
    container.textContent = 'Não foi possível carregar os pedidos.';
  }
}

async function atualizarStatusCozinha(itemId, novoStatus) {
  const token = localStorage.getItem('token');

  try {
    const resposta = await fetch(
      `http://localhost:8082/api/cozinha/itens/${itemId}/status`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: novoStatus })
      }
    );

    if (!resposta.ok) {
      throw new Error(`Erro HTTP ${resposta.status}`);
    }

    showNotice('Status atualizado com sucesso!');
    await carregarPedidosCozinha();

  } catch (erro) {
    console.error('Erro ao atualizar status:', erro);
    showNotice('Não foi possível atualizar o pedido.');
  }
}

async function carregarTotalComanda() {
  const elemento = document.querySelector('#total-comanda');
  if (!elemento) return;

  const comandaId = localStorage.getItem('comandaId');
  const token = localStorage.getItem('token');

  if (!comandaId || !token) {
    elemento.textContent = 'Indisponível';
    return;
  }

  try {
    const resposta = await fetch(
      `http://localhost:8082/api/comandas/${comandaId}/itens/total`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      }
    );

    if (!resposta.ok) {
      throw new Error(`HTTP ${resposta.status}`);
    }

    const dados = await resposta.json();

    // Aceita retorno numérico ou objeto contendo o total.
    const total = typeof dados === 'number'
      ? dados
      : dados.total;

    if (total == null || !Number.isFinite(Number(total))) {
      throw new Error('Total inválido retornado pela API');
    }

    elemento.textContent = money(total);

  } catch (erro) {
    console.error('Erro ao carregar total:', erro);
    elemento.textContent = 'Indisponível';
  }
}

async function fecharComanda() {
  const comandaId = localStorage.getItem('comandaId');
  const token = localStorage.getItem('token');
  const botao = document.querySelector('#btn-fechar-comanda');
  const carrinho = JSON.parse(localStorage.getItem('cart') || '[]');

  if (!comandaId || !token) {
    showNotice('Comanda ou login não encontrado.');
    return;
  }

  if (carrinho.length > 0) {
    showNotice('Envie os itens do carrinho antes de fechar.');
    return;
  }

  if (!confirm('Deseja realmente fechar esta comanda e liberar a mesa?')) {
    return;
  }

  if (botao) {
    botao.disabled = true;
    botao.textContent = 'FECHANDO...';
  }

  try {
    const resposta = await fetch(
      `http://localhost:8082/api/comandas/${comandaId}/fechar`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (!resposta.ok) {
      throw new Error(`HTTP ${resposta.status}`);
    }

    localStorage.removeItem('comandaId');
    localStorage.removeItem('mesaSelecionada');
    localStorage.removeItem('numeroMesa');
    localStorage.removeItem('cart');

    alert('Comanda fechada com sucesso! Mesa liberada.');
    setPage('mesas.html');

  } catch (erro) {
    console.error('Erro ao fechar comanda:', erro);
    showNotice('Não foi possível fechar a comanda.');
  } finally {
    if (botao) {
      botao.disabled = false;
      botao.textContent = 'FECHAR COMANDA';
    }
  }
}



document.addEventListener('DOMContentLoaded', () => {
  const login = document.querySelector('#login-form');
  if (login) login.addEventListener('submit', handleLogin);

  const signup = document.querySelector('#signup-form');
  if (signup) signup.addEventListener('submit', handleSignup);

  if (document.querySelector('#menu-items')) loadProducts();

  if (document.querySelector('#lista-mesas')) carregarMesas();

  if (document.querySelector('#lista-pedidos-cozinha')) {
    carregarPedidosCozinha();
  }

  if (document.querySelector('#total-comanda')) {
    carregarTotalComanda();
  }

  if (document.querySelector('#summary-items')) renderSummary();

  if (document.querySelector('#numero-comanda')) {
    atualizarIdentificacaoComanda();
  }

  const kitchenStatus = document.querySelector('#mesa05-status');
  if (kitchenStatus) {
    kitchenStatus.textContent = localStorage.getItem('mesa05Status') || 'EM PREPARO';
  }
});

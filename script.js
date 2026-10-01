/* ==========================================================================
   BRUTUS BURGER — script.js
   Contém: dados do cardápio, lógica do carrinho, cálculo de totais
   e montagem da mensagem enviada para o WhatsApp.
   ========================================================================== */

/* =========================================================
   CONFIGURAÇÕES — troque pelos dados reais da hamburgueria
   ========================================================= */
const WHATSAPP_NUMBER = "5562991165891"; // número do WhatsApp com DDI 55 + DDD, só números
const FRETE_VALOR = 8;        // taxa de entrega padrão em R$
const FRETE_GRATIS_ACIMA = 40; // valor mínimo do subtotal para frete grátis

/* =========================================================
   CARDÁPIO — para adicionar/remover itens, edite este array.
  Cada produto precisa de: id (único), nome, descricao, preco, categoria e imagem
   categorias disponíveis: burgers | adicionais | acompanhamentos
   ========================================================= */
const produtos = [
  // ---- Burgers Artesanais ----
  { id: "b1", nome: "Brutus Bacon", descricao: "Grelhado no fogo, 150g de blend artesanal, muito bacon crocante, queijo prato derretido e maionese da casa.", preco: 28.00, categoria: "burgers", imagem: "assets/burger1.png" },
  { id: "b2", nome: "Smash Duplo", descricao: "Dois blends de 80g prensados na chapa, queijo cheddar duplo, cebola roxa e molho especial.", preco: 24.00, categoria: "burgers", imagem: "assets/burger2.png" },

  // ---- Adicionais (Turbine seu Burger) ----
  { id: "a1", nome: "Bacon Extra", descricao: "Porção extra de bacon crocante para turbinar seu burger.", preco: 4.00, categoria: "adicionais", imagem: "assets/baco-porção.png" },
  { id: "a2", nome: "Queijo Cheddar Maçaricado", descricao: "Cheddar maçaricado na hora por cima do seu burger.", preco: 4.50, categoria: "adicionais", imagem: "assets/cheddar.png" },

  // ---- Acompanhamentos & Bebidas ----
  { id: "c1", nome: "Batata Frita Suprema", descricao: "Batata palito crocante com cheddar e farofa de bacon.", preco: 15.00, categoria: "acompanhamentos", imagem: "assets/batata-cheddar.png" },
  { id: "c2", nome: "Refrigerante Lata", descricao: "Gelado, na lata.", preco: 6.00, categoria: "acompanhamentos", imagem: "assets/lata.png" },
];

/* Estado do carrinho: { [id]: quantidade } — fica só na memória da página */
let carrinho = {};
let categoriaAtual = "burgers";

/* =========================================================
   FORMATAÇÃO DE MOEDA
   ========================================================= */
function formatarMoeda(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/* =========================================================
   RENDERIZAÇÃO DO CARDÁPIO
   ========================================================= */
const menuGrid = document.getElementById("menuGrid");

function renderizarMenu() {
  const itensDaCategoria = produtos.filter(p => p.categoria === categoriaAtual);
  menuGrid.innerHTML = itensDaCategoria.map(produto => `
    <article class="product-card">
      <div class="product-photo-wrap">
        <img src="${produto.imagem}" alt="${produto.nome}" class="product-photo" loading="lazy"
             onerror="this.classList.add('img-missing'); this.parentElement.classList.add('no-photo')">
      </div>
      <h3>${produto.nome}</h3>
      <p>${produto.descricao}</p>
      <div class="product-card-footer">
        <span class="product-price">${formatarMoeda(produto.preco)}</span>
        <button class="add-btn" type="button" data-id="${produto.id}" aria-label="Adicionar ${produto.nome} ao carrinho">+</button>
      </div>
    </article>
  `).join("");
}

document.getElementById("menuTabs").addEventListener("click", (e) => {
  const botao = e.target.closest(".tab-btn");
  if (!botao) return;
  categoriaAtual = botao.dataset.cat;
  document.querySelectorAll(".tab-btn").forEach(b => {
    b.classList.toggle("is-active", b === botao);
    b.setAttribute("aria-selected", b === botao ? "true" : "false");
  });
  renderizarMenu();
});

menuGrid.addEventListener("click", (e) => {
  const botao = e.target.closest(".add-btn");
  if (!botao) return;
  adicionarAoCarrinho(botao.dataset.id);
  abrirCarrinho();
});

/* =========================================================
   LÓGICA DO CARRINHO
   ========================================================= */
function adicionarAoCarrinho(id) {
  carrinho[id] = (carrinho[id] || 0) + 1;
  renderizarCarrinho();
}

function alterarQuantidade(id, delta) {
  if (!carrinho[id]) return;
  carrinho[id] += delta;
  if (carrinho[id] <= 0) delete carrinho[id];
  renderizarCarrinho();
}

function removerItem(id) {
  delete carrinho[id];
  renderizarCarrinho();
}

function calcularSubtotal() {
  return Object.entries(carrinho).reduce((total, [id, qtd]) => {
    const produto = produtos.find(p => p.id === id);
    return total + (produto ? produto.preco * qtd : 0);
  }, 0);
}

function calcularFrete(subtotal) {
  if (subtotal === 0) return 0;
  return subtotal >= FRETE_GRATIS_ACIMA ? 0 : FRETE_VALOR;
}

const cartItemsEl = document.getElementById("cartItems");
const cartEmptyMsg = document.getElementById("cartEmptyMsg");
const cartSubtotalEl = document.getElementById("cartSubtotal");
const cartDeliveryEl = document.getElementById("cartDelivery");
const cartTotalEl = document.getElementById("cartTotal");
const deliveryHintEl = document.getElementById("deliveryHint");
const cartCountEl = document.getElementById("cartCount");
const fabCartCountEl = document.getElementById("fabCartCount");

function renderizarCarrinho() {
  const idsNoCarrinho = Object.keys(carrinho);
  const totalItens = Object.values(carrinho).reduce((a, b) => a + b, 0);

  // Contadores nos botões de carrinho
  cartCountEl.textContent = totalItens;
  fabCartCountEl.textContent = totalItens;

  // Lista de itens
  if (idsNoCarrinho.length === 0) {
    cartEmptyMsg.style.display = "block";
    cartItemsEl.querySelectorAll(".cart-item").forEach(el => el.remove());
  } else {
    cartEmptyMsg.style.display = "none";
    cartItemsEl.innerHTML = idsNoCarrinho.map(id => {
      const produto = produtos.find(p => p.id === id);
      const qtd = carrinho[id];
      const totalItem = produto.preco * qtd;
      return `
        <div class="cart-item" data-id="${id}">
          <span class="cart-item-name">${produto.nome}</span>
          <button class="cart-item-remove" type="button" data-action="remover" data-id="${id}">remover</button>
          <span class="cart-item-price">${formatarMoeda(produto.preco)} / un.</span>
          <div class="qty-control">
            <button class="qty-btn" type="button" data-action="menos" data-id="${id}" aria-label="Diminuir quantidade">−</button>
            <span class="qty-value">${qtd}</span>
            <button class="qty-btn" type="button" data-action="mais" data-id="${id}" aria-label="Aumentar quantidade">+</button>
            <span class="cart-item-total">${formatarMoeda(totalItem)}</span>
          </div>
        </div>
      `;
    }).join("") + cartEmptyMsg.outerHTML;
    // Garante que a msg de vazio (escondida) continue no DOM para reaproveitar o elemento
    cartItemsEl.querySelector("#cartEmptyMsg").style.display = "none";
  }

  // Totais
  const subtotal = calcularSubtotal();
  const frete = calcularFrete(subtotal);
  const total = subtotal + frete;

  cartSubtotalEl.textContent = formatarMoeda(subtotal);
  cartDeliveryEl.textContent = frete === 0 ? "Grátis" : formatarMoeda(frete);
  cartTotalEl.textContent = formatarMoeda(total);

  if (subtotal === 0) {
    deliveryHintEl.textContent = `Frete grátis a partir de ${formatarMoeda(FRETE_GRATIS_ACIMA)}`;
  } else if (subtotal >= FRETE_GRATIS_ACIMA) {
    deliveryHintEl.textContent = "Você ganhou frete grátis! 🎉";
  } else {
    const faltam = FRETE_GRATIS_ACIMA - subtotal;
    deliveryHintEl.textContent = `Faltam ${formatarMoeda(faltam)} para o frete grátis`;
  }
}

cartItemsEl.addEventListener("click", (e) => {
  const botao = e.target.closest("button[data-action]");
  if (!botao) return;
  const { action, id } = botao.dataset;
  if (action === "mais") alterarQuantidade(id, 1);
  if (action === "menos") alterarQuantidade(id, -1);
  if (action === "remover") removerItem(id);
});

/* =========================================================
   ABRIR / FECHAR GAVETA DO CARRINHO
   ========================================================= */
const cartDrawer = document.getElementById("carrinho");
const cartOverlay = document.getElementById("cartOverlay");

function abrirCarrinho() {
  cartDrawer.classList.add("is-open");
  cartOverlay.classList.add("is-open");
  cartDrawer.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function fecharCarrinho() {
  cartDrawer.classList.remove("is-open");
  cartOverlay.classList.remove("is-open");
  cartDrawer.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

document.getElementById("btnOpenCart").addEventListener("click", abrirCarrinho);
document.getElementById("btnFabCart").addEventListener("click", abrirCarrinho);
document.getElementById("btnCloseCart").addEventListener("click", fecharCarrinho);
cartOverlay.addEventListener("click", fecharCarrinho);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") fecharCarrinho();
});

/* =========================================================
   ENVIO DO PEDIDO PARA O WHATSAPP
   ========================================================= */
function montarMensagemPedido() {
  const idsNoCarrinho = Object.keys(carrinho);
  if (idsNoCarrinho.length === 0) return null;

  const subtotal = calcularSubtotal();
  const frete = calcularFrete(subtotal);
  const total = subtotal + frete;

  let linhas = ["Olá! Gostaria de fazer o seguinte pedido no Brutus Burger:", ""];

  idsNoCarrinho.forEach(id => {
    const produto = produtos.find(p => p.id === id);
    const qtd = carrinho[id];
    linhas.push(`• ${qtd}x ${produto.nome} — ${formatarMoeda(produto.preco * qtd)}`);
  });

  linhas.push("");
  linhas.push(`Subtotal: ${formatarMoeda(subtotal)}`);
  linhas.push(`Entrega: ${frete === 0 ? "Grátis" : formatarMoeda(frete)}`);
  linhas.push(`Total: ${formatarMoeda(total)}`);
  linhas.push("");
  linhas.push("Nome:");
  linhas.push("Endereço:");

  return linhas.join("\n");
}

function enviarPedidoWhatsApp() {
  const mensagem = montarMensagemPedido();
  if (!mensagem) {
    alert("Seu carrinho está vazio. Adicione algum item antes de enviar o pedido.");
    return;
  }
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensagem)}`;
  window.open(url, "_blank", "noopener");
}

document.getElementById("btnCheckoutWhats").addEventListener("click", enviarPedidoWhatsApp);

/* Botões gerais de "falar no WhatsApp" (sem pedido específico) */
function abrirWhatsAppGeral() {
  const mensagem = "Olá! Gostaria de fazer um pedido no Brutus Burger.";
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensagem)}`;
  window.open(url, "_blank", "noopener");
}
document.getElementById("btnHeaderWhats").addEventListener("click", abrirWhatsAppGeral);
document.getElementById("btnHeroWhats").addEventListener("click", abrirWhatsAppGeral);
document.getElementById("btnContactWhats").addEventListener("click", abrirWhatsAppGeral);

/* =========================================================
   MENU MOBILE
   ========================================================= */
const navToggle = document.getElementById("navToggle");
const mainNav = document.getElementById("mainNav");
navToggle.addEventListener("click", () => {
  const aberto = mainNav.classList.toggle("is-open");
  navToggle.setAttribute("aria-expanded", aberto ? "true" : "false");
});
mainNav.addEventListener("click", (e) => {
  if (e.target.tagName === "A") mainNav.classList.remove("is-open");
});

/* =========================================================
   FORMULÁRIO DE CONTATO (demonstrativo — não envia para servidor)
   ========================================================= */
document.getElementById("contactForm").addEventListener("submit", (e) => {
  e.preventDefault();
  document.getElementById("formNote").textContent =
    "Mensagem pronta! Conecte este formulário a um serviço de e-mail ou back-end para recebê-la de verdade.";
  e.target.reset();
});

/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */
document.getElementById("anoAtual").textContent = new Date().getFullYear();
renderizarMenu();
renderizarCarrinho();

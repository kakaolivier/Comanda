
const MENU = [
  {name:'Hambúrguer Artesanal', price:28},
  {name:'Pizza Calabresa', price:42},
  {name:'Prato Executivo', price:25},
  {name:'Batata Frita', price:12},
  {name:'Refrigerante', price:7}
];

function money(v){ return 'R$ ' + v.toFixed(2).replace('.',','); }

function showNotice(msg){
  const el=document.querySelector('.notice');
  if(!el)return;
  el.textContent=msg; el.style.display='block';
  setTimeout(()=>el.style.display='none',2200);
}

function setPage(url){ window.location.href=url; }

function handleLogin(e){
  e.preventDefault();
  localStorage.setItem('logged','1');
  setPage('cozinha.html');
}

function handleSignup(e){
  e.preventDefault();
  showNotice('Cadastro salvo com sucesso.');
  setTimeout(()=>setPage('index.html'),700);
}

function addMenuItem(idx){
  const cart=JSON.parse(localStorage.getItem('cart')||'[]');
  const item=MENU[idx];
  const existing=cart.find(x=>x.name===item.name);
  if(existing) existing.qty++;
  else cart.push({...item,qty:1});
  localStorage.setItem('cart',JSON.stringify(cart));
  renderSummary();
}

function renderSummary(){
  const box=document.querySelector('#summary-items');
  const totalEl=document.querySelector('#summary-total');
  if(!box)return;
  const cart=JSON.parse(localStorage.getItem('cart')||'[]');
  box.innerHTML='';
  let total=0;
  cart.forEach(i=>{
    total+=i.price*i.qty;
    const row=document.createElement('div');
    row.className='summary-row';
    row.innerHTML=`<span>${i.name} x${i.qty}</span><span>${money(i.price*i.qty)}</span>`;
    box.appendChild(row);
  });
  totalEl.textContent=money(total);
}

function sendToKitchen(){
  const cart=JSON.parse(localStorage.getItem('cart')||'[]');
  if(!cart.length){showNotice('Adicione pelo menos um item.');return;}
  localStorage.setItem('mesa05Status','EM PREPARO');
  showNotice('Pedido enviado para a cozinha.');
  setTimeout(()=>setPage('cozinha.html'),700);
}

function openTable(table,status){
  if(status==='OCUPADA'){
    localStorage.setItem('cart',JSON.stringify([
      {name:'Hambúrguer Artesanal',price:28,qty:2},
      {name:'Batata Frita',price:12,qty:1}
    ]));
  }else{
    localStorage.setItem('cart','[]');
  }
  setPage('novo-pedido.html');
}

function updateKitchen(){
  showNotice('Pedidos atualizados.');
}

document.addEventListener('DOMContentLoaded',()=>{
  const login=document.querySelector('#login-form');
  if(login) login.addEventListener('submit',handleLogin);

  const signup=document.querySelector('#signup-form');
  if(signup) signup.addEventListener('submit',handleSignup);

  if(document.querySelector('#summary-items')) renderSummary();

  const kitchenStatus=document.querySelector('#mesa05-status');
  if(kitchenStatus){
    kitchenStatus.textContent=localStorage.getItem('mesa05Status')||'EM PREPARO';
  }
});

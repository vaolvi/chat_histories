function validarSenha(senha) {
  return fetch("https://n8n.apto.vc/webhook/chat-histories-access", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: senha })
  })
  .then(res => res.json());
}

function login() {
  const input = document.getElementById("senha");
  const senha = input.value.trim();
  const erroEl = document.getElementById("erro-senha");
  erroEl.textContent = "";
  if (!senha) {
    erroEl.textContent = "❗ Informe a senha.";
    input.classList.add('shake');
    setTimeout(() => input.classList.remove('shake'), 400);
    return;
  }

  validarSenha(senha)
    .then(data => {
      if (data && data.access === false) {
        erroEl.textContent = "❌ Senha incorreta. Tente novamente.";
        input.classList.add('shake');
        setTimeout(() => input.classList.remove('shake'), 400);
      } else {
        document.getElementById("login-card").classList.remove("active");
        document.getElementById("main-content").classList.add("active");
        buscarDados();
      }
    })
    .catch(err => {
      erroEl.textContent = "⚠️ Erro ao validar senha.";
      console.error(err);
    });
}

function buscarDados(tipo = "", id = "", filtro = true) {
  const startDate = document.getElementById("start-date").value;
  const endDate = document.getElementById("end-date").value;
  const tableEl = document.getElementById('resultado-tabela');
  const loadingEl = document.getElementById('tabela-loading');
  if (tableEl) tableEl.style.display = 'none';
  if (loadingEl) { loadingEl.style.display = 'block'; loadingEl.textContent = '🔄 Carregando resultados...'; }
  fetch("https://n8n.apto.vc/webhook/chat-histories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tipo, id, startDate, endDate, filtro })
  })
  .then(res => res.json())
  .then(data => {
    const tbody = document.querySelector("#resultado-tabela tbody");
    tbody.innerHTML = "";
    if (!data || data.length === 0) {
      if (loadingEl) loadingEl.textContent = '⚠️ Nenhum resultado encontrado.';
      if (tableEl) tableEl.style.display = 'none';
      return;
    }
    data.forEach(item => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
          <td>${item.session_id}</td>
          <td>${item.client}</td>
          <td>${formatarData(item.created_at)}</td>
          <td><button class="action-btn" title="Ver histórico" onclick="verHistorico('${item.session_id}', '${item.created_at}', '${(item.client||'').replace(/'/g,"\\'")}')">👁️</button></td>
      `;
      tbody.appendChild(tr);
    });
    if (loadingEl) loadingEl.style.display = 'none';
    if (tableEl) tableEl.style.display = 'block';
  })
  .catch(err => {
    if (loadingEl) loadingEl.textContent = '❌ Erro ao buscar dados.';
    if (tableEl) tableEl.style.display = 'none';
    console.error(err);
  });
}

function formatarData(data) {
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

// Retorna hex minúsculo a partir de 'rgb(r,g,b)' ou '#rrggbb' encontrado
function _normalizeColorToHex(col) {
  if (!col) return '';
  col = col.trim().toLowerCase();
  const hexMatch = col.match(/#([0-9a-f]{3,6})/i);
  if (hexMatch) {
    let h = hexMatch[0].toLowerCase();
    if (h.length === 4) {
      // expande #abc -> #aabbcc
      h = '#' + h[1] + h[1] + h[2] + h[2] + h[3] + h[3];
    }
    return h;
  }
  const rgbMatch = col.match(/rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)/i);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10);
    const g = parseInt(rgbMatch[2], 10);
    const b = parseInt(rgbMatch[3], 10);
    const toHex = v => (v < 16 ? '0' : '') + v.toString(16);
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toLowerCase();
  }
  return '';
}

function _detectInlineColorFromElement(el) {
  if (!el) return '';
  // procura style no próprio elemento
  const styleAttr = (el.getAttribute && (el.getAttribute('style') || '')).toLowerCase();
  const bgMatch = styleAttr.match(/background-color\s*:\s*([^;\n]+)/i);
  if (bgMatch) return _normalizeColorToHex(bgMatch[1]);
  const colorMatch = styleAttr.match(/color\s*:\s*([^;\n]+)/i);
  if (colorMatch) return _normalizeColorToHex(colorMatch[1]);

  // busca em descendentes com style
  const styled = el.querySelectorAll && el.querySelectorAll('[style]');
  if (styled && styled.length) {
    for (let i = 0; i < styled.length; i++) {
      const s = (styled[i].getAttribute('style') || '').toLowerCase();
      const b = s.match(/background-color\s*:\s*([^;\n]+)/i);
      if (b) return _normalizeColorToHex(b[1]);
      const c = s.match(/color\s*:\s*([^;\n]+)/i);
      if (c) return _normalizeColorToHex(c[1]);
    }
  }
  return '';
}

function _mapColorToClass(hex) {
  if (!hex) return '';
  const clienteColors = ['#fff3e0', '#fff3c7', '#fff3b0', '#fffaf0'];
  const botColors = ['#e1f5fe', '#cffafe', '#e3f2fd', '#e8f5ff'];
  hex = hex.toLowerCase();
  if (clienteColors.indexOf(hex) !== -1) return 'msg-cliente';
  if (botColors.indexOf(hex) !== -1) return 'msg-bot';
  return '';
}

function _processMessageElement(originalEl, defaultClient) {
  const node = originalEl.cloneNode(true);
  const rawStyle = (originalEl.getAttribute && (originalEl.getAttribute('style') || '')).toLowerCase();
  // remove estilos inline para evitar conflitos
  node.removeAttribute && node.removeAttribute('style');
  node.classList.add('message');

  // 1) tenta por label (<strong>)
  const strong = originalEl.querySelector && originalEl.querySelector('strong');
  if (strong) {
    const label = (strong.textContent || '').toLowerCase();
    if (label.indexOf('cliente') !== -1) { node.classList.add('msg-cliente'); return node; }
    if (label.indexOf('ia') !== -1) { node.classList.add('msg-ia'); return node; }
    if (label.indexOf('bot') !== -1) { node.classList.add('msg-bot'); return node; }
  }

  // 2) procura cor inline (background-color / color) no elemento ou descendentes
  const hex = _detectInlineColorFromElement(originalEl);
  const mapped = _mapColorToClass(hex);
  if (mapped) { node.classList.add(mapped); return node; }

  // 3) heurística por raw style (caso contenha hexa sem prefixo claro)
  if (rawStyle.indexOf('#fff3e0') !== -1 || rawStyle.indexOf('fff3c7') !== -1) { node.classList.add('msg-cliente'); return node; }
  if (rawStyle.indexOf('#e1f5fe') !== -1 || rawStyle.indexOf('cffafe') !== -1) { node.classList.add('msg-bot'); return node; }

  // 4) fallback: se veio com cliente conhecido, usa cliente; senão assume cliente
  if (defaultClient) node.classList.add('msg-cliente'); else node.classList.add('msg-cliente');
  return node;
}

function verHistorico(id, data, client) {
  document.getElementById("main-content").classList.remove("active");
  document.getElementById("historico-container").classList.add("active");
  document.getElementById("historico-conteudo").innerHTML = "🔄 Carregando histórico...";
  fetch("https://n8n.apto.vc/webhook/chat-histories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, data, filtro: false })
  })
  .then(res => res.text())
  .then(html => {
    // Monta bloco de informações (Tipo, ID, Cliente, Data) a partir do session_id e dos parâmetros
    const infoEl = document.getElementById('historico-info');
    const session = id || '';
    const parts = session.split('-');
    const tipo = parts[0] || '';
    const idNum = parts.slice(1).join('-') || '';
    const dataFormatada = formatarData(data || '');
    infoEl.innerHTML = `
      <div class="info-card">
        <div class="info-title">Informações</div>
        <div class="info-body">
          <div><strong>Tipo:</strong> ${tipo === 'brokers' ? 'Corretor' : 'Empresa'}</div>
          <div><strong>ID:</strong> ${idNum}</div>
          <div><strong>Cliente:</strong> ${client || ''}</div>
          <div><strong>Data:</strong> ${dataFormatada}</div>
        </div>
      </div>
    `;

    // cria wrapper para parsear o HTML retornado (usado abaixo para buscar mensagens)
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;

      // Mensagens: migrar filhos de #messages (pode haver múltiplos elementos com id="messages") para #historico-conteudo
      const messagesAll = Array.from(wrapper.querySelectorAll('#messages'));
      const content = document.getElementById('historico-conteudo');
      content.innerHTML = '';
      if (messagesAll.length > 0) {
        messagesAll.forEach(m => {
          const processed = _processMessageElement(m, client);
          content.appendChild(processed);
        });
      } else {
        // fallback: procura por elementos com id=message_chat ou insere HTML bruto
        const fallbackMsgs = Array.from(wrapper.querySelectorAll('#message_chat'));
        if (fallbackMsgs.length > 0) {
          fallbackMsgs.forEach(m => {
            const processed = _processMessageElement(m, client);
            content.appendChild(processed);
          });
        } else {
          // se não achar mensagens estruturadas, coloca o HTML bruto (o CSS local ainda aplicará)
          content.innerHTML = html;
        }
      }
  })
  .catch(err => {
    document.getElementById("historico-conteudo").innerHTML = "<p>❌ Erro ao carregar o histórico.</p>";
    console.error(err);
  });
}

function voltarParaBusca() {
  document.getElementById("historico-container").classList.remove("active");
  document.getElementById("main-content").classList.add("active");
}

document.getElementById("filtro-form").addEventListener("submit", function(e) {
  e.preventDefault();
  const tipo = document.getElementById("tipo").value;
  const id = document.getElementById("id").value;
  const session_id = id ? `${tipo}-${id}` : "";
  buscarDados(tipo, session_id);
});

window.onload = () => {
  // Inicializa datas padrão
  const hoje = new Date();
  const seteDiasAtras = new Date();
  seteDiasAtras.setDate(hoje.getDate() - 1);
  document.getElementById("start-date").value = seteDiasAtras.toISOString().split("T")[0];
  document.getElementById("end-date").value = hoje.toISOString().split("T")[0];

  // Exibe tela de login
  document.getElementById("login-card").classList.add("active");
};

// Handler para botão limpar seleção do filtro 'Tipo'
document.addEventListener('DOMContentLoaded', () => {
  const clearBtn = document.getElementById('clear-tipo');
  const tipoSel = document.getElementById('tipo');
  if (clearBtn && tipoSel) {
    const setClearVisibility = () => {
      if (tipoSel.value && tipoSel.value !== '') clearBtn.style.display = 'inline';
      else clearBtn.style.display = 'none';
    };

    // inicializa visibilidade
    setClearVisibility();

    tipoSel.addEventListener('change', setClearVisibility);

    clearBtn.addEventListener('click', () => {
      tipoSel.value = '';
      setClearVisibility();
      tipoSel.focus();
    });
  }
});

// Submete login ao pressionar Enter (form submit) e trata o evento
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      login();
    });
  }
});
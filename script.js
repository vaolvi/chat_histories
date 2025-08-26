function validarSenha() {
  const senha = document.getElementById("senha").value;
  fetch("https://n8n.apto.vc/webhook/chat-histories-access", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: senha })
  })
  .then(res => res.json())
  .then(data => {
    if (data.access === false) {
      document.getElementById("erro-senha").textContent = "❌ Senha incorreta. Tente novamente.";
    } else {
      document.getElementById("login-card").classList.remove("active");
      document.getElementById("main-content").classList.add("active");
      buscarDados();
    }
  })
  .catch(err => {
    document.getElementById("erro-senha").textContent = "⚠️ Erro ao validar senha.";
    console.error(err);
  });
}

function buscarDados(tipo = "", id = "", filtro = true) {
  const startDate = document.getElementById("start-date").value;
  const endDate = document.getElementById("end-date").value;
  fetch("https://n8n.apto.vc/webhook/chat-histories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tipo, id, startDate, endDate, filtro })
  })
  .then(res => res.json())
  .then(data => {
    const tbody = document.querySelector("#resultado-tabela tbody");
    tbody.innerHTML = "";
    data.forEach(item => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${item.session_id}</td>
        <td>${formatarData(item.created_at)}</td>
        <td><button class="action-btn" title="Ver histórico" onclick="verHistorico('${item.session_id}', '${item.created_at}')">👁️</button></td>
      `;
      tbody.appendChild(tr);
    });
  })
  .catch(err => {
    alert("Erro ao buscar dados.");
    console.error(err);
  });
}

function formatarData(data) {
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

function verHistorico(id, data) {
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
    document.getElementById("historico-conteudo").innerHTML = html;
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
  seteDiasAtras.setDate(hoje.getDate() - 7);
  document.getElementById("start-date").value = seteDiasAtras.toISOString().split("T")[0];
  document.getElementById("end-date").value = hoje.toISOString().split("T")[0];

  // Exibe tela de login
  document.getElementById("login-card").classList.add("active");
};
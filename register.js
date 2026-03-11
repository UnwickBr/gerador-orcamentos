const form = document.getElementById("registerForm");
const messageEl = document.getElementById("registerMessage");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  messageEl.textContent = "";

  const username = document.getElementById("registerUsername").value.trim();
  const password = document.getElementById("registerPassword").value;

  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    messageEl.textContent = data.error || "Erro ao criar conta.";
    messageEl.className = "auth-error";
    return;
  }

  messageEl.textContent = "Conta criada com sucesso. Faca login para continuar.";
  messageEl.className = "auth-ok";
  form.reset();
});

const form = document.getElementById("loginForm");
const errorEl = document.getElementById("loginError");

async function checkSession() {
  const response = await fetch("/api/auth/me");
  if (response.ok) {
    window.location.href = "/";
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  errorEl.textContent = "";

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({ error: "Falha ao autenticar." }));
    errorEl.textContent = data.error || "Falha ao autenticar.";
    return;
  }

  window.location.href = "/";
});

checkSession().catch(() => {
  // Ignora erro silenciosamente na verificacao inicial.
});

const form = document.getElementById("createUserForm");
const tableBody = document.getElementById("usersTableBody");
const messageEl = document.getElementById("createUserMessage");
const sessionInfoEl = document.getElementById("usersSessionInfo");
const logoutButton = document.getElementById("usersLogoutButton");

function formatDate(isoDate) {
  if (!isoDate) return "-";
  const date = new Date(isoDate);
  return date.toLocaleString("pt-BR");
}

async function requireAdminSession() {
  const response = await fetch("/api/auth/me");
  if (!response.ok) {
    window.location.href = "/";
    return null;
  }

  const data = await response.json();
  if (data.user.role !== "admin") {
    window.location.href = "/";
    return null;
  }

  sessionInfoEl.textContent = `Logado como ${data.user.username} (Administrador)`;
  return data.user;
}

async function loadUsers() {
  const response = await fetch("/api/users");
  if (!response.ok) {
    throw new Error("Nao foi possivel carregar os usuarios.");
  }

  const data = await response.json();
  tableBody.innerHTML = "";

  data.users.forEach((user) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${user.id}</td>
      <td>${user.username}</td>
      <td>${user.role}</td>
      <td>${formatDate(user.createdAt)}</td>
    `;
    tableBody.appendChild(tr);
  });
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  messageEl.textContent = "";

  const username = document.getElementById("newUsername").value.trim();
  const password = document.getElementById("newPassword").value;
  const role = document.getElementById("newRole").value;

  const response = await fetch("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, role })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    messageEl.textContent = data.error || "Erro ao criar usuario.";
    messageEl.className = "auth-error";
    return;
  }

  messageEl.textContent = `Usuario ${data.username} criado com sucesso.`;
  messageEl.className = "auth-ok";
  form.reset();
  await loadUsers();
});

logoutButton.addEventListener("click", async () => {
  await fetch("/api/auth/logout", { method: "POST" });
  window.location.href = "/";
});

(async () => {
  const user = await requireAdminSession();
  if (!user) return;
  await loadUsers();
})();

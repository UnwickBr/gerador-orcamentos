const form = document.getElementById("budgetForm");
const addItemButton = document.getElementById("addItem");
const downloadButtons = [
  document.getElementById("downloadPdf"),
  document.getElementById("downloadPdfTop")
];
const logoutButton = document.getElementById("logoutButton");
const sessionInfo = document.getElementById("sessionInfo");
const usersLink = document.getElementById("usersLink");

const items = [];

const refs = {
  companyName: document.getElementById("pCompanyName"),
  companySubtitle: document.getElementById("pCompanySubtitle"),
  companyAddress: document.getElementById("pCompanyAddress"),
  companyEmail: document.getElementById("pCompanyEmail"),
  companyDocument: document.getElementById("pCompanyDocument"),
  companyPhone: document.getElementById("pCompanyPhone"),
  clientName: document.getElementById("pClientName"),
  clientStreet: document.getElementById("pClientStreet"),
  clientCity: document.getElementById("pClientCity"),
  clientZip: document.getElementById("pClientZip"),
  clientState: document.getElementById("pClientState"),
  clientPhone: document.getElementById("pClientPhone"),
  paymentCondition: document.getElementById("pPaymentCondition"),
  entryDate: document.getElementById("pEntryDate"),
  deliveryForecast: document.getElementById("pDeliveryForecast"),
  date: document.getElementById("pDate"),
  number: document.getElementById("pNumber"),
  grandTotal: document.getElementById("pGrandTotal"),
  itemsBody: document.getElementById("previewItems")
};

function brl(value) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDateBR(dateIso) {
  if (!dateIso) return "-";
  const [year, month, day] = dateIso.split("-");
  return `${day}/${month}/${year}`;
}

function getTodayBR() {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function currentTotal() {
  return items.reduce((sum, item) => sum + item.total, 0);
}

async function loadNextBudgetNumber() {
  const response = await fetch("/api/budgets/next-number");
  if (response.status === 401) {
    window.location.href = "/";
    return;
  }
  if (!response.ok) {
    throw new Error("Nao foi possivel obter o proximo numero.");
  }

  const data = await response.json();
  const number = String(data.nextNumber || "1").padStart(4, "0");
  document.getElementById("budgetNumberInput").value = number;
  refs.number.textContent = number;
}

async function saveBudget() {
  const data = new FormData(form);
  const payload = {
    budgetNumber: data.get("budgetNumber"),
    date: getTodayBR(),
    companyName: data.get("companyName"),
    companySubtitle: data.get("companySubtitle"),
    companyAddress: data.get("companyAddress"),
    companyDocument: data.get("companyDocument"),
    companyPhone: data.get("companyPhone"),
    companyEmail: data.get("companyEmail"),
    clientName: data.get("clientName"),
    clientStreet: data.get("clientStreet"),
    clientCity: data.get("clientCity"),
    clientZip: data.get("clientZip"),
    clientState: data.get("clientState"),
    clientPhone: data.get("clientPhone"),
    paymentCondition: data.get("paymentCondition"),
    entryDate: data.get("entryDate"),
    deliveryForecast: data.get("deliveryForecast"),
    items,
    total: currentTotal()
  };

  const response = await fetch("/api/budgets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (response.status === 401) {
    window.location.href = "/";
    return null;
  }

  if (!response.ok) {
    throw new Error("Erro ao salvar orcamento no banco.");
  }

  const saved = await response.json();
  const number = String(saved.budgetNumber || payload.budgetNumber || "1").padStart(4, "0");
  document.getElementById("budgetNumberInput").value = number;
  refs.number.textContent = number;
  return saved;
}

async function loadSession() {
  const response = await fetch("/api/auth/me");
  if (!response.ok) {
    window.location.href = "/";
    return null;
  }

  const data = await response.json();
  const user = data.user;
  sessionInfo.textContent = `Logado como ${user.username} (${user.role})`;

  if (user.role === "admin") {
    usersLink.style.display = "inline-flex";
  }

  return user;
}

function renderItemsTable() {
  const tbody = document.querySelector("#itemsList tbody");
  tbody.innerHTML = "";

  items.forEach((item, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.quantity}</td>
      <td>${item.unit}</td>
      <td>${item.description}</td>
      <td>${brl(item.unitPrice)}</td>
      <td>${brl(item.total)}</td>
      <td><button type="button" class="remove-item" data-index="${index}">Remover</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function renderPreviewItems() {
  refs.itemsBody.innerHTML = "";

  const minimumRows = 7;
  const previewItems = [...items];
  while (previewItems.length < minimumRows) {
    previewItems.push({ quantity: "", unit: "", description: "", unitPrice: 0, total: 0 });
  }

  previewItems.forEach((item) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.quantity || ""}</td>
      <td>${item.unit || ""}</td>
      <td>${item.description || ""}</td>
      <td>${item.unitPrice ? brl(item.unitPrice) : ""}</td>
      <td>${item.total ? brl(item.total) : ""}</td>
    `;
    refs.itemsBody.appendChild(tr);
  });

  refs.grandTotal.innerHTML = `<strong>${brl(currentTotal())}</strong>`;
}

function updatePreview() {
  const data = new FormData(form);

  refs.companyName.textContent = data.get("companyName") || "-";
  refs.companySubtitle.textContent = data.get("companySubtitle") || "-";
  refs.companyAddress.textContent = data.get("companyAddress") || "-";
  refs.companyEmail.textContent = data.get("companyEmail") || "-";
  refs.companyDocument.textContent = `CNPJ: ${data.get("companyDocument") || "-"}`;
  refs.companyPhone.textContent = `Tel: ${data.get("companyPhone") || "-"}`;

  refs.clientName.textContent = data.get("clientName") || "-";
  refs.clientStreet.textContent = data.get("clientStreet") || "-";
  refs.clientCity.textContent = data.get("clientCity") || "-";
  refs.clientZip.textContent = data.get("clientZip") || "-";
  refs.clientState.textContent = (data.get("clientState") || "-").toString().toUpperCase();
  refs.clientPhone.textContent = data.get("clientPhone") || "-";
  refs.paymentCondition.textContent = data.get("paymentCondition") || "-";

  refs.entryDate.textContent = formatDateBR(data.get("entryDate"));
  refs.deliveryForecast.textContent = data.get("deliveryForecast") || "-";
  refs.date.textContent = getTodayBR();
  refs.number.textContent = data.get("budgetNumber") || "----";

  renderPreviewItems();
}

function addItem() {
  const description = document.getElementById("itemDescription").value.trim();
  const quantity = Number(document.getElementById("itemQuantity").value);
  const unit = document.getElementById("itemUnit").value.trim() || "UN";
  const unitPrice = Number(document.getElementById("itemPrice").value);

  if (!description || !quantity || quantity <= 0 || unitPrice < 0 || Number.isNaN(unitPrice)) {
    alert("Preencha descricao, quantidade e valor unitario corretamente.");
    return;
  }

  items.push({
    description,
    quantity,
    unit,
    unitPrice,
    total: quantity * unitPrice
  });

  document.getElementById("itemDescription").value = "";
  document.getElementById("itemQuantity").value = "";
  document.getElementById("itemUnit").value = "";
  document.getElementById("itemPrice").value = "";

  renderItemsTable();
  updatePreview();
}

function removeItem(index) {
  items.splice(index, 1);
  renderItemsTable();
  updatePreview();
}

async function generatePdf() {
  updatePreview();

  const preview = document.getElementById("previewSheet");
  const { jsPDF } = window.jspdf;

  const canvas = await html2canvas(preview, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff"
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  const budgetNumber = document.getElementById("budgetNumberInput").value || "0000";
  pdf.save(`orcamento-${budgetNumber}.pdf`);
}

addItemButton.addEventListener("click", addItem);

document.querySelector("#itemsList tbody").addEventListener("click", (event) => {
  const target = event.target;
  if (target.classList.contains("remove-item")) {
    const index = Number(target.dataset.index);
    removeItem(index);
  }
});

form.addEventListener("input", updatePreview);
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  updatePreview();

  if (!items.length) {
    alert("Adicione pelo menos um item antes de gerar o orcamento.");
    return;
  }

  const submitButton = form.querySelector("button[type='submit']");
  submitButton.disabled = true;
  submitButton.textContent = "Salvando...";

  try {
    const saved = await saveBudget();
    if (!saved) return;
    updatePreview();
    alert("Orcamento salvo no banco com sucesso.");
    await loadNextBudgetNumber();
  } catch (error) {
    console.error(error);
    alert("Nao foi possivel salvar no banco. Verifique se o servidor esta rodando.");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Gerar Orcamento";
  }
});

logoutButton.addEventListener("click", async () => {
  await fetch("/api/auth/logout", { method: "POST" });
  window.location.href = "/";
});

downloadButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    try {
      await generatePdf();
    } catch (error) {
      console.error(error);
      alert("Nao foi possivel gerar o PDF. Tente novamente.");
    }
  });
});

(async () => {
  try {
    await loadSession();
    await loadNextBudgetNumber();
  } catch (error) {
    console.error(error);
    document.getElementById("budgetNumberInput").value = "----";
    refs.number.textContent = "----";
  }
  updatePreview();
})();

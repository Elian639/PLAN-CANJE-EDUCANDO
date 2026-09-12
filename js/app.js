/* =========================================================
   PLAN CANJE EDUCATIVO — CLIENTE WEB / API
   Los datos reales viven en PostgreSQL a través del backend.
========================================================= */

const API_BASE = (window.API_BASE_URL || "/api").replace(/\/$/, "");
const TOKEN_KEY = "planCanjeToken";
const ROLE_KEY = "planCanjeRole";

const PUNTOS_POR_DONACION = 1;
const PUNTOS_POR_COMPRA = 10;

function token() {
    return localStorage.getItem(TOKEN_KEY);
}

function setSession(data, remember = true) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(ROLE_KEY);
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem(TOKEN_KEY, data.token);
    storage.setItem(ROLE_KEY, data.role);
}

function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(ROLE_KEY);
}

function getToken() {
    return token() || sessionStorage.getItem(TOKEN_KEY);
}

async function api(path, options = {}) {
    const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
    const t = getToken();
    if (t) headers.Authorization = `Bearer ${t}`;

    let response;
    try {
        response = await fetch(`${API_BASE}${path}`, { ...options, headers });
    } catch (networkError) {
        const error = new Error("No se pudo conectar con el servidor. Verificá tu conexión e intentá nuevamente.");
        error.cause = networkError;
        throw error;
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        const error = new Error(data.error || "Ocurrió un error.");
        error.status = response.status;
        throw error;
    }
    return data;
}

function mostrarMensaje(element, texto, exito = false) {
    if (!element) return;
    element.textContent = texto;
    element.style.color = exito ? "#16a34a" : "#dc2626";
}

function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function fecha(value) {
    if (!value) return "-";
    return new Date(value).toLocaleDateString("es-AR");
}

function calcularPuntosPorInteres(interes) {
    const texto = String(interes || "").toLowerCase();
    if (texto.includes("compra") && texto.includes("donación")) {
        return { puntosCompra: 10, puntosDonacion: 1, puntosTotales: 11 };
    }
    if (texto.includes("compra")) return { puntosCompra: 10, puntosDonacion: 0, puntosTotales: 10 };
    return { puntosCompra: 0, puntosDonacion: 1, puntosTotales: 1 };
}

async function requireStudent() {
    try {
        const data = await api("/auth/me");
        if (data.role !== "student") throw new Error("No tenés acceso a esta sección.");
        return data.user;
    } catch (error) {
        clearSession();
        window.location.href = "../login-estudiante.html";
        return null;
    }
}

async function requireAdmin() {
    try {
        const data = await api("/auth/me");
        if (data.role !== "admin") throw new Error("No tenés acceso a esta sección.");
        return data.user;
    } catch (error) {
        clearSession();
        window.location.href = "login.html";
        return null;
    }
}

/* =========================================================
   REGISTRO
========================================================= */
const registroForm = document.getElementById("registroForm");
if (registroForm) {
    registroForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const mensaje = document.getElementById("mensajeRegistro");
        const password = document.getElementById("password")?.value || "";
        const confirmar = document.getElementById("confirmarPassword")?.value || "";
        const condiciones = document.getElementById("condiciones")?.checked;

        if (password.length < 8) return mostrarMensaje(mensaje, "La contraseña debe tener al menos 8 caracteres.");
        if (password !== confirmar) return mostrarMensaje(mensaje, "Las contraseñas no coinciden.");
        if (!condiciones) return mostrarMensaje(mensaje, "Debés aceptar las condiciones de participación.");

        const payload = {
            nombre: document.getElementById("nombre")?.value.trim(),
            apellido: document.getElementById("apellido")?.value.trim(),
            email: document.getElementById("email")?.value.trim(),
            telefono: document.getElementById("telefono")?.value.trim(),
            escuela: document.getElementById("escuela")?.value.trim(),
            curso: document.getElementById("curso")?.value,
            division: document.getElementById("division")?.value,
            password,
        };

        if (Object.values(payload).some((v) => !v)) return mostrarMensaje(mensaje, "Completá todos los campos.");

        try {
            await api("/auth/register", { method: "POST", body: JSON.stringify(payload) });
            mostrarMensaje(mensaje, "¡Cuenta creada correctamente! Redirigiendo...", true);
            setTimeout(() => { window.location.href = "login-estudiante.html"; }, 1000);
        } catch (error) {
            mostrarMensaje(mensaje, error.message);
        }
    });
}

/* =========================================================
   LOGIN ESTUDIANTE
========================================================= */
const loginForm = document.getElementById("loginForm");
if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const mensaje = document.getElementById("mensajeLogin");
        const email = document.getElementById("loginEmail")?.value.trim();
        const password = document.getElementById("loginPassword")?.value || "";
        const recordar = document.getElementById("recordar")?.checked ?? true;
        try {
            const data = await api("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
            if (data.role !== "student") throw new Error("Esta cuenta pertenece al panel de administración.");
            setSession(data, recordar);
            mostrarMensaje(mensaje, "¡Ingreso correcto! Abriendo tu portal...", true);
            setTimeout(() => { window.location.href = "estudiante/panel.html"; }, 500);
        } catch (error) {
            mostrarMensaje(mensaje, error.message);
        }
    });
}

const mostrarPassword = document.getElementById("mostrarPassword");
const loginPassword = document.getElementById("loginPassword");
if (mostrarPassword && loginPassword) {
    mostrarPassword.addEventListener("click", () => {
        loginPassword.type = loginPassword.type === "password" ? "text" : "password";
        mostrarPassword.textContent = loginPassword.type === "password" ? "Mostrar" : "Ocultar";
    });
}

const recuperarPassword = document.getElementById("recuperarPassword");
if (recuperarPassword) {
    recuperarPassword.addEventListener("click", (event) => {
        event.preventDefault();
        alert("La recuperación de contraseña por correo será incorporada en una siguiente etapa. Por ahora, contactá al administrador.");
    });
}

/* =========================================================
   PANEL ESTUDIANTE
========================================================= */
async function cargarPanelEstudiante() {
    if (!document.getElementById("nombreEstudiante")) return;
    const student = await requireStudent();
    if (!student) return;

    document.getElementById("nombreEstudiante").textContent = student.nombre || "Estudiante";
    const fields = {
        datoNombre: `${student.nombre || ""} ${student.apellido || ""}`.trim(),
        datoEmail: student.email,
        datoTelefono: student.telefono,
        datoEscuela: student.escuela,
        datoCurso: student.curso,
        datoDivision: student.division,
        puntosEstudiante: student.puntos,
        cantidadRecomendaciones: student.recomendaciones?.length || 0,
    };
    Object.entries(fields).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value ?? "-";
    });

    const list = document.getElementById("listaRecomendaciones");
    if (list) {
        const recs = student.recomendaciones || [];
        list.innerHTML = recs.length ? recs.map((rec) => `
            <div class="dato">
                <span><strong>${escapeHTML(`${rec.nombreInteresado || ""} ${rec.apellidoInteresado || ""}`)}</strong><br><small>${escapeHTML(rec.interes)} · ${fecha(rec.fecha)}</small></span>
                <strong>${rec.estado === "validada" ? "✅ Validada" : rec.estado === "rechazada" ? "❌ Rechazada" : "⏳ Pendiente"}<br><small>${rec.estado === "validada" ? `+${Number(rec.puntosOtorgados || 0)} puntos` : "En revisión"}</small></strong>
            </div>`).join("") : `<div class="sin-recomendaciones"><span>📋</span><p>Todavía no tenés recomendaciones registradas.</p></div>`;
    }
}

cargarPanelEstudiante();

const cerrarSesion = document.getElementById("cerrarSesion");
if (cerrarSesion) {
    cerrarSesion.addEventListener("click", () => {
        clearSession();
        window.location.href = "../login-estudiante.html";
    });
}

/* =========================================================
   RECOMENDACIÓN
========================================================= */
const recomendacionForm = document.getElementById("recomendacionForm");
if (recomendacionForm) {
    (async () => {
        const student = await requireStudent();
        if (!student) return;
        recomendacionForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            const mensaje = document.getElementById("mensajeRecomendacion");
            const payload = {
                nombreInteresado: document.getElementById("nombreInteresado")?.value.trim(),
                apellidoInteresado: document.getElementById("apellidoInteresado")?.value.trim(),
                telefonoInteresado: document.getElementById("telefonoInteresado")?.value.trim(),
                emailInteresado: document.getElementById("emailInteresado")?.value.trim(),
                interes: document.getElementById("interes")?.value,
                observaciones: document.getElementById("observaciones")?.value.trim(),
            };
            if (!payload.nombreInteresado || !payload.apellidoInteresado || !payload.telefonoInteresado || !payload.interes) {
                return mostrarMensaje(mensaje, "Completá los campos obligatorios.");
            }
            try {
                await api("/student/recommendations", { method: "POST", body: JSON.stringify(payload) });
                mostrarMensaje(mensaje, "¡Recomendación registrada correctamente!", true);
                recomendacionForm.reset();
                setTimeout(() => { window.location.href = "panel.html"; }, 900);
            } catch (error) {
                mostrarMensaje(mensaje, error.message);
            }
        });
    })();
}

/* =========================================================
   PUNTOS
========================================================= */
async function cargarPuntos() {
    if (!document.getElementById("puntosTotales")) return;
    const student = await requireStudent();
    if (!student) return;
    const valores = {
        puntosTotales: student.puntos,
        puntosCompra: student.puntosCompra,
        puntosDonacion: student.puntosDonacion,
        puntosDisponibles: student.puntosDisponibles,
        puntosComprometidos: student.puntosComprometidos,
        recomendacionesValidadas: (student.recomendaciones || []).filter((r) => r.estado === "validada").length,
        recomendacionesPendientes: (student.recomendaciones || []).filter((r) => r.estado === "pendiente").length,
    };
    Object.entries(valores).forEach(([id, value]) => { const el = document.getElementById(id); if (el) el.textContent = value; });

    const historial = document.getElementById("historialPuntos");
    if (historial) {
        historial.innerHTML = (student.recomendaciones || []).length ? student.recomendaciones.map((r) => `
            <div class="dato"><span><strong>${escapeHTML(`${r.nombreInteresado || ""} ${r.apellidoInteresado || ""}`)}</strong><br><small>${escapeHTML(r.interes)} · ${fecha(r.fecha)}</small></span><strong>${r.estado === "validada" ? `+${Number(r.puntosOtorgados || 0)} puntos` : r.estado === "rechazada" ? "❌ Rechazada" : "⏳ Pendiente"}</strong></div>`).join("") : `<div class="sin-recomendaciones"><span>📋</span><p>Todavía no tenés recomendaciones registradas.</p></div>`;
    }
    const canjes = document.getElementById("historialCanjesPuntos");
    if (canjes) renderCanjes(canjes, student.canjes || []);
}
cargarPuntos();

function renderCanjes(container, canjes) {
    container.innerHTML = canjes.length ? canjes.map((c) => `
        <div class="dato"><span><strong>${escapeHTML(c.premio)}</strong><br><small>${fecha(c.fecha)} · ${Number(c.puntos)} puntos</small></span><strong>${c.estado === "aprobado" ? "🏆 Aprobado" : c.estado === "rechazado" ? "❌ Rechazado" : "⏳ Pendiente"}</strong></div>`).join("") : `<div class="sin-recomendaciones"><span>🎁</span><p>Todavía no solicitaste ningún canje.</p></div>`;
}

/* =========================================================
   PREMIOS
========================================================= */
async function cargarPremios() {
    const catalogo = document.getElementById("catalogoPremios");
    if (!catalogo) return;
    const student = await requireStudent();
    if (!student) return;
    const puntos = document.getElementById("puntosActuales");
    if (puntos) puntos.textContent = student.puntosDisponibles;

    const canjes = student.canjes || [];
    catalogo.querySelectorAll(".premio").forEach((card) => {
        const button = card.querySelector(".btn-premio");
        const estado = card.querySelector(".premio-estado");
        const premio = button?.dataset.premio;
        const requeridos = Number(button?.dataset.puntos || card.dataset.puntos || 0);
        const pendiente = canjes.find((c) => c.estado === "pendiente" && c.premio === premio);
        const efectivo = String(premio).toLowerCase().includes("efectivo");
        const suficiente = efectivo ? Number(student.puntosCompra) >= requeridos : Number(student.puntosDisponibles) >= requeridos;

        if (pendiente) {
            button.disabled = true;
            button.textContent = "Solicitud pendiente";
            if (estado) estado.textContent = "⏳ Ya tenés una solicitud pendiente.";
        } else if (!suficiente) {
            button.disabled = true;
            if (estado) estado.textContent = efectivo ? `Necesitás ${requeridos} puntos de compra.` : `Necesitás ${requeridos} puntos disponibles.`;
        } else {
            button.disabled = false;
            if (estado) estado.textContent = "✅ Podés solicitar este premio.";
        }

        button?.addEventListener("click", async () => {
            if (button.disabled) return;
            const ok = confirm(`¿Querés solicitar ${premio} por ${requeridos} puntos?`);
            if (!ok) return;
            try {
                await api("/student/redemptions", { method: "POST", body: JSON.stringify({ premio, puntos: requeridos }) });
                alert("¡Solicitud de canje registrada correctamente!");
                window.location.reload();
            } catch (error) { alert(error.message); }
        });
    });

    const historial = document.getElementById("historialCanjesPremios");
    if (historial) renderCanjes(historial, canjes);
}
cargarPremios();

/* =========================================================
   LOGIN ADMIN
========================================================= */
const adminLoginForm = document.getElementById("adminLoginForm");
if (adminLoginForm) {
    adminLoginForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const mensaje = document.getElementById("mensajeAdminLogin");
        try {
            const data = await api("/auth/login", {
                method: "POST",
                body: JSON.stringify({ email: document.getElementById("adminEmail")?.value.trim(), password: document.getElementById("adminPassword")?.value || "" }),
            });
            if (data.role !== "admin") throw new Error("Esta cuenta no tiene permisos de administrador.");
            setSession(data, true);
            mostrarMensaje(mensaje, "¡Ingreso correcto!", true);
            setTimeout(() => { window.location.href = data.passwordChanged ? "panel.html" : "cambiar-password.html"; }, 500);
        } catch (error) { mostrarMensaje(mensaje, error.message); }
    });
}

/* =========================================================
   CAMBIO DE CONTRASEÑA ADMIN
========================================================= */
const cambiarPasswordAdminForm = document.getElementById("cambiarPasswordAdminForm");
if (cambiarPasswordAdminForm) {
    (async () => {
        const admin = await requireAdmin();
        if (!admin) return;
        cambiarPasswordAdminForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            const mensaje = document.getElementById("mensajeCambiarPassword");
            const password = document.getElementById("nuevaPasswordAdmin")?.value || "";
            const repetir = document.getElementById("repetirPasswordAdmin")?.value || "";
            if (password.length < 8) return mostrarMensaje(mensaje, "La contraseña debe tener al menos 8 caracteres.");
            if (password !== repetir) return mostrarMensaje(mensaje, "Las contraseñas no coinciden.");
            try {
                await api("/auth/admin/change-password", { method: "POST", body: JSON.stringify({ password }) });
                mostrarMensaje(mensaje, "Contraseña actualizada correctamente. Redirigiendo...", true);
                setTimeout(() => { window.location.href = "panel.html"; }, 700);
            } catch (error) { mostrarMensaje(mensaje, error.message); }
        });
    })();
}

/* =========================================================
   PANEL ADMIN
========================================================= */
async function cargarPanelAdmin() {
    if (!document.getElementById("listaPendientes")) return;
    const admin = await requireAdmin();
    if (!admin) return;
    try {
        const data = await api("/admin/dashboard");
        const s = data.estadisticas;
        const stats = {
            totalEstudiantes: s.totalEstudiantes,
            totalPendientes: s.totalPendientes,
            totalPuntosOtorgados: s.totalPuntosOtorgados,
            totalCanjesPendientes: s.totalCanjesPendientes,
            totalCanjesAprobados: s.totalCanjesAprobados,
        };
        Object.entries(stats).forEach(([id, value]) => { const el = document.getElementById(id); if (el) el.textContent = value; });

        renderAdminRecommendations(data.recomendaciones || []);
        renderAdminStudents(data.estudiantes || []);
        renderAdminRedemptions(data.canjes || []);
    } catch (error) { alert(error.message); }
}

function renderAdminRecommendations(recs) {
    const container = document.getElementById("listaPendientes");
    if (!container) return;
    const pending = recs.filter((r) => r.estado === "pendiente");
    container.innerHTML = pending.length ? pending.map((r) => `
        <div class="dato">
            <span><strong>${escapeHTML(`${r.nombreEstudiante || ""} ${r.apellidoEstudiante || ""}`)}</strong> → ${escapeHTML(`${r.nombreInteresado || ""} ${r.apellidoInteresado || ""}`)}<br><small>${escapeHTML(r.interes)} · ${fecha(r.fecha)} · Tel: ${escapeHTML(r.telefonoInteresado)}</small></span>
            <span><button class="btn btn-principal admin-validar-recomendacion" data-id="${r.id}">✅ Validar</button> <button class="btn admin-rechazar-recomendacion" data-id="${r.id}">❌ Rechazar</button></span>
        </div>`).join("") : `<div class="sin-recomendaciones"><span>✅</span><p>No hay recomendaciones pendientes.</p></div>`;
}

function renderAdminStudents(students) {
    const container = document.getElementById("listaEstudiantesAdmin");
    if (!container) return;
    container.innerHTML = students.length ? students.map((s) => `
        <div class="dato"><span><strong>${escapeHTML(`${s.nombre || ""} ${s.apellido || ""}`)}</strong><br><small>${escapeHTML(s.email)} · ${escapeHTML(s.escuela)} · ${escapeHTML(s.curso)} ${escapeHTML(s.division)}</small></span><strong>⭐ ${Number(s.puntos)}<br><small>🛒 ${Number(s.puntosCompra)} · 📚 ${Number(s.puntosDonacion)}</small></strong></div>`).join("") : `<div class="sin-recomendaciones"><span>👥</span><p>Todavía no hay estudiantes registrados.</p></div>`;
}

function renderAdminRedemptions(canjes) {
    const container = document.getElementById("listaCanjesAdmin");
    if (!container) return;
    container.innerHTML = canjes.length ? canjes.map((c) => `
        <div class="dato"><span><strong>${escapeHTML(`${c.nombreEstudiante || ""} ${c.apellidoEstudiante || ""}`)}</strong> → ${escapeHTML(c.premio)}<br><small>${Number(c.puntos)} puntos · ${fecha(c.fecha)}</small></span><span><strong>${c.estado === "pendiente" ? "⏳ Pendiente" : c.estado === "aprobado" ? "🏆 Aprobado" : "❌ Rechazado"}</strong>${c.estado === "pendiente" ? `<br><button class="btn btn-principal admin-aprobar-canje" data-id="${c.id}">✅ Aprobar</button> <button class="btn admin-rechazar-canje" data-id="${c.id}">❌ Rechazar</button>` : ""}</span></div>`).join("") : `<div class="sin-recomendaciones"><span>🎁</span><p>Todavía no hay solicitudes de canje.</p></div>`;
}

async function accionAdmin(url, mensaje) {
    try {
        await api(url, { method: "POST" });
        alert(mensaje);
        await cargarPanelAdmin();
    } catch (error) { alert(error.message); }
}

document.addEventListener("click", async (event) => {
    const target = event.target.closest("button");
    if (!target) return;
    const id = target.dataset.id;
    if (!id) return;

    if (target.classList.contains("admin-validar-recomendacion")) {
        if (!confirm("¿Confirmás validar esta recomendación y otorgar los puntos correspondientes?")) return;
        const puntos = calcularPuntosPorInteres(target.closest(".dato")?.innerText || "");
        await accionAdmin(`/admin/recommendations/${id}/validate`, `Recomendación validada. Se otorgaron ${puntos.puntosTotales} puntos.`);
    }
    if (target.classList.contains("admin-rechazar-recomendacion")) {
        if (!confirm("¿Querés rechazar esta recomendación?")) return;
        await accionAdmin(`/admin/recommendations/${id}/reject`, "Recomendación rechazada.");
    }
    if (target.classList.contains("admin-aprobar-canje")) {
        if (!confirm("¿Confirmás aprobar este canje? Los puntos se descontarán definitivamente.")) return;
        await accionAdmin(`/admin/redemptions/${id}/approve`, "Canje aprobado correctamente.");
    }
    if (target.classList.contains("admin-rechazar-canje")) {
        if (!confirm("¿Querés rechazar este canje? No se descontarán puntos.")) return;
        await accionAdmin(`/admin/redemptions/${id}/reject`, "Canje rechazado correctamente.");
    }
});

cargarPanelAdmin();

const cerrarSesionAdmin = document.getElementById("cerrarSesionAdmin");
if (cerrarSesionAdmin) {
    cerrarSesionAdmin.addEventListener("click", () => {
        clearSession();
        window.location.href = "login.html";
    });
}

/* =========================
PLAN CANJE EDUCATIVO
APP.JS
========================= */

/* =========================================================
CREDENCIALES DE ADMIN — SOLO DEMO
========================================================= */

const ADMIN_EMAIL = "admin@educandoconciencia.com.ar";

/* Contraseña secreta inicial. Al ingresar por primera vez con esta
   contraseña, el sistema obliga a definir una nueva (ver bloque
   LOGIN DE ADMIN más abajo). En un backend real, este cambio
   debería dispararse por un correo de restablecimiento en lugar
   de resolverse en el navegador. */
const ADMIN_PASSWORD_INICIAL = "ministracion2026";

/* =========================================================
   PUNTOS POR TIPO DE RECOMENDACIÓN
   - Donación de libros  -> 1 punto
   - Compra de productos -> 10 puntos
========================================================= */

const PUNTOS_POR_DONACION = 1;
const PUNTOS_POR_COMPRA = 10;

/* Se mantiene por compatibilidad como valor de respaldo cuando una
   recomendación antigua no tiene puntosOtorgados ni interes definidos. */
const PUNTOS_POR_RECOMENDACION_VALIDADA = PUNTOS_POR_DONACION;

function calcularPuntosPorInteres(interes) {

    const texto =
        (interes || "").toLowerCase();

    if (texto.includes("compra")) {

        return PUNTOS_POR_COMPRA;
    }

    return PUNTOS_POR_DONACION;
}

/* =========================================================
   CONTRASEÑA ACTUAL DE ADMIN (persistida en este navegador)
========================================================= */

function obtenerPasswordAdminActual() {

    return (
        localStorage.getItem("adminPasswordActual") ||
        ADMIN_PASSWORD_INICIAL
    );
}

function debeCambiarPasswordAdmin() {

    return (
        localStorage.getItem("adminPasswordCambiada") !==
        "si"
    );
}

/* =========================================================
HELPERS: ESTUDIANTES
========================================================= */

function obtenerEstudiantes() {

const guardado = localStorage.getItem("estudiantes");

if (!guardado) return [];

try {

    const lista = JSON.parse(guardado);

    return Array.isArray(lista) ? lista : [];

} catch (error) {

    console.error("Error al leer estudiantes:", error);

    return [];
}

}

function guardarEstudiantes(lista) {

localStorage.setItem(
    "estudiantes",
    JSON.stringify(lista)
);

}

function obtenerEstudiantePorId(id) {

return obtenerEstudiantes().find(
    (e) => e.id === id
) || null;

}

function obtenerEstudianteActual() {

const id = localStorage.getItem(
    "sesionEstudianteId"
);

if (!id) return null;

return obtenerEstudiantePorId(id);

}

function guardarEstudianteActualizado(estudianteActualizado) {

const lista = obtenerEstudiantes();

const indice = lista.findIndex(
    (e) => e.id === estudianteActualizado.id
);

if (indice !== -1) {

    lista[indice] = estudianteActualizado;

    guardarEstudiantes(lista);
}

}

function generarId() {

return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 8)
);

}

/* =========================================================
HELPERS: CANJES
========================================================= */

function obtenerCanjes() {

const guardado =
    localStorage.getItem("canjes");

if (!guardado) return [];

try {

    const lista =
        JSON.parse(guardado);

    return Array.isArray(lista)
        ? lista
        : [];

} catch (error) {

    console.error(
        "Error al leer canjes:",
        error
    );

    return [];
}

}

function guardarCanjes(lista) {

localStorage.setItem(
    "canjes",
    JSON.stringify(lista)
);

}

function obtenerCanjesPorEstudiante(
estudianteId
) {

return obtenerCanjes().filter(
    (canje) =>
        canje.estudianteId === estudianteId
);

}

function obtenerPuntosComprometidos(
estudianteId
) {

return obtenerCanjesPorEstudiante(
    estudianteId
)
    .filter(
        (canje) =>
            canje.estado === "pendiente"
    )
    .reduce(
        (total, canje) =>
            total +
            Number(canje.puntos || 0),
        0
    );

}

function obtenerPuntosDisponibles(
estudiante
) {

if (!estudiante) return 0;

const puntosTotales =
    Number(
        estudiante.puntos || 0
    );

const puntosComprometidos =
    obtenerPuntosComprometidos(
        estudiante.id
    );

return Math.max(
    0,
    puntosTotales -
    puntosComprometidos
);

}

function formatearFecha(fecha) {

if (!fecha) return "-";

return new Date(
    fecha
).toLocaleDateString(
    "es-AR"
);

}

/* =========================================================
MOSTRAR / OCULTAR CONTRASEÑA
========================================================= */

const mostrarPassword =
document.getElementById(
"mostrarPassword"
);

const loginPassword =
document.getElementById(
"loginPassword"
);

if (
mostrarPassword &&
loginPassword
) {

mostrarPassword.addEventListener(
    "click",
    () => {

        if (
            loginPassword.type ===
            "password"
        ) {

            loginPassword.type =
                "text";

            mostrarPassword.textContent =
                "Ocultar";

        } else {

            loginPassword.type =
                "password";

            mostrarPassword.textContent =
                "Mostrar";
        }

    }
);

}

/* =========================================================
RECUPERAR CONTRASEÑA
========================================================= */

const recuperarPassword =
document.getElementById(
"recuperarPassword"
);

if (recuperarPassword) {

recuperarPassword.addEventListener(
    "click",
    (event) => {

        event.preventDefault();

        alert(
            "La recuperación de contraseña estará disponible cuando conectemos el sistema de usuarios."
        );

    }
);

}

/* =========================================================
REGISTRO DE ESTUDIANTE
========================================================= */

const registroForm =
document.getElementById(
"registroForm"
);

if (registroForm) {

registroForm.addEventListener(
    "submit",
    (event) => {

        event.preventDefault();


        const nombreElement =
            document.getElementById(
                "nombre"
            );

        const apellidoElement =
            document.getElementById(
                "apellido"
            );

        const emailElement =
            document.getElementById(
                "email"
            );

        const telefonoElement =
            document.getElementById(
                "telefono"
            );

        const escuelaElement =
            document.getElementById(
                "escuela"
            );

        const cursoElement =
            document.getElementById(
                "curso"
            );

        const divisionElement =
            document.getElementById(
                "division"
            );

        const passwordElement =
            document.getElementById(
                "password"
            );

        const confirmarPasswordElement =
            document.getElementById(
                "confirmarPassword"
            );

        const condicionesElement =
            document.getElementById(
                "condiciones"
            );

        const mensaje =
            document.getElementById(
                "mensajeRegistro"
            );


        if (
            !nombreElement ||
            !apellidoElement ||
            !emailElement ||
            !telefonoElement ||
            !escuelaElement ||
            !cursoElement ||
            !divisionElement ||
            !passwordElement ||
            !confirmarPasswordElement ||
            !condicionesElement ||
            !mensaje
        ) {

            console.error(
                "Faltan elementos en el formulario de registro."
            );

            return;
        }


        const nombre =
            nombreElement.value.trim();

        const apellido =
            apellidoElement.value.trim();

        const email =
            emailElement.value.trim();

        const telefono =
            telefonoElement.value.trim();

        const escuela =
            escuelaElement.value.trim();

        const curso =
            cursoElement.value;

        const division =
            divisionElement.value;

        const password =
            passwordElement.value;

        const confirmarPassword =
            confirmarPasswordElement.value;

        const condiciones =
            condicionesElement.checked;


        if (
            !nombre ||
            !apellido ||
            !email ||
            !telefono ||
            !escuela ||
            !curso ||
            !division ||
            !password ||
            !confirmarPassword
        ) {

            mensaje.textContent =
                "Completá todos los campos.";

            mensaje.style.color =
                "#dc2626";

            return;
        }


        if (password.length < 8) {

            mensaje.textContent =
                "La contraseña debe tener al menos 8 caracteres.";

            mensaje.style.color =
                "#dc2626";

            return;
        }


        if (
            password !==
            confirmarPassword
        ) {

            mensaje.textContent =
                "Las contraseñas no coinciden.";

            mensaje.style.color =
                "#dc2626";

            return;
        }


        if (!condiciones) {

            mensaje.textContent =
                "Debés aceptar las condiciones de participación.";

            mensaje.style.color =
                "#dc2626";

            return;
        }


        const estudiantes =
            obtenerEstudiantes();


        const yaExiste =
            estudiantes.some(
                (e) =>
                    e.email &&
                    e.email.toLowerCase() ===
                    email.toLowerCase()
            );


        if (yaExiste) {

            mensaje.textContent =
                "Ya existe una cuenta registrada con ese correo.";

            mensaje.style.color =
                "#dc2626";

            return;
        }


        const nuevoEstudiante = {

            id: generarId(),

            nombre,
            apellido,
            email,
            telefono,
            escuela,
            curso,
            division,

            password,

            puntos: 0,

            recomendaciones: [],

            fechaRegistro:
                new Date().toISOString()
        };


        estudiantes.push(
            nuevoEstudiante
        );

        guardarEstudiantes(
            estudiantes
        );


        mensaje.textContent =
            "¡Cuenta creada correctamente! Redirigiendo...";

        mensaje.style.color =
            "#16a34a";


        setTimeout(
            () => {

                window.location.href =
                    "login-estudiante.html";

            },
            1500
        );

    }
);

}

/* =========================================================
LOGIN DE ESTUDIANTE
========================================================= */

const loginForm =
document.getElementById(
"loginForm"
);

if (loginForm) {

loginForm.addEventListener(
    "submit",
    (event) => {

        event.preventDefault();


        const loginEmailElement =
            document.getElementById(
                "loginEmail"
            );

        const loginPasswordElement =
            document.getElementById(
                "loginPassword"
            );

        const mensaje =
            document.getElementById(
                "mensajeLogin"
            );


        if (
            !loginEmailElement ||
            !loginPasswordElement ||
            !mensaje
        ) {

            console.error(
                "Faltan elementos en el formulario de login."
            );

            return;
        }


        const email =
            loginEmailElement.value.trim();

        const password =
            loginPasswordElement.value;


        const estudiantes =
            obtenerEstudiantes();


        const estudiante =
            estudiantes.find(
                (e) =>
                    e.email &&
                    e.email.toLowerCase() ===
                    email.toLowerCase()
            );


        if (!estudiante) {

            mensaje.textContent =
                "No existe una cuenta con ese correo. Primero debés registrarte.";

            mensaje.style.color =
                "#dc2626";

            return;
        }


        if (
            estudiante.password !==
            password
        ) {

            mensaje.textContent =
                "La contraseña es incorrecta.";

            mensaje.style.color =
                "#dc2626";

            return;
        }


        localStorage.setItem(
            "sesionEstudianteId",
            estudiante.id
        );


        mensaje.textContent =
            "¡Ingreso correcto! Abriendo tu portal...";

        mensaje.style.color =
            "#16a34a";


        setTimeout(
            () => {

                window.location.href =
                    "Estudiante/panel.html";

            },
            800
        );

    }
);

}

/* =========================================================
PANEL DE ESTUDIANTE
========================================================= */

const nombreEstudiante =
document.getElementById(
"nombreEstudiante"
);

if (nombreEstudiante) {

const estudiante =
    obtenerEstudianteActual();


if (!estudiante) {

    localStorage.removeItem(
        "sesionEstudianteId"
    );

    window.location.href =
        "../login-estudiante.html";

} else {

    nombreEstudiante.textContent =
        estudiante.nombre ||
        "Estudiante";


    const datoNombre =
        document.getElementById(
            "datoNombre"
        );

    const datoEmail =
        document.getElementById(
            "datoEmail"
        );

    const datoTelefono =
        document.getElementById(
            "datoTelefono"
        );

    const datoEscuela =
        document.getElementById(
            "datoEscuela"
        );

    const datoCurso =
        document.getElementById(
            "datoCurso"
        );

    const datoDivision =
        document.getElementById(
            "datoDivision"
        );


    if (datoNombre) {

        datoNombre.textContent =
            `${estudiante.nombre || ""} ${estudiante.apellido || ""}`;
    }


    if (datoEmail) {

        datoEmail.textContent =
            estudiante.email || "-";
    }


    if (datoTelefono) {

        datoTelefono.textContent =
            estudiante.telefono || "-";
    }


    if (datoEscuela) {

        datoEscuela.textContent =
            estudiante.escuela || "-";
    }


    if (datoCurso) {

        datoCurso.textContent =
            estudiante.curso || "-";
    }


    if (datoDivision) {

        datoDivision.textContent =
            estudiante.division || "-";
    }


    const puntosEstudiante =
        document.getElementById(
            "puntosEstudiante"
        );


    if (puntosEstudiante) {

        puntosEstudiante.textContent =
            estudiante.puntos || 0;
    }


    const recomendaciones =
        Array.isArray(
            estudiante.recomendaciones
        )
            ? estudiante.recomendaciones
            : [];


    const cantidadRecomendaciones =
        document.getElementById(
            "cantidadRecomendaciones"
        );


    if (cantidadRecomendaciones) {

        cantidadRecomendaciones.textContent =
            recomendaciones.length;
    }


    const listaRecomendaciones =
        document.getElementById(
            "listaRecomendaciones"
        );


    if (listaRecomendaciones) {

        listaRecomendaciones.innerHTML =
            "";


        if (
            recomendaciones.length ===
            0
        ) {

            listaRecomendaciones.innerHTML = `
                <div class="sin-recomendaciones">
                    <span>📋</span>
                    <p>Todavía no tenés recomendaciones registradas.</p>
                </div>
            `;

        } else {

            recomendaciones
                .slice()
                .reverse()
                .forEach(
                    (rec) => {

                        const item =
                            document.createElement(
                                "div"
                            );

                        item.className =
                            "dato";


                        const estado =
                            rec.estado ===
                            "validada"
                                ? "✅ Validada"
                                : "⏳ Pendiente";


                        const fecha =
                            rec.fecha
                                ? formatearFecha(
                                    rec.fecha
                                  )
                                : "-";


                        const puntos =
                            rec.estado ===
                            "validada"
                                ? `+${Number(rec.puntosOtorgados || PUNTOS_POR_RECOMENDACION_VALIDADA)} puntos`
                                : "En revisión";


                        item.innerHTML = `
                            <span>
                                <strong>
                                    ${rec.nombreInteresado || ""}
                                    ${rec.apellidoInteresado || ""}
                                </strong>
                                <br>
                                <small>
                                    ${rec.interes || ""}
                                    · ${fecha}
                                </small>
                            </span>

                            <strong>
                                ${estado}
                                <br>
                                <small>${puntos}</small>
                            </strong>
                        `;


                        listaRecomendaciones.appendChild(
                            item
                        );

                    }
                );
        }
    }
}

}

/* =========================================================
CERRAR SESIÓN — ESTUDIANTE
========================================================= */

const cerrarSesion =
document.getElementById(
"cerrarSesion"
);

if (cerrarSesion) {

cerrarSesion.addEventListener(
    "click",
    () => {

        localStorage.removeItem(
            "sesionEstudianteId"
        );

        window.location.href =
            "../login-estudiante.html";

    }
);

}

/* =========================================================
NUEVA RECOMENDACIÓN
========================================================= */

const btnNuevaRecomendacion =
document.getElementById(
"btnNuevaRecomendacion"
);

if (btnNuevaRecomendacion) {

btnNuevaRecomendacion.addEventListener(
    "click",
    () => {

        window.location.href =
            "recomendacion.html";

    }
);

}

/* =========================================================
FORMULARIO DE RECOMENDACIÓN
========================================================= */

const recomendacionForm =
document.getElementById(
"recomendacionForm"
);

if (recomendacionForm) {

const estudianteSesion =
    obtenerEstudianteActual();


if (!estudianteSesion) {

    window.location.href =
        "../login-estudiante.html";

} else {

    recomendacionForm.addEventListener(
        "submit",
        (event) => {

            event.preventDefault();


            const nombreElement =
                document.getElementById(
                    "nombreInteresado"
                );

            const apellidoElement =
                document.getElementById(
                    "apellidoInteresado"
                );

            const telefonoElement =
                document.getElementById(
                    "telefonoInteresado"
                );

            const emailElement =
                document.getElementById(
                    "emailInteresado"
                );

            const interesElement =
                document.getElementById(
                    "interes"
                );

            const observacionesElement =
                document.getElementById(
                    "observaciones"
                );

            const mensaje =
                document.getElementById(
                    "mensajeRecomendacion"
                );


            if (
                !nombreElement ||
                !apellidoElement ||
                !telefonoElement ||
                !emailElement ||
                !interesElement ||
                !observacionesElement ||
                !mensaje
            ) {

                console.error(
                    "Faltan elementos en el formulario de recomendación."
                );

                return;
            }


            const nombreInteresado =
                nombreElement.value.trim();

            const apellidoInteresado =
                apellidoElement.value.trim();

            const telefonoInteresado =
                telefonoElement.value.trim();

            const emailInteresado =
                emailElement.value.trim();

            const interes =
                interesElement.value;

            const observaciones =
                observacionesElement.value.trim();


            if (
                !nombreInteresado ||
                !apellidoInteresado ||
                !telefonoInteresado ||
                !interes
            ) {

                mensaje.textContent =
                    "Completá los campos obligatorios.";

                mensaje.style.color =
                    "#dc2626";

                return;
            }


            const estudiante =
                obtenerEstudianteActual();


            if (!estudiante) {

                mensaje.textContent =
                    "No se encontró tu cuenta. Iniciá sesión nuevamente.";

                mensaje.style.color =
                    "#dc2626";

                return;
            }


            if (
                !Array.isArray(
                    estudiante.recomendaciones
                )
            ) {

                estudiante.recomendaciones =
                    [];
            }


            const duplicada =
                estudiante.recomendaciones.some(
                    (r) => {

                        const mismoTelefono =
                            r.telefonoInteresado &&
                            r.telefonoInteresado.trim() ===
                            telefonoInteresado;

                        const mismoEmail =
                            emailInteresado &&
                            r.emailInteresado &&
                            r.emailInteresado.toLowerCase() ===
                            emailInteresado.toLowerCase();

                        return (
                            mismoTelefono ||
                            mismoEmail
                        );
                    }
                );


            if (duplicada) {

                mensaje.textContent =
                    "Ya existe una recomendación registrada con esos datos.";

                mensaje.style.color =
                    "#dc2626";

                return;
            }


            const nuevaRecomendacion = {

                id: generarId(),

                nombreInteresado,
                apellidoInteresado,
                telefonoInteresado,
                emailInteresado,
                interes,
                observaciones,

                estado: "pendiente",

                fecha:
                    new Date().toISOString(),

                puntosOtorgados: 0,

                fechaValidacion: null
            };


            estudiante.recomendaciones.push(
                nuevaRecomendacion
            );


            guardarEstudianteActualizado(
                estudiante
            );


            mensaje.textContent =
                "¡Recomendación registrada correctamente! Redirigiendo a tu panel...";

            mensaje.style.color =
                "#16a34a";


            setTimeout(
                () => {

                    window.location.href =
                        "panel.html";

                },
                1200
            );

        }
    );
}

}

/* =========================================================
PÁGINA DE PUNTOS
========================================================= */

const historialPuntos =
document.getElementById(
"historialPuntos"
);

if (historialPuntos) {

const estudiante =
    obtenerEstudianteActual();


if (!estudiante) {

    window.location.href =
        "../login-estudiante.html";

} else {

    const puntosTotales =
        document.getElementById(
            "puntosTotales"
        );

    const puntosDisponibles =
        document.getElementById(
            "puntosDisponibles"
        );

    const puntosComprometidos =
        document.getElementById(
            "puntosComprometidos"
        );

    const canjesPendientes =
        document.getElementById(
            "canjesPendientes"
        );


    const puntosTotalesValor =
        Number(
            estudiante.puntos || 0
        );

    const puntosComprometidosValor =
        obtenerPuntosComprometidos(
            estudiante.id
        );

    const puntosDisponiblesValor =
        obtenerPuntosDisponibles(
            estudiante
        );


    if (puntosTotales) {

        puntosTotales.textContent =
            puntosTotalesValor;
    }


    if (puntosDisponibles) {

        puntosDisponibles.textContent =
            puntosDisponiblesValor;
    }


    if (puntosComprometidos) {

        puntosComprometidos.textContent =
            puntosComprometidosValor;
    }


    const recomendaciones =
        Array.isArray(
            estudiante.recomendaciones
        )
            ? estudiante.recomendaciones
            : [];


    const validadas =
        recomendaciones.filter(
            (r) =>
                r.estado ===
                "validada"
        ).length;


    const pendientes =
        recomendaciones.filter(
            (r) =>
                r.estado ===
                "pendiente"
        ).length;


    const elValidadas =
        document.getElementById(
            "recomendacionesValidadas"
        );

    const elPendientes =
        document.getElementById(
            "recomendacionesPendientes"
        );


    if (elValidadas) {

        elValidadas.textContent =
            validadas;
    }


    if (elPendientes) {

        elPendientes.textContent =
            pendientes;
    }


    const canjesEstudiante =
        obtenerCanjesPorEstudiante(
            estudiante.id
        );


    const canjesPendientesLista =
        canjesEstudiante.filter(
            (canje) =>
                canje.estado ===
                "pendiente"
        );


    if (canjesPendientes) {

        canjesPendientes.textContent =
            canjesPendientesLista.length;
    }


    /* =============================================
       HISTORIAL DE RECOMENDACIONES
    ============================================= */

    if (
        recomendaciones.length >
        0
    ) {

        historialPuntos.innerHTML =
            "";


        recomendaciones
            .slice()
            .reverse()
            .forEach(
                (r) => {

                    const item =
                        document.createElement(
                            "div"
                        );


                    item.className =
                        "dato";


                    const estadoTexto =
                        r.estado ===
                        "validada"
                            ? "✅ Validada"
                            : "⏳ Pendiente";


                    const fecha =
                        r.fecha
                            ? formatearFecha(
                                r.fecha
                              )
                            : "-";


                    const puntosTexto =
                        r.estado ===
                        "validada"
                            ? `+${Number(r.puntosOtorgados || PUNTOS_POR_RECOMENDACION_VALIDADA)} puntos`
                            : "Sin puntos todavía";


                    item.innerHTML = `
                        <span>
                            ${r.nombreInteresado || ""}
                            ${r.apellidoInteresado || ""}
                            · ${fecha}
                        </span>

                        <strong>
                            ${estadoTexto}
                            <br>
                            <small>${puntosTexto}</small>
                        </strong>
                    `;


                    historialPuntos.appendChild(
                        item
                    );

                }
            );
    }


    /* =============================================
       HISTORIAL DE CANJES
    ============================================= */

    const historialCanjesPuntos =
        document.getElementById(
            "historialCanjesPuntos"
        );


    if (historialCanjesPuntos) {

        historialCanjesPuntos.innerHTML =
            "";


        if (
            canjesEstudiante.length ===
            0
        ) {

            historialCanjesPuntos.innerHTML = `
                <div class="sin-recomendaciones">
                    <span>🎁</span>
                    <p>Todavía no tenés solicitudes de canje.</p>
                </div>
            `;

        } else {

            canjesEstudiante
                .slice()
                .reverse()
                .forEach(
                    (canje) => {

                        const item =
                            document.createElement(
                                "div"
                            );


                        item.className =
                            "dato";


                        let estadoTexto =
                            "⏳ Pendiente";


                        if (
                            canje.estado ===
                            "aprobado"
                        ) {

                            estadoTexto =
                                "✅ Aprobado";

                        } else if (
                            canje.estado ===
                            "rechazado"
                        ) {

                            estadoTexto =
                                "❌ Rechazado";
                        }


                        const fechaSolicitud =
                            formatearFecha(
                                canje.fechaSolicitud
                            );


                        const fechaResolucion =
                            canje.fechaResolucion
                                ? ` · Resuelto: ${formatearFecha(canje.fechaResolucion)}`
                                : "";


                        item.innerHTML = `
                            <span>
                                <strong>
                                    🎁 ${canje.premio || "Premio"}
                                </strong>
                                <br>
                                <small>
                                    ${canje.puntos || 0} puntos
                                    · Solicitud: ${fechaSolicitud}
                                    ${fechaResolucion}
                                </small>
                            </span>

                            <strong>
                                ${estadoTexto}
                            </strong>
                        `;


                        historialCanjesPuntos.appendChild(
                            item
                        );

                    }
                );
        }
    }
}

}

/* =========================================================
PÁGINA DE PREMIOS
========================================================= */

const catalogoPremios =
document.getElementById(
"catalogoPremios"
);

if (catalogoPremios) {

const estudiante =
    obtenerEstudianteActual();


if (!estudiante) {

    window.location.href =
        "../login-estudiante.html";

} else {

    renderizarPaginaPremios(
        estudiante,
        catalogoPremios
    );
}

}

/* =========================================================
RENDERIZAR PREMIOS
========================================================= */

function renderizarPaginaPremios(
estudiante,
catalogo
) {

const puntosActuales =
    document.getElementById(
        "puntosActuales"
    );


const puntosTotales =
    Number(
        estudiante.puntos || 0
    );


const puntosDisponibles =
    obtenerPuntosDisponibles(
        estudiante
    );


if (puntosActuales) {

    puntosActuales.textContent =
        puntosTotales;
}


const premios =
    catalogo.querySelectorAll(
        ".premio"
    );


const canjesEstudiante =
    obtenerCanjesPorEstudiante(
        estudiante.id
    );


premios.forEach(
    (premio) => {

        const puntosNecesarios =
            parseInt(
                premio.dataset.puntos,
                10
            ) || 0;


        const nombrePremioElement =
            premio.querySelector(
                "h3"
            );


        const nombrePremio =
            nombrePremioElement
                ? nombrePremioElement.textContent.trim()
                : "Premio";


        const requisito =
            premio.querySelector(
                ".premio-requisito"
            );


        const estado =
            premio.querySelector(
                ".premio-estado"
            );


        const boton =
            premio.querySelector(
                ".btn-premio"
            );


        /* =========================================
           BUSCAR SOLICITUD PENDIENTE
        ========================================= */

        const solicitudPendiente =
            canjesEstudiante.find(
                (canje) =>
                    canje.estado ===
                    "pendiente" &&
                    canje.premio ===
                    nombrePremio
            );


        /* =========================================
           SOLICITUD PENDIENTE
        ========================================= */

        if (solicitudPendiente) {

            if (requisito) {

                requisito.textContent =
                    "⏳ Solicitud pendiente";

                requisito.style.color =
                    "#d97706";

                requisito.style.fontWeight =
                    "bold";
            }


            if (estado) {

                estado.textContent =
                    "Tus puntos están comprometidos mientras se revisa la solicitud.";

                estado.style.color =
                    "#d97706";
            }


            if (boton) {

                boton.disabled =
                    true;

                boton.textContent =
                    "⏳ Solicitud pendiente";

                boton.style.opacity =
                    "0.65";

                boton.style.cursor =
                    "not-allowed";
            }


            return;
        }


        /* =========================================
           PUEDE CANJEAR
        ========================================= */

        if (
            puntosDisponibles >=
            puntosNecesarios
        ) {

            if (requisito) {

                requisito.textContent =
                    "✅ ¡Ya podés solicitarlo!";

                requisito.style.color =
                    "#2563eb";

                requisito.style.fontWeight =
                    "bold";
            }


            if (estado) {

                estado.textContent =
                    `Tenés ${puntosDisponibles} puntos disponibles.`;

                estado.style.color =
                    "#16a34a";
            }


            if (boton) {

                boton.disabled =
                    false;

                boton.textContent =
                    "🎁 Solicitar canje";

                boton.style.opacity =
                    "1";

                boton.style.cursor =
                    "pointer";


                boton.onclick =
                    () => {

                        solicitarCanje(
                            estudiante.id,
                            nombrePremio,
                            puntosNecesarios
                        );

                    };
            }


        } else {

            /* =====================================
               NO ALCANZAN LOS PUNTOS
            ===================================== */

            const faltan =
                puntosNecesarios -
                puntosDisponibles;


            if (requisito) {

                requisito.textContent =
                    `Te faltan ${faltan} puntos`;

                requisito.style.color =
                    "";
                requisito.style.fontWeight =
                    "";
            }


            if (estado) {

                estado.textContent =
                    `Disponibles: ${puntosDisponibles} · Requiere: ${puntosNecesarios}`;

                estado.style.color =
                    "#64748b";
            }


            if (boton) {

                boton.disabled =
                    true;

                boton.textContent =
                    "🔒 Puntos insuficientes";

                boton.style.opacity =
                    "0.55";

                boton.style.cursor =
                    "not-allowed";

                boton.onclick =
                    null;
            }
        }
    }
);


/* =============================================
   HISTORIAL
============================================= */

const historial =
    document.getElementById(
        "historialCanjesPremios"
    );


if (historial) {

    historial.innerHTML =
        "";


    if (
        canjesEstudiante.length ===
        0
    ) {

        historial.innerHTML = `
            <div class="sin-recomendaciones">
                <span>🎁</span>
                <p>Todavía no tenés solicitudes de canje.</p>
            </div>
        `;

    } else {

        canjesEstudiante
            .slice()
            .reverse()
            .forEach(
                (canje) => {

                    const item =
                        document.createElement(
                            "div"
                        );


                    item.className =
                        "dato";


                    let estadoTexto =
                        "⏳ Pendiente";


                    if (
                        canje.estado ===
                        "aprobado"
                    ) {

                        estadoTexto =
                            "✅ Aprobado";

                    } else if (
                        canje.estado ===
                        "rechazado"
                    ) {

                        estadoTexto =
                            "❌ Rechazado";
                    }


                    item.innerHTML = `
                        <span>
                            <strong>
                                🎁 ${canje.premio || "Premio"}
                            </strong>
                            <br>
                            <small>
                                ${canje.puntos || 0} puntos
                                · ${formatearFecha(canje.fechaSolicitud)}
                            </small>
                        </span>

                        <strong>
                            ${estadoTexto}
                        </strong>
                    `;


                    historial.appendChild(
                        item
                    );

                }
            );
    }
}

}

/* =========================================================
SOLICITAR CANJE
========================================================= */

function solicitarCanje(
estudianteId,
nombrePremio,
puntosPremio
) {

const estudiante =
    obtenerEstudiantePorId(
        estudianteId
    );


if (!estudiante) {

    alert(
        "No se encontró tu cuenta. Iniciá sesión nuevamente."
    );

    return;
}


const puntosNecesarios =
    Number(
        puntosPremio || 0
    );


const puntosDisponibles =
    obtenerPuntosDisponibles(
        estudiante
    );


/* =============================================
   VERIFICAR SALDO
============================================= */

if (
    puntosDisponibles <
    puntosNecesarios
) {

    alert(
        `No tenés suficientes puntos disponibles.\n\nDisponibles: ${puntosDisponibles}\nNecesarios: ${puntosNecesarios}`
    );

    return;
}


/* =============================================
   EVITAR DUPLICADO PENDIENTE
============================================= */

const canjes =
    obtenerCanjes();


const yaExiste =
    canjes.some(
        (canje) =>
            canje.estudianteId ===
                estudiante.id &&
            canje.premio ===
                nombrePremio &&
            canje.estado ===
                "pendiente"
    );


if (yaExiste) {

    alert(
        "Ya tenés una solicitud pendiente para este premio."
    );

    return;
}


/* =============================================
   CONFIRMACIÓN
============================================= */

const confirmar =
    confirm(
        `¿Querés solicitar el canje de "${nombrePremio}"?\n\nCosto: ${puntosNecesarios} puntos\n\nTus puntos NO se descontarán ahora. Se descontarán únicamente si el administrador aprueba la solicitud.`
    );


if (!confirmar) {

    return;
}


/* =============================================
   CREAR SOLICITUD
============================================= */

const nuevoCanje = {

    id: generarId(),

    estudianteId:
        estudiante.id,

    premio:
        nombrePremio,

    puntos:
        puntosNecesarios,

    estado:
        "pendiente",

    fechaSolicitud:
        new Date().toISOString(),

    fechaResolucion:
        null
};


canjes.push(
    nuevoCanje
);


guardarCanjes(
    canjes
);


alert(
    `¡Solicitud registrada correctamente!\n\nPremio: ${nombrePremio}\nPuntos: ${puntosNecesarios}\n\nEl equipo de Educando Conciencia revisará tu solicitud.`
);


/* =============================================
   ACTUALIZAR PÁGINA
============================================= */

const catalogo =
    document.getElementById(
        "catalogoPremios"
    );


if (catalogo) {

    const estudianteActual =
        obtenerEstudianteActual();


    if (estudianteActual) {

        renderizarPaginaPremios(
            estudianteActual,
            catalogo
        );
    }
}

}

/* =========================================================
LOGIN DE ADMIN
========================================================= */

const adminLoginForm =
document.getElementById(
"adminLoginForm"
);

if (adminLoginForm) {

adminLoginForm.addEventListener(
    "submit",
    (event) => {

        event.preventDefault();


        const emailElement =
            document.getElementById(
                "adminEmail"
            );

        const passwordElement =
            document.getElementById(
                "adminPassword"
            );

        const mensaje =
            document.getElementById(
                "mensajeAdminLogin"
            );


        if (
            !emailElement ||
            !passwordElement ||
            !mensaje
        ) {

            return;
        }


        const email =
            emailElement.value.trim();

        const password =
            passwordElement.value;


        if (
            email.toLowerCase() !==
                ADMIN_EMAIL.toLowerCase() ||
            password !==
                obtenerPasswordAdminActual()
        ) {

            mensaje.textContent =
                "Credenciales incorrectas.";

            mensaje.style.color =
                "#dc2626";

            return;
        }


        localStorage.setItem(
            "sesionAdmin",
            "activa"
        );


        /* ==================================================
           PRIMER INGRESO: OBLIGA A CAMBIAR LA CONTRASEÑA
           (en un backend real esto se dispararía por correo)
        ================================================== */

        if (debeCambiarPasswordAdmin()) {

            mensaje.textContent =
                "¡Ingreso correcto! Por seguridad, definí una nueva contraseña...";

            mensaje.style.color =
                "#16a34a";

            setTimeout(
                () => {

                    window.location.href =
                        "cambiar-password.html";

                },
                700
            );

            return;
        }


        mensaje.textContent =
            "¡Ingreso correcto! Abriendo el panel...";

        mensaje.style.color =
            "#16a34a";


        setTimeout(
            () => {

                window.location.href =
                    "panel.html";

            },
            700
        );

    }
);

}

/* =========================================================
   CAMBIO DE CONTRASEÑA DE ADMIN (PRIMER INGRESO)
========================================================= */

const cambiarPasswordAdminForm =
    document.getElementById(
        "cambiarPasswordAdminForm"
    );

if (cambiarPasswordAdminForm) {

    const sesionAdminActiva =
        localStorage.getItem(
            "sesionAdmin"
        );

    if (
        sesionAdminActiva !==
        "activa"
    ) {

        window.location.href =
            "login.html";

    } else {

        cambiarPasswordAdminForm.addEventListener(
            "submit",
            (event) => {

                event.preventDefault();

                const nuevaElement =
                    document.getElementById(
                        "nuevaPasswordAdmin"
                    );

                const repetirElement =
                    document.getElementById(
                        "repetirPasswordAdmin"
                    );

                const mensaje =
                    document.getElementById(
                        "mensajeCambiarPassword"
                    );

                if (
                    !nuevaElement ||
                    !repetirElement ||
                    !mensaje
                ) {

                    return;
                }

                const nueva =
                    nuevaElement.value;

                const repetir =
                    repetirElement.value;

                if (nueva.length < 8) {

                    mensaje.textContent =
                        "La nueva contraseña debe tener al menos 8 caracteres.";

                    mensaje.style.color =
                        "#dc2626";

                    return;
                }

                if (nueva === ADMIN_PASSWORD_INICIAL) {

                    mensaje.textContent =
                        "Elegí una contraseña distinta a la inicial.";

                    mensaje.style.color =
                        "#dc2626";

                    return;
                }

                if (nueva !== repetir) {

                    mensaje.textContent =
                        "Las contraseñas no coinciden.";

                    mensaje.style.color =
                        "#dc2626";

                    return;
                }

                localStorage.setItem(
                    "adminPasswordActual",
                    nueva
                );

                localStorage.setItem(
                    "adminPasswordCambiada",
                    "si"
                );

                mensaje.textContent =
                    "¡Contraseña actualizada correctamente! Abriendo el panel...";

                mensaje.style.color =
                    "#16a34a";

                setTimeout(
                    () => {

                        window.location.href =
                            "panel.html";

                    },
                    900
                );

            }
        );

    }

}

/* =========================================================
PANEL DE ADMIN
========================================================= */

const listaEstudiantesAdmin =
document.getElementById(
"listaEstudiantesAdmin"
);

if (listaEstudiantesAdmin) {

const sesionAdmin =
    localStorage.getItem(
        "sesionAdmin"
    );


if (
    sesionAdmin !==
    "activa"
) {

    window.location.href =
        "login.html";

} else if (
    debeCambiarPasswordAdmin()
) {

    window.location.href =
        "cambiar-password.html";

} else {


    function renderizarPanelAdmin() {

        const estudiantes =
            obtenerEstudiantes();

        const canjes =
            obtenerCanjes();


        /* =============================================
           ESTADÍSTICAS
        ============================================= */

        const totalEstudiantes =
            document.getElementById(
                "totalEstudiantes"
            );

        const totalPendientes =
            document.getElementById(
                "totalPendientes"
            );

        const totalPuntosOtorgados =
            document.getElementById(
                "totalPuntosOtorgados"
            );

        const totalCanjesPendientes =
            document.getElementById(
                "totalCanjesPendientes"
            );

        const totalCanjesAprobados =
            document.getElementById(
                "totalCanjesAprobados"
            );


        let pendientesCount =
            0;

        let puntosOtorgados =
            0;


        estudiantes.forEach(
            (estudiante) => {

                puntosOtorgados +=
                    Number(
                        estudiante.puntos ||
                        0
                    );


                (
                    estudiante.recomendaciones ||
                    []
                ).forEach(
                    (rec) => {

                        if (
                            rec.estado ===
                            "pendiente"
                        ) {

                            pendientesCount++;
                        }

                    }
                );

            }
        );


        const canjesPendientesCount =
            canjes.filter(
                (canje) =>
                    canje.estado ===
                    "pendiente"
            ).length;


        const canjesAprobadosCount =
            canjes.filter(
                (canje) =>
                    canje.estado ===
                    "aprobado"
            ).length;


        if (totalEstudiantes) {

            totalEstudiantes.textContent =
                estudiantes.length;
        }


        if (totalPendientes) {

            totalPendientes.textContent =
                pendientesCount;
        }


        if (totalPuntosOtorgados) {

            totalPuntosOtorgados.textContent =
                puntosOtorgados;
        }


        if (totalCanjesPendientes) {

            totalCanjesPendientes.textContent =
                canjesPendientesCount;
        }


        if (totalCanjesAprobados) {

            totalCanjesAprobados.textContent =
                canjesAprobadosCount;
        }


        /* =============================================
           RECOMENDACIONES PENDIENTES
        ============================================= */

        const listaPendientes =
            document.getElementById(
                "listaPendientes"
            );


        if (listaPendientes) {

            listaPendientes.innerHTML =
                "";


            let hayPendientes =
                false;


            estudiantes.forEach(
                (estudiante) => {

                    (
                        estudiante.recomendaciones ||
                        []
                    ).forEach(
                        (rec) => {

                            if (
                                rec.estado !==
                                "pendiente"
                            ) {

                                return;
                            }


                            hayPendientes =
                                true;


                            const item =
                                document.createElement(
                                    "div"
                                );


                            item.className =
                                "dato";

                            item.style.display =
                                "flex";

                            item.style.alignItems =
                                "center";

                            item.style.justifyContent =
                                "space-between";

                            item.style.gap =
                                "12px";


                            item.innerHTML = `
                                <span>
                                    <strong>
                                        ${rec.nombreInteresado || ""}
                                        ${rec.apellidoInteresado || ""}
                                    </strong>

                                    <br>

                                    Recomendado por
                                    ${estudiante.nombre || ""}
                                    ${estudiante.apellido || ""}
                                    (${estudiante.escuela || "-"})

                                    <br>

                                    <small>
                                        Interés:
                                        ${rec.interes || "-"}
                                    </small>

                                    <br>

                                    <small>
                                        Teléfono:
                                        ${rec.telefonoInteresado || "-"}
                                    </small>

                                    <br>

                                    <small>
                                        Fecha:
                                        ${formatearFecha(rec.fecha)}
                                    </small>
                                </span>
                            `;


                            const boton =
                                document.createElement(
                                    "button"
                                );


                            boton.textContent =
                                "✅ Validar";


                            boton.className =
                                "btn btn-principal";


                            boton.style.width =
                                "auto";

                            boton.style.padding =
                                "8px 14px";

                            boton.style.fontSize =
                                "13px";


                            boton.addEventListener(
                                "click",
                                () => {

                                    validarRecomendacion(
                                        estudiante.id,
                                        rec.id
                                    );

                                }
                            );


                            item.appendChild(
                                boton
                            );


                            listaPendientes.appendChild(
                                item
                            );

                        }
                    );

                }
            );


            if (!hayPendientes) {

                listaPendientes.innerHTML = `
                    <div class="sin-recomendaciones">
                        <span>✅</span>
                        <p>No hay recomendaciones pendientes de validación.</p>
                    </div>
                `;
            }
        }


        /* =============================================
           SOLICITUDES DE CANJE
        ============================================= */

        const listaCanjesAdmin =
            document.getElementById(
                "listaCanjesAdmin"
            );


        if (listaCanjesAdmin) {

            listaCanjesAdmin.innerHTML =
                "";


            if (
                canjes.length ===
                0
            ) {

                listaCanjesAdmin.innerHTML = `
                    <div class="sin-recomendaciones">
                        <span>🎁</span>
                        <p>No hay solicitudes de canje registradas.</p>
                    </div>
                `;

            } else {

                const canjesOrdenados =
                    canjes
                        .slice()
                        .reverse();


                canjesOrdenados.forEach(
                    (canje) => {

                        const estudiante =
                            estudiantes.find(
                                (e) =>
                                    e.id ===
                                    canje.estudianteId
                            );


                        const item =
                            document.createElement(
                                "div"
                            );


                        item.className =
                            "dato";


                        item.style.display =
                            "flex";

                        item.style.alignItems =
                            "center";

                        item.style.justifyContent =
                            "space-between";

                        item.style.gap =
                            "15px";


                        const nombreEstudiante =
                            estudiante
                                ? `${estudiante.nombre || ""} ${estudiante.apellido || ""}`
                                : "Estudiante no encontrado";


                        let estadoTexto =
                            "⏳ Pendiente";


                        if (
                            canje.estado ===
                            "aprobado"
                        ) {

                            estadoTexto =
                                "✅ Aprobado";

                        } else if (
                            canje.estado ===
                            "rechazado"
                        ) {

                            estadoTexto =
                                "❌ Rechazado";
                        }


                        const fechaSolicitud =
                            formatearFecha(
                                canje.fechaSolicitud
                            );


                        const fechaResolucion =
                            canje.fechaResolucion
                                ? formatearFecha(
                                    canje.fechaResolucion
                                  )
                                : "";


                        item.innerHTML = `
                            <span>
                                <strong>
                                    🎁 ${canje.premio || "Premio"}
                                </strong>

                                <br>

                                👤 ${nombreEstudiante}

                                <br>

                                <small>
                                    🏫 ${
                                        estudiante
                                            ? estudiante.escuela || "-"
                                            : "-"
                                    }
                                </small>

                                <br>

                                <small>
                                    ⭐ ${Number(canje.puntos || 0)} puntos
                                    · Solicitud: ${fechaSolicitud}
                                </small>

                                ${
                                    fechaResolucion
                                        ? `
                                            <br>
                                            <small>
                                                Resolución: ${fechaResolucion}
                                            </small>
                                          `
                                        : ""
                                }
                            </span>

                            <span>
                                <strong>
                                    ${estadoTexto}
                                </strong>
                            </span>
                        `;


                        /* =================================
                           BOTONES SOLO SI ESTÁ PENDIENTE
                        ================================= */

                        if (
                            canje.estado ===
                            "pendiente"
                        ) {

                            const contenedorBotones =
                                document.createElement(
                                    "div"
                                );


                            contenedorBotones.style.display =
                                "flex";

                            contenedorBotones.style.flexDirection =
                                "column";

                            contenedorBotones.style.gap =
                                "6px";


                            const aprobar =
                                document.createElement(
                                    "button"
                                );


                            aprobar.type =
                                "button";

                            aprobar.textContent =
                                "✅ Aprobar";

                            aprobar.className =
                                "btn btn-principal";


                            aprobar.style.width =
                                "auto";

                            aprobar.style.padding =
                                "8px 12px";

                            aprobar.style.fontSize =
                                "13px";


                            aprobar.addEventListener(
                                "click",
                                () => {

                                    aprobarCanje(
                                        canje.id
                                    );

                                }
                            );


                            const rechazar =
                                document.createElement(
                                    "button"
                                );


                            rechazar.type =
                                "button";

                            rechazar.textContent =
                                "❌ Rechazar";

                            rechazar.className =
                                "btn btn-cerrar";


                            rechazar.style.width =
                                "auto";

                            rechazar.style.padding =
                                "8px 12px";

                            rechazar.style.fontSize =
                                "13px";


                            rechazar.addEventListener(
                                "click",
                                () => {

                                    rechazarCanje(
                                        canje.id
                                    );

                                }
                            );


                            contenedorBotones.appendChild(
                                aprobar
                            );

                            contenedorBotones.appendChild(
                                rechazar
                            );


                            item.appendChild(
                                contenedorBotones
                            );

                        }


                        listaCanjesAdmin.appendChild(
                            item
                        );

                    }
                );
            }
        }


        /* =============================================
           LISTA DE ESTUDIANTES
        ============================================= */

        listaEstudiantesAdmin.innerHTML =
            "";


        if (
            estudiantes.length ===
            0
        ) {

            listaEstudiantesAdmin.innerHTML = `
                <div class="sin-recomendaciones">
                    <span>👥</span>
                    <p>Todavía no hay estudiantes registrados.</p>
                </div>
            `;

        } else {

            estudiantes
                .slice()
                .reverse()
                .forEach(
                    (estudiante) => {

                        const item =
                            document.createElement(
                                "div"
                            );


                        item.className =
                            "dato";


                        const recomendaciones =
                            Array.isArray(
                                estudiante.recomendaciones
                            )
                                ? estudiante.recomendaciones
                                : [];


                        const validadas =
                            recomendaciones.filter(
                                (r) =>
                                    r.estado ===
                                    "validada"
                            ).length;


                        const pendientes =
                            recomendaciones.filter(
                                (r) =>
                                    r.estado ===
                                    "pendiente"
                            ).length;


                        const puntosDisponibles =
                            obtenerPuntosDisponibles(
                                estudiante
                            );


                        const puntosComprometidos =
                            obtenerPuntosComprometidos(
                                estudiante.id
                            );


                        item.innerHTML = `
                            <span>
                                <strong>
                                    ${estudiante.nombre || ""}
                                    ${estudiante.apellido || ""}
                                </strong>

                                <br>

                                ${estudiante.email || "-"}

                                <br>

                                <small>
                                    ${estudiante.escuela || "-"}
                                    · Curso ${estudiante.curso || "-"}
                                    · División ${estudiante.division || "-"}
                                </small>

                                <br>

                                <small>
                                    🎁 ${obtenerCanjesPorEstudiante(estudiante.id).length}
                                    canjes registrados
                                </small>
                            </span>

                            <strong>
                                ${estudiante.puntos || 0} puntos
                                <br>

                                <small>
                                    Disponibles: ${puntosDisponibles}
                                </small>

                                <br>

                                <small>
                                    Comprometidos: ${puntosComprometidos}
                                </small>

                                <br>

                                <small>
                                    ${validadas} validadas
                                    · ${pendientes} pendientes
                                </small>
                            </strong>
                        `;


                        listaEstudiantesAdmin.appendChild(
                            item
                        );

                    }
                );
        }
    }


    /* =================================================
       VALIDAR RECOMENDACIÓN
    ================================================= */

    function validarRecomendacion(
        estudianteId,
        recomendacionId
    ) {

        const estudiantes =
            obtenerEstudiantes();


        const estudiante =
            estudiantes.find(
                (e) =>
                    e.id ===
                    estudianteId
            );


        if (!estudiante) {

            alert(
                "No se encontró el estudiante."
            );

            return;
        }


        if (
            !Array.isArray(
                estudiante.recomendaciones
            )
        ) {

            alert(
                "El estudiante no tiene recomendaciones registradas."
            );

            return;
        }


        const recomendacion =
            estudiante.recomendaciones.find(
                (r) =>
                    r.id ===
                    recomendacionId
            );


        if (!recomendacion) {

            alert(
                "No se encontró la recomendación."
            );

            return;
        }


        if (
            recomendacion.estado ===
            "validada"
        ) {

            alert(
                "Esta recomendación ya fue validada."
            );

            return;
        }


        const puntosAOtorgar =
            calcularPuntosPorInteres(
                recomendacion.interes
            );


        const confirmar =
            confirm(
                `¿Confirmás la validación de la recomendación de ${recomendacion.nombreInteresado || "esta persona"}?\n\nTipo: ${recomendacion.interes || "No especificado"}\nSe otorgarán ${puntosAOtorgar} punto(s) al estudiante.`
            );


        if (!confirmar) {

            return;
        }


        recomendacion.estado =
            "validada";


        recomendacion.puntosOtorgados =
            puntosAOtorgar;


        recomendacion.fechaValidacion =
            new Date().toISOString();


        estudiante.puntos =
            Number(
                estudiante.puntos || 0
            ) +
            puntosAOtorgar;


        guardarEstudianteActualizado(
            estudiante
        );


        renderizarPanelAdmin();


        alert(
            `¡Recomendación validada correctamente!\n\nSe otorgaron ${puntosAOtorgar} punto(s) a ${estudiante.nombre || "el estudiante"}.`
        );
    }


    /* =================================================
       APROBAR CANJE
    ================================================= */

    function aprobarCanje(
        canjeId
    ) {

        const canjes =
            obtenerCanjes();


        const canje =
            canjes.find(
                (c) =>
                    c.id ===
                    canjeId
            );


        if (!canje) {

            alert(
                "No se encontró la solicitud de canje."
            );

            return;
        }


        /* =============================================
           EVITAR DOBLE APROBACIÓN
        ============================================= */

        if (
            canje.estado !==
            "pendiente"
        ) {

            alert(
                "Esta solicitud ya fue procesada."
            );

            return;
        }


        const estudiantes =
            obtenerEstudiantes();


        const estudiante =
            estudiantes.find(
                (e) =>
                    e.id ===
                    canje.estudianteId
            );


        if (!estudiante) {

            alert(
                "No se encontró el estudiante asociado al canje."
            );

            return;
        }


        const puntosNecesarios =
            Number(
                canje.puntos || 0
            );


        const puntosActuales =
            Number(
                estudiante.puntos || 0
            );


        /* =============================================
           VERIFICAR SALDO REAL
        ============================================= */

        if (
            puntosActuales <
            puntosNecesarios
        ) {

            alert(
                `No se puede aprobar el canje porque el estudiante ya no tiene suficientes puntos.\n\nPuntos actuales: ${puntosActuales}\nPuntos necesarios: ${puntosNecesarios}`
            );

            return;
        }


        const confirmar =
            confirm(
                `¿Confirmás la aprobación del canje?\n\nEstudiante: ${estudiante.nombre || ""} ${estudiante.apellido || ""}\nPremio: ${canje.premio}\nPuntos a descontar: ${puntosNecesarios}\n\nEsta acción descontará los puntos definitivamente.`
            );


        if (!confirmar) {

            return;
        }


        /* =============================================
           DESCONTAR PUNTOS
        ============================================= */

        estudiante.puntos =
            puntosActuales -
            puntosNecesarios;


        canje.estado =
            "aprobado";


        canje.fechaResolucion =
            new Date().toISOString();


        /* =============================================
           GUARDAR
        ============================================= */

        const indiceEstudiante =
            estudiantes.findIndex(
                (e) =>
                    e.id ===
                    estudiante.id
            );


        if (
            indiceEstudiante !==
            -1
        ) {

            estudiantes[
                indiceEstudiante
            ] = estudiante;

            guardarEstudiantes(
                estudiantes
            );
        }


        guardarCanjes(
            canjes
        );


        renderizarPanelAdmin();


        alert(
            `¡Canje aprobado correctamente!\n\nSe descontaron ${puntosNecesarios} puntos a ${estudiante.nombre || "el estudiante"}.`
        );
    }


    /* =================================================
       RECHAZAR CANJE
    ================================================= */

    function rechazarCanje(
        canjeId
    ) {

        const canjes =
            obtenerCanjes();


        const canje =
            canjes.find(
                (c) =>
                    c.id ===
                    canjeId
            );


        if (!canje) {

            alert(
                "No se encontró la solicitud de canje."
            );

            return;
        }


        if (
            canje.estado !==
            "pendiente"
        ) {

            alert(
                "Esta solicitud ya fue procesada."
            );

            return;
        }


        const estudiantes =
            obtenerEstudiantes();


        const estudiante =
            estudiantes.find(
                (e) =>
                    e.id ===
                    canje.estudianteId
            );


        const nombre =
            estudiante
                ? `${estudiante.nombre || ""} ${estudiante.apellido || ""}`
                : "el estudiante";


        const confirmar =
            confirm(
                `¿Querés rechazar el canje de ${nombre}?\n\nPremio: ${canje.premio}\n\nNo se descontarán puntos.`
            );


        if (!confirmar) {

            return;
        }


        canje.estado =
            "rechazado";


        canje.fechaResolucion =
            new Date().toISOString();


        guardarCanjes(
            canjes
        );


        renderizarPanelAdmin();


        alert(
            "La solicitud de canje fue rechazada. Los puntos permanecen disponibles."
        );
    }


    /* =================================================
       PRIMERA CARGA DEL PANEL
    ================================================= */

    renderizarPanelAdmin();
}

}

/* =========================================================
CERRAR SESIÓN — ADMIN
========================================================= */

const cerrarSesionAdmin =
document.getElementById(
"cerrarSesionAdmin"
);

if (cerrarSesionAdmin) {

cerrarSesionAdmin.addEventListener(
    "click",
    () => {

        localStorage.removeItem(
            "sesionAdmin"
        );

        window.location.href =
            "login.html";

    }
);

}

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "admin@educandoconciencia.com.ar").trim().toLowerCase();
const ADMIN_INITIAL_PASSWORD = process.env.ADMIN_INITIAL_PASSWORD;

if (!JWT_SECRET) {
    console.error("Falta JWT_SECRET en las variables de entorno.");
    process.exit(1);
}
if (!process.env.DATABASE_URL) {
    console.error("Falta DATABASE_URL en las variables de entorno.");
    process.exit(1);
}
if (!ADMIN_INITIAL_PASSWORD || ADMIN_INITIAL_PASSWORD.length < 8) {
    console.error("ADMIN_INITIAL_PASSWORD debe existir y tener al menos 8 caracteres.");
    process.exit(1);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

const FRONTEND_URL = (process.env.FRONTEND_URL || "").trim().replace(/\/$/, "");
app.use(cors({
    origin: (origin, callback) => {
        // Requests without Origin (curl/health checks) are allowed.
        if (!origin || !FRONTEND_URL || origin === FRONTEND_URL) return callback(null, true);
        return callback(new Error("Origen no permitido por CORS."));
    },
    credentials: false,
}));
app.use(express.json({ limit: "1mb" }));

const PUNTOS_POR_DONACION = 1;
const PUNTOS_POR_COMPRA = 10;

function calcularPuntosPorInteres(interes) {
    const texto = String(interes || "").toLowerCase();
    if (texto.includes("compra") && texto.includes("donación")) {
        return { puntosCompra: 10, puntosDonacion: 1, puntosTotales: 11 };
    }
    if (texto.includes("compra")) {
        return { puntosCompra: 10, puntosDonacion: 0, puntosTotales: 10 };
    }
    return { puntosCompra: 0, puntosDonacion: 1, puntosTotales: 1 };
}

function signToken(user) {
    return jwt.sign(
        { sub: user.id, role: user.role, email: user.email },
        JWT_SECRET,
        { expiresIn: "7d" }
    );
}

function auth(requiredRole = null) {
    return (req, res, next) => {
        try {
            const header = req.headers.authorization || "";
            const token = header.startsWith("Bearer ") ? header.slice(7) : null;
            if (!token) return res.status(401).json({ error: "No autenticado." });
            const payload = jwt.verify(token, JWT_SECRET);
            if (requiredRole && payload.role !== requiredRole) {
                return res.status(403).json({ error: "No tenés permisos para realizar esta acción." });
            }
            req.user = payload;
            next();
        } catch {
            return res.status(401).json({ error: "Sesión inválida o vencida." });
        }
    };
}

async function initDb() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id BIGSERIAL PRIMARY KEY,
            role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'admin')),
            nombre VARCHAR(100),
            apellido VARCHAR(100),
            email VARCHAR(255) NOT NULL UNIQUE,
            telefono VARCHAR(80),
            escuela VARCHAR(255),
            curso VARCHAR(100),
            division VARCHAR(100),
            password_hash TEXT NOT NULL,
            puntos_compra INTEGER NOT NULL DEFAULT 0,
            puntos_donacion INTEGER NOT NULL DEFAULT 0,
            puntos_totales INTEGER NOT NULL DEFAULT 0,
            password_changed BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS recommendations (
            id BIGSERIAL PRIMARY KEY,
            student_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            nombre_interesado VARCHAR(100) NOT NULL,
            apellido_interesado VARCHAR(100) NOT NULL,
            telefono_interesado VARCHAR(80) NOT NULL,
            email_interesado VARCHAR(255),
            interes VARCHAR(100) NOT NULL,
            observaciones TEXT,
            estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'validada', 'rechazada')),
            puntos_compra INTEGER NOT NULL DEFAULT 0,
            puntos_donacion INTEGER NOT NULL DEFAULT 0,
            puntos_totales INTEGER NOT NULL DEFAULT 0,
            fecha_validacion TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_recommendations_student ON recommendations(student_id);
        CREATE INDEX IF NOT EXISTS idx_recommendations_status ON recommendations(estado);

        CREATE TABLE IF NOT EXISTS redemptions (
            id BIGSERIAL PRIMARY KEY,
            student_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            premio VARCHAR(255) NOT NULL,
            puntos INTEGER NOT NULL CHECK (puntos > 0),
            estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobado', 'rechazado')),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            resolved_at TIMESTAMPTZ
        );

        CREATE INDEX IF NOT EXISTS idx_redemptions_student ON redemptions(student_id);
        CREATE INDEX IF NOT EXISTS idx_redemptions_status ON redemptions(estado);
    `);

    const existing = await pool.query("SELECT id FROM users WHERE email = $1 LIMIT 1", [ADMIN_EMAIL]);
    if (existing.rowCount === 0) {
        const hash = await bcrypt.hash(ADMIN_INITIAL_PASSWORD, 12);
        await pool.query(
            `INSERT INTO users (role, email, password_hash, password_changed) VALUES ('admin', $1, $2, FALSE)`,
            [ADMIN_EMAIL, hash]
        );
        console.log(`Administrador inicial creado: ${ADMIN_EMAIL}`);
    }
}

function studentPublic(row, recommendations = [], redemptions = []) {
    const puntosCompra = Number(row.puntos_compra || 0);
    const puntosDonacion = Number(row.puntos_donacion || 0);
    const puntosTotales = Number(row.puntos_totales || puntosCompra + puntosDonacion);
    const comprometidos = redemptions
        .filter((r) => r.estado === "pendiente")
        .reduce((sum, r) => sum + Number(r.puntos || 0), 0);

    return {
        id: String(row.id),
        nombre: row.nombre,
        apellido: row.apellido,
        email: row.email,
        telefono: row.telefono,
        escuela: row.escuela,
        curso: row.curso,
        division: row.division,
        puntos: puntosTotales,
        puntosCompra,
        puntosDonacion,
        puntosDisponibles: Math.max(0, puntosTotales - comprometidos),
        puntosComprometidos: comprometidos,
        recomendaciones: recommendations,
        canjes: redemptions,
        fechaRegistro: row.created_at,
    };
}

async function getStudentData(id) {
    const student = await pool.query("SELECT * FROM users WHERE id = $1 AND role = 'student'", [id]);
    if (!student.rowCount) return null;
    const recs = await pool.query(
        `SELECT id::text AS id, nombre_interesado AS "nombreInteresado", apellido_interesado AS "apellidoInteresado",
                telefono_interesado AS "telefonoInteresado", email_interesado AS "emailInteresado", interes,
                observaciones, estado, puntos_compra AS "puntosCompraOtorgados", puntos_donacion AS "puntosDonacionOtorgados",
                puntos_totales AS "puntosOtorgados", created_at AS fecha, fecha_validacion AS "fechaValidacion"
         FROM recommendations WHERE student_id = $1 ORDER BY created_at DESC`, [id]
    );
    const red = await pool.query(
        `SELECT id::text AS id, premio, puntos, estado, created_at AS fecha, resolved_at AS "fechaResolucion"
         FROM redemptions WHERE student_id = $1 ORDER BY created_at DESC`, [id]
    );
    return studentPublic(student.rows[0], recs.rows, red.rows);
}

app.get("/api", (req, res) => {
    res.json({ ok: true, mensaje: "Backend de Plan Canje Educativo funcionando 🚀" });
});

app.get("/health", async (req, res) => {
    try {
        await pool.query("SELECT 1");
        res.json({ ok: true, database: "connected" });
    } catch (error) {
        console.error("Health check DB:", error);
        res.status(503).json({ ok: false, database: "unavailable" });
    }
});

app.post("/api/auth/register", async (req, res) => {
    try {
        const { nombre, apellido, email, telefono, escuela, curso, division, password } = req.body || {};
        if (![nombre, apellido, email, telefono, escuela, curso, division, password].every(Boolean)) {
            return res.status(400).json({ error: "Completá todos los campos obligatorios." });
        }
        if (String(password).length < 8) return res.status(400).json({ error: "La contraseña debe tener al menos 8 caracteres." });
        const normalizedEmail = String(email).trim().toLowerCase();
        const hash = await bcrypt.hash(String(password), 12);
        const result = await pool.query(
            `INSERT INTO users (role, nombre, apellido, email, telefono, escuela, curso, division, password_hash)
             VALUES ('student',$1,$2,$3,$4,$5,$6,$7,$8)
             RETURNING id`,
            [String(nombre).trim(), String(apellido).trim(), normalizedEmail, String(telefono).trim(), String(escuela).trim(), String(curso), String(division), hash]
        );
        res.status(201).json({ ok: true, id: String(result.rows[0].id), mensaje: "Cuenta creada correctamente." });
    } catch (error) {
        if (error.code === "23505") return res.status(409).json({ error: "Ya existe una cuenta registrada con ese correo." });
        console.error(error);
        res.status(500).json({ error: "No se pudo crear la cuenta." });
    }
});

app.post("/api/auth/login", async (req, res) => {
    try {
        const email = String(req.body?.email || "").trim().toLowerCase();
        const password = String(req.body?.password || "");
        const result = await pool.query("SELECT * FROM users WHERE email = $1 LIMIT 1", [email]);
        if (!result.rowCount) return res.status(401).json({ error: "El correo o la contraseña son incorrectos." });
        const user = result.rows[0];
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) return res.status(401).json({ error: "El correo o la contraseña son incorrectos." });
        const token = signToken(user);
        const data = user.role === "student" ? await getStudentData(user.id) : {
            id: String(user.id), email: user.email, role: user.role, passwordChanged: user.password_changed,
        };
        res.json({ ok: true, token, user: data, role: user.role, passwordChanged: user.password_changed });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "No se pudo iniciar sesión." });
    }
});

app.get("/api/auth/me", auth(), async (req, res) => {
    try {
        if (req.user.role === "student") {
            const data = await getStudentData(req.user.sub);
            if (!data) return res.status(404).json({ error: "Cuenta no encontrada." });
            return res.json({ user: data, role: "student" });
        }
        const result = await pool.query("SELECT id::text AS id, email, role, password_changed AS \"passwordChanged\" FROM users WHERE id = $1", [req.user.sub]);
        if (!result.rowCount) return res.status(404).json({ error: "Administrador no encontrado." });
        res.json({ user: result.rows[0], role: "admin" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "No se pudo recuperar la sesión." });
    }
});

app.post("/api/auth/admin/change-password", auth("admin"), async (req, res) => {
    try {
        const password = String(req.body?.password || "");
        if (password.length < 8) return res.status(400).json({ error: "La contraseña debe tener al menos 8 caracteres." });
        const hash = await bcrypt.hash(password, 12);
        await pool.query("UPDATE users SET password_hash = $1, password_changed = TRUE WHERE id = $2 AND role = 'admin'", [hash, req.user.sub]);
        res.json({ ok: true, mensaje: "Contraseña actualizada correctamente." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "No se pudo cambiar la contraseña." });
    }
});

app.get("/api/student/me", auth("student"), async (req, res) => {
    const data = await getStudentData(req.user.sub);
    if (!data) return res.status(404).json({ error: "Cuenta no encontrada." });
    res.json({ student: data });
});

app.post("/api/student/recommendations", auth("student"), async (req, res) => {
    try {
        const { nombreInteresado, apellidoInteresado, telefonoInteresado, emailInteresado, interes, observaciones } = req.body || {};
        if (![nombreInteresado, apellidoInteresado, telefonoInteresado, interes].every(Boolean)) {
            return res.status(400).json({ error: "Completá los campos obligatorios." });
        }
        const duplicate = await pool.query(
            `SELECT id FROM recommendations WHERE student_id = $1 AND (telefono_interesado = $2 OR ($3 <> '' AND LOWER(COALESCE(email_interesado,'')) = LOWER($3))) LIMIT 1`,
            [req.user.sub, String(telefonoInteresado).trim(), String(emailInteresado || "").trim()]
        );
        if (duplicate.rowCount) return res.status(409).json({ error: "Ya existe una recomendación registrada con esos datos." });
        const result = await pool.query(
            `INSERT INTO recommendations (student_id,nombre_interesado,apellido_interesado,telefono_interesado,email_interesado,interes,observaciones)
             VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id::text AS id`,
            [req.user.sub, String(nombreInteresado).trim(), String(apellidoInteresado).trim(), String(telefonoInteresado).trim(), String(emailInteresado || "").trim() || null, String(interes), String(observaciones || "").trim()]
        );
        res.status(201).json({ ok: true, id: result.rows[0].id, mensaje: "Recomendación registrada correctamente." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "No se pudo registrar la recomendación." });
    }
});

app.post("/api/student/redemptions", auth("student"), async (req, res) => {
    const client = await pool.connect();
    try {
        const premio = String(req.body?.premio || "").trim();
        const puntos = Number(req.body?.puntos || 0);
        if (!premio || !Number.isInteger(puntos) || puntos <= 0) return res.status(400).json({ error: "Solicitud de canje inválida." });
        await client.query("BEGIN");
        const student = await client.query("SELECT * FROM users WHERE id = $1 AND role = 'student' FOR UPDATE", [req.user.sub]);
        if (!student.rowCount) throw new Error("student_not_found");
        const pending = await client.query("SELECT COALESCE(SUM(puntos),0) AS total FROM redemptions WHERE student_id = $1 AND estado = 'pendiente'", [req.user.sub]);
        const total = Number(student.rows[0].puntos_totales || 0);
        const comprometidos = Number(pending.rows[0].total || 0);
        const disponibles = total - comprometidos;
        if (premio.toLowerCase().includes("efectivo") && Number(student.rows[0].puntos_compra || 0) < puntos) {
            await client.query("ROLLBACK");
            return res.status(400).json({ error: "El premio en efectivo requiere suficientes puntos de compra." });
        }
        if (disponibles < puntos) {
            await client.query("ROLLBACK");
            return res.status(400).json({ error: `No tenés suficientes puntos disponibles. Disponibles: ${Math.max(0, disponibles)}.` });
        }
        const result = await client.query(
            `INSERT INTO redemptions (student_id,premio,puntos) VALUES ($1,$2,$3) RETURNING id::text AS id`,
            [req.user.sub, premio, puntos]
        );
        await client.query("COMMIT");
        res.status(201).json({ ok: true, id: result.rows[0].id, mensaje: "Solicitud de canje registrada correctamente." });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error(error);
        res.status(500).json({ error: "No se pudo registrar el canje." });
    } finally { client.release(); }
});

app.get("/api/admin/dashboard", auth("admin"), async (req, res) => {
    try {
        const [students, pending, points, redPending, redApproved, recommendations, redemptions] = await Promise.all([
            pool.query("SELECT id::text AS id, nombre, apellido, email, telefono, escuela, curso, division, puntos_compra AS \"puntosCompra\", puntos_donacion AS \"puntosDonacion\", puntos_totales AS puntos, created_at AS \"fechaRegistro\" FROM users WHERE role='student' ORDER BY created_at DESC"),
            pool.query("SELECT COUNT(*)::int AS count FROM recommendations WHERE estado='pendiente'"),
            pool.query("SELECT COALESCE(SUM(puntos_totales),0)::int AS total FROM users WHERE role='student'"),
            pool.query("SELECT COUNT(*)::int AS count FROM redemptions WHERE estado='pendiente'"),
            pool.query("SELECT COUNT(*)::int AS count FROM redemptions WHERE estado='aprobado'"),
            pool.query(`SELECT r.id::text AS id, r.student_id::text AS "estudianteId", r.nombre_interesado AS "nombreInteresado", r.apellido_interesado AS "apellidoInteresado", r.telefono_interesado AS "telefonoInteresado", r.email_interesado AS "emailInteresado", r.interes, r.observaciones, r.estado, r.puntos_compra AS "puntosCompraOtorgados", r.puntos_donacion AS "puntosDonacionOtorgados", r.puntos_totales AS "puntosOtorgados", r.created_at AS fecha, u.nombre AS "nombreEstudiante", u.apellido AS "apellidoEstudiante" FROM recommendations r JOIN users u ON u.id=r.student_id ORDER BY r.created_at DESC`),
            pool.query(`SELECT c.id::text AS id, c.student_id::text AS "estudianteId", c.premio, c.puntos, c.estado, c.created_at AS fecha, c.resolved_at AS "fechaResolucion", u.nombre AS "nombreEstudiante", u.apellido AS "apellidoEstudiante" FROM redemptions c JOIN users u ON u.id=c.student_id ORDER BY c.created_at DESC`),
        ]);
        res.json({
            estudiantes: students.rows,
            recomendaciones: recommendations.rows,
            canjes: redemptions.rows,
            estadisticas: {
                totalEstudiantes: students.rowCount,
                totalPendientes: pending.rows[0].count,
                totalPuntosOtorgados: points.rows[0].total,
                totalCanjesPendientes: redPending.rows[0].count,
                totalCanjesAprobados: redApproved.rows[0].count,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "No se pudo cargar el panel administrativo." });
    }
});

app.post("/api/admin/recommendations/:id/validate", auth("admin"), async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const rec = await client.query("SELECT * FROM recommendations WHERE id = $1 FOR UPDATE", [req.params.id]);
        if (!rec.rowCount) { await client.query("ROLLBACK"); return res.status(404).json({ error: "No se encontró la recomendación." }); }
        if (rec.rows[0].estado !== "pendiente") { await client.query("ROLLBACK"); return res.status(400).json({ error: "Esta recomendación ya fue procesada." }); }
        const puntos = calcularPuntosPorInteres(rec.rows[0].interes);
        await client.query(`UPDATE recommendations SET estado='validada', puntos_compra=$1, puntos_donacion=$2, puntos_totales=$3, fecha_validacion=NOW() WHERE id=$4`, [puntos.puntosCompra, puntos.puntosDonacion, puntos.puntosTotales, req.params.id]);
        await client.query(`UPDATE users SET puntos_compra=puntos_compra+$1, puntos_donacion=puntos_donacion+$2, puntos_totales=puntos_totales+$3 WHERE id=$4`, [puntos.puntosCompra, puntos.puntosDonacion, puntos.puntosTotales, rec.rows[0].student_id]);
        await client.query("COMMIT");
        res.json({ ok: true, puntos });
    } catch (error) { await client.query("ROLLBACK"); console.error(error); res.status(500).json({ error: "No se pudo validar la recomendación." }); }
    finally { client.release(); }
});

app.post("/api/admin/recommendations/:id/reject", auth("admin"), async (req, res) => {
    try {
        const result = await pool.query("UPDATE recommendations SET estado='rechazada' WHERE id=$1 AND estado='pendiente' RETURNING id", [req.params.id]);
        if (!result.rowCount) return res.status(400).json({ error: "La recomendación no existe o ya fue procesada." });
        res.json({ ok: true });
    } catch (error) { console.error(error); res.status(500).json({ error: "No se pudo rechazar la recomendación." }); }
});

app.post("/api/admin/redemptions/:id/approve", auth("admin"), async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const redemption = await client.query("SELECT * FROM redemptions WHERE id=$1 FOR UPDATE", [req.params.id]);
        if (!redemption.rowCount) { await client.query("ROLLBACK"); return res.status(404).json({ error: "No se encontró el canje." }); }
        const c = redemption.rows[0];
        if (c.estado !== "pendiente") { await client.query("ROLLBACK"); return res.status(400).json({ error: "Esta solicitud ya fue procesada." }); }
        const student = await client.query("SELECT * FROM users WHERE id=$1 FOR UPDATE", [c.student_id]);
        if (!student.rowCount) { await client.query("ROLLBACK"); return res.status(404).json({ error: "No se encontró el estudiante." }); }
        const available = Number(student.rows[0].puntos_totales || 0) - Number((await client.query("SELECT COALESCE(SUM(puntos),0) AS total FROM redemptions WHERE student_id=$1 AND estado='pendiente' AND id<>$2", [c.student_id, c.id])).rows[0].total || 0);
        if (available < Number(c.puntos)) { await client.query("ROLLBACK"); return res.status(400).json({ error: `El estudiante ya no tiene suficientes puntos. Disponibles: ${Math.max(0, available)}.` }); }
        if (String(c.premio).toLowerCase().includes("efectivo") && Number(student.rows[0].puntos_compra || 0) < Number(c.puntos)) { await client.query("ROLLBACK"); return res.status(400).json({ error: "El premio en efectivo requiere suficientes puntos de compra." }); }
        if (String(c.premio).toLowerCase().includes("efectivo")) {
            await client.query("UPDATE users SET puntos_compra=puntos_compra-$1, puntos_totales=puntos_totales-$1 WHERE id=$2", [c.puntos, c.student_id]);
        } else {
            // Para premios generales se descuentan los puntos totales.
            // Priorizamos primero los puntos de donación y luego los de compra para mantener saldos coherentes.
            const donationUsed = Math.min(Number(student.rows[0].puntos_donacion || 0), Number(c.puntos));
            const purchaseUsed = Number(c.puntos) - donationUsed;
            await client.query("UPDATE users SET puntos_donacion=puntos_donacion-$1, puntos_compra=puntos_compra-$2, puntos_totales=puntos_totales-$3 WHERE id=$4", [donationUsed, purchaseUsed, c.puntos, c.student_id]);
        }
        await client.query("UPDATE redemptions SET estado='aprobado', resolved_at=NOW() WHERE id=$1", [c.id]);
        await client.query("COMMIT");
        res.json({ ok: true });
    } catch (error) { await client.query("ROLLBACK"); console.error(error); res.status(500).json({ error: "No se pudo aprobar el canje." }); }
    finally { client.release(); }
});

app.post("/api/admin/redemptions/:id/reject", auth("admin"), async (req, res) => {
    try {
        const result = await pool.query("UPDATE redemptions SET estado='rechazado', resolved_at=NOW() WHERE id=$1 AND estado='pendiente' RETURNING id", [req.params.id]);
        if (!result.rowCount) return res.status(400).json({ error: "La solicitud no existe o ya fue procesada." });
        res.json({ ok: true });
    } catch (error) { console.error(error); res.status(500).json({ error: "No se pudo rechazar el canje." }); }
});

// El frontend se publica por separado en Netlify. Render expone solamente la API.

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: "Error interno del servidor." });
});

initDb()
    .then(() => {
        app.listen(PORT, "0.0.0.0", () => {
            console.log(`🚀 Plan Canje Educativo disponible en el puerto ${PORT}`);
        });
    })
    .catch((error) => {
        console.error("No se pudo inicializar la base de datos:", error);
        process.exit(1);
    });

const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// ===============================
// MIDDLEWARE
// ===============================

app.use(cors());
app.use(express.json());

// ===============================
// RUTA DE PRUEBA
// ===============================

app.get("/api", (req, res) => {
    res.json({
        ok: true,
        mensaje: "Backend de Plan Canje Educativo funcionando 🚀"
    });
});

// ===============================
// SERVIDOR
// ===============================

app.listen(PORT, () => {
    console.log(`🚀 Backend ejecutándose en http://localhost:${PORT}`);
});
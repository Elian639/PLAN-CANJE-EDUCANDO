/* =========================================================
   HOME.JS
   Animaciones e interacción de index.html
   (No interfiere con js/app.js usado en estudiante/admin)
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* ---------- Barra de carga superior ---------- */
    const barra = document.getElementById("barra-carga");
    if (barra) {
        requestAnimationFrame(() => { barra.style.width = "70%"; });
        window.addEventListener("load", () => {
            barra.style.width = "100%";
            setTimeout(() => { barra.style.opacity = "0"; }, 300);
        });
    }

    /* ---------- Header: efecto al hacer scroll ---------- */
    const header = document.querySelector(".header");
    const alScroll = () => {
        if (!header) return;
        header.classList.toggle("encogido", window.scrollY > 12);
    };
    document.addEventListener("scroll", alScroll, { passive: true });
    alScroll();

    /* ---------- Menú hamburguesa (mobile) ---------- */
    const btnHamburguesa = document.getElementById("btn-hamburguesa");
    const menu = document.getElementById("menu-principal");

    if (btnHamburguesa && menu) {
        btnHamburguesa.addEventListener("click", () => {
            btnHamburguesa.classList.toggle("abierto");
            menu.classList.toggle("abierto");
        });

        menu.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", () => {
                btnHamburguesa.classList.remove("abierto");
                menu.classList.remove("abierto");
            });
        });
    }

    /* ---------- Revelado de elementos al hacer scroll ---------- */
    const elementosReveal = document.querySelectorAll(".reveal, .reveal-stagger");

    if ("IntersectionObserver" in window) {
        const observador = new IntersectionObserver((entradas) => {
            entradas.forEach(entrada => {
                if (entrada.isIntersecting) {
                    entrada.target.classList.add("visible");
                    observador.unobserve(entrada.target);
                }
            });
        }, { threshold: 0.15 });

        elementosReveal.forEach(el => observador.observe(el));

        const barraCanje = document.querySelector(".canje-barra");
        if (barraCanje) {
            const obsBarra = new IntersectionObserver((entradas) => {
                entradas.forEach(entrada => {
                    if (entrada.isIntersecting) {
                        entrada.target.classList.add("animar");
                        obsBarra.unobserve(entrada.target);
                    }
                });
            }, { threshold: 0.4 });
            obsBarra.observe(barraCanje);
        }
    } else {
        elementosReveal.forEach(el => el.classList.add("visible"));
    }

    /* ---------- Botón volver arriba ---------- */
    const btnArriba = document.getElementById("volver-arriba");
    if (btnArriba) {
        document.addEventListener("scroll", () => {
            btnArriba.classList.toggle("visible", window.scrollY > 500);
        }, { passive: true });

        btnArriba.addEventListener("click", () => {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }

    /* ---------- Resaltar sección activa del menú ---------- */
    const secciones = document.querySelectorAll("main section[id]");
    const linksMenu = document.querySelectorAll(".menu a[href^='#']");

    if (secciones.length && linksMenu.length && "IntersectionObserver" in window) {
        const obsSecciones = new IntersectionObserver((entradas) => {
            entradas.forEach(entrada => {
                const id = entrada.target.getAttribute("id");
                const link = document.querySelector(`.menu a[href="#${id}"]`);
                if (!link) return;
                if (entrada.isIntersecting) {
                    linksMenu.forEach(l => l.classList.remove("activo"));
                    link.classList.add("activo");
                }
            });
        }, { rootMargin: "-40% 0px -50% 0px" });

        secciones.forEach(sec => obsSecciones.observe(sec));
    }

});

// ==================================================
// 🔗 CONEXIÓN CON TIENDA — MISMA BASE DE DATOS
// ==================================================
function esImagen(valor){
    return valor.startsWith('http://') || valor.startsWith('https://') || valor.startsWith('/') || valor.includes('.jpg') || valor.includes('.png') || valor.includes('.webp') || valor.includes('.gif');
}

let config = { calibrado:false, mSup:16, mInf:16, mIzq:16, mDer:16, cols:4, filas:6, colorFondo:'#ffffff' };
let orden = [];

function obtenerListaApps(){
    // ✅ ENLACES YA CONFIGURADOS: go:APPeria y go:AJ-Qury
    const appsBase = [
        {id:'ajustes', nombre:'Ajustes', icon:'https://img.icons8.com/?size=100&id=s5NUIabJrb4C&format=png&color=000000', tipo:'enlace', url:'AJ-Qury.html'},
        {id:'tienda', nombre:'Quri Store', icon:'https://img.icons8.com/?size=100&id=FY7tVsFoeON4&format=png&color=000000', tipo:'enlace', url:'APPeria.html'}
    ];

    const appsNuevas = JSON.parse(localStorage.getItem('so_apps_nuevas') || '{}');
    const listaInstaladas = Object.entries(appsNuevas).map(([id, datos]) => ({
        id: id,
        nombre: datos.nombre,
        icon: datos.icono,
        tipo: 'enlace',
        url: datos.ruta
    }));

    return [...appsBase, ...listaInstaladas];
}

let moviendo = null;
let idxOrigen = -1;
let idxDestinoActual = -1;
let timerPresion = null;
const TIEMPO_PRESION = 450;

let inicioPresionX = 0;
let inicioPresionY = 0;
let paginaAntesDeArrastrar = 0;
let ultimaTransicionArrastre = 0;
let paginaTemporalCreada = false;
let bloquearClickHasta = 0;
let eventosGlobalesVinculados = false;

// Aplicaciones que el Escritorio ya conoce. Sirve para detectar
// instalaciones nuevas sin modificar la lógica de la Tienda.
let appsConocidas = new Set();

// ==================================================
// 🔄 SOLUCIÓN AL PROBLEMA: REFRESCAR AL VOLVER
// ==================================================
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && config.calibrado) {
        orden = JSON.parse(localStorage.getItem('so_orden') || '["ajustes","tienda"]');
        reconciliarAplicacionesNuevas();
        renderizarEscritorio();
    }
});

window.onload = () => {
    const c = localStorage.getItem('so_config');
    if(c) config = {...config, ...JSON.parse(c)};

    orden = JSON.parse(localStorage.getItem('so_orden') || '["ajustes","tienda"]');

    obtenerIdsAppsNuevas().forEach(id => appsConocidas.add(id));
    limpiarFinalDeOrden();
    guardarOrden();

    aplicarFondo();

    if(!config.calibrado){
        document.getElementById('panel-calib').classList.add('mostrar');
        document.getElementById('limites').classList.add('mostrar');
        dibujarTodoAlInstante();
        vincularEventosTiempoReal();
    }else{
        iniciarEscritorio();
    }
};

// ==================================================
// 📦 SINCRONIZACIÓN DE NUEVAS INSTALACIONES
// ==================================================
function obtenerIdsAppsNuevas(){
    try{
        const appsNuevas = JSON.parse(localStorage.getItem('so_apps_nuevas') || '{}');
        return Object.keys(appsNuevas);
    }catch(e){
        return [];
    }
}

function limpiarFinalDeOrden(){
    while(orden.length > 0 && !orden[orden.length - 1]){
        orden.pop();
    }
}

function buscarPrimerHuecoLibre(){
    const ultimo = obtenerUltimoIndiceOcupado();
    for(let i = 0; i <= ultimo; i++){
        if(!orden[i]) return i;
    }
    return ultimo + 1;
}

function reconciliarAplicacionesNuevas(){
    const idsActuales = obtenerIdsAppsNuevas();

    if(appsConocidas.size === 0){
        idsActuales.forEach(id => appsConocidas.add(id));
        limpiarFinalDeOrden();
        guardarOrden();
        return;
    }

    const nuevas = idsActuales.filter(id => !appsConocidas.has(id));

    nuevas.forEach(idNuevo => {
        orden = orden.map(id => id === idNuevo ? null : id);
        limpiarFinalDeOrden();

        const destino = buscarPrimerHuecoLibre();
        orden[destino] = idNuevo;

        appsConocidas.add(idNuevo);
    });

    limpiarFinalDeOrden();
    guardarOrden();
}

function guardarConfig(){ localStorage.setItem('so_config', JSON.stringify(config)); }
function guardarOrden(){ localStorage.setItem('so_orden', JSON.stringify(orden)); }

function dibujarTodoAlInstante(){
    document.getElementById('v-sup').textContent = config.mSup + 'px';
    document.getElementById('v-inf').textContent = config.mInf + 'px';
    document.getElementById('v-izq').textContent = config.mIzq + 'px';
    document.getElementById('v-der').textContent = config.mDer + 'px';
    document.getElementById('borde-sup').style.top = config.mSup + 'px';
    document.getElementById('borde-inf').style.bottom = config.mInf + 'px';
    document.getElementById('borde-izq').style.left = config.mIzq + 'px';
    document.getElementById('borde-der').style.right = config.mDer + 'px';
    document.getElementById('cols').value = config.cols;
    document.getElementById('filas').value = config.filas;

    const cont = document.getElementById('grid-lineas');
    cont.innerHTML = '';
    const W = window.innerWidth - config.mIzq - config.mDer;
    const H = window.innerHeight - config.mSup - config.mInf;
    for(let i=1; i<config.cols; i++){
        const l = document.createElement('div');
        l.className = 'linea-col';
        l.style.left = (config.mIzq + (W/config.cols)*i) + 'px';
        l.style.top = config.mSup + 'px';
        l.style.bottom = config.mInf + 'px';
        cont.appendChild(l);
    }
    for(let i=1; i<config.filas; i++){
        const l = document.createElement('div');
        l.className = 'linea-fila';
        l.style.top = (config.mSup + (H/config.filas)*i) + 'px';
        l.style.left = config.mIzq + 'px';
        l.style.right = config.mDer + 'px';
        cont.appendChild(l);
    }
}

function vincularEventosTiempoReal(){
    document.getElementById('m-sup').addEventListener('input', e=>{ config.mSup = +e.target.value; dibujarTodoAlInstante(); });
    document.getElementById('m-inf').addEventListener('input', e=>{ config.mInf = +e.target.value; dibujarTodoAlInstante(); });
    document.getElementById('m-izq').addEventListener('input', e=>{ config.mIzq = +e.target.value; dibujarTodoAlInstante(); });
    document.getElementById('m-der').addEventListener('input', e=>{ config.mDer = +e.target.value; dibujarTodoAlInstante(); });
}

function aplicarCalib(){
    config.mSup = +document.getElementById('m-sup').value;
    config.mInf = +document.getElementById('m-inf').value;
    config.mIzq = +document.getElementById('m-izq').value;
    config.mDer = +document.getElementById('m-der').value;
    config.cols = +document.getElementById('cols').value;
    config.filas = +document.getElementById('filas').value;
    config.calibrado = true;
    guardarConfig();
    document.getElementById('panel-calib').classList.remove('mostrar');
    document.getElementById('limites').classList.remove('mostrar');
    document.getElementById('grid-lineas').innerHTML = '';
    iniciarEscritorio();
}

// ==================================================
// 📄 SISTEMA DE PÁGINAS DINÁMICAS
// ==================================================
function celdasPorPagina(){
    return Math.max(1, Number(config.cols) * Number(config.filas));
}

function obtenerUltimoIndiceOcupado(){
    for(let i = orden.length - 1; i >= 0; i--){
        if(orden[i]) return i;
    }
    return -1;
}

function obtenerNumeroPaginas(){
    const capacidad = celdasPorPagina();
    const ultimo = obtenerUltimoIndiceOcupado();
    return Math.max(1, Math.ceil((ultimo + 1) / capacidad));
}

function obtenerPaginaActual(){
    const escritorio = document.getElementById('escritorio');
    if(!escritorio || !escritorio.clientWidth) return 0;
    return Math.max(0, Math.round(escritorio.scrollLeft / escritorio.clientWidth));
}

function irAPagina(indice, suave = true){
    const escritorio = document.getElementById('escritorio');
    const totalPaginas = escritorio.querySelectorAll('.pagina-escritorio').length;
    if(!totalPaginas) return;

    indice = Math.max(0, Math.min(indice, totalPaginas - 1));
    const izquierda = indice * escritorio.clientWidth;

    if(escritorio.scrollTo){
        escritorio.scrollTo({left: izquierda, top: 0, behavior: suave ? 'smooth' : 'auto'});
    }else{
        escritorio.scrollLeft = izquierda;
    }
    actualizarIndicadorActivo(indice);
}

function crearCelda(indiceGlobal, listaApps){
    const celda = document.createElement('div');
    celda.className = 'celda';
    celda.dataset.i = indiceGlobal;

    const idApp = orden[indiceGlobal];
    if(idApp){
        const app = listaApps.find(a => a.id === idApp);
        if(app){
            const icono = document.createElement('div');
            icono.className = 'app-icon';
            icono.dataset.id = idApp;
            icono.dataset.i = indiceGlobal;

            const iconContent = esImagen(app.icon)
                ? `<img src="${app.icon}" alt="${app.nombre}">`
                : app.icon;

            icono.innerHTML = `<div class="icon">${iconContent}</div><div class="nombre">${app.nombre}</div>`;

            icono.addEventListener('mousedown', e => inicioPresion(e, icono, indiceGlobal));
            icono.addEventListener('touchstart', e => inicioPresion(e, icono, indiceGlobal), {passive:true});
            icono.addEventListener('click', e => {
                if(moviendo || Date.now() < bloquearClickHasta) return;
                e.stopPropagation();
                if(app.tipo === 'enlace') window.location.href = app.url;
                else if(app.tipo === 'mensaje') alert(app.texto);
            });

            celda.appendChild(icono);
        }
    }
    return celda;
}

function crearPaginaDOM(indicePagina, listaApps){
    const pagina = document.createElement('div');
    pagina.className = 'pagina-escritorio';
    pagina.dataset.pagina = indicePagina;
    pagina.style.gridTemplateColumns = `repeat(${config.cols}, 1fr)`;
    pagina.style.gridTemplateRows = `repeat(${config.filas}, 1fr)`;
    pagina.style.padding = `${config.mSup}px ${config.mDer}px ${config.mInf}px ${config.mIzq}px`;

    const capacidad = celdasPorPagina();
    const inicio = indicePagina * capacidad;

    for(let local = 0; local < capacidad; local++){
        pagina.appendChild(crearCelda(inicio + local, listaApps));
    }
    return pagina;
}

function renderizarIndicadores(){
    const escritorio = document.getElementById('escritorio');
    const indicadores = document.getElementById('indicadores-paginas');
    const paginas = escritorio.querySelectorAll('.pagina-escritorio').length;

    indicadores.innerHTML = '';
    indicadores.style.bottom = Math.max(4, Math.floor(config.mInf / 2)) + 'px';

    if(paginas <= 1){
        indicadores.classList.add('oculto');
        return;
    }

    indicadores.classList.remove('oculto');

    for(let i = 0; i < paginas; i++){
        const punto = document.createElement('button');
        punto.className = 'punto-pagina';
        punto.type = 'button';
        punto.setAttribute('aria-label', `Página ${i + 1}`);
        punto.addEventListener('click', () => irAPagina(i, true));
        indicadores.appendChild(punto);
    }

    actualizarIndicadorActivo(obtenerPaginaActual());
}

function actualizarIndicadorActivo(indice){
    const puntos = document.querySelectorAll('.punto-pagina');
    puntos.forEach((punto, i) => punto.classList.toggle('activo', i === indice));
}

function agregarPaginaVisualVacia(){
    const escritorio = document.getElementById('escritorio');
    const listaApps = obtenerListaApps();
    const indice = escritorio.querySelectorAll('.pagina-escritorio').length;

    escritorio.appendChild(crearPaginaDOM(indice, listaApps));
    paginaTemporalCreada = true;
    renderizarIndicadores();
    return indice;
}

function iniciarEscritorio(){
    const escritorio = document.getElementById('escritorio');
    escritorio.style.inset = '0';

    if(!eventosGlobalesVinculados){
        document.addEventListener('mousemove', arrastrandoIcono);
        document.addEventListener('mouseup', soltarIcono);
        document.addEventListener('touchmove', arrastrandoIcono, {passive:false});
        document.addEventListener('touchend', soltarIcono);
        document.addEventListener('touchcancel', soltarIcono);

        escritorio.addEventListener('scroll', () => {
            if(!moviendo) actualizarIndicadorActivo(obtenerPaginaActual());
        }, {passive:true});

        window.addEventListener('resize', () => {
            const actual = obtenerPaginaActual();
            irAPagina(actual, false);
        });

        eventosGlobalesVinculados = true;
    }

    renderizarEscritorio();
}

function renderizarEscritorio(paginaObjetivo = null){
    const escritorio = document.getElementById('escritorio');
    const paginaAnterior = paginaObjetivo === null ? obtenerPaginaActual() : paginaObjetivo;
    const listaApps = obtenerListaApps();
    const paginas = obtenerNumeroPaginas();

    escritorio.innerHTML = '';

    for(let p = 0; p < paginas; p++){
        escritorio.appendChild(crearPaginaDOM(p, listaApps));
    }

    paginaTemporalCreada = false;
    renderizarIndicadores();

    requestAnimationFrame(() => {
        const destino = Math.min(paginaAnterior, paginas - 1);
        irAPagina(destino, false);
    });
}

// ==================================================
// ✋ ARRASTRAR ICONOS ENTRE CELDAS Y ENTRE PÁGINAS
// ==================================================
function obtenerPuntoEvento(e){
    if(e.touches && e.touches.length){
        return {x:e.touches[0].clientX, y:e.touches[0].clientY};
    }
    if(e.changedTouches && e.changedTouches.length){
        return {x:e.changedTouches[0].clientX, y:e.changedTouches[0].clientY};
    }
    return {x:e.clientX, y:e.clientY};
}

function inicioPresion(e, icono, i){
    idxOrigen = i;
    idxDestinoActual = -1;
    paginaTemporalCreada = false;
    paginaAntesDeArrastrar = obtenerPaginaActual();

    const punto = obtenerPuntoEvento(e);
    inicioPresionX = punto.x;
    inicioPresionY = punto.y;

    clearTimeout(timerPresion);
    timerPresion = setTimeout(()=>{
        moviendo = icono;
        icono.classList.add('moviendo');
        icono.style.left = (inicioPresionX - 40) + 'px';
        icono.style.top = (inicioPresionY - 50) + 'px';
    }, TIEMPO_PRESION);
}

function cancelarPresionSiFueDeslizamiento(x, y){
    if(moviendo || !timerPresion) return;
    const dx = Math.abs(x - inicioPresionX);
    const dy = Math.abs(y - inicioPresionY);

    if(dx > 12 || dy > 12){
        clearTimeout(timerPresion);
        timerPresion = null;
    }
}

function manejarBordeDuranteArrastre(x){
    const escritorio = document.getElementById('escritorio');
    const rect = escritorio.getBoundingClientRect();
    const margenBorde = Math.max(28, Math.min(55, escritorio.clientWidth * 0.07));
    const ahora = Date.now();

    if(ahora - ultimaTransicionArrastre < 520) return;

    const paginaActual = obtenerPaginaActual();
    const totalPaginas = escritorio.querySelectorAll('.pagina-escritorio').length;

    if(x >= rect.right - margenBorde){
        let destino = paginaActual + 1;
        if(paginaActual >= totalPaginas - 1){
            destino = agregarPaginaVisualVacia();
        }
        ultimaTransicionArrastre = ahora;
        irAPagina(destino, true);
        return;
    }

    if(x <= rect.left + margenBorde && paginaActual > 0){
        ultimaTransicionArrastre = ahora;
        irAPagina(paginaActual - 1, true);
    }
}

function arrastrandoIcono(e){
    const punto = obtenerPuntoEvento(e);
    const x = punto.x;
    const y = punto.y;

    if(!moviendo){
        cancelarPresionSiFueDeslizamiento(x, y);
        return;
    }

    e.preventDefault();

    moviendo.style.left = (x - 40) + 'px';
    moviendo.style.top = (y - 50) + 'px';

    manejarBordeDuranteArrastre(x);

    const celdaDebajo = document.elementFromPoint(x, y)?.closest('.celda');
    const nuevoIdx = celdaDebajo ? parseInt(celdaDebajo.dataset.i) : -1;

    if(nuevoIdx !== idxDestinoActual){
        document.querySelectorAll('.celda').forEach(c => c.classList.remove('destacada'));
        if(nuevoIdx !== -1) celdaDebajo.classList.add('destacada');
        idxDestinoActual = nuevoIdx;
    }
}

function soltarIcono(e){
    clearTimeout(timerPresion);
    timerPresion = null;

    if(!moviendo) return;

    moviendo.classList.remove('moviendo');
    moviendo.style.left = '';
    moviendo.style.top = '';
    document.querySelectorAll('.celda').forEach(c => c.classList.remove('destacada'));

    const idxDestino = idxDestinoActual;
    const idMoviendo = moviendo.dataset.id;
    const paginaAlSoltar = obtenerPaginaActual();

    moviendo = null;
    idxDestinoActual = -1;
    bloquearClickHasta = Date.now() + 350;

    if(idxDestino === -1 || idxDestino === idxOrigen){
        renderizarEscritorio(idxDestino === idxOrigen ? paginaAlSoltar : paginaAntesDeArrastrar);
        return;
    }

    if(!orden[idxDestino]){
        orden[idxDestino] = idMoviendo;
        orden[idxOrigen] = null;
    } else {
        const temp = orden[idxDestino];
        orden[idxDestino] = idMoviendo;
        orden[idxOrigen] = temp;
    }

    guardarOrden();
    renderizarEscritorio(paginaAlSoltar);
}

function aplicarFondo(){
    document.getElementById('fondo').style.background = config.colorFondo;
    document.body.style.background = config.colorFondo;
}

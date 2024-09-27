const urlDepartamentos = 'https://collectionapi.metmuseum.org/public/collection/v1/departments';
const urlObjeto = 'https://collectionapi.metmuseum.org/public/collection/v1/objects/'; // Para buscar un objeto (Necesita un ID (int))
const urlPaises = 'https://restcountries.com/v3.1/all';

const grilla = document.getElementById('grilla');
let numeroPaginaTexto = document.getElementById('numeroPagina').textContent = '1';
let numeroPaginaValor = parseInt(numeroPaginaTexto);
const cards = new Set();

// BUSCAR   ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------\\
document.getElementById('form').addEventListener('submit', async (evento) => {
    evento.preventDefault();

    const clave = document.getElementById('clave')?.value || 'flowers';
    const departamento = document.getElementById('departamento')?.value;
    const localizacion = document.getElementById('localizacion')?.value;
    document.getElementById('numeroPagina').innerText = '1';
    actualizarFooter();

    let consulta = `https://collectionapi.metmuseum.org/public/collection/v1/search?`;
    if (clave.value && !departamento.value && !localizacion.value) {
        consulta += `q=${clave.value}&hasImages=true`;
    } else if (!clave.value && departamento.value && !localizacion.value) {
        consulta += `q=&hasImages=true&departmentId=${departamento.value}`;
    } else if (!clave.value && !departamento.value && localizacion.value) {
        consulta += `q=&hasImages=true&geoLocation=${localizacion.value}`;
    } else if (clave.value && departamento.value && !localizacion.value) {
        consulta += `q=${clave.value}&hasImages=true&departmentId=${departamento.value}`;
    } else if (!clave.value && departamento.value && localizacion.value) {
        consulta += `q=&hasImages=true&departmentId=${departamento.value}&geoLocation=${localizacion.value}`;
    } else if (clave.value && !departamento.value && localizacion.value) {
        consulta += `q=${clave.value}&hasImages=true&geoLocation=${localizacion.value}`;
    } else if (clave.value && departamento.value && localizacion.value) {
        consulta += `q=${clave.value}&hasImages=true&departmentId=${departamento.value}&geoLocation=${localizacion.value}`;
    } else {
        consulta += `q=&hasImages=true`;
    }
    console.log(consulta);

    await fetch(consulta)
        .then((response) => response.json())
        .then((data) => {
            if (data.objectIDs) mostrarObjetos(data.objectIDs);
            else alert("No se encontraron resultados");
        })
        .catch((error) => { console.log("Error al hacer la consulta en la búsqueda.", error); });
});

// OBTENER OBJETOS ÚTILES ----------------------------------------------------------------------------------------------------------------------------------------------------------------\\
async function obtenerObjetos() {
    await fetch('https://collectionapi.metmuseum.org/public/collection/v1/search?q=&hasImages=true')
        .then((response) => response.json())
        .then((data) => {
            for (let index = 0; index < 6; index++) {
                if (i != 6) setInterval(mostrarObjetos(data.objectIDs.slice(0, 20)), 5000);
            }
        })
        .catch((error) => { console.log("Error al obtener los objetos.", error); });
}

async function mostrarObjetos(objectIDs) {
    grilla.innerHTML = '';
    cards.clear();
    console.log("Total: ", objectIDs.length);

    for (let i = 0; i < objectIDs.length; i++) {
        if (cards.size >= 200) break;

        const id = objectIDs[i];

        const response = await fetch(urlObjeto + id).catch((error) => { console.log(error); });
        if (response.status === 200) {
            const data = await response.json(); console.log(data.length);

            const imagen = data.primaryImage || data.primaryImageSmall || "sin_imagen.png";
            const fechaCreacion = data.objectDate ? data.objectDate : "Fecha desconocida";
            let tituloTraducido = 'Sin título';
            let culturaTraducida = 'Sin datos';
            let dinastiaTraducida = 'Sin datos';

            if (data.title) tituloTraducido = await traducirTexto(data.title);
            if (data.culture) culturaTraducida = await traducirTexto(data.culture);
            if (data.dynasty) dinastiaTraducida = await traducirTexto(data.dynasty);

            let card = `
            <div class="card">
                <img src="${imagen}" title="Creación: ${fechaCreacion}"/>
                <h4 class="titulo"><strong>Título:</strong> ${tituloTraducido}</h4>
                <h5 class="cultura"><strong>Cultura:</strong> ${culturaTraducida}</h5>
                <h5 class="dinastia"><strong>Dinastía:</strong> ${dinastiaTraducida}</h5>`;

            if (data.additionalImages && data.additionalImages.length > 0) {
                const imagenes = data.additionalImages.join(',');
                card += `<button class="masImagenes" onclick="verMasImagenes('${imagenes}')">Ver más imágenes</button>`;
            }
            card += `</div>`;

            if (![...cards].some(cardExistente => cardExistente === card)) cards.add(card);
            if (cards.size % 20 === 0) objetosPaginaActual();
        }
    }
    if (cards.size < 20) objetosPaginaActual();
}

function verMasImagenes(imagenes) {
    grilla.innerHTML = '';
    imagenes.split(',').forEach((imagen) => {
        grilla.innerHTML += `<img scr="${imagen || "sin_imagen.png"}" class="imagenesAdicionales" />`;
    });
}

function objetosPaginaActual() {
    actualizarFooter();
    grilla.innerHTML = '';
    const cardsArreglo = Array.from(cards);
    const inicio = (numeroPaginaValor - 1) * 20;
    const final = inicio + 20;

    for (let i = inicio; i < final; i++) {
        if (cardsArreglo[i]) grilla.innerHTML += cardsArreglo[i];
    }
}

// PAGINACIÓN ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------\\
function avanzar() {
    if (numeroPaginaValor) {
        numeroPaginaValor++;
        document.getElementById('numeroPagina').innerText = `${numeroPaginaValor}`;
        objetosPaginaActual();
        actualizarFooter();
    }
}

function retroceder() {
    if (numeroPaginaValor > 1) {
        numeroPaginaValor--;
        document.getElementById('numeroPagina').innerText = `${numeroPaginaValor}`;
        objetosPaginaActual();
        actualizarFooter();
    }
}


function actualizarFooter() {
    const paginasTotales = Math.ceil(cards.size / 20);

    if (cards.size <= 20) {
        document.getElementById('footer').style.display = 'none';
    } else {
        document.getElementById('footer').style.display = 'block';
    }

    document.getElementById('numeroPagina').innerText = `${numeroPaginaValor}`;
    document.getElementById('anterior').hidden = (numeroPaginaValor === 1);
    document.getElementById('siguiente').hidden = (numeroPaginaValor >= paginasTotales);
}

// CARGAR DEPARTAMENTOS   ----------------------------------------------------------------------------------------------------------------------------------------------------------------\\
async function obtenerDepartamentos() {
    const response = await fetch(urlDepartamentos);
    const data = await response.json();
    const departamentosTraducidos = await Promise.all(
        data.departments.map(async (dep) => ({
            id: dep.departmentId,
            nombreTraducido: await traducirTexto(dep.displayName)
        }))
    );
    departamentosTraducidos.sort((a, b) => a.nombreTraducido.localeCompare(b.nombreTraducido));

    const departamentoSelect = document.getElementById('departamento');
    const option = document.createElement('option');
    option.value = ''; option.textContent = '';
    departamentoSelect.appendChild(option);
    departamentosTraducidos.forEach((dep) => {
        const option = document.createElement('option');
        option.value = dep.id;
        option.textContent = dep.nombreTraducido;
        departamentoSelect.appendChild(option);
    });
}

// CARGAR TODOS LOS PAÍSES ---------------------------------------------------------------------------------------------------------------------------------------------------------------\\
async function cargarLocalizaciones() {
    await fetch(urlPaises)
        .then((response) => response.json())
        .then((data) => {
            const localizacion = document.getElementById('localizacion');
            const option = document.createElement('option');
            option.value = ''; option.textContent = '';
            localizacion.appendChild(option);

            data.sort((a, b) => {
                const paisA = a.translations?.spa?.common || a.name.common;
                const paisB = b.translations?.spa?.common || b.name.common;
                return paisA.localeCompare(paisB);
            });

            data.forEach((pais) => {
                const option = document.createElement('option');
                if (pais.translations && pais.translations.spa) {
                    option.value = pais.name.common;
                    option.textContent = pais.translations.spa.common;
                } else {
                    option.value = pais.name.common;
                    option.textContent = pais.name.common;
                }
                localizacion.appendChild(option);
            });
        })
        .catch((error) => { console.log('Error al cargar los países.', error); });
}

// TRADUCCIÓN ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------\\
async function traducirTexto(texto) {
    const respuesta = await fetch(`/traducir?texto=${encodeURIComponent(texto)}`);
    const data = await respuesta.json();
    return data.traduccion;
}

// Llamar a estas funciones para ejecutarse primero al cargar la página
window.onload = async function () {
    await obtenerDepartamentos();
    await cargarLocalizaciones();
    await obtenerObjetos();
}
const urlDepartamentos = 'https://collectionapi.metmuseum.org/public/collection/v1/departments';
const urlObjeto = 'https://collectionapi.metmuseum.org/public/collection/v1/objects/'; // Para buscar un objeto (Necesita un ID (int))
const urlBusqueda = 'https://collectionapi.metmuseum.org/public/collection/v1/search?q=&hasImages=true';
const urlPaises = 'https://restcountries.com/v3.1/all';

const grilla = document.getElementById('grilla');
let numeroPaginaTexto = document.getElementById('numeroPagina');
numeroPaginaTexto.textContent = '1';
let numeroPaginaValor = parseInt(document.getElementById('numeroPagina').value);
let cards = new Array(200);

// BUSCAR   ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------\\
document.getElementById('buscar').addEventListener('click', async () => {
    const clave = document.getElementById('clave').value.trim();
    const departamento = document.getElementById('departamento').value;
    const localizacion = document.getElementById('localizacion').value.trim();

    const id_Departamento = await fetch(urlDepartamentos)
        .then((response) => response.json())
        .then((data) => {
            const departamentoEncontrado = data.departments.find((dep) => dep.departmentId == departamento);
            return departamentoEncontrado ? departamentoEncontrado.departmentId : null;
        })
        .catch((error) => { console.log("Error al buscar departamentos.", error); });

    let consulta = 'https://collectionapi.metmuseum.org/public/collection/v1/search?hasImages=true';
    if (clave) consulta += `&q=${encodeURIComponent(clave)}`;
    if (id_Departamento) consulta += `&departmentId=${id_Departamento}`;
    if (localizacion) consulta += `&geoLocation=${encodeURIComponent(localizacion)}`;

    await fetch(consulta)
        .then((response) => response.json())
        .then((data) => {
            if (data.objectIDs && data.objectIDs.length > 0) {
                guardarObjetos(data.objectIDs); // Acá quizás es solamente "data"
            } else {
                alert("No se encontraron objetos.");
                document.getElementById('grilla').innerHTML = '<p>No se encontraron resultados.</p>';
            }
        })
        .catch((error) => { console.log("Error en la búsqueda.", error); });;
});

// OBTENER OBJETOS ÚTILES ----------------------------------------------------------------------------------------------------------------------------------------------------------------\\
async function obtenerObjetos() {
    await fetch(urlBusqueda)
        .then((response) => response.json())
        .then((data) => {
            guardarObjetos(data.objectIDs);
        })
        .catch((error) => { console.log("Error al obtener los objetos.", error); });
}

async function guardarObjetos(objectIDs) {
    grilla.innerHTML = '';
    cards = [];
    let elementosValidos = 0;

    for (const id of objectIDs) {
        if (elementosValidos >= 200) break;

        const response = await fetch(urlObjeto + id);
        if (response.status === 200) {
            const data = await response.json();

            if (data.primaryImage && data.title && data.culture && data.dynasty) {
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
                    card += `<button class="masImagenes" onclick="verMasImagenes('${data.additionalImages.join(',')}')">Ver más imágenes</button>`;
                }
                card += `</div>`;

                cards.push(card);
                elementosValidos++;

                if (cards.length % 20 === 0) {
                    objetosPaginaActual();
                }
            }
        }
    }
    objetosPaginaActual();
}

function verMasImagenes(imagenesString) {
    const arregloImagenes = imagenesString.split(',');
    grilla.innerHTML = '';

    arregloImagenes.forEach((imagen) => {
        grilla.innerHTML += `<img scr="${imagen}" class="imagenesAdicionales" />`;
    });
}

function objetosPaginaActual() {
    grilla.innerHTML = '';
    const inicio = (numeroPaginaValor - 1) * 20;
    const final = Math.min(inicio + 20, cards.length);

    for (let i = inicio; i < final; i++) {
        if (cards[i]) {
            grilla.innerHTML += cards[i];
        }
    }

    actualizarFooter();
}

// PAGINACIÓN ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------\\
function avanzar() {
    if (numeroPaginaValor < 10) {
        numeroPaginaValor++;
        numeroPaginaTexto.textContent = `${numeroPaginaValor}`;
        objetosPaginaActual();
        actualizarFooter();
    }
}

function retroceder() {
    if (numeroPaginaValor > 1) {
        numeroPaginaValor--;
        numeroPaginaTexto.textContent = `${numeroPaginaValor}`;
        objetosPaginaActual();
        actualizarFooter();
    }
}


function actualizarFooter() {
    document.getElementById('anterior').hidden = (numeroPaginaValor === 1);
    document.getElementById('siguiente').hidden = (numeroPaginaValor * 20 >= cards.length);
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

            data.sort((a, b) => {
                const paisA = a.translations?.spa?.common || a.name.common;
                const paisB = b.translations?.spa?.common || b.name.common;
                return paisA.localeCompare(paisB);
            });

            data.forEach((pais) => {
                const option = document.createElement('option');
                if (pais.translations && pais.translations.spa) {
                    option.value = pais.translations.spa.common;
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

// Llamar a estas funciones al cargar la página
window.onload = async function () {
    await obtenerDepartamentos();
    await cargarLocalizaciones();
    await obtenerObjetos();
}







// Parte I

// MOSTRAR TODOS LOS OBJETOS (con imagen supuestamente) (20 por página)    ---------------------------------------------------------------------------------------------------------------\\
/*const items = new Array(200);
fetch(urlBusqueda)
    .then((response) => response.json())
    .then((data) => {
        mostrarObjetos(data.objectIDs.slice(0, 20));
        items.fill(data.objectIDs);
    })
    .catch((error) => { console.log(error); });

async function mostrarObjetos(objectIDs) {
    let card = '';
    for (let objectID of objectIDs) {
        await fetch(urlObjeto + objectID)
            .then((response) => response.json())
            .then(async (data) => {
                const imagen = data.primaryImage ? data.primaryImage : data.primaryImageSmall;
                let fechaCreacion = data.objectDate ? data.objectDate : "Fecha desconocida";
                let tituloTraducido = 'Sin título';
                let culturaTraducida = 'Sin datos';
                let dinastiaTraducida = 'Sin datos';

                if (data.title) tituloTraducido = await traducirTexto(data.title);
                if (data.culture) culturaTraducida = await traducirTexto(data.culture);
                if (data.dynasty) dinastiaTraducida = await traducirTexto(data.dynasty);

                if (data.additionalImages && data.additionalImages.length > 0) {
                    card += `
                <div class="card">
                    <img src="${imagen ? imagen : "sin_imagen.png"}" title="Creación: ${fechaCreacion}"/>
                    <h4 class="titulo"><strong>Título:</strong> ${tituloTraducido}</h4>
                    <h5 class="cultura"><strong>Cultura:</strong> ${culturaTraducida}</h5>
                    <h5 class="dinastia"><strong>Dinastía:</strong> ${dinastiaTraducida}</h5>
                    <button class="masImagenes" onclick="verMasImagenes(${objectID})">Ver más imágenes</button>
                </div>`;
                } else {
                    card +=
                        `<div class="card">
                    <img src="${imagen ? imagen : "sin_imagen.png"}" title="Creación: ${fechaCreacion}"/>
                    <h4 class="titulo"><strong>Título:</strong> ${tituloTraducido}</h4>
                    <h5 class="cultura"><strong>Cultura:</strong> ${culturaTraducida}</h5>
                    <h5 class="dinastia"><strong>Dinastía:</strong> ${dinastiaTraducida}</h5>
                </div>`;
                }

                const grilla = document.getElementById('grilla');
                grilla.innerHTML = card;
            })
            .catch((error) => { console.log(error); });
    }
}*/



// Parte II

/*
const fetchPromises = objectIDs.map(id => fetch(urlObjeto + id).then(response => response.json()));
    const objetos = await Promise.all(fetchPromises);

    objetos.forEach(async (data) => {
        const imagen = data.primaryImage || data.primaryImageSmall || "sin_imagen.png";
        const fechaCreacion = data.objectDate ? data.objectDate : "Fecha desconocida";
        let tituloTraducido = 'Sin título';
        let culturaTraducida = 'Sin datos';
        let dinastiaTraducida = 'Sin datos';

        if (data.title && data.title != '') tituloTraducido = await traducirTexto(data.title); titulo = true;
        if (data.culture && data.culture != '') culturaTraducida = await traducirTexto(data.culture); cultura = true;
        if (data.dynasty && data.dynasty != '') dinastiaTraducida = await traducirTexto(data.dynasty); dinastia = true;
        if (data.additionalImages && data.additionalImages.length > 0) imagenes = true;

        if (imagen && titulo && cultura && dinastia) {
            card += `
                <div class="card">
                    <img src="${imagen}" title="Creación: ${fechaCreacion}"/>
                    <h4 class="titulo"><strong>Título:</strong> ${tituloTraducido}</h4>
                    <h5 class="cultura"><strong>Cultura:</strong> ${culturaTraducida}</h5>
                    <h5 class="dinastia"><strong>Dinastía:</strong> ${dinastiaTraducida}</h5>
                </div>`;
        } else if (imagen && imagenes && titulo && cultura && dinastia) {
            card += `
                <div class="card">
                    <img src="${imagen}" title="Creación: ${fechaCreacion}"/>
                    <h4 class="titulo"><strong>Título:</strong> ${tituloTraducido}</h4>
                    <h5 class="cultura"><strong>Cultura:</strong> ${culturaTraducida}</h5>
                    <h5 class="dinastia"><strong>Dinastía:</strong> ${dinastiaTraducida}</h5>
                    <button class="masImagenes" onclick="verMasImagenes(${data.additionalImages})">Ver más imágenes</button>
                </div>`;
        }
        cards.push(card);

        if (cards.length === objectIDs.length) {
            objetosPaginaActual();
        }
    });
*/
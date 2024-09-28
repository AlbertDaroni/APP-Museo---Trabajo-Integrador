const urlDepartamentos = 'https://collectionapi.metmuseum.org/public/collection/v1/departments';
const urlObjeto = 'https://collectionapi.metmuseum.org/public/collection/v1/objects/'; // Para buscar un objeto (Necesita un ID (int))
const urlPaises = 'https://restcountries.com/v3.1/all';

const grilla = document.getElementById('grilla');
let numeroPaginaTexto = document.getElementById('numeroPagina').textContent = '1';
let numeroPaginaValor = parseInt(numeroPaginaTexto);
let cards = [];

// BUSCAR   ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------\\
document.getElementById('form').addEventListener('submit', async (evento) => {
    evento.preventDefault();

    const clave = document.getElementById('clave').value || '' || 'flowers';
    const departamento = document.getElementById('departamento').value;
    const localizacion = document.getElementById('localizacion').value;
    document.getElementById('numeroPagina').innerText = '1';

    let consulta = `https://collectionapi.metmuseum.org/public/collection/v1/search?hasImages=true`;
    if (clave) consulta += `&q=${clave}`;
    if (departamento) consulta += `&departmentId=${departamento}`;
    if (localizacion) consulta += `&geoLocation=${localizacion}`;
    
    console.log(consulta);
    await obtenerDatos(consulta);
});

// OBTENER OBJETOS ÚTILES ----------------------------------------------------------------------------------------------------------------------------------------------------------------\\
async function obtenerDatos(consulta) {
    try {
        const response = await fetch(consulta);
        if (response.status === 200) {
            const data = await response.json();
            if (data.total > 0) {
                cards = []; console.log("Total:", data.objectIDs.length, " Tamaño arreglo:", cards.length);
                obtenerInformacionObjetos(data.objectIDs);
            } else {
                alert("No se encontraron resultados");
            }
        }
    } catch (error) { console.log("Error al traer los datos.", error); }
}

async function obtenerInformacionObjetos(objectIDs) {
    const promesas = objectIDs.slice(0, 500).map(async (id) => {
        const response = await fetch(urlObjeto + id);
        if (response.status === 200) {
            if (cards.length >= 200) return;

            const data = await response.json();

            const imagen = data.primaryImage || data.primaryImageSmall || "sin_imagen.png";
            const fechaCreacion = data.objectDate ? data.objectDate : "Fecha desconocida";
            const tituloTraducido = data.title ? await traducirTexto(data.title) : "Sin título";
            const culturaTraducida = data.culture ? await traducirTexto(data.culture) : "Sin datos";
            const dinastiaTraducida = data.dynasty ? await traducirTexto(data.dynasty) : "Sin datos";

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
            console.log("Objeto agregado.");
            cards.push(card);
        }
    });

    await Promise.all(promesas);
    mostrarObjetos();
}

async function mostrarObjetos() {
    grilla.innerHTML = '';
    const inicio = (numeroPaginaValor - 1) * 20;
    const final = Math.min(inicio + 20, cards.length);

    for (let i = inicio; i < final; i++) {
        if (cards[i]) grilla.innerHTML += cards[i];
    }

    actualizarFooter();
}

function verMasImagenes(imagenes) {
    grilla.innerHTML = '';
    imagenes.split(',').forEach((imagen) => {
        grilla.innerHTML += `<img src="${imagen || "sin_imagen.png"}" class="imagenesAdicionales" />`;
    });
}

// PAGINACIÓN ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------\\
function avanzar() {
    if (numeroPaginaValor * 20 < cards.length) {
        numeroPaginaValor++;
        document.getElementById('numeroPagina').innerText = `${numeroPaginaValor}`;
        mostrarObjetos();
    }
}

function retroceder() {
    if (numeroPaginaValor > 1) {
        numeroPaginaValor--;
        document.getElementById('numeroPagina').innerText = `${numeroPaginaValor}`;
        mostrarObjetos();
    }
}


function actualizarFooter() {
    const paginasTotales = Math.ceil(cards.length / 20);
    document.getElementById('footer').style.display = paginasTotales > 1 ? 'block' : 'none';

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
    await obtenerDatos('https://collectionapi.metmuseum.org/public/collection/v1/search?q=&hasImages=true');
}
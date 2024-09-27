const urlDepartamentos = 'https://collectionapi.metmuseum.org/public/collection/v1/departments';
const urlObjeto = 'https://collectionapi.metmuseum.org/public/collection/v1/objects/'; // Para buscar un objeto (Necesita un ID (int))
const urlBusqueda = 'https://collectionapi.metmuseum.org/public/collection/v1/search?q=&hasImages=true';
const urlPaises = 'https://restcountries.com/v3.1/all';

const grilla = document.getElementById('grilla');
let numeroPaginaTexto = document.getElementById('numeroPagina').textContent = '1';
let numeroPaginaValor = parseInt(numeroPaginaTexto);
const cardsUnicas = new Set();

// BUSCAR   ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------\\
document.getElementById('form').addEventListener('submit', async (evento) => {
    evento.preventDefault();
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

    let consulta = {
        clave,
        departamento: id_Departamento,
        localizacion
    };

    try {
        const response = await fetch('/buscar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams(consulta).toString()
        });

        if (!response.ok) {
            throw new Error(`Error en la solicitud: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.success && data.objectIDs) {
            mostrarObjetos(data.objectIDs);
        } else {
            alert(data.message || "No se encontraron objetos.");
        }
    } catch (error) {
        console.error('Error al realizar la búsqueda:', error);
        alert('Hubo un problema al realizar la búsqueda.');
    }
});

// OBTENER OBJETOS ÚTILES ----------------------------------------------------------------------------------------------------------------------------------------------------------------\\
async function obtenerObjetos() {
    await fetch(urlBusqueda)
        .then((response) => response.json())
        .then((data) => {
            mostrarObjetos(data.objectIDs);
        })
        .catch((error) => { console.log("Error al obtener los objetos.", error); });
}

async function mostrarObjetos(objectIDs) {
    grilla.innerHTML = '';

    for (const id of objectIDs) {
        if (cardsUnicas.size >= 200) break;

        const response = await fetch(urlObjeto + id).catch((error) => { console.log(error); });
        if (response.status === 200) {
            const data = await response.json();

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

            cardsUnicas.add(card);

            if (cardsUnicas.size % 4 === 0) objetosPaginaActual();
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
    const final = inicio + 20;
    const card = [...cardsUnicas];

    for (let i = inicio; i < final; i++) {
        if (card[i]) grilla.innerHTML += card[i];
    }

    actualizarFooter();
}

// PAGINACIÓN ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------\\
function avanzar() {
    if (numeroPaginaValor < 10) {
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
    document.getElementById('numeroPagina').innerText = `${numeroPaginaValor}`;
    document.getElementById('anterior').hidden = (numeroPaginaValor === 1);
    document.getElementById('siguiente').hidden = (numeroPaginaValor === 10);
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
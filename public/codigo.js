const urlDepartamentos = 'https://collectionapi.metmuseum.org/public/collection/v1/departments';
const urlObjeto = 'https://collectionapi.metmuseum.org/public/collection/v1/objects/'; // Para buscar un objeto (Necesita un ID (int))
const urlBusqueda = 'https://collectionapi.metmuseum.org/public/collection/v1/search?q=&hasImages=true';
const urlPaises = 'https://restcountries.com/v3.1/all';

// CARGAR DEPARTAMENTOS   ----------------------------------------------------------------------------------------------------------------------------------------------------------------\\
async function obtenerDepartamentos() {
    await fetch(urlDepartamentos)
    .then((response) => response.json())
    .then((data) => {
        const departamento = document.getElementById('departamento');

        data.departments.sort((a, b) => {
            return a.displayName.localeCompare(b.displayName);
        });
        
        data.departments.forEach((departamentos) => {
            const option = document.createElement('option');
            option.value = departamentos.departmentId;
            option.textContent = departamentos.displayName;
            departamento.appendChild(option);
        });
    })
    .catch((error) => {console.log("Error al cargar los departamentos.", error);});
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
    .catch((error) => {console.log('Error al cargar los países.', error);});
}


// MOSTRAR TODOS LOS OBJETOS (con imagen supuestamente) (20 por página)    ---------------------------------------------------------------------------------------------------------------\\
fetch(urlBusqueda)
.then((response) => response.json())
.then((data) => {
    mostrarObjetos(data.objectIDs.slice(0, 20));
})
.catch((error) => {console.log(error);});

async function mostrarObjetos(objectIDs) {
    let objetosHTML = '';
    for (let objectID of objectIDs) {
        await fetch(urlObjeto + objectID)
        .then((response) => response.json())
        .then(async (data) => {
            const imagen = data.primaryImage ? data.primaryImage : data.primaryImageSmall;
            let tituloTraducido = 'Sin título';
            let culturaTraducida = 'Sin datos';
            let dinastiaTraducida = 'Sin datos';

            if(data.title) tituloTraducido = await traducirTexto(data.title);
            if(data.culture) culturaTraducida = await traducirTexto(data.culture);
            if(data.dynasty) dinastiaTraducida = await traducirTexto(data.dynasty);

            objetosHTML += 
            `<div class="objeto">
            <img src="${imagen ? imagen : "sin_imagen.png"}"/>
            <h4 class="titulo"><strong>Título:</strong> ${tituloTraducido}</h4>
            <h5 class="cultura"><strong>Cultura:</strong> ${culturaTraducida}</h5>
            <h5 class="dinastia"><strong>Dinastía:</strong> ${dinastiaTraducida}</h5>
            </div>`;
            
            const grilla = document.getElementById('grilla');
            grilla.innerHTML = objetosHTML;
        })
        .catch((error) => {console.log(error);});
    }
}

async function traducirTexto(texto) {
    const respuesta = await fetch(`/traducir?texto=${encodeURIComponent(texto)}`);
    const data = await respuesta.json();
    return data.traduccion;
}


// BUSCAR   ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------\\
document.getElementById('buscar').addEventListener('click', async (evento) => {
    evento.preventDefault();
    const clave = document.getElementById('clave').value.trim();
    const departamento = document.getElementById('departamento').value.trim();
    const localizacion = document.getElementById('localizacion').value.trim();

    const id_Departamento = await fetch(urlDepartamentos)
    .then((response) => response.json())
    .then((data) => {
        const departamentoEncontrado = data.departments.find((dep) => dep.displayName === departamento);
        return departamentoEncontrado ? departamentoEncontrado.departmentId : null;
    })
    .catch((error) => {console.log(error);});
    
    let consulta = 'https://collectionapi.metmuseum.org/public/collection/v1/search?q=&hasImages=true';
    if(clave) consulta = `https://collectionapi.metmuseum.org/public/collection/v1/search?q=${clave}&hasImages=true`;
    if(id_Departamento) consulta += `&departmentId=${id_Departamento}`;
    if(localizacion) consulta += `&geoLocation=${localizacion}`;

    await fetch(consulta)
    .then((response) => response.json())
    .then((data) => {
        if (data.objectIDs && data.objectIDs.length > 0) {
            mostrarObjetos(data.objectIDs.slice(0, 20));
        }
    });
});

obtenerDepartamentos();
cargarLocalizaciones();
const traductor = require('node-google-translate-skidz');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const puerto = 3000;

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended : true}));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/vista.html');
});

app.get('/traducir', async (req, res) => {
    const texto = req.query.texto;
    const traduccion = await traducir(texto);
    res.json({traduccion});
});

app.get('/buscar', async (req, res) => {
    const { clave, departamento, localizacion } = req.body;

    const consulta = construirConsulta(clave, departamento, localizacion);

    try {
        const response = await fetch(consulta);
        const data = await response.json();

        if (data.objectIDs && data.objectIDs.length > 0) {
            res.json({ success: true, objectIDs: data.objectIDs });
        } else {
            res.json({ success: false, message: "No se encontraron objetos." });
        }
    } catch (error) {
        console.error("Error en la búsqueda:", error);
        res.status(500).json({ success: false, message: "Error en la búsqueda." });
    }
});

function construirConsulta(clave, departamento, localizacion) {
    const consulta = 'https://collectionapi.metmuseum.org/public/collection/v1/search?hasImages=true';
    const parametros = new URLSearchParams();

    if (clave) parametros.append('q', clave);
    if (departamento) parametros.append('departmentId', departamento);
    if (localizacion) parametros.append('geoLocation', localizacion);

    return `${consulta}&${parametros.toString()}`;
}

async function traducir(texto) {
    return new Promise((resolve, reject) => {
        traductor({
            text: texto,
            source: 'en',
            target: 'es'
        }, (result) => {
            resolve(result.translation);
        });
    });
}

app.listen(puerto, () => {
    console.log(`Servidor conectado. Puerto:  ${puerto}`);
});
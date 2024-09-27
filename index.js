const traductor = require('node-google-translate-skidz');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const puerto = 3000;

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/vista.html');
});

app.get('/traducir', async (req, res) => {
    const texto = req.query.texto;
    const traduccion = await traducir(texto);
    res.json({ traduccion });
});

app.post('/buscar', async (req, res) => {
    const { clave, departamento, localizacion } = req.body;

    const response = await fetch(`https://collectionapi.metmuseum.org/public/collection/v1/search?q=${clave}&departmentId=${departamento}&geoLocation=${localizacion}`);

    if (!response.ok) {
        return res.status(response.status).json({ success: false, message: 'Error al buscar objetos' });
    }

    const data = await response.json();
    res.json({ success: true, objectIDs: data.objectIDs });
});

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
const traductor = require('node-google-translate-skidz');
const express = require('express');
const app = express();
const puerto = 3000;

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/vista.html');
});

app.get('/traducir', async (req, res) => {
    const texto = req.query.texto;
    const traduccion = await traducir(texto);
    res.json({ traduccion });
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
    console.log(`Servidor conectado en el puerto:  ${puerto}`);
});
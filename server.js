const express = require('express');
const bodyParser = require('body-parser');

const cors = require('cors'); // 👈 Thêm dòng này

const path = require('path');

const lib = require('./utils');

const app = express();
const port = 8080;
app.use(cors()); //Thêm dòng này để mở CORS cho tất cả các domain
app.use(bodyParser.json());

app.post('/add', async (req, res) => {
    try {
        console.log(req.body);
        const { key, value } = req.body;
        await lib.write(key, value);
        res.send("Insert a new record successfully!");
    } catch (err) {
        res.send(err.toString());
    }
});

app.get('/get/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const value = await lib.view(id);
        res.status(200).send(value);
    } catch (err) {
        res.send(err)
    }
});
app.get('/getAll', async (req, res) => {
    try {
        const value = await lib.viewAll();
        res.status(200).send(value);
        console.log("GetAll", value);
    } catch (err) {
        res.send(err)
    }
});


app.get('/viewer/:id', (req, res) => {
    const id = req.params.id;
    res.sendFile(path.join(__dirname, "viewer.html"));
});


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
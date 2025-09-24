require('dotenv').config();
const express = require('express');
const path = require('path');


const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.static(path.join(__dirname,"client","public")));


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname,"client","public"));
});

app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
})
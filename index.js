const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
//midlewares
app.use(cors());
app.use(express.json());

app.get('/', (req, res)=>{
    res.send('Genius Car Server is Running');
})

app.listen(port, ()=>{
    console.log(`Genius Car Server running on ${port}`);
})
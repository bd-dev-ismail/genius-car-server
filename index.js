const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { response } = require('express');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;
//midlewares
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.nbna82s.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

function verifyJWT(req, res, next){
    const authHeader = req.headers.authorization;
    if(!authHeader){
        return res.status(401).send({message: 'Unauthorized access!'})
    };
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded){
        if(err){
            return res.status(403).send({message: 'Forbidden access!'})
        }
        req.decoded = decoded;
        next();
    })
}


async function run(){

    try{
        const servicesCollection = client.db('geinusCar').collection('services');
        const ordersCollection = client.db('geinusCar').collection('orders');
        //jwt Note Note Note Remember token expair in 30days
        app.post('/jwt', (req, res)=>{
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '30d'});
            res.send({token});
        })
        

        //get services 
        app.get('/services', async(req, res)=>{
            const query = { price: { $gt: 30, $lt: 100 }};
            const order = req.query.order === 'asc' ? 1 : -1;
            const cursor = servicesCollection.find(query).sort({price: order});
            const services = await cursor.toArray();
            res.send(services)
        });
        //get single services
        app.get('/services/:id', async(req, res)=>{
            const id = req.params.id;
            const query = {_id: ObjectId(id)}
            const services = await servicesCollection.findOne(query);
            res.send(services);
        });
        //order apis
        app.get("/orders", verifyJWT, async (req, res) => {
            const decoded = req.decoded;
            if(decoded.email !== req.query.email){
                res.status(403).send({message: 'Unauthorized access!'})
            }
          let query = {};
          if (req.query.email) {
            query = {
              email: req.query.email,
            };
          }

          const cursor = ordersCollection.find(query);
          const orders = await cursor.toArray();
          res.send(orders);
        });

        app.post('/orders', verifyJWT, async(req, res)=>{
            const order = req.body;
            const result = await ordersCollection.insertOne(order);
            res.send(result)
        })
        //patch
        app.patch('/orders/:id', verifyJWT, async(req, res)=> {
            const id = req.params.id;
            const status = req.body.status;
            const query = {_id: ObjectId(id)};
            const updatedDoc = {
                $set: {
                    status: status,
                }
            }
            const result = await ordersCollection.updateOne(query, updatedDoc);
            res.send(result)
        })
        //delete
        app.delete('/orders/:id', verifyJWT, async(req, res)=>{
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const result = await ordersCollection.deleteOne(query);
            res.send(result);
        })
    }
    finally{

    }
}

run().catch(err => console.error(err))



app.get('/', (req, res)=>{
    res.send('Genius Car Server is Running');
})

app.listen(port, ()=>{
    console.log(`Genius Car Server running on ${port}`);
})
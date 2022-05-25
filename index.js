const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ygrmxpu.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const toolCollection = client.db("ts-manufacture-company").collection("tools");
        const reviewCollection = client.db("ts-manufacture-company").collection("reviews");
        const orderCollection = client.db("ts-manufacture-company").collection("orders");
        const userCollection = client.db("ts-manufacture-company").collection("users");

        app.get("/tool", async (req, res) => {
            const query = {};
            const cursor = toolCollection.find(query);
            const tools = await cursor.toArray();
            res.send(tools);

        });

        app.get("/tool/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const tool = await toolCollection.findOne(query);
            res.send(tool);
        });

        //user create
        app.put("/user/:email", async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        })

        //review
        app.get("/review", async (req, res) => {
            const query = {};
            const cursor = reviewCollection.find(query);
            const reviews = await cursor.toArray();
            res.send(reviews);
        })

        //add review
        app.post("/review", async (req, res) => {
            const newReview = req.body;
            const result = await reviewCollection.insertOne(newReview);
            res.send(result);
        });

        //order collection
        app.post("/order", async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result);
        });

        //order data
        app.get("/order", async (req, res) => {
            const customer = req.query.customer;
            const query = { customer: customer };
            const orders = await orderCollection.find(query).toArray();
            res.send(orders);
        })

    }
    finally {

    }
}
run().catch(console.dir);


app.get("/", (req, res) => {
    res.send("Running Ts Manufacture Company");
});

app.listen(port, () => {
    console.log("Running Port", port);
})

const express = require('express');
const cors = require('cors');
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require("dotenv").config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ygrmxpu.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


//verify token
/* function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: "Unauthorized access" });
    }
    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: "Forbidden access" })
        }
        req.decoded = decoded;
        next();
    });
} */

async function run() {
    try {
        await client.connect();
        const toolCollection = client.db("ts-manufacture-company").collection("tools");
        const reviewCollection = client.db("ts-manufacture-company").collection("reviews");
        const orderCollection = client.db("ts-manufacture-company").collection("orders");
        const userCollection = client.db("ts-manufacture-company").collection("users");
        const paymentCollection = client.db("ts-manufacture-company").collection("payments");

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

        //add tool 
        app.post("/tool", async (req, res) => {
            const newTool = req.body;
            const result = await toolCollection.insertOne(newTool);
            res.send(result);
        });

        //get all user
        app.get("/user", async (req, res) => {
            const users = await userCollection.find().toArray();
            res.send(users);
        })

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
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '2h' })
            res.send({ result, token });
        });

        //require admin create
        app.get("/admin/:email", async (req, res) => {
            const email = req.params.email;
            const user = await userCollection.findOne({ email: email });
            const isAdmin = user.role === "admin";
            res.send({ admin: isAdmin })
        })



        app.put("/user/admin/:email", async (req, res) => {
            const email = req.params.email;

            const filter = { email: email };
            const updateDoc = {
                $set: { role: "admin" },
            };
            const result = await userCollection.updateOne(filter, updateDoc);
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
            return res.send(orders);


        });

        app.get("/order/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const order = await orderCollection.findOne(query);
            res.send(order);
        })

        //orders api create
        app.get("/orders", async (req, res) => {
            const query = {};
            const cursor = orderCollection.find(query);
            const orders = await cursor.toArray();
            res.send(orders);

        });

        //tool delete api
        app.delete("/tool/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await toolCollection.deleteOne(query);
            res.send(result);
        });

        //order delete
        app.delete("/orders/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await toolCollection.deleteOne(query);
            res.send(result);
        });

        //payment
        app.post("/create-payment-intent", async (req, res) => {
            const tool = req.body;
            console.log(req.body);
            const price = tool.price;
            const amount = parseInt(price) * 100;
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: "usd",
                payment_method_types: ["card"]
            });
            res.send({ clientSecret: paymentIntent.client_secret })
        });

        //store transaction id
        app.patch("/order/:id", async (req, res) => {
            const id = req.params.id;
            const payment = req.body;
            const filter = { _id: ObjectId(id) };
            const updateDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId,

                }
            }
            const result = await paymentCollection.insertOne(payment);
            const updatedOrder = await orderCollection.updateOne(filter, updateDoc);
            res.send(updateDoc);

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

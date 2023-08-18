const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require('mongodb');

const port = process.env.PORT || 5000;

// middleware
app.use(cors())
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.djxbtyf.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {

    const articleCollection = client.db("ArticleDB").collection("article");
    const userCollections = client.db("ArticleDB").collection("users");

    /******** Create user POST API *******/
    app.post("/users", async (req, res) => {
      const userDetails = req.body;
      const query = { email: userDetails.email };
      const existingUser = await userCollections.findOne(query);
      if (existingUser) {
        return res.send({ message: "User Already Exist" });
      }
      const result = await userCollections.insertOne(userDetails);
      res.send(result);
    })

    /************ Find All article GET API ***************/
    app.get("/article", async (req, res) => {
        const result = await articleCollection.find({}).toArray();
        res.send(result);
      });
    // // get article
    // app.get("/article", async (req, res) => {
    //     const result = await articleCollection.find({}).toArray();
    //     res.send(result);
    //   });

    /****************** Add article post API ************************/
    app.post("/addarticle", async (req,res) => {
      const articleDetails = req.body;
      console.log(articleDetails);
      const result = await articleCollection.insertOne(articleDetails);
      res.send(result);
    })
    


    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get("/", (req, res) => {
    res.send("Server is running...!");
  });
  
  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });
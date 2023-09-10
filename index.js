const express = require("express")
const app = express()
require("dotenv").config()
var jwt = require("jsonwebtoken");
const cors = require("cors");
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization) {
    return res
      .status(401)
      .send({ error: true, message: "unauthorized access" });
  }
  // bearer token
  const token = authorization.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res
        .status(403)
        .send({ error: true, message: "No access !!!!!!" });
    }
    req.decoded = decoded;
    next();
  });
};

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.djxbtyf.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const articleCollection = client.db("ArticleDB").collection("article");
    const usersCollection = client.db("ArticleDB").collection("users");
    const reviewsCollection = client.db("ArticleDB").collection("reviews");
    const bookArticleCollection = client.db("ArticleDB").collection("BookArticle");
    const addCommentCollection = client.db("ArticleDB").collection("addComment");

    /*indexing create only*/
    // Creating index on two fields
    // const indexKeys = { title: 1, category: 1 };

    // const indexOptions = { name: "titleCategory" }; // Replace index_name with the desired index name

    // const result = await articleCollection.createIndex(indexKeys, indexOptions);
    // console.log(result);

    // ============= Create JWT API =============

    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({ token });
    });
    // Warning: use verifyJWT before using verifyAdmin
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const users = await usersCollection.findOne(query);
      if (users?.role !== "admin") {
        return res
          .status(403)
          .send({ error: true, message: "forbidden message" });
      }
      next();
    };

    // ============= USERS =============

    app.get("/users", verifyJWT, verifyAdmin, async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    app.post("/users", async (req, res) => {
      const userDetails = req.body;
      const query = { email: userDetails.email };
      const existingUser = await usersCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "User Already Exist" });
      }
      const result = await usersCollection.insertOne(userDetails);
      res.send(result);
    });

    // MAKE ADMIN
    app.patch("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // REMOVE ADMIN
    app.patch("/users/removeAdmin/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "user",
        },
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // check admin
    app.get("/users/admin/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;

      if (req.decoded.email !== email) {
        res.send({ admin: false });
      }

      const query = { email: email };
      const user = await usersCollection.findOne(query);
      const result = { admin: user?.role === "admin" };
      res.send(result);
    });


    app.get('/role/:email', async (req, res) => {
      const email = req.params.email;
      // console.log(email);
      const query = { email: email }
      const options = {
        projection: { role: 1 },
      };
      const result = await usersCollection.findOne(query, options);
      res.send(result);

    })

    // ============= ARTICLE API =============

    app.get("/article", async (req, res) => {
      const result = await articleCollection.find({}).toArray(); // All data
      res.send(result);
    });

    app.get("/article/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: new ObjectId(id) };
      const data = await articleCollection.findOne(query); // Single data
      res.send(data);
    });

    // ********** bookarticle ********************

    // app.post("/bookarticle", async (req, res) => {
    //   const book = req.body;
    //   console.log(book);
    //   const result = await bookArticleCollection.insertOne(book); // Post data
    //   res.send(result);
    // })
    // app.post("/bookarticle", async (req, res) => {
    //   const book = req.body;
    //   console.log(book);
    //   try {
    //     const result = await bookArticleCollection.insertOne(book); // Insert the received book data
    //     res.send(result);
    //   } catch (error) {
    //     console.error("Error inserting book article:", error);
    //     res.status(500).send("Internal Server Error");
    //   }
    // })

    app.post("/bookarticle", async (req, res) => {
      const book = req.body;
      console.log(book);
      const result = await bookArticleCollection.insertOne(book); // Post data
      res.send(result);
    })

    app.get("/bookarticle/:email", async (req, res) => {
      const email = req.params.email
      console.log(email);
      const query = { userEmail: email }
      // if (req.query?.email) {
      //   query = { email: req.query.email };
      // }
      const result = await bookArticleCollection.find(query).toArray();
      console.log(result);
      res.send(result);
    })
    // app.get("/bookarticle", async (req, res) =>{
    //   let query = {};
    //   console.log(req.query.email);
    //   if (req.query?.email) {
    //     query = { email: req.query.email };
    //   }
    //   const result = await bookArticleCollection.find(query).toArray();
    //   console.log(result);
    //   res.send(result);
    // })


    // *****************Add article

    app.post("/addArticle", verifyJWT, async (req, res) => {
      const articleDetails = req.body;
      console.log(articleDetails);
      const result = await articleCollection.insertOne(articleDetails); // Post data
      res.send(result);
    });

    app.get("/userArticle", async (req, res) => {
      let query = {};
      console.log(req.query.email);
      if (req.query?.email) {
        query = { email: req.query.email };
      }
      const result = await articleCollection.find(query).toArray();  // get, user updated some data
      res.send(result);
    });

    app.patch("/article/approved/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: "approved",
        },
      };
      const result = await articleCollection.updateOne(filter, updateDoc); // Article approved
      res.send(result);
    });



    app.delete("/deleteArticle/:id", async (req, res) => {
      const id = req.params.id;

      const query = { _id: new ObjectId(id) };
      const result = await articleCollection.deleteOne(query); // delete single data
      res.send(result);
    });

    app.get("/articleSearch/:text", async (req, res) => {
      const searchText = req.params.text;

      const result = await articleCollection
        .find({
          $or: [
            { title: { $regex: searchText, $options: "i" } },
            { category: { $regex: searchText, $options: "i" } }, //Search data
          ],
        })
        .toArray();
      res.send(result);
    });

    /************  reviews GET API ***************/
    app.get("/reviews", async (req, res) => {
      const result = await reviewsCollection.find({}).toArray();
      res.send(result);
    });

    app.post("/reviews", async (req, res) => {
      const reviewDetails = req.body;
      console.log(reviewDetails);
      const result = await reviewsCollection.insertOne(reviewDetails);
      res.send(result);
    });

    // Comment part

    // app.patch("/addComment/:id", async (req, res) => {
    //   const commentDetails = req.body;
    //   const id = res.query;
    //   console.log(id)
    //   return
    //   let updateDoc = {
    //     $set: {
    //       status: "active",
    //     },
    //   };
    //   const newComment = { comment: commentDetails }
    //   if (!Array.isArray(existingArticle.comments)) {
    //     existingArticle.comments = [];
    //   }

    //   existingArticle.comments.push(newComment);

    //   updateDoc.$set.comments = existingArticle.comments;

    //   const query = { _id: existingArticle._id };
    //   const result = await articleCollection.updateOne(query, updateDoc);
    //   // const result = await addCommentCollection.insertOne(commentDetails);
    //   res.send(result);
    // });
    app.patch("/addComment", async (req, res) => {
      try {
        const commentDetails = req.body.comment;
        const id = req.query.id;
        console.log(commentDetails);

        if (!commentDetails || !id) {
          return res.status(400).json({ success: false, message: "Invalid request parameters" });
        }

        const existingArticle = await articleCollection.findOne({ _id: new ObjectId(id) });

        if (!existingArticle) {
          return res.status(404).json({ success: false, message: "Article not found" });
        }

        const newComment = { comment: commentDetails };

        if (!Array.isArray(existingArticle.comments)) {
          existingArticle.comments = [];
        }

        existingArticle.comments.push(newComment);

        const updateDoc = {
          $set: {
            comments: existingArticle.comments,
          },
        };

        const query = { _id: existingArticle._id };
        const result = await articleCollection.updateOne(query, updateDoc);

        if (result.modifiedCount === 1) {
          res.status(200).json({ success: true, message: "Comment added successfully" });
        } else {
          res.status(500).json({ success: false, message: "Failed to add comment" });
        }
      } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal server error" });
      }
    });

    app.get("/addComment", async (req, res) => {
      const result = await addCommentCollection.find().toArray();
      res.send(result);
    });




    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
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

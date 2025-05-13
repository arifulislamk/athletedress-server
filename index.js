const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(express.json());

app.use(cors({
  origin: [
    "https://athletedress.netlify.app",
    "http://localhost:5173",
    "https://athletedress-server-30nfrsobu.vercel.app",
  ]
}));

const authenticateJWT = (req, res, next) => {
  const token = req.header("Authorization").split(" ")[1];
  // console.log(token, "token pai");
  if (!token) {
    return res.status(401).json({ message: "Access denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(400).json({ message: "Invalid token" });
  }
};
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zwicj3r.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    const allUserData = client.db("athleteDress").collection("allUser");
    const allJerseys = client.db("athleteDress").collection("allJerseys");
    const carts = client.db("athleteDress").collection("carts");
    // all user collection api
    app.post("/register", async (req, res) => {
      const info = req.body;
      const { email, password } = req.body;
      console.log(info, email, password, "paise");
      const hashedPassword = await bcrypt.hash(password, 10);
      const maininfo = { ...info, hashedPassword: hashedPassword };
      const result = await allUserData.insertOne(maininfo);
      const token = jwt.sign({ email }, process.env.SECRET_KEY, {
        expiresIn: "365day",
      });
      res.send({ token, usertype: info?.usertype, email: info?.email });
    });
    app.post("/login", async (req, res) => {
      const { emailornumber, password } = req.body;
      const query = {
        $or: [{ email: emailornumber }, { number: emailornumber }],
      };
      const user = await allUserData.findOne(query);
      //   console.log(emailornumber, password, user);
      console.log(user, "paichi");
      if (!user) {
        return res.status(400).json({ message: "Invalid credentials" });
      }
      const isPasswordValid = await bcrypt.compare(
        password,
        user.hashedPassword
      );
      if (!isPasswordValid) {
        return res.status(400).json({ message: "Invalid credentials" });
      }
      const token = jwt.sign({ emailornumber }, process.env.SECRET_KEY, {
        expiresIn: "365day",
      });
      res.json({ token, usertype: user?.usertype, email: user?.email });
    });
    // all jerseys collection api
    app.post("/allJerseys", async (req, res) => {
      const jerseydata = req.body;
      const result = await allJerseys.insertOne(jerseydata);
      res.send(result);
    });

    app.get("/allJerseys", async (req, res) => {
      const result = await allJerseys.find().toArray();
      res.send(result);
    });
    app.get("/jerseyDetails/:id", async(req, res)=> {
      const {id} = req.params ;
      const query = { _id : new ObjectId(id)} ;
      const result = await allJerseys.findOne(query) ;
      res.send(result) ;
    })
    app.delete("/jerseydelete/:id", async (req, res) => {
      const id = req.params ;
      const query = {_id : new ObjectId(id)};
      const result = await allJerseys.deleteOne(query);
      res.send(result)
    })

    // cart collection api
    app.post("/cart", async(req,res )=> {
      const data = req.body ;
      const result = await carts.insertOne(data) ;
      res.send(result)
    })
    app.get("/carts/:email", async(req, res) => {
      const email = req.params.email ;
      // console.log(email, 'tahake pailam')
      const result = await carts.find({purchaseEmail:email}).toArray()
      res.send(result)
    })
    // Connect the client to the server	(optional starting in v4.7)
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("hello ariful welcome back");
});
app.listen(port, () => {
  console.log(`athletedress server is runnig port ${port}`);
});

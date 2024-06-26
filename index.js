const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');

dotenv.config();

const uri = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;



const app = express();
// app.use(cors());
app.use(cors({
  origin: ['https://main--invoiceapp-font.netlify.app', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Access-Control-Allow-Origin']
}));
app.use(express.json());


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});



var invoiceCollection = null;
var draftInvoiceList = null;

app.listen(8000, () => {
  console.log("Server is running on port 8000");
  
  async function run() {
    try {
      await client.connect();
      await client.db("admin").command({ ping: 1 });
      console.log("Connected to MongoDB!");
      invoiceCollection = client.db("InvoiceGenerator").collection("PrintedInvoiceList");
      draftInvoiceList = client.db('InvoiceGenerator').collection("DraftInvoices");
    } finally {
      //
    }
  }
  run().catch(console.dir);
});



// Middleware to authenticate JWT token
const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};


app.post('/signup',async(req,res)=>{
  const { username, password , email } = req.body;
  console.log(username, password , email);
  try {
    await client.connect();
    const userCollection = client.db("InvoiceGenerator").collection("RegisteredUsers");
    const existingUser = await userCollection.findOne({ email });
    if (existingUser) {
      return res.status(404).send("User already exists!");
    } else {
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10); 
      // Save the hashed password to the database
      await userCollection.insertOne({ username, email, password: hashedPassword });
      res.status(200).send("Signup Successful!");
    }
  } catch (error) {
    console.log("Error While Creating New User: ", error);
    res.status(500).send("Error While Creating New User");
  }
});




// Login endpoint
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  console.log(username, password);
  try {
    await client.connect();
    const userCollection = client.db("InvoiceGenerator").collection("RegisteredUsers");
    const user = await userCollection.findOne({ username });
    const allData = await userCollection.find({}).toArray();
    // console.log(user)
    // console.log(allData)
    if (!user) {
      return res.status(400).send('Cannot find user');
    }
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).send('Incorrect password');
    }
    const token = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
    console.log("Data Valid Login Good !")
  } catch (error) {
    console.log("Error While getting login details :--->" , error)
    res.send("Error While getting login details")
  }
});

// Using `authenticateToken` middleware to protect routes
app.get('/home',(req,res)=>{
  res.send("<h1>Hello From Server</h1>");
})

app.get('/get', authenticateToken, (req, res) => {
  document.write(invoiceData);
  res.send(invoiceData[invoiceData.length - 1]._id);
});

app.post('/post', authenticateToken, (req, res) => {
  const recivedData = req.body;
  // console.log("\n\nRecived Data ===> " + JSON.stringify(recivedData));
  try {
    PostData([recivedData]);
    res.send("Data Inserted");
  } catch (e) {
    console.log("ERROR OCCURED " + e);
    res.status(500).send("Error inserting data");
  }
});

app.post('/draftInvoice', authenticateToken, async (req, res) => {
  const recivedData = req.body;
  console.log("\n\nRecived Data ===> " + JSON.stringify(recivedData));
  try {
    await PostDraftData([recivedData]);
    res.send("Draft Saved");
  } catch (e) {
    console.log("ERROR OCCURED " + e);
    res.send("Error While Saving Draft");
  }
});

app.get('/tableData', authenticateToken, async (req, res) => {
  console.log("Request Recived");
  try {
    await getLetestData();
    res.send(invoiceData);
  } catch (e) {
    console.log("ERROR OCCURED " + e);
    res.status(500).send("Error fetching data");
  }
});

app.post('/addcompany', authenticateToken, async (req, res) => {
  const data = req.body;
  console.log(data);
  await addCompany(data);
  if (!duplicate) {
    res.json({ msg: "Company Added TO DataBase", result: true });
  } else {
    res.json({ msg: "Company Already Exists Update the Company Data if you want to make changes", result: false });
  }
});

app.post('/addCustomUser', authenticateToken, async (req, res) => {
  const data = req.body;
  console.log("Request For adding Client Recived")
  console.log(data);
  const ans = await addCustomUser(data);
  console.log(ans)
  if (ans) {
    res.json({ msg: "Client Added TO DataBase", result: true });
  } else {
    res.json({ msg: "Client Already Exists Update the client Data if you want to make changes", result: false });
  }
});


app.get('/companyList', authenticateToken, async (req, res) => {
  console.log('Request for list of companies received');
  try {
    const data = await getCompanyList();
    console.log(data);
    res.send(data);
  } catch (e) {
    console.log('Error Occurred', e);
    res.status(500).send("Error fetching company list");
  }
});

app.get('/userList', authenticateToken, async (req, res) => {
  console.log('Request for list of Users received');
  try {
    const data = await getUserList();
    console.log(data);
    res.send(data);
  } catch (e) {
    console.log('Error Occurred', e);
    res.status(500).send("Error fetching user list");
  }
});

async function PostData(recivedData) {
  // if (recivedData) {
  //   await client.connect();
  //   await invoiceCollection.insertMany(recivedData);
  //   console.log("Data Inserted Into MongoDB Database");
  // }

  if (recivedData) {
    // Extract only the required fields
    const recivedDataa = recivedData[0]
    delete recivedData[0]['0']
    JSON.stringify(recivedData);
    console.log(recivedData)
    const cleanedData = recivedData[0]

    try {
      await client.connect();
      console.log(cleanedData);
      await invoiceCollection.insertOne(cleanedData);
      console.log("Data Inserted Into MongoDB Database");
    } catch (error) {
      console.error("Error inserting data into MongoDB:", error);
    } finally {
      await client.close();
    }
  }
}


async function PostDraftData(recivedData) {
  if (recivedData) {
    await client.connect();
    await draftInvoiceList.insertMany(recivedData);
    console.log("Data Inserted Into Draft invoices");
  }
}

async function getLetestData() {
  await client.connect();
  invoiceCollection = client.db("EduHub").collection("invoice");
  invoiceData = await invoiceCollection.find({}).toArray();
  console.log("Invoice Data: " + JSON.stringify(invoiceData));
  return invoiceData;
}

async function addCompany(data) {
  await client.connect();
  const companyCollection = client.db("EduHub").collection("Companies");
  const checkBefore = await companyCollection.findOne({ 'companyName': data.companyName });
  if (checkBefore) {
    console.log("Company Already Exists");
    console.log(checkBefore);
    duplicate = true;
    return false;
  } else {
    duplicate = false;
    console.log("It's a New One");
    await companyCollection.insertOne(data);
    duplicate = false;
    return true;
  }
}

async function addCustomUser(data) {
  await client.connect();
  console.log(data.username)
  const companyCollection = client.db("InvoiceGenerator").collection("clients");
  const checkBefore = await companyCollection.findOne({ 'username': data.username });
  console.log("User Exists ? ",checkBefore);
  if (checkBefore) {
    console.log("User Already Exists");
    console.log(checkBefore);
    duplicate = true;
    return false;
  } else {
    console.log("It's a New One");
    await companyCollection.insertOne(data);
    duplicate = false;
    return true;
  }
}

async function getCompanyList() {
  await client.connect();
  const companyList = client.db('EduHub').collection('Companies');
  const data = await companyList.find({}).toArray();
  console.log(data);
  return data;
}

async function getUserList() {
  await client.connect();
  const companyList = client.db('InvoiceGenerator').collection('clients');
  const data = await companyList.find({}).toArray();
  console.log(data);
  return data;
}


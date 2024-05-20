const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require('express');
const cors = require('cors');
const uri = "mongodb+srv://astrochinmay:astrochinmay@eduhub.2sgtwed.mongodb.net/?retryWrites=true&w=majority&appName=EduHub";

const app = express();
app.use(cors());
app.use(express.json());


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// =====================================================================Configrations=======================================================
var invoiceCollection = null;


app.listen(8000, () => {
  console.log("Server Is running on port 8000");
  async function run() {
    try {
      // Connect the client to the server	(optional starting in v4.7)
      await client.connect();

      // Send a ping to confirm a successful connection
      await client.db("admin").command({ ping: 1 });
      console.log("Pinged your deployment. You successfully connected to MongoDB!");
      // dataBase = client.db("EduHub").collection("Students");
      // data = await dataBase.find({}).toArray();
      invoiceCollection = client.db("EduHub").collection("invoice");
      // console.log("Data : " + invoiceCollection);
      invoiceData = await invoiceCollection.find({}).toArray();
      // console.log("Invoice Data : " + JSON.stringify(invoiceData));

    } finally {
      // Ensures that the client will close when you finish/error
      await client.close();
    }
  }
  run().catch(console.dir);

  
});


// ========================================================Get Unique Invoice Id ===========================================================

app.get('/get', (req, res) => {
  res.send(invoiceData[invoiceData.length - 1]._id);
});


// =========================================================== Post New Invoice Data ========================================================
async function PostData(recivedData) {
  if (recivedData) {
    await client.connect();
    await invoiceCollection.insertMany(recivedData);
    console.log("Data Inserted Into MangoDB DataBase");
  }
}

app.post('/post', (req, res) => {
  const recivedData = req.body;
  console.log("\n\nRecived Data ===> " + JSON.stringify(recivedData));
  try {
    PostData([recivedData]);
  }
  catch (e) {
    console.log("ERROR OCCURED " + e);
  }
});



// ===================================================================Get Letest Invoices===================================================

async function getLetestData(){
  await client.connect();
  invoiceCollection = client.db("EduHub").collection("invoice");
  invoiceData = await invoiceCollection.find({}).toArray();
  console.log("Invoice Data : " + JSON.stringify(invoiceData));
}

//get Data For Table
app.get('/tableData', (req, res) => {
  console.log("Request Recived");
  try {
    getLetestData();
    res.send(invoiceData);
  }
  catch (e) {
    console.log("ERROR OCCURED " + e);
  }
})


// ==================================================================Adding new Company======================================================

async function addCompany(data){
  await client.connect();
  const companyCollection = client.db("EduHub").collection("Companies");
  const res = await companyCollection.insertOne(data);
  console.log(res)
}

app.post('/addcompany',(req,res)=>{
  const data = req.body;
  console.log(data);
  res.send('Data Got To Backend');
  addCompany(data);
})

// =========================================================================================================================================

// ======================================================= Get Company List =================================================================

async function getCompanyList (){
  await client.connect();
  const companyList = client.db('EduHub').collection('Companies')
  const data = await companyList.find({}).toArray()
  console.log(data);
  return data;
}

app.get('/companyList' ,async (req , res)=>{
    console.log('Request for list of companies recived')
    try{
      const data =  await getCompanyList();
      console.log(data);
      res.send(data)
    }catch (e){
      console.log('Error Occured',e);
    }
})

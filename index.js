const express = require('express')
const MongoClient = require('mongodb').MongoClient;
const bodyParser = require('body-parser')
const fileUpload = require('express-fileupload')
const fs = require('fs-extra')
const cors = require('cors')
const app = express()

app.use(bodyParser.json())
app.use(cors())
app.use(express.static('doctors'))
app.use(fileUpload())
require('dotenv').config()
const ObjectId = require('mongodb').ObjectId;

const port = process.env.PORT || 5000

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.liz79.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
console.log(uri)
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const appointmentCollection = client.db("doctorsdb").collection("appointments");
  const doctorsCollection = client.db("doctorsdb").collection("doctors");

  // add data to database
  app.post('/addAppointment', (req, res) => {
    const appointment = req.body;
    appointmentCollection.insertOne(appointment)
      .then(result => {
        console.log('data inserted successfully')
        res.send(result.insertedCount > 0);

      })
  })

  // send date to server and find data date wise 
  app.post('/appointmentsByDate', (req, res) => {
    const date = req.body;
    const email = req.body.email;
    doctorsCollection.find({ email: email })
      .toArray((error, doctors) => {
        const filter = { date: date.date }
        if (doctors.length === 0) {
          filter.email = email;
        }
        appointmentCollection.find(filter)
          .toArray((error, documents) => {
            res.send(documents)
          })
      })
  })

  // is a doctor or normal user 
  app.post('/isDoctor', (req, res) => {
    const email = req.body.email;
    doctorsCollection.find({ email: email })
      .toArray((err, doctors) => {
        res.send(doctors.length > 0)
      })
  })

  // upload image to database 
  app.post('/addADoctor', (req, res) => {
    const file = req.files.file;
    const name = req.body.name;
    const email = req.body.email;
    console.log(file, name, email);

    // const filePath = `${__dirname}/doctors/${file.name}`;

    // const newImg = fs.readFileSync(filePath);

    const newImg = req.files.file.data;
    const encodeImg = newImg.toString('base64');

    const image = {
      contentType: req.files.file.mimetype,
      size: req.files.file.size,
      img: Buffer.from(encodeImg, 'base64')
    }
    // moving  or storing file to server 
    //below codes are commented for direct store image to database  and to resolve heroku deployment problem
    // file.mv(filePath, error =>{
    //   if(error){
    //     console.log(error)
    //     return res.status(500).send({message: 'failed to upload image in the server'})
    //   }
  //  })
    doctorsCollection.insertOne({ name, email, image })
      .then(result => {

        //below codes are commented for direct store image to database  and to resolve heroku deployment problem
        // fs.remove(filePath, err =>{
        //   if(error){
        //     res.status(500).send({message: 'failed to upload image in the database'})
        //     console.log(err)
        //   }
        // })
        res.send(result.insertedCount > 0)
      })
    // return res.send({name: file.name, path:`/${file.name}`})
})
});


app.get('/', (req, res) => {
  res.send('Hello Mongo!')
})

app.listen(port)
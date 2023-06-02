const { MongoClient, ServerApiVersion } = require('mongodb');
const { ObjectId } = require('mongodb');
const express = require('express');

require('dotenv').config()
const cors = require('cors')

const app = express();
const PORT = process.env.PORT || 9000;

app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.obhaluk.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {
    try {
        await client.connect()
        const UsersCollections = client.db('regal-residences').collection('users')
        const ResidencesCollections = client.db('regal-residences').collection('residences')
        const bookingCollections = client.db('regal-residences').collection('bookings')
      
        app.post('/users', async (req, res) => {
            const data = req.body
            const query = {
                email: data.email
            }
            const findData = await UsersCollections.findOne(query)

            if (findData) {

                res.send(findData)
            }
            else {
                const insertData = await UsersCollections.insertOne(data)
                res.send(insertData)
            }


        })
        app.get('/residence', async (req, res) => {
            const residences = await ResidencesCollections.find().toArray();
            res.send(residences);
        })
        app.post('/booking', async (req, res) => {
            const booking = req.body;
            const booked = await bookingCollections.insertOne(booking);
            res.send(booked);

        })
        app.get('/bookings', async (req, res) => {
            const allBookingData = await bookingCollections.find().toArray()
            res.send(allBookingData)

        })
        app.get('/admin/:email', async (req, res) => {
            const email = req?.params?.email;
            const user = await UsersCollections.findOne({ email: email });

            if (user?.role == "admin") {
                res.send({ admin: true });
            }
            else {
                res.send({ admin: false });
            }



        })
        app.post('/residence', async (req, res) => {
            const residenceDetails = req?.body;
            console.log(residenceDetails, 'my name is khan')
            const residence = await ResidencesCollections.insertOne(residenceDetails)

            res.send(residence)



        })
        app.put('/makeAdmin/:id', async (req, res) => {
            const admin = req.params.id;
            const user = await UsersCollections.findOne({ email: admin })
            console.log("hello")
            if (user) {
                const filter = { email: admin }
                const updateDoc = {
                    $set: { role: 'admin' },
                };
                const result = await UsersCollections.updateOne(filter, updateDoc)
                res.send(result)

            }
            else {

                const newAdmin = {
                    email: admin,
                    role: "admin"
                }
                const adminFinal = await UsersCollections.insertOne(newAdmin)
                res.send(adminFinal)

            }


        })




        app.get('/bookings/myBookings/:id', async (req, res) => {
            const email = req.params.id;
            const filter = { email: email }
            const bookings = await bookingCollections.find(filter).toArray()
            console.log(bookings)
            res.send(bookings)
        })




        app.delete('/residence/:id', async (req, res) => {
            try {
                const residenceId = req.params.id;
                console.log("id is", residenceId)
                // Connect to MongoDB


                // Delete the residence
                const result = await ResidencesCollections.deleteOne({ _id: new ObjectId(residenceId) });

                // Check if deletion was successful
                if (result?.deletedCount === 1) {
                    res.status(200).json({ message: 'Residence deleted successfully' });
                } else {
                    res.status(404).json({ message: 'Residence not found' });
                }

                // Close the MongoDB connection

            } catch (error) {
                console.error(error);
                res.status(500).json({ message: 'Internal server error' });
            }
        });


        app.get('/', async (req, res) => {
            res.send('hello world')
            console.log('regal-residence-server')
        })


    }

    finally {

        // await client.close()

    }
}






run().catch(console.dir)


app.listen(PORT, function (err) {

    console.log(`listening at ${PORT}`);
});
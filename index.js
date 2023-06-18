const { MongoClient, ServerApiVersion } = require('mongodb');
const { ObjectId } = require('mongodb');
const express = require('express');
const jwt = require('jsonwebtoken');

require('dotenv').config()
const cors = require('cors')

const app = express();
const PORT = process.env.PORT || 9000;

app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.obhaluk.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
const stripe = require("stripe")(process.env.STRIPE_SECRET)
function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization  
    if (!authHeader) {
        console.log("fucked up")
        return res.status(401).send({ message: 'UnAuthorized access' })
    }
    const token = authHeader.split(' ')[1]
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' })

        }
        else{
               req.decoded = decoded 
        next()
        }
     
    });

}


async function run() {
    try {
        client.connect()
        const UsersCollections = client.db('regal-residences').collection('users')
        const ResidencesCollections = client.db('regal-residences').collection('residences')
        const bookingCollections = client.db('regal-residences').collection('bookings')
        const ordersCollections = client.db('regal-residences').collection('orders')

        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = await jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            console.log("khan", token)
            res.send({ token })

        })


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




        app.post('/orders', async (req, res) => {
            const order = req?.body
            const orderInfo = await ordersCollections.insertOne(order)
            res.send(orderInfo)
        })
        app.get('/orders', async (req, res) => {
            const orders = await ordersCollections.find().toArray()
            res.send(orders)
        })




        app.get('/bookings/myBookings/:id', verifyJWT, async (req, res) => {
            const email = req?.params.id;
            const decoded = req?.decoded
            
            if (email !== decoded.email) {
                return res.status(403).send({ message: "unauthorized access" })
            }
            else {
                const filter = { email: email }
                const bookings = await bookingCollections.find(filter).toArray()
                return res.send(bookings)
            }

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

        app.post('/create-payment-intent', async (req, res) => {
            const { price } = req.body;
            console.log(typeof (price))
            const finalPrice = parseInt(price)
            const amount = finalPrice * 100
            console.log("jjjjj", typeof (amount))
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: 'usd',
                "payment_method_types": [
                    "card"
                ]
            });

            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        });

        app.delete('/removeBooking/:id', async (req, res) => {
            const id = req?.params?.id;
            console.log(id)
            const query = { _id: new ObjectId(id) }
            const removedBooking = await bookingCollections.deleteOne(query)
            res.send(removedBooking)

        });
        app.delete('/orders/:id', async (req, res) => {
            const email = req.params?.id
            console.log(email)
            const query = { _id: new ObjectId(email) }
            const removedOrder = await ordersCollections.deleteOne(query)
            console.log(removedOrder)
            res.send(removedOrder)
        })


    }

    finally {

        // await client.close()

    }
}
run().catch(console.dir)

app.get('/', async (req, res) => {
    res.send('hello world')
    console.log('regal-residence-server')
})








app.listen(PORT, function (err) {

    console.log(`listening at ${PORT}`);
});
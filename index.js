const express = require('express');
const app = express();
const cors = require('cors');
const admin = require("firebase-admin");
require('dotenv').config();
const { MongoClient } = require('mongodb');
const ObjectId = require("mongodb").ObjectId;

const port = process.env.PORT || 5000;

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

// const serviceAccount = require('./hero-rider-firebase-adminsdk.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

app.use(cors());
app.use(express.json());





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qcqim.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });





async function verifyToken(req, res, next) {
    if (req.headers?.authorization?.startsWith('Bearer ')) {
        const token = req.headers.authorization.split(' ')[1];

        try {
            const decodedUser = await admin.auth().verifyIdToken(token);
            req.decodedEmail = decodedUser.email;
        }
        catch {

        }

    }
    next();
}








async function run() {
    try {
        await client.connect();
        const database = client.db('hero_rider');

        const usersCollection = database.collection('users');
        // const chefsCollection = database.collection('chefs');
        // const cookingClassCollection = database.collection('cookingClass');
        // const enrolledCourseCollection = database.collection('enrolledCourse');
        // const recipesCollection = database.collection("recipes");
        // const reviewCollection = database.collection("review");








        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            let isBlocked= false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }

             if (user?.status === 'Blocked') {
                isBlocked = true;
            }

            res.json({ admin: isAdmin, blocked:isBlocked});
        })

        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            console.log(result);
            res.json(result);
        });

        app.put('/users', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        });

        app.put('/users/admin', verifyToken, async (req, res) => {
            const user = req.body;
            const requester = req.decodedEmail;
            if (requester) {
                const requesterAccount = await usersCollection.findOne({ email: requester });
                if (requesterAccount.role === 'admin') {
                    const filter = { email: user.email };
                    const updateDoc = { $set: { role: 'admin' } };
                    const result = await usersCollection.updateOne(filter, updateDoc);
                    res.json(result);
                }
            }
            else {
                res.status(403).json({ message: 'you do not have access to make admin' })
            }

        });


// Get profile by email query from database 

        app.get("/myProfile/:email", async (req, res) => {
            console.log(req.params);


            const result = await usersCollection
                .find({ email: req.params.email })
                .toArray();
            // console.log(result);
            res.send(result);

        });

          // Get all registered users
        app.get("/allRegisteredUsers", async (req, res) => {
            const result = await usersCollection.find({}).toArray();
            res.send(result);
        });

                // Find single enrolled course from database through id 

        app.get("/singleProfile/:id", async (req, res) => {
            console.log(req.params.id);


            usersCollection.findOne({ _id: ObjectId(req.params.id) })
                .then(result => {
                    console.log(result);
                    res.send(result);

                });


        });

        //    Update status for order 

        app.put("/update/:id", async (req, res) => {
            const id = req.params.id;
            const updatedInfo = req.body;
            const filter = { _id: ObjectId(id) };


            const result = await usersCollection
                .updateOne(filter, {
                    $set: {
                        // status: updatedInfo.status
                        status: 'Blocked',

                    },
                });
            console.log(result);
            res.send(result);

        });






        // Enroll new course to database

        // app.post("/enrollCourses", async (req, res) => {
        //     console.log(req.body);
        //     const result = await enrolledCourseCollection.insertOne(req.body);
        //     res.send(result);
        // });

        // Get all enrolled courses by email query from database 

        // app.get("/myCourses/:email", async (req, res) => {
        //     console.log(req.params);


        //     const result = await enrolledCourseCollection
        //         .find({ email: req.params.email })
        //         .toArray();
        //     // console.log(result);
        //     res.send(result);

        // });

        // Get all enrolled courses
        // app.get("/allEnrolledCourses", async (req, res) => {
        //     const result = await enrolledCourseCollection.find({}).toArray();
        //     res.send(result);
        // });

        // Find single enrolled course from database through id 

        // app.get("/singleCourse/:id", async (req, res) => {
        //     console.log(req.params.id);


        //     enrolledCourseCollection.findOne({ _id: ObjectId(req.params.id) })
        //         .then(result => {
        //             console.log(result);
        //             res.send(result);

        //         });


        // });

        //    Update status for order 

        // app.put("/update/:id", async (req, res) => {
        //     const id = req.params.id;
        //     const updatedInfo = req.body;
        //     const filter = { _id: ObjectId(id) };


        //     const result = await enrolledCourseCollection
        //         .updateOne(filter, {
        //             $set: {
        //                 // status: updatedInfo.status
        //                 status: 'Enrolled',

        //             },
        //         });
        //     console.log(result);
        //     res.send(result);

        // });




        // Add new course to database

        // app.post("/addCourses", async (req, res) => {
        //     console.log(req.body);
        //     const result = await cookingClassCollection.insertOne(req.body);
        //     res.send(result);
        // });



        // Get all courses
        // app.get("/allCourses", async (req, res) => {
        //     const result = await cookingClassCollection.find({}).toArray();
        //     res.send(result);
        // });


        // Delete course from database 

        // app.delete("/deleteCourse/:id", async (req, res) => {
        //     console.log(req.params.id);

        //     const result = await enrolledCourseCollection
        //         .deleteOne({ _id: ObjectId(req.params.id) });

        //     res.send(result);

        // });



        // Add new recipe to database

        // app.post("/addRecipes", async (req, res) => {
        //     console.log(req.body);
        //     const result = await recipesCollection.insertOne(req.body);
        //     res.send(result);
        // });

        // Get all recipes
        // app.get("/allRecipes", async (req, res) => {
        //     const result = await recipesCollection.find({}).toArray();
        //     res.send(result);
        // });


        // Delete recipe from database 

        // app.delete("/deleteRecipe/:id", async (req, res) => {
        //     console.log(req.params.id);

        //     const result = await recipesCollection
        //         .deleteOne({ _id: ObjectId(req.params.id) });

        //     res.send(result);

        // });


        // Get all recipes by email query from database 

        // app.get("/myRecipes/:email", async (req, res) => {
        //     console.log(req.params);


        //     const result = await recipesCollection
        //         .find({ email: req.params.email })
        //         .toArray();
        //     // console.log(result);
        //     res.send(result);

        // });


        // Add a review
        // app.post("/addReviews", async (req, res) => {
        //     const result = await reviewCollection.insertOne(req.body);
        //     res.send(result);
        // });

        // Get all reviews
        // app.get("/allReviews", async (req, res) => {
        //     const result = await reviewCollection.find({}).toArray();
        //     res.send(result);
        // });







    }


    finally {
        // await client.close();
    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello Hero Rider!')
})

app.listen(port, () => {
    console.log(`listening at ${port}`)
})
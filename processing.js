const fs = require("fs");
const path = require("path");
const express = require("express");
const { urlencoded } = require("body-parser");
const app = express(); 
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'templates'));
app.use(urlencoded({extended : true}));
process.stdin.setEncoding("utf8");
require("dotenv").config({ path: path.resolve(__dirname, '.env') });
const portNumber = process.argv[2];
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://garaujo:Chapatis1022@cluster0.7uk1vgy.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });
const axios = require('axios');

const databaseAndCollectionTVShow = {db: "tvShowDB", collection:"FinalProjTV"};
const databaseAndCollectionMovie = {db: "movieDB", collection:"FinalProjMovie"};


process.stdout.write(`Web server started and running at http://localhost:${portNumber}\n`);
const prompt = "Type stop to shutdown the server: ";
process.stdout.write(prompt);
process.stdin.on('readable', () => {  
    let dataInput = process.stdin.read();
    if (dataInput !== null) {
        let command = dataInput.trim();
        if (command === "stop") {
            console.log("Shutting down the server");
            process.exit(0);
        }else{
            console.log(`Invalid command: ${command}`);
        }
        process.stdout.write(prompt);
        process.stdin.resume();
    }
});

async function insertMedia(client, databaseAndCollection, newMedia) {
    await client.connect();
    const result = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(newMedia);
    await client.close();
}


app.get("/", (request, response) => { 
    response.render("index.ejs");
});
app.get("/movieInput", (request, response) => { 
    response.render("movieInput.ejs"); 
});
app.get("/tvshowInput", (request, response) => { 
    response.render("tvInput.ejs"); 
});
app.post("/movieInput", (request, response) => { 
    let name = request.body.name;
    const variables = {
        name: request.body.name,
        genre: request.body.genre
    };
    insertMedia(client, databaseAndCollectionMovie, variables); // Use databaseAndCollectionMovie
    response.render("afterInputMovie.ejs", { name: name });
});

app.post("/tvshowInput", (request, response) => { 
    let name = request.body.name;
    const variables = {
        name: name,
        genre: request.body.genre
    };
    insertMedia(client, databaseAndCollectionTVShow, variables); 
    response.render("afterInputTVShow.ejs", { name: name });
});

async function fetchMedia(client, databaseAndCollection) {
    await client.connect();
    const collection = client.db(databaseAndCollection.db).collection(databaseAndCollection.collection);
    const media = await collection.find({}).toArray();
    await client.close();
    return media;
}
async function getMovieDetails(movieName) {
    const apiKey = process.env.API_KEY;
    const url = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent("Hunger Games")}&api_key=${apiKey}`;
    console.log("URL: ", url); // Log the URL

    try {
        const response = await axios.get(url);
        console.log("API Response: ", response.data); // Log the API response
        const movieDetails = response.data.results;
        return movieDetails;
    } catch (error) {
        console.error("Error fetching movie details:", error.message);
        return [];
    }
}


app.get("/getResult", async (request, response) => {
    await client.connect();
    const movies = await fetchMedia(client, databaseAndCollectionMovie);

    // Get movie details for each movie
    const movieDetails = await Promise.all(movies.map(m => getMovieDetails(m.name)));
    console.log("Movie Details: ", movieDetails); // Add this line to log movie details

    // Render the page with movie details
    response.render("getResult.ejs", { movies: movieDetails });
});



app.listen(portNumber);
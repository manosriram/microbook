const express = require("express");
const app = express();
const PORT = 5001;
var mysql = require("mysql");
const amqp = require("amqplib");

// Channel Message Structure -> { job: "jobName", ... };

var connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "password",
    database: "microbook"
});
connection.connect();
var channel;

// Functions.
// Initiate Queue Connection and create queue (if not present already)
async function connect() {
    try {
        const queueCon = await amqp.connect("amqp://localhost:5672");
        channel = await queueCon.createChannel();
        await channel.assertQueue("bookingqueue");

        const result = await channel.consume("bookingqueue", message => {
            const input = JSON.parse(message.content.toString());
            channel.ack(message);
            console.log(input);
        });
    } catch (er) {
        console.log(er);
    }
}
connect();

async function bookSeat(seatNumber) {
    const result = await channel.sendToQueue(
        "paymentqueue",
        Buffer.from(JSON.stringify({ seat: seatNumber }))
    );
}

// Route handlers
app.get("/pay/:seatNumber", async (req, res) => {
    const { seatNumber } = req.params;

    bookSeat(seatNumber);
});

app.listen(PORT, () => console.log(`Server at ${PORT}`));

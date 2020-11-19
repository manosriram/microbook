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
            console.log(`Booking Received, ${JSON.stringify(input)}`);
            if (input.success === true) {
                connection.query(
                    "update seats set booked = 'T' where id = ?",
                    input.seat,
                    (err, result) => {
                        if (err) console.error(err);
                        else {
                            console.log("done");
                        }
                    }
                );
            }
            channel.ack(message);
        });
    } catch (er) {
        console.log(er);
    }
}
connect();

async function bookSeat(seatNumber) {
    return new Promise((resolve, reject) => {
        connection.query(
            "select * from seats where id = ? and booked='F'",
            seatNumber,
            (err, result) => {
                if (result[0]) {
                    channel.sendToQueue(
                        "paymentqueue",
                        Buffer.from(JSON.stringify({ seat: seatNumber }))
                    );
                    resolve(true);
                } else {
                    resolve(false);
                }
            }
        );
    });
}

// Route handlers
app.get("/pay/:seatNumber", async (req, res) => {
    let { seatNumber } = req.params;
    seatNumber = parseInt(seatNumber);
    if (seatNumber > 25 || seatNumber < 1)
        return res.send("Invalid Seat number");
    else if ((await bookSeat(seatNumber)) === false)
        return res.send("Seat not available");
    else return res.send("Seat booked!");
});

app.get("/", (req, res) => {
    connection.query("select * from seats", (err, result) => {
        return res.json(result);
    });
});

app.listen(PORT, () => console.log(`Server at ${PORT}`));

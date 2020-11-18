const express = require("express");
const app = express();
const PORT = 5002;
const amqp = require("amqplib");

async function connect() {
    const queueCon = await amqp.connect("amqp://localhost:5672");
    channel = await queueCon.createChannel();
    await channel.assertQueue("paymentqueue");

    const result = await channel.consume("paymentqueue", async message => {
        const input = JSON.parse(message.content.toString());
        console.log(input); // input.seat
        channel.ack(message);

        await channel.sendToQueue(
            "bookingqueue",
            Buffer.from(
                JSON.stringify({
                    seat: input.seat
                })
            )
        );
    });
}
connect();

app.listen(PORT, () => console.log(`Server at ${PORT}`));

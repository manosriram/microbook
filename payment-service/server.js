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
        console.log(`Payment Received, ${JSON.stringify(input)}`);
        channel.ack(message);

        // Payment processing, if succeeded; continue. Else, throw error.
        await channel.sendToQueue(
            "bookingqueue",
            Buffer.from(
                JSON.stringify({
                    seat: input.seat,
                    success: true
                })
            )
        );
    });
}
connect();

app.listen(PORT, () => console.log(`Server at ${PORT}`));

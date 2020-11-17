const express = require("express");
const app = express();
const PORT = 5002;

app.get("/", (req, res) => {
    res.send("Hello from payment service");
});

app.listen(PORT, () => console.log(`Server at ${PORT}`));

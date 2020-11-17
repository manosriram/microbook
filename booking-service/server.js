const express = require("express");
const app = express();
const PORT = 5001;

app.get("/", (req, res) => {
    res.send("Hello from booking service");
});

app.listen(PORT, () => console.log(`Server at ${PORT}`));

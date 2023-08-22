const bodyParser = require("body-parser");
const express = require("express");
const cors = require("cors");
const app = express();

const PORT = process.env.PORT || 4000;

app.use(bodyParser.urlencoded());
app.use(bodyParser.json());
app.use(cors());

globalThis.sseClients = {};

const sseResponse = (data, statusCode = 200) => {
    data = JSON.stringify({ status: statusCode, message: data });
    return `data: ${data}\n\n`;
};

app.get("/", (_, res) => res.status(200).send("Hello!"));

app.get("/events", (req, res) => {
    const { clientId } = req.query;
    if (!clientId) return res.status(422).json("Client ID is missing");

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("X-Accel-Buffering", "no");
    res.setHeader("Access-Control-Allow-Origin", "*");
    sseClients[clientId] = res;
    sseClients[clientId].write(sseResponse("success"));
});

app.post("/publish", (req, res) => {
    const { clientId } = req.query;
    if (!clientId) return res.status(422).json("Client ID is missing");

    const targetClient = sseClients[clientId];
    if (!targetClient) return res.status(404).json("Client not found");

    targetClient.write(sseResponse(req.body));
    res.status(200).json("Message published");
});

app.listen(PORT, () => console.log(`SSE Server started on port ${PORT}`));

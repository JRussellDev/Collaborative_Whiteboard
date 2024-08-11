// Module Imports
const express = require("express"); // Express Library
const http = require("http"); // HTTP Library
const socketIo = require("socket.io"); // Socket.IO library
const path = require("path"); // Path module

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let userCount = 0; // Initialize the user count

app.use(express.static("public"));

// Serve the default HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'cwb_WebPage.html')); // Serve your specific HTML file
});

io.on("connection", (socket) => {
    userCount++; // Increment user count
    console.log("User has connected");
    io.emit("userCount", userCount); // Broadcast the updated user count to all clients

    //listen for user drawing
    socket.on("draw", (data) => {
        socket.broadcast.emit("draw", data)
    });

    //listen for user clearing whiteboard
    socket.on("clear", () => {
    socket.broadcast.emit("clear")
    });

    socket.on("disconnect", () => {
        console.log("User disconnected");
        userCount--; // Decrement user count 
        io.emit("userCount", userCount); // Broadcast the updated user count to all clients
    });

});

// Define the port to listen on
const PORT = process.env.PORT || 3000;
// Start the server and listen on the defined port
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

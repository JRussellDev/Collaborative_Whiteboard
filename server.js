// Module Imports
const express = require("express"); // Express Library
const http = require("http"); // HTTP Library
const socketIo = require("socket.io"); // Socket.IO library
const path = require("path"); // Path module

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let userCount = 0; // Initialize the user count
const users = {};

app.use(express.static("public"));

// Serve the default HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'cwb_WebPage.html')); // Serve your specific HTML file
});

io.on("connection", (socket) => {
    console.log("User has connected");

    userCount++; // Increment user count
    users[socket.id] = {};
    io.emit("userConnected", { id: socket.id, userCount: userCount });
    
    for (let id in users){
        if (id !== socket.id){
            socket.emit("userConnected", { id, userCount: userCount });
        }
    }

    // Store user data
    users[socket.id] = {}; // Use an empty object to represent each user

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
       
        //Alert that user has left for functionality
        socket.broadcast.emit('userDisconnected', { id: socket.id, userCount: userCount});

        // Remove user data
        delete users[socket.id];
    });


    //Update other users mouse icon
    socket.on('mouseMove', (data) => {
        socket.broadcast.emit('mouseUpdate', {
            id: socket.id,
            x: data.x,
            y: data.y
        });
    });


}); 



// Define the port to listen on
const PORT = process.env.PORT || 3000;
// Start the server and listen on the defined port
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});



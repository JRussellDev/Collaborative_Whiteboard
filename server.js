// Module Imports
const express = require("express"); // Express Library
const http = require("http"); // HTTP Library
const socketIo = require("socket.io"); // Socket.IO library
const path = require("path"); // Path module

// Library Variable Setup
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// General Variable Setup
let userCount = 0; // Initialize the user count
const users = {};

let drawingCommands = [
{
    type: 'draw',
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
    color: '#FFFFFF',
    brushSize: 0
},
{
    type: "clear",
}
];


// User public directory for app data
app.use(express.static("public"));

// Serve the default HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'cwb_WebPage.html')); // Serve your specific HTML file
});


// On Client Connection
io.on("connection", (socket) => {
    
    console.log("User has connected");

    socket.emit('loadExistingDrawings', drawingCommands); // LOAD EXISTING DRAWINGS 

    userCount++; // Increment user count

    users[socket.id] = {}; // Save/set the new users socket id in list of users

    // Tell clients user has connected (sending their id and new user count)
    io.emit("userConnected", { id: socket.id, userCount: userCount });
    
    // For each user if the id of a user does not match THIS sockets id
    for (let id in users){
        if (id !== socket.id){
           
            // ALL existing mice
            socket.emit("userConnected", { id, userCount: userCount }); // Also pass through data of all drawing coordinates up until this point
           
            // ALL existing user names to add to list
            socket.emit("addUserListing", {
                id: id,
                name: users[id].name
            });
        }
    }

        // Notify all clients about the new user
        socket.on("userNameAdded", (data) => {
            const userName = data.name;
            users[socket.id].name = userName;
    
            // Notify all clients about the new user
            io.emit("addUserListing", {
                id: socket.id,
                name: userName
            });
        });


    //listen for user drawing
    socket.on("draw", (data) => {
        socket.broadcast.emit("draw", data) // Give the drawing coords that should be drawn for all other users TO all other users

        
        drawingCommands.push({
            type: 'draw',
            startX: data.x0,
            startY: data.y0,
            endX: data.x1,
            endY: data.y1,
            color: data.color,
            brushSize: data.size
        });

    });



    //listen for user clearing whiteboard
    socket.on("clear", () => {
    socket.broadcast.emit("clear")

    drawingCommands = []; // Clear the saved commands array

    });


    //Update other users mouse icon
    socket.on('mouseMove', (data) => {
        socket.broadcast.emit('mouseUpdate', {
            id: socket.id,
            x: data.x,
            y: data.y
        });
    });

    // On user disconnect
    socket.on("disconnect", () => {

        console.log("User disconnected");
        userCount--; // Decrement user count 
       
        //Alert clients that user has left (sending id and updated user count)
        socket.broadcast.emit('userDisconnected', { id: socket.id, userCount: userCount});
        
        // Remove user data
        delete users[socket.id];

        // if there are no users clear the board
        if (userCount <= 0)
        {
            drawingCommands = []; // Clear the saved commands array
        }
        

    });

}); 





// Define the port to listen on
const PORT = process.env.PORT || 3001;
// Start the server and listen on the defined port
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});



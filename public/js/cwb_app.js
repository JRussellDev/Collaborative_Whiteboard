// Connect to the Socket.IO server
const socket = io();

const canvas = document.getElementById("whiteboard");
const context = canvas.getContext("2d");

const eraseBtn = document.getElementById("erase-button");

let brushColor = document.getElementById("colorPicker");
brushColor.value = '#000000';
const brushSizePicker = document.getElementById("brushSize")
canvas.width = canvas.clientWidth;  // Set the drawing width to match the display width
canvas.height = 660;  // Set the drawing height

let isDrawing = false; // Bool to check if user is drawing/able to draw
let lastX = 0;
let lastY = 0;
let brushSize = 2;

let isErasing = false;
let lastBrushColour;
let lastBrushWidth;
const users = {}; // Store other mice positions

context.lineJoin = "round";
context.lineCap = "round";

document.addEventListener('DOMContentLoaded', function () {
    // Prompt the user for their name
    let userName = prompt("Please enter your name:");
    // Set a default name if no input is given
    if (!userName || userName.trim() === "") {
        userName = "Guest";
    }

    // Emit user name to server
    socket.emit('userNameAdded', { name: userName });

});

function updateBrushSize() { 
    brushSize = parseInt(brushSizePicker.value, 10); //Set brushSize to the value set in html for each brush option select
    console.log("brush size is now" + brushSize)
}


function enableEraseMode() {
    console.log(isErasing);
    if (!isErasing) {
        lastBrushWidth = brushSize
        brushSize = 20;
        lastBrushColor = brushColor.value;
        brushColor.value = '#FFFFFF';  // Use 'white' directly
        eraseBtn.style.borderColor = 'green';  // Use 'green' directly
        isErasing = true;
    } else {
        isErasing = false;
        brushSize = lastBrushWidth;
        brushColor.value = lastBrushColor;
        eraseBtn.style.borderColor = 'black';  // Use 'black' directly
    }
}

canvas.addEventListener('mousedown', (e) => {     // When mouse clicked over the canvas....
    
    if (e.button === 2) { // Right-click
        e.preventDefault(); // Prevent the default context menu
        context.clearRect(0, 0, canvas.width, canvas.height); // clear the canvas
        socket.emit("clear");

    } else if (e.button === 0) { // Left-click

        //Set drawing aesthetics
        context.strokeStyle = brushColor.value;
        context.lineWidth = brushSize;

        isDrawing = true;
        [lastX, lastY] = [e.offsetX, e.offsetY];

        context.beginPath();
        context.moveTo(e.offsetX, e.offsetY);
        context.lineTo(e.offsetX, e.offsetY);
        context.stroke();

        [lastX, lastY] = [e.offsetX, e.offsetY];

        // Emit dot drawing data to the server
        socket.emit('draw', {
        x0: lastX,
        y0: lastY,
        x1: e.offsetX,
        y1: e.offsetY,
        color: brushColor.value,
        size: brushSize
    });

        
        console.log("mouse down");
    }
  

});

canvas.addEventListener('mousemove', (e) => {
            
    //Transmit mouse positions whenever mouse is moved
    socket.emit('mouseMove', {
        x: e.offsetX,
        y: e.offsetY
    });

    if(!isDrawing) return; // Only draw if mouse is down

  
    // Draw lines on own whiteboard
    socket.emit('draw', {       // Emit (send) drawing data
        x0: lastX,
        y0: lastY,
        x1: e.offsetX,
        y1: e.offsetY,
        color: brushColor.value,
        size: brushSize

    });


    
    
    // Draw a dot when mouse clicks to enable dot drawing
    context.beginPath();
    context.moveTo(lastX, lastY);
    context.lineTo(e.offsetX, e.offsetY);
    context.stroke();
   
    // Update last mouse position
    [lastX, lastY] = [e.offsetX, e.offsetY];
    console.log("Should be drawing");
});


brushSizePicker.addEventListener('change', updateBrushSize); // When changing brush sizes, run update brush function


canvas.addEventListener("mouseup", () => isDrawing = false); // When mouse is lifted, stop ability to draw
canvas.addEventListener("mouseout", () => isDrawing = false); // When mouse leaves the canvas, stop ability to draw

eraseBtn.addEventListener("click", enableEraseMode);

// Prevent the context menu from appearing when right clicking
canvas.addEventListener('contextmenu', (e) => e.preventDefault());



// Listen for drawing data from other clients
socket.on('draw', (data) => {
    context.strokeStyle = data.color;
    context.lineWidth = data.size;
    context.lineJoin = "round";
    context.lineCap = "round";

    // Drawing clients drawing on own whiteboard
    context.beginPath();   // Begin a drawing path
    context.moveTo(data.x0, data.y0); // Find starting point (using clients last mouse position)
    context.lineTo(data.x1, data.y1); // Draw towards new client mouse position
    context.stroke();
});


socket.on("clear", () => { // When emitted "clear" function through server
    context.clearRect(0, 0, canvas.width, canvas.height); // clear the canvas
});



socket.on('mouseUpdate', (data) => {

    const mouseElement = users[data.id];

    if(mouseElement) {
        mouseElement.style.left = `${data.x + 282}px`; // Set clone mouse positions and fix offset
        mouseElement.style.top = `${data.y + 112}px`; 
    }

});


socket.on('userConnected', (data) => {
    const {id, userCount } = data;
    document.getElementById("userCountDisplay").textContent = `Users Connected: ${userCount}`;

    if(!users[data.id]) // Ensure not creating mouse for own user
    {
    // Create new mouse element for new user
    const mouseElement = document.createElement('div');
    mouseElement.className = 'mouse-icon';
    document.body.appendChild(mouseElement);
    mouseElement.id = `mouseElement-${data.id}`;
    mouseElement.style.height = '24px';
    mouseElement.style.width = '24px';
    users[data.id] = mouseElement;
    console.log(`Added new mouse for id: ${data.id}`)  
    }


});

// Remove the mouse icon when a user disconnects
socket.on('userDisconnected', (data) => {
    const {id, userCount } = data;
    document.getElementById("userCountDisplay").textContent = `Users Connected: ${userCount}`;
    const mouseElement = users[data.id];
    if (mouseElement) {
        mouseElement.remove();
        delete users[data.id];
    }

    // Delete users name lsiting
});

socket.on("addUserListing", (data) => {
    userID = data.id;
    userName = data.name;

    console.log("tried to add user listing");
    //Add user listing element
    const userListing = document.createElement('div');
    userListing.textContent = userName;
    document.getElementById("users-container").appendChild(userListing);
});

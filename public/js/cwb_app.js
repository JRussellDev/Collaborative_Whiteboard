// Connect to the Socket.IO server
const socket = io();


// HTML references
const canvas = document.getElementById("whiteboard");
const context = canvas.getContext("2d");
canvas.width = canvas.clientWidth;  // Set the drawing width to match the display width
canvas.height = 660;  // Set the drawing height

const brushSizePicker = document.getElementById("brushSize")

const brushColor = document.getElementById("colorPicker");
brushColor.value = '#000000'; // Initialize brush colour default as black

const eraseBtn = document.getElementById("erase-button");



// Variable creation
let isDrawing = false; // Bool to check if user is drawing/able to draw
let isErasing = false;

let lastX = 0;
let lastY = 0;
let brushSize = 2;

let lastBrushColour;
let lastBrushWidth;

const users = {}; // Store other mice positions

// Brush setup
context.lineJoin = "round";
context.lineCap = "round";


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

// CANVAS LISTENING
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

canvas.addEventListener("mouseup", () => isDrawing = false); // When mouse is lifted, stop ability to draw

canvas.addEventListener("mouseout", () => isDrawing = false); // When mouse leaves the canvas, stop ability to draw

canvas.addEventListener('contextmenu', (e) => e.preventDefault()); // Prevent the context menu from appearing when right clicking


// TOOLBAR LISTENING
window.onload = function() { // Wait for site to fully load
    let userName = prompt("Please enter your name:");
    // Set a default name if no input is given
    if (!userName || userName.trim() === "") {
        userName = "Guest";
    }

    // Emit user name to server
    socket.emit('userNameAdded', { name: userName });
};

brushColor.addEventListener('input', () => {
    if(isErasing)
        {
            isErasing = false;
            brushSize = lastBrushWidth;
            eraseBtn.style.borderColor = 'black';  // Use 'black' directly
        }
});

brushSizePicker.addEventListener('change', updateBrushSize); // When changing brush sizes, run update brush function

eraseBtn.addEventListener("click", enableEraseMode); // Run eraser function when eraser button clicked
   

socket.on("clear", () => { // When emitted "clear" function through server
    context.clearRect(0, 0, canvas.width, canvas.height); // clear the canvas
});

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

socket.on('mouseUpdate', (data) => {

    const mouseElement = users[data.id];

    if(mouseElement) {
        mouseElement.style.left = `${data.x + 282}px`; // Set clone mouse positions and fix offs et
        mouseElement.style.top = `${data.y + 112}px`; 
    }

});

 // Listen for user listing updates
 socket.on("addUserListing", (data) => {
    const { id, name } = data;
    console.log('Received user listing:', data);
        // Add or update user name in the list
        let userItem = document.getElementById(`user-${id}`);
        if (!userItem) {
            userItem = document.createElement("div");
            userItem.className = "userItem";
            userItem.id = `user-${id}`;
            document.getElementById("users-container").appendChild(userItem);
        }
        userItem.textContent = name;
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

    // Remove the user's name listing
    const userListing = document.getElementById(`user-${id}`);
    if (userListing) {
        userListing.remove(); // Correctly remove the element from the DOM
    }
});


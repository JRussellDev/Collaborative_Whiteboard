// Connect to the Socket.IO server
const socket = io();

socket.on("userCount", (count) =>{
document.getElementById("userCountDisplay").textContent = `Users Connected: ${count}`;
});

const canvas = document.getElementById("whiteboard");
const context = canvas.getContext("2d");

let brushColor = document.getElementById("colorPicker");
const brushSizePicker = document.getElementById("brushSize")
canvas.width = canvas.clientWidth;  // Set the drawing width to match the display width
canvas.height = 660;  // Set the drawing height

let isDrawing = false; // Bool to check if user is drawing/able to draw
let lastX = 0;
let lastY = 0;
let brushSize = 2;


context.lineJoin = "round";
context.lineCap = "round";

function updateBrushSize() { 
    brushSize = parseInt(brushSizePicker.value, 10); //Set brushSize to the value set in html for each brush option select
    console.log("brush size is now" + brushSize)
}


canvas.addEventListener('mousedown', (e) => {     // When mouse clicked over the canvas....
    
    if (e.button === 2) { // Right-click
        e.preventDefault(); // Prevent the default context menu
        context.clearRect(0, 0, canvas.width, canvas.height); // clear the canvas
        socket.emit("clear");

    } else if (e.button === 0) { // Left-click
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
    if(!isDrawing) return; // Only draw if mouse is down
    
    //Set drawing aesthetics
    context.strokeStyle = brushColor.value;
    context.lineWidth = brushSize;

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
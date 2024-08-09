// Connect to the Socket.IO server
const socket = io();

const canvas = document.getElementById("whiteboard");
const context = canvas.getContext("2d");
let brushColor = document.getElementById("colorPicker");
const brushSizePicker = document.getElementById("brushSize")
canvas.width = canvas.clientWidth;  // Set the drawing width to match the display width
canvas.height = 660;  // Set the drawing height


let isDrawing = false;
let lastX = 0;
let lastY = 0;

let brushSize = 2;

context.lineJoin = "round";
context.lineCap = "round";

function updateBrushSize() {
    brushSize = parseInt(brushSizePicker.value, 10);
    console.log("brush size is now" + brushSize)
}


canvas.addEventListener('mousedown', (e) => {     // When mouse clicked over the canvas....
    
    if (e.button === 2) { // Right-click
        e.preventDefault(); // Prevent the default context menu
        context.clearRect(0, 0, canvas.width, canvas.height); // clear the canvas

    } else if (e.button === 0) { // Left-click
        isDrawing = true;
        [lastX, lastY] = [e.offsetX, e.offsetY];

        context.beginPath();
        context.moveTo(e.offsetX, e.offsetY);
        context.lineTo(e.offsetX, e.offsetY);
        context.stroke();


        // Emit drawing data to the server
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

    // Start a drawing path
    context.beginPath();
    context.moveTo(lastX, lastY);
    context.lineTo(e.offsetX, e.offsetY);
    context.stroke();

    socket.emit('draw', {
        x0: lastX,
        y0: lastY,
        x1: e.offsetX,
        y1: e.offsetY,
        color: brushColor.value,
        size: brushSize

    });
                
    // Update last mouse position
    [lastX, lastY] = [e.offsetX, e.offsetY];
    console.log("Should be drawing");
});

brushSizePicker.addEventListener('change', updateBrushSize);

canvas.addEventListener("mouseup", () => isDrawing = false); // When mouse is lifted, stop ability to draw
canvas.addEventListener("mouseout", () => isDrawing = false); // When mouse leaves the canvas, stop ability to draw

// Prevent the context menu from appearing
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

// Listen for drawing data from other clients
socket.on('draw', (data) => {
    context.strokeStyle = data.color;
    context.lineWidth = data.size;
    context.lineJoin = "round";
    context.lineCap = "round";

    context.beginPath();
    context.moveTo(data.x0, data.y0);
    context.lineTo(data.x1, data.y1);
    context.stroke();
});

const canvas = document.getElementById("whiteboard");
const context = canvas.getContext("2d");
let brushColor = document.getElementById("colorPicker");

canvas.width = canvas.clientWidth;  // Set the drawing width to match the display width
canvas.height = 660;  // Set the drawing height


let isDrawing = false;
let lastX = 0;
let lastY = 0;

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
        
        console.log("mouse down");
    }
  

});

canvas.addEventListener('mousemove', (e) => {
    if(!isDrawing) return; // Only draw if mouse is down
    
    //Set drawing aesthetics
    context.strokeStyle = brushColor.value;
    context.lineWidth = 2;
    context.lineJoin = "round";
    context.lineCap = "round";

    // Start a drawing path
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

// Prevent the context menu from appearing
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

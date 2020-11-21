const display = document.getElementById('display');
const ctx = display.getContext('2d');
const WIDTH = display.width = 1024;
const HEIGHT = display.height = 1024;

var id = ctx.getImageData(0, 0, HEIGHT, HEIGHT);
var pixels = id.data;

function setPixel(x, y, r, g, b) {
    if (r instanceof vec3) {
        var off = (y * id.width + x) * 4;
        pixels[off] = r.x;
        pixels[off + 1] = r.y;
        pixels[off + 2] = r.z;
        pixels[off + 3] = 255;

        return;
    }

    var off = (y * id.width + x) * 4;
    pixels[off] = r;
    pixels[off + 1] = g;
    pixels[off + 2] = b;
    pixels[off + 3] = 255;
}

function drawScreen() {
    ctx.putImageData(id, 0, 0);
}

function init() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    for (let y = 0; y < HEIGHT; y++) {
        for (let x = 0; x < WIDTH; x++) {
            setPixel(x, y, new vec3(100));
        }
    }
    drawScreen();
}

init();

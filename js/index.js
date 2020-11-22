function trace(origin, d, elements, lights) {
    let minT = null;
    let minElem = null;
    for (let i = 0; i < elements.length; i++) {
        const elem = elements[i];

        let inter = elem.intersect(origin, d);

        if (inter === null) continue;

        if (inter.t < 0.01) continue;
        if (minT !== null && inter.t > minT.t) continue;

        minT = inter;
        minElem = elem;
    }

    if (minElem === null) return null;

    let color = minElem.color;

    if (minElem instanceof sphere) {
        let hitpoint = minT.hit;
    
        let fullLight = new vec3(0);
        for (let i = 0; i < lights.length; i++) {
            const l = lights[i];

            const rayToLight = l.pos.minus(hitpoint).norm();
            let angle = angle2vec3(minElem.normal(hitpoint), rayToLight);
            
            if (angle < 0) angle += Math.PI;
            if (angle > Math.PI) angle -= Math.PI;

            // let shadow = 1;
            // if (angle < Math.PI/4) 
            let shadow = map(angle, 0, Math.PI/2, 1, 0);

            if (shadow) {

                let t = null;
                for (let i = 0; i < elements.length; i++) {
                    if (t !== null) break;

                    const elem = elements[i];
                    if (elem == minElem) continue;
            
                    let rayToLight = l.pos.minus(hitpoint).norm();

                    // something to repair white lines on contact points with nears
                    hitpoint = hitpoint.minus(minElem.normal(hitpoint).mul(0.01));
                    let inter = elem.intersect(hitpoint, rayToLight);
                    
                    if (inter === null) continue;
            
                    if (inter.t < 0.01) continue;
            
                    t = inter.t;
                }
                if (t === null) {
                    fullLight = fullLight.plus(l.color.mul(l.power).mul(shadow));
                }
            }
        }
        
        color = color.mul(fullLight).div(255);
    }

    return color;
}

function render(pov, dir, fov, elements, lights) {
    let dist = 1 / Math.tan(rads(fov) * 0.5); // distance between pov and screen
    let a = HEIGHT / WIDTH; // aspect

    // corners of screen
    let d00 = new vec3(-1,  a, dist);
    let d01 = new vec3(-1, -a, dist);
    let d10 = new vec3( 1,  a, dist);
    let d11 = new vec3( 1, -a, dist);

    const bar = document.getElementById('progressBar');
    let arrY = []; for(let i = 0; i < HEIGHT; i++) arrY.push(i);
    arrY = arrY.sort(() => Math.random() - 0.5);
    function doStuff(i) {
        let y = arrY[i];
        bar.value = 100 * i / HEIGHT;
        // console.log(`line ${y+1}...`);
        // for (let x = 0; x < WIDTH; x++) {
        for (let x = 0; x < WIDTH; x++) {
            let u = x / (WIDTH - 1);
            let v = y / (HEIGHT - 1);

            let top = d00.lerp(d10, u);
            let bot = d01.lerp(d11, u);

            // ray direction
            let d = top.lerp(bot, v);
            d.z = dist;
            d = d.norm();

            // trace our ray
            const color = trace(pov, d, elements, lights);

            if (color === null) {
                // if we haven't hitpoint we just draw bg color
                setPixel(x, y, new vec3(64));
            } else {
                // or set color of our point
                setPixel(x, y, color);
            }

        }
        if (i < HEIGHT) {
            drawScreen();
            setTimeout(doStuff.bind(window, i + 1), 0);
        }
        else {

            console.log(`drawing...`);

            drawScreen();

            endTime = performance.now() - startTime;
            endTime = (endTime/1000).toFixed(2);
            console.log(`Render time: ${endTime}s`);

            lastRender.size = WIDTH;
            lastRender.time = endTime;
        }
    }
    
    doStuff(0);
}

let pov;
let dir;
let fov;
let elements = [];
let lights = [];
let lastRender = {
    time: undefined,
    size: undefined
};
let startTime;
let endTime;

const spheresInput = document.getElementById('extraSpheresInput');
const lightsInput = document.getElementById('extraLightsInput');

function defaultExtraInputs() {
    let sp = '';
    sp += '0 -500 2.5 255 255 255 499.7\n';
    sp += '0 0 2.3 255 63 127 0.3\n';
    sp += '-0.3 -0.15 2.1 127 191 255 0.15\n';
    spheresInput.value = sp;

    let li = '';
    li += '3.0 3.0 1.0 255 255 255 1\n';
    li += '-3.0 3.0 1.0 64 255 64 0.1\n';
    lightsInput.value = li;
}

function elementsParse() {
    elements = [];
    const spheresIn = spheresInput.value.split('\n').map(v => v.split(' '));
    spheresIn.forEach(v => {
        if (v.length !== 7) return;
        elements.push(new sphere(
            new vec3(v[0], v[1], v[2]),
            new vec3(v[3], v[4], v[5]),
            v[6]));
    });
    
    lights = [];
    const lightsIn = lightsInput.value.split('\n').map(v => v.split(' '));
    lightsIn.forEach(v => {
        if (v.length !== 7) return;
        lights.push(new light(
            new vec3(v[0], v[1], v[2]),
            new vec3(v[3], v[4], v[5]),
            v[6]));
    });

    const tri = new triangle(
        new vec3(0.2,0.3,1),
        new vec3(0.4,0.2,2),
        new vec3(-0.3,0.1,3),
        new vec3(255, 64, 64)
    );
    // elements.push(tri);
}

const settings = {
    fov: document.getElementById('fovInput'),
    wh: document.getElementById('whInput')
}

function updateSettings() {
    WIDTH = display.width = settings.wh.value;
    HEIGHT = display.height = settings.wh.value;
    id = ctx.getImageData(0, 0, HEIGHT, HEIGHT);
    pixels = id.data;

    pov = new vec3(0, 0, 0);
    dir = new vec3(0, 0, 1);
    fov = Number(settings.fov.value);
    
    elementsParse();
}

function onRenderButtonClick() {
    updateSettings();
    
    init();

    console.log('');
    console.log(`Size: ${WIDTH} x ${HEIGHT}`);
    
    if (lastRender.time !== undefined) {
        const current = lastRender.time * (WIDTH**2 / lastRender.size**2);
        console.log(`Estimated time of render: ${current}s`);
    }

    startTime = performance.now();
    render(pov, dir, fov, elements, lights);
}

defaultExtraInputs();

document.getElementById('button-render-start').addEventListener('click', onRenderButtonClick);

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

    let hitpoint = minT.hit;
   
    let maxLight = null;
    let maxLightObject = null
    for (let i = 0; i < lights.length; i++) {
        const l = lights[i];

        const rayToLight = l.pos.minus(hitpoint).norm();
        let angle = angle2vec3(minElem.normal(hitpoint), rayToLight);
        
        if (angle < 0) angle += Math.PI;
        if (angle > Math.PI) angle -= Math.PI;

        // let shadow = 1;
        // if (angle < Math.PI/4) 
        let shadow = map(angle, 0, Math.PI/2, 0, 1);

        if (maxLight === null || maxLight > shadow) {
            maxLight = shadow;
            maxLightObject = l;
        }
    }

    if (maxLight !== null) {
        let t = null;
        for (let i = 0; i < elements.length; i++) {
            if (t !== null) break;

            const elem = elements[i];
            if (elem == minElem) continue;
    
            let rayToLight = maxLightObject.pos.minus(hitpoint).norm();

            // something to repair white lines on contact points with nears
            hitpoint = hitpoint.minus(minElem.normal(hitpoint).mul(0.01));
            let inter = elem.intersect(hitpoint, rayToLight);
    
            if (inter === null) continue;
    
            if (inter.t < 0.01) continue;
    
            t = inter.t;
        }
        if (t === null) color = color.mul((1 - maxLight));
        else color = color.mul(0);
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

    const btn = document.getElementById('progressBar');
    function doStuff(i) {
        let y = i;
        btn.value = 100 * y / HEIGHT;
        // console.log(`line ${y+1}...`);
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

            // if we haven't color just go next
            if (color === null) continue;

            // or set color of our point
            setPixel(x, y, color);
        }
        if (i < HEIGHT) {
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
    // for (let y = 0; y < HEIGHT; y++) {
    //     btn.style.backgroundColor = `rgb(${255*y/HEIGHT}, 0, 0)`;
    //     // console.log(`line ${y+1}...`);
    //     for (let x = 0; x < WIDTH; x++) {
    //         let u = x / (WIDTH - 1);
    //         let v = y / (HEIGHT - 1);

    //         let top = d00.lerp(d10, u);
    //         let bot = d01.lerp(d11, u);

    //         // ray direction
    //         let d = top.lerp(bot, v);
    //         d.z = dist;
    //         d = d.norm();

    //         // trace our ray
    //         const color = trace(pov, d, elements, lights);

    //         // if we haven't color just go next
    //         if (color === null) continue;

    //         // or set color of our point
    //         setPixel(x, y, color);
    //     }
    // }
    // console.log(`drawing...`);

    // drawScreen();
}

let pov;
let dir;
let fov;
let elements;
let lights;
let lastRender = {
    time: undefined,
    size: undefined
};
let startTime;
let endTime;

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
    
    elements = [
        // ground
        new sphere(new vec3(0,     -500, 2.5), new vec3(255, 255, 255), 499.7),
        // spheres
        new sphere(new vec3( 0.0,     0, 2.3), new vec3(255,  63, 127),   0.3),
        new sphere(new vec3(-0.3, -0.15, 2.1), new vec3(127, 191, 255),   0.15)
    ];
    
    lights = [
        new light(new vec3(3.0, 3.0, 1.0), new vec3(255, 255, 255), 1),
    ];
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

document.getElementById('button-render-start').addEventListener('click', onRenderButtonClick);

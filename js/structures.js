function lerp(a, b, t) {
    return a + (b - a) * t;
}

function map(x, x0, x1, a, b) {
    const t = (x - x0) / (x1 - x0);
    return lerp(a, b, t);
}

function rnd() {
    return Math.random();
}

class vec3 {
    x;
    y;
    z;

    constructor(x, y, z) {
        if (x !== undefined && y === undefined && z === undefined) {
            y = x;
            z = x;
        }
        
        this.x = x;
        this.y = y;
        this.z = z;
    }

    get len() {
        return Math.sqrt(this.x**2 + this.y**2 + this.z**2);
    }

    norm() {
        return new vec3(this.x/this.len, this.y/this.len, this.z/this.len);
    }

    static random() {
        return new vec3(rnd(), rnd(), rnd());
    }

    lerp(b, t) {
        return new vec3(
            lerp(this.x, b.x, t),
            lerp(this.y, b.y, t),
            lerp(this.z, b.z, t)
        );
    }

    static lerp(a, b, t) {
        return new vec3(
            lerp(a.x, b.x, t),
            lerp(a.y, b.y, t),
            lerp(a.z, b.z, t)
        );
    }

    dotProduct(b) {
        return this.x * b.x + this.y * b.y + this.z * b.z;
        return new vec3(
            this.x * b.x,
            this.y * b.y,
            this.z * b.z
        );
    }

    static dotProduct(a, b) {
        return a.x * b.x + a.y * b.y + a.z * b.z;
        return new vec3(
            a.x * b.x,
            a.y * b.y,
            a.z * b.z
        );
    }

    plus(b) {
        if (!(b instanceof vec3)) {
            b = new vec3(b);
        }
        return new vec3(
            this.x + b.x,
            this.y + b.y,
            this.z + b.z
        );
    }

    minus(b) {
        if (!(b instanceof vec3)) {
            b = new vec3(b);
        }
        return new vec3(
            this.x - b.x,
            this.y - b.y,
            this.z - b.z
        );
    }

    mul(b) {
        if (!(b instanceof vec3)) {
            b = new vec3(b);
        }
        return new vec3(
            this.x * b.x,
            this.y * b.y,
            this.z * b.z
        );
    }

    div(b) {
        if (!(b instanceof vec3)) {
            b = new vec3(b);
        }
        return new vec3(
            this.x / b.x,
            this.y / b.y,
            this.z / b.z
        );
    }
}

class sphere {
    pos;
    color;
    size;

    constructor(pos, color, size) {
        this.pos = pos;
        this.color = color;
        this.size = size;
    }

    get size2() {
        return this.size ** 2;
    }

    normal(hit) {
        return hit.minus(this.pos).norm();
    }

    intersect(origin, dir) {
        let L = this.pos.minus(origin);

        let tca = L.dotProduct(dir);
        if (tca < 0) return null;
        let d2 = L.dotProduct(L) - tca**2;
        if (d2 > this.size2) return null;
        let thc = Math.sqrt(this.size2 - d2);

        let t0 = tca - thc;
        let t1 = tca + thc;

        if (t0 > t1) {
            let tmp = t0;
            t0 = t1;
            t1 = tmp;
        }

        if (t0 < 0) {
            t0 = t1; // if t0 is negative, let's use t1 instead
            if (t0 < 0) return null; // both t0 and t1 are negative
        }
    
        let t = t0;

        return {
            t,
            hit: new vec3(
                origin.x + dir.x * t,
                origin.y + dir.y * t,
                origin.z + dir.z * t
            )
        }
    }
}

class light {
    pos;
    color;
    power;

    constructor(pos, color, power) {
        this.pos = pos;
        this.color = color;
        this.power = power;
    }
}

function degs(radians) {
    return radians * (180 / Math.PI);
}

function rads(degrees) {
    return degrees * (Math.PI / 180);
}

function angle2vec3(a, b) {
    return 2 * Math.atan((a.minus(b)).len/(a.plus(b)).len);
}

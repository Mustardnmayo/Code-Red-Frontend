import Graphics from ".";

class Propegator {

    static timeSteps = [];

    static asteroid = { x: 0, y: 3, z: 0};
    static planet = { x: 0, y: 0, z: 0};

    static asteroidPhysicsLocation = { x: 0, y: 8000 * 1000, z: 0};
    static planetPhysicsLocation = { x: 0, y: 0, z: 0};

    static asteroidAcceleration = { x: 0, y: 0, z: 0};
    static asteroidVelocity = { x: 3000, y: 0, z: 2000};
    static asteroidDiameter = 50;
    //static asteroidVelocity = { x: 4500, y: 0, z: 4500};

    static planetPhysicsRadius = 6371 * 1000; //m
    static planetVisualizationRadius = 2;

    static visToPhysics = this.planetPhysicsRadius/this.planetVisualizationRadius;
    static PhysicsToVis = this.planetVisualizationRadius/this.planetPhysicsRadius;

    static earthMass = 5.972e24;
    static asteroidMass = 1200;
    static gravitationalConstant = 6.67e-11;

    // -1: no collision
    // positive: time step of collision
    static collided = -1;

    static timeStep = 10; //s

    static resultsCloseButton = document.getElementById("resultsCloseButton");
    static resultsMenu = document.getElementById("resultsMenu");

    static latitudeText = document.getElementById("latitudeText");
    static longitudeText = document.getElementById("longitudeText");

    static resultsSetup() {
        resultsCloseButton.addEventListener('click', () => {
            resultsMenu.classList.add("hidden");
        });
    }

    static setup() {
        this.asteroid.x = this.asteroidPhysicsLocation.x * this.PhysicsToVis;
        this.asteroid.y = this.asteroidPhysicsLocation.y * this.PhysicsToVis;
        this.asteroid.z = this.asteroidPhysicsLocation.z * this.PhysicsToVis;

        console.log(this.asteroid);

        this.addTimeStep();
        Graphics.changeAsteroidPosition(this.asteroid);
    }


    static displayNextStep(step) {
        let position = this.loadNextStep(step);
        Graphics.changeAsteroidPosition(position);
        return position;
    }

    static loadNextStep(step) {
        if(step <= (this.timeSteps.length - 1)) {
            return this.timeSteps[step];
        } else {
            while((this.timeSteps.length - 1) < step) {
                this.calculateNewTimeStep();
            }
            return this.timeSteps[step];
        }
    }

    static calculateNewTimeStep() {

        if(this.collided == -1) {
            if(this.distance3D(this.asteroidPhysicsLocation, this.planetPhysicsLocation) < this.planetPhysicsRadius) {
                this.collided = this.timeSteps.length;
                let results = this.cartesianToLatLon(this.asteroidPhysicsLocation);
                this.showResults(results.latitude, results.longitude);
                console.log(this.asteroidPhysicsLocation);
            }

            this.addTimeStep();

            this.previousAsteroidAcceleration = this.asteroidAcceleration;

            let gravityForce = this.calculateGravitationalForce(this.planetPhysicsLocation, this.earthMass, this.asteroidPhysicsLocation, this.asteroidMass, this.gravitationalConstant);
            let acceleration =  -(gravityForce / this.asteroidMass);

            this.positionVelocityVerlet(this.timeStep);
            let accelerationComponents = this.calculateAccelerationComponents(this.asteroidPhysicsLocation, this.planetPhysicsLocation, acceleration);
            this.asteroidAcceleration = accelerationComponents;
            this.velocityVelocityVerlet(this.timeStep);

            this.asteroid.x = this.asteroidPhysicsLocation.x * this.PhysicsToVis;
            this.asteroid.y = this.asteroidPhysicsLocation.y * this.PhysicsToVis;
            this.asteroid.z = this.asteroidPhysicsLocation.z * this.PhysicsToVis;
        } else {
            this.addTimeStep();
        }
    }

    static addTimeStep() {
        let object = { x: this.asteroid['x'], y: this.asteroid['y'], z: this.asteroid['z'] };
        this.timeSteps.push(object);
    }

    static calculateGravitationalForce(pos1, mass1, pos2, mass2, gravitationalConstant) {
        let distance = this.distance3D(pos2, pos1);

        return gravitationalConstant * ((mass1 * mass2) / (distance * distance));
    }

    static distance3D(position1, position2) {
        const dx = position2.x - position1.x;
        const dy = position2.y - position1.y;
        const dz = position2.z - position1.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    static calculateAccelerationComponents(position1, position2, magnitude) {
        let displacement = {
            x: position2.x - position1.x,
            y: position2.y - position1.y,
            z: position2.z - position1.z
        };
    
        let distance = Math.sqrt(displacement.x ** 2 + displacement.y ** 2 + displacement.z ** 2);
    
        if (distance === 0) {
            return { x: 0, y: 0, z: 0 };
        }
    
        let unitVector = {
            x: displacement.x / distance,
            y: displacement.y / distance,
            z: displacement.z / distance
        };
    
        let accelerationComponents = {
            x: -unitVector.x * magnitude,
            y: -unitVector.y * magnitude,
            z: -unitVector.z * magnitude
        };
    
        return accelerationComponents;
    }

    static positionVelocityVerlet(timeStep) {
        this.asteroidPhysicsLocation.x += (this.asteroidVelocity.x * timeStep) + (0.5 * this.asteroidAcceleration.x * (timeStep * timeStep));
        this.asteroidPhysicsLocation.y += (this.asteroidVelocity.y * timeStep) + (0.5 * this.asteroidAcceleration.y * (timeStep * timeStep));
        this.asteroidPhysicsLocation.z += (this.asteroidVelocity.z * timeStep) + (0.5 * this.asteroidAcceleration.z * (timeStep * timeStep));
    }

    static velocityVelocityVerlet(timeStep) {
        this.asteroidVelocity.x += 0.5 * (this.previousAsteroidAcceleration.x + this.asteroidAcceleration.x) * timeStep;
        this.asteroidVelocity.y += 0.5 * (this.previousAsteroidAcceleration.y + this.asteroidAcceleration.y) * timeStep;
        this.asteroidVelocity.z += 0.5 * (this.previousAsteroidAcceleration.z + this.asteroidAcceleration.z) * timeStep;
    }

    static cartesianToLatLon(cartesian) {
        const X = cartesian.x;
        const Y = -cartesian.z; // fixed sign and axis: y -> z, negated
        const Z = cartesian.y;  // fixed axis: z -> y

        if (![X, Y, Z].every(Number.isFinite)) throw new Error('cartesian must contain finite x,y,z');

        const a = 6378137.0;
        const f = 1 / 298.257223563;
        const e2 = 2 * f - f * f;

        const p = Math.hypot(X, Y);
        if (p === 0 && Z === 0) return { latitude: 0, longitude: 0 };

        let lonDeg = Math.atan2(Y, X) * 180 / Math.PI;
        if (lonDeg <= -180) lonDeg += 360;
        if (lonDeg > 180) lonDeg -= 360;

        const theta = Math.atan2(Z * a, p * a * (1 - f));
        const sinT = Math.sin(theta);
        const cosT = Math.cos(theta);

        let lat = Math.atan2(
            Z + e2 * (1 - f) * a * Math.pow(sinT, 3),
            p - e2 * a * Math.pow(cosT, 3)
        );

        for (let i = 0; i < 3; i++) {
            const sinLat = Math.sin(lat);
            const N = a / Math.sqrt(1 - e2 * sinLat * sinLat);
            const h = p / Math.cos(lat) - N;
            const latNext = Math.atan2(Z, p * (1 - e2 * N / (N + h)));
            if (Math.abs(latNext - lat) < 1e-14) { lat = latNext; break; }
            lat = latNext;
        }

        return { latitude: lat * 180 / Math.PI, longitude: lonDeg };
        }


    static showResults(latitude, longitude) {
        this.latitudeText.innerText = "Latitude: " + Math.floor(latitude);
        this.longitudeText.innerText = "Longitude: " + Math.floor(longitude);
        this.resultsMenu.classList.remove("hidden");
    }

    static gURL = 'https://pnasaspaceapp-production.up.railway.app/';


    static async createMeteor(id, x, y, z, vx, vy, vz, weight, long, lat, diameter, name) {
        const meteor = {
            x: x,
            y: y,
            z: z,
            vx: vx,
            vy: vy,
            vz: vz,
            weight: weight,
            long: long,
            lat: lat,
            diameterM: diameter,
            name: name
        };

        const url = this.gURL + `createMeteor/${id}`;
        try {
            const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(meteor)   
            });

            if (!response.ok) throw new Error(`HTTP error | status: ${response.status}`);
            const data = await response.json();
            console.log(data);
            return data;
        } catch (err) {
            console.error(err);
        }
    }

    static async getMeteor(id) {
        try{
        const response = await fetch(gURL + `getMeteor/${id}`);
        if (!response.ok) throw new Error(`HTTP error | status: ${response.status}`);
        const data = await response.json();
        console.log(data);
        return data;
        }
        catch(err){
        console.error(err);
    }
    }

    static async calculateMeteor(id) {
        try{
            const response = await fetch(gURL + `calculate/${id}`);
            if (!response.ok) throw new Error(`HTTP error | status: ${response.status}`);
            const data = await response.json();
            console.log(data);
            return data;
            }
            catch(err){
            console.error(err);
        }
    }

}

Propegator.resultsSetup();

const meteor1 = {
  x: 200,
  y: 0,
  z: 0,
  vx: 10,
  vy: 15,
  vz: 20,
  weight: 1000,
  long: 0,
  lat: 0,
  diameterM: 5,
  name: "TestMeteor"
};

Propegator.createMeteor("meteor123", meteor1);

export default Propegator;
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import earthVertexShader from '../../3D/shaders/earth/vertex.glsl'
import earthFragmentShader from '../../3D/shaders/earth/fragment.glsl'

import asteroidVertexShader from '../../3D/shaders/asteroid/vertex.glsl'
import asteroidFragmentShader from '../../3D/shaders/asteroid/fragment.glsl'

import { step, normalWorldGeometry, output, texture, vec3, vec4, normalize, positionWorld, bumpMap, cameraPosition, color, uniform, mix, uv, max } from 'three/tsl';
import Propegator from './Propegator'

class Graphics {

	static canvas = document.querySelector( '#backdrop' );
	static scene = new THREE.Scene()
	static textureLoader = new THREE.TextureLoader()

	static sizes = {
		width: this.canvas.clientWidth,
		height: this.canvas.clientHeight,
		pixelRatio: Math.min(window.devicePixelRatio, 2)
	}

	// Textures
	static earthDayTexture = this.textureLoader.load('../../3D/textures/earth/day.jpg')
	static earthNightTexture = this.textureLoader.load('../../3D/textures/earth/night.jpg')
	static earthSpecularCloudsTexture = this.textureLoader.load('../../3D/textures/earth/specularClouds.jpg')

	static asteroidTexture = this.textureLoader.load('../../3D/textures/asteroid/asteroidTexture.jpg')

	static asteroidGeometry = new THREE.SphereGeometry(0.1, 5, 5)
	static asteroidMaterial = new THREE.ShaderMaterial({
		vertexShader: asteroidVertexShader,
		fragmentShader: asteroidFragmentShader,
		uniforms:
		{
			uTexture: new THREE.Uniform(this.asteroidTexture),
		}
	})
	static asteroid = new THREE.Mesh(this.asteroidGeometry, this.asteroidMaterial)

	/**
	 * Earth
	 */
	// Mesh
	static earthGeometry = new THREE.SphereGeometry(2, 64, 64)
	static earthMaterial = new THREE.ShaderMaterial({
		vertexShader: earthVertexShader,
		fragmentShader: earthFragmentShader,
		uniforms:
		{
			uDayTexture: new THREE.Uniform(this.earthDayTexture),
			uNightTexture: new THREE.Uniform(this.earthNightTexture),
			uSpecularCloudsTexture: new THREE.Uniform(this.earthSpecularCloudsTexture)
		}
	})
	static earth = new THREE.Mesh(this.earthGeometry, this.earthMaterial)

	static sun = new THREE.DirectionalLight( '#ffffff', 2 );

	static camera = new THREE.PerspectiveCamera(25, this.sizes.width / this.sizes.height, 0.1, 1000)

	static controls = new OrbitControls(this.camera, this.canvas)

	static setup() {
		this.asteroid.position.x = Propegator.asteroid.x;
		this.asteroid.position.y = Propegator.asteroid.y;
		this.asteroid.position.z = Propegator.asteroid.z;

		this.asteroidTexture.colorSpace = THREE.SRGBColorSpace
		this.asteroidTexture.wrapS = THREE.RepeatWrapping;
		this.asteroidTexture.wrapT = THREE.RepeatWrapping;
		this.asteroidTexture.repeat.set(2, 2);
		this.scene.add(this.asteroid)

		this.earthDayTexture.colorSpace = THREE.SRGBColorSpace
		this.earthNightTexture.colorSpace = THREE.SRGBColorSpace
		this.scene.add(this.earth)

		this.sun.position.set( 0, 0, 3 );
		this.scene.add( this.sun );

		this.camera.position.x = 12
		this.camera.position.y = 5
		this.camera.position.z = 4
		this.scene.add(this.camera)

		this.controls.enablePan = false;
		this.controls.enableDamping = true;
		this.controls.target.set(this.asteroid.position.x, this.asteroid.position.y, this.asteroid.position.z);
	}

	static run() {

		let canvas = this.canvas;
		let scene = this.scene;

		/**
		 * Sizes
		 */

		// uniforms

		const atmosphereDayColor = uniform( color( '#4db2ff' ) );
		const atmosphereTwilightColor = uniform( color( '#bc490b' ) );
		const roughnessLow = uniform( 0.25 );
		const roughnessHigh = uniform( 0.35 );

		// fresnel

		const viewDirection = positionWorld.sub( cameraPosition ).normalize();
		const fresnel = viewDirection.dot( normalWorldGeometry ).abs().oneMinus().toVar();

		// sun orientation

		const sunOrientation = normalWorldGeometry.dot( normalize( this.sun.position ) ).toVar();

		// atmosphere color

		const atmosphereColor = mix( atmosphereTwilightColor, atmosphereDayColor, sunOrientation.smoothstep( - 0.25, 0.75 ) );

		/*const atmosphereMaterial = new THREE.MeshBasicMaterial( { side: THREE.BackSide, transparent: true } );
		let alpha = fresnel.remap( 0.73, 1, 1, 0 ).pow( 3 );
		alpha = alpha.mul( sunOrientation.smoothstep( - 0.5, 1 ) );
		atmosphereMaterial.outputNode = vec4( atmosphereColor, alpha );

		const atmosphere = new THREE.Mesh( sphereGeometry, atmosphereMaterial );
		atmosphere.scale.setScalar( 1.04 );
		scene.add( atmosphere );*/

		/**
		 * Camera
		 */
		// Base camera

		/**
		 * Renderer
		 */
		const renderer = new THREE.WebGLRenderer({
			canvas: this.canvas,
			antialias: true
		})
		renderer.setSize(this.sizes.width, this.sizes.height)
		renderer.setPixelRatio(this.sizes.pixelRatio)
		renderer.setClearColor('#000011')

		/**
		 * Animate
		 */
		const clock = new THREE.Clock()

		const tick = () =>
		{
			const elapsedTime = clock.getElapsedTime()

			if ( resizeRendererToDisplaySize( renderer ) ) {

				const canvas = renderer.domElement;
				this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
				this.camera.updateProjectionMatrix();

			}

			//earth.rotation.y = elapsedTime * 0.1

			// Update controls
			this.controls.update()

			// Render
			renderer.render(this.scene, this.camera)

			// Call tick again on the next frame
			window.requestAnimationFrame(tick)
		}

		tick()

		window.addEventListener('resize', () =>
		{
			// Update sizes
			this.sizes.width = canvas.clientWidth
			this.sizes.height = canvas.clientHeight
			this.sizes.pixelRatio = Math.min(window.devicePixelRatio, 2)

			// Update camera
			this.camera.aspect = this.sizes.width / this.sizes.height
			this.camera.updateProjectionMatrix()

			// Update renderer
			renderer.setSize(this.sizes.width, this.sizes.height)
			renderer.setPixelRatio(this.sizes.pixelRatio)
		})

		function resizeRendererToDisplaySize( renderer ) {

			const canvas = renderer.domElement;
			const pixelRatio = window.devicePixelRatio;
			const width = Math.floor( canvas.clientWidth * pixelRatio );
			const height = Math.floor( canvas.clientHeight * pixelRatio );
			const needResize = canvas.width !== width || canvas.height !== height;
			if ( needResize ) {

				renderer.setSize( width, height, false );

			}

			return needResize;

		}

		/*

					import * as THREE from 'three/webgpu';
					import { step, normalWorldGeometry, output, texture, vec3, vec4, normalize, positionWorld, bumpMap, cameraPosition, color, uniform, mix, uv, max } from 'three/tsl';

					import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
					import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

					let camera, scene, renderer, controls, globe, clock;

					init();

					function init() {

						clock = new THREE.Clock();

						camera = new THREE.PerspectiveCamera( 25, window.innerWidth / window.innerHeight, 0.1, 100 );
						camera.position.set( 4.5, 2, 3 );

						scene = new THREE.Scene();

						// sun

						const sun = new THREE.DirectionalLight( '#ffffff', 2 );
						sun.position.set( 0, 0, 3 );
						scene.add( sun );

						// uniforms

						const atmosphereDayColor = uniform( color( '#4db2ff' ) );
						const atmosphereTwilightColor = uniform( color( '#bc490b' ) );
						const roughnessLow = uniform( 0.25 );
						const roughnessHigh = uniform( 0.35 );

						// textures

						const textureLoader = new THREE.TextureLoader();

						const dayTexture = textureLoader.load( './textures/planets/earth_day_4096.jpg' );
						dayTexture.colorSpace = THREE.SRGBColorSpace;
						dayTexture.anisotropy = 8;

						const nightTexture = textureLoader.load( './textures/planets/earth_night_4096.jpg' );
						nightTexture.colorSpace = THREE.SRGBColorSpace;
						nightTexture.anisotropy = 8;

						const bumpRoughnessCloudsTexture = textureLoader.load( './textures/planets/earth_bump_roughness_clouds_4096.jpg' );
						bumpRoughnessCloudsTexture.anisotropy = 8;

						// fresnel

						const viewDirection = positionWorld.sub( cameraPosition ).normalize();
						const fresnel = viewDirection.dot( normalWorldGeometry ).abs().oneMinus().toVar();

						// sun orientation

						const sunOrientation = normalWorldGeometry.dot( normalize( sun.position ) ).toVar();

						// atmosphere color

						const atmosphereColor = mix( atmosphereTwilightColor, atmosphereDayColor, sunOrientation.smoothstep( - 0.25, 0.75 ) );

						// globe

						const globeMaterial = new THREE.MeshStandardNodeMaterial();

						const cloudsStrength = texture( bumpRoughnessCloudsTexture, uv() ).b.smoothstep( 0.2, 1 );

						globeMaterial.colorNode = mix( texture( dayTexture ), vec3( 1 ), cloudsStrength.mul( 2 ) );

						const roughness = max(
							texture( bumpRoughnessCloudsTexture ).g,
							step( 0.01, cloudsStrength )
						);
						globeMaterial.roughnessNode = roughness.remap( 0, 1, roughnessLow, roughnessHigh );

						const night = texture( nightTexture );
						const dayStrength = sunOrientation.smoothstep( - 0.25, 0.5 );

						const atmosphereDayStrength = sunOrientation.smoothstep( - 0.5, 1 );
						const atmosphereMix = atmosphereDayStrength.mul( fresnel.pow( 2 ) ).clamp( 0, 1 );

						let finalOutput = mix( night.rgb, output.rgb, dayStrength );
						finalOutput = mix( finalOutput, atmosphereColor, atmosphereMix );

						globeMaterial.outputNode = vec4( finalOutput, output.a );

						const bumpElevation = max(
							texture( bumpRoughnessCloudsTexture ).r,
							cloudsStrength
						);
						globeMaterial.normalNode = bumpMap( bumpElevation );

						const sphereGeometry = new THREE.SphereGeometry( 1, 64, 64 );
						globe = new THREE.Mesh( sphereGeometry, globeMaterial );
						scene.add( globe );

						// atmosphere

						const atmosphereMaterial = new THREE.MeshBasicNodeMaterial( { side: THREE.BackSide, transparent: true } );
						let alpha = fresnel.remap( 0.73, 1, 1, 0 ).pow( 3 );
						alpha = alpha.mul( sunOrientation.smoothstep( - 0.5, 1 ) );
						atmosphereMaterial.outputNode = vec4( atmosphereColor, alpha );

						const atmosphere = new THREE.Mesh( sphereGeometry, atmosphereMaterial );
						atmosphere.scale.setScalar( 1.04 );
						scene.add( atmosphere );

						// debug

						const gui = new GUI();

						gui
							.addColor( { color: atmosphereDayColor.value.getHex( THREE.SRGBColorSpace ) }, 'color' )
							.onChange( ( value ) => {

								atmosphereDayColor.value.set( value );

							} )
							.name( 'atmosphereDayColor' );

						gui
							.addColor( { color: atmosphereTwilightColor.value.getHex( THREE.SRGBColorSpace ) }, 'color' )
							.onChange( ( value ) => {

								atmosphereTwilightColor.value.set( value );

							} )
							.name( 'atmosphereTwilightColor' );

						gui.add( roughnessLow, 'value', 0, 1, 0.001 ).name( 'roughnessLow' );
						gui.add( roughnessHigh, 'value', 0, 1, 0.001 ).name( 'roughnessHigh' );

						// renderer

						renderer = new THREE.WebGPURenderer();
						renderer.setPixelRatio( window.devicePixelRatio );
						renderer.setSize( window.innerWidth, window.innerHeight );
						renderer.setAnimationLoop( animate );
						document.body.appendChild( renderer.domElement );

						// controls

						controls = new OrbitControls( camera, renderer.domElement );
						controls.enableDamping = true;
						controls.minDistance = 0.1;
						controls.maxDistance = 50;

						window.addEventListener( 'resize', onWindowResize );

					}

					function onWindowResize() {

						camera.aspect = window.innerWidth / window.innerHeight;
						camera.updateProjectionMatrix();

						renderer.setSize( window.innerWidth, window.innerHeight );

					}

					async function animate() {

						const delta = clock.getDelta();
						globe.rotation.y += delta * 0.025;
					
						controls.update();

						renderer.render( scene, camera );

					}

		*/

	}

	static changeAsteroidPosition(object) {
		let oldPosition = this.asteroid.position;

		let shiftX = object.x - oldPosition.x;
		let shiftY = object.y - oldPosition.y;
		let shiftZ = object.z - oldPosition.z;

		this.asteroid.position.x = object.x;
		this.asteroid.position.y = object.y;
		this.asteroid.position.z = object.z;

		// Controls
		this.controls.target.set(this.asteroid.position.x, this.asteroid.position.y, this.asteroid.position.z);
		this.camera.position.x += shiftX;
		this.camera.position.y += shiftY;
		this.camera.position.z += shiftZ;
	}
}

export default Graphics;

Graphics.setup();
Graphics.run();

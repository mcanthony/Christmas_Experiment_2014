// SceneSand.js

(function() {

	var random = function(min, max) { return min + Math.random() * (max - min); }

	SceneSand = function(particles) {
		this.particles = particles;
		Scene.call(this);
		this.camera.setPerspective(45, window.innerWidth/window.innerHeight, 5, 5000);
		GL.gl.disable(GL.gl.DEPTH_TEST);
		this.hasSaved = false;
		this.hasCard = false;
		this._isCardReady = false;
	}

	var p = SceneSand.prototype = new Scene();
	var s = Scene.prototype;

	p._initTextures = function() {
		console.debug( "INIT TEXTURES" );
		this.texBg 		= new GLTexture(images["bg"]);
		this.texCard 	= new GLTexture(images["card"]);
		this.fboCurrent = new Framebuffer(512*2, 512*2, GL.gl.NEAREST, GL.gl.NEAREST);
		this.fboTarget  = new Framebuffer(512*2, 512*2, GL.gl.NEAREST, GL.gl.NEAREST);
	};

	p._initViews = function() {
		this._vBg   = new ViewBg("assets/shaders/copy.vert", "assets/shaders/copyWithAlpha.frag");
		this._vCal    = new ViewForce();
		this._vCard   = new ViewCard();


		// scheduler.defer(this, this.createViewSave, []);
		// scheduler.defer(this, this.createViewRender, []);

		new TWEEN.Tween(this._vBg).to({"alpha":1}, 3000).easing(TWEEN.Easing.Cubic.In).start();
	};


	p.setImagesData = function(data) {
		this.particles = data;
		this.hasSaved = false;
		this._isCardReady = false;
		scheduler.defer(this, this.createViewSave, []);
		scheduler.defer(this, this.createViewRender, []);
		scheduler.defer(this, this._checkHaveCard, []);

		//	NEED TO RESET EVERYTHING, UNIFORMS
		//	PLAYING INTRO / OUTRO
	};


	p.createViewSave = function() {
		this._vSave   = new ViewSave(this.particles);
	};


	p.createViewRender = function(parameters) {
		this._vRender = new ViewRender(this.particles);
		// new TWEEN.Tween(this._vBg).to({"alpha":1}, 3000).easing(TWEEN.Easing.Cubic.In).start();
	};


	p._checkHaveCard = function() {
		if(this.hasCard) this._hideCard();
		else this._showCard();
	};


	p._hideCard = function() {
		//	NEED TO LOCK THE CAMERA HERE
	};


	p._showCard = function() {
		console.debug( "Show Card" );
		this.hasCard = true;
		this._isCardReady = true;
	};


	p.render = function() {
		params.accOffset += (params.targetAccOffset - params.accOffset) * .5;
		// if(Math.random() > .9) console.log( params.accOffset );
		GL.gl.disable(GL.gl.DEPTH_TEST);
		if(!this.hasSaved && this._isCardReady) {
			this.fboCurrent.bind();
			GL.gl.viewport(0, 0, this.fboCurrent.width, this.fboCurrent.height);
			GL.gl.clearColor( 0.5, 0.5, 0.5, 1 );
			GL.gl.clear(GL.gl.COLOR_BUFFER_BIT | GL.gl.DEPTH_BUFFER_BIT);
			GL.setMatrices(this.cameraOtho);
			GL.rotate(this.rotationFront);
			this._vSave.render();
			this.fboCurrent.unbind();

			this.fboTarget.bind();
			GL.gl.clear(GL.gl.COLOR_BUFFER_BIT | GL.gl.DEPTH_BUFFER_BIT);
			this.fboTarget.unbind();

			GL.gl.clearColor( 0, 0, 0, 1 );
			GL.gl.viewport(0, 0, window.innerWidth, window.innerHeight);
			this.hasSaved = true;
			return;
		}

		
		//	RENDER THE FORCE
		if(this._isCardReady) {
			GL.gl.viewport(0, 0, this.fboCurrent.width, this.fboCurrent.height);
			GL.setMatrices(this.cameraOtho);
			GL.rotate(this.rotationFront);
			this.fboTarget.bind();
			GL.clear(0.5, 0.5, 0.5, 1.0);
			this._vCal.render( this.fboCurrent.getTexture() );
			this.fboTarget.unbind();
		}
		

		//	RENDER THE PARTICLES
		GL.gl.viewport(0, 0, window.innerWidth, window.innerHeight);
		var clear = 0;
		GL.clear(clear, clear, clear, 0.0);

		GL.setMatrices(this.cameraOtho);
		GL.rotate(this.rotationFront);
		this._vBg.render(this.texBg);


		if(this._isCardReady) {
			GL.gl.enable(GL.gl.DEPTH_TEST);
			GL.setMatrices(this.camera);
			GL.rotate(this.sceneRotation.matrix);
			this._vCard.render(this.texCard);
			this._vRender.render(this.fboTarget.getTexture());

			this.swapFbos();
		}

		
	};	


	p.swapFbos = function() {
		var tmp = this.fboTarget;
		this.fboTarget = this.fboCurrent;
		this.fboCurrent = tmp;
	};

})();
var gameObjects = {};
var gameScore = 0;
var gameState;
var countDown = 0;
var countDownTimer;

var PIPE_VELOCITY; // 管子移动速度
var BIRD_JUMP_VELOCITY = -450; // 点击后小鸟跳起高度
var BIRD_GRAVITY; // 小鸟的初始重力

var PIPE_GAP = 500;
var PIPE_SPACE = 700;

// game state
var GAME_READY = 1;
var GAME_PLAYING = 2;
var GAME_OVER = 3;
var GAME_END = 4;

function startGame() {
	gameState = GAME_PLAYING;
	PIPE_GAP = 500;
	PIPE_SPACE = 700;
	PIPE_VELOCITY = -180;
	BIRD_GRAVITY = 780;
	gameObjects.bird.body.gravity.y = BIRD_GRAVITY;
	gameObjects.pipes.children.forEach(function(group) {
       	group.setAll('body.velocity.x', PIPE_VELOCITY);
    });
    gameObjects.readySprite.destroy();
    gameObjects.scoreText = game.add.bitmapText(15, 25, 'flappyFont', "score: " + gameScore, 44);
}

function gameOver() {
    gameState = GAME_OVER;
    gameObjects.pipes.children.forEach(function(group) {
        group.setAll('body.velocity.x', 0);
    });
    gameObjects.gameOver = game.add.sprite(game.width / 2, game.height / 2 - 50, 'gameover');
    gameObjects.gameOver.anchor.setTo(0.5, 1);
    gameObjects.gameOver.scale.setTo(2.5, 2.5);
    countDown = 3;
    gameObjects.countDown = game.add.bitmapText(game.width / 2, game.height / 2 + 80, 'flappyFont', '' + countDown, 120);
    gameObjects.countDown.anchor.setTo(0.5, 0.5);

    countDownTimer = game.time.events.loop(Phaser.Timer.SECOND, function() {
    	countDown--;
    	if (countDown > 0) {
    		gameObjects.countDown.text = '' + countDown;
    	} else {
			gameObjects.countDown.destroy();
			game.time.events.remove(countDownTimer);
			gameState = GAME_END;
    	}
    }, this);
}

function onTrigger() {
	switch (gameState) {
	case GAME_END:
		game.state.restart();
		gameState = GAME_READY;
		break;
	case GAME_READY:
		startGame();
		break;
	case GAME_PLAYING:
		gameObjects.bird.body.velocity.y = BIRD_JUMP_VELOCITY;
		break;
	case GAME_OVER:
		break;
	}
}

var socket = io.connect("http://localhost:3000");
socket.on('signal', function(obj) {
	onTrigger();
});

function createBird() {
  gameObjects.bird = game.add.sprite(game.width / 4, game.height / 4, 'bird');
  gameObjects.bird.scale.setTo(0.3, 0.3);
  gameObjects.bird.enableBody = true;
  gameObjects.bird.animations.add('flying', [0, 1, 2, 1], 10, true);
  gameObjects.bird.animations.play('flying');

  game.physics.arcade.enable(gameObjects.bird);
  gameObjects.bird.body.bounce.y = 0.2;
  //gameObjects.bird.body.gravity.y = 1250;
  gameObjects.bird.body.collideWorldBounds = true; 	
}

var mainState = {
  preload: function() {
    game.load.image('background', 'assets/background.png');
    game.load.image('topPipe', 'assets/top_pipe.png');
    game.load.image('bottomPipe', 'assets/bottom_pipe.png');
    game.load.image('ready', 'assets/ready.png');
    game.load.image('gameover', 'assets/gameover.png');
    game.load.bitmapFont('flappyFont', 'assets/fonts/font.png', 'assets/fonts/font.fnt');

    game.load.spritesheet('bird', 'assets/bird.png', 156, 129);
  },
  create: function() {
    function getNewTop() {
      return game.rnd.integerInRange(20, game.height - 20 - PIPE_GAP);
    }

    function getTopPipeHeightScale(startPoint) {
    	return startPoint / 608;
    }

    function getBottomPipeHeightScale(startPoint) {
    	var  realH = game.height - startPoint;
    	return realH / 608;
    }

    game.input.addPointer();
    game.physics.startSystem(Phaser.Physics.ARCADE);

    gameObjects.background = game.add.tileSprite(0, 0, game.width, 960, 'background');
    gameObjects.background.scale.setTo(1, game.height / 960);

    gameObjects.pipes = game.add.group();
    game.physics.arcade.enable(gameObjects.pipes);

    var lastPipeIndex = 5;

    for (var i = 0; i < 6; i++) {
      var topPipeY = getNewTop();
      var scale = 0.6;

      var pipeGroup = game.make.group();
      game.physics.arcade.enable(pipeGroup);

      var topPipe = pipeGroup.create(
        game.width * 3 / 4 + i * PIPE_SPACE,
        topPipeY,
        'topPipe'
      );
      topPipe.anchor.setTo(0, 1);
      topPipe.name = 'topPipe' + i;
      topPipe.scale.setTo(scale, getTopPipeHeightScale(topPipeY));
      game.physics.arcade.enable(topPipe);

      topPipe.events.onOutOfBounds.add(function(pipe) {
      	if ((pipe.position.x + (108 * scale)) <  (game.width / 4)) {
      		gameScore += 1;
      		gameObjects.scoreText.text = "score: " + gameScore;

      		gameObjects.bird.body.gravity.y = ++BIRD_GRAVITY;
			gameObjects.pipes.children.forEach(function(group) {
       			group.setAll('body.velocity.x', --PIPE_VELOCITY);
    		});



    		if(gameScore>=6){
    			if ((gameScore % 5) == 0) {
    				PIPE_GAP = PIPE_GAP-30;
	    			if (PIPE_GAP<=350) {
	    				PIPE_GAP=350;
	    			}
					PIPE_SPACE = PIPE_SPACE-30;
					if(PIPE_SPACE<=500){
	    				PIPE_SPACE=500;
	    			}
    			}
				
			}

      	}

        if (pipe.position.x < 0) {
          var pipeIndex = pipe.name[pipe.name.length - 1];
          var outOfBoundsPipeGroup = gameObjects.pipes.children[pipeIndex];
          var lastTopPipe = gameObjects.pipes.children[lastPipeIndex].children[0];
          var newTopPipeX = lastTopPipe.position.x + PIPE_SPACE;

          var outOfBoundsPipes = outOfBoundsPipeGroup.children;
          var newTopPipeY = getNewTop();

          outOfBoundsPipeGroup.forEach(function(pipe) {
            if (pipe.name.startsWith("top")) {
              pipe.position.x = newTopPipeX;
              pipe.position.y = newTopPipeY;
              pipe.scale.setTo(scale, getTopPipeHeightScale(newTopPipeY));
            } else {
              pipe.position.x = newTopPipeX - 2;
              pipe.position.y = newTopPipeY + PIPE_GAP;
              pipe.scale.setTo(scale, getBottomPipeHeightScale(newTopPipeY + PIPE_GAP));
            }
          });

          lastPipeIndex = (lastPipeIndex + 1) % 6;
        }
      });

      var bottomPipe = pipeGroup.create(
        game.width * 3 / 4 - 2 + i * PIPE_SPACE,
        topPipeY + PIPE_GAP,
        'bottomPipe'
      );
      bottomPipe.anchor.setTo(0, 0);
      bottomPipe.name = 'bottomPipe' + i;
      bottomPipe.scale.setTo(scale, getBottomPipeHeightScale(topPipeY + PIPE_GAP));
      game.physics.arcade.enable(bottomPipe);

      pipeGroup.setAll('body.immovable', true);
      pipeGroup.setAll('checkWorldBounds', true);

      gameObjects.pipes.add(pipeGroup);
    }

    createBird();

    gameScore = 0;

    gameObjects.readySprite = game.add.sprite(game.width / 2 - (186 * 2.5) / 2, game.height / 2 - (50 * 2.5) / 2, 'ready');
    gameObjects.readySprite.scale.setTo(2.5, 2.5);
    gameState = GAME_READY;
  },
  update: function() {
  	if (game.input.activePointer.isDown) {
     	onTrigger();
    }

  	 switch (gameState) {
  	 case GAME_END:
  	 	break;
  	 case GAME_READY:
  	 	break;
  	 case GAME_PLAYING:
  	 	gameObjects.background.tilePosition.x -= 3;
      	for (var i = 0; i < gameObjects.pipes.children.length; i++) {
       		game.physics.arcade.collide(gameObjects.bird, gameObjects.pipes.children[i], function(bird, pipe) {
          		gameOver();
        	}, null, this);
     	}
  	 	break;
  	 case GAME_OVER:
  	 	break;
  	 }

  },
  render: function() {

  }
};

var game = new Phaser.Game(window.innerWidth, window.innerHeight);
game.state.add('main', mainState);
game.state.start('main');

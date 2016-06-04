var gameObjects = {};
var gameOver = false;

function createBird() {
  gameObjects.bird = game.add.sprite(game.width / 4, game.height / 4, 'bird');
  gameObjects.bird.scale.setTo(0.3, 0.3);
  gameObjects.bird.enableBody = true;
  gameObjects.bird.animations.add('flying', [0, 1, 2, 1], 10, true);
  gameObjects.bird.animations.play('flying');

  game.physics.arcade.enable(gameObjects.bird);
  gameObjects.bird.body.bounce.y = 0.2;
  gameObjects.bird.body.gravity.y = 1250;
  gameObjects.bird.body.collideWorldBounds = true;
}

var mainState = {
  preload: function() {
    game.load.image('background', 'assets/background.png');
    game.load.image('topPipe', 'assets/top_pipe.png');
    game.load.image('bottomPipe', 'assets/bottom_pipe.png');

    game.load.spritesheet('bird', 'assets/bird.png', 156, 129);
  },
  create: function() {
    function getNewTop() {
      return game.rnd.integerInRange(-10, 0) * 20;
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
      var spaceBetweenPipes = 250;
      var gapBetweenPipes = 150;

      var pipeGroup = game.make.group();
      game.physics.arcade.enable(pipeGroup);

      var topPipe = pipeGroup.create(
        game.width / 2 + i * 250,
        topPipeY,
        'topPipe'
      );
      topPipe.name = 'topPipe' + i;
      topPipe.scale.setTo(scale, scale);
      game.physics.arcade.enable(topPipe);

      topPipe.events.onOutOfBounds.add(function(pipe) {
        if (pipe.position.x < 0) {
          var pipeIndex = pipe.name[pipe.name.length - 1];
          var outOfBoundsPipeGroup = gameObjects.pipes.children[pipeIndex];
          var lastTopPipe = gameObjects.pipes.children[lastPipeIndex].children[0];
          var newTopPipeX = lastTopPipe.position.x + spaceBetweenPipes;

          var outOfBoundsPipes = outOfBoundsPipeGroup.children;
          var newTopPipeY = getNewTop();

          outOfBoundsPipeGroup.forEach(function(pipe) {
            if (pipe.name.startsWith("top")) {
              pipe.position.x = newTopPipeX;
              pipe.position.y = newTopPipeY;
            } else {
              pipe.position.x = newTopPipeX - 2;
              pipe.position.y = newTopPipeY + 608 * scale + gapBetweenPipes
            }
          });

          lastPipeIndex = (lastPipeIndex + 1) % 6;
        }
      });

      var bottomPipe = pipeGroup.create(
        game.width / 2 - 2 + i * spaceBetweenPipes,
        topPipeY + 608 * scale + gapBetweenPipes,
        'bottomPipe'
      );
      bottomPipe.name = 'bottomPipe' + i;
      bottomPipe.scale.setTo(scale, scale);
      game.physics.arcade.enable(bottomPipe);

      pipeGroup.setAll('body.immovable', true);
      pipeGroup.setAll('body.velocity.x', -250);
      pipeGroup.setAll('checkWorldBounds', true);

      // pipeGroup.events.onOutOfBounds.add(function(pipe) {
      //   var lastPipe = gameObjects.pipes.children[lastPipeIndex];
      //   pipe.position.x = lastPipe.position.x + 250;
      //   pipe.position.y = game.rnd.integerInRange(-10, 0) * 20;
      //   lastPipeIndex = (lastPipeIndex + 1) % 6;
      // }. this);

      gameObjects.pipes.add(pipeGroup);
    }

    createBird();
  },
  update: function() {
    if (gameOver) {
      console.log("game over");
      gameObjects.pipes.children.forEach(function(group) {
        group.setAll('body.velocity.x', 0);
      });
    } else {
      gameObjects.background.tilePosition.x -= 3;

      if (game.input.activePointer.isDown) {
        gameObjects.bird.body.velocity.y = -450;
      }

      for (var i = 0; i < gameObjects.pipes.children.length; i++) {
        game.physics.arcade.collide(gameObjects.bird, gameObjects.pipes.children[i], function(bird, pipe) {
          gameOver = true;
        }, null, this);
      }
    }


  },
  render: function() {

  }
};

var game = new Phaser.Game(window.innerWidth, window.innerHeight);
game.state.add('main', mainState);
game.state.start('main');

const GRIDSIZE = 50; // This size works well with the sprites used
const WIDTH = Math.floor(window.innerWidth / GRIDSIZE) * GRIDSIZE;
const HEIGHT = Math.floor(window.innerHeight / GRIDSIZE) * GRIDSIZE;
let game;

window.onload = function () {
    let gameConfig = {
        type: Phaser.AUTO,
        backgroundColor: "#112211",
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            width: WIDTH,
            height: HEIGHT,
        },
        pixelArt: true,
        physics: {
            default: "arcade",
            arcade: {
                gravity: {
                    y: 0
                }
            }
        },
        fps: {
            target: 60
        },
        scene: [MainMenuScene, GameScene, GameOverScene]
    }

    game = new Phaser.Game(gameConfig)
    window.focus();
}

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.score = 0;
        this.PlayerSpeedMultiplier = 1;
        this.targetScore = this.generateRandomScoreTarget(50, 100);
        this.hasStopwatch = false;
        this.hasBomb=false;
        this.popupMessages = [];
        this.tweensList = new Set();
        this.bombUseCounter=5;
    }

    preload() {
        // Character base by Mana Seed, https://seliel-the-shaper.itch.io/character-base
        this.load.spritesheet("dude", "assets/char_a_p1/char_a_p1_0bas_humn_v01.png", { frameWidth: 64, frameHeight: 64 });

        // Round ghost by PiXeRaT, https://pixerat.itch.io/round-ghost
        this.load.image("ghost_walk_0", "assets/ghost/round ghost walk/sprite_0.png");
        this.load.image("ghost_walk_1", "assets/ghost/round ghost walk/sprite_1.png");
        this.load.image("ghost_walk_2", "assets/ghost/round ghost walk/sprite_2.png");
        this.load.image("ghost_walk_3", "assets/ghost/round ghost walk/sprite_3.png");
        this.load.image("ghost_walk_4", "assets/ghost/round ghost walk/sprite_4.png");
        this.load.image("ghost_walk_5", "assets/ghost/round ghost walk/sprite_5.png");

        this.load.image("ghost_attack_0", "assets/ghost/round ghost attack/sprite_0.png");
        this.load.image("ghost_attack_1", "assets/ghost/round ghost attack/sprite_1.png");
        this.load.image("ghost_attack_2", "assets/ghost/round ghost attack/sprite_2.png");
        this.load.image("ghost_attack_3", "assets/ghost/round ghost attack/sprite_3.png");
        this.load.image("ghost_attack_4", "assets/ghost/round ghost attack/sprite_4.png");
        this.load.image("ghost_attack_5", "assets/ghost/round ghost attack/sprite_5.png");
        this.load.image("ghost_attack_6", "assets/ghost/round ghost attack/sprite_6.png");

        // Collectables1 by xvideosman, https://xvideosman.itch.io/collectables-pack
        this.load.spritesheet("collectables1", "assets/Collectables/Collectables1.png", { frameWidth: 16, frameHeight: 16 });

        // Collectables2 by xvideosman, https://xvideosman.itch.io/collectables-2
        this.load.spritesheet("collectables2", "assets/Collectables/Collectables2.png", { frameWidth: 16, frameHeight: 16 });

        // Collectables3 by xvideosman, https://xvideosman.itch.io/collectables-3
        this.load.spritesheet("collectables3", "assets/Collectables/Collectables3.png", { frameWidth: 16, frameHeight: 16 });

        // Zombie - simple, becomes projectile by ironbutterfly, https://ironnbutterfly.itch.io/zombie-sprite
        this.load.spritesheet("zombie", "assets/zombie/Zombie.png", { frameWidth: 32, frameHeight: 32 });
    }

    create() {
        // Wall stuff
        {
            const cols = Math.floor(WIDTH / GRIDSIZE);
            const rows = Math.floor(HEIGHT / GRIDSIZE);
        
            this.walls = this.physics.add.staticGroup();
            this.walls.setDepth(0);
        
            const existingWalls = new Set();
            const emptyWalls = new Set();
        
            for (let i = 0; i < rows; i++) {
                for (let j = 0; j < cols; j++) {
                    emptyWalls.add(`${i},${j},0`);
                    emptyWalls.add(`${i},${j},1`);
                    emptyWalls.add(`${i},${j},2`);
                    emptyWalls.add(`${i},${j},3`);
                }
            }
        
            const grid = [];
            for (let i = 0; i < rows; i++) {
                const row = [];
                for (let j = 0; j < cols; j++) {
                    row.push({ top: false, right: false, bottom: false, left: false, sprites: [] });
                }
                grid.push(row);
            }
        
            const graphics = this.add.graphics({ lineStyle: { width: 2, color: 0xff0000, alpha: 1 } });
        
            const drawWalls = () => {
                graphics.clear();
                graphics.lineStyle(2, 0xff0000, 1);
                for (let i = 0; i < rows; i++) {
                    for (let j = 0; j < cols; j++) {
                        const cell = grid[i][j];
                        const x = j * GRIDSIZE;
                        const y = i * GRIDSIZE;
        
                        cell.sprites.forEach(sprite => sprite.destroy());
                        cell.sprites = [];
        
                        if (cell.top) {
                            graphics.strokeLineShape(new Phaser.Geom.Line(x, y, x + GRIDSIZE, y));
                            graphics.generateTexture('lineTextureTop', GRIDSIZE, 2);
                            let sprite = this.add.sprite(x + GRIDSIZE / 2, y, 'lineTextureTop');
                            this.walls.add(sprite);
                            sprite.body.setSize(GRIDSIZE, 2).setOffset(0, 0);
                            cell.sprites.push(sprite);
                        }
                        if (cell.right) {
                            graphics.strokeLineShape(new Phaser.Geom.Line(x + GRIDSIZE, y, x + GRIDSIZE, y + GRIDSIZE));
                            graphics.generateTexture('lineTextureRight', 2, GRIDSIZE);
                            let sprite = this.add.sprite(x + GRIDSIZE, y + GRIDSIZE / 2, 'lineTextureRight');
                            this.walls.add(sprite);
                            sprite.body.setSize(2, GRIDSIZE).setOffset(0, 0);
                            cell.sprites.push(sprite);
                        }
                        if (cell.bottom) {
                            graphics.strokeLineShape(new Phaser.Geom.Line(x, y + GRIDSIZE, x + GRIDSIZE, y + GRIDSIZE));
                            graphics.generateTexture('lineTextureBottom', GRIDSIZE, 2);
                            let sprite = this.add.sprite(x + GRIDSIZE / 2, y + GRIDSIZE, 'lineTextureBottom');
                            this.walls.add(sprite);
                            sprite.body.setSize(GRIDSIZE, 2).setOffset(0, 0);
                            cell.sprites.push(sprite);
                        }
                        if (cell.left) {
                            graphics.strokeLineShape(new Phaser.Geom.Line(x, y, x, y + GRIDSIZE));
                            graphics.generateTexture('lineTextureLeft', 2, GRIDSIZE);
                            let sprite = this.add.sprite(x, y + GRIDSIZE / 2, 'lineTextureLeft');
                            this.walls.add(sprite);
                            sprite.body.setSize(2, GRIDSIZE).setOffset(0, 0);
                            cell.sprites.push(sprite);
                        }
                    }
                }
            }
        
            const addRandomWall = () => {
                if (emptyWalls.size === 0) {
                    return;
                }
                const emptyWallsArray = Array.from(emptyWalls);
                const wallKey = emptyWallsArray[Phaser.Math.Between(0, emptyWalls.size - 1)];
                const [row, col, side] = wallKey.split(',').map(Number);
        
                emptyWalls.delete(wallKey);
                existingWalls.add(wallKey);
        
                switch (side) {
                    case 0:
                        grid[row][col].top = true;
                        break;
                    case 1:
                        grid[row][col].right = true;
                        break;
                    case 2:
                        grid[row][col].bottom = true;
                        break;
                    case 3:
                        grid[row][col].left = true;
                        break;
                }
        
                drawWalls();
            }
        
            this.time.addEvent({
                delay: 2000,
                callback: addRandomWall,
                callbackScope: this,
                loop: true
            });
        
            const initWallCount = Math.floor(HEIGHT * WIDTH / 10000);
            for (let i = 0; i < initWallCount; i++) {
                addRandomWall();
            }
        
            drawWalls();
        
            this.removeWall = (x, y) => {
                const col = Math.floor(x / GRIDSIZE);
                const row = Math.floor(y / GRIDSIZE);
                const xInCell = x % GRIDSIZE;
                const yInCell = y % GRIDSIZE;
                const tolerance = 20; // Increase tolerance to make wall removal more forgiving
                const cell = grid[row][col];
                let side = -1;

                if (xInCell < tolerance && cell.left) {
                    side = 3;
                } else if (xInCell > GRIDSIZE - tolerance && cell.right) {
                    side = 1;
                } else if (yInCell < tolerance && cell.top) {
                    side = 0;
                } else if (yInCell > GRIDSIZE - tolerance && cell.bottom) {
                    side = 2;
                }

                if (side !== -1) {
                    switch (side) {
                        case 0:
                            cell.top = false;
                            break;
                        case 1:
                            cell.right = false;
                            break;
                        case 2:
                            cell.bottom = false;
                            break;
                        case 3:
                            cell.left = false;
                            break;
                    }
                    cell.sprites.forEach(sprite => sprite.destroy());
                    cell.sprites = [];
                    drawWalls();
                    this.bombUseCounter--;
                }
            }
        }

        // Creating the player
        this.dude = this.physics.add.sprite(game.config.width / 3, game.config.height / 3, "dude");
        this.dude.setCollideWorldBounds(true);
        this.dude.body.setSize(this.dude.width * 0.3, this.dude.height * 0.5);
        this.physics.add.collider(this.dude, this.walls);
        this.dudeAlive = true;
        
        // Creating bad guys
        this.ghosts = this.physics.add.group();
        const numGhosts = 5;

        for (let i = 0; i < numGhosts; i++) {
            const ghost = this.ghosts.create(game.config.width / 2, game.config.height / 2, "ghost_walk_0");
            ghost.setCollideWorldBounds(true);
            ghost.setSize(ghost.width * 0.2, ghost.height * 0.2);
            ghost.setDepth(1);
        }

        this.zombie = this.physics.add.sprite(50, 50, "zombie");
        this.zombie.setCollideWorldBounds(true);
        this.zombie.setSize(this.zombie.width * 0.8, this.zombie.height * 0.8);
        this.zombie.setOffset(0, 5);
        this.zombie.setDepth(1);
        this.zombie.speed = 50;
        this.physics.add.collider(this.zombie, this.walls);

        // Creating collectibles
        this.collectables = this.physics.add.group();
        this.boot = this.collectables.create(Phaser.Math.Between(0, game.config.width), Phaser.Math.Between(0, game.config.height), "collectables2", 18).disableBody(true, true);
        this.boot.name="boot";
        this.createCollectableAnimation(this.boot, "collectables2", 18);

        this.bomb = this.collectables.create(Phaser.Math.Between(0, game.config.width), Phaser.Math.Between(0, game.config.height), "collectables3", 12).disableBody(true, true);
        this.bomb.name="bomb";
        this.createCollectableAnimation(this.bomb, "collectables3", 12);

        this.money = this.collectables.create(Phaser.Math.Between(0, game.config.width), Phaser.Math.Between(0, game.config.height), "collectables1", 12).disableBody(true, true);
        this.money.name="money";
        this.createCollectableAnimation(this.money, "collectables1", 12);

        this.stopwatch = this.collectables.create(Phaser.Math.Between(0, game.config.width), Phaser.Math.Between(0, game.config.height), "collectables1", 30).disableBody(true, true);
        this.stopwatch.name="stopwatch";
        this.createCollectableAnimation(this.stopwatch, "collectables1", 30);
        
        this.collectables.stars = this.physics.add.group();
        this.physics.add.overlap(this.dude, this.collectables.stars, (dude, star) => {
            star.disableBody(true, true);
            this.score += 10;
            this.scoreText.setText('Score: ' + this.score);
            this.checkScoreTarget();
        });  
        this.generateStar = (x,y) => {
            const star = this.collectables.stars.create(x, y, "collectables1", 10);
            star.name="star"
            this.createCollectableAnimation(star, "collectables1", 10);
        }
        this.addStar = this.time.addEvent({
            delay: 3000,
            callback: () => {
                const x = Phaser.Math.Between(0, game.config.width);
                const y = Phaser.Math.Between(0, game.config.height);
                this.generateStar(x, y);
            },
            callbackScope: this,
            loop: true,
        });

        // Input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            shift: Phaser.Input.Keyboard.KeyCodes.SHIFT
        });

        // Ghost movement
        const moveGhostRandomly = (ghost) => {
            if (this.cameras.main){
            const x = Phaser.Math.Between(0, this.cameras.main.width);
            const y = Phaser.Math.Between(0, this.cameras.main.height);
        
            let tween= this.tweens.add({
                targets: ghost,
                x: x,
                y: y,
                duration: 5000,
                ease: 'Quadratic',
                onComplete: () => {
                    this.tweensList.delete(tween);
                    const randomDuration = Phaser.Math.Between(1000, 5000);
                    setTimeout(() => moveGhostRandomly(ghost), randomDuration);
                }
            });
            this.tweensList.add(tween);
            }
        };
        
        for (let i = 0; i < numGhosts; i++) {
            moveGhostRandomly(this.ghosts.getChildren()[i]);
        }
        
        // Zombie movement
        this.zombieMovement = this.time.addEvent({
            delay: 300,
            callback: () => {
            const playerX = this.dude.x;
            const playerY = this.dude.y;
            const zombieX = this.zombie.x;
            const zombieY = this.zombie.y;

            const dx = playerX - zombieX;
            const dy = playerY - zombieY;

            const angle = Math.atan2(dy, dx);
            const speedX = Math.cos(angle) * this.zombie.speed;
            const speedY = Math.sin(angle) * this.zombie.speed;

            this.zombie.setVelocity(speedX + Math.random() * 10 - 5, speedY + Math.random() * 10 - 5);
            },
            callbackScope: this,
            loop: true
        });



        // Everything to do with death
        {
            this.ghostDeath = (dude, ghost) => {
                this.doDeath();
                ghost.anims.play('ghostAttack', true);
                setTimeout(() => {
                    this.showDeathScreen();
                }, 700);
            };

            this.zombieDeath = (dude, zombie) => {
                this.doDeath();
                zombie.anims.play('zombieAttack', true);
                setTimeout(() => {
                    this.showDeathScreen();
                }, 700);
            }
        
            this.doDeath = () => {
                this.dude.stop();
                this.dude.setVelocity(0);
                this.dude.body.setAcceleration(0);
                this.dude.body.setDrag(0);
                this.dudeAlive = false;
                this.tweens.killAll();
        
                // Stop the movement of all ghosts
                this.ghosts.getChildren().forEach(ghost => {
                    ghost.setVelocity(0);
                    ghost.body.setAcceleration(0);
                    ghost.body.setDrag(0);
                    ghost.anims.stop();
                });

                // Stop the movement of the zombie
                this.zombieMovement.remove();
                this.zombie.setVelocity(0);
                this.zombie.body.setAcceleration(0);
                this.zombie.body.setDrag(0);
                this.zombie.anims.stop();
        
                // Stop any animations currently playing on the dude
                this.dude.anims.stop();
            };
        
            this.showDeathScreen = () => {
                this.game.renderer.snapshot((image) => {
                    this.scene.stop('GameScene');
                    this.scene.start('GameOverScene', { snapshot: image });
                });
            };
        
            // Collision with ghosts
            this.physics.add.overlap(this.dude, this.ghosts, (dude, ghost) => {
                if (this.dudeAlive) {
                    this.ghostDeath(dude, ghost);
                }
            }, null, this);

            // Collision with zombie
            this.physics.add.overlap(this.dude, this.zombie, (dude, zombie) => {
                if (this.dudeAlive) {
                    this.zombieDeath(dude, zombie);
                }
            }, null, this);
        }

        // Collecting items
        this.physics.add.overlap(this.dude, this.boot, (dude, boot) => {
            this.PlayerSpeedMultiplier *= 1.5;
            this.displayPopupMessage("You got boots! You can now run faster!");
            boot.destroy();
        }, null, this);

        this.physics.add.overlap(this.dude, this.bomb, (dude, bomb) => {
            // Gotta implement bomb functionality later
            this.displayPopupMessage("You got a bomb! You can use it to destroy "+this.bombUseCounter+" walls by slashing them with your mouse!");
            this.hasBomb=true;
            bomb.destroy();
        }, null, this);

        this.physics.add.overlap(this.dude, this.money, (dude, money) => {
            this.displayPopupMessage("You got some money which is worth 50 points!");
            this.score += 50;
            this.scoreText.setText('Score: ' + this.score);
            this.checkScoreTarget();
            money.destroy();
        }, null, this);

        this.physics.add.overlap(this.dude, this.stopwatch, (dude, stopwatch) => {
            this.displayPopupMessage("You got a stopwatch! You can freeze time for 5 seconds by pressing the spacebar!");
            this.hasStopwatch = true;
            stopwatch.destroy();
        }, null, this);

        this.displayPopupMessage('Once you reach ' + this.targetScore + ' points, a unique item will spawn!');

        this.scoreText = this.add.text(10, 10, 'Score: 0', {
            font: '16px Arial',
            fill: '#ffffff',
            backgroundColor: '#000000'
        }).setScrollFactor(0);

        // Animations
        {
            // Dude animations
            this.anims.create({
                key: 'walkDown',
                frames: this.anims.generateFrameNumbers('dude', { start: 32, end: 37 }),
                frameRate: 1000 / 135,
                repeat: -1
            });

            this.anims.create({
                key: 'walkUp',
                frames: this.anims.generateFrameNumbers('dude', { start: 40, end: 45 }),
                frameRate: 1000 / 135,
                repeat: -1
            });

            this.anims.create({
                key: 'walkRight',
                frames: this.anims.generateFrameNumbers('dude', { start: 48, end: 53 }),
                frameRate: 1000 / 135,
                repeat: -1
            });

            this.anims.create({
                key: 'walkLeft',
                frames: this.anims.generateFrameNumbers('dude', { start: 56, end: 61 }),
                frameRate: 1000 / 135,
                repeat: -1
            });

            this.anims.create({
                key: 'runDown',
                frames: [
                    { key: 'dude', frame: 32, duration: 80 },
                    { key: 'dude', frame: 33, duration: 55 },
                    { key: 'dude', frame: 38, duration: 125 },
                    { key: 'dude', frame: 35, duration: 80 },
                    { key: 'dude', frame: 36, duration: 55 },
                    { key: 'dude', frame: 39, duration: 125 }
                ],
                repeat: -1
            });

            this.anims.create({
                key: 'runUp',
                frames: [
                    { key: 'dude', frame: 40, duration: 80 },
                    { key: 'dude', frame: 41, duration: 55 },
                    { key: 'dude', frame: 46, duration: 125 },
                    { key: 'dude', frame: 43, duration: 80 },
                    { key: 'dude', frame: 44, duration: 55 },
                    { key: 'dude', frame: 47, duration: 125 }
                ],
                repeat: -1
            });

            this.anims.create({
                key: 'runRight',
                frames: [
                    { key: 'dude', frame: 48, duration: 80 },
                    { key: 'dude', frame: 49, duration: 55 },
                    { key: 'dude', frame: 54, duration: 125 },
                    { key: 'dude', frame: 51, duration: 80 },
                    { key: 'dude', frame: 52, duration: 55 },
                    { key: 'dude', frame: 55, duration: 125 }
                ],
                repeat: -1
            });

            this.anims.create({
                key: 'runLeft',
                frames: [
                    { key: 'dude', frame: 56, duration: 80 },
                    { key: 'dude', frame: 57, duration: 55 },
                    { key: 'dude', frame: 62, duration: 125 },
                    { key: 'dude', frame: 59, duration: 80 },
                    { key: 'dude', frame: 60, duration: 55 },
                    { key: 'dude', frame: 63, duration: 125 }
                ],
                repeat: -1
            });

            this.anims.create({
                key: 'idle',
                frames: [{ key: 'dude', frame: 0 }],
                frameRate: 20
            });

            this.anims.create({
                key: 'victoryDance',
                frames: [
                    { key: 'dude', frame: 27, duration: 40 },
                    { key: 'dude', frame: 31, duration: 40 },
                    { key: 'dude', frame: 27, duration: 40 },
                    { key: 'dude', frame: 31, duration: 40 },

                    { key: 'dude', frame: 19, duration: 40 },
                    { key: 'dude', frame: 23, duration: 40 },
                    { key: 'dude', frame: 19, duration: 40 },
                    { key: 'dude', frame: 23, duration: 40 }
                ],
                repeat: -1
            });

            // Ghost animations
            this.anims.create({
                key: 'ghostWalk',
                frames: [
                    { key: 'ghost_walk_0', duration: 100 },
                    { key: 'ghost_walk_1', duration: 100 },
                    { key: 'ghost_walk_2', duration: 100 },
                    { key: 'ghost_walk_3', duration: 100 },
                    { key: 'ghost_walk_4', duration: 100 },
                    { key: 'ghost_walk_5', duration: 100 },
                    { key: 'ghost_walk_4', duration: 100 },
                    { key: 'ghost_walk_3', duration: 100 },
                    { key: 'ghost_walk_2', duration: 100 },
                    { key: 'ghost_walk_1', duration: 100 }
                ],
                repeat: -1
            });

            this.anims.create({
                key: 'ghostAttack',
                frames: [
                    { key: 'ghost_attack_0', duration: 100 },
                    { key: 'ghost_attack_1', duration: 100 },
                    { key: 'ghost_attack_2', duration: 100 },
                    { key: 'ghost_attack_3', duration: 100 },
                    { key: 'ghost_attack_4', duration: 100 },
                    { key: 'ghost_attack_5', duration: 100 },
                    { key: 'ghost_attack_6', duration: 100 }
                ]
            });

            // Zombie animations
            this.anims.create({
                key: 'zombieWalk',
                frames: this.anims.generateFrameNumbers('zombie', { start: 27, end: 33 }),
                frameRate: 5,
                repeat: -1
            });

            this.anims.create({
                key: 'zombieAttack',
                frames: this.anims.generateFrameNumbers('zombie', { start: 13, end: 19 }),
                frameRate: 10,
                repeat: -1
            });
        }

    }
    
    displayPopupMessage(message) {
        // Create a new text object for the popup message
        const popup = this.add.text(game.config.width - 10, 10, message, {
            font: '16px Arial',
            fill: '#ffffff',
            backgroundColor: '#000000'
        }).setScrollFactor(0).setVisible(true).setOrigin(1, 0);

        // Add the popup to the array of active popup messages
        this.popupMessages.push(popup);

        // Adjust positions of all active popup messages
        this.adjustPopupMessagePositions();

        // Remove the popup message after 3 seconds
        this.time.delayedCall(5000, () => {
            popup.destroy();
            this.popupMessages = this.popupMessages.filter(msg => msg !== popup);
            this.adjustPopupMessagePositions();
        });
    }

    adjustPopupMessagePositions() {
        // Adjust the Y position of each active popup message
        this.popupMessages.forEach((popup, index) => {
            popup.setY(10 + index * 20); // Adjust 20 pixels below the previous message
        });
    }


    createCollectableAnimation(collectable, textureKey, startFrame) {
        this.anims.create({
            key: collectable.name,
            frames: [
                { key: textureKey, frame: startFrame, duration: 500 },
                { key: textureKey, frame: startFrame + 1, duration: 500 },
            ],
            repeat: -1
        });
    }

    generateRandomScoreTarget(min, max) {
        const num=Phaser.Math.Between(min, max);
        const target=num-(num%10);
        return target;
    }
    checkScoreTarget() {
        if (this.score >= this.targetScore) {
            this.onTargetScoreReached();
            this.targetScore = this.score+this.generateRandomScoreTarget(50, 100);
            this.displayPopupMessage('You reached ' + this.score + ' points! The target score is now ' + this.targetScore + ' points!');
        }
    }
    onTargetScoreReached() {
        if (this.collectables.getChildren().length != 0) {
            this.displayPopupMessage("You reached the target score! A unique item has spawned!");
            const randomChild = Phaser.Utils.Array.GetRandom(this.collectables.getChildren());
            randomChild.enableBody(false, randomChild.x, randomChild.y, true, true);
        } else {
            this.displayPopupMessage("You reached the target score, but there are no items left to spawn!");
        }

        
    }

    update() {
        if (this.dudeAlive) {
            this.dude.setVelocity(0);

            let isRunning = this.cursors.shift.isDown || this.wasd.shift.isDown;
            let speed = isRunning ? 120*this.PlayerSpeedMultiplier : 80*this.PlayerSpeedMultiplier;
            let moveX = 0;
            let moveY = 0;

            if (this.cursors.left.isDown || this.wasd.left.isDown) {
                moveX = -1;
            } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
                moveX = 1;
            }

            if (this.cursors.up.isDown || this.wasd.up.isDown) {
                moveY = -1;
            } else if (this.cursors.down.isDown || this.wasd.down.isDown) {
                moveY = 1;
            }

            // Normalize diagonal speed
            if (moveX !== 0 && moveY !== 0) {
                moveX *= 0.7071;  // 1/sqrt(2)
                moveY *= 0.7071;
            }

            this.dude.setVelocityX(speed * moveX);
            this.dude.setVelocityY(speed * moveY);

            if (moveY < 0) {
                this.dude.anims.play(isRunning ? 'runUp' : 'walkUp', true);
            } else if (moveY > 0) {
                this.dude.anims.play(isRunning ? 'runDown' : 'walkDown', true);
            } else if (moveX < 0) {
                this.dude.anims.play(isRunning ? 'runLeft' : 'walkLeft', true);
            } else if (moveX > 0) {
                this.dude.anims.play(isRunning ? 'runRight' : 'walkRight', true);
            }

            if (this.hasStopwatch && this.cursors.space.isDown) {
                this.freezeTime();
                this.displayPopupMessage("Time has been frozen for 5 seconds!");
                this.hasStopwatch = false;
            }

            if (this.hasBomb && this.input.activePointer.isDown) {
                this.removeWall(this.input.activePointer.x, this.input.activePointer.y);
                if (this.bombUseCounter==0){
                    this.displayPopupMessage("You have used all your bombs!");
                    this.hasBomb=false;
                }
            }

            if (this.dude.body.velocity.x === 0 && this.dude.body.velocity.y === 0) {
                //dude.anims.play('victoryDance', true);
                this.dude.anims.play('idle', true);
            }

            Phaser.Actions.Call(this.ghosts.getChildren(), function(ghost) {
            ghost.anims.play('ghostWalk', true);
            }, this);

            this.zombie.anims.play('zombieWalk', true);

            this.collectables.getChildren().forEach(collectable => {
                collectable.anims.play(collectable.name, true);
            });

            this.collectables.stars.getChildren().forEach(star => {
                star.anims.play(star.name, true);
            });
        }
    }
    freezeTime() {
        // Pause all enemy animations
        this.ghosts.getChildren().forEach(ghost => {
            ghost.anims.pause();
        });
    
        // Pause all tweens in this.tweensList
        this.tweensList.forEach(tween => {
            tween.pause();
        });
    
        // Set a timer to resume all tweens and animations after 5 seconds
        this.time.delayedCall(5000, () => {
            this.ghosts.getChildren().forEach(ghost => {
                ghost.anims.resume();
            });
            this.tweensList.forEach(tween => {
                tween.resume();
            });
        });
    }
}

class MainMenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainMenuScene' });
    }

    create() {
        this.add.text(WIDTH / 2, HEIGHT / 2, 'Main Menu', { fill: '#fff' }).setOrigin(0.5);
        const startButton = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 + 50, 'Start Game', { fontSize: '24px', fill: '#fff', backgroundColor: '#000' })
            .setOrigin(0.5, 0.5)
            .setInteractive();

        startButton.on('pointerdown', () => {
            this.scene.stop('MainMenuScene');
            this.scene.start('GameScene');
        });
    }
}

class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    create(data) {
        if (data.snapshot) {
            const snapshot = data.snapshot;

            // Create a texture from the snapshot
            if (this.textures.exists('snapshot')) {
                this.textures.remove('snapshot');
            }
            
            this.textures.addImage('snapshot', snapshot);

            // Create a sprite from the texture
            const snapshotSprite = this.add.sprite(0, 0, 'snapshot').setOrigin(0, 0);
            this.add.tween({
                targets: snapshotSprite,
                alpha: 0.3,
                duration: 4000,
                ease: 'Cubic',
            });
        };
        setTimeout(() => {
            this.add.text(WIDTH / 2, HEIGHT / 2, 'Game Over', { fill: '#ff0000', fontSize: '48px', fontWeight: 'bold' }).setOrigin(0.5);
            const restartButton = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 + 50, 'Restart Game', { fontSize: '24px', fill: '#fff', backgroundColor: '#000' })
                .setOrigin(0.5, 0.5)
                .setInteractive();

            restartButton.on('pointerdown', () => {
                this.scene.stop('GameOverScene');
                this.scene.start('GameScene');
            });
        }, 750);
    }
}


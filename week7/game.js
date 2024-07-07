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
        this.targetScore = this.generateRandomScoreTarget(10, 30);
        this.popupMessages = [];
    }

    preload() {
        // Sprite by Mana Seed, https://seliel-the-shaper.itch.io/character-base
        this.load.spritesheet("dude", "assets/char_a_p1/char_a_p1_0bas_humn_v01.png", { frameWidth: 64, frameHeight: 64 });

        // Sprite by PiXeRaT, https://pixerat.itch.io/round-ghost
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
        //this.load.aseprite("collectables2", "assets/Collectables/Collectables2.png", "assets/Collectables/Collectables2.json");
        this.load.spritesheet("collectables2", "assets/Collectables/Collectables2.png", { frameWidth: 16, frameHeight: 16 });


    }

    create() {
        // Wall stuff
        {
            const cols = WIDTH / GRIDSIZE;
            const rows = HEIGHT / GRIDSIZE;

            this.walls = this.physics.add.staticGroup();
            this.walls.setDepth(0);

            let totalPossibleWalls = cols * rows * 4;
            const existingWalls = new Set(); // Not used for anything rn, but could be useful in the future

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
                    let top = false;
                    let right = false;
                    let bottom = false;
                    let left = false;
                    if (i === 0) top = true;
                    if (j === cols - 1) right = true;
                    if (i === rows - 1) bottom = true;
                    if (j === 0) left = true;
                    row.push({ top, right, bottom, left });
                }
                grid.push(row);
            }

            const graphics = this.add.graphics({ lineStyle: { width: 1, color: 0x000000, alpha: 0 } });

            const drawWalls = () => {
                graphics.clear();
                graphics.lineStyle(2, 0xff0000, 1);
                for (let i = 0; i < rows; i++) {
                    for (let j = 0; j < cols; j++) {
                        const cell = grid[i][j];
                        const x = j * GRIDSIZE;
                        const y = i * GRIDSIZE;
                        const hitbox = (GRIDSIZE - 40, 0);

                        if (cell.top) {
                            graphics.lineBetween(x, y, x + GRIDSIZE, y);
                            graphics.generateTexture('lineTextureTop', GRIDSIZE, 2);
                            let sprite = this.add.sprite(x + GRIDSIZE / 2, y, 'lineTextureTop');
                            this.walls.add(sprite);
                            sprite.body.setSize(hitbox).setOffset(0, 3);
                            existingWalls.add(`${i},${j},0`);
                            emptyWalls.delete(`${i},${j},0`);
                        }
                        if (cell.right) {
                            graphics.lineBetween(x + GRIDSIZE, y, x + GRIDSIZE, y + GRIDSIZE);
                            graphics.generateTexture('lineTextureRight', 2, GRIDSIZE);
                            let sprite = this.add.sprite(x + GRIDSIZE, y + GRIDSIZE / 2, 'lineTextureRight');
                            this.walls.add(sprite);
                            sprite.body.setSize(hitbox).setOffset(0, 3);
                            existingWalls.add(`${i},${j},1`);
                            emptyWalls.delete(`${i},${j},1`);
                        }
                        if (cell.bottom) {
                            graphics.lineBetween(x, y + GRIDSIZE, x + GRIDSIZE, y + GRIDSIZE);
                            graphics.generateTexture('lineTextureBottom', GRIDSIZE, 2);
                            let sprite = this.add.sprite(x + GRIDSIZE / 2, y + GRIDSIZE, 'lineTextureBottom');
                            this.walls.add(sprite);
                            sprite.body.setSize(hitbox).setOffset(0, 3);
                            existingWalls.add(`${i},${j},2`);
                            emptyWalls.delete(`${i},${j},2`);
                        }
                        if (cell.left) {
                            graphics.lineBetween(x, y, x, y + GRIDSIZE);
                            graphics.generateTexture('lineTextureLeft', 2, GRIDSIZE);
                            let sprite = this.add.sprite(x, y + GRIDSIZE / 2, 'lineTextureLeft');
                            this.walls.add(sprite);
                            sprite.body.setSize(hitbox).setOffset(0, 3);
                            existingWalls.add(`${i},${j},3`);
                            emptyWalls.delete(`${i},${j},3`);
                        }
                    }
                }
            }

            const addRandomWall = () => {
                let row, col, side;
                let wallKey;
                if (emptyWalls.size > 0) {
                    const emptyWallsArray = Array.from(emptyWalls);
                    wallKey = emptyWallsArray[Phaser.Math.Between(0, emptyWalls.size - 1)];
                    row = parseInt(wallKey.split(",")[0]);
                    col = parseInt(wallKey.split(",")[1]);
                    side = parseInt(wallKey.split(",")[2]);
                    emptyWalls.delete(wallKey);
                    existingWalls.add(wallKey);
                } else {
                    // Some kind of menu comes here later
                    return;
                }


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

            // Call addRandomWall every 2 seconds
            this.time.addEvent({
                delay: 2000,
                callback: addRandomWall,
                callbackScope: this,
                loop: true
            });

            // The number of walls to add initially
            let initWallCount = Math.floor(HEIGHT * WIDTH / 10000);
            for (let i = 0; i < initWallCount; i++) {
                addRandomWall();
            }
            drawWalls();
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

        // Creating collectibles
        this.collectables = this.physics.add.group();
        this.boot = this.collectables.create(Phaser.Math.Between(0, game.config.width), Phaser.Math.Between(0, game.config.height), "collectables2", 18).disableBody(true, true);
        this.boot.name="boot"
        this.createCollectableAnimation(this.boot, "collectables2", 18);
        
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
            const x = Phaser.Math.Between(50, this.cameras.main.width - 50);
            const y = Phaser.Math.Between(50, this.cameras.main.height - 50);
        
            this.tweens.add({
                targets: ghost,
                x: x,
                y: y,
                duration: 5000,
                ease: 'Quadratic',
                onComplete: () => {
                    const randomDuration = Phaser.Math.Between(1000, 5000);
                    setTimeout(() => moveGhostRandomly(ghost), randomDuration);
                }
            });
            }
        };
        
        for (let i = 0; i < numGhosts; i++) {
            moveGhostRandomly(this.ghosts.getChildren()[i]);
        }
        

        // Everything to do with death
        {
            this.ghostDeath = (dude, ghost) => {
                this.doDeath();
                ghost.anims.play('ghostAttack', true);
                setTimeout(() => {
                    this.showDeathScreen();
                }, 700);
            };
        
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
        }

        // Collecting items
        this.physics.add.overlap(this.dude, this.boot, (dude, boot) => {
            this.PlayerSpeedMultiplier *= 1.5;
            this.displayPopupMessage("You got a boot! You can now run faster!");
            boot.destroy();
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
            this.targetScore = this.score+this.generateRandomScoreTarget(200, 250);
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

            if (this.dude.body.velocity.x === 0 && this.dude.body.velocity.y === 0) {
                //dude.anims.play('victoryDance', true);
                this.dude.anims.play('idle', true);
            }

            Phaser.Actions.Call(this.ghosts.getChildren(), function(ghost) {
            ghost.anims.play('ghostWalk', true);
            }, this);

            this.collectables.getChildren().forEach(collectable => {
                collectable.anims.play(collectable.name, true);
            });

            this.collectables.stars.getChildren().forEach(star => {
                star.anims.play(star.name, true);
            });
        }

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


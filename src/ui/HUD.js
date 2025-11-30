import Phaser from 'phaser';

export default class HUD extends Phaser.GameObjects.Container {
    constructor(scene, x, y) {
        super(scene, x, y);

        this.scene = scene;

        // Add to scene
        scene.add.existing(this);

        // Create background panel (horizontal layout for bottom input area)
        this.background = scene.add.rectangle(0, 0, 400, 60, 0x000000, 0.5);
        this.background.setOrigin(0, 0);
        this.add(this.background);

        // Create score text
        this.scoreText = scene.add.text(10, 10, 'Score: 0', {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#ffffff'
        });
        this.add(this.scoreText);

        // Create lives text
        this.livesText = scene.add.text(10, 35, 'Lives: 10', {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#ff6666'
        });
        this.add(this.livesText);

        // Create wave info text (second column)
        this.waveText = scene.add.text(140, 10, 'Wave: 1', {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#88ccff'
        });
        this.add(this.waveText);

        // Create monsters remaining text
        this.monstersText = scene.add.text(140, 35, 'Remaining: 0', {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#ffcc66'
        });
        this.add(this.monstersText);

        // Create total kills text (third column)
        this.killsText = scene.add.text(290, 10, 'Kills: 0', {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#66ff66'
        });
        this.add(this.killsText);

        // Create questions answered text
        this.questionsText = scene.add.text(290, 35, 'Answers: 0', {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#ff99ff'
        });
        this.add(this.questionsText);
    }

    update(score, lives, waveInfo = null) {
        this.scoreText.setText(`Score: ${score}`);
        this.livesText.setText(`Lives: ${lives}`);

        // Flash lives red when low
        if (lives <= 3) {
            this.livesText.setColor('#ff3333');
        } else {
            this.livesText.setColor('#ff6666');
        }

        // Update wave info if provided
        if (waveInfo) {
            this.waveText.setText(`Wave: ${waveInfo.wave}`);
            this.monstersText.setText(`Remaining: ${waveInfo.remaining}`);
            this.killsText.setText(`Kills: ${waveInfo.totalKills}`);
            this.questionsText.setText(`Answers: ${waveInfo.questionsAnswered}`);
        }
    }
}

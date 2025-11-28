import Phaser from 'phaser';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../config.js';

export default class InputBox extends Phaser.GameObjects.Container {
    constructor(scene, x, y) {
        super(scene, x, y);

        this.scene = scene;
        this.currentValue = '';
        this.maxLength = 10;

        // Add to scene
        scene.add.existing(this);

        // Create background
        this.background = scene.add.rectangle(0, 0, 200, 40, 0x222233, 1);
        this.background.setStrokeStyle(2, 0x4466aa);
        this.add(this.background);

        // Create text display
        this.textDisplay = scene.add.text(-90, 0, '', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0, 0.5);
        this.add(this.textDisplay);

        // Create cursor
        this.cursor = scene.add.rectangle(-90, 0, 2, 24, 0xffffff);
        this.add(this.cursor);

        // Blink cursor
        scene.time.addEvent({
            delay: 500,
            callback: () => {
                this.cursor.visible = !this.cursor.visible;
            },
            loop: true
        });

        // Create submit hint
        this.hint = scene.add.text(0, 25, 'Type answer & press Enter', {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#888899'
        }).setOrigin(0.5);
        this.add(this.hint);

        // Set up keyboard input
        this.setupKeyboardInput();
    }

    setupKeyboardInput() {
        this.scene.input.keyboard.on('keydown', (event) => {
            // Prevent event from bubbling to prevent page scrolling etc
            event.stopPropagation();

            // Handle number keys (both regular and numpad)
            if ((event.keyCode >= 48 && event.keyCode <= 57) || // 0-9
                (event.keyCode >= 96 && event.keyCode <= 105)) { // Numpad 0-9
                if (this.currentValue.length < this.maxLength) {
                    const num = event.keyCode >= 96 ? event.keyCode - 96 : event.keyCode - 48;
                    this.currentValue += num.toString();
                    this.updateDisplay();
                }
                return;
            }

            // Handle minus sign
            if (event.keyCode === 189 || event.keyCode === 109) { // - or numpad -
                if (this.currentValue.length === 0) {
                    this.currentValue = '-';
                    this.updateDisplay();
                }
                return;
            }

            // Handle decimal point
            if (event.keyCode === 190 || event.keyCode === 110) { // . or numpad .
                if (!this.currentValue.includes('.') && this.currentValue.length < this.maxLength) {
                    this.currentValue += '.';
                    this.updateDisplay();
                }
                return;
            }

            // Handle backspace
            if (event.keyCode === 8) {
                this.currentValue = this.currentValue.slice(0, -1);
                this.updateDisplay();
                return;
            }

            // Handle enter/return
            if (event.keyCode === 13) {
                this.submit();
                return;
            }
        });
    }

    updateDisplay() {
        this.textDisplay.setText(this.currentValue);
        // Move cursor to end of text
        this.cursor.x = -90 + this.textDisplay.width + 2;
    }

    submit() {
        if (this.currentValue.length > 0) {
            // Emit event with the value
            this.scene.events.emit('answerSubmitted', this.currentValue);
            this.currentValue = '';
            this.updateDisplay();
        }
    }

    flash(isCorrect) {
        const color = isCorrect ? 0x44aa44 : 0xaa4444;
        this.background.setStrokeStyle(3, color);

        this.scene.time.delayedCall(300, () => {
            this.background.setStrokeStyle(2, 0x4466aa);
        });
    }

    getValue() {
        return this.currentValue;
    }

    clear() {
        this.currentValue = '';
        this.updateDisplay();
    }
}

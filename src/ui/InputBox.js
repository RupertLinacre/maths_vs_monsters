import Phaser from 'phaser';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../config.js';

export default class InputBox extends Phaser.GameObjects.Container {
    constructor(scene, x, y) {
        super(scene, x, y);

        this.scene = scene;
        this.currentValue = '';
        this.maxLength = 10;
        this.isEnabled = true;

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
        this.hint = scene.add.text(0, 32, 'Type answer & press Enter', {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#888899'
        }).setOrigin(0.5);
        this.add(this.hint);

        // Create transparent HTML input overlay for mobile keyboard support
        this.createHtmlInput();

        // Set up keyboard input (for desktop, works alongside HTML input)
        this.setupKeyboardInput();
    }

    createHtmlInput() {
        this.htmlInput = document.createElement('input');
        this.htmlInput.type = 'text';
        this.htmlInput.inputMode = 'decimal';  // Show numeric keyboard with decimal on mobile
        this.htmlInput.pattern = '[0-9.\\-]*';
        this.htmlInput.autocomplete = 'off';
        this.htmlInput.autocorrect = 'off';
        this.htmlInput.autocapitalize = 'off';
        this.htmlInput.spellcheck = false;
        this.htmlInput.maxLength = this.maxLength;

        // Make completely transparent but cover the entire canvas
        Object.assign(this.htmlInput.style, {
            position: 'absolute',
            fontSize: '16px',        // >= 16px to prevent iOS zoom
            color: 'transparent',
            backgroundColor: 'transparent',
            border: 'none',
            outline: 'none',
            caretColor: 'transparent',  // Hide the caret too
            pointerEvents: 'auto',
            zIndex: '1000',
            opacity: '0',  // Completely invisible
            // Will be sized to match canvas in updateInputPosition
        });

        document.body.appendChild(this.htmlInput);

        // Sync HTML input value changes to Phaser display
        this.htmlInput.addEventListener('input', () => {
            // Filter to only allow valid characters
            let value = this.htmlInput.value;

            // Allow minus only at the start
            const hasMinus = value.startsWith('-');
            value = value.replace(/[^0-9.]/g, '');

            // Only allow one decimal point
            const parts = value.split('.');
            if (parts.length > 2) {
                value = parts[0] + '.' + parts.slice(1).join('');
            }

            // Re-add minus if it was at the start
            if (hasMinus) {
                value = '-' + value;
            }

            // Enforce max length
            if (value.length > this.maxLength) {
                value = value.slice(0, this.maxLength);
            }

            this.htmlInput.value = value;
            this.currentValue = value;
            this.updateDisplay();
        });

        // Handle enter key submission
        this.htmlInput.addEventListener('keydown', (e) => {
            if (!this.isEnabled) {
                e.preventDefault();
                return;
            }

            if (e.key === 'Escape') {
                e.preventDefault();
                this.scene.events.emit('togglePauseRequested');
                return;
            }

            if (e.key === 'Enter') {
                e.preventDefault();
                this.submit();
            }
        });

        // Disable Phaser keyboard when HTML input is focused (prevents double input)
        this.htmlInput.addEventListener('focus', () => {
            this.htmlInputFocused = true;
            if (this.scene.input && this.scene.input.keyboard) {
                this.scene.input.keyboard.enabled = false;
            }
        });

        // Re-enable Phaser keyboard when HTML input loses focus
        this.htmlInput.addEventListener('blur', () => {
            this.htmlInputFocused = false;
            if (this.scene.input && this.scene.input.keyboard) {
                this.scene.input.keyboard.enabled = true;
            }
        });

        // Position the input over the canvas
        this.updateInputPosition();
        this.scene.scale.on('resize', this.updateInputPosition, this);

        // Also update on window resize (for when browser is resized)
        window.addEventListener('resize', this.updateInputPosition.bind(this));
    }

    updateInputPosition() {
        if (!this.htmlInput || !this.scene || !this.scene.game) return;

        const canvas = this.scene.game.canvas;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();

        // Cover the entire canvas
        Object.assign(this.htmlInput.style, {
            left: `${rect.left}px`,
            top: `${rect.top}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`,
        });
    }

    setupKeyboardInput() {
        // Desktop keyboard input still works via Phaser for backwards compatibility
        this.scene.input.keyboard.on('keydown', (event) => {
            if (!this.isEnabled) {
                return;
            }

            // Prevent event from bubbling to prevent page scrolling etc
            event.stopPropagation();

            // Handle number keys (both regular and numpad)
            if ((event.keyCode >= 48 && event.keyCode <= 57) || // 0-9
                (event.keyCode >= 96 && event.keyCode <= 105)) { // Numpad 0-9
                if (this.currentValue.length < this.maxLength) {
                    const num = event.keyCode >= 96 ? event.keyCode - 96 : event.keyCode - 48;
                    this.currentValue += num.toString();
                    this.syncToHtmlInput();
                    this.updateDisplay();
                }
                return;
            }

            // Handle minus sign
            if (event.keyCode === 189 || event.keyCode === 109) { // - or numpad -
                if (this.currentValue.length === 0) {
                    this.currentValue = '-';
                    this.syncToHtmlInput();
                    this.updateDisplay();
                }
                return;
            }

            // Handle decimal point
            if (event.keyCode === 190 || event.keyCode === 110) { // . or numpad .
                if (!this.currentValue.includes('.') && this.currentValue.length < this.maxLength) {
                    this.currentValue += '.';
                    this.syncToHtmlInput();
                    this.updateDisplay();
                }
                return;
            }

            // Handle backspace
            if (event.keyCode === 8) {
                this.currentValue = this.currentValue.slice(0, -1);
                this.syncToHtmlInput();
                this.updateDisplay();
                return;
            }

            // Handle enter/return
            if (event.keyCode === 13) {
                this.submit();
                return;
            }

            // Handle escape for pause toggle
            if (event.keyCode === 27) {
                this.scene.events.emit('togglePauseRequested');
                return;
            }
        });
    }

    syncToHtmlInput() {
        // Keep HTML input in sync with Phaser state (for when user switches between desktop/mobile)
        if (this.htmlInput) {
            this.htmlInput.value = this.currentValue;
        }
    }

    updateDisplay() {
        this.textDisplay.setText(this.currentValue);
        // Move cursor to end of text
        this.cursor.x = -90 + this.textDisplay.width + 2;
    }

    submit() {
        if (!this.isEnabled) {
            return;
        }

        if (this.currentValue.length > 0) {
            // Emit event with the value
            this.scene.events.emit('answerSubmitted', this.currentValue);
            this.currentValue = '';
            this.syncToHtmlInput();
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
        this.syncToHtmlInput();
        this.updateDisplay();
    }

    setEnabled(enabled) {
        this.isEnabled = enabled;

        if (this.htmlInput) {
            this.htmlInput.disabled = !enabled;
            this.htmlInput.style.pointerEvents = enabled ? 'auto' : 'none';
            if (!enabled) {
                this.htmlInput.blur();
            }
        }

        this.background.setAlpha(enabled ? 1 : 0.6);
        this.textDisplay.setAlpha(enabled ? 1 : 0.6);
        this.hint.setAlpha(enabled ? 1 : 0.6);
        this.cursor.setVisible(enabled);
    }

    destroy() {
        // Clean up event listeners
        this.scene.scale.off('resize', this.updateInputPosition, this);

        // Remove HTML input from DOM
        if (this.htmlInput && this.htmlInput.parentNode) {
            this.htmlInput.remove();
        }

        super.destroy();
    }
}

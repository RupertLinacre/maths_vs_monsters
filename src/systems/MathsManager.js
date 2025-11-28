import { generateProblem, checkAnswer } from 'maths-game-problem-generator';

// Map difficulty to year level offset
const YEAR_LEVELS = [
    'reception', 'year1', 'year2', 'year3', 'year4', 'year5', 'year6'
];

export default class MathsManager {
    constructor(baseYearLevel = 'year1') {
        this.setBaseYearLevel(baseYearLevel);
    }

    setBaseYearLevel(yearLevel) {
        this.baseYearLevel = yearLevel;
        this.baseYearIndex = YEAR_LEVELS.indexOf(yearLevel);
        if (this.baseYearIndex === -1) {
            this.baseYearIndex = 1; // Default to year1
            this.baseYearLevel = 'year1';
        }
    }

    getYearLevelForDifficulty(difficulty) {
        let offset = 0;
        if (difficulty === 'medium') offset = 1;
        if (difficulty === 'hard') offset = 2;

        const yearIndex = Math.min(this.baseYearIndex + offset, YEAR_LEVELS.length - 1);
        return YEAR_LEVELS[yearIndex];
    }

    generateProblemForDifficulty(difficulty) {
        const yearLevel = this.getYearLevelForDifficulty(difficulty);

        try {
            const problem = generateProblem({
                yearLevel: yearLevel
            });
            return problem;
        } catch (e) {
            // Fallback if library fails
            console.warn('Problem generation failed, using fallback', e);
            return this.generateFallbackProblem(difficulty);
        }
    }

    generateFallbackProblem(difficulty) {
        // Simple fallback problems
        let a, b;
        if (difficulty === 'easy') {
            a = Math.floor(Math.random() * 5) + 1;
            b = Math.floor(Math.random() * 5) + 1;
        } else if (difficulty === 'medium') {
            a = Math.floor(Math.random() * 10) + 1;
            b = Math.floor(Math.random() * 10) + 1;
        } else {
            a = Math.floor(Math.random() * 12) + 1;
            b = Math.floor(Math.random() * 12) + 1;
        }

        return {
            expression: `${a} + ${b}`,
            answer: a + b,
            formattedAnswer: String(a + b)
        };
    }

    checkAnswer(problem, userAnswer) {
        // Safety checks
        if (!problem) {
            console.warn('checkAnswer called with null problem');
            return false;
        }

        if (userAnswer === null || userAnswer === undefined || userAnswer === '') {
            return false;
        }

        try {
            const result = checkAnswer(problem, userAnswer);
            return result === true;
        } catch (e) {
            console.warn('checkAnswer failed, using fallback comparison', e);
            // Fallback check
            try {
                const numAnswer = parseFloat(userAnswer);
                return !isNaN(numAnswer) && numAnswer === problem.answer;
            } catch (e2) {
                return false;
            }
        }
    }
}

// Export year levels for menu
export { YEAR_LEVELS };

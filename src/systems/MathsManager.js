import { generateProblem, checkAnswer } from 'maths-game-problem-generator';

// Map difficulty to year level offset
const YEAR_LEVELS = [
    'reception', 'year1', 'year2', 'year3', 'year4', 'year5', 'year6'
];

const PROBLEM_TYPE_OPTIONS = [
    { key: 'all', label: 'All' },
    { key: 'addition', label: 'Addition' },
    { key: 'subtraction', label: 'Subtraction' },
    { key: 'multiplication', label: 'Multiplication' },
    { key: 'division', label: 'Division' }
];

const PROBLEM_TYPE_KEYS = PROBLEM_TYPE_OPTIONS.map((option) => option.key);

export default class MathsManager {
    constructor(baseYearLevel = 'year1', problemType = 'all') {
        this.setBaseYearLevel(baseYearLevel);
        this.setProblemType(problemType);
    }

    setBaseYearLevel(yearLevel) {
        this.baseYearLevel = yearLevel;
        this.baseYearIndex = YEAR_LEVELS.indexOf(yearLevel);
        if (this.baseYearIndex === -1) {
            this.baseYearIndex = 1; // Default to year1
            this.baseYearLevel = 'year1';
        }
    }

    setProblemType(problemType) {
        if (PROBLEM_TYPE_KEYS.includes(problemType)) {
            this.problemType = problemType;
        } else {
            this.problemType = 'all';
        }
    }

    getYearLevelForDifficulty(difficulty) {
        // Offsets relative to base year:
        // easy = base - 1, medium = base, hard = base + 1, cluster = base + 2
        let offset = -1; // easy
        if (difficulty === 'medium') offset = 0;
        if (difficulty === 'hard') offset = 1;
        if (difficulty === 'cluster') offset = 2;

        // Clamp between 0 (reception) and max (year6)
        const yearIndex = Math.max(0, Math.min(this.baseYearIndex + offset, YEAR_LEVELS.length - 1));
        return YEAR_LEVELS[yearIndex];
    }

    generateProblemForDifficulty(difficulty) {
        const yearLevel = this.getYearLevelForDifficulty(difficulty);
        const useType = this.problemType && this.problemType !== 'all';

        try {
            const problem = generateProblem({
                yearLevel: yearLevel,
                ...(useType ? { type: this.problemType } : {})
            });
            return problem;
        } catch (e) {
            if (useType) {
                try {
                    const fallbackProblem = generateProblem({ yearLevel: yearLevel });
                    return fallbackProblem;
                } catch (fallbackError) {
                    console.warn('Problem generation failed, using fallback', fallbackError);
                    return this.generateFallbackProblem(difficulty);
                }
            }

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
export { YEAR_LEVELS, PROBLEM_TYPE_OPTIONS };

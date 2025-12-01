import { getConjugation } from 'spanish-verbs';
import { validateAnswer } from '../utils/accentUtils.js';
import { PRONOUNS, TENSE_MAPPING } from '../config.js';

/**
 * VerbManager - Core system for Spanish verb conjugation prompts and validation
 * Replaces MathsManager in the game architecture
 */
export default class VerbManager {
    constructor(baseDifficulty = 'Beginner') {
        this.setBaseDifficulty(baseDifficulty);
        this.verbList = this.initializeVerbList();
        this.conjugationCache = new Map(); // Performance optimization
        this.pronouns = PRONOUNS;
        this.tenseMapping = TENSE_MAPPING;
    }

    /**
     * Initialize verb list with high-frequency Spanish verbs
     * MVP: 20 verbs (10 regular, 10 irregular)
     */
    initializeVerbList() {
        return [
            // Irregular verbs (high frequency, essential)
            'ser',      // to be (permanent)
            'estar',    // to be (temporary)
            'tener',    // to have
            'hacer',    // to do/make
            'ir',       // to go
            'poder',    // can/to be able
            'decir',    // to say/tell
            'ver',      // to see
            'dar',      // to give
            'saber',    // to know
            // Regular -ar verbs
            'hablar',   // to speak
            'trabajar', // to work
            'estudiar', // to study
            // Regular -er verbs
            'comer',    // to eat
            'beber',    // to drink
            'leer',     // to read
            // Regular -ir verbs
            'vivir',    // to live
            'escribir', // to write
            'abrir',    // to open
            'recibir'   // to receive
        ];
    }

    /**
     * Set base difficulty level for the game
     * @param {string} difficulty - 'Beginner', 'Intermediate', or 'Advanced'
     */
    setBaseDifficulty(difficulty) {
        this.baseDifficulty = difficulty;
    }

    /**
     * Get random verb from verb list
     * @returns {string} Infinitive form (e.g., 'hablar')
     */
    getRandomVerb() {
        return this.verbList[Math.floor(Math.random() * this.verbList.length)];
    }

    /**
     * Get random pronoun
     * @returns {string} Subject pronoun (e.g., 'yo', 'tú', 'él')
     */
    getRandomPronoun() {
        return this.pronouns[Math.floor(Math.random() * this.pronouns.length)];
    }

    /**
     * Get tense and mood configuration for a difficulty tier
     * @param {string} difficulty - 'easy', 'medium', or 'hard'
     * @returns {Object} { tense, mood }
     */
    getTenseForDifficulty(difficulty) {
        const config = this.tenseMapping[difficulty];
        
        if (!config) {
            console.warn(`Invalid difficulty: ${difficulty}, defaulting to easy`);
            return { tense: 'PRESENT', mood: 'INDICATIVE' };
        }

        // Easy or medium: randomly select from tenses array
        if (difficulty === 'easy' || difficulty === 'medium') {
            const randomTense = config.tenses[Math.floor(Math.random() * config.tenses.length)];
            return { tense: randomTense, mood: config.moods[0] };
        }

        // Hard: distribute between subjunctive, conditional, and future
        if (difficulty === 'hard') {
            const rand = Math.random();
            if (rand < 0.5) {
                // 50% subjunctive
                const randomTense = config.tenses[Math.floor(Math.random() * config.tenses.length)];
                return { tense: randomTense, mood: 'SUBJUNCTIVE' };
            } else if (rand < 0.75) {
                // 25% conditional
                return { tense: 'PRESENT', mood: 'CONDITIONAL' };
            } else {
                // 25% future
                return { tense: 'FUTURE', mood: 'INDICATIVE' };
            }
        }

        return { tense: 'PRESENT', mood: 'INDICATIVE' };
    }

    /**
     * Map pronoun string to person index (0-5) required by spanish-verbs library
     * @param {string} pronoun - Subject pronoun
     * @returns {number} Person index
     */
    getPronounIndex(pronoun) {
        const map = {
            'yo': 0,
            'tú': 1,
            'él': 2,
            'ella': 2,
            'usted': 2,
            'nosotros': 3,
            'nosotras': 3,
            'vosotros': 4,
            'vosotras': 4,
            'ellos': 5,
            'ellas': 5,
            'ustedes': 5
        };
        return map[pronoun.toLowerCase()] ?? 2; // Default to 3rd person singular if unknown
    }

    /**
     * Conjugate verb using spanish-verbs library with caching and fallback
     * @param {string} infinitive - Verb infinitive (e.g., 'hablar')
     * @param {string} tense - Tense enum (e.g., 'PRESENT')
     * @param {string} mood - Mood enum (e.g., 'INDICATIVE')
     * @param {string} pronoun - Subject pronoun (e.g., 'yo')
     * @returns {string} Conjugated form (e.g., 'hablo')
     */
    conjugateVerb(infinitive, tense, mood, pronoun) {
        // Check cache first
        const cacheKey = `${infinitive}-${tense}-${mood}-${pronoun}`;
        if (this.conjugationCache.has(cacheKey)) {
            return this.conjugationCache.get(cacheKey);
        }

        try {
            // spanish-verbs library expects person index (0-5)
            const personIndex = this.getPronounIndex(pronoun);
            
            // Construct tense string expected by library (MOOD_TENSE)
            let libraryTense = `${mood}_${tense}`;
            
            // Handle special cases
            if (libraryTense === 'SUBJUNCTIVE_IMPERFECT') {
                libraryTense = 'SUBJUNCTIVE_IMPERFECT_RA'; // Default to -ra form
            }
            
            const conjugation = getConjugation(infinitive, libraryTense, personIndex);
            
            // Cache the result
            this.conjugationCache.set(cacheKey, conjugation);
            return conjugation;
        } catch (error) {
            console.warn(`Conjugation failed for ${infinitive} (${tense}, ${mood}, ${pronoun}):`, error);
            // Fallback: return infinitive (better than crashing)
            return infinitive;
        }
    }

    /**
     * Get user-friendly tense name for display
     * @param {string} tense - Tense enum
     * @param {string} mood - Mood enum
     * @returns {string} Display-friendly name
     */
    getTenseDisplayName(tense, mood) {
        if (mood === 'CONDITIONAL') return 'conditional';
        if (mood === 'SUBJUNCTIVE') return `subjunctive ${tense.toLowerCase()}`;
        
        const names = {
            'PRESENT': 'present',
            'PRETERITE': 'preterite',
            'IMPERFECT': 'imperfect',
            'FUTURE': 'future'
        };
        return names[tense] || tense.toLowerCase();
    }

    /**
     * Generate a verb conjugation prompt for a tower
     * @param {string} difficulty - Tower difficulty tier ('easy', 'medium', 'hard')
     * @returns {Object} VerbPrompt object
     */
    generatePromptForDifficulty(difficulty) {
        const infinitive = this.getRandomVerb();
        const pronoun = this.getRandomPronoun();
        const { tense, mood } = this.getTenseForDifficulty(difficulty);
        
        const conjugation = this.conjugateVerb(infinitive, tense, mood, pronoun);
        
        // For subjunctive imperfect, both forms are valid (hablara/hablase)
        const correctAnswers = [conjugation];
        // TODO: Handle subjunctive alternatives in future enhancement
        
        const tenseDisplay = this.getTenseDisplayName(tense, mood);
        const displayText = `${infinitive} (${pronoun}, ${tenseDisplay})`;
        
        return {
            infinitive,
            pronoun,
            tense: tenseDisplay,
            tenseFormal: tense,
            mood,
            correctAnswers,
            difficulty,
            displayText,
            verbType: this.getVerbType(infinitive),
            isIrregular: this.isIrregularVerb(infinitive)
        };
    }

    /**
     * Validate user answer against a verb prompt
     * @param {Object} prompt - VerbPrompt object
     * @param {string} userAnswer - User's typed answer
     * @returns {Object} ValidationResult { isCorrect, correctForm, hasAccents, bonusPoints }
     */
    validateAnswer(prompt, userAnswer) {
        if (!prompt || !prompt.correctAnswers) {
            console.warn('Invalid prompt provided to validateAnswer');
            return {
                isCorrect: false,
                correctForm: '',
                hasAccents: false,
                bonusPoints: 0
            };
        }

        // Use accentUtils for validation
        const result = validateAnswer(userAnswer, prompt.correctAnswers[0]);
        
        return {
            isCorrect: result.isCorrect,
            correctForm: prompt.correctAnswers[0], // Always show properly accented form
            hasAccents: result.hasAccents,
            bonusPoints: result.bonusPoints
        };
    }

    /**
     * Get verb type for classification
     * @param {string} infinitive - Verb infinitive
     * @returns {string} Verb type
     */
    getVerbType(infinitive) {
        if (this.isIrregularVerb(infinitive)) {
            return 'irregular';
        }
        if (infinitive.endsWith('ar')) return 'regular-ar';
        if (infinitive.endsWith('er')) return 'regular-er';
        if (infinitive.endsWith('ir')) return 'regular-ir';
        return 'unknown';
    }

    /**
     * Check if verb is irregular
     * @param {string} infinitive - Verb infinitive
     * @returns {boolean} True if irregular
     */
    isIrregularVerb(infinitive) {
        const irregulars = ['ser', 'estar', 'tener', 'hacer', 'ir', 'poder', 'decir', 'ver', 'dar', 'saber'];
        return irregulars.includes(infinitive);
    }
}

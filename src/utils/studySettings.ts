// Study Settings - Shared configuration stored in localStorage

export type QuestionType = 'mcq' | 'truefalse' | 'written' | 'flashcard';

export interface StudySettings {
    cardsPerRound: number;
    frontSide: 'term' | 'definition';
    enabledQuestionTypes: QuestionType[];
    // New options
    examDate?: string;
    shuffleTerms: boolean;
    studyStarred: boolean;
    smartGrading: boolean;
    retypeAnswers: boolean;
    overrideWrong: boolean;
    autoNextAfterAnswer: boolean;
    autoNextDuration: number;
    audio: {
        soundEffects: boolean;
        backgroundMusic: string;
        autoplayAudio: boolean;
    };
}

const STORAGE_KEY = 'deepterm_study_settings';

const DEFAULT_SETTINGS: StudySettings = {
    cardsPerRound: 7,
    frontSide: 'definition',
    enabledQuestionTypes: ['mcq', 'truefalse', 'written', 'flashcard'],
    shuffleTerms: false,
    studyStarred: false,
    smartGrading: true,
    retypeAnswers: true,
    overrideWrong: true,
    autoNextAfterAnswer: true,
    autoNextDuration: 2,
    audio: {
        soundEffects: false,
        backgroundMusic: 'None',
        autoplayAudio: false,
    }
};

export function getStudySettings(): StudySettings {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return DEFAULT_SETTINGS;
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    } catch {
        return DEFAULT_SETTINGS;
    }
}

export function saveStudySettings(settings: Partial<StudySettings>): StudySettings {
    const current = getStudySettings();
    const updated = { ...current, ...settings };

    if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }

    return updated;
}

export function getQuestionTypeForStage(
    stage: 'new' | 'learning' | 'almost_done' | 'mastered',
    enabledTypes: QuestionType[]
): QuestionType {
    // Default progression: new=MCQ, learning=T/F, almost_done=written, mastered=flashcard
    const stageDefaults: Record<string, QuestionType> = {
        new: 'mcq',
        learning: 'truefalse',
        almost_done: 'written',
        mastered: 'flashcard',
    };

    const preferred = stageDefaults[stage];

    // If preferred type is enabled, use it
    if (enabledTypes.includes(preferred)) return preferred;

    // Otherwise use first enabled type
    return enabledTypes[0] || 'mcq';
}

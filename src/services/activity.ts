import { createClient } from "@/config/supabase/client";

// XP rewards configuration
const XP_REWARDS = {
    FLASHCARD_CORRECT: 10,
    FLASHCARD_MASTERED: 25,
    QUIZ_COMPLETED: 20,
    QUIZ_PERFECT: 50,
    POMODORO_WORK: 15,
    STUDY_MINUTE: 1,
} as const;

// Bounds for XP to prevent abuse
const XP_BOUNDS = {
    MIN: 1,
    MAX: 1000, // Maximum XP per single operation
} as const;

// Whitelist of valid stat names (must match user_stats columns)
const VALID_STAT_NAMES = [
    'flashcard_sets_created',
    'flashcards_mastered',
    'quizzes_completed',
    'perfect_quizzes',
    'pomodoro_sessions',
    'reviewers_created',
    'materials_uploaded',
] as const;

type ValidStatName = typeof VALID_STAT_NAMES[number];

export async function recordStudyActivity(options: {
    minutes?: number;
    flashcards?: number;
    quizzes?: number;
    pomodoros?: number;
}) {
    const supabase = createClient();

    // Validate and clamp input values
    const safeMinutes = Math.max(0, Math.min(options.minutes || 0, 1440)); // Max 24 hours
    const safeFlashcards = Math.max(0, Math.min(options.flashcards || 0, 1000));
    const safeQuizzes = Math.max(0, Math.min(options.quizzes || 0, 100));
    const safePomodoros = Math.max(0, Math.min(options.pomodoros || 0, 100));

    // Get user's local date (not UTC)
    const now = new Date();
    const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const { error } = await supabase.rpc("record_study_activity", {
        p_minutes: safeMinutes,
        p_flashcards: safeFlashcards,
        p_quizzes: safeQuizzes,
        p_pomodoros: safePomodoros,
        p_activity_date: localDate
    });
    return { error };
}

export async function addXP(amount: number): Promise<{ leveledUp: boolean; newLevel?: number }> {
    // Bounds checking to prevent XP manipulation
    if (typeof amount !== 'number' || !Number.isFinite(amount)) {
        console.error("Invalid XP amount:", amount);
        return { leveledUp: false };
    }

    const safeAmount = Math.max(XP_BOUNDS.MIN, Math.min(Math.floor(amount), XP_BOUNDS.MAX));

    const supabase = createClient();
    const { data, error } = await supabase.rpc("add_xp", { p_amount: safeAmount });

    if (error) {
        console.error("Failed to add XP:", error);
        return { leveledUp: false };
    }

    if (data && data.length > 0) {
        return {
            leveledUp: data[0].leveled_up || false,
            newLevel: data[0].new_level
        };
    }

    return { leveledUp: false };
}

export { XP_REWARDS };

export async function incrementStat(statName: string, amount: number = 1) {
    // Whitelist validation
    if (!VALID_STAT_NAMES.includes(statName as ValidStatName)) {
        console.error("Invalid stat name:", statName);
        return { error: new Error(`Invalid stat name: ${statName}`) };
    }

    // Bounds checking for amount
    if (typeof amount !== 'number' || !Number.isFinite(amount)) {
        console.error("Invalid amount:", amount);
        return { error: new Error("Invalid amount") };
    }

    const safeAmount = Math.max(1, Math.min(Math.floor(amount), 100));

    const supabase = createClient();
    const { error } = await supabase.rpc("increment_stat", {
        p_stat_name: statName,
        p_amount: safeAmount
    });
    return { error };
}

export async function logPomodoroSession(phase: "work" | "shortBreak" | "longBreak", durationMinutes: number, startedAt: Date) {
    const supabase = createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        console.error("Cannot log Pomodoro session: No authenticated user");
        return { error: new Error("No authenticated user") };
    }

    const { error } = await supabase.from("pomodoro_sessions").insert({
        user_id: user.id,
        phase,
        duration_minutes: durationMinutes,
        started_at: startedAt.toISOString(),
        completed: true
    });

    if (error) {
        console.error("Failed to insert pomodoro_session:", error);
    }

    if (!error && phase === "work") {
        await recordStudyActivity({ minutes: durationMinutes, pomodoros: 1 });
        // Award XP for completing work session
        await addXP(XP_REWARDS.POMODORO_WORK);
    }
    return { error };
}

export async function logQuizAttempt(quizId: string, score: number, totalQuestions: number, answers: Record<string, string>) {
    const supabase = createClient();
    const percentage = Math.round((score / totalQuestions) * 100);

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        console.error("Cannot log quiz attempt: No authenticated user");
        return { error: new Error("No authenticated user") };
    }

    const { error } = await supabase.from("quiz_attempts").insert({
        user_id: user.id,
        quiz_id: quizId,
        score,
        total_questions: totalQuestions,
        percentage,
        answers
    });

    if (error) {
        console.error("Failed to insert quiz_attempt:", error);
    }

    if (!error) {
        await recordStudyActivity({ quizzes: 1 });
        if (percentage === 100) {
            await incrementStat("perfect_quizzes");
        }
    }
    return { error };
}


export async function logFlashcardReview(count: number, minutes?: number) {
    return recordStudyActivity({ flashcards: count, minutes });
}

export async function updateFlashcardStatus(cardId: string, status: "new" | "learning" | "review" | "mastered") {
    const supabase = createClient();
    const { error } = await supabase
        .from("flashcards")
        .update({ status, last_reviewed: new Date().toISOString() })
        .eq("id", cardId);

    if (!error && status === "mastered") {
        await incrementStat("flashcards_mastered");
    }
    return { error };
}

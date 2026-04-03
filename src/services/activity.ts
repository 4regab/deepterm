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

/**
 * Get local date string in YYYY-MM-DD format for activity tracking
 */
function getLocalDateString(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export async function recordStudyActivity(options: {
    minutes?: number;
    flashcards?: number;
    quizzes?: number;
    pomodoros?: number;
}) {
    const supabase = createClient();

    // Auth guard: require authenticated user (SECURITY FIX)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        console.warn('Cannot record study activity: No authenticated user');
        return { error: new Error('No authenticated user') };
    }

    // Validate and clamp input values
    const safeMinutes = Math.max(0, Math.min(options.minutes || 0, 1440)); // Max 24 hours
    const safeFlashcards = Math.max(0, Math.min(options.flashcards || 0, 1000));
    const safeQuizzes = Math.max(0, Math.min(options.quizzes || 0, 100));
    const safePomodoros = Math.max(0, Math.min(options.pomodoros || 0, 100));

    const localDate = getLocalDateString();

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

    // Check if user is authenticated first
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        console.warn("Cannot add XP: No authenticated user");
        return { leveledUp: false };
    }

    const { data, error } = await supabase.rpc("add_xp", { p_amount: safeAmount });

    if (error) {
        // Only log actual errors, not empty objects
        if (error.message || error.code) {
            console.error("Failed to add XP:", error.message || error.code);
        }
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

    // Auth guard: require authenticated user (SECURITY FIX)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        console.warn('Cannot increment stat: No authenticated user');
        return { error: new Error('No authenticated user') };
    }

    const { error } = await supabase.rpc("increment_stat", {
        p_stat_name: statName,
        p_amount: safeAmount
    });
    return { error };
}

/**
 * OPTIMIZED: Log a completed pomodoro session using batched RPC.
 * Reduces 3-4 network calls to a single atomic operation.
 */
export async function logPomodoroSession(phase: "work" | "shortBreak" | "longBreak", durationMinutes: number, startedAt: Date) {
    const supabase = createClient();

    // Auth guard: require authenticated user (SECURITY FIX)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        console.warn('Cannot log pomodoro session: No authenticated user');
        return { error: new Error('No authenticated user') };
    }

    const localDate = getLocalDateString();

    // Use batched RPC for efficiency - single call handles:
    // 1. Pomodoro session insert
    // 2. Study activity recording  
    // 3. XP award
    // 4. Achievement check
    const { data, error } = await supabase.rpc("log_completed_activity", {
        p_activity_type: "pomodoro",
        p_data: {
            phase,
            duration_minutes: durationMinutes,
            started_at: startedAt.toISOString(),
            local_date: localDate
        }
    });

    if (error) {
        console.error("Failed to log pomodoro session:", error);
        return { error };
    }

    return {
        error: null,
        xpAwarded: data?.xp_awarded,
        leveledUp: data?.leveled_up,
        newLevel: data?.new_level
    };
}

/**
 * OPTIMIZED: Log a quiz attempt using batched RPC.
 */
export async function logQuizAttempt(quizId: string, score: number, totalQuestions: number, answers: Record<string, string>) {
    const supabase = createClient();
    const percentage = Math.round((score / totalQuestions) * 100);
    const localDate = getLocalDateString();

    // Get current user for inserting quiz attempt
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        console.error("Cannot log quiz attempt: No authenticated user");
        return { error: new Error("No authenticated user") };
    }

    // Insert the quiz attempt (still need this for detailed records)
    const { error: insertError } = await supabase.from("quiz_attempts").insert({
        user_id: user.id,
        quiz_id: quizId,
        score,
        total_questions: totalQuestions,
        percentage,
        answers
    });

    if (insertError) {
        console.error("Failed to insert quiz_attempt:", insertError);
        return { error: insertError };
    }

    // Use batched RPC for activity tracking + XP
    const { data, error } = await supabase.rpc("log_completed_activity", {
        p_activity_type: "quiz",
        p_data: {
            percentage,
            local_date: localDate
        }
    });

    if (error) {
        console.error("Failed to log quiz activity:", error);
    }

    return {
        error: null,
        xpAwarded: data?.xp_awarded,
        leveledUp: data?.leveled_up
    };
}


export async function logFlashcardReview(count: number, minutes?: number) {
    return recordStudyActivity({ flashcards: count, minutes });
}

/**
 * Update a single flashcard status - use batchUpdateFlashcardStatuses for bulk updates
 * @deprecated Prefer batchUpdateFlashcardStatuses for session-based updates to reduce network requests
 */
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

export interface FlashcardStatusUpdate {
    id: string;
    status: "new" | "learning" | "review" | "mastered";
}

/**
 * OPTIMIZED: Batch update multiple flashcard statuses in a single request.
 * This is more efficient than calling updateFlashcardStatus for each card.
 * @param updates Array of card IDs and their new statuses
 * @returns Object with error if any, and count of mastered cards
 */
export async function batchUpdateFlashcardStatuses(updates: FlashcardStatusUpdate[]) {
    if (!updates || updates.length === 0) {
        return { error: null, masteredCount: 0 };
    }

    const supabase = createClient();
    const now = new Date().toISOString();

    // Group updates by status for efficient batch operations
    const statusGroups: Record<string, string[]> = {};
    let masteredCount = 0;

    for (const update of updates) {
        if (!statusGroups[update.status]) {
            statusGroups[update.status] = [];
        }
        statusGroups[update.status].push(update.id);
        if (update.status === "mastered") {
            masteredCount++;
        }
    }

    // Execute batch updates for each status group
    const updatePromises = Object.entries(statusGroups).map(([status, ids]) =>
        supabase
            .from("flashcards")
            .update({ status, last_reviewed: now })
            .in("id", ids)
    );

    const results = await Promise.all(updatePromises);
    type UpdateResult = Awaited<typeof updatePromises[number]>;
    const errors = results.filter((r: UpdateResult) => r.error).map((r: UpdateResult) => r.error);

    // Use batched RPC for mastered stat + XP if any cards were mastered
    if (masteredCount > 0 && errors.length === 0) {
        const localDate = getLocalDateString();
        await supabase.rpc("log_completed_activity", {
            p_activity_type: "flashcard_mastered",
            p_data: {
                count: masteredCount,
                local_date: localDate
            }
        });
    }

    return {
        error: errors.length > 0 ? errors[0] : null,
        masteredCount
    };
}

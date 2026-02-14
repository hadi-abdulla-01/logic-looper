/**
 * IndexedDB wrapper for Logic Looper
 * Provides offline-first storage for game data
 */

const DB_NAME = 'LogicLooperDB';
const DB_VERSION = 2;

// Store names
export const STORES = {
    PUZZLES: 'puzzles',
    DAILY_ACTIVITY: 'dailyActivity',
    ACHIEVEMENTS: 'achievements',
    USER_PROGRESS: 'userProgress',
    SETTINGS: 'settings',
} as const;

export interface PuzzleRecord {
    id: string; // date in YYYY-MM-DD format
    puzzleType: string;
    puzzleData: any;
    userSolution?: any;
    completed: boolean;
    score?: number;
    timeInSeconds?: number;
    hintsUsed: number;
    completedAt?: string; // ISO timestamp
    synced: boolean;
}

export interface DailyActivityRecord {
    id?: string;
    date: string; // YYYY-MM-DD
    completed: boolean;
    score: number;
    timeInSeconds: number;
    puzzleType: string;
    difficulty: string;
    rank: string;
    synced: boolean;
}

export interface AchievementRecord {
    id: string;
    name: string;
    description: string;
    unlocked: boolean;
    unlockedAt?: string; // ISO timestamp
    progress?: number;
    target?: number;
}

export interface UserProgressRecord {
    id: string;
    streak: number;
    lastPlayedDate: string; // YYYY-MM-DD
    totalPuzzlesSolved: number;
    totalScore: number;
    averageTime: number;
    progressionLevel: number;
}

export interface SettingsRecord {
    id: string;
    key: string;
    value: any;
}

/**
 * Initialize IndexedDB
 */
function initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;

            // Create puzzles store
            if (!db.objectStoreNames.contains(STORES.PUZZLES)) {
                const puzzleStore = db.createObjectStore(STORES.PUZZLES, { keyPath: 'id' });
                puzzleStore.createIndex('completed', 'completed', { unique: false });
                puzzleStore.createIndex('synced', 'synced', { unique: false });
            }

            // Create daily activity store
            if (db.objectStoreNames.contains(STORES.DAILY_ACTIVITY)) {
                if (event.oldVersion < 2) {
                    db.deleteObjectStore(STORES.DAILY_ACTIVITY);
                }
            }

            if (!db.objectStoreNames.contains(STORES.DAILY_ACTIVITY)) {
                // V2: Use 'id' as keyPath to allow multiple records per day
                const activityStore = db.createObjectStore(STORES.DAILY_ACTIVITY, { keyPath: 'id' });
                activityStore.createIndex('date', 'date', { unique: false });
                activityStore.createIndex('completed', 'completed', { unique: false });
                activityStore.createIndex('synced', 'synced', { unique: false });
            }

            // Create achievements store
            if (!db.objectStoreNames.contains(STORES.ACHIEVEMENTS)) {
                const achievementStore = db.createObjectStore(STORES.ACHIEVEMENTS, { keyPath: 'id' });
                achievementStore.createIndex('unlocked', 'unlocked', { unique: false });
            }

            // Create user progress store
            if (!db.objectStoreNames.contains(STORES.USER_PROGRESS)) {
                db.createObjectStore(STORES.USER_PROGRESS, { keyPath: 'id' });
            }

            // Create settings store
            if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
                db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
            }
        };
    });
}

/**
 * Generic get operation
 */
export async function getRecord<T>(storeName: string, key: string): Promise<T | undefined> {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(key);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Generic put operation
 */
export async function putRecord<T>(storeName: string, record: T): Promise<void> {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(record);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

/**
 * Generic delete operation
 */
export async function deleteRecord(storeName: string, key: string): Promise<void> {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(key);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

/**
 * Get all records from a store
 */
export async function getAllRecords<T>(storeName: string): Promise<T[]> {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Get records by index
 */
export async function getRecordsByIndex<T>(
    storeName: string,
    indexName: string,
    value: any
): Promise<T[]> {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const index = store.index(indexName);
        const request = index.getAll(value);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Clear all data from a store
 */
export async function clearStore(storeName: string): Promise<void> {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

/**
 * Migrate data from localStorage to IndexedDB
 */
export async function migrateFromLocalStorage(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
        // Migrate streak
        const streak = localStorage.getItem('streak');
        if (streak) {
            const userProgress: UserProgressRecord = {
                id: 'default',
                streak: parseInt(streak, 10),
                lastPlayedDate: new Date().toISOString().split('T')[0],
                totalPuzzlesSolved: 0,
                totalScore: 0,
                averageTime: 0,
                progressionLevel: 1,
            };
            await putRecord(STORES.USER_PROGRESS, userProgress);
        }

        // Migrate solved dates
        const solvedDates = localStorage.getItem('solvedDates');
        if (solvedDates) {
            const dates: string[] = JSON.parse(solvedDates);
            for (const date of dates) {
                const activity: DailyActivityRecord = {
                    date,
                    completed: true,
                    score: 0,
                    timeInSeconds: 0,
                    puzzleType: 'NumberMatrix',
                    difficulty: 'Medium',
                    rank: 'C',
                    synced: false,
                };
                await putRecord(STORES.DAILY_ACTIVITY, activity);
            }
        }

        console.log('Migration from localStorage completed');
    } catch (error) {
        console.error('Migration failed:', error);
    }
}

/**
 * Get user progress (streak, stats, etc.)
 */
export async function getUserProgress(): Promise<UserProgressRecord> {
    const progress = await getRecord<UserProgressRecord>(STORES.USER_PROGRESS, 'default');
    if (!progress) {
        const defaultProgress: UserProgressRecord = {
            id: 'default',
            streak: 0,
            lastPlayedDate: '',
            totalPuzzlesSolved: 0,
            totalScore: 0,
            averageTime: 0,
            progressionLevel: 1,
        };
        await putRecord(STORES.USER_PROGRESS, defaultProgress);
        return defaultProgress;
    }
    return progress;
}

/**
 * Update user progress
 */
export async function updateUserProgress(updates: Partial<UserProgressRecord>): Promise<void> {
    const current = await getUserProgress();
    const updated = { ...current, ...updates };
    await putRecord(STORES.USER_PROGRESS, updated);
}

/**
 * Get all completed dates for heatmap
 */
export async function getCompletedDates(): Promise<string[]> {
    const activities = await getAllRecords<DailyActivityRecord>(STORES.DAILY_ACTIVITY);
    return activities
        .filter((a) => a.completed)
        .map((a) => a.date);
}

/**
 * Save puzzle progress
 */
export async function savePuzzleProgress(puzzleRecord: PuzzleRecord): Promise<void> {
    await putRecord(STORES.PUZZLES, puzzleRecord);
}

/**
 * Get puzzle for a specific date
 */
export async function getPuzzleForDate(date: string): Promise<PuzzleRecord | undefined> {
    return getRecord<PuzzleRecord>(STORES.PUZZLES, date);
}

/**
 * Mark puzzle as completed
 */
export async function completePuzzle(
    date: string,
    score: number,
    timeInSeconds: number,
    puzzleType: string,
    difficulty: string,
    rank: string
): Promise<void> {
    // Update puzzle record
    const puzzle = await getPuzzleForDate(date);
    if (puzzle) {
        puzzle.completed = true;
        puzzle.score = score;
        puzzle.timeInSeconds = timeInSeconds;
        puzzle.completedAt = new Date().toISOString();
        await putRecord(STORES.PUZZLES, puzzle);
    }

    // Update daily activity
    // Update daily activity
    const activity: DailyActivityRecord = {
        id: `${date}-${Date.now()}`,
        date,
        completed: true,
        score,
        timeInSeconds,
        puzzleType,
        difficulty,
        rank,
        synced: false,
    };
    await putRecord(STORES.DAILY_ACTIVITY, activity);
}

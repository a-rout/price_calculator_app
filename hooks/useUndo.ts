import { useState, useCallback, useRef, useEffect } from 'react';

interface UndoItem<T> {
    data: T;
    action: string;
    timestamp: number;
}

interface UseUndoOptions {
    timeout?: number; // Auto-clear timeout in ms (default: 5000)
    onRestore?: () => void;
    onExpire?: () => void;
}

/**
 * Custom hook for undo functionality
 * Stores deleted items temporarily and allows restoration
 */
export const useUndo = <T>(options: UseUndoOptions = {}) => {
    const { timeout = 5000, onRestore, onExpire } = options;
    const [undoItem, setUndoItem] = useState<UndoItem<T> | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Clear timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const setForUndo = useCallback((data: T, action: string = 'deleted') => {
        // Clear any existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        setUndoItem({
            data,
            action,
            timestamp: Date.now(),
        });

        // Set auto-expire timeout
        timeoutRef.current = setTimeout(() => {
            setUndoItem(null);
            onExpire?.();
        }, timeout);
    }, [timeout, onExpire]);

    const undo = useCallback((): T | null => {
        if (!undoItem) return null;

        // Clear timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }

        const data = undoItem.data;
        setUndoItem(null);
        onRestore?.();

        return data;
    }, [undoItem, onRestore]);

    const clearUndo = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        setUndoItem(null);
    }, []);

    const getRemainingTime = useCallback((): number => {
        if (!undoItem) return 0;
        const elapsed = Date.now() - undoItem.timestamp;
        return Math.max(0, timeout - elapsed);
    }, [undoItem, timeout]);

    return {
        undoItem,
        setForUndo,
        undo,
        clearUndo,
        getRemainingTime,
        canUndo: undoItem !== null,
    };
};

export default useUndo;

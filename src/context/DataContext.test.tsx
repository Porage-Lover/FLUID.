import { renderHook } from '@testing-library/react';
import { useData } from './DataContext';
import { test, expect, vi } from 'vitest';

test('useData throws error when used outside DataProvider', () => {
    // Suppress console.error from React about the thrown error
    const consoleError = console.error;
    console.error = vi.fn();

    expect(() => renderHook(() => useData())).toThrowError(/useData must be used within a DataProvider/);

    console.error = consoleError;
});

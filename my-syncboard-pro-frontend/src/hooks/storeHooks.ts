/**
 * Typed Redux Architecture Hooks
 * Prevents continuous re-mapping of RootState and AppDispatch inside UI nodes
 */

import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from '../features/store';

// 1. useAppDispatch will now automatically know all typed sync and async actions
export const useAppDispatch = () => useDispatch<AppDispatch>();

// 2. useAppSelector will instantly autocomplete state structures (e.g., state.auth.user.name)
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
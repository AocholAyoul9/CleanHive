import { createFeature, createReducer, on } from '@ngrx/store';
import * as AuthActions from './auth.actions';
import { AuthUser } from '../models/user.model';

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
  userType: 'client' | 'company' | 'employee' | null;
}

const initialAuthState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  loading: false,
  error: null,
  userType: null,
};

export const authFeature = createFeature({
  name: 'auth' as const,
  reducer: createReducer(
    initialAuthState,

    // ----------------------
    // LOGIN
    // ----------------------
    on(AuthActions.login, (state) => ({
      ...state,
      loading: true,
      error: null,
    })),
    on(AuthActions.loginSuccess, (state, { user, accessToken, userType }) => ({
      ...state,
      user,
      accessToken,
      userType,
      loading: false,
      error: null,
    })),
    on(AuthActions.loginFailure, (state, { error }) => ({
      ...state,
      error,
      loading: false,
    })),
    on(AuthActions.restoreSession, (state) => ({
      ...state,
      loading: true,
      error: null,
    })),
    on(AuthActions.restoreSessionSuccess, (state, { user, accessToken, refreshToken, userType }) => ({
      ...state,
      user,
      accessToken,
      refreshToken,
      userType,
      loading: false,
      error: null,
    })),
    on(AuthActions.restoreSessionFailure, (state, { error }) => ({
      ...state,
      error,
      loading: false,
    })),

    // ----------------------
    // REGISTER
    // ----------------------
    on(AuthActions.register, (state) => ({
      ...state,
      loading: true,
      error: null,
    })),
    on(AuthActions.registerSuccess, (state, { user, userType }) => ({
      ...state,
      user,
      userType,
      loading: false,
      error: null,
    })),
    on(AuthActions.registerFailure, (state, { error }) => ({
      ...state,
      error,
      loading: false,
    })),

    // ----------------------
    // LOGOUT
    // ----------------------
    on(AuthActions.logout, () => initialAuthState),

    // ----------------------
    // REFRESH TOKEN
    // ----------------------
    on(AuthActions.refreshToken, (state) => ({
      ...state,
      loading: true,
      error: null,
    })),
    on(AuthActions.refreshTokenSuccess, (state, { accessToken }) => ({
      ...state,
      accessToken,
      loading: false,
      error: null,
    })),
    on(AuthActions.refreshTokenFailure, (state, { error }) => ({
      ...state,
      error,
      loading: false,
    })),

    // ----------------------
    // LOAD CURRENT USER
    // ----------------------
    on(AuthActions.loadCurrentUser, (state) => ({
      ...state,
      loading: true,
      error: null,
    })),
    on(AuthActions.loadCurrentUserSuccess, (state, { user }) => ({
      ...state,
      user,
      loading: false,
      error: null,
    })),
    on(AuthActions.loadCurrentUserFailure, (state, { error }) => ({
      ...state,
      error,
      loading: false,
    }))
  ),
});

export const authReducer = authFeature.reducer;
export { initialAuthState };
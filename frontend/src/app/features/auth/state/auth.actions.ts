import { createAction, props } from '@ngrx/store';
import { AuthUser } from '../models/user.model';

// ----------------------
// LOGIN
// ----------------------
export const login = createAction(
  '[Auth] Login',
  props<{ email: string; password: string; userType: 'client' | 'company' | 'employee' }>()
);

export const loginSuccess = createAction(
  '[Auth] Login Success',
  props<{ user: AuthUser; accessToken: string; userType: 'client' | 'company' | 'employee' }>()
);

export const loginFailure = createAction(
  '[Auth] Login Failure',
  props<{ error: string }>()
);

export const restoreSession = createAction('[Auth] Restore Session');

export const restoreSessionSuccess = createAction(
  '[Auth] Restore Session Success',
  props<{
    user: AuthUser;
    accessToken: string;
    refreshToken: string | null;
    userType: 'client' | 'company' | 'employee';
  }>()
);

export const restoreSessionFailure = createAction(
  '[Auth] Restore Session Failure',
  props<{ error: string }>()
);

// ----------------------
// REGISTER
// ----------------------
export const register = createAction(
  '[Auth] Register',
  props<{ userData: any; userType: 'client' | 'company' | 'employee' }>()
);

export const registerSuccess = createAction(
  '[Auth] Register Success',
  props<{ user: any; userType: 'client' | 'company' | 'employee' }>()
);

export const registerFailure = createAction(
  '[Auth] Register Failure',
  props<{ error: string }>()
);

// ----------------------
// LOGOUT
// ----------------------
export const logout = createAction('[Auth] Logout');

// ----------------------
// REFRESH TOKEN
// ----------------------
export const refreshToken = createAction(
  '[Auth] Refresh Token',
  props<{ token: string }>()
);

export const refreshTokenSuccess = createAction(
  '[Auth] Refresh Token Success',
  props<{ accessToken: string }>()
);

export const refreshTokenFailure = createAction(
  '[Auth] Refresh Token Failure',
  props<{ error: string }>()
);

// ----------------------
// LOAD CURRENT USER
// ----------------------
export const loadCurrentUser = createAction('[Auth] Load Current User');

export const loadCurrentUserSuccess = createAction(
  '[Auth] Load Current User Success',
  props<{ user: AuthUser }>()
);

export const loadCurrentUserFailure = createAction(
  '[Auth] Load Current User Failure',
  props<{ error: string }>()
);
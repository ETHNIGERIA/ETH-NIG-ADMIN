/** HTTP-only session for the Ticketing API (Nest). Separate from Firebase admin auth. */

export const TICKETS_SESSION_COOKIE = 'eth_tickets_api_session';

/** URL prefix for the portal UI (middleware + pages). */
export const TICKETS_PORTAL_BASE_PATH = '/tickets-command';

export const TICKETS_LOGIN_PATH = `${TICKETS_PORTAL_BASE_PATH}/login`;
export const TICKETS_FORGOT_PASSWORD_PATH = `${TICKETS_PORTAL_BASE_PATH}/forgot-password`;
export const TICKETS_RESET_PASSWORD_PATH = `${TICKETS_PORTAL_BASE_PATH}/reset-password`;

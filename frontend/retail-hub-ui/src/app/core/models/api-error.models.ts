import { HttpErrorResponse } from '@angular/common/http';

export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  traceId?: string;
  errors?: Readonly<Record<string, readonly string[]>>;
}

function isProblemDetails(value: unknown): value is ProblemDetails {
  return typeof value === 'object' && value !== null;
}

export function extractApiErrorMessage(
  error: unknown,
  fallbackMessage = 'An unexpected error occurred. Please try again.'
): string {
  if (!(error instanceof HttpErrorResponse)) {
    return fallbackMessage;
  }

  if (error.status === 0) {
    return 'Unable to reach the RetailHub API server. Verify the backend is running.';
  }

  if (isProblemDetails(error.error)) {
    if (error.error.errors) {
      const validationMessages = Object.values(error.error.errors)
        .flat()
        .filter((msg) => msg.trim().length > 0);
      if (validationMessages.length > 0) {
        return validationMessages.join(' ');
      }
    }

    if (typeof error.error.detail === 'string' && error.error.detail.trim().length > 0) {
      return error.error.detail;
    }

    if (typeof error.error.title === 'string' && error.error.title.trim().length > 0) {
      return error.error.title;
    }
  }

  return fallbackMessage;
}

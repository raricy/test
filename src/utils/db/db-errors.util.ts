// src/common/utils/db-errors.util.ts
import { QueryFailedError } from 'typeorm';

const POSTGRES_UNIQUE_VIOLATION = '23505';

export function isUniqueViolation(
  err: unknown,
  constraintOrColumn?: string,
): boolean {
  if (!(err instanceof QueryFailedError)) {
    return false;
  }

  const driverError = (
    err as QueryFailedError & {
      driverError?: { code?: string; constraint?: string; detail?: string };
    }
  ).driverError;

  if (driverError?.code !== POSTGRES_UNIQUE_VIOLATION) {
    return false;
  }

  if (!constraintOrColumn) {
    return true;
  }

  return (
    driverError.constraint
      ?.toLowerCase()
      .includes(constraintOrColumn.toLowerCase()) ??
    driverError.detail
      ?.toLowerCase()
      .includes(constraintOrColumn.toLowerCase()) ??
    false
  );
}

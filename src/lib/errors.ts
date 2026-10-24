import type { FieldErrors } from "./validation";

export class AppError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: FieldErrors | Record<string, unknown>;

  constructor(
    status: number,
    message: string,
    code = "APP_ERROR",
    details?: FieldErrors | Record<string, unknown>,
  ) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class ValidationAppError extends AppError {
  constructor(errors: FieldErrors) {
    super(422, "请检查表单中的错误", "VALIDATION_ERROR", errors);
    this.name = "ValidationAppError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "请先登录") {
    super(401, message, "UNAUTHORIZED");
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "没有权限执行此操作") {
    super(403, message, "FORBIDDEN");
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "资源不存在") {
    super(404, message, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(message: string, code = "CONFLICT", details?: Record<string, unknown>) {
    super(409, message, code, details);
    this.name = "ConflictError";
  }
}

export class RateLimitError extends AppError {
  readonly retryAfterSeconds: number;

  constructor(message: string, retryAfterSeconds: number) {
    super(429, message, "RATE_LIMITED", { retryAfterSeconds });
    this.name = "RateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

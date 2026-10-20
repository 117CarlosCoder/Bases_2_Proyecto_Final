import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

export interface ErrorResponsePayload {
  statusCode: number;
  error: string;
  message: string;
  details: unknown;
  path: string;
  timestamp: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let error = 'Internal Server Error';
    let message = 'Ha ocurrido un error interno en el servidor';
    let details: unknown = null;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        error = exception.name;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const resObj = exceptionResponse as Record<string, unknown>;
        error =
          typeof resObj.error === 'string' ? resObj.error : exception.name;

        if (Array.isArray(resObj.message)) {
          message = 'Error de validación en los datos enviados';
          details = resObj.message;
        } else if (typeof resObj.message === 'string') {
          message = resObj.message;
        } else {
          message = exception.message;
        }

        if (resObj.details !== undefined && details === null) {
          details = resObj.details;
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message || message;
      error = exception.name || error;
      this.logger.error(
        `Excepción no controlada en ${request?.method} ${request?.url}: ${exception.message}`,
        exception.stack,
      );
    } else {
      this.logger.error(
        `Excepción desconocida en ${request?.method} ${request?.url}`,
        String(exception),
      );
    }

    const payload: ErrorResponsePayload = {
      statusCode,
      error,
      message,
      details,
      path: request?.originalUrl || request?.url || '',
      timestamp: new Date().toISOString(),
    };

    response.status(statusCode).json(payload);
  }
}

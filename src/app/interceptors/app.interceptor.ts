import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HTTP_INTERCEPTORS,
  HttpErrorResponse
} from '@angular/common/http';
import { catchError, from, Observable, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { MytoastrService } from '../services/mytoastr';
import { environment } from 'src/environments/environment';

@Injectable()
export class AppInterceptor implements HttpInterceptor {

  constructor(
    private authService: AuthService,
    private router: Router,
    private myToastr: MytoastrService,
  ) { }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const isGenerateQrApi = request.url.startsWith(environment.URL_API_GENERATE_QR);
    const isReprocessApi = Boolean(environment.URL_API_REPROCESS) && request.url.startsWith(environment.URL_API_REPROCESS);
    const isGenerateQrProtectedApi = isGenerateQrApi || isReprocessApi;
    const isGenerateQrLogin = isGenerateQrApi && request.url.includes('/v1/auth/login');
    const skipGenerateQrAuth = request.headers.has('X-Skip-GenerateQr-Auth') || isGenerateQrLogin;
    let intReq = request;

    if (intReq.headers.has('X-Skip-GenerateQr-Auth')) {
      intReq = intReq.clone({ headers: intReq.headers.delete('X-Skip-GenerateQr-Auth') });
    }

    if (isGenerateQrProtectedApi && environment.URL_API_GENERATE_QR_API_KEY) {
      intReq = intReq.clone({
        headers: intReq.headers.set('x-api-key', environment.URL_API_GENERATE_QR_API_KEY)
      });
    }

    if (isGenerateQrProtectedApi && !skipGenerateQrAuth) {
      return from(this.authService.getValidGenerateQrToken()).pipe(
        switchMap((token) => {
          const authReq = intReq.clone({
            headers: intReq.headers.set('Authorization', `Bearer ${token}`)
          });
          return this.forwardWithGenerateQrRetry(authReq, next);
        })
      );
    }

    const skipAuthForQr = isGenerateQrProtectedApi;
    const token = this.authService.getToken();
    if (token && !skipAuthForQr) {
      const apiKey = '36IZghAT9e4TtIbjPh6cy4T49cGaigwL6CVWudmm';
      intReq = intReq.clone({
        headers: intReq.headers
          .set('Authorization', 'Bearer ' + token)
          .set('x-api-key', apiKey),
      });
    }

    return next.handle(intReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.myToastr.showError('Tu sesion ha caducado.', 'Por favor, inicia sesion nuevamente.');
          setTimeout(() => {
            this.router.navigate(['/sign-in']);
          }, 1000);
        }
        return throwError(() => error);
      })
    );
  }

  private forwardWithGenerateQrRetry(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const hasRetried = request.headers.get('X-GenerateQr-Retry') === '1';
    const reqWithoutRetryHeader = request.headers.has('X-GenerateQr-Retry')
      ? request.clone({ headers: request.headers.delete('X-GenerateQr-Retry') })
      : request;

    return next.handle(reqWithoutRetryHeader).pipe(
      catchError((error: HttpErrorResponse) => {
        if (!hasRetried && (error.status === 401 || error.status === 403)) {
          return from(this.authService.getValidGenerateQrToken(true)).pipe(
            switchMap((token) => {
              const retryReq = reqWithoutRetryHeader.clone({
                headers: reqWithoutRetryHeader.headers
                  .set('Authorization', `Bearer ${token}`)
                  .set('X-GenerateQr-Retry', '1')
              });
              return this.forwardWithGenerateQrRetry(retryReq, next);
            }),
            catchError((refreshError: HttpErrorResponse) => {
              return throwError(() => refreshError);
            })
          );
        }
        return throwError(() => error);
      })
    );
  }
}

export const interceptorSpringProvider = [{ provide: HTTP_INTERCEPTORS, useClass: AppInterceptor, multi: true }];

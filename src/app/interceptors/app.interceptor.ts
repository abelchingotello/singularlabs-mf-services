import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HTTP_INTERCEPTORS,
  HttpErrorResponse
} from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { CompanyService } from '../services/company.service';
import { Router } from '@angular/router';
import { MytoastrService } from '../services/mytoastr';
import { environment } from 'src/environments/environment';

@Injectable()
export class AppInterceptor implements HttpInterceptor {

  constructor(
    private authService: AuthService,
    // private companyService: CompanyService,
    private router: Router,
    private myToastr : MytoastrService,
    private companyService: CompanyService,
  ) { }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    let intReq = request;
    const skipAuthForQr = request.url.startsWith(environment.URL_API_GENERATE_QR);
    const token = this.authService.getToken();
    // console.log("TOKENNNN: ",token)
    const companyId = this.companyService.getCompanyId();
    // const companyId = this.companyService.getCompanyId();

    // if ((request.method === 'POST' || request.method === 'PUT') && (!company_id || company_id === 'null' || company_id === 'undefined' )) {
    //   // Create an error response for invalid company_id
    //   return throwError(() => new HttpErrorResponse({
    //     status: 400.1,
    //     statusText: 'Bad Request',
    //     error: 'Invalid companyId: companyId is required for POST and PUT requests.'
    //   }));
    // }

    if (request.url.startsWith(environment.URL_API_GENERATE_QR) && environment.URL_API_GENERATE_QR_API_KEY) {
      intReq = intReq.clone({
        headers: intReq.headers.set('x-api-key', environment.URL_API_GENERATE_QR_API_KEY)
      });
    }

    if (token && !skipAuthForQr) {

      const apiKey = '36IZghAT9e4TtIbjPh6cy4T49cGaigwL6CVWudmm'; 
      intReq = intReq.clone({
        headers: intReq.headers
        .set('Authorization','Bearer ' + token)
        .set('x-api-key', apiKey),
        // params: request.params.set('companyId', companyId)
      });
    }
    return next.handle(intReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // Redirige al usuario a la página de inicio de sesión cuando el token caduca
          this.myToastr.showError('Tu sesión ha caducado.','Por favor, inicia sesión nuevamente.');
          setTimeout(() => {
            this.router.navigate(['/sign-in']);
          }, 1000);
        }
        // Devuelve el error para que otras partes de la aplicación puedan manejarlo si es necesario
        return throwError(() => error);
      })
    );
  }
}

export const interceptorSpringProvider = [{ provide: HTTP_INTERCEPTORS, useClass: AppInterceptor, multi: true }]

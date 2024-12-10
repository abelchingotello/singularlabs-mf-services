import { Injectable } from '@angular/core';
import { ToastrService, IndividualConfig } from 'ngx-toastr';

@Injectable({ providedIn: 'root' })
export class MytoastrService {
    constructor(private toastr: ToastrService) { }

    showSuccess(title: string, message: string) {
        const options: Partial<IndividualConfig> = {
            progressBar: true,
            progressAnimation: 'decreasing',
            disableTimeOut: false,
            timeOut: 10000,
            extendedTimeOut: 1000
        };
        this.toastr.success(message, title, options);
    }

    showWarning(title: string, message: string) {
        const options: Partial<IndividualConfig> = {
            progressBar: true,
            progressAnimation: 'decreasing',
            disableTimeOut: false,
            timeOut: 5000,
            extendedTimeOut: 1000
        };

        this.toastr.warning(message, title, options);
    }

    showError(title: string, message: string) {
        const options: Partial<IndividualConfig> = {
            progressBar: true,
            progressAnimation: 'decreasing',
            disableTimeOut: false,
            timeOut: 5000,
            extendedTimeOut: 1000
        };

        this.toastr.error(message, title, options);
    }

    handleHttpError(error: any) {
        switch (error.status) {
            case 400.1:
                this.showError('Error '+400,':Compañia es requerida para solicitudes POST y PUT');
                break;
            case 400:
                this.showError('Error '+error.status,':Solicitud incorrecta');
                break;
            case 401:
                this.showError('Error '+error.status, ':No autorizado');
                break;
            case 403:
                this.showError('Error '+error.status, ':Prohibido');
                break;
            case 404:
                this.showError('Error '+error.status, ':No encontrado');
                break;
            case 409:
                this.showError('Error '+error.status, ':'+error.error);
                break;
            default:
                this.showError('Error '+error.status,':');
                break;
        }
    }
}

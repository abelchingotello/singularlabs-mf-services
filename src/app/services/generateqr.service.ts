import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GenerateQrService {

  private url = `${environment.URL_API_GENERATE_QR}/v1/qr/individual`;
  private listUrl = `${environment.URL_API_GENERATE_QR}/v1/qr/list`;
  private sftpListUrl = `${environment.URL_API_GENERATE_QR}/v1/sftp/list`;
  private massiveUrl = `${environment.URL_API_GENERATE_QR}/v1/batch/start`;
  private serviceScheduleUrl = `${environment.URL_API_GENERATE_QR}/v1/service-schedule`;
  private reprocessQueueUrl = `${environment.URL_API_GENERATE_QR}/v1/reprocess/queue`;
  private reprocessHistoryUrl = `${environment.URL_API_GENERATE_QR}/v1/reprocess/history`;
  private URL1= `${environment.URL_API_GATEWAY}/export`;

  constructor(
    private httpClient: HttpClient,
  ) { }

  generateIndividual(payload: any): Observable<any> {
    return this.httpClient.post<any>(this.url, payload);
  }

  listIndividuals(page?: number, pageSize?: number, filters?: Record<string, any>): Observable<any> {
    let params = new HttpParams();
    if (page !== undefined) {
      params = params.set('page', page);
    }
    if (pageSize !== undefined) {
      params = params.set('pageSize', pageSize);
    }
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value);
        }
      });
    }
    return this.httpClient.get<any>(this.listUrl, { params });
  }

  listSftp(path: string, serviceName?: string): Observable<any> {
    let params = new HttpParams();
    if (path) {
      params = params.set('path', path);
    }
    if (serviceName) {
      params = params.set('serviceName', serviceName);
    }
    return this.httpClient.get<any>(this.sftpListUrl, { params });
  }

  generateMassive(payload: any): Observable<any> {
    return this.httpClient.post<any>(this.massiveUrl, payload);
  }

  cancelQr(idQrs: string[], responsable?: string): Observable<any> {
    const body: any = { idQrs };
    if (responsable) {
      body.responsable = responsable;
    }
    return this.httpClient.post<any>(`${environment.URL_API_GENERATE_QR}/v1/qr/cancel`, body);
  }

  markReturned(idQrs: string[], responsable?: string): Observable<any> {
    const body: any = { idQrs };
    if (responsable) {
      body.responsable = responsable;
    }
    return this.httpClient.post<any>(`${environment.URL_API_GENERATE_QR}/v1/qr/mark-returned`, body);
  }

  listReports(page?: number, pageSize?: number, filters?: Record<string, any>): Observable<any> {
    let params = new HttpParams();
    if (page !== undefined) {
      params = params.set('page', page);
    }
    if (pageSize !== undefined) {
      params = params.set('pageSize', pageSize);
    }
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value);
        }
      });
    }
    return this.httpClient.get<any>(`${environment.URL_API_GENERATE_QR}/v1/reports/qr`, { params });
  }

  listServiceSchedule(page?: number, pageSize?: number, serviceName?: string): Observable<any> {
    let params = new HttpParams();
    if (page !== undefined) {
      params = params.set('page', page);
    }
    if (pageSize !== undefined) {
      params = params.set('pageSize', pageSize);
    }
    if (serviceName) {
      params = params.set('serviceName', serviceName);
    }
    return this.httpClient.get<any>(this.serviceScheduleUrl, { params });
  }

  createServiceSchedule(payload: any): Observable<any> {
    return this.httpClient.post<any>(this.serviceScheduleUrl, payload);
  }

  updateServiceSchedule(serviceId: string, payload: any): Observable<any> {
    return this.httpClient.put<any>(`${this.serviceScheduleUrl}/${serviceId}`, payload);
  }

  deleteServiceSchedule(serviceId: string): Observable<any> {
    return this.httpClient.delete<any>(`${this.serviceScheduleUrl}/${serviceId}`);
  }

  listReprocessQueue(page?: number, pageSize?: number, filters?: Record<string, any>): Observable<any> {
    let params = new HttpParams();
    if (page !== undefined) {
      params = params.set('page', page);
    }
    if (pageSize !== undefined) {
      params = params.set('pageSize', pageSize);
    }
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value);
        }
      });
    }
    return this.httpClient.get<any>(this.reprocessQueueUrl, { params });
  }

  listReprocessHistory(page?: number, pageSize?: number, filters?: Record<string, any>): Observable<any> {
    let params = new HttpParams();
    if (page !== undefined) {
      params = params.set('page', page);
    }
    if (pageSize !== undefined) {
      params = params.set('pageSize', pageSize);
    }
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value);
        }
      });
    }
    return this.httpClient.get<any>(this.reprocessHistoryUrl, { params });
  }

  reprocessPayments(queueIds: number[], responsable?: string): Observable<any> {
    const body: any = { queueIds };
    if (responsable) {
      body.responsable = responsable;
    }
    return this.httpClient.post<any>(`${environment.URL_API_GENERATE_QR}/v1/reprocess-payments`, body);
  }

  reprocessNextAttempt(queueId: number, nextAttemptAt: string, responsable?: string): Observable<any> {
    const body: any = { queueId, nextAttemptAt };
    if (responsable) {
      body.responsable = responsable;
    }
    return this.httpClient.post<any>(`${environment.URL_API_GENERATE_QR}/v1/reprocess-next-attempt`, body);
  }

  notificationHistory(idQr: string): Observable<any> {
    return this.httpClient.post<any>(`${environment.URL_API_GENERATE_QR}/v1/qr/notification-history`, { idQr });
  }


  exportServices(
    format: 'xlsx' | 'csv',
    filters: Record<string, any>,
    bandeja: string,
    token: any
  ): Observable<any> {
    let params = new HttpParams();

    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value);
        }
      });
    }

    params = params.set('format', format);
    params = params.set('inbx', bandeja);
    params = params.set('token', token);

    return this.httpClient.get(`${this.URL1}`, { params });
  }

}


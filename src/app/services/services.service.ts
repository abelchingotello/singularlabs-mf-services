import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ServiceByIdInterface } from '../interfaces/serviceByIdInterface';
import { ResponseDTO } from '../interfaces/responseInterface';
import { ServiceTableInterface } from '../interfaces/serviceTableInterface';
import { PageInterface } from '../interfaces/PageInterface';


@Injectable({
  providedIn: 'root'
})
export class ServicesService {

  public servicePayment = new BehaviorSubject<any[]>([]);

  private url = `${environment.URL_API_GATEWAY}`;

  constructor(
    private httpClient: HttpClient
  ) { }


  registerService(data: any): Observable<any> {
    return this.httpClient.post<any>(`${this.url}/services/register`, data);
  }

  registerServiceAssign(data: any): Observable<any> {
    return this.httpClient.post<any>(`${this.url}/services/assign`, data);
  }

  registerServiceImport(data: any, valueImport: any): Observable<any> {
    return this.httpClient.post<any>(`${this.url}/services/register/massive?import=${valueImport}`, data);
  }

  // getServices(name:string): Observable<any>{
  //   let params = new HttpParams()
  //   .set('name', name);
  //   return this.httpClient.get<any>(`${this.url}/services`,{params: params});
  // }

  getServices(name: string, status: string,type:string,category:string, count:number, idClient?: any, limit?: any, pageKey?: any[], getAssignAll?: boolean): Observable<ResponseDTO<PageInterface<ServiceTableInterface>>> {
    let params = new HttpParams()
    if (name) {
      params = params.set('name', name);
    }
    if (status) {
      params = params.set('status', status);
    }
    if (type) {
      params = params.set('type', type);
    }

    if (category) {
      params = params.set('category', category);
    }

    if (limit !== undefined) {
      params = params.set('limit', limit);
    }

    if (pageKey !== undefined) {
      params = params.set('pageKey', JSON.stringify(pageKey));
    }
    if (count != null) {
      params = params.set('count', count);
    }
    if (idClient != null) {
      params = params.set('idClient', idClient);
    }
    if (getAssignAll !== undefined) {
      params = params.set('getAssignAll', getAssignAll);
    }
    return this.httpClient.get<ResponseDTO<PageInterface<ServiceTableInterface>>>(`${this.url}/services`, { params: params });
  }

  getServicesPageKey(limit?:number,pageKey?: any[]): Observable<ResponseDTO<PageInterface<ServiceTableInterface>>> {
    let params = new HttpParams();
    if (limit !== undefined) {
      params = params.set('limit', limit);
    }
    if (pageKey !== undefined) {
      params = params.set('pageKey', JSON.stringify(pageKey));
    }
    return this.httpClient.get<ResponseDTO<PageInterface<ServiceTableInterface>>>(`${this.url}/services`, { params: params });
  }

  getTypeServices(name?: string): Observable<any> {
    let params = new HttpParams()
    if (name) {
      params = params.set('name', name);
    }
    return this.httpClient.get<any>(`${this.url}/services/type`, { params: params });
  }

  getServicesData(limit?: any, pageKey?: any[]): Observable<any> {
    let params = new HttpParams();
    if (limit !== undefined) {
      params = params.set('limit', limit);
    }
    if (pageKey !== undefined) {
      params = params.set('pageKey', JSON.stringify(pageKey));
    }
    return this.httpClient.get<any>(`${this.url}/services`, { params: params });
  }

  getServicesCategory(): Observable<any> {
    return this.httpClient.get<any>(`${this.url}/services/category`);
  }

  getIdServices(id: string): Observable<ResponseDTO<ServiceByIdInterface>> {
    return this.httpClient.post<ResponseDTO<ServiceByIdInterface>>(`${this.url}/services/${id}`, null);
  }
  getIdServicePerson(id: string, type?: string): Observable<any> {
    let params = new HttpParams();

    if (type) {
      params = params.set('idClient', type);
    }

    return this.httpClient.get<any>(`${this.url}/services/${id}`, { params: params });
  }

  getPerson(typeEntity?: string, nameAlias?: string): Observable<any> {
    let params = new HttpParams();
    if (typeEntity) params = params.set('typeEntity', typeEntity);

    if (nameAlias) params = params.set('nameAlias', nameAlias);

    return this.httpClient.get(`${this.url}/person/entity`, { params: params });
  }

  updateService(data: any): Observable<any> {
    return this.httpClient.patch(`${this.url}/services/status`, data);
  }

  updateServiceEntity(data: any): Observable<any> {
    return this.httpClient.patch(`${this.url}/services/status/entity`, data);
  }

  updateServiceClient(data: any): Observable<any> {
    return this.httpClient.patch(`${this.url}/services/status/one`, data);
  }

  detailService(id: string, value: string, ers: string): Observable<any> {
    let params = new HttpParams()
      .set('value', value)
      .set('ers', ers);
    return this.httpClient.post<any>(`${this.url}/services/${id}/bills`, null, { params: params });
  }

}

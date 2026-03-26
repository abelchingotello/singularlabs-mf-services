import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ResponseDTO } from '../interfaces/responseInterface';
import { PageInterface } from '../interfaces/PageInterface';
import { ServiceTableInterface } from '../interfaces/serviceTableInterface';

@Injectable({
  providedIn: 'root'
})
export class PersonService {

  private url = `${environment.URL_API_GATEWAY}`;
  //private url = `${environment.URL_API_LOCAL}`; //LAMBDA LOCAL

  constructor(
    private httpClient: HttpClient,
  ) { }

  postPerson(data: any): Observable<any> {
    return this.httpClient.post(`${this.url}/person`, data);
  }

  getPerson(typeEntity?: string, nameAlias?: string, activeOnly?: boolean): Observable<any> {
    let params = new HttpParams();
    if (typeEntity) params = params.set('typeEntity', typeEntity);

    if (nameAlias) params = params.set('nameAlias', nameAlias);

    if (activeOnly) params = params.set('activeOnly', JSON.stringify(activeOnly));
    
    return this.httpClient.get(`${this.url}/person/entity`, { params: params });
  }

  getPersons(limit?: any, pageKey?: any[]): Observable<any> {
    let params = new HttpParams();

    if (limit !== undefined) {
      params = params.set('limit', limit);
    }

    if (pageKey !== undefined) {
      params = params.set('pageKey', JSON.stringify(pageKey));
    }
    return this.httpClient.get(`${this.url}/person`, { params });
  }

  getPersonAll(typeEntity?: string, nameAlias?: string): Observable<any> {
    let params = new HttpParams();
    if (typeEntity) params = params.set('typeEntity', typeEntity);

    if (nameAlias) params = params.set('nameAlias', nameAlias);

    return this.httpClient.get(`${this.url}/person/entity`, { params: params });
  }

  getPersonForStatusConciliation(typeEntity: string, nameAlias: string, count:number, limit?: any, pageKey?: any[]): Observable<ResponseDTO<PageInterface<ServiceTableInterface>>> {
    let params = new HttpParams()
    if (typeEntity) {
      params = params.set('typeEntity', typeEntity);
    }
    if (nameAlias) {
      params = params.set('nameAlias', nameAlias);
    }
    if (count != null) {
      params = params.set('count', count);
    }
    if (limit !== undefined) {
      params = params.set('limit', limit);
    }
    if (pageKey !== undefined) {
      params = params.set('pageKey', JSON.stringify(pageKey));
    }
    return this.httpClient.get<ResponseDTO<PageInterface<ServiceTableInterface>>>(`${this.url}/person/entityPagination`, { params: params });
  }

  getStateTypePerson(data: any): Observable<any> {
    return this.httpClient.patch(`${this.url}/person/entity/type/status`, data);
  }

  patchStatePerson(data: any): Observable<any> {
    return this.httpClient.patch(`${this.url}/person/entity/status`, data);
  }
  exportEntitys(
    format: 'xlsx' | 'csv',
    filters: any,
    bandeja: string,
    token: any
  ): Observable<any> {
    let params = new HttpParams();
    if (filters) {
      const { selectedAlias, entitySelect } = filters;

      if (selectedAlias) params = params.set('nameAlias', selectedAlias);
      if (!selectedAlias && entitySelect) params = params.set('typeEntity', entitySelect);
    }

    params = params.set('format', format);
    params = params.set('inbx', bandeja);
    params = params.set('token', token);
    return this.httpClient.get(`${this.url}/export`, { params });
  }

}

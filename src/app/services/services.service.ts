import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ServicesService {

  private url = `${environment.URL_API_HUB}/servicios`;

  constructor(
    private httpClient: HttpClient
  ) { }


  getServices(name:string): Observable<any>{
    let params = new HttpParams()
    .set('nombre', name);
    return this.httpClient.get<any>(`${this.url}`,{params: params});
  }
}

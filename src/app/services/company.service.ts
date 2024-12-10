import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CookieService } from 'ngx-cookie-service';

@Injectable({
  providedIn: 'root'
})
export class CompanyService {

  public data = new BehaviorSubject<any[]>(null);
  private url = `${environment.URL_API_GATEWAY}/company`;

  constructor(
    private httpClient: HttpClient,
    private cookieService: CookieService
  ) { }

  getCompanies(limit : any, pageKey :any []): Observable <any>{
    let params = new HttpParams();

    if (limit !== undefined) {
      params = params.set('limit', limit);
    }

    if (pageKey !== undefined) {
      params = params.set('pageKey', JSON.stringify(pageKey));
    }
    return this.httpClient.get<any>(`${this.url}`, {params : params});
  }

  getCompanyId(){
    return this.cookieService.get('companyId');;
  }

  updateCompany(id,item){
    return this.httpClient.patch<any>(`${this.url}/${id}`, item);
  }

  postCompany(item){
    return this.httpClient.post<any>(`${this.url}`, item);
  }

  getCompanyById(id){
    return this.httpClient.get<any>(`${this.url}/${id}`);
  }
}

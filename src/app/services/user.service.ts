import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { BehaviorSubject, firstValueFrom, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private url = `${environment.URL_API_GATEWAY}`;
  // private urlIframe = `${environment.URL_IFRAME}`;
  public data = new BehaviorSubject<any | null>(null);
  public user = new BehaviorSubject<any | null>(null);
  public config = new BehaviorSubject<{route?, refresh?, method?} | null>(null);

  constructor(
    private httpClient: HttpClient,
    private cookieService: CookieService
  ) { }

  getUsers(limit? : any, pageKey? :any []): Observable<any>{
    let params = new HttpParams();
    if (limit !== undefined) {
      params = params.set('limit', limit);
    }
    
    if (pageKey !== undefined) {
      params = params.set('pageKey', JSON.stringify(pageKey));
    }
    return this.httpClient.get(`${this.url}/users`,{params});
  }

  getFilterData(filter: string, atribute:string, limit : any, pageKey :any []): Observable<any>{

    let params = new HttpParams();
    if (limit !== undefined) {
      params = params.set('limit', limit);
    }
    
    if (pageKey !== undefined) {
      console.log("PAGEKEY",pageKey)
      params = params.set('pageKey', JSON.stringify(pageKey));
    }

    params = params.set('filter', filter);
    params = params.set('atribute', atribute);
    
    return this.httpClient.get(`${this.url}/users/filter`,{params});
  }

  getUsersId(id : string,): Observable<any>{
    return this.httpClient.get(`${this.url}/auth/${id}`);
  }

  getPersonId(id : string,): Observable<any>{
    return this.httpClient.get(`${this.url}/users/${id}`);
  }

  postUser(data:any):Observable<any> {
    return this.httpClient.post(`${this.url}/auth`, data);
  }
  
  updateUser(data:any,id: string):Observable<any> {
    return this.httpClient.patch(`${this.url}/users/${id}`,data);
  }

  updatePerson(data:any,id: string):Observable<any> {
    return this.httpClient.patch(`${this.url}/person/${id}`,data);
  }

  stattusUser(name:string):Observable<any> {
    return this.httpClient.delete(`${this.url}/users/${name}`);
  }

  addRoles(data:any,type:string,parent:string) : Observable <any> {
    let params = new HttpParams()
    .set('type', type)
    .set('parent', parent);
    return this.httpClient.post<any>(`${this.url}/roles`,data, {params: params});
  }

  getRoles(): Observable<any>{
    return this.httpClient.get(`${this.url}/roles`);
  }

  getRoleIdMasterProcess(id:string): Observable<any>{
    return this.httpClient.get(`${this.url}/roles/${id}`);
  }

  updateRoleIdMasterProcess(id:string,data:any): Observable<any>{
    return this.httpClient.patch(`${this.url}/roles/${id}`,data);
  }

  sendCodeVerifyMethod(userId: string, data: any): Observable<any>{
    let params = new HttpParams();
    params = params.set('type', 'send');
    return this.httpClient.post(`${this.url}/users/${userId}/verification-code`,data, {params});
  }

  getCodeVerifyMethod(userId: string, data: any): Observable<any>{
    let params = new HttpParams();
    params = params.set('type', 'get');
    return this.httpClient.post(`${this.url}/users/${userId}/verification-code`,data, {params});
  }

  confirmCodeVerifyMethod(userId: string, data: any): Observable<any>{
    let params = new HttpParams();
    params = params.set('type', 'confirm');
    return this.httpClient.post(`${this.url}/users/${userId}/verification-code`,data, {params});
  }

  associateSoftware(userId: string): Observable<any>{
    let params = new HttpParams();
    params = params.set('type', 'associate');
    return this.httpClient.post(`${this.url}/users/${userId}/software-mfa`,{}, {params});
  }

  verifySoftwareToken(userId: string, data: any): Observable<any>{
    let params = new HttpParams();
    params = params.set('type', 'verify');
    
    return this.httpClient.post(`${this.url}/users/${userId}/software-mfa`,data, {params});
  }

  setUpMfaUserPreference(userId: string, data: any): Observable<any>{
    return this.httpClient.patch(`${this.url}/users/${userId}/setup-mfa-preference`,data);
  }

  adminSetUpMfaUserPreference(userId: string, data: any): Observable<any>{
    return this.httpClient.patch(`${this.url}/users/${userId}/admin-setup-mfa-preference`,data);
  }

  async refreshDataUser(){
    const id = this.cookieService.get('userId');
    const user = await firstValueFrom(this.getUsersId(id));
    this.user.next(user);
  }

  changePassword(userId: string, data: any): Observable<any>{
    return this.httpClient.patch(`${this.url}/users/${userId}/change-password`,data);
  }

  
  // iframe(data: any): Observable<any>{
  //   const params = new HttpParams()
  //   .set('route', data.route)
  //   .set('token', data.token);
  //   return this.httpClient.get(`${this.urlIframe}/auth-iframe`,{params});
  // }



}

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import jwtDecode from 'jwt-decode';
import { CookieService } from 'ngx-cookie-service';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private url = `${environment.URL_API_GATEWAY}`;
  private userId: string;
  private user: any;
  private roles: any[];

  constructor(
    private httpClient: HttpClient,
    private cookieService: CookieService
  ) { }

  //Verificar si el usuario esta logeado en api gateway
  async isAuth(): Promise<boolean> {
    let credentials = {
      auth: 'validateSession'
    }
    try {
      const res: any = await this.httpClient.post<any>(`${this.url}/auth`, credentials).toPromise();
      this.decodeToken();
      this.user = res.user
      return res.validSession;
    } catch (err) {
      console.error('Error:', err);
      return false;
    }
  }

  getToken(): string {
    //Buscamos el key que tenga el accessToken, y retornamos el token
    for (let i = 0; i < localStorage.length; i++) {
      if (localStorage.key(i).endsWith('accessToken')) {
        return localStorage.getItem(localStorage.key(i));
      }
    }
    return null;
  }

  //Decodificación del access token para obtener el identificador del usuario
  decodeToken() {
    const token = this.getToken();
    const decoded: any = jwtDecode(token);
    this.userId = decoded.sub
    if(!this.userId) console.error('Identicadr de usuario no encontrado');
  }

  getUser() {
    return this.user;
  }

  getUserId() {
    return this.userId;
  }

  getRoles() {
    return this.roles;
  }

  getRole(): any {
    const role = this.cookieService.get('role');
    return JSON.parse(role) || this.roles[0];
  }

  updateRole(role: any) {
    this.cookieService.set('role', JSON.stringify(role), { expires: 7, path: '/' });
    const event = new CustomEvent('roleChanged', { detail: role });
    window.dispatchEvent(event);
  }

  async hasPermission(permission: string): Promise<boolean> {
    try {
      // Obtener el rol y el userId de las cookies
      const roleId = encodeURIComponent(JSON.parse(this.cookieService.get('role'))?.role_id);
      const userId = this.cookieService.get('userId');

      // Realizar la consulta al backend
      const consult = await firstValueFrom(this.httpClient.get<any>(`${this.url}/users/${userId}/roles/${roleId}/permissions/${encodeURIComponent(permission)}`));
      // Verificar si el usuario tiene el permiso
      return consult?.hasPermission === true;
    } catch (error) {
      console.error('Error al consultar el permiso:', error);
      return false; // Devolver false si ocurre un error
    }
  }

  setCookie(name: string, value: string) {
    this.cookieService.set(name, value, { expires: 7, path: '/' });
  }

  async getUserData(): Promise<void> {

    // Decodificar el token para obtener el userId
    this.decodeToken();

    // Verificar si el userId está presente
    if (!this.userId) {
      return Promise.reject('No se encontró el ID del usuario');
    }

    try {
      const data = await firstValueFrom(this.httpClient.get<any>(`${this.url}/auth/${this.userId}`));
      // Asignar los datos del usuario y roles
      this.user = data;
      this.roles = data.user_roles || [];
    } catch (err) {
      // Manejo de errores en la consulta HTTP
      console.error('Error al obtener datos del usuario:', err);
      return Promise.reject(err);
    }
  }

}

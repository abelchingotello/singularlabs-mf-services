import { HttpBackend, HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import jwtDecode from 'jwt-decode';
import { CookieService } from 'ngx-cookie-service';
import { firstValueFrom } from 'rxjs';

interface GenerateQrAuthSession {
  username: string;
  tokenType: string;
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresAt: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private url = `${environment.URL_API_GATEWAY}`;
  private userId: string;
  private user: any;
  private roles: any[];

  private rawHttpClient: HttpClient;
  private generateQrAuthPromise: Promise<string> | null = null;
  private readonly generateQrAuthStorageKey = 'qr_cognito_auth_session';
  private readonly generateQrRefreshWindowMs = 2 * 60 * 1000;

  constructor(
    private httpClient: HttpClient,
    private cookieService: CookieService,
    private httpBackend: HttpBackend
  ) {
    this.rawHttpClient = new HttpClient(this.httpBackend);
  }

  //Verificar si el usuario esta logeado en api gateway
  async isAuth(): Promise<boolean> {
    const credentials = {
      auth: 'validateSession'
    };
    try {
      const res: any = await this.httpClient.post<any>(`${this.url}/oauth`, credentials).toPromise();
      this.decodeToken();
      this.user = res.user;
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

  private getGenerateQrAuthSession(): GenerateQrAuthSession | null {
    try {
      const raw = sessionStorage.getItem(this.generateQrAuthStorageKey);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw);
      const accessToken = String(parsed?.accessToken || '').trim();
      const idToken = String(parsed?.idToken || '').trim();
      if ((!accessToken && !idToken) || !parsed?.username) {
        return null;
      }
      return {
        username: String(parsed.username),
        tokenType: String(parsed.tokenType || 'Bearer'),
        accessToken,
        idToken,
        refreshToken: String(parsed.refreshToken || ''),
        expiresAt: Number(parsed.expiresAt || 0)
      };
    } catch {
      return null;
    }
  }

  private setGenerateQrAuthSession(payload: any, fallbackUsername?: string): GenerateQrAuthSession {
    const username = String(payload?.username || fallbackUsername || environment.URL_API_GENERATE_QR_USERNAME || '').trim();
    const tokenType = String(payload?.tokenType || 'Bearer');
    const accessToken = String(payload?.accessToken || '').trim();
    const idToken = String(payload?.idToken || '').trim();
    const refreshToken = String(payload?.refreshToken || '').trim();
    const expiresIn = Number(payload?.expiresIn || 0);

    let issuedAtMs = Date.now();
    if (payload?.issuedAt) {
      const parsed = new Date(payload.issuedAt).getTime();
      if (!Number.isNaN(parsed)) {
        issuedAtMs = parsed;
      }
    }

    const tokenForExpiry = accessToken || idToken;
    let expiresAt = issuedAtMs + (expiresIn > 0 ? expiresIn * 1000 : 0);
    if (!expiresIn && tokenForExpiry) {
      try {
        const decoded: any = jwtDecode(tokenForExpiry);
        if (decoded?.exp) {
          expiresAt = Number(decoded.exp) * 1000;
        }
      } catch {
        // ignore decode errors and keep computed value
      }
    }

    const previous = this.getGenerateQrAuthSession();
    const session: GenerateQrAuthSession = {
      username,
      tokenType,
      accessToken,
      idToken,
      refreshToken: refreshToken || previous?.refreshToken || '',
      expiresAt
    };

    sessionStorage.setItem(this.generateQrAuthStorageKey, JSON.stringify(session));
    return session;
  }

  private getGenerateQrBearerToken(session: GenerateQrAuthSession | null): string {
    if (!session) {
      return '';
    }
    return String(session.idToken || session.accessToken || '').trim();
  }

  clearGenerateQrAuthSession(): void {
    sessionStorage.removeItem(this.generateQrAuthStorageKey);
  }

  private isGenerateQrTokenStillValid(session: GenerateQrAuthSession | null): boolean {
    if (!this.getGenerateQrBearerToken(session) || !session?.expiresAt) {
      return false;
    }
    return (session.expiresAt - Date.now()) > this.generateQrRefreshWindowMs;
  }

  private async loginGenerateQr(): Promise<string> {
    const username = String(environment.URL_API_GENERATE_QR_USERNAME || '').trim();
    const password = String(environment.URL_API_GENERATE_QR_PASSWORD || '').trim();

    if (!username || !password) {
      throw new Error('Credenciales de QR no configuradas en environment');
    }

    const response: any = await firstValueFrom(
      this.rawHttpClient.post(`${environment.URL_API_GENERATE_QR}/v1/auth/cognito/login`, {
        username,
        password
      })
    );

    const session = this.setGenerateQrAuthSession(response, username);
    const token = this.getGenerateQrBearerToken(session);
    if (!token) {
      throw new Error('No se obtuvo idToken/accessToken en login QR');
    }
    return token;
  }

  private async refreshGenerateQr(session: GenerateQrAuthSession): Promise<string> {
    if (!session?.refreshToken || !session?.username) {
      throw new Error('No existe refreshToken para QR');
    }

    const response: any = await firstValueFrom(
      this.rawHttpClient.post(`${environment.URL_API_GENERATE_QR}/v1/auth/cognito/refresh`, {
        refreshToken: session.refreshToken,
        username: session.username
      })
    );

    const updatedSession = this.setGenerateQrAuthSession(response, session.username);
    const token = this.getGenerateQrBearerToken(updatedSession);
    if (!token) {
      throw new Error('No se obtuvo idToken/accessToken en refresh QR');
    }
    return token;
  }

  async getValidGenerateQrToken(forceRefresh = false): Promise<string> {
    if (this.generateQrAuthPromise) {
      return this.generateQrAuthPromise;
    }

    this.generateQrAuthPromise = (async () => {
      const stored = this.getGenerateQrAuthSession();

      if (!forceRefresh && this.isGenerateQrTokenStillValid(stored)) {
        return this.getGenerateQrBearerToken(stored);
      }

      if (stored?.refreshToken) {
        try {
          return await this.refreshGenerateQr(stored);
        } catch {
          this.clearGenerateQrAuthSession();
        }
      }

      return this.loginGenerateQr();
    })();

    try {
      return await this.generateQrAuthPromise;
    } finally {
      this.generateQrAuthPromise = null;
    }
  }

  //Decodificacion del access token para obtener el identificador del usuario
  decodeToken() {
    const token = this.getToken();
    const decoded: any = jwtDecode(token);
    this.userId = decoded.sub;
    if (!this.userId) console.error('Identicadr de usuario no encontrado');
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

    // Verificar si el userId esta presente
    if (!this.userId) {
      return Promise.reject('No se encontro el ID del usuario');
    }

    try {
      const data = await firstValueFrom(this.httpClient.get<any>(`${this.url}/oauth/${this.userId}`));
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

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { firstValueFrom, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class VariablesService {

  private url = `${environment.URL_API_GATEWAY}`;
  subdomain: string;
  config: any;
  company: any;
  public recaptchav3
  recaptchaSiteKey: string | null = null;
  recaptchav3Enabled: boolean | null = null;

  constructor(private httpClient: HttpClient, private cookieService: CookieService

  ) { }

  async setConfigurations(): Promise<void> {
    const fullHostname = window.location.hostname;
    const domainParts = fullHostname.split('.');   

    // Detectar subdominio asumiendo que los dos últimos segmentos son el dominio principal
    if (domainParts.length > 2) {
        this.subdomain = domainParts.slice(0, domainParts.length - 2).join('.'); 
    } else {
        this.subdomain = ''; // Si no hay subdominio
    }
    await this.getCompanyConfig(this.subdomain);
    if(this.config){
      this.setConfigInCookies(this.config, 1); // Cargar solo lo necesario
    }
  }

  //Obtener información de compañia y sus configuraciones
  async getCompanyConfig(subDomain: string): Promise<void> {
    if (!this.config) { // Solo cargar si no está en caché
      const data = await firstValueFrom(this.getCompany('innovate',['recaptchav3']));
      this.config = data?.config;
      this.company = data?.company;
    }
  }

  //Petición para obtener según subdominio y lista limitada de configuraciones
  getCompany(subDomain: string, filterValues: string[]): Observable<any> {
    let params = new HttpParams().set('subDomain', subDomain);

    // Agregar múltiples valores de filtro a los parámetros de la URL
    if (filterValues && filterValues.length > 0) {
        params = params.set('config_type', filterValues.join(',')); // Convertir el array en una cadena separada por comas
    }

    return this.httpClient.get<any>(`${this.url}/company/filter`, { params: params });
}

  // Función para guardar todas las configuraciones en cookies
  setConfigInCookies(config: any[], days: number): void {
    // Iterar sobre cada ítem de la lista de configuraciones
    config.forEach(item => {
      const configType = item.SK;
      const configValue = item.config_value;

      Object.keys(configValue).forEach(key => {
        const cookieName = `${configType}_${key}`;
        this.cookieService.set(cookieName, String(configValue[key]), days);
      });
    });
    this.recaptchaSiteKey = atob(this.getConfig('recaptchav3_site_key')) || 'default_key_if_cookie_not_found';
    this.recaptchav3Enabled = Boolean(this.getConfig('recaptchav3_enabled') === 'true');
  }

  getConfig(key: string): string | null {
    return this.cookieService.get(key) || null;
  }

  getCompanyName(){
    return this.company.company_name;
  }
  
}

// Factory function para obtener la clave de reCAPTCHA
// export function recaptchaSiteKeyFactory(variables: VariablesService): string {
//   // Obtener y verificar si reCAPTCHA está habilitado
//   const isRecaptchaEnabled: boolean = variables.getConfig('recaptchaV3_enabled') === 'true';

//   // Si no está habilitado, devolver clave por defecto inmediatamente
//   if (!isRecaptchaEnabled) {
//     return 'default_key_if_cookie_not_found';
//   }

//   // Obtener la clave recaptchav3_site_key
//   const recaptchaKeyBase64: string | null = variables.getConfig('recaptchav3_site_key');

//   // Si no existe la clave o no es válida, devolver clave por defecto
//   if (!recaptchaKeyBase64) {
//     return 'default_key_if_cookie_not_found';
//   }

//   // Intentar decodificar la clave en Base64
//   try {
//     return atob(recaptchaKeyBase64);
//   } catch {
//     return 'default_key_if_cookie_not_found';
//   }
// }


export function appLoadFactory(config: VariablesService) {
  return () => config.setConfigurations().then();
}


import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AppGuard implements CanActivate {
  
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}


  async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Promise<boolean> {
    var isAuth = await this.authService.isAuth();
    if (!isAuth) {
      this.router.navigate(['/sign-in'])
      return false;
    }
    return true;
  }

  
}

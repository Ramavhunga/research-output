import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  private readonly adminStaffNo = '16211';

  constructor(private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, _state: RouterStateSnapshot): boolean {
    const loginRaw = sessionStorage.getItem('login');
    if (!loginRaw) {
      this.router.navigate(['/login']);
      return false;
    }

    const requiredRoles = (route.data?.['roles'] ?? []) as string[];
    if (requiredRoles.length === 0) {
      return true;
    }

    try {
      const login = JSON.parse(loginRaw);
      const currentRoles = this.extractRoles(login);
      const allowed = requiredRoles.some(role => currentRoles.includes(role.toUpperCase()));
      if (!allowed) {
        this.router.navigate(['/dashboard']);
      }
      return allowed;
    } catch {
      this.router.navigate(['/login']);
      return false;
    }
  }

  private extractRoles(login: any): string[] {
    const normalizedRoles = new Set<string>();
    const roleSource = login?.user?.roles ?? login?.user?.userType ?? login?.userType ?? '';
    if (Array.isArray(roleSource)) {
      roleSource
        .map(value => String(value).toUpperCase().trim())
        .filter(Boolean)
        .forEach(role => normalizedRoles.add(role));
    } else {
      String(roleSource)
        .split(',')
        .map(value => value.trim().toUpperCase())
        .filter(Boolean)
        .forEach(role => normalizedRoles.add(role));
    }

    const username = String(login?.user?.username ?? login?.username ?? '').trim();
    const staffNo = String(login?.staff?.personNumber ?? '').trim();
    if (username === this.adminStaffNo || staffNo === this.adminStaffNo) {
      normalizedRoles.add('ADMIN');
    }

    return Array.from(normalizedRoles);
  }
}

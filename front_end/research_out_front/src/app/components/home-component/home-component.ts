import {Component, OnInit} from '@angular/core';
import {RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {LoginDTO} from '../../interface/login-dto';
import {NgIf} from '@angular/common';

@Component({
  selector: 'app-home-component',
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    NgIf,
  ],
  templateUrl: './home-component.html',
  styleUrl: './home-component.css'
})
export class HomeComponent implements OnInit{
  private readonly adminStaffNo = '16211';

  login: LoginDTO | undefined;
  roles: string[] = [];

  ngOnInit() {
    const loginData = sessionStorage.getItem('login');
    if (loginData) {
      this.login = JSON.parse(loginData) as LoginDTO;
      this.roles = this.extractRoles(this.login as any);
    }

    console.log(loginData);
  }

  hasAnyRole(...requiredRoles: string[]): boolean {
    const current = new Set(this.roles);
    return requiredRoles.some(role => current.has(role.toUpperCase()));
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

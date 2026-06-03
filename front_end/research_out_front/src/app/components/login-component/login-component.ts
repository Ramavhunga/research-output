import { Component } from '@angular/core';
import {Router, RouterLink, Routes} from '@angular/router';
import {FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {LoginService} from '../../services/login.service';
import {User} from '../../interface/user';
import Swal from 'sweetalert2';
import {catchError, of} from 'rxjs';
import {LoginDTO} from '../../interface/login-dto';
import {UserRoleService} from '../../services/user-role.service';

@Component({
  selector: 'app-login-component',
  imports: [

    ReactiveFormsModule
  ],
  templateUrl: './login-component.html',
  styleUrl: './login-component.css'
})
export class LoginComponent {

  loginForm = new FormGroup({
    username: new FormControl('', Validators.required),
    password:new FormControl('', Validators.required),
    userType: new FormControl(''),
  });

  constructor(private fb: FormBuilder,
              private loginService: LoginService,
              private userRoleService: UserRoleService,
              private route: Router)  {

  }

  login() {
    const user: User = this.loginForm.getRawValue();

    this.loginService.login(user).pipe(
      catchError(error => {
        debugger;
        Swal.fire({
          title: "Failed to Login",
          text: "Invalid Credentials!",
          icon: "error"
        });
        return of();
      })
    ).subscribe(data => {
      const login: any = data as LoginDTO;
      console.log('Login:', login);
      if (!login) {
        Swal.fire({
          title: "Failed to Login",
          text: "Invalid Credentials!",
          icon: "error"
        });
      } else {
        const username = String(login?.user?.username ?? login?.username ?? '').trim();
        this.userRoleService.listUsersWithRoles().pipe(
          catchError(() => of([]))
        ).subscribe(roleUsers => {
          const currentUser = (roleUsers ?? []).find((item: any) =>
            String(item?.username ?? '').trim().toLowerCase() === username.toLowerCase()
          );

          if (currentUser?.roles?.length) {
            login.user = {
              ...(login.user ?? {}),
              roles: (currentUser.roles ?? []).map((role: any) => String(role).toUpperCase())
            };
          }

          sessionStorage.setItem('login', JSON.stringify(login));
          this.route.navigate(['/dashboard']).then();
        });
      }
    });

  }

}

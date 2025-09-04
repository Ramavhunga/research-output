import { Component } from '@angular/core';
import {Router} from '@angular/router';
import {FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {LoginService} from '../../services/login.service';
import {User} from '../../interface/user';
import Swal from 'sweetalert2';
import {catchError, map, of} from 'rxjs';
import {LoginDTO} from '../../interface/login-dto';

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
              private route: Router)  {

  }

  login() {
      const user: User = this.loginForm.getRawValue();

      this.loginService.login(user).pipe(
        catchError(error => {
          Swal.fire({
            title: "Failed to Login",
            text: "Invalid Credentials!",
            icon: "error"
          });
          return of();
        })
      ).subscribe(data => {
        sessionStorage.setItem('login', JSON.stringify(data));
        const login: LoginDTO = data;
        console.log('Login:', login);
        if (!login) {
          Swal.fire({
            title: "Failed to Login",
            text: "Invalid Credentials!",
            icon: "error"
          });
        } else {
          this.route.navigate(['/dashboard']).then();
        }
      });

  }

}

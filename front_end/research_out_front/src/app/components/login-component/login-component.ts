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
    if (this.loginForm.invalid) {
      Swal.fire({
        title: "Invalid Input",
        text: "Please fill in all required fields.",
        icon: "warning"
      });
      return;
    }

    const user: User = this.loginForm.getRawValue();

    this.loginService.login(user).pipe(
      catchError(error => {
        Swal.fire({
          title: "Failed to Login",
          text: error?.error?.message || "Invalid Credentials!",
          icon: "error"
        });
        return of(null);
      })
    ).subscribe(data => {
      if (!data) {
        return;
      }
      // Store only the token or necessary info
      sessionStorage.setItem('token', data.token);
      this.route.navigate(['/dashboard']);
    });
  }
}

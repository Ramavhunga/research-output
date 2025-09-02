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

  login: LoginDTO | undefined;

  ngOnInit() {
    const loginData = sessionStorage.getItem('login');
    if (loginData) {
      this.login = JSON.parse(loginData) as LoginDTO;
    }

    console.log(loginData);
  }

}

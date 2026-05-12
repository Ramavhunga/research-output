import { Component } from '@angular/core';
import {Router} from '@angular/router';


@Component({
  selector: 'app-conference-proceedings-component',
  imports: [],
  templateUrl: './conference-proceedings-component.html',
  styleUrl: './conference-proceedings-component.css'
})
export class ConferenceProceedingsComponent {

  constructor(private router: Router) {}
  goToBookDetails() {

debugger;
    this.router.navigate(['proceeding/conferenceproceedingsdetails']);
  }
}

import { Component } from '@angular/core';
import {Router, RouterLink} from '@angular/router';

@Component({
  selector: 'app-books-fields-component',
  imports: [
    RouterLink
  ],
  templateUrl: './books-fields-component.html',
  styleUrl: './books-fields-component.css'
})
export class BooksFieldsComponent {

  constructor(private router: Router) {}

  goToBookDetails() {
    debugger;
    this.router.navigate(['book/bookdetails']);

    //this.router.navigate(['journal/details'], { state: { journal } });
  }
}

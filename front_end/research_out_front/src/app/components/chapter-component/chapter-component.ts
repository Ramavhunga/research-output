import { Component } from '@angular/core';
import {Router, RouterLink} from "@angular/router";

@Component({
  selector: 'app-chapter-component',
    imports: [
        RouterLink
    ],
  templateUrl: './chapter-component.html',
  styleUrl: './chapter-component.css'
})
export class ChapterComponent {

  constructor(private router: Router) {}

  goToBookDetails() {
    debugger;
    this.router.navigate(['chapter/chapterdetails']);

    //this.router.navigate(['journal/details'], { state: { journal } });
  }
}

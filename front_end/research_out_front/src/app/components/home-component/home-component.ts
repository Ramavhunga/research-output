import { Component } from '@angular/core';
import {ResearchOutputComponent} from '../research-output/research-output';
import {RouterLink, RouterLinkActive} from '@angular/router';

@Component({
  selector: 'app-home-component',
  imports: [
    ResearchOutputComponent,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './home-component.html',
  styleUrl: './home-component.css'
})
export class HomeComponent {

}

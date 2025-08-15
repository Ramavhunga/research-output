import { Component } from '@angular/core';
import {ResearchOutputComponent} from '../research-output/research-output';

@Component({
  selector: 'app-home-component',
  imports: [
    ResearchOutputComponent
  ],
  templateUrl: './home-component.html',
  styleUrl: './home-component.css'
})
export class HomeComponent {

}

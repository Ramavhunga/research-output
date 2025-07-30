import { Component, OnInit } from '@angular/core';
import {ResearchOutput} from '../../models/research-output.model';
import {ResearchOutputService} from '../../services/research-output.service';

@Component({
  selector: 'app-research-output',
  templateUrl: './research-output.html'
})
export class ResearchOutputComponent implements OnInit {
  output!: ResearchOutput;

  constructor(private service: ResearchOutputService) {}

  ngOnInit(): void {
    this.output = this.service.getResearchOutput();
  }
}

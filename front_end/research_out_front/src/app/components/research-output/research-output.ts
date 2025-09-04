import { Component, OnInit } from '@angular/core';
import {ResearchOutput} from '../../models/research-output.model';
import {RouterLink, RouterLinkActive} from '@angular/router';
import {catchError, of} from 'rxjs';
import Swal from 'sweetalert2';
import {ResearchOutputService} from '../../services/research-output-service';
import {NgForOf} from '@angular/common';

@Component({
  selector: 'app-research-output',
  imports: [
    RouterLink,
    RouterLinkActive,
    NgForOf,
  ],
  templateUrl: './research-output.html'
})
export class ResearchOutputComponent implements OnInit {
  researchOutputs: ResearchOutput[] = [];

  constructor(private service: ResearchOutputService) {}

  ngOnInit(): void {
      this.service.load_research_outputs().pipe(
        catchError(() => {
          Swal.fire("Failed to Login", "Invalid Credentials!", "error");
          return of();
        })
      ).subscribe(data => {
        this.researchOutputs = data;
        console.log('load_research_outputs:', this.researchOutputs);
      });
  }
}

import {Component, OnInit} from '@angular/core';
import {Router, RouterLink } from '@angular/router';
import {NgForOf} from '@angular/common';
import {ResearchOutputService} from '../../services/research-output-service';
import {catchError, of} from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-manage-submissions-components',
  imports: [
    RouterLink,
    NgForOf
  ],
  templateUrl: './manage-submissions-components.html',
  styleUrl: './manage-submissions-components.css'
})

export class ManageSubmissionsComponents  implements OnInit {
  researchOutputs: ResearchOutput[] = [];

  constructor( private service: ResearchOutputService ) {}

  ngOnInit(): void {

    this.service.load_submissions("Approved").pipe(
      catchError(() => {
        Swal.fire("Failed to load submissions", "Error while loading!", "error");
        return of();
      })
    ).subscribe(data => {
      this.researchOutputs = data;
    });

  }

  viewOutput(output: any) {

  }

}

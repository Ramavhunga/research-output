import { Component } from '@angular/core';
import {NgForOf} from '@angular/common';
import {Router, RouterLink, RouterLinkActive} from '@angular/router';
import {ResearchOutputService} from '../../services/research-output-service';
import {catchError, of} from 'rxjs';
import Swal from 'sweetalert2';
import {JournalService} from '../../services/journal-service';
import {Journal} from '../../models/journal.model';
import {debug} from 'node:util';

@Component({
  selector: 'app-journal-component',
  imports: [
    NgForOf,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './journal-component.html',
  styleUrl: './journal-component.css'
})
export class JournalComponent {
  journals: Journal[] = [];
  constructor(private service: JournalService, private router: Router) {}

  ngOnInit(): void {
    debugger
    const login = sessionStorage.getItem("login");
    if (!login) {
      this.router.navigate(['/login']);
     // return;
    }else{
      const data = JSON.parse(login);
      const username = data.user.username;
      this.service.getAllJournals().pipe(

        catchError(() => {
          debugger;
          Swal.fire("Failed to Login", "Invalid Credentials!", "error");
          return of();
        })
      ).subscribe(data => {
        debugger;
        this.journals = data;

      });
    }
  }



  viewJournal(journal: Journal) {
    //console.log('viewOutput:', output);
    debugger;
    this.router.navigate(['journal/details'], { state: { journal } });
  }
}

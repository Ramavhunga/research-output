import { Component } from '@angular/core';
import {NgForOf} from '@angular/common';
import {Router, RouterLink, RouterLinkActive} from '@angular/router';
import {ResearchOutputService} from '../../services/research-output-service';
import {catchError, of} from 'rxjs';
import Swal from 'sweetalert2';
import {JournalService} from '../../services/journal-service';

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
    const login = sessionStorage.getItem("login");
    if (!login) {
      this.router.navigate(['/login']);
      return;
    }
    const username = JSON.parse(login).user.username;
    this.service.loud_journals(username).pipe(
      catchError(() => {
        Swal.fire("Failed to Login", "Invalid Credentials!", "error");
        return of();
      })
    ).subscribe(data => {
      this.journals = data;

    });
  }



  viewJournal(journal: Journal) {
    //console.log('viewOutput:', output);
    this.router.navigate(['journal/detail'], { state: { journal } });
  }
}

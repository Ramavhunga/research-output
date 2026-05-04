import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard-component',
  // imports: [],
  templateUrl: './dashboard-component.html',
  standalone: true,
  styleUrl: './dashboard-component.css'
})
export class DashboardComponent {

  stats = {
    journals: 5,
    books: 3,
    conferences: 3,
    chapters: 9,
    totalUnits: 20,
    totalSubmissions: 30,
    totalOutputs: 9,
    activeResearchers: 8,
    approved: 4,
    pending: 3,
    rejected: 2,
    dhetCompliance: 10
  };
}

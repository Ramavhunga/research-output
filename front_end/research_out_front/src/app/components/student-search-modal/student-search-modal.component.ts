import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudentSearchService, StudentSearchResult } from '../../services/student-search.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-student-search-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal fade" id="studentSearchModal" tabindex="-1" role="dialog">
      <div class="modal-dialog modal-lg" role="document">
        <div class="modal-content">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title">Search Student/Staff Member</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Enter Student/Staff Number or Name</label>
              <input
                type="text"
                class="form-control form-control-lg"
                placeholder="e.g., 12345 or John Smith"
                [(ngModel)]="searchQuery"
                (keyup)="onSearchInput()"
                (keyup.enter)="performSearch()">
            </div>

            <div class="search-results" *ngIf="showResults">
              <div *ngIf="isSearching" class="text-center">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Searching...</span>
                </div>
                <p class="mt-2 text-muted">Searching...</p>
              </div>

              <div *ngIf="!isSearching && searchResult && !searchError" class="result-item p-3 border rounded bg-light">
                <div class="row">
                  <div class="col-md-8">
                    <h6 class="mb-1">{{ searchResult.fullName }}</h6>
                    <small class="text-muted d-block">
                      <strong>{{ searchResult.type }}:</strong>
                      {{ searchResult.staffNo || searchResult.studentNo }}
                    </small>
                    <small class="text-muted d-block">
                      <strong>Department:</strong> {{ searchResult.department }}
                    </small>
                    <small class="text-muted d-block">
                      <strong>Faculty:</strong> {{ searchResult.faculty }}
                    </small>
                  </div>
                  <div class="col-md-4 text-end">
                    <button
                      type="button"
                      class="btn btn-success btn-sm"
                      (click)="selectStudent(searchResult)"
                      data-bs-dismiss="modal">
                      <i class="fa fa-check me-2"></i>Select
                    </button>
                  </div>
                </div>
              </div>

              <div *ngIf="!isSearching && searchError" class="alert alert-danger" role="alert">
                <i class="fa fa-exclamation-circle me-2"></i>
                {{ searchError }}
              </div>

              <div *ngIf="!isSearching && !searchResult && !searchError && searchQuery" class="alert alert-info">
                <i class="fa fa-info-circle me-2"></i>
                No results found. Check the number and try again.
              </div>
            </div>

            <div class="recent-searches" *ngIf="!showResults && recentSearches.length > 0" class="mt-4">
              <h6 class="mb-3">Recent Searches</h6>
              <div class="list-group">
                <button
                  type="button"
                  class="list-group-item list-group-item-action text-start"
                  *ngFor="let item of recentSearches"
                  (click)="selectFromRecent(item)"
                  data-bs-dismiss="modal">
                  <div>
                    <strong>{{ item.fullName }}</strong>
                    <small class="text-muted d-block">{{ item.staffNo || item.studentNo }} - {{ item.department }}</small>
                  </div>
                </button>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            <button
              type="button"
              class="btn btn-primary"
              [disabled]="!searchQuery || isSearching"
              (click)="performSearch()">
              <i class="fa fa-search me-2"></i>Search
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .search-results {
      min-height: 100px;
    }
    .result-item {
      transition: all 0.3s ease;
    }
    .result-item:hover {
      background-color: #f8f9fa !important;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .list-group-item:hover {
      background-color: #f8f9fa;
    }
  `]
})
export class StudentSearchModalComponent implements OnInit {
  searchQuery: string = '';
  searchResult: StudentSearchResult | null = null;
  isSearching = false;
  searchError: string | null = null;
  showResults = false;
  recentSearches: StudentSearchResult[] = [];
  selectedStudent: StudentSearchResult | null = null;

  constructor(private studentSearchService: StudentSearchService) {}

  ngOnInit() {
    this.loadRecentSearches();
  }

  onSearchInput(): void {
    this.searchResult = null;
    this.searchError = null;
  }

  performSearch(): void {
    if (!this.searchQuery.trim()) {
      this.searchError = 'Please enter a student or staff number';
      return;
    }

    this.isSearching = true;
    this.showResults = true;
    this.searchResult = null;
    this.searchError = null;

    this.studentSearchService.searchByNumber(this.searchQuery).subscribe({
      next: (result) => {
        this.isSearching = false;
        if (result) {
          this.searchResult = result;
          this.addToRecentSearches(result);
        } else {
          this.searchError = 'Student/Staff member not found. Please check the number.';
        }
      },
      error: (err) => {
        this.isSearching = false;
        console.error('Search error:', err);
        this.searchError = 'Error searching for student. Please try again.';
      }
    });
  }

  selectStudent(student: StudentSearchResult): void {
    this.selectedStudent = student;
    this.addToRecentSearches(student);
    // Emit event or notify parent
    this.onStudentSelected(student);
  }

  selectFromRecent(student: StudentSearchResult): void {
    this.selectedStudent = student;
    this.onStudentSelected(student);
  }

  private onStudentSelected(student: StudentSearchResult): void {
    // Store selected student in sessionStorage for access by parent component
    sessionStorage.setItem('selectedStudent', JSON.stringify(student));
  }

  private addToRecentSearches(student: StudentSearchResult): void {
    // Remove if already exists
    this.recentSearches = this.recentSearches.filter(
      s => (s.staffNo || s.studentNo) !== (student.staffNo || student.studentNo)
    );
    // Add to beginning
    this.recentSearches.unshift(student);
    // Keep only last 5
    if (this.recentSearches.length > 5) {
      this.recentSearches.pop();
    }
    // Save to localStorage
    localStorage.setItem('recentStudentSearches', JSON.stringify(this.recentSearches));
  }

  private loadRecentSearches(): void {
    try {
      const stored = localStorage.getItem('recentStudentSearches');
      if (stored) {
        this.recentSearches = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  }

  resetSearch(): void {
    this.searchQuery = '';
    this.searchResult = null;
    this.searchError = null;
    this.showResults = false;
  }
}


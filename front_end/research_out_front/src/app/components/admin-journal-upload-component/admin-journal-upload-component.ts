import { Component, OnInit } from '@angular/core';
import { NgForOf, NgIf } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { AdminJournalReference } from '../../models/admin-journal-reference.model';
import { AdminJournalReferenceService } from '../../services/admin-journal-reference.service';

@Component({
  selector: 'app-admin-journal-upload-component',
  imports: [NgIf, NgForOf, RouterLink],
  templateUrl: './admin-journal-upload-component.html',
  styleUrl: './admin-journal-upload-component.css'
})
export class AdminJournalUploadComponent implements OnInit {
  private readonly adminStaffNo = '16211';

  username = '';
  roles: string[] = [];
  selectedFile: File | null = null;
  uploading = false;
  loading = false;
  rowsInserted = 0;
  uploadedRows: AdminJournalReference[] = [];

  constructor(
    private adminJournalReferenceService: AdminJournalReferenceService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const loginRaw = sessionStorage.getItem('login');
    if (!loginRaw) {
      this.router.navigate(['/login']);
      return;
    }

    try {
      const login = JSON.parse(loginRaw);
      this.username = String(login?.user?.username ?? login?.username ?? '').trim();
      this.roles = this.extractRoles(login);
    } catch {
      this.username = '';
      this.roles = [];
    }

    if (!this.isAdmin()) {
      Swal.fire('Unauthorized', 'Only admins can upload the journal reference file.', 'error');
      this.router.navigate(['/dashboard']);
      return;
    }

    this.loadRows();
  }

  isAdmin(): boolean {
    return this.roles.includes('ADMIN');
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files.length > 0 ? input.files[0] : null;
    this.selectedFile = file;
  }

  upload(): void {
    if (!this.selectedFile) {
      Swal.fire('Validation', 'Please choose an Excel file before upload.', 'warning');
      return;
    }

    this.uploading = true;
    this.adminJournalReferenceService.uploadExcel(this.selectedFile, this.username).subscribe({
      next: (response) => {
        this.rowsInserted = response.rowsInserted ?? 0;
        this.uploading = false;
        this.selectedFile = null;
        Swal.fire('Upload complete', response.message || 'Journal reference file uploaded.', 'success');
        this.loadRows();
      },
      error: (err) => {
        this.uploading = false;
        console.log(err);
        Swal.fire('Upload failed', this.getBackendMessage(err, 'Could not upload file.'), 'error');
      }
    });
  }

  loadRows(): void {
    this.loading = true;
    this.adminJournalReferenceService.getAll(this.username).subscribe({
      next: (rows) => {
        this.uploadedRows = rows ?? [];
        this.loading = false;
      },
      error: (err) => {
        this.uploadedRows = [];
        this.loading = false;
        Swal.fire('Error', this.getBackendMessage(err, 'Could not load uploaded rows.'), 'error');
      }
    });
  }

  private extractRoles(login: any): string[] {
    const normalizedRoles = new Set<string>();
    const roleSource = login?.user?.roles ?? login?.user?.userType ?? login?.userType ?? '';

    if (Array.isArray(roleSource)) {
      roleSource
        .map((value: unknown) => String(value).toUpperCase().trim())
        .filter(Boolean)
        .forEach((role: string) => normalizedRoles.add(role));
    } else {
      String(roleSource)
        .split(',')
        .map(value => value.trim().toUpperCase())
        .filter(Boolean)
        .forEach(role => normalizedRoles.add(role));
    }

    const username = String(login?.user?.username ?? login?.username ?? '').trim();
    const staffNo = String(login?.staff?.personNumber ?? '').trim();
    if (username === this.adminStaffNo || staffNo === this.adminStaffNo) {
      normalizedRoles.add('ADMIN');
    }

    return Array.from(normalizedRoles);
  }

  private getBackendMessage(err: any, fallback: string): string {
    if (err?.status === 0) {
      return 'Cannot reach backend service. Confirm the API is running on http://localhost:8080 and CORS is allowed.';
    }

    const message = err?.error?.message;
    if (typeof message === 'string' && message.trim()) {
      return message.trim();
    }
    if (typeof err?.error === 'string' && err.error.trim()) {
      return err.error.trim();
    }
    return fallback;
  }
}



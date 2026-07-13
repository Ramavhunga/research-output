import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { Faculty, Department } from '../../models/common.model';
import { StaffRoleView } from '../../models/user-role.model';
import { FacultyDepartmentService } from '../../services/faculty-department.service';
import { UserRoleService } from '../../services/user-role.service';
import { DepartmentDeanService, DepartmentDeanDTO } from '../../services/department-dean.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-department-dean-assignment-component',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './department-dean-assignment-component.html',
  styleUrl: './department-dean-assignment-component.css'
})
export class DepartmentDeanAssignmentComponent implements OnInit, OnDestroy {
  faculties: Faculty[] = [];
  departments: Department[] = [];
  selectedFacultyId: number | null = null;
  selectedDepartmentId: number | null = null;

  searching = false;
  loadingFaculties = false;
  loadingDepartments = false;
  saving = false;
  loadingAssignedDeans = false;
  deletingDeanId: number | null = null;

  searchStaffNo = '';
  selectedStaff: StaffRoleView | null = null;

  // List view properties
  assignedDeans: DepartmentDeanDTO[] = [];
  activeTab: 'assign' | 'list' = 'assign';

  private departmentsSubscription?: Subscription;

  constructor(
    private facultyDepartmentService: FacultyDepartmentService,
    private userRoleService: UserRoleService,
    private departmentDeanService: DepartmentDeanService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadFaculties();
    this.loadAssignedDeans();
  }

  loadFaculties(): void {
    this.loadingFaculties = true;
    this.faculties = [];
    this.departments = [];
    this.selectedFacultyId = null;
    this.selectedDepartmentId = null;

    this.facultyDepartmentService.getAllFaculties().subscribe({
      next: (faculties) => {
        this.faculties = faculties;
        this.loadingFaculties = false;
      },
      error: (err) => {
        this.loadingFaculties = false;
        console.error('Failed to load faculties', err);
        Swal.fire('Error', 'Failed to load faculties. Please try again.', 'error');
      }
    });
  }

  loadAssignedDeans(): void {
    this.loadingAssignedDeans = true;
    this.departmentDeanService.getAllDeans().subscribe({
      next: (deans) => {
        this.assignedDeans = deans;
        this.loadingAssignedDeans = false;
      },
      error: (err) => {
        this.loadingAssignedDeans = false;
        console.error('Failed to load assigned deans', err);
        Swal.fire('Error', 'Failed to load assigned deans.', 'error');
      }
    });
  }

  ngOnDestroy(): void {
    this.departmentsSubscription?.unsubscribe();
  }

  onFacultyChange(facultyId: number | null): void {
    this.selectedFacultyId = facultyId;
    this.departments = [];
    this.selectedDepartmentId = null;
    this.selectedStaff = null;
    this.loadingDepartments = false;

    const normalizedFacultyId = Number(facultyId);
    if (!normalizedFacultyId) {
      return;
    }

    // Cancel any in-flight request so stale results do not overwrite the latest selection.
    this.departmentsSubscription?.unsubscribe();
    this.loadingDepartments = true;

    this.departmentsSubscription = this.facultyDepartmentService.getDepartmentsByFaculty(normalizedFacultyId).subscribe({
      next: (departments) => {
        this.departments = departments;
        this.loadingDepartments = false;
      },
      error: (err) => {
        this.loadingDepartments = false;
        console.error('Failed to load departments', err);
        Swal.fire('Error', 'Failed to load departments for this faculty.', 'error');
      }
    });
  }

  onDepartmentChange(): void {
    this.selectedStaff = null;
    this.searchStaffNo = '';
  }

  searchByStaffNo(): void {
    const trimmed = this.searchStaffNo.trim();
    if (!trimmed) {
      Swal.fire('Validation', 'Please enter a staff number.', 'warning');
      return;
    }

    if (!this.selectedDepartmentId) {
      Swal.fire('Validation', 'Please select a department first.', 'warning');
      return;
    }

    this.searching = true;
    this.selectedStaff = null;

    this.userRoleService.findStaffByNo(trimmed).subscribe({
      next: (staff) => {
        this.selectedStaff = staff;
        this.searching = false;
      },
      error: (err) => {
        this.searching = false;
        console.error('Failed to find staff', err);
        Swal.fire('Not found', `No employee details found for staff number ${trimmed}.`, 'error');
      }
    });
  }

  assignDean(): void {
    if (!this.selectedStaff) {
      Swal.fire('Validation', 'Search and select a staff member first.', 'warning');
      return;
    }

    if (!this.selectedDepartmentId) {
      Swal.fire('Validation', 'Please select a department.', 'warning');
      return;
    }

    const selectedDept = this.departments.find(d => d.id === this.selectedDepartmentId);
    const fullName = `${this.selectedStaff.title || ''} ${this.selectedStaff.firstname || ''} ${this.selectedStaff.surname || ''}`
      .trim();
    const deptName = selectedDept?.name || 'Unknown';

    Swal.fire({
      title: 'Assign Dean?',
      html: `<p>Assign <strong>${fullName}</strong> as Dean of <strong>${deptName}</strong>?</p>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, assign',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      this.saving = true;
      this.departmentDeanService.assignDean(this.selectedDepartmentId!, this.selectedStaff!.staffNo).subscribe({
        next: () => {
          this.saving = false;
          Swal.fire(
            'Success',
            `${fullName} has been assigned as Dean of ${deptName}.`,
            'success'
          );
          this.resetForm();
          this.loadAssignedDeans();
        },
        error: (err) => {
          this.saving = false;
          console.error('Failed to assign dean', err);
          const message = err.error?.message || 'Failed to assign dean. Please try again.';
          Swal.fire('Error', message, 'error');
        }
      });
    });
  }

  deleteDeanAssignment(dean: DepartmentDeanDTO): void {
    const fullName = `${dean.title || ''} ${dean.firstname || ''} ${dean.surname || ''}`.trim();
    const deptName = dean.departmentName || 'Unknown';

    Swal.fire({
      title: 'Remove Dean?',
      html: `<p>Remove <strong>${fullName}</strong> as Dean of <strong>${deptName}</strong>?</p>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, remove',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc3545'
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      this.deletingDeanId = dean.id;
      this.departmentDeanService.deleteDeanById(dean.id).subscribe({
        next: () => {
          this.deletingDeanId = null;
          Swal.fire('Success', 'Dean assignment removed successfully.', 'success');
          this.loadAssignedDeans();
        },
        error: (err) => {
          this.deletingDeanId = null;
          console.error('Failed to delete dean assignment', err);
          const message = err.error?.message || 'Failed to remove dean assignment.';
          Swal.fire('Error', message, 'error');
        }
      });
    });
  }

  resetForm(): void {
    this.selectedFacultyId = null;
    this.selectedDepartmentId = null;
    this.searchStaffNo = '';
    this.selectedStaff = null;
    this.departments = [];
    this.loadingDepartments = false;
    this.departmentsSubscription?.unsubscribe();
  }

  switchTab(tab: 'assign' | 'list'): void {
    this.activeTab = tab;
    if (tab === 'list') {
      this.loadAssignedDeans();
    }
  }

  isFormValid(): boolean {
    return !!(this.selectedFacultyId && this.selectedDepartmentId && this.selectedStaff);
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { StaffRoleView, UserRoleView } from '../../models/user-role.model';
import { UserRoleService } from '../../services/user-role.service';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

type AssignedUserRow = UserRoleView & {
  fullName?: string;
};

@Component({
  selector: 'app-role-assignment-component',
  imports: [CommonModule, RouterLink],
  templateUrl: './role-assignment-component.html',
  styleUrl: './role-assignment-component.css'
})
export class RoleAssignmentComponent implements OnInit {
  private readonly adminStaffNo = '16211';

  searching = false;
  saving = false;
  loadingAssignedUsers = false;
  deletingUserRole: { [key: string]: boolean } = {};
  searchStaffNo = '';
  selectedStaff: StaffRoleView | null = null;
  currentRoles: string[] = [];
  assignedUsers: AssignedUserRow[] = [];

  constructor(private userRoleService: UserRoleService, private router: Router) {}

  ngOnInit(): void {
    const loginRaw = sessionStorage.getItem('login');
    if (!loginRaw) {
      this.router.navigate(['/login']);
      return;
    }

    try {
      const login = JSON.parse(loginRaw);
      this.currentRoles = this.extractRoles(login);
    } catch {
      this.currentRoles = [];
    }

    this.loadAssignedUsers();

  }

  private extractRoles(login: any): string[] {
    const normalizedRoles = new Set<string>();
    const roleSource = login?.user?.roles ?? login?.user?.userType ?? login?.userType ?? '';

    if (Array.isArray(roleSource)) {
      roleSource
        .map(value => String(value).toUpperCase().trim())
        .filter(Boolean)
        .forEach(role => normalizedRoles.add(role));
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

  isAdmin(): boolean {
    return this.currentRoles.includes('ADMIN');
  }

  searchByStaffNo(): void {
    const trimmed = this.searchStaffNo.trim();
    if (!trimmed) {
      Swal.fire('Validation', 'Please enter a staff number.', 'warning');
      return;
    }

    this.searching = true;
    this.selectedStaff = null;
    this.userRoleService.findStaffByNo(trimmed).subscribe({
      next: (staff) => {
        this.selectedStaff = {
          ...staff,
          roles: (staff.roles ?? []).map(role => String(role).toUpperCase())
        };
        this.searching = false;
      },
      error: (err) => {
        this.searching = false;
        console.error('Failed to load staff details', err);
        Swal.fire('Not found', `No employee details found for staff number ${trimmed}.`, 'error');
      }
    });
  }

  hasRole(role: string): boolean {
    return (this.selectedStaff?.roles ?? []).includes(role);
  }

  toggleRole(role: string, checked: boolean): void {
    if (!this.selectedStaff) {
      return;
    }

    const set = new Set((this.selectedStaff.roles ?? []).map(r => String(r).toUpperCase()));
    if (checked) {
      set.add(role);
    } else {
      set.delete(role);
    }
    this.selectedStaff.roles = Array.from(set);
  }

  saveRoles(): void {
    if (!this.selectedStaff) {
      Swal.fire('Validation', 'Search and select a staff member first.', 'warning');
      return;
    }

    const rolesToSave = (this.selectedStaff.roles ?? []).map(role => String(role).toUpperCase()).filter(Boolean);
    if (rolesToSave.length === 0) {
      Swal.fire('Validation', 'Select at least one approval level.', 'warning');
      return;
    }

    this.saving = true;
    this.userRoleService.assignReviewerLevelsByStaffNo(this.selectedStaff.staffNo, rolesToSave).subscribe({
      next: (updated) => {
        this.selectedStaff = {
          ...updated,
          roles: (updated.roles ?? []).map(role => String(role).toUpperCase())
        };
        this.saving = false;
        this.loadAssignedUsers();
        Swal.fire('Saved', `Approval levels updated for staff number ${updated.staffNo}.`, 'success');
      },
      error: (err) => {
        this.saving = false;
        console.error('Failed to save approval levels', err);
        Swal.fire('Error', `Failed to update approval levels for staff number ${this.selectedStaff?.staffNo}.`, 'error');
      }
    });
  }

  loadAssignedUsers(): void {
    this.loadingAssignedUsers = true;
    this.userRoleService.listUsersWithRoles().subscribe({
      next: (users) => {
        const reviewerUsers = (users ?? [])
          .map(user => ({
            ...user,
            roles: (user.roles ?? []).map(role => String(role).toUpperCase())
          }))
          .filter(user => user.roles.includes('REVIEWER_LEVEL_1') || user.roles.includes('REVIEWER_LEVEL_2') || user.roles.includes('ADMIN'))
          .sort((a, b) => a.username.localeCompare(b.username));

        if (reviewerUsers.length === 0) {
          this.assignedUsers = [];
          this.loadingAssignedUsers = false;
          return;
        }

        forkJoin(
          reviewerUsers.map(user => this.userRoleService.findStaffByNo(user.username).pipe(
            map(staff => {
              const title = (staff?.title ?? '').trim();
              const firstname = (staff?.firstname ?? '').trim();
              const surname = (staff?.surname ?? '').trim();
              return {
                ...user,
                fullName: [title, firstname, surname].filter(Boolean).join(' ') || '-'
              } as AssignedUserRow;
            }),
            catchError(() => of({ ...user, fullName: '-' } as AssignedUserRow))
          ))
        ).subscribe({
          next: (rows) => {
            this.assignedUsers = rows;
            this.loadingAssignedUsers = false;
          },
          error: () => {
            this.assignedUsers = reviewerUsers.map(user => ({ ...user, fullName: '-' }));
            this.loadingAssignedUsers = false;
          }
        });
      },
      error: (err) => {
        this.loadingAssignedUsers = false;
        console.error('Failed to load assigned users', err);
      }
    });
  }

  deleteRoleFromUser(user: AssignedUserRow, roleToRemove: string): void {
    Swal.fire({
      title: 'Remove Role?',
      text: `Remove ${roleToRemove} from ${user.username}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, remove it',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      const userKey = `${user.id}:${roleToRemove}`;
      this.deletingUserRole[userKey] = true;

      const remainingRoles = (user.roles ?? [])
        .filter(role => role !== roleToRemove)
        .map(role => String(role).toUpperCase());

      this.userRoleService.assignReviewerLevelsByStaffNo(user.username, remainingRoles).subscribe({
        next: (updated) => {
          this.deletingUserRole[userKey] = false;
          Swal.fire('Removed', `${roleToRemove} removed from ${user.username}.`, 'success');
          this.loadAssignedUsers();
        },
        error: (err) => {
          this.deletingUserRole[userKey] = false;
          console.error('Failed to remove role', err);
          Swal.fire('Error', `Failed to remove ${roleToRemove} from ${user.username}.`, 'error');
        }
      });
    });
  }
}


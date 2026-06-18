import { Injectable, ChangeDetectorRef } from '@angular/core';
import { FormGroup, FormArray } from '@angular/forms';
import { JournalService } from './journal-service';
import { LoginService } from './login.service';
import { Department } from '../models/common.model';

/**
 * Shared utility for auto-filling author information from login API
 * Used by Journal, Books, Chapter, and Conference Proceedings detail components
 */
@Injectable({
  providedIn: 'root'
})
export class AuthorLookupService {

  constructor(
    private loginService: LoginService,
    private journalService: JournalService
  ) {}

  /**
   * Perform student/staff info lookup and populate form
   * @param authorIndex Index of author in FormArray
   * @param authorsFA FormArray containing authors
   * @param faculties List of available faculties
   * @param departmentsMap Map of department lists per author
   * @param cdr Change detector for manual updates
   */
  performAuthorLookup(
    authorIndex: number,
    authorsFA: FormArray,
    faculties: any[],
    departmentsMap: { [index: number]: Department[] },
    cdr: ChangeDetectorRef,
    authorLookupLoading: { [index: number]: boolean },
    authorLookupErrors: { [index: number]: string }
  ): void {
    const authorFG = authorsFA.at(authorIndex) as FormGroup;
    const isAffiliated = authorFG.get('affiliation')?.value === true;
    if (!isAffiliated) {
      return;
    }

    const studentEmployeeNo = String(authorFG.get('studentEmployeeNo')?.value ?? '').trim();
    if (!studentEmployeeNo) {
      return;
    }

    authorLookupLoading[authorIndex] = true;
    delete authorLookupErrors[authorIndex];

    this.loginService.getStudentInfo(studentEmployeeNo).subscribe({
      next: (response) => {
        const mapped = this.mapLoginApiToAuthorFields(response);
        if (!mapped) {
          authorLookupErrors[authorIndex] = 'No staff/student details found for this number.';
          authorLookupLoading[authorIndex] = false;
          return;
        }

        const patch: Record<string, any> = {};
        if (mapped.firstName) patch['firstName'] = mapped.firstName;
        if (mapped.surname) patch['surname'] = mapped.surname;
        if (mapped.initials) patch['initials'] = mapped.initials;
        if (mapped.gender) patch['gender'] = mapped.gender;
        if (mapped.email) patch['email'] = mapped.email;
        if (mapped.countryOfBirth) patch['countryOfBirth'] = mapped.countryOfBirth;
        if (mapped.academicTitle) patch['academicTitle'] = mapped.academicTitle;
        if (mapped.employmentStatus) patch['employmentStatus'] = mapped.employmentStatus;
        if (mapped.dobYear !== null) patch['dob'] = mapped.dobYear;

        const facultyId = this.findFacultyId(mapped.facultyName, faculties);
        if (facultyId !== null) {
          patch['facultyId'] = facultyId;
        }

        authorFG.patchValue(patch, { emitEvent: false });

        if (facultyId !== null) {
          this.journalService.getDepartmentsByFaculty(facultyId).subscribe({
            next: (deps) => {
              departmentsMap[authorIndex] = deps ?? [];
              const departmentId = this.findDepartmentId(departmentsMap[authorIndex], mapped.departmentName);
              if (departmentId !== null) {
                authorFG.get('departmentId')?.setValue(departmentId);
              }
              authorLookupLoading[authorIndex] = false;
              cdr.markForCheck();
            },
            error: () => {
              authorLookupLoading[authorIndex] = false;
            }
          });
          return;
        }

        authorLookupLoading[authorIndex] = false;
        cdr.markForCheck();
      },
      error: () => {
        authorLookupErrors[authorIndex] = 'Could not fetch staff/student info. Check the number and try again.';
        authorLookupLoading[authorIndex] = false;
      }
    });
  }

  private mapLoginApiToAuthorFields(response: any): {
    firstName: string | null;
    surname: string | null;
    initials: string | null;
    gender: 'MALE' | 'FEMALE' | null;
    email: string | null;
    dobYear: number | null;
    facultyName: string | null;
    departmentName: string | null;
    countryOfBirth: string | null;
    academicTitle: string | null;
    employmentStatus: string | null;
  } | null {
    const payload = response ?? {};
    const student = payload.student ?? payload.studentInfo ?? payload;
    const staff = payload.staff ?? payload;
    const communication = payload.communication ?? payload.communications ?? payload;

    const firstName = this.firstNonEmpty(student?.firstNames, student?.firstname, staff?.firstNames, staff?.firstname);
    const surname = this.firstNonEmpty(student?.surname, staff?.surname);
    const initials = this.firstNonEmpty(student?.initials, staff?.initials);
    const gender = this.normalizeGender(this.firstNonEmpty(student?.gender, staff?.gender));
    const email = this.extractEmail(communication);
    const dobYear = this.extractYear(this.firstNonEmpty(student?.dateOfBirth, staff?.birthDate));
    const facultyName = this.firstNonEmpty(student?.facultyName, student?.facultyCode, staff?.faculty);
    const departmentName = this.firstNonEmpty(student?.departmentName, student?.departmentCode, staff?.departmentName);
    const countryOfBirth = this.firstNonEmpty(student?.countryName, staff?.countryName);
    const academicTitle = this.normalizeAcademicTitle(this.firstNonEmpty(staff?.title));
    const employmentStatus = this.normalizeEmploymentStatus(
      this.firstNonEmpty(staff?.permanentOrTemp, staff?.postType, student?.studentNumber)
    );

    const hasAnyValue = [
      firstName,
      surname,
      initials,
      gender,
      email,
      dobYear,
      facultyName,
      departmentName,
      countryOfBirth,
      academicTitle,
      employmentStatus
    ].some(v => v !== null && v !== undefined && v !== '');

    if (!hasAnyValue) {
      return null;
    }

    return {
      firstName,
      surname,
      initials,
      gender,
      email,
      dobYear,
      facultyName,
      departmentName,
      countryOfBirth,
      academicTitle,
      employmentStatus
    };
  }

  private firstNonEmpty(...values: any[]): string | null {
    for (const value of values) {
      const normalized = String(value ?? '').trim();
      if (normalized) {
        return normalized;
      }
    }
    return null;
  }

  private normalizeGender(raw: string | null): 'MALE' | 'FEMALE' | null {
    if (!raw) {
      return null;
    }
    const value = raw.toUpperCase();
    if (value.startsWith('M')) {
      return 'MALE';
    }
    if (value.startsWith('F')) {
      return 'FEMALE';
    }
    return null;
  }

  private normalizeAcademicTitle(raw: string | null): string | null {
    if (!raw) {
      return null;
    }
    const value = raw.toUpperCase();
    const allowed = new Set(['MR', 'MS', 'MRS', 'MISS', 'DR', 'PROF', 'ADV', 'REV', 'PASTOR', 'IMAM', 'RABBI', 'OTHER']);
    return allowed.has(value) ? value : null;
  }

  private normalizeEmploymentStatus(raw: string | null): string | null {
    if (!raw) {
      return null;
    }
    const value = raw.toUpperCase();
    if (value.includes('STUDENT')) return 'STUDENT';
    if (value.includes('PERMANENT') || value.includes('FULL')) return 'PERMANENT';
    if (value.includes('TEMP') || value.includes('PART') || value.includes('CONTRACT')) return 'TEMPORARY';
    if (value.includes('RETIRED')) return 'RETIRED';
    return null;
  }

  private extractYear(rawDate: string | null): number | null {
    if (!rawDate) {
      return null;
    }

    const parsed = new Date(rawDate);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.getFullYear();
    }

    const yearMatch = rawDate.match(/\d{4}/);
    return yearMatch ? Number(yearMatch[0]) : null;
  }

  private extractEmail(communication: any): string | null {
    if (!communication) {
      return null;
    }

    if (Array.isArray(communication)) {
      const emailItem = communication.find((item: any) =>
        String(item?.communicationType ?? item?.type ?? '').toUpperCase().includes('EMAIL')
      ) ?? communication[0];
      return this.firstNonEmpty(emailItem?.communicationNumber, emailItem?.email, emailItem?.emailAddress);
    }

    return this.firstNonEmpty(
      communication?.email,
      communication?.emailAddress,
      String(communication?.communicationType ?? '').toUpperCase().includes('EMAIL')
        ? communication?.communicationNumber
        : null
    );
  }

  private findFacultyId(facultyNameOrCode: string | null, faculties: any[]): number | null {
    if (!facultyNameOrCode) {
      return null;
    }

    const target = facultyNameOrCode.trim().toUpperCase();
    const matched = faculties.find(f =>
      String(f.name ?? '').trim().toUpperCase() === target
      || String((f as any).code ?? '').trim().toUpperCase() === target
    );
    return matched?.id ?? null;
  }

  private findDepartmentId(departments: Department[], departmentNameOrCode: string | null): number | null {
    if (!departmentNameOrCode) {
      return null;
    }

    const target = departmentNameOrCode.trim().toUpperCase();
    const matched = (departments ?? []).find(d =>
      String(d.name ?? '').trim().toUpperCase() === target
      || String((d as any).code ?? '').trim().toUpperCase() === target
    );
    return matched?.id ?? null;
  }
}


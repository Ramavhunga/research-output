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
    cdr: ChangeDetectorRef | null | undefined,
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
              cdr?.markForCheck();
            },
            error: () => {
              authorLookupLoading[authorIndex] = false;
            }
          });
          return;
        }

        authorLookupLoading[authorIndex] = false;
        cdr?.markForCheck();
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
    const user = payload.user ?? {};
    const student = payload.student ?? payload.studentInfo ?? null;
    const staff = payload.staff ?? null;
    const communication = payload.communication ?? payload.communications ?? null;
    const hasStudent = !!student;

    const firstName = this.firstNonEmpty(student?.firstNames, student?.firstname, staff?.firstname, staff?.firstNames);
    const surname = this.firstNonEmpty(student?.surname, staff?.surname);
    const initials = this.firstNonEmpty(student?.initials, staff?.initials);
    const gender = this.normalizeGender(this.firstNonEmpty(student?.gender, staff?.gender));
    const email = this.extractEmail(communication) ?? (this.isLikelyEmail(user?.username) ? String(user.username).trim() : null);
    const dobYear = this.extractYear(this.firstNonEmpty(student?.dateOfBirth, staff?.birthDate));
    const facultyName = this.firstNonEmpty(student?.facultyName, staff?.faculty, staff?.facultyName);
    const departmentName = this.firstNonEmpty(student?.departmentName, staff?.departmentName);
    const countryOfBirth = this.normalizeCountryName(this.firstNonEmpty(student?.countryName, staff?.countryName));
    const academicTitle = this.normalizeAcademicTitle(
      this.firstNonEmpty(hasStudent ? 'STUDENT' : null, staff?.rankName, staff?.postName, staff?.title)
    );
    const employmentStatus = this.normalizeEmploymentStatus(
      this.firstNonEmpty(hasStudent ? 'STUDENT' : null, staff?.permanentOrTemp, staff?.postType, staff?.postName)
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

    const value = raw.toUpperCase().replace(/[_-]/g, ' ').trim();
    if (value.includes('ASSOCIATE') && value.includes('PROF')) return 'ASSOCIATE_PROFESSOR';
    if (value.includes('SENIOR') && value.includes('LECTURER')) return 'SENIOR_LECTURER';
    if (value.includes('JUNIOR') && value.includes('LECTURER')) return 'JUNIOR_LECTURER';
    if (value.includes('LECTURER')) return 'LECTURER';
    if (value.includes('POSTDOC')) return 'POSTDOC';
    if (value.includes('RESEARCH') && value.includes('FELLOW')) return 'RESEARCH_FELLOW';
    if (value.includes('PROF')) return 'PROFESSOR';
    if (value.includes('STUDENT')) return 'STUDENT';
    return 'OTHER';
  }

  private normalizeEmploymentStatus(raw: string | null): string | null {
    if (!raw) {
      return null;
    }
    const value = raw.toUpperCase();
    if (value.includes('STUDENT')) return 'STUDENT';
    if (value.includes('TEMP') || value.includes('PART') || value.includes('CONTRACT')) return 'CONTRACT_TEMPORARY';
    if (value.includes('VISITING')) return 'VISITING_SCHOLAR';
    if (value.includes('RETIRED')) return 'RETIRED';
    if (value.includes('PERMANENT') || value.includes('FULL') || value.includes('ADM') || value.includes('ACA')) return 'PERMANENT';
    return 'OTHER';
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
        this.isLikelyEmail(item?.communicationNumber)
        || ['EMAIL', 'ET', 'CE'].includes(String(item?.communicationType ?? item?.type ?? '').toUpperCase())
      ) ?? communication[0];

      const candidate = this.firstNonEmpty(emailItem?.communicationNumber, emailItem?.email, emailItem?.emailAddress);
      return this.isLikelyEmail(candidate) ? candidate : null;
    }

    const byField = this.firstNonEmpty(communication?.email, communication?.emailAddress);
    if (this.isLikelyEmail(byField)) {
      return byField;
    }

    const communicationNumber = this.firstNonEmpty(communication?.communicationNumber);
    const communicationType = String(communication?.communicationType ?? '').toUpperCase();
    if (this.isLikelyEmail(communicationNumber) || ['EMAIL', 'ET', 'CE'].includes(communicationType)) {
      return communicationNumber;
    }

    return null;
  }

  private isLikelyEmail(value: unknown): boolean {
    const text = String(value ?? '').trim();
    return !!text && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
  }

  private normalizeCountryName(value: string | null): string | null {
    if (!value) {
      return null;
    }

    const normalized = value.trim().toUpperCase();
    if (normalized === 'R.S.A' || normalized === 'RSA') {
      return 'South Africa';
    }

    return value.trim();
  }

  private normalizeLookupText(value: unknown): string {
    return String(value ?? '')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private findFacultyId(facultyNameOrCode: string | null, faculties: any[]): number | null {
    if (!facultyNameOrCode) {
      return null;
    }

    const target = this.normalizeLookupText(facultyNameOrCode);
    const matched = faculties.find(f => {
      const name = this.normalizeLookupText(f?.name);
      const code = this.normalizeLookupText((f as any)?.code);
      return name === target
        || code === target
        || (name && (name.includes(target) || target.includes(name)))
        || (code && (code.includes(target) || target.includes(code)));
    });
    return matched?.id ?? null;
  }

  private findDepartmentId(departments: Department[], departmentNameOrCode: string | null): number | null {
    if (!departmentNameOrCode) {
      return null;
    }

    const target = this.normalizeLookupText(departmentNameOrCode);
    const matched = (departments ?? []).find(d => {
      const name = this.normalizeLookupText(d?.name);
      const code = this.normalizeLookupText((d as any)?.code);
      return name === target
        || code === target
        || (name && (name.includes(target) || target.includes(name)))
        || (code && (code.includes(target) || target.includes(code)));
    });
    return matched?.id ?? null;
  }
}

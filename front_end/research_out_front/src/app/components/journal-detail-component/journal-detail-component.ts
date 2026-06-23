import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

import { Journal } from '../../models/journal.model';
import {
  Authors,
  ClaimingAuthorsContribution, Department, Faculty,
  Units, Attachment
} from '../../models/common.model';
import {JournalService} from '../../services/journal-service';
import {JournalPermissionService} from '../../services/journal-permission.service';
import {debounceTime, distinctUntilChanged, switchMap, Subscription, of, map} from 'rxjs';
import {CountriesService} from '../../services/countries.service';
import Swal from 'sweetalert2';
import {ResearchfieldService} from '../../services/researchfield.service';
import {Publisher, PublisherService} from '../../services/publisher.service';
import {LoginService} from '../../services/login.service';
import {StudentSearchModalComponent} from '../student-search-modal/student-search-modal.component';
import {StudentSearchResult} from '../../services/student-search.service';
import {AuthorLookupService} from '../../services/author-lookup.service';
import {
  AUTHOR_ACADEMIC_TITLE_OPTIONS,
  AUTHOR_EMPLOYMENT_STATUS_OPTIONS,
  AUTHOR_GENDER_OPTIONS,
  AUTHOR_HIGHEST_QUALIFICATION_OPTIONS,
  AUTHOR_POPULATION_GROUP_OPTIONS,
  AUTHOR_SA_RESIDENCY_OPTIONS,
  ISO_3166_COUNTRY_OPTIONS,
  SA_HEI_OPTIONS
} from '../../constants/author-form-options';


// const DOI_REGEX = /^10\.\d{4,9}\/[\-._;()/:A-Z0-9]+$/i;
// const ISSN_REGEX = /^\d{4}-\d{3}[\dX]$/i;

@Component({
  selector: 'app-journal-detail-component',
  templateUrl: './journal-detail-component.html',
  styleUrls: ['./journal-detail-component.css'],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, StudentSearchModalComponent]
})
export class JournalDetailComponent implements OnInit {
  isReadOnlyView = false;
  isApproverDecisionMode = false;
  showPreview = false;
  previewJson = '';
  form: FormGroup;
  faculties: Faculty[] = [];
  fieldofsearch: string[] = ["Agricultural Sciences", "Biological Sciences", "Chemical Sciences", "Computer and Information Sciences", "Sciences"];
  departmentsMap: { [index: number]: Department[] } = {};
  loadingFaculties = false;
  countryOptionsMap: { [index: number]: string[] } = {};
  countrySubs: { [index: number]: Subscription } = {};
  authorLookupLoading: { [index: number]: boolean } = {};
  authorLookupErrors: { [index: number]: string } = {};
  universitySearchTerms: { [rowKey: string]: string } = {};
  universityDropdownOpen: { [rowKey: string]: boolean } = {};

  researchFields: any[] = [];
  filteredResearchFields: any[] = []
  showResearchFieldDropdown = false;
  publishers: Publisher[] = [];
  attachments: Attachment[] = [];
  fileErrors: string[] = [];
  newAttachmentDescription: string = '';
  fileError: string = '';
  selectedFile: File | null = null;
  currentStep = 1;
  totalSteps = 4;
  isSaving = false;
  saveMessage: string = '';
  showSaveMessage = false;
  lastSavedJournalId: number | null = null;
  steps = [
    { id: 1, label: 'Journal Information', name: 'journalinfo' },
    { id: 2, label: 'Affiliated Authors', name: 'affiliated' },
    { id: 3, label: 'Non-Affiliated Authors', name: 'nonaffiliated' },
    { id: 4, label: 'Results & Submissions', name: 'results' }
  ];

  // Unit calculation tracking
  unitBreakdown: {
    totalAuthorsCount: number;
    affiliatedAuthorsCount: number;
    nonAffiliatedAuthorsCount: number;
    authorSharePerAuthor: number;
    univenTotalClaimed: number;
    authorUnitCalculations: {
      authorIndex: number;
      authorName: string;
      isAffiliated: boolean;
      authorShare: number;
      universityCount: number;
      researchAffiliationsCount: number;
      splitDetails: {
        label: string;
        type: string;
        units: number;
        claimedByUniven: boolean;
      }[];
      ruleApplied: string;
      univenClaim: number;
    }[];
  } = {
    totalAuthorsCount: 0,
    affiliatedAuthorsCount: 0,
    nonAffiliatedAuthorsCount: 0,
    authorSharePerAuthor: 0,
    univenTotalClaimed: 0,
    authorUnitCalculations: []
  };

  readonly otherUniversityCode = 'OTHER';
  readonly saUniversityOptions = SA_HEI_OPTIONS;
  readonly genderOptions = AUTHOR_GENDER_OPTIONS;
  readonly populationGroupOptions = AUTHOR_POPULATION_GROUP_OPTIONS;
  readonly saResidencyOptions = AUTHOR_SA_RESIDENCY_OPTIONS;
  readonly employmentStatusOptions = AUTHOR_EMPLOYMENT_STATUS_OPTIONS;
  readonly academicTitleOptions = AUTHOR_ACADEMIC_TITLE_OPTIONS;
  readonly highestQualificationOptions = AUTHOR_HIGHEST_QUALIFICATION_OPTIONS;
  readonly countryOptions = ISO_3166_COUNTRY_OPTIONS;

  constructor(private fb: FormBuilder,
              private router: Router,
              private journalService: JournalService,
              private permissionService: JournalPermissionService,
              private countryService: CountriesService,
              private researchFieldService: ResearchfieldService,
              private publisherService: PublisherService,
              private loginService: LoginService,
              private authorLookupService: AuthorLookupService,
              private cdr: ChangeDetectorRef ) {


    this.researchFieldService.getAll().subscribe(data => {
      this.researchFields = data;
      this.filteredResearchFields = data;
    });
    this.publisherService.getAll().subscribe({
      next: (data) => {
        this.publishers = data;
      },
      error: (err) => {
        console.error('Failed to load publishers', err);
      }
    });

    this.loadFaculties(); // ✅ add this
    const navigationState = this.router.getCurrentNavigation()?.extras.state ?? history.state ?? {};
    const journal = navigationState['journal'] as Journal | undefined;
    this.isReadOnlyView = !!navigationState['reviewMode'];
    debugger;
    this.form = this.fb.group({
      id: [journal?.id ?? null],
      attachments: journal?.attachments,
    // for async validation result
      /** Core DHET */
      dhetNo: [
        {value: journal?.dhetNo ?? 'J0001', disabled: true},
        [Validators.required, Validators.pattern(/^J\d+/)]
      ],

      year: [journal?.year ?? '', Validators.required],
      journalTitle: [journal?.journalTitle ?? '', Validators.required],
      title: [journal?.title ?? '', Validators.required],
      issn: [
        journal?.issn ?? '',
        [Validators.required, Validators.pattern(/^\d{4}-?\d{3}[\dX]$/i)]
      ],
      publisher: [journal?.publisher ?? '', Validators.required],
      index: [journal?.index ?? '', Validators.required],
      comply: [this.normalizeCompliance(journal?.comply), Validators.required],

      /** Publication */
      volume: [journal?.volume ?? null],
      issue: [journal?.issue ?? null],



      eissn: [journal?.eissn ?? null],

      doi: [
        journal?.doi ?? null,
        this.patternOptional(/^10\.\d{4,9}\/[-._;()/:A-Z0-9]+$/i)
      ],

      urls: [journal?.urls ?? null],

      openaccess: [journal?.openaccess ?? null],

      /** Research */
      fieldofsearch: [journal?.fieldofsearch ?? '', Validators.required],

      /** Fees */
      publicationfeedescription: [journal?.publicationfeedescription ?? null],
      publishercurrency: [journal?.publishercurrency ?? null],
      totalPublicationFeePublisherCurrency: [journal?.totalPublicationFeePublisherCurrency ?? null],
      publicationfeearticle: [journal?.publicationfeearticle ?? null],
      authorsContributionFee: [journal?.authorsContributionFee ?? null],
      authorsContributionFeeZar: [journal?.authorsContributionFeeZar ?? null],

      funders: [journal?.funders ?? ''],

      /** Units (FIXED STRUCTURE) */
      units: this.fb.group({
        maxUnitsForPublication: [journal?.units?.maxUnitsForPublication ?? 1],
        totalProportionOfAuthors: [journal?.units?.totalProportionOfAuthors ?? 1],
        authorCount: [journal?.units?.authorsCount ?? 1],
        totalUnitsClaimed: [journal?.units?.totalUnitsClaimed ?? null],
        otherAuthorsNonAffiliates: [journal?.units?.otherAuthorsNonAffiliates ?? null],
      }),

      /** Authors */
      authors: this.fb.array(
        journal?.authors?.length
          ? journal.authors.map(a => this.newAuthor(a))
          : [this.newAuthor()]
      ),

      otherAuthorsNonAffiliated: [
        journal?.otherAuthorsNonAffiliated?.join('; ') ?? ''
      ],

      /** Contribution */
      claimingAuthorsContribution: this.fb.group({
        proportionOfAuthors: [journal?.claimingAuthorsContribution?.proportionOfAuthors ?? null],
        authorUnitsClaimed: [journal?.claimingAuthorsContribution?.authorUnitsClaimed ?? null],
        additionalComments: [journal?.claimingAuthorsContribution?.additionalComments ?? '']
      }),

      additionalComments: [journal?.additionalComments ?? '']

    }, {
      asyncValidators: this.isReadOnlyView ? [] : [this.checkTitleIssnUnique(this.journalService)],
      updateOn: 'blur' // ✅ VERY IMPORTANT
    });

    this.setupFieldSearch();
    this.setupAutoCalc();
    this.normalizeAllUniversityAffiliations();

    this.authorsFA.controls.forEach((_, i) => this.onCountrySearch(i));
  }

  isAuthorLookupLoading(index: number): boolean {
    return this.authorLookupLoading[index] === true;
  }

  onStudentEmployeeNoBlur(authorIndex: number): void {
    const authorFG = this.authorsFA.at(authorIndex) as FormGroup;
    const isAffiliated = authorFG.get('affiliation')?.value === true;
    if (!isAffiliated) {
      return;
    }

    const studentEmployeeNo = String(authorFG.get('studentEmployeeNo')?.value ?? '').trim();
    if (!studentEmployeeNo) {
      return;
    }

    this.authorLookupLoading[authorIndex] = true;
    delete this.authorLookupErrors[authorIndex];

    this.loginService.getStudentInfo(studentEmployeeNo).subscribe({
      next: (response) => {
        debugger
        const mapped = this.mapLoginApiToAuthorFields(response);
        if (!mapped) {
          this.authorLookupErrors[authorIndex] = 'No staff/student details found for this number.';
          this.authorLookupLoading[authorIndex] = false;
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

        const facultyId = this.findFacultyId(mapped.facultyName);
        if (facultyId !== null) {
          patch['facultyId'] = facultyId;
        }

        authorFG.patchValue(patch, { emitEvent: false });

        if (facultyId !== null) {
          this.journalService.getDepartmentsByFaculty(facultyId).subscribe({
            next: (deps) => {
              this.departmentsMap[authorIndex] = deps ?? [];
              const departmentId = this.findDepartmentId(this.departmentsMap[authorIndex], mapped.departmentName);
              if (departmentId !== null) {
                authorFG.get('departmentId')?.setValue(departmentId);
              }
              this.authorLookupLoading[authorIndex] = false;
              this.cdr.markForCheck();
            },
            error: () => {
              this.authorLookupLoading[authorIndex] = false;
            }
          });
          return;
        }

        this.authorLookupLoading[authorIndex] = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.authorLookupErrors[authorIndex] = 'Could not fetch staff/student info. Check the number and try again.';
        this.authorLookupLoading[authorIndex] = false;
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

  private findFacultyId(facultyNameOrCode: string | null): number | null {
    if (!facultyNameOrCode) {
      return null;
    }

    const target = this.normalizeLookupText(facultyNameOrCode);
    const matched = this.faculties.find(f => {
      const name = this.normalizeLookupText(f.name);
      const code = this.normalizeLookupText((f as any).code);
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
      const name = this.normalizeLookupText(d.name);
      const code = this.normalizeLookupText((d as any).code);
      return name === target
        || code === target
        || (name && (name.includes(target) || target.includes(name)))
        || (code && (code.includes(target) || target.includes(code)));
    });
    return matched?.id ?? null;
  }

  ngOnInit() {
    // Load previously saved journal if available
    this.loadSavedJournal();

    // Check if a student was selected from search modal
    this.checkForSelectedStudent();

    // Get the current journal from router state
    const navigationState = this.router.getCurrentNavigation()?.extras.state ?? history.state ?? {};
    const journal = navigationState['journal'] as Journal | undefined;
    const reviewMode = !!navigationState['reviewMode'];

    // If not in review mode, check edit permissions
    if (!reviewMode && journal) {
      const permission = this.permissionService.canEditJournal(journal);
      if (!permission.canEdit) {
        // User doesn't have permission to edit - force read-only mode
        this.isReadOnlyView = true;
        Swal.fire({
          title: 'Read-Only Mode',
          text: permission.reason,
          icon: 'info'
        });
      }
    }

    const currentRoles = this.getCurrentRoles();
    const currentStatus = String(journal?.status ?? this.form.get('status')?.value ?? '').toUpperCase();
    this.isApproverDecisionMode = !this.isReadOnlyView
      && !reviewMode
      && this.isApproverRole(currentRoles)
      && this.canCurrentApproverDecideOnStatus(currentRoles, currentStatus);

    if (this.isReadOnlyView) {
      this.clearAllValidators(this.form);
      this.form.disable({ emitEvent: false });
    }
  }

  private checkForSelectedStudent(): void {
    try {
      const selectedStudentJson = sessionStorage.getItem('selectedStudent');
      if (selectedStudentJson) {
        const student: StudentSearchResult = JSON.parse(selectedStudentJson);
        // Clear it so it's only used once
        sessionStorage.removeItem('selectedStudent');

        // Find the first affiliated author row (usually the one being edited)
        const authorsFA = this.authorsFA;
        if (authorsFA.length > 0) {
          // Populate the first author's field with student number
          const firstAuthorFG = authorsFA.at(0) as FormGroup;
          firstAuthorFG.patchValue({ studentEmployeeNo: student.staffNo || student.studentNo });
          // Trigger the lookup
          setTimeout(() => {
            this.onStudentEmployeeNoBlur(0);
          }, 100);
        }
      }
    } catch (error) {
      console.error('Error processing selected student:', error);
    }
  }

  private clearAllValidators(control: AbstractControl): void {
    control.clearValidators();
    control.clearAsyncValidators();
    control.updateValueAndValidity({ emitEvent: false });

    if (control instanceof FormGroup) {
      Object.values(control.controls).forEach(child => this.clearAllValidators(child));
      return;
    }

    if (control instanceof FormArray) {
      control.controls.forEach(child => this.clearAllValidators(child));
    }
  }

  private getCurrentUsername(): string {
    const loginRaw = sessionStorage.getItem('login');
    if (!loginRaw) {
      return '';
    }

    try {
      const loginData = JSON.parse(loginRaw);
      return (loginData?.user?.username ?? loginData?.username ?? '').toString().trim();
    } catch {
      return '';
    }
  }

  private getCurrentRoles(): string[] {
    const loginRaw = sessionStorage.getItem('login');
    if (!loginRaw) {
      return [];
    }

    try {
      const loginData = JSON.parse(loginRaw);
      const roleSource = loginData?.user?.roles ?? loginData?.user?.userType ?? loginData?.userType ?? '';
      if (Array.isArray(roleSource)) {
        return roleSource.map((r: any) => String(r).toUpperCase().trim()).filter(Boolean);
      }
      return String(roleSource)
        .split(',')
        .map((r: string) => r.toUpperCase().trim())
        .filter(Boolean);
    } catch {
      return [];
    }
  }

  private isApproverRole(roles: string[]): boolean {
    return roles.includes('ADMIN')
      || roles.includes('ADMINISTRATOR')
      || roles.includes('REVIEWER_LEVEL_1')
      || roles.includes('LEVEL_1_APPROVER')
      || roles.includes('REVIEWER_LEVEL_2')
      || roles.includes('LEVEL_2_APPROVER');
  }

  private canCurrentApproverDecideOnStatus(roles: string[], status: string): boolean {
    if (!status) {
      return false;
    }

    if (roles.includes('ADMIN') || roles.includes('ADMINISTRATOR')) {
      return status !== 'READY_FOR_POSTING' && status !== 'POSTED_TO_DHET';
    }

    const isL1 = roles.includes('REVIEWER_LEVEL_1') || roles.includes('LEVEL_1_APPROVER');
    const isL2 = roles.includes('REVIEWER_LEVEL_2') || roles.includes('LEVEL_2_APPROVER');

    const l1Stage = status === 'SUBMITTED' || status === 'UNDER_REVIEW_L1';
    const l2Stage = status === 'UNDER_REVIEW_L2';

    return (isL1 && l1Stage) || (isL2 && l2Stage);
  }

  canShowApproverDecisionActions(): boolean {
    return this.isApproverDecisionMode && !this.isReadOnlyView;
  }

  checkTitleIssnUnique(journalService: JournalService) {
    return (group: AbstractControl) => {
      if (this.isReadOnlyView) {
        return of(null);
      }

      const title = group.get('title')?.value;
      const issn = group.get('issn')?.value;
      const currentIdRaw = group.get('id')?.value;
      const currentId = currentIdRaw === null || currentIdRaw === undefined || currentIdRaw === ''
        ? undefined
        : Number(currentIdRaw);

      if (!title || !issn) return of(null);

      return journalService.exists(title, issn, Number.isFinite(currentId as number) ? currentId : undefined).pipe(
        debounceTime(300),
        map((exists: boolean) => {
          debugger;
          return exists ? { duplicateJournal: true } : null;
        })
      );
    };
  }


  setupFieldSearch() {
    this.form.get('fieldofsearch')?.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(value =>
        this.researchFieldService.search(value || '')
      )
    ).subscribe(results => {
      debugger
      this.filteredResearchFields = results;
      // Show dropdown only if there are results and dropdown is open
      if (this.showResearchFieldDropdown && results.length === 0) {
        this.showResearchFieldDropdown = false;
      }
    });
  }

  /**
   * Open research field dropdown when input is focused
   */
  openResearchFieldDropdown() {
    this.showResearchFieldDropdown = true;
  }

  /**
   * Close research field dropdown when input loses focus
   */
  closeResearchFieldDropdown() {
    // Add a small delay to allow clicks on dropdown items to register
    setTimeout(() => {
      this.showResearchFieldDropdown = false;
      this.filteredResearchFields = [];
    }, 200);
  }

  loadFaculties() {
    this.loadingFaculties = true;
    this.journalService.getFaculties().subscribe({
      next: (data) => {
        debugger;
        this.faculties = data ?? [];
        this.loadingFaculties = false;
      },
      error: (err) => {

        console.error('Failed to load faculties', err);
        this.loadingFaculties = false;
      }
    });
  }

  // === Getters ===
  get authorsFA(): FormArray {
    return this.form.get('authors') as FormArray;
  }

  get unitsFG(): FormGroup {
    return this.form.get('units') as FormGroup;
  }


  get claimingAuthorsContributionFG(): FormGroup {
    return this.form.get('claimingAuthorsContribution') as FormGroup;
  }

  /**
   * Normalize boolean-like values that may arrive from API as string/number.
   */
  private asBoolean(value: unknown, fallback = false): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized === 'true') return true;
      if (normalized === 'false') return false;
    }
    if (typeof value === 'number') return value === 1;
    return fallback;
  }

  private normalizeCompliance(value: unknown): 'N/A' | 'Yes' | 'No' {
    const normalized = String(value ?? '').trim().toLowerCase();
    if (normalized === 'yes' || normalized === 'true' || normalized === '1') return 'Yes';
    if (normalized === 'no' || normalized === 'false' || normalized === '0') return 'No';
    return 'N/A';
  }

  /**
   * Extract numeric id from either a raw id value or an object like { id, ... }.
   */
  private asId(value: unknown): number | null {
    if (value === null || value === undefined || value === '') return null;

    if (typeof value === 'object' && value !== null && 'id' in (value as Record<string, unknown>)) {
      return this.asId((value as Record<string, unknown>)['id']);
    }

    const id = Number(value);
    return Number.isFinite(id) ? id : null;
  }

  /**
   * Ensure departments are available for pre-loaded affiliated authors.
   */
  private preloadAuthorDepartments() {
    this.authorsFA.controls.forEach((ctrl, index) => {
      const authorFG = ctrl as FormGroup;
      const facultyId = this.asId(authorFG.get('facultyId')?.value);
      if (!facultyId) return;

      this.journalService.getDepartmentsByFaculty(facultyId).subscribe({
        next: (deps) => {
          this.departmentsMap[index] = deps ?? [];
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Failed to preload departments', err);
        }
      });
    });
  }

  /**
   * Normalize attachment objects from API so UI binding is stable on reload/return.
   */
  private normalizeAttachments(rawAttachments: unknown): Attachment[] {
    let list: unknown[] = [];

    if (Array.isArray(rawAttachments)) {
      list = rawAttachments;
    } else if (typeof rawAttachments === 'string') {
      try {
        const parsed = JSON.parse(rawAttachments);
        list = Array.isArray(parsed) ? parsed : [];
      } catch {
        list = [];
      }
    }

    return list
      .map((item: any) => {
        const fileName = item?.fileName ?? item?.filename ?? item?.name ?? '';
        const fileType = item?.fileType ?? item?.filetype ?? item?.mimeType ?? item?.contentType ?? 'application/pdf';
        const fileSize = Number(item?.fileSize ?? item?.filesize ?? item?.size ?? 0) || 0;

        return {
          id: item?.id ?? null,
          formguid: item?.formguid ?? item?.formGuid ?? undefined,
          fileName,
          fileType,
          fileSize,
          fileData: item?.fileData ?? item?.data ?? item?.base64 ?? undefined,
          filePath: item?.filePath ?? item?.filepath ?? null,
          url: item?.url ?? item?.fileUrl ?? item?.downloadUrl ?? undefined,
          description: item?.description ?? item?.desc ?? ''
        } as Attachment;
      })
      .filter(att => !!att.fileName);
  }

  // === Builders ===
  newAuthor(a?: Authors, affiliation: boolean = true): FormGroup {

    // Prioritize author's actual affiliation flag if available, otherwise use parameter
    const resolvedAffiliation = this.asBoolean(a?.affiliation, affiliation);
    const resolvedFacultyId = this.asId((a as any)?.facultyId ?? a?.faculty);
    const resolvedDepartmentId = this.asId((a as any)?.departmentId ?? a?.department);

    // Build university affiliations FormArray
    const univArray = this.fb.array(
      a?.universityAffiliations?.length
        ? a.universityAffiliations.map(u => this.fb.group({
          universityCode: [u.universityCode || '', Validators.required],
          universityName: [u.universityName || '', Validators.required],
          isUniven: [u.isUniven ?? false],
          isInternationalUniversity: [u.isInternationalUniversity ?? false] // ✅ added
        }))
        : []
    );

    // Build research affiliations FormArray
    const researchArray = this.fb.array(
      a?.researchAffiliations?.length
        ? a.researchAffiliations.map(r => this.fb.group({
          companyName: [r.companyName || '', Validators.required],
          companyType: [r.companyType || 'OTHER', Validators.required]
        }))
        : []
    );

    const fg = this.fb.group({

      id: [a?.id ?? null],
      affiliation: resolvedAffiliation,

      // ✅ CORE FIELDS (always required)
      firstName: [a?.firstName || '', Validators.required],
      surname: [a?.surname || '', Validators.required],
      initials: [a?.initials || ''],
      email: [a?.email || '', [Validators.required, Validators.email]],

      // ✅ AFFILIATED-ONLY REQUIRED FIELDS (will be toggled by updateAffiliatedValidators)
      studentEmployeeNo: [a?.studentEmployeeNo || null],
      gender: [a?.gender ?? null],
      facultyId: [resolvedFacultyId],

      // ✅ OPTIONAL FIELDS
      populationGroup: [a?.populationGroup || null],
      dob: [a?.dob || null],
      dobMonth: [''],
      dobDay: [''],
      departmentId: [resolvedDepartmentId],
      countryOfBirth: [a?.countryOfBirth || null],
      saResidencyStatus: [a?.saResidencyStatus || null],
      disability: [a?.disability ?? false],
      highestQualification: [a?.highestQualification || null],
      employmentStatus: [a?.employmentStatus || null],
      academicTitle: [a?.academicTitle || null],

      orcid: [
        a?.orcid || '',
        [this.patternOptional(/^\d{4}-\d{4}-\d{4}-[\dX]{4}$/i)]
      ],

      // ✅ Unit calculation fields
      authorShare: [a?.authorShare ?? 0],
      totalUnitsClaimed: [a?.totalUnitsClaimed ?? 0],

      // ✅ Additional comments (for affiliated authors)
      additionalComments: [a?.additionalComments || ''],

      // ✅ Affiliations
      universityAffiliations: univArray,
      researchAffiliations: researchArray

    });

    // Set validators based on affiliation status
    this.updateAffiliatedValidators(fg, resolvedAffiliation);

    return fg;
  }

  /**
   * Update validators for author fields based on affiliation status
   * Affiliated authors must provide: studentEmployeeNo, gender, facultyId
   * Non-affiliated need only: firstName, surname, email
   */
  updateAffiliatedValidators(authorFG: FormGroup, isAffiliated: boolean) {
    const requiredFieldsForAffiliated = ['studentEmployeeNo', 'gender', 'facultyId'];

    requiredFieldsForAffiliated.forEach(field => {
      const ctrl = authorFG.get(field);
      if (ctrl) {
        if (isAffiliated) {
          ctrl.setValidators([Validators.required]);
        } else {
          ctrl.setValidators([]);
          ctrl.setValue(null);
        }
        ctrl.updateValueAndValidity({ emitEvent: false });
      }
    });
  }



  // === Utils ===
  patternOptional(rx: RegExp) {
    return (control: FormControl) => {
      const val = (control.value || '').trim();
      return !val || rx.test(val) ? null : {pattern: true};
    };
  }

  getDaysArray(): string[] {
    const days: string[] = [];
    for (let i = 1; i <= 31; i++) {
      days.push(i.toString().padStart(2, '0'));
    }
    return days;
  }

  addAuthor(affiliation: boolean = true) {
    const newAuthorFG = this.newAuthor(undefined, affiliation);
    this.authorsFA.push(newAuthorFG);
    const i = this.authorsFA.length - 1;
    this.onCountrySearch(i);
    this.recalculateContributions();
    this.calculateAdvancedUnitBreakdown();
  }

  removeAuthor(i: number) {
    this.authorsFA.removeAt(i);
    this.recalculateContributions();
    this.calculateAdvancedUnitBreakdown();
  }

  // === Auto-calculation logic ===
  setupAutoCalc() {

    this.authorsFA.valueChanges.subscribe(() => {
      this.recalculateContributions();
      this.calculateAdvancedUnitBreakdown();
      this.cdr.markForCheck();
    });

    this.unitsFG?.valueChanges.subscribe(() => {
      this.recalculateContributions();
      this.calculateAdvancedUnitBreakdown();
      this.cdr.markForCheck();
    });

    this.recalculateContributions();
    this.calculateAdvancedUnitBreakdown();
    // ✅ Initial change detection
    this.cdr.markForCheck();
  }

  recalculateContributions() {
    debugger;

    const unitsFG = this.unitsFG;
    if (!unitsFG) return;

    const maxUnits = unitsFG.get('maxUnitsForPublication')?.value || 0;

    // ✅ Separate affiliated vs non-affiliated
    const affiliatedAuthors = this.authorsFA.controls.filter(ctrl =>
      (ctrl as FormGroup).get('affiliation')?.value === true
    );

    const nonAffiliatedAuthors = this.authorsFA.controls.filter(ctrl =>
      (ctrl as FormGroup).get('affiliation')?.value !== true
    );

    const totalAuthorsCount = this.authorsFA.length;
    const divisor = totalAuthorsCount > 0 ? totalAuthorsCount : 1;
    debugger;
    const otherAuthorsNonAffiliated = nonAffiliatedAuthors.length;

    // ✅ store both counts
    unitsFG.get('authorCount')?.setValue(totalAuthorsCount, { emitEvent: false });
    unitsFG.get('otherAuthorsNonAffiliates')?.setValue(otherAuthorsNonAffiliated, { emitEvent: false });

    const totalPropCtrl = unitsFG.get('totalProportionOfAuthors');
    const totalProp = totalPropCtrl?.value || 1;

    const totalUnits = maxUnits * totalProp;
    unitsFG.get('totalUnitsClaimed')?.setValue(totalUnits, { emitEvent: false });

    const proportion = totalAuthorsCount > 0 ? (1 / divisor) : 0;

    // ✅ assign values
    this.authorsFA.controls.forEach(ctrl => {
      const fg = ctrl as FormGroup;
      const isAffiliated = fg.get('affiliation')?.value === true;

      if (isAffiliated) {
        fg.get('proportionOfAuthors')?.setValue(proportion, { emitEvent: false });
        fg.get('authorUnitsClaimed')?.setValue(maxUnits * proportion, { emitEvent: false });
      } else {
        // 🚫 Non-affiliated → NO calculation
        fg.get('proportionOfAuthors')?.setValue(null, { emitEvent: false });
        fg.get('authorUnitsClaimed')?.setValue(null, { emitEvent: false });
      }
    });

    // ✅ Claiming author (still based on affiliated count)
    this.claimingAuthorsContributionFG.get('proportionOfAuthors')
      ?.setValue(proportion, { emitEvent: false });

    this.claimingAuthorsContributionFG.get('authorUnitsClaimed')
      ?.setValue(maxUnits * proportion, { emitEvent: false });
  }

  // === Advanced Unit Calculation ===
  /**
   * Calculate units per author based on affiliations
   * Rules:
   * 1. Total units divided equally among ALL authors
   * 2. If author has multiple universities, split their share equally
   * 3. UNIVEN only gets its own split portion among universities
   * 4. Non-affiliated authors do not contribute to UNIVEN claim
   */
  calculateAdvancedUnitBreakdown() {

    const maxUnits = this.unitsFG?.get('maxUnitsForPublication')?.value || 0;
    const totalProp = this.unitsFG?.get('totalProportionOfAuthors')?.value || 1;
    const totalUnits = maxUnits * totalProp;

    const allAuthorsCtrl = this.authorsFA.controls;

    const affiliatedAuthorsCtrl = allAuthorsCtrl.filter(ctrl =>
      (ctrl as FormGroup).get('affiliation')?.value === true
    );

    const nonAffiliatedAuthorsCtrl = allAuthorsCtrl.filter(ctrl =>
      (ctrl as FormGroup).get('affiliation')?.value !== true
    );

    const totalAuthorsCount = allAuthorsCtrl.length;
    const authorShare = totalAuthorsCount > 0 ? (totalUnits / totalAuthorsCount) : 0;

    this.unitBreakdown = {
      totalAuthorsCount,
      affiliatedAuthorsCount: affiliatedAuthorsCtrl.length,
      nonAffiliatedAuthorsCount: nonAffiliatedAuthorsCtrl.length,
      authorSharePerAuthor: authorShare,
      univenTotalClaimed: 0,
      authorUnitCalculations: []
    };

    allAuthorsCtrl.forEach((ctrl, idx) => {

      const fg = ctrl as FormGroup;

      const firstName = fg.get('firstName')?.value || '';
      const surname = fg.get('surname')?.value || '';
      const authorName = `${firstName} ${surname}`.trim() || `Author ${idx + 1}`;

      const isAffiliated = fg.get('affiliation')?.value === true;

      let univAffiliations = (fg.get('universityAffiliations') as FormArray)?.getRawValue() || [];
      const researchAffiliations = (fg.get('researchAffiliations') as FormArray)?.getRawValue() || [];

      let univenClaim = 0;
      let ruleApplied = '';

      const splitDetails: {
        label: string;
        type: string;
        units: number;
        claimedByUniven: boolean;
      }[] = [];

      // ✅ Ensure UNIVEN exists by default for affiliated authors
      if (isAffiliated) {
        const hasUniven = univAffiliations.some((u: any) => u.isUniven === true);
        if (!hasUniven) {
          univAffiliations = [
            {
              universityName: 'UNIVEN',
              universityCode: 'UNIVEN',
              isUniven: true,
              isInternationalUniversity: false
            },
            ...univAffiliations
          ];
        }
      }

      if (!isAffiliated) {

        ruleApplied = 'Non-affiliated author: excluded from UNIVEN claim.';

      } else {

        const universityCount = univAffiliations.length;

        const hasUniven = univAffiliations.some((u: any) => u.isUniven === true);
        const hasInternational = univAffiliations.some((u: any) => u.isInternationalUniversity === true);
        const hasResearch = researchAffiliations.length > 0;

        // ✅ CASE 1: International University → FULL UNIVEN
        if (hasInternational) {

          univenClaim = authorShare;

          splitDetails.push({
            label: 'UNIVEN (International Rule)',
            type: 'UNIVERSITY',
            units: authorShare,
            claimedByUniven: true
          });

          ruleApplied = 'International university affiliation: full share assigned to UNIVEN.';

        }

        // ✅ CASE 2: UNIVEN + Research Company ONLY → FULL UNIVEN
        else if (hasUniven && hasResearch && universityCount === 1) {

          univenClaim = authorShare;

          splitDetails.push({
            label: 'UNIVEN',
            type: 'UNIVERSITY',
            units: authorShare,
            claimedByUniven: true
          });

          researchAffiliations.forEach((r: any) => {
            splitDetails.push({
              label: r.companyName || 'Research Company',
              type: r.companyType || 'RESEARCH_COMPANY',
              units: 0,
              claimedByUniven: false
            });
          });

          ruleApplied = 'UNIVEN + Research Company: full share assigned to UNIVEN.';
        }

        // ✅ CASE 3: Multiple universities → SPLIT
        else if (universityCount > 1) {

          const unitPerUniv = authorShare / universityCount;

          univAffiliations.forEach((u: any) => {

            const isUniven = u.isUniven === true;

            splitDetails.push({
              label: u.universityCode || u.universityName || 'University',
              type: 'UNIVERSITY',
              units: unitPerUniv,
              claimedByUniven: isUniven
            });

            if (isUniven) {
              univenClaim += unitPerUniv;
            }

          });

          ruleApplied = 'Split across multiple universities; UNIVEN receives proportional share.';
        }

        // ✅ CASE 4: UNIVEN only → FULL
        else if (hasUniven && universityCount === 1) {

          univenClaim = authorShare;

          splitDetails.push({
            label: 'UNIVEN',
            type: 'UNIVERSITY',
            units: authorShare,
            claimedByUniven: true
          });

          ruleApplied = 'Single UNIVEN affiliation: full share claimed by UNIVEN.';
        }

        // ✅ CASE 5: NO UNIVEN → no claim
        else {

          const unitPerUniv = authorShare / universityCount;

          univAffiliations.forEach((u: any) => {
            splitDetails.push({
              label: u.universityName || 'University',
              type: 'UNIVERSITY',
              units: unitPerUniv,
              claimedByUniven: false
            });
          });

          ruleApplied = 'No UNIVEN affiliation: no claim.';
        }
      }

      this.unitBreakdown.univenTotalClaimed += univenClaim;

      this.unitBreakdown.authorUnitCalculations.push({
        authorIndex: idx,
        authorName,
        isAffiliated,
        authorShare,
        universityCount: univAffiliations.length,
        researchAffiliationsCount: researchAffiliations.length,
        splitDetails,
        ruleApplied,
        univenClaim
      });

      fg.patchValue({
        authorShare,
        totalUnitsClaimed: univenClaim
      }, { emitEvent: false });

    });
  }

  /**
   * Get university affiliations for an author FormGroup
   */
  getUniversityAffiliations(authorControl: AbstractControl | null): FormArray {
    return (authorControl?.get('universityAffiliations') as FormArray) ?? this.fb.array([]);
  }

  /**
   * Get research affiliations for an author FormGroup
   */
  getResearchAffiliations(authorControl: AbstractControl | null): FormArray {
    return (authorControl?.get('researchAffiliations') as FormArray) ?? this.fb.array([]);
  }

  private findUniversityByCode(code: string): { code: string; name: string } | undefined {
    return this.saUniversityOptions.find(u => u.code === code);
  }

  private getUniversityRowKey(authorIndex: number, univIndex: number): string {
    return `${authorIndex}_${univIndex}`;
  }

  getUniversitySearchTerm(authorIndex: number, univIndex: number): string {
    return this.universitySearchTerms[this.getUniversityRowKey(authorIndex, univIndex)] ?? '';
  }

  isUniversityDropdownOpen(authorIndex: number, univIndex: number): boolean {
    return this.universityDropdownOpen[this.getUniversityRowKey(authorIndex, univIndex)] === true;
  }

  openUniversityDropdown(authorIndex: number, univIndex: number): void {
    this.universityDropdownOpen[this.getUniversityRowKey(authorIndex, univIndex)] = true;
  }

  closeUniversityDropdown(authorIndex: number, univIndex: number): void {
    // Small delay allows option click to complete before closing.
    setTimeout(() => {
      this.universityDropdownOpen[this.getUniversityRowKey(authorIndex, univIndex)] = false;
      this.cdr.markForCheck();
    }, 120);
  }

  onUniversitySearchChange(authorIndex: number, univIndex: number, value: string): void {
    this.universitySearchTerms[this.getUniversityRowKey(authorIndex, univIndex)] = value ?? '';
    this.openUniversityDropdown(authorIndex, univIndex);
  }

  getUniversityDisplayValue(authorIndex: number, univIndex: number): string {
    const row = this.getUniversityAffiliations(this.authorsFA.at(authorIndex) as FormGroup).at(univIndex) as FormGroup;
    const code = String(row?.get('universityCode')?.value ?? '').trim().toUpperCase();
    const name = String(row?.get('universityName')?.value ?? '').trim();

    if (!code) return '';
    if (code === this.otherUniversityCode) return name;
    const selected = this.findUniversityByCode(code);
    return selected ? `${selected.name} (${selected.code})` : name;
  }

  selectUniversityOption(authorIndex: number, univIndex: number, university: { code: string; name: string }): void {
    const row = this.getUniversityAffiliations(this.authorsFA.at(authorIndex) as FormGroup).at(univIndex) as FormGroup;
    row.patchValue(
      {
        universityCode: university.code,
        universityName: university.name,
        isUniven: university.code === 'UNIVEN'
      },
      { emitEvent: false }
    );

    delete this.universitySearchTerms[this.getUniversityRowKey(authorIndex, univIndex)];
    this.universityDropdownOpen[this.getUniversityRowKey(authorIndex, univIndex)] = false;
    this.calculateAdvancedUnitBreakdown();
    this.cdr.markForCheck();
  }

  selectOtherUniversity(authorIndex: number, univIndex: number): void {
    const row = this.getUniversityAffiliations(this.authorsFA.at(authorIndex) as FormGroup).at(univIndex) as FormGroup;
    row.patchValue(
      {
        universityCode: this.otherUniversityCode,
        universityName: '',
        isUniven: false
      },
      { emitEvent: false }
    );

    delete this.universitySearchTerms[this.getUniversityRowKey(authorIndex, univIndex)];
    this.universityDropdownOpen[this.getUniversityRowKey(authorIndex, univIndex)] = false;
    this.calculateAdvancedUnitBreakdown();
    this.cdr.markForCheck();
  }

  getFilteredUniversityOptions(authorIndex: number, univIndex: number): { code: string; name: string }[] {
    const term = this.getUniversitySearchTerm(authorIndex, univIndex).trim().toLowerCase();
    if (!term) {
      return this.saUniversityOptions;
    }

    return this.saUniversityOptions.filter(university =>
      university.name.toLowerCase().includes(term)
      || university.code.toLowerCase().includes(term)
    );
  }

  private normalizeAllUniversityAffiliations(): void {
    this.authorsFA.controls.forEach((_, authorIndex) => {
      this.normalizeUniversityAffiliationsForAuthor(authorIndex);
    });
  }

  private normalizeUniversityAffiliationsForAuthor(authorIndex: number): void {
    const univArray = this.getUniversityAffiliations(this.authorsFA.at(authorIndex) as FormGroup);
    univArray.controls.forEach((ctrl) => {
      const row = ctrl as FormGroup;
      const code = String(row.get('universityCode')?.value ?? '').trim().toUpperCase();
      const name = String(row.get('universityName')?.value ?? '').trim();
      const selected = this.findUniversityByCode(code);

      if (selected) {
        row.patchValue(
          {
            universityCode: selected.code,
            universityName: selected.name,
            isUniven: selected.code === 'UNIVEN'
          },
          { emitEvent: false }
        );
        return;
      }

      // Convert legacy or unknown values to OTHER while preserving an existing custom name.
      if (code || name) {
        row.patchValue(
          {
            universityCode: this.otherUniversityCode,
            universityName: name,
            isUniven: false
          },
          { emitEvent: false }
        );
      }
    });
  }

  isOtherUniversitySelected(authorIndex: number, univIndex: number): boolean {
    const row = this.getUniversityAffiliations(this.authorsFA.at(authorIndex) as FormGroup).at(univIndex) as FormGroup;
    const code = String(row?.get('universityCode')?.value ?? '').trim().toUpperCase();
    return code === this.otherUniversityCode;
  }

  onUniversitySelectionChange(authorIndex: number, univIndex: number): void {
    const row = this.getUniversityAffiliations(this.authorsFA.at(authorIndex) as FormGroup).at(univIndex) as FormGroup;
    const selectedCode = String(row?.get('universityCode')?.value ?? '').trim().toUpperCase();
    const selectedUniversity = this.findUniversityByCode(selectedCode);

    if (selectedUniversity) {
      row.patchValue(
        {
          universityCode: selectedUniversity.code,
          universityName: selectedUniversity.name,
          isUniven: selectedUniversity.code === 'UNIVEN'
        },
        { emitEvent: false }
      );
    } else if (selectedCode === this.otherUniversityCode) {
      row.patchValue(
        {
          universityName: '',
          isUniven: false
        },
        { emitEvent: false }
      );
    }

    delete this.universitySearchTerms[this.getUniversityRowKey(authorIndex, univIndex)];

    this.calculateAdvancedUnitBreakdown();
    this.cdr.markForCheck();
  }

  /**
   * Add a university affiliation to an author
   */
  addUniversityAffiliation(authorIndex: number) {
    const univArray = this.getUniversityAffiliations(this.authorsFA.at(authorIndex) as FormGroup);
    univArray.push(this.fb.group({
      universityCode: ['', Validators.required],
      universityName: ['', Validators.required],
      isUniven: [false]
    }));
    this.normalizeUniversityAffiliationsForAuthor(authorIndex);
    this.calculateAdvancedUnitBreakdown();
    this.cdr.markForCheck();
  }

  /**
   * Remove a university affiliation from an author
   */
  removeUniversityAffiliation(authorIndex: number, univIndex: number) {
    const univArray = this.getUniversityAffiliations(this.authorsFA.at(authorIndex) as FormGroup);
    univArray.removeAt(univIndex);
    delete this.universitySearchTerms[this.getUniversityRowKey(authorIndex, univIndex)];
    delete this.universityDropdownOpen[this.getUniversityRowKey(authorIndex, univIndex)];
    this.calculateAdvancedUnitBreakdown();
    this.cdr.markForCheck();
  }

  /**
   * Add a research affiliation to an author
   */
  addResearchAffiliation(authorIndex: number) {
    const resArray = this.getResearchAffiliations(this.authorsFA.at(authorIndex) as FormGroup);
    resArray.push(this.fb.group({
      companyName: ['', Validators.required],
      companyType: ['OTHER', Validators.required]
    }));
    this.calculateAdvancedUnitBreakdown();
    this.cdr.markForCheck();
  }

  /**
   * Remove a research affiliation from an author
   */
  removeResearchAffiliation(authorIndex: number, resIndex: number) {
    const resArray = this.getResearchAffiliations(this.authorsFA.at(authorIndex) as FormGroup);
    resArray.removeAt(resIndex);
    this.calculateAdvancedUnitBreakdown();
    this.cdr.markForCheck();
  }

  // === Payload / preview / submit ===
  buildPayload(): {
    id: any;
    dhetNo: any;
    year: any;
    status?: string;
    title: any;
    duplicateJournal:any;
    journalTitle: any;
    publisher: any;
    index: any;
    comply: 'N/A' | 'Yes' | 'No';
    volume: any;
    issue: any;
    issn: any;
    eissn: any;
    doi: any;
    urls: any;
    openaccess: any;
    fieldofsearch: any;
    publicationfeedescription: any;
    publishercurrency: any;
    totalPublicationFeePublisherCurrency: number | undefined;
    publicationfeearticle: number | undefined;
    authorsContributionFee: number | undefined;
    authorsContributionFeeZar: number | undefined;
    funders: any;
    maxUnitsForPublication: number | undefined;
    totalProportionOfAuthors: number | undefined;
    authorCount: number | undefined;
    totalUnitsClaimed: number | undefined;
    authors: Authors[];
    otherAuthorsNonAffiliated: any;
    units: Units;
    claimingAuthorsContribution: ClaimingAuthorsContribution;
    attachments: Attachment[];
    additionalComments: any
  } {
    const raw = this.form.getRawValue();

    return {
      id: raw.id ?? null,

      /** Core DHET Info */
      dhetNo: raw.dhetNo,
      year: raw.year,
      title: raw.title,
      journalTitle: raw.journalTitle ?? '',
      duplicateJournal:raw.duplicateJournal ?? false,
      publisher: raw.publisher,
      index: raw.index,
      comply: this.normalizeCompliance(raw.comply),

      /** Publication Details */
      volume: raw.volume ?? null,
      issue: raw.issue ?? null,
      issn: raw.issn,
      eissn: raw.eissn ?? null,
      doi: raw.doi ?? null,

      // convert URL string to array if needed
      urls: raw.urls ?? null,


      openaccess: raw.openaccess ?? false,

      /** Research */
      fieldofsearch: raw.fieldofsearch ?? null,

      /** Fees & Funding */
      publicationfeedescription: raw.publicationfeedescription ?? '',
      publishercurrency: raw.publishercurrency ?? '',
      totalPublicationFeePublisherCurrency:
        raw.totalPublicationFeePublisherCurrency
          ? Number(raw.totalPublicationFeePublisherCurrency)
          : undefined,

      publicationfeearticle: raw.publicationfeearticle
        ? Number(raw.publicationfeearticle)
        : undefined,

      authorsContributionFee: raw.authorsContributionFee
        ? Number(raw.authorsContributionFee)
        : undefined,

      authorsContributionFeeZar: raw.authorsContributionFeeZar
        ? Number(raw.authorsContributionFeeZar)
        : undefined,

      funders: raw.funders ?? [],

      /** DHET Units */
      maxUnitsForPublication: raw.maxUnitsForPublication
        ? Number(raw.maxUnitsForPublication)
        : undefined,

      totalProportionOfAuthors: raw.totalProportionOfAuthors
        ? Number(raw.totalProportionOfAuthors)
        : undefined,

      authorCount: raw.authorCount
        ? Number(raw.authorCount)
        : undefined,

      totalUnitsClaimed: raw.totalUnitsClaimed
        ? Number(raw.totalUnitsClaimed)
        : undefined,

      /** Authors */
      authors: (raw.authors as any[]).map(author => ({
        ...author,
        dob: author?.dob === null || author?.dob === undefined || author?.dob === '' ? null : String(author.dob),
        affiliation: this.asBoolean(author.affiliation, true),
        faculty: this.asId(author.faculty ?? author.facultyId),
        department: this.asId(author.department ?? author.departmentId)
      })) as Authors[],
      otherAuthorsNonAffiliated: raw.otherAuthorsNonAffiliated ?? [],

      /** Units & Contributions */
      units: raw.units as Units,
      claimingAuthorsContribution:
        raw.claimingAuthorsContribution as ClaimingAuthorsContribution,

      /** Attachments */
      attachments: (this.attachments ?? []).map(att => ({
        id: att.id,
        formguid: att.formguid,
        fileName: att.fileName,
        fileSize: Number(att.fileSize ?? 0),
        fileType: att.fileType,
        fileData: att.fileData,
        filePath: att.filePath ?? null,
        url: att.url,
        description: att.description ?? ''
      })),

      /** Notes */
      additionalComments: raw.additionalComments ?? ''
    };
  }

  autoPopulateForm(): void {

    /** 1. Patch normal fields */
    this.form.patchValue({
      id: null,
      dhetNo: 'J0001',
      year: '2025',
      title: 'AI in Modern Enterprise Systems',
      journalTitle: 'International Journal of Computer Science',
      publisher: 1,
      index: 'Scopus',
      comply: 'Yes',
      duplicateJournal:false,
      volume: 12,
      issue: 3,
      issn: '1234-5678',
      eissn: '8765-4321',
      doi: '10.1000/xyz123',
      urls: 'https://example.com/article',
      openaccess: true,

      fieldofsearch: 1.02,

      publicationfeedescription: 'Article Processing Charge',
      publishercurrency: 'USD',
      totalPublicationFeePublisherCurrency: 1500,
      publicationfeearticle: 1500,
      authorsContributionFee: 500,
      authorsContributionFeeZar: 9500,

      funders: 'NRF; University Grant',

      // units: {
      //   maxUnitsForPublication: 1,
      //   totalProportionOfAuthors:1,
      //   authorsCount: 2,
      //  // totalUnitsClaimed: 0.5
      // },

      // claimingAuthorsContribution: {
      //   proportionOfAuthors: 0.5,
      //   authorUnitsClaimed: 0.5,
      //   additionalComments: 'Auto populated'
      // },

      additionalComments: 'Auto-populated sample data'
    });

    /** 2. FIX: Reset and populate authors properly */
    this.authorsFA.clear();

    const authorsData: Authors[] = [
      {
        id: null,
        affiliation: true,
        studentEmployeeNo: 'EMP001',
        firstName: 'Muthu',
        surname: 'Ramavhunga',
        initials: 'MR',
        email:'testing@univen.ac.za',
        gender: 'MALE',
        populationGroup: 'African',
        dob: '1994-01-23',
        faculty: 1,
        department: 1,
        // facultyId: this.faculties?.[0]?.id ?? null,
        // departmentId: null,
        orcid: '0000-0000-0000-0001',
        countryOfBirth: 'South Africa',
        saResidencyStatus: 'SOUTH_AFRICAN_CITIZEN',
        disability: false,
        highestQualification: 'MASTERS',
        employmentStatus: 'EMPLOYED_FULL_TIME',
        academicTitle: 'MR'
      }
    ];

    authorsData.forEach(a => {
      this.authorsFA.push(this.newAuthor(a));
    });

    /** 3. Recalculate after populate */
    this.recalculateContributions();
  }

  preview() {
    this.previewJson = JSON.stringify(this.buildPayload(), null, 2);
    this.showPreview = true;
  }

  closePreview() {
    this.showPreview = false;
  }

  exportCurrentJournalExcel() {
    const id = this.form.get('id')?.value ?? this.lastSavedJournalId;
    debugger;
    if (!id) {
      Swal.fire({
        title: 'No saved journal',
        text: 'Save/submit the journal first before exporting Excel.',
        icon: 'warning'
      });
      return;
    }

    this.journalService.exportJournalById(Number(id)).subscribe({
      next: (blob) => {
        const dhetNo = this.form.get('dhetNo')?.value || `journal-${id}`;
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${dhetNo}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Failed to export journal excel', err);
        Swal.fire({
          title: 'Export failed',
          text: 'Could not generate Excel for this journal.',
          icon: 'error'
        });
      }
    });
  }

  onSubmit() {
    if (this.isReadOnlyView || this.isApproverDecisionMode) {
      return;
    }
    debugger;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      //  return;
    }

    const payload = {
      ...this.buildPayload(),
      status: 'SUBMITTED'
    };
    const username = this.getCurrentUsername();

    this.journalService.save(payload, username).subscribe({
      next: _ => {
        debugger;
        Swal.fire({
          title: "Success",
          text: "Journal saved successfully.",
          icon: "success"
        });
        //  alert('Journal saved successfully.');
        this.router.navigate(['/journal']);
      },
      error: err => {
        console.error('Error saving journal', err);
      }
    });
  }

  async approveAfterEdit(): Promise<void> {
    if (!this.canShowApproverDecisionActions()) {
      return;
    }

    const result = await Swal.fire({
      title: 'Approve journal?',
      input: 'textarea',
      inputLabel: 'Comments (required)',
      inputPlaceholder: 'Provide approval comments...',
      showCancelButton: true,
      confirmButtonText: 'Approve',
      preConfirm: (value) => {
        if (!value || !String(value).trim()) {
          Swal.showValidationMessage('Approval comments are required.');
          return false;
        }
        return value;
      }
    });

    if (!result.isConfirmed) {
      return;
    }

    // if (this.form.invalid) {
    //   this.form.markAllAsTouched();
    //   Swal.fire('Incomplete', 'Please complete required fields before approval.', 'warning');
    //   return;
    // }

    const username = this.getCurrentUsername();
    const payload = this.buildPayload();
    this.isSaving = true;

    this.journalService.save(payload, username).subscribe({
      next: (saved) => {
        const id = Number(saved?.id ?? payload.id);
        if (!id) {
          this.isSaving = false;
          Swal.fire('Error', 'Journal ID not found after save.', 'error');
          return;
        }

        this.journalService.approve(id, username, String(result.value).trim()).subscribe({
          next: () => {
            this.isSaving = false;
            Swal.fire('Approved', 'Journal saved and moved to the next stage.', 'success').then(() => {
              this.router.navigate(['/journal-review']);
            });
          },
          error: (err) => {
            this.isSaving = false;
            console.error('Approve failed', err);
            Swal.fire('Error', 'Could not approve journal at the current stage.', 'error');
          }
        });
      },
      error: (err) => {
        this.isSaving = false;
        console.error('Save before approve failed', err);
        Swal.fire('Error', 'Could not save journal before approval.', 'error');
      }
    });
  }

  async rejectAfterEdit(): Promise<void> {
    if (!this.canShowApproverDecisionActions()) {
      return;
    }

    const result = await Swal.fire({
      title: 'Reject journal?',
      input: 'textarea',
      inputLabel: 'Comments (required)',
      inputPlaceholder: 'Provide rejection comments...',
      showCancelButton: true,
      confirmButtonText: 'Reject',
      preConfirm: (value) => {
        if (!value || !String(value).trim()) {
          Swal.showValidationMessage('Rejection comments are required.');
          return false;
        }
        return value;
      }
    });

    if (!result.isConfirmed) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      Swal.fire('Incomplete', 'Please complete required fields before rejection.', 'warning');
      return;
    }

    const username = this.getCurrentUsername();
    const payload = this.buildPayload();
    this.isSaving = true;

    this.journalService.save(payload, username).subscribe({
      next: (saved) => {
        const id = Number(saved?.id ?? payload.id);
        if (!id) {
          this.isSaving = false;
          Swal.fire('Error', 'Journal ID not found after save.', 'error');
          return;
        }

        this.journalService.reject(id, username, String(result.value).trim()).subscribe({
          next: () => {
            this.isSaving = false;
            Swal.fire('Rejected', 'Journal saved and rejected for revision.', 'success').then(() => {
              this.router.navigate(['/journal-review']);
            });
          },
          error: (err) => {
            this.isSaving = false;
            console.error('Reject failed', err);
            Swal.fire('Error', 'Could not reject journal at the current stage.', 'error');
          }
        });
      },
      error: (err) => {
        this.isSaving = false;
        console.error('Save before reject failed', err);
        Swal.fire('Error', 'Could not save journal before rejection.', 'error');
      }
    });
  }

  onFacultyChange(authorIndex: number) {
    debugger;
    const facultyId = this.asId(this.authorsFA.at(authorIndex).get('facultyId')?.value);
    if (!facultyId) return;

    this.journalService.getDepartmentsByFaculty(facultyId).subscribe({
      next: (deps) => {

        this.departmentsMap[authorIndex] = deps;
        // reset department selection
        this.authorsFA.at(authorIndex).get('departmentId')?.reset();
      },
      error: (err) => {

        console.error(
          'Failed to load departments', err)
      }
    });

  }

  onCountrySearch(authorIndex: number) {
    debugger
    const fg = this.authorsFA.at(authorIndex) as FormGroup;
    this.countrySubs[authorIndex]?.unsubscribe();
    fg.get('countryOfBirth')?.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(value => this.countryService.searchCountries(value))
    ).subscribe(list => {
      this.countryOptionsMap[authorIndex] = list;
    });
  }

  selectResearchField(field: any) {
    this.form.get('fieldofsearch')?.setValue(field.code); // or field.code
    this.filteredResearchFields = [];
    this.showResearchFieldDropdown = false;
  }

  /**
   * Handle click on a research field dropdown item
   * Prevents blur event from firing immediately
   */
  selectResearchFieldOnClick(field: any) {
    this.selectResearchField(field);
  }


  reset() {
    this.form.reset();
    this.authorsFA.clear();
    this.authorsFA.push(this.newAuthor());
    this.unitsFG.reset({
      maxUnitsForPublication: null,
      totalProportionOfAuthors: 1,
      authorsCount: 1,
      totalUnitsClaimed: null,
      otherAuthorsNonAffiliates: '',
      additionalComments: '',
    });
    this.recalculateContributions();
    this.showPreview = false;
    this.previewJson = '';
    this.attachments = [];
    this.fileErrors = [];
    this.newAttachmentDescription = '';
    this.fileError = '';
    this.selectedFile = null;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) {
      this.selectedFile = null;
      return;
    }

    if (file.type !== 'application/pdf') {
      this.fileError = 'Only PDF files are allowed.';
      this.selectedFile = null;
      return;
    }

    this.fileError = '';
    this.selectedFile = file;
  }

  addAttachment() {
    if (!this.selectedFile) {
      this.fileError = 'Please select a file.';
      return;
    }

    if (!this.newAttachmentDescription.trim()) {
      // Could add description error, but for now just proceed or alert
      Swal.fire({
        title: "Warning",
        text: "Description is recommended.",
        icon: "warning"
      });
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = (e.target?.result as string).split(',')[1];
      const attachment: Attachment = {
        fileName: this.selectedFile!.name,
        fileSize: this.selectedFile!.size,
        fileType: this.selectedFile!.type,
        file: this.selectedFile!,
        fileData: base64,
        description: this.newAttachmentDescription.trim() || 'No description'
      };
      this.attachments.push(attachment);

      // Reset form
      this.newAttachmentDescription = '';
      this.selectedFile = null;
      this.fileError = '';
      // Clear file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    };
    reader.readAsDataURL(this.selectedFile);
  }

  removeAttachmentRow(index: number) {
    this.attachments.splice(index, 1);
  }

  viewAttachment(index: number) {
    const attachment = this.attachments[index];
    if (attachment.fileData) {
      const byteCharacters = atob(attachment.fileData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } else if (attachment.url) {
      window.open(attachment.url, '_blank');
    } else if (attachment.filePath) {
      window.open(attachment.filePath, '_blank');
    } else {
      Swal.fire({
        title: 'Attachment unavailable',
        text: 'This attachment has no fileData, URL, or filePath to open.',
        icon: 'warning'
      });
    }
  }

  // === Stepper Methods ===
  isStepValid(step: number): boolean {
    switch (step) {
      case 1: // Journal Information
        return this.isJournalInfoValid();
      case 2: // Affiliated Authors
        return this.isAuthorsValid(true) && this.isAffiliatedAuthorsComplete();
      case 3: // Non-Affiliated Authors
        return this.isAuthorsValid(false);
      case 4: // Results & Submissions
        return this.form.valid;
      default:
        return false;
    }
  }

  isJournalInfoValid(): boolean {
    const fields = ['year', 'journalTitle', 'title', 'publisher','issn' ,'fieldofsearch', 'index', 'comply'];
    return fields.every(field => {
      const control = this.form.get(field);
      return control && control.valid;
    });
  }

  isAuthorsValid(affiliated: boolean): boolean {
    const authors = affiliated ? this.getAffiliatedAuthors() : this.getNonAffiliatedAuthors();

    if (affiliated && authors.length === 0) return false;

    return authors.every(ctrl => {
      // Step 3 (Non-affiliated) and Step 2 (Affiliated) both only require: firstName, surname, email
      return ctrl.get('firstName')?.valid &&
        ctrl.get('surname')?.valid &&
        ctrl.get('email')?.valid;
    });
  }

  /**
   * Validate affiliated-specific required fields (studentEmployeeNo, gender, facultyId)
   * This is checked in addition to isAuthorsValid for Step 2
   */
  isAffiliatedAuthorsComplete(): boolean {
    const authors = this.getAffiliatedAuthors();

    return authors.every(ctrl => {
      return ctrl.get('studentEmployeeNo')?.valid &&
        ctrl.get('gender')?.valid &&
        ctrl.get('facultyId')?.valid;
    });
  }

  goToNextStep() {
    debugger;
    if (this.currentStep < this.totalSteps) {
      if (this.isReadOnlyView) {
        this.currentStep++;
        window.scrollTo(0, 0);
        return;
      }

      if (this.isStepValid(this.currentStep))
      {
        this.currentStep++;
        window.scrollTo(0, 0);
      }
      else {
        this.markStepAsTouched(this.currentStep);
        Swal.fire({
          title: "Incomplete Step",
          text: "Please fill in all required fields before proceeding.",
          icon: "warning"
        });
      }
    }
  }

  markStepAsTouched(step: number) {
    if (step === 1) {
      const fields = ['year', 'journalTitle', 'title', 'publisher', 'issn', 'fieldofsearch', 'index', 'comply'];
      fields.forEach(f => this.form.get(f)?.markAsTouched());
    } else if (step === 2 || step === 3) {
      const affiliated = (step === 2);
      const authors = affiliated ? this.getAffiliatedAuthors() : this.getNonAffiliatedAuthors();
      authors.forEach(a => a.markAllAsTouched());
    } else {
      this.form.markAllAsTouched();
    }
  }

  prevStep() {
    debugger;
    if (this.currentStep > 1) {
      this.currentStep--;
      window.scrollTo(0, 0);
    }
  }

  goToStep(step: number) {
    if (this.isReadOnlyView) {
      this.currentStep = step;
      window.scrollTo(0, 0);
      return;
    }

    if (step === this.currentStep) return;

    if (step < this.currentStep) {
      this.currentStep = step;
      window.scrollTo(0, 0);
      return;
    }

    // If moving forward, must validate intermediate steps
    for (let s = this.currentStep; s < step; s++) {
      if (!this.isStepValid(s)) {
        this.markStepAsTouched(s);
        Swal.fire({
          title: "Incomplete Step",
          text: `Please complete Step ${s} before moving to Step ${step}.`,
          icon: "warning"
        });
        return;
      }
    }
    this.currentStep = step;
    window.scrollTo(0, 0);
  }

  getAffiliatedAuthors() {
    return this.authorsFA.controls.filter(ctrl =>
      (ctrl as FormGroup).get('affiliation')?.value === true
    );
  }

  getNonAffiliatedAuthors() {
    return this.authorsFA.controls.filter(ctrl =>
      (ctrl as FormGroup).get('affiliation')?.value !== true
    );
  }

  /**
   * Save current step data
   */
  saveCurrentStep() {
    this.markStepAsTouched(this.currentStep);

    if (!this.isStepValid(this.currentStep)) {
      Swal.fire({
        title: "Incomplete Step",
        text: `Please complete all required fields in this step before saving.`,
        icon: "warning"
      });
      return;
    }

    this.isSaving = true;
    const payload = this.buildPayload();

    const username = this.getCurrentUsername();
    this.journalService.save(payload, username).subscribe({
      next: (savedJournal) => {
        this.isSaving = false;
        this.lastSavedJournalId = savedJournal.id;
        this.form.get('id')?.setValue(savedJournal.id, { emitEvent: false });
        this.form.get('dhetNo')?.setValue(savedJournal.dhetNo, { emitEvent: false });

        this.saveMessage = `Step ${this.currentStep} saved successfully! You can continue editing later.`;
        this.showSaveMessage = true;

        setTimeout(() => {
          this.showSaveMessage = false;
        }, 3000);

        Swal.fire({
          title: "Saved",
          text: this.saveMessage,
          icon: "success",
          timer: 2000
        });
      },
      error: (err) => {
        this.isSaving = false;
        console.error('Error saving step', err);
        Swal.fire({
          title: "Error",
          text: "Failed to save step. Please try again.",
          icon: "error"
        });
      }
    });
  }

  /**
   * Save current step and continue to next step
   */
  saveAndContinue() {
    this.markStepAsTouched(this.currentStep);

    if (!this.isStepValid(this.currentStep)) {
      Swal.fire({
        title: "Incomplete Step",
        text: `Please complete all required fields in this step before continuing.`,
        icon: "warning"
      });
      return;
    }

    this.isSaving = true;
    const payload = this.buildPayload();

    const username = this.getCurrentUsername();
    this.journalService.save(payload, username).subscribe({
      next: (savedJournal) => {
        this.isSaving = false;
        this.lastSavedJournalId = savedJournal.id;
        this.form.get('id')?.setValue(savedJournal.id, { emitEvent: false });
        this.form.get('dhetNo')?.setValue(savedJournal.dhetNo, { emitEvent: false });

        this.saveMessage = `Step ${this.currentStep} saved successfully!`;
        this.showSaveMessage = true;

        // Move to next step
        if (this.currentStep < this.totalSteps) {
            setTimeout(() => {
            this.goToNextStep();
            this.showSaveMessage = false;
          }, 500);
        }
      },
      error: (err) => {
        this.isSaving = false;
        console.error('Error saving step', err);
        Swal.fire({
          title: "Error",
          text: "Failed to save step. Please try again.",
          icon: "error"
        });
      }
    });
  }

  // duplicate simple nextStep removed; validated nextStep implementation above

  /**
   * Load previously saved journal data
   */
  loadSavedJournal() {
    const state = this.router.getCurrentNavigation()?.extras.state ?? history.state ?? {};
    const journalIdFromState = state?.['journal']?.id;

    if (journalIdFromState) {
      this.journalService.getById(journalIdFromState).subscribe({
        next: (journal) => {
          this.lastSavedJournalId = journal.id;
          this.populateFormWithJournal(journal);
        },
        error: (err) => {
          console.error('Error loading journal', err);
        }
      });
    }
  }

   /**
    * Populate form with journal data
    */
   private populateFormWithJournal(journal: Journal) {
     this.form.patchValue({
       id: journal.id,
       dhetNo: journal.dhetNo,
       status: journal.status,
       year: journal.year,
       journalTitle: journal.journalTitle,
       title: journal.title,
       issn: journal.issn,
       publisher: journal.publisher,
       index: journal.index,
       comply: journal.comply,
       volume: journal.volume,
       issue: journal.issue,
       eissn: journal.eissn,
       doi: journal.doi,
       urls: journal.urls,
       openaccess: journal.openaccess,
       fieldofsearch: journal.fieldofsearch,
       publicationfeedescription: journal.publicationfeedescription,
       publishercurrency: journal.publishercurrency,
       totalPublicationFeePublisherCurrency: journal.totalPublicationFeePublisherCurrency,
       publicationfeearticle: journal.publicationfeearticle,
       authorsContributionFee: journal.authorsContributionFee,
       authorsContributionFeeZar: journal.authorsContributionFeeZar,
       funders: journal.funders,
       otherAuthorsNonAffiliated: Array.isArray(journal.otherAuthorsNonAffiliated)
         ? journal.otherAuthorsNonAffiliated.join('; ')
         : '',
       units: {
         maxUnitsForPublication: journal.units?.maxUnitsForPublication ?? 1,
         totalProportionOfAuthors: journal.units?.totalProportionOfAuthors ?? 1,
         authorCount: journal.units?.authorsCount ?? 1,
         totalUnitsClaimed: journal.units?.totalUnitsClaimed ?? null,
         otherAuthorsNonAffiliates: journal.units?.otherAuthorsNonAffiliates ?? null,
       },
       claimingAuthorsContribution: {
         proportionOfAuthors: journal.claimingAuthorsContribution?.proportionOfAuthors ?? null,
         authorUnitsClaimed: journal.claimingAuthorsContribution?.authorUnitsClaimed ?? null,
         additionalComments: journal.claimingAuthorsContribution?.additionalComments ?? ''
       },
       additionalComments: journal.additionalComments ?? ''
     });

     // Populate authors
     if (journal.authors && journal.authors.length > 0) {
       this.authorsFA.clear();
       journal.authors.forEach(author => {
         // ensure affiliation is a boolean (fallback to true when undefined/null)
         const affiliationFlag = this.asBoolean(author.affiliation, true);
         this.authorsFA.push(this.newAuthor(author, affiliationFlag));
       });
     } else {
       this.authorsFA.clear();
       this.authorsFA.push(this.newAuthor());
     }

     this.attachments = this.normalizeAttachments(journal.attachments);
     this.preloadAuthorDepartments();
     this.recalculateContributions();
     this.calculateAdvancedUnitBreakdown();

     if (this.isReadOnlyView) {
       this.clearAllValidators(this.form);
       this.form.disable({ emitEvent: false });
     }

     // ✅ Force change detection to refresh template immediately
     this.cdr.markForCheck();
     this.cdr.detectChanges();
     // Duplicate simple nextStep removed; using single validated nextStep implementation above
    }

  /**
   * TrackBy function for rendering efficiency
   */
  trackByIndex(index: number): number {
    return index;
  }
}

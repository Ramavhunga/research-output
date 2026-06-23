import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import {
  Authors,
  Attachment,
  Department, Faculty
} from '../../models/common.model';
import {ConferenceProceedingsService} from '../../services/conference-proceedings.service';
import {debounceTime, distinctUntilChanged, switchMap, Subscription, of, map} from 'rxjs';
import {CountriesService} from '../../services/countries.service';
import Swal from 'sweetalert2';
import {ResearchfieldService} from '../../services/researchfield.service';
import {Publisher, PublisherService} from '../../services/publisher.service';
import {ConferenceProceedings} from '../../models/ConfrenceProceedings';
import { AuthorLookupService } from '../../services/author-lookup.service';
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

@Component({
  selector: 'app-conference-proceedings-detail-component',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    RouterModule
  ],
  templateUrl: './conference-proceedings-detail-component.html',
  standalone: true,
  styleUrl: './conference-proceedings-detail-component.css'
})
export class ConferenceProceedingsDetailComponent implements OnInit {
   private readonly currentReportingYear = new Date().getFullYear();
   isReadOnlyView = false;
   currentStatus = '';
   currentRoles: string[] = [];
   currentUsername = '';
   isSaving = false;
   saveMessage: string = '';
   showSaveMessage = false;
   lastSavedProceedingsId: number | null = null;
  showPreview = false;
  previewJson = '';
  attachments: Attachment[] = [];
  fileErrors: string[] = [];
  newAttachmentDescription = '';
  fileError = '';
  selectedFile: File | null = null;
  form: FormGroup;
  currentStep = 1;
  totalSteps = 4;
  steps = [
    { id: 1, label: 'Conference Information' },
    { id: 2, label: 'Affiliated Authors' },
    { id: 3, label: 'Non-Affiliated Authors' },
    { id: 4, label: 'Results & Submission' }
  ];
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

  readonly otherUniversityCode = 'OTHER';
  readonly saUniversityOptions = SA_HEI_OPTIONS;
  readonly genderOptions = AUTHOR_GENDER_OPTIONS;
  readonly populationGroupOptions = AUTHOR_POPULATION_GROUP_OPTIONS;
  readonly saResidencyOptions = AUTHOR_SA_RESIDENCY_OPTIONS;
  readonly employmentStatusOptions = AUTHOR_EMPLOYMENT_STATUS_OPTIONS;
  readonly academicTitleOptions = AUTHOR_ACADEMIC_TITLE_OPTIONS;
  readonly highestQualificationOptions = AUTHOR_HIGHEST_QUALIFICATION_OPTIONS;
  readonly countryOptions = ISO_3166_COUNTRY_OPTIONS;

  researchFields: any[] = [];
  filteredResearchFields: any[] = []
  showResearchFieldDropdown = false;
  publishers: Publisher[] = [];
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

  constructor(private fb: FormBuilder,
              private router: Router,
              private conferenceProceedingsService: ConferenceProceedingsService,
              private countryService: CountriesService,
              private researchFieldService: ResearchfieldService,
              private publisherService: PublisherService,
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
    const proceedings = navigationState['proceedings'] as ConferenceProceedings | undefined;
    this.isReadOnlyView = !!(navigationState['reviewMode'] || navigationState['viewMode'] || navigationState['readOnly']);
    this.currentStatus = this.normalizeStatus((proceedings as any)?.status);
    this.currentRoles = this.getCurrentRoles();
    this.currentUsername = this.getCurrentUsername();
    this.attachments = this.normalizeAttachments((proceedings as any)?.attachments);


    this.form = this.fb.group({
      id: [proceedings?.id ?? null],
      dhetNo: [
        proceedings?.dhetNo ?? 'P001',
        [Validators.required, Validators.pattern(/^P\d+(?:\.\d+)*$/)]
      ],
      year: [
        proceedings?.yearOfPublication ?? '',
        Validators.required
      ],
      titleOfConferenceProceedings: [proceedings?.titleOfConferenceProceedings ?? '', Validators.required],
      titleOfContribution: [proceedings?.titleOfContribution ?? '', Validators.required],
      totalChaptersInBook: [null],
      editors: [proceedings?.editors ?? ''],
      publisher: [proceedings?.publisher ?? '', Validators.required],
      isbn: [
        proceedings?.isbn ?? '',
        [Validators.required]
      ],
      fieldofsearch: [proceedings?.fieldOfResearch ?? '', Validators.required],
      originalPhotocopy: [
        proceedings?.originalOrPhotocopy ?? '',
        [Validators.required, Validators.pattern(/^[OP]$/)]
      ],
      peerReviewEvidence: [
        this.toYesNo(proceedings?.evidenceOfPeerReview, 'N'),
        [Validators.required, Validators.pattern(/^[YN]$/)]
      ],
      typeOfEvidence: [proceedings?.typeOfEvidence ?? '', Validators.required],
      maxUnitsForPublication: [proceedings?.maxUnitsForPublication ?? 0.5],
      totalProportionOfAuthors: [proceedings?.totalProportionOfAuthors ?? 1, Validators.required],
      authorCount: [{value: proceedings?.authorCount ?? 1, disabled: true}, Validators.required],
      otherAuthorsNonAffiliated: [{value: 0, disabled: true}],
      totalUnitsClaimed: [{value: proceedings?.totalUnitsClaimed ?? null, disabled: true}, Validators.required],
      funders: [proceedings?.funders ?? ''],
      additionalComments: [proceedings?.additionalComments ?? ''],
      compliesWith60Rule: [this.normalizeComplianceValue(proceedings?.compliesWith60Rule), Validators.required],
      startDate: [proceedings?.startDate ?? '', Validators.required],
      endDate: [proceedings?.endDate ?? '', Validators.required],
      city: [proceedings?.city ?? '', Validators.required],
      country: [proceedings?.country ?? '', Validators.required],
      authors: this.fb.array(
        proceedings?.authors?.length
          ? proceedings.authors.map(a => this.newAuthor(a, this.asBoolean(a.affiliation, true)))
          : [this.newAuthor()]
      ),
    },{
      asyncValidators: this.isReadOnlyView ? [] : [this.checkTitleIsbnUnique(this.conferenceProceedingsService)],
      updateOn: 'blur'
    });

    this.setupFieldSearch();
    this.setupAutoCalc();
    this.normalizeAllUniversityAffiliations();

    this.authorsFA.controls.forEach((_, i) => this.onCountrySearch(i));
    this.authorsFA.controls.forEach(ctrl => this.initAuthorAffiliationHandling(ctrl as FormGroup));

     if (this.isReadOnlyView) {
       this.disableValidationForReadOnlyMode();
       this.form.disable({ emitEvent: false });
     }
   }

  /**
   * Angular lifecycle hook: Initialize component
   */
  ngOnInit() {
    // Load previously saved proceedings if available
    this.loadSavedProceedings();
  }

  private disableValidationForReadOnlyMode(): void {
    this.clearValidatorsRecursively(this.form);
  }

  private clearValidatorsRecursively(control: AbstractControl): void {
    control.clearValidators();
    control.clearAsyncValidators();

    if (control instanceof FormGroup) {
      Object.values(control.controls).forEach(child => this.clearValidatorsRecursively(child));
    }

    if (control instanceof FormArray) {
      control.controls.forEach(child => this.clearValidatorsRecursively(child));
    }

    control.updateValueAndValidity({ emitEvent: false });
  }

  /**
   * Load previously saved proceedings data
   */
  private loadSavedProceedings() {
    const state = this.router.getCurrentNavigation()?.extras.state ?? history.state ?? {};
    const proceedingsIdFromState = state?.['proceedings']?.id;

    if (proceedingsIdFromState) {
      this.conferenceProceedingsService.getById(proceedingsIdFromState).subscribe({
        next: (proceedings) => {
          this.lastSavedProceedingsId = proceedings.id;
          this.populateFormWithProceedings(proceedings);
        },
        error: (err) => {
          console.error('Error loading proceedings', err);
        }
      });
    }
  }

  /**
   * Reload proceedings from saved ID (for Resume Draft button)
   */
  public reloadSavedProceedings() {
    if (!this.lastSavedProceedingsId) {
      Swal.fire({
        title: 'No Draft',
        text: 'No saved draft found. Please create one first.',
        icon: 'info'
      });
      return;
    }

    this.conferenceProceedingsService.getById(this.lastSavedProceedingsId).subscribe({
      next: (proceedings) => {
        this.populateFormWithProceedings(proceedings);
        Swal.fire({
          title: 'Draft Loaded',
          text: 'Your previously saved draft has been loaded.',
          icon: 'success',
          timer: 2000
        });
      },
      error: (err) => {
        console.error('Error loading proceedings', err);
        Swal.fire({
          title: 'Error',
          text: 'Could not load draft. Please try again.',
          icon: 'error'
        });
      }
    });
  }

  /**
   * Populate form with proceedings data
   */
  private populateFormWithProceedings(proceedings: ConferenceProceedings) {
    this.attachments = this.normalizeAttachments((proceedings as any)?.attachments);

    this.form.patchValue({
      id: proceedings.id,
      dhetNo: proceedings.dhetNo,
      year: proceedings.yearOfPublication,
      titleOfConferenceProceedings: proceedings.titleOfConferenceProceedings,
      titleOfContribution: proceedings.titleOfContribution,
      editors: proceedings.editors,
      publisher: proceedings.publisher,
      isbn: proceedings.isbn,
      fieldofsearch: proceedings.fieldOfResearch,
      originalPhotocopy: proceedings.originalOrPhotocopy,
      peerReviewEvidence: this.toYesNo(proceedings.evidenceOfPeerReview, 'N'),
      typeOfEvidence: proceedings.typeOfEvidence,
      maxUnitsForPublication: proceedings.maxUnitsForPublication ?? 0.5,
      totalProportionOfAuthors: proceedings.totalProportionOfAuthors ?? 1,
      funders: proceedings.funders,
      additionalComments: proceedings.additionalComments,
      compliesWith60Rule: this.normalizeComplianceValue(proceedings.compliesWith60Rule),
      startDate: proceedings.startDate,
      endDate: proceedings.endDate,
      city: proceedings.city,
      country: proceedings.country
    });

    // Populate authors
    if (proceedings.authors && proceedings.authors.length > 0) {
      this.authorsFA.clear();
      proceedings.authors.forEach(author => {
        const affiliationFlag = this.asBoolean(author.affiliation, true);
        const authorFG = this.newAuthor(author, affiliationFlag);
        this.authorsFA.push(authorFG);
        this.initAuthorAffiliationHandling(authorFG);
      });
    } else {
      this.authorsFA.clear();
      const authorFG = this.newAuthor();
      this.authorsFA.push(authorFG);
      this.initAuthorAffiliationHandling(authorFG);
    }

    this.recalculateContributions();
    this.calculateAdvancedUnitBreakdown();

    if (this.isReadOnlyView) {
      this.form.disable({ emitEvent: false });
    }

    // ✅ Force change detection to refresh template immediately
    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }

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

  private getCurrentUsername(): string {
    const loginRaw = sessionStorage.getItem('login');
    if (!loginRaw) return '';

    try {
      const loginData = JSON.parse(loginRaw);
      return (loginData?.user?.username ?? loginData?.username ?? '').toString().trim();
    } catch {
      return '';
    }
  }

  private getCurrentRoles(): string[] {
    const loginRaw = sessionStorage.getItem('login');
    if (!loginRaw) return [];

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

  private normalizeStatus(status: unknown): string {
    return String(status ?? '').toUpperCase().trim();
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
    if (!status) return false;

    if (roles.includes('ADMIN') || roles.includes('ADMINISTRATOR')) {
      return status !== 'READY_FOR_POSTING' && status !== 'POSTED_TO_DHET';
    }

    const isL1 = roles.includes('REVIEWER_LEVEL_1') || roles.includes('LEVEL_1_APPROVER');
    const isL2 = roles.includes('REVIEWER_LEVEL_2') || roles.includes('LEVEL_2_APPROVER');
    const l1Stage = status === 'SUBMITTED' || status === 'UNDER_REVIEW_L1';
    const l2Stage = status === 'UNDER_REVIEW_L2';
    return (isL1 && l1Stage) || (isL2 && l2Stage);
  }

  canShowReviewDecisionActions(): boolean {
    return !this.isReadOnlyView
      && this.isApproverRole(this.currentRoles)
      && this.canCurrentApproverDecideOnStatus(this.currentRoles, this.currentStatus);
  }

  async approveFromReview(): Promise<void> {
    if (!this.canShowReviewDecisionActions()) return;

    const id = Number(this.form.get('id')?.value ?? 0);
    if (!id) {
      Swal.fire('Error', 'Missing proceedings id for approval.', 'error');
      return;
    }

    const result = await Swal.fire({
      title: 'Approve proceedings?',
      input: 'textarea',
      inputLabel: 'Comments (required)',
      showCancelButton: true,
      confirmButtonText: 'Approve',
      inputValidator: (value) => !String(value ?? '').trim() ? 'Comments are required' : null
    });

    if (!result.isConfirmed) return;
    const comments = String(result.value).trim();

    this.conferenceProceedingsService.approve(id, this.currentUsername, comments).subscribe({
      next: (updated) => {
        this.currentStatus = this.normalizeStatus((updated as any)?.status);
        Swal.fire('Approved', 'Proceedings moved to the next stage.', 'success').then(() => {
          this.router.navigate(['/review-dashboard']);
        });
      },
      error: (err) => {
        Swal.fire('Error', err?.error?.message ?? 'Approval failed.', 'error');
      }
    });
  }

  async declineFromReview(): Promise<void> {
    if (!this.canShowReviewDecisionActions()) return;

    const id = Number(this.form.get('id')?.value ?? 0);
    if (!id) {
      Swal.fire('Error', 'Missing proceedings id for decline.', 'error');
      return;
    }

    const result = await Swal.fire({
      title: 'Decline proceedings?',
      input: 'textarea',
      inputLabel: 'Comments (required)',
      showCancelButton: true,
      confirmButtonText: 'Decline',
      inputValidator: (value) => !String(value ?? '').trim() ? 'Comments are required' : null
    });

    if (!result.isConfirmed) return;
    const comments = String(result.value).trim();

    this.conferenceProceedingsService.reject(id, this.currentUsername, comments).subscribe({
      next: (updated) => {
        this.currentStatus = this.normalizeStatus((updated as any)?.status);
        Swal.fire('Declined', 'Proceedings have been declined.', 'success').then(() => {
          this.router.navigate(['/review-dashboard']);
        });
      },
      error: (err) => {
        Swal.fire('Error', err?.error?.message ?? 'Decline failed.', 'error');
      }
    });
  }

  private toYesNo(value: unknown, fallback: 'Y' | 'N' = 'N'): 'Y' | 'N' {
    if (value === true) return 'Y';
    if (value === false) return 'N';
    const normalized = String(value ?? '').trim().toUpperCase();
    if (normalized === 'Y' || normalized === 'YES' || normalized === 'TRUE') return 'Y';
    if (normalized === 'N' || normalized === 'NO' || normalized === 'FALSE') return 'N';
    return fallback;
  }

  private yesNoToBoolean(value: unknown, fallback = false): boolean {
    const normalized = String(value ?? '').trim().toUpperCase();
    if (normalized === 'Y' || normalized === 'YES' || normalized === 'TRUE') return true;
    if (normalized === 'N' || normalized === 'NO' || normalized === 'FALSE') return false;
    return this.asBoolean(value, fallback);
  }

  private normalizeComplianceValue(value: unknown): 'Yes' | 'No' | 'N/A' {
    if (value === true) return 'Yes';
    if (value === false) return 'No';

    const normalized = String(value ?? '').trim().toLowerCase();
    if (normalized === 'yes' || normalized === 'y' || normalized === 'true' || normalized === '1') return 'Yes';
    if (normalized === 'no' || normalized === 'n' || normalized === 'false' || normalized === '0') return 'No';
    if (normalized === 'n/a' || normalized === 'na' || normalized === 'not applicable' || normalized === 'not_applicable') return 'N/A';
    return 'N/A';
  }

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
      .map((item: any) => ({
        id: item?.id ?? null,
        formguid: item?.formguid ?? item?.formGuid ?? undefined,
        fileName: item?.fileName ?? item?.filename ?? item?.name ?? '',
        fileType: item?.fileType ?? item?.filetype ?? item?.mimeType ?? item?.contentType ?? 'application/pdf',
        fileSize: Number(item?.fileSize ?? item?.filesize ?? item?.size ?? 0) || 0,
        fileData: item?.fileData ?? item?.data ?? item?.base64 ?? undefined,
        filePath: item?.filePath ?? item?.filepath ?? null,
        url: item?.url ?? item?.fileUrl ?? item?.downloadUrl ?? undefined,
        description: item?.description ?? item?.desc ?? ''
      } as Attachment))
      .filter(att => !!att.fileName);
  }


  checkTitleIsbnUnique(conferenceProceedingsService: ConferenceProceedingsService) {
    return (group: AbstractControl) => {
      const title = group.get('titleOfConferenceProceedings')?.value;
      const isbn = group.get('isbn')?.value;
      const currentIdRaw = group.get('id')?.value;
      const currentId = currentIdRaw === null || currentIdRaw === undefined || currentIdRaw === ''
        ? undefined
        : Number(currentIdRaw);

      if (!title || !isbn) return of(null);

      return conferenceProceedingsService.exists(
        title,
        isbn,
        Number.isFinite(currentId as number) ? currentId : undefined
      ).pipe(
        debounceTime(300),
        map((exists: boolean) => {
          return exists ? { duplicateProceedings: true } : null;
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
      this.filteredResearchFields = results;
    });
  }

  loadFaculties() {
    this.loadingFaculties = true;
    this.conferenceProceedingsService.getFaculties().subscribe({
      next: (data) => {
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


  // === Builders ===
  newAuthor(a?: Authors, affiliation = true): FormGroup {
    const resolvedAffiliation = this.asBoolean(a?.affiliation, affiliation);

    const univArray = this.fb.array(
      a?.universityAffiliations?.length
        ? a.universityAffiliations.map(u => this.fb.group({
          universityCode: [u.universityCode || '', Validators.required],
          universityName: [u.universityName || '', Validators.required],
          isUniven: [u.isUniven ?? false],
          isInternationalUniversity: [u.isInternationalUniversity ?? false]
        }))
        : []
    );

    const researchArray = this.fb.array(
      a?.researchAffiliations?.length
        ? a.researchAffiliations.map(r => this.fb.group({
          companyName: [r.companyName || '', Validators.required],
          companyType: [r.companyType || 'OTHER', Validators.required]
        }))
        : []
    );

    const authorFG = this.fb.group({
      id: [a?.id ?? null],
      affiliation: [resolvedAffiliation],
      studentEmployeeNo: [a?.studentEmployeeNo || null],
      firstName: [a?.firstName || '', Validators.required],
      surname: [a?.surname || '', Validators.required],
      initials: [a?.initials || ''],
      gender: [a?.gender ?? null as string | null],
      populationGroup: [a?.populationGroup || ''],
      dob: [a?.dob || null],
      email: [a?.email || '', [Validators.required, Validators.email]],
      facultyId: [a?.faculty ?? null],
      departmentId: [a?.department ?? null],
      orcid: [
        a?.orcid || '',
        [this.patternOptional(/^\d{4}-\d{4}-\d{4}-[\dX]{4}$/i)]
      ],
      countryOfBirth: [a?.countryOfBirth || ''],
      saResidencyStatus: [a?.saResidencyStatus || ''],
      disability: [a?.disability ?? false],

      highestQualification: [a?.highestQualification || ''],
      employmentStatus: [a?.employmentStatus || ''],
      department: [a?.department || ''],
      faculty: [a?.faculty || ''],
      academicTitle: [a?.academicTitle || ''],
      proportionOfAuthors: [null],
      authorUnitsClaimed: [null],
      authorShare: [a?.authorShare ?? 0],
      totalUnitsClaimed: [a?.totalUnitsClaimed ?? 0],
      additionalComments: [a?.additionalComments || ''],
      universityAffiliations: univArray,
      researchAffiliations: researchArray
    });

    this.updateAffiliatedValidators(authorFG, resolvedAffiliation);
    return authorFG;
  }

  updateAffiliatedValidators(authorFG: FormGroup, isAffiliated: boolean) {
    const requiredFieldsForAffiliated = ['studentEmployeeNo', 'gender', 'facultyId'];
    requiredFieldsForAffiliated.forEach(field => {
      const ctrl = authorFG.get(field);
      if (!ctrl) return;

      if (isAffiliated) {
        ctrl.setValidators([Validators.required]);
      } else {
        ctrl.setValidators([]);
        ctrl.setValue(null);
      }
      ctrl.updateValueAndValidity({ emitEvent: false });
    });
  }

  private initAuthorAffiliationHandling(authorFG: FormGroup) {
    authorFG.get('affiliation')?.valueChanges.subscribe((value) => {
      const isAffiliated = this.asBoolean(value, false);
      this.updateAffiliatedValidators(authorFG, isAffiliated);
      this.recalculateContributions();
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

  addAuthor(affiliation = true) {
    if (this.isReadOnlyView) {
      return;
    }
    const newAuthorFG = this.newAuthor(undefined, affiliation);
    this.authorsFA.push(newAuthorFG);
    this.initAuthorAffiliationHandling(newAuthorFG);
    const i = this.authorsFA.length - 1;
    this.onCountrySearch(i);
    this.recalculateContributions();
    this.calculateAdvancedUnitBreakdown();
  }

  removeAuthor(i: number) {
    if (this.isReadOnlyView) {
      return;
    }
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

    this.form.get('totalProportionOfAuthors')?.valueChanges.subscribe(() => {
      this.recalculateContributions();
      this.calculateAdvancedUnitBreakdown();
      this.cdr.markForCheck();
    });

    this.form.get('maxUnitsForPublication')?.valueChanges.subscribe(() => {
      this.recalculateContributions();
      this.calculateAdvancedUnitBreakdown();
      this.cdr.markForCheck();
    });

    this.recalculateContributions();
    this.calculateAdvancedUnitBreakdown();
    this.cdr.markForCheck();
  }

  recalculateContributions() {
    const maxUnits = Number(this.form.get('maxUnitsForPublication')?.value || 0);

    const nonAffiliatedAuthors = this.authorsFA.controls.filter(ctrl =>
      !this.asBoolean((ctrl as FormGroup).get('affiliation')?.value, false)
    );

    const totalAuthorsCount = this.authorsFA.length;
    const divisor = totalAuthorsCount > 0 ? totalAuthorsCount : 1;
    const otherAuthorsNonAffiliated = nonAffiliatedAuthors.length;

    this.form.get('authorCount')?.setValue(totalAuthorsCount, { emitEvent: false });
    this.form.get('otherAuthorsNonAffiliated')?.setValue(otherAuthorsNonAffiliated, { emitEvent: false });

    const totalProp = Number(this.form.get('totalProportionOfAuthors')?.value || 1);
    const totalUnits = maxUnits * totalProp;
    this.form.get('totalUnitsClaimed')?.setValue(totalUnits, { emitEvent: false });

    const proportion = totalAuthorsCount > 0 ? (1 / divisor) : 0;

    this.authorsFA.controls.forEach(ctrl => {
      const fg = ctrl as FormGroup;
      const isAffiliated = this.asBoolean(fg.get('affiliation')?.value, false);

      if (isAffiliated) {
        fg.get('proportionOfAuthors')?.setValue(proportion, { emitEvent: false });
        fg.get('authorUnitsClaimed')?.setValue(maxUnits * proportion, { emitEvent: false });
      } else {
        fg.get('proportionOfAuthors')?.setValue(null, { emitEvent: false });
        fg.get('authorUnitsClaimed')?.setValue(null, { emitEvent: false });
      }
    });
  }

  calculateAdvancedUnitBreakdown() {
    const maxUnits = Number(this.form.get('maxUnitsForPublication')?.value ?? 0.5) || 0.5;
    const totalProp = Number(this.form.get('totalProportionOfAuthors')?.value ?? 1) || 1;
    const totalUnits = maxUnits * totalProp;

    const allAuthorsCtrl = this.authorsFA.controls;
    const affiliatedAuthorsCtrl = allAuthorsCtrl.filter(ctrl => this.asBoolean((ctrl as FormGroup).get('affiliation')?.value, false));
    const nonAffiliatedAuthorsCtrl = allAuthorsCtrl.filter(ctrl => !this.asBoolean((ctrl as FormGroup).get('affiliation')?.value, false));

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

      const isAffiliated = this.asBoolean(fg.get('affiliation')?.value, false);

      let univAffiliations = (fg.get('universityAffiliations') as FormArray)?.getRawValue() || [];
      const researchAffiliations = (fg.get('researchAffiliations') as FormArray)?.getRawValue() || [];

      let univenClaim = 0;
      let ruleApplied = '';
      const splitDetails: { label: string; type: string; units: number; claimedByUniven: boolean }[] = [];

      if (isAffiliated) {
        const hasUniven = univAffiliations.some((u: any) => u.isUniven === true);
        if (!hasUniven) {
          univAffiliations = [{ universityName: 'UNIVEN', universityCode: 'UNIVEN', isUniven: true, isInternationalUniversity: false }, ...univAffiliations];
        }
      }

      if (!isAffiliated) {
        ruleApplied = 'Non-affiliated author: excluded from UNIVEN claim.';
      } else {
        const universityCount = univAffiliations.length;

        const hasUniven = univAffiliations.some((u: any) => u.isUniven === true);
        const hasInternational = univAffiliations.some((u: any) => u.isInternationalUniversity === true);
        const hasResearch = researchAffiliations.length > 0;

        if (hasInternational) {
          univenClaim = authorShare;
          splitDetails.push({
            label: 'UNIVEN (International Rule)',
            type: 'UNIVERSITY',
            units: authorShare,
            claimedByUniven: true
          });
          ruleApplied = 'International university affiliation: full share assigned to UNIVEN.';
        } else if (hasUniven && hasResearch && universityCount === 1) {
          univenClaim = authorShare;
          splitDetails.push({ label: 'UNIVEN', type: 'UNIVERSITY', units: authorShare, claimedByUniven: true });
          researchAffiliations.forEach((r: any) => {
            splitDetails.push({ label: r.companyName || 'Research Company', type: r.companyType || 'RESEARCH_COMPANY', units: 0, claimedByUniven: false });
          });
          ruleApplied = 'UNIVEN + Research Company: full share assigned to UNIVEN.';
        } else if (universityCount > 1) {
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
        } else if (hasUniven && universityCount === 1) {
          univenClaim = authorShare;
          splitDetails.push({ label: 'UNIVEN', type: 'UNIVERSITY', units: authorShare, claimedByUniven: true });
          ruleApplied = 'Single UNIVEN affiliation: full share claimed by UNIVEN.';
        } else {
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

  getUniversityAffiliations(authorControl: AbstractControl | null): FormArray {
    return (authorControl?.get('universityAffiliations') as FormArray) ?? this.fb.array([]);
  }

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
    setTimeout(() => {
      this.universityDropdownOpen[this.getUniversityRowKey(authorIndex, univIndex)] = false;
      this.cdr.markForCheck();
    }, 120);
  }

  onUniversitySearchChange(authorIndex: number, univIndex: number, value: string): void {
    this.universitySearchTerms[this.getUniversityRowKey(authorIndex, univIndex)] = value ?? '';
    this.openUniversityDropdown(authorIndex, univIndex);
  }

  getFilteredUniversityOptions(authorIndex: number, univIndex: number): { code: string; name: string }[] {
    const term = this.getUniversitySearchTerm(authorIndex, univIndex).trim().toLowerCase();
    if (!term) return this.saUniversityOptions;

    return this.saUniversityOptions.filter(university =>
      university.name.toLowerCase().includes(term)
      || university.code.toLowerCase().includes(term)
    );
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

  isOtherUniversitySelected(authorIndex: number, univIndex: number): boolean {
    const row = this.getUniversityAffiliations(this.authorsFA.at(authorIndex) as FormGroup).at(univIndex) as FormGroup;
    const code = String(row?.get('universityCode')?.value ?? '').trim().toUpperCase();
    return code === this.otherUniversityCode;
  }

  selectUniversityOption(authorIndex: number, univIndex: number, university: { code: string; name: string }): void {
    if (this.isReadOnlyView) {
      return;
    }
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
    if (this.isReadOnlyView) {
      return;
    }
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

  private normalizeAllUniversityAffiliations(): void {
    this.authorsFA.controls.forEach((_, authorIndex) => this.normalizeUniversityAffiliationsForAuthor(authorIndex));
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

  addUniversityAffiliation(authorIndex: number) {
    if (this.isReadOnlyView) {
      return;
    }
    const univArray = this.getUniversityAffiliations(this.authorsFA.at(authorIndex) as FormGroup);
    univArray.push(this.fb.group({
      universityCode: ['', Validators.required],
      universityName: ['', Validators.required],
      isUniven: [false],
      isInternationalUniversity: [false]
    }));
    this.normalizeUniversityAffiliationsForAuthor(authorIndex);
    this.calculateAdvancedUnitBreakdown();
    this.cdr.markForCheck();
  }

  removeUniversityAffiliation(authorIndex: number, univIndex: number) {
    if (this.isReadOnlyView) {
      return;
    }
    const univArray = this.getUniversityAffiliations(this.authorsFA.at(authorIndex) as FormGroup);
    univArray.removeAt(univIndex);
    delete this.universitySearchTerms[this.getUniversityRowKey(authorIndex, univIndex)];
    delete this.universityDropdownOpen[this.getUniversityRowKey(authorIndex, univIndex)];
    this.calculateAdvancedUnitBreakdown();
    this.cdr.markForCheck();
  }

  addResearchAffiliation(authorIndex: number) {
    if (this.isReadOnlyView) {
      return;
    }
    const resArray = this.getResearchAffiliations(this.authorsFA.at(authorIndex) as FormGroup);
    resArray.push(this.fb.group({
      companyName: ['', Validators.required],
      companyType: ['OTHER', Validators.required]
    }));
    this.calculateAdvancedUnitBreakdown();
    this.cdr.markForCheck();
  }

  removeResearchAffiliation(authorIndex: number, resIndex: number) {
    if (this.isReadOnlyView) {
      return;
    }
    const resArray = this.getResearchAffiliations(this.authorsFA.at(authorIndex) as FormGroup);
    resArray.removeAt(resIndex);
    this.calculateAdvancedUnitBreakdown();
    this.cdr.markForCheck();
  }

  isStepValid(step: number): boolean {
    if (this.isReadOnlyView) {
      return true;
    }

    switch (step) {
      case 1:
        return this.isConferenceInfoValid();
      case 2:
        return this.isAuthorsValid(true) && this.isAffiliatedAuthorsComplete();
      case 3:
        return this.isAuthorsValid(false);
      case 4:
        return this.form.valid;
      default:
        return false;
    }
  }

  private isConferenceInfoValid(): boolean {
    if (this.isReadOnlyView) {
      return true;
    }

    const fields = [
      'dhetNo',
      'year',
      'titleOfConferenceProceedings',
      'titleOfContribution',
      'publisher',
      'isbn',
      'fieldofsearch',
      'originalPhotocopy',
      'peerReviewEvidence',
      'typeOfEvidence',
      'compliesWith60Rule',
      'startDate',
      'endDate',
      'city',
      'country'
    ];

    return fields.every(field => {
      const control = this.form.get(field);
      return !!control && control.valid;
    });
  }

  private isAuthorsValid(affiliated: boolean): boolean {
    if (this.isReadOnlyView) {
      return true;
    }

    const authors = affiliated ? this.getAffiliatedAuthors() : this.getNonAffiliatedAuthors();
    if (affiliated && authors.length === 0) return false;

    return authors.every(ctrl => {
      return ctrl.get('firstName')?.valid
        && ctrl.get('surname')?.valid
        && ctrl.get('email')?.valid;
    });
  }

  private isAffiliatedAuthorsComplete(): boolean {
    if (this.isReadOnlyView) {
      return true;
    }

    const authors = this.getAffiliatedAuthors();
    return authors.every(ctrl => {
      return ctrl.get('studentEmployeeNo')?.valid
        && ctrl.get('gender')?.valid
        && ctrl.get('facultyId')?.valid;
    });
  }

  markStepAsTouched(step: number) {
    if (this.isReadOnlyView) {
      return;
    }

    if (step === 1) {
      const fields = [
        'dhetNo',
        'year',
        'titleOfConferenceProceedings',
        'titleOfContribution',
        'publisher',
        'isbn',
        'fieldofsearch',
        'originalPhotocopy',
        'peerReviewEvidence',
        'typeOfEvidence',
        'compliesWith60Rule',
        'startDate',
        'endDate',
        'city',
        'country'
      ];
      fields.forEach(f => this.form.get(f)?.markAsTouched());
      return;
    }

    if (step === 2 || step === 3) {
      const authors = step === 2 ? this.getAffiliatedAuthors() : this.getNonAffiliatedAuthors();
      authors.forEach(a => a.markAllAsTouched());
      return;
    }

    this.form.markAllAsTouched();
  }

  goToNextStep() {
    if (this.currentStep >= this.totalSteps) return;

    if (this.isStepValid(this.currentStep)) {
      this.currentStep++;
      window.scrollTo(0, 0);
      return;
    }

    this.markStepAsTouched(this.currentStep);
    Swal.fire({
      title: 'Incomplete Step',
      text: 'Please fill in all required fields before proceeding.',
      icon: 'warning'
    });
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      window.scrollTo(0, 0);
    }
  }

  goToStep(step: number) {
    if (step === this.currentStep) return;

    if (step < this.currentStep) {
      this.currentStep = step;
      window.scrollTo(0, 0);
      return;
    }

    for (let s = this.currentStep; s < step; s++) {
      if (!this.isStepValid(s)) {
        this.markStepAsTouched(s);
        Swal.fire({
          title: 'Incomplete Step',
          text: `Please complete Step ${s} before moving to Step ${step}.`,
          icon: 'warning'
        });
        return;
      }
    }

    this.currentStep = step;
    window.scrollTo(0, 0);
  }

  getAffiliatedAuthors() {
    return this.authorsFA.controls.filter(ctrl => this.asBoolean((ctrl as FormGroup).get('affiliation')?.value, false));
  }

  getNonAffiliatedAuthors() {
    return this.authorsFA.controls.filter(ctrl => !this.asBoolean((ctrl as FormGroup).get('affiliation')?.value, false));
  }

   trackByIndex(index: number): number {
     return index;
   }

  /**
   * Save current step data
   */
  saveCurrentStep() {
    if (this.isReadOnlyView) {
      return;
    }
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

    this.conferenceProceedingsService.save(payload).subscribe({
      next: (savedProceedings) => {
        this.isSaving = false;
        this.lastSavedProceedingsId = savedProceedings.id;
        this.form.get('id')?.setValue(savedProceedings.id, { emitEvent: false });
        this.form.get('dhetNo')?.setValue(savedProceedings.dhetNo, { emitEvent: false });

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
    if (this.isReadOnlyView) {
      return;
    }
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

    this.conferenceProceedingsService.save(payload).subscribe({
      next: (savedProceedings) => {
        this.isSaving = false;
        this.lastSavedProceedingsId = savedProceedings.id;
        this.form.get('id')?.setValue(savedProceedings.id, { emitEvent: false });
        this.form.get('dhetNo')?.setValue(savedProceedings.dhetNo, { emitEvent: false });

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

   // === Payload / preview / submit ===
  buildPayload(): ConferenceProceedings {
    const raw = this.form.getRawValue();

    return {
      id: raw.id ?? 0,
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
      dhetNo: raw.dhetNo,
      yearOfPublication: raw.year ? Number(raw.year) : 0,
      titleOfConferenceProceedings: raw.titleOfConferenceProceedings,
      titleOfContribution: raw.titleOfContribution,
      editors: raw.editors ?? undefined,
      publisher: raw.publisher,
      isbn: raw.isbn,
      fieldOfResearch: raw.fieldofsearch ?? null,
      originalOrPhotocopy: raw.originalPhotocopy,
      evidenceOfPeerReview: this.yesNoToBoolean(raw.peerReviewEvidence, false),
      typeOfEvidence: raw.typeOfEvidence ?? undefined,
      maxUnitsForPublication: raw.maxUnitsForPublication ? Number(raw.maxUnitsForPublication) : 0.5,
      totalProportionOfAuthors: raw.totalProportionOfAuthors ? Number(raw.totalProportionOfAuthors) : 0,
      authorCount: raw.authorCount ? Number(raw.authorCount) : 0,
      totalUnitsClaimed: raw.totalUnitsClaimed ? Number(raw.totalUnitsClaimed) : 0,
      funders: raw.funders ?? undefined,
      authors: (raw.authors as Authors[]).map(author => ({
        ...author,
        affiliation: this.asBoolean(author.affiliation, true)
      })),
      additionalComments: raw.additionalComments ?? undefined,
      compliesWith60Rule: this.normalizeComplianceValue(raw.compliesWith60Rule),
      startDate: raw.startDate,
      endDate: raw.endDate,
      city: raw.city,
      country: raw.country
    };
  }

  autoPopulateForm(): void {
    if (this.isReadOnlyView) {
      return;
    }
    this.form.patchValue({
      id: null,
      dhetNo: 'P001',
      year: '2025',
      titleOfConferenceProceedings: 'AI in Modern Conference Proceedings',
      titleOfContribution: 'AI in Modern Conference Proceedings',
      editors: 'Dr. A. Smith',
      publisher: 'Springer',
      isbn: '978-3-030-12345',
      fieldofsearch: '1.02',
      originalPhotocopy: 'O',
      peerReviewEvidence: 'Y',
      typeOfEvidence: 'Peer Reviewed',
      maxUnitsForPublication: 0.5,
      totalProportionOfAuthors: 1,
      funders: 'NRF; University Grant',
      additionalComments: 'Sample data',
      compliesWith60Rule: 'Yes',
      startDate: '2025-01-01',
      endDate: '2025-01-05',
      city: 'Johannesburg',
      country: 'South Africa'
    });

    /** Reset and populate authors */
    this.authorsFA.clear();
    const authorsData: Authors[] = [
      {
        id: null,
        affiliation: true,
        studentEmployeeNo: 'EMP001',
        firstName: 'Muthu',
        surname: 'Ramavhunga',
        initials: 'MR',
        email: 'testing@univen.ac.za',
        gender: 'MALE',
        populationGroup: 'African',
        dob: '1994-01-23',
        faculty: 1,
        department: 1,
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
      const authorFG = this.newAuthor(a);
      this.authorsFA.push(authorFG);
      this.initAuthorAffiliationHandling(authorFG);
    });
    this.authorsFA.controls.forEach((_, i) => this.onCountrySearch(i));

    this.recalculateContributions();
    this.calculateAdvancedUnitBreakdown();
  }

  preview() {
    this.previewJson = JSON.stringify(this.buildPayload(), null, 2);
    this.showPreview = true;
  }

  closePreview() {
    this.showPreview = false;
  }

  onSubmit() {
    if (this.isReadOnlyView) {
      return;
    }
    if (this.isSaving) {
      return;
    }



    const payload = this.buildPayload();
    this.isSaving = true;

debugger;
    this.conferenceProceedingsService.save(payload).subscribe({
      next: _ => {
        this.isSaving = false;

        Swal.fire({
          title: "Success",
          text: "Conference Proceedings saved successfully.",
          icon: "success"
        });
        this.router.navigate(['/proceedings']);
      },
      error: (err) => {
        this.isSaving = false;
        console.error('Error saving conference proceedings', err);

        Swal.fire({
          title: "Error",
          text: "Failed to save conference proceedings. Please try again.",
          icon: "error"
        });
      }
    });
  }

  onFacultyChange(authorIndex: number) {
    const facultyId = this.authorsFA.at(authorIndex).get('facultyId')?.value;
    if (!facultyId) return;

    this.conferenceProceedingsService.getDepartmentsByFaculty(facultyId).subscribe({
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

  isAuthorLookupLoading(index: number): boolean {
    return this.authorLookupLoading[index] === true;
  }

  onStudentEmployeeNoBlur(authorIndex: number): void {
    this.authorLookupService.performAuthorLookup(
      authorIndex,
      this.authorsFA,
      this.faculties,
      this.departmentsMap,
      this.cdr,
      this.authorLookupLoading,
      this.authorLookupErrors
    );
  }

  selectResearchField(field: any) {
    this.form.get('fieldofsearch')?.setValue(field.code); // or field.code
    this.filteredResearchFields = [];
    this.showResearchFieldDropdown = false;
  }

  openResearchFieldDropdown() {
    this.showResearchFieldDropdown = true;
  }

  hideResearchFieldDropdown() {
    setTimeout(() => {
      this.showResearchFieldDropdown = false;
    }, 200);
  }

  reset() {
    if (this.isReadOnlyView) {
      return;
    }
    this.form.reset();
    this.form.patchValue({
      maxUnitsForPublication: 0.5,
      totalProportionOfAuthors: 1,
      otherAuthorsNonAffiliated: 0,
      compliesWith60Rule: 'N/A'
    });
    this.authorsFA.clear();
    const authorFG = this.newAuthor();
    this.authorsFA.push(authorFG);
    this.initAuthorAffiliationHandling(authorFG);
    this.onCountrySearch(0);
    this.currentStep = 1;
    this.recalculateContributions();
    this.calculateAdvancedUnitBreakdown();
    this.attachments = [];
    this.fileErrors = [];
    this.newAttachmentDescription = '';
    this.fileError = '';
    this.selectedFile = null;
    this.showPreview = false;
    this.previewJson = '';
  }

  onFileSelected(event: any) {
    if (this.isReadOnlyView) {
      return;
    }
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
    if (this.isReadOnlyView) {
      return;
    }
    if (!this.selectedFile) {
      this.fileError = 'Please select a file.';
      return;
    }

    if (!this.newAttachmentDescription.trim()) {
      Swal.fire({
        title: 'Warning',
        text: 'Description is recommended.',
        icon: 'warning'
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

      this.newAttachmentDescription = '';
      this.selectedFile = null;
      this.fileError = '';
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    };
    reader.readAsDataURL(this.selectedFile);
  }

  removeAttachmentRow(index: number) {
    if (this.isReadOnlyView) {
      return;
    }
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
}

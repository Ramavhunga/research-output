import { Component } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule, MaxLengthValidator,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

import { Journal } from '../../models/journal.model';
import {
  AuthorAffiliation,
  Authors,
  ClaimingAuthorsContribution,
  Units
} from '../../models/common.model';
import {JournalService} from '../../services/journal-service';

const DOI_REGEX = /^10\.\d{4,9}\/[\-._;()/:A-Z0-9]+$/i;
const ISSN_REGEX = /^\d{4}-\d{3}[\dX]$/i;

@Component({
  selector: 'app-journal-detail-component',
  standalone: true,
  templateUrl: './journal-detail-component.html',
  styleUrl: './journal-detail-component.css',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink]
})
export class JournalDetailComponent {
  showPreview = false;
  previewJson = '';
  form: FormGroup;

  constructor(private fb: FormBuilder, private router: Router,  private journalService: JournalService) {
    debugger;

    const journal = this.router.getCurrentNavigation()?.extras.state?.['journal'] as Journal | undefined;

    this.form = this.fb.group({
      dhetNo: [{ value: journal?.dhetNo || '', disabled: true }],
      year: [journal?.year || '', [Validators.required]],
      title: [journal?.title || '', [Validators.required]],
      articleTitle: [journal?.['title'] || ''],
      publisher: [journal?.publisher || '', Validators.required],
      index: [journal?.index || ''],
      comply: [journal?.comply ?? null, Validators.required],
      volume: [journal?.volume ?? null],
      issue: [journal?.issue ?? null],
      issn: [journal?.issn || '', [this.patternOptional(ISSN_REGEX)]],
      eSsn: [journal?.eSsn || ''],
      doi: [journal?.doi || '', [this.patternOptional(DOI_REGEX)]],

      authors: this.fb.array(
        (journal?.authors && journal.authors.length
            ? journal.authors
            : [{} as Authors]
        ).map((a: Authors | undefined) => this.newAuthor(a))
      ),

      // Units as a single FormGroup, not a list
      units: this.fb.group({
        maxUnitsForPublication: [journal?.units?.maxUnitsForPublication ?? null, Validators.required],
        totalProportionOfAuthors: [journal?.units?.totalProportionOfAuthors ?? 1],
        authorsCount: [journal?.units?.authorsCount ?? 1],
        totalUnitsClaimed: [journal?.units?.totalUnitsClaimed ?? null],
        otherAuthorsNonAffiliates: [journal?.units?.otherAuthorsNonAffiliates || ''],
        additionalComments: [journal?.units?.additionalComments || ''],
      }),



      claimingAuthorsContribution: this.fb.group({
        proportionOfAuthors: [journal?.claimingAuthorsContribution?.proportionOfAuthors ?? null],
        authorUnitsClaimed: [journal?.claimingAuthorsContribution?.authorUnitsClaimed ?? null],
        additionalComments: [journal?.claimingAuthorsContribution?.additionalComments || ''],
      }),
    });

    this.setupAutoCalc();
  }

  // === Getters ===
  get authorsFA(): FormArray {
    return this.form.get('authors') as FormArray;
  }

  get unitsFG(): FormGroup {
    return this.form.get('units') as FormGroup;
  }

  get authorAffiliationFG(): FormGroup {
    return this.form.get('authorAffiliation') as FormGroup;
  }

  get claimingAuthorsContributionFG(): FormGroup {
    return this.form.get('claimingAuthorsContribution') as FormGroup;
  }

  // === Builders ===
  newAuthor(a?: Authors): FormGroup {
    return this.fb.group({
      id: [a?.id ?? null],
      studentEmployeeNo: [a?.studentEmployeeNo || '', Validators.required],
      firstName: [a?.firstName || '', Validators.required],
      surname: [a?.surname || '', Validators.required],
      initials: [a?.initials || ''],
      gender: [a?.gender ?? null as string | null, Validators.required],
      populationGroup: [a?.populationGroup || ''],
      dob: [a?.dob || ''], // you can later enforce a date pattern if you want

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
    });
  }


  // === Utils ===
  patternOptional(rx: RegExp) {
    return (control: FormControl) => {
      const val = (control.value || '').trim();
      return !val || rx.test(val) ? null : { pattern: true };
    };
  }

  addAuthor() {
    this.authorsFA.push(this.newAuthor());
    this.recalculateContributions();
  }

  removeAuthor(i: number) {
    this.authorsFA.removeAt(i);
    this.recalculateContributions();
  }

  // === Auto-calculation logic ===
  setupAutoCalc() {
    this.authorsFA.valueChanges.subscribe(() => this.recalculateContributions());
    this.unitsFG.valueChanges.subscribe(() => this.recalculateContributions());
    this.recalculateContributions();
  }

  recalculateContributions() {
    const unitsFG = this.unitsFG;
    if (!unitsFG) return;

    const maxUnits = unitsFG.get('maxUnitsForPublication')?.value || 0;
    const authorsCount = this.authorsFA.length || 1;

    unitsFG.get('authorsCount')?.setValue(authorsCount, { emitEvent: false });

    const totalPropCtrl = unitsFG.get('totalProportionOfAuthors');
    const totalProp = totalPropCtrl?.value || 1;

    const totalUnits = maxUnits * totalProp;
    unitsFG.get('totalUnitsClaimed')?.setValue(totalUnits, { emitEvent: false });

    const proportion = 1 / authorsCount;

    this.authorsFA.controls.forEach(ctrl => {
      const fg = ctrl as FormGroup;
      fg.get('proportionOfAuthors')?.setValue(proportion, { emitEvent: false });
      fg.get('authorUnitsClaimed')?.setValue(maxUnits * proportion, { emitEvent: false });
    });

    this.claimingAuthorsContributionFG.get('proportionOfAuthors')
      ?.setValue(proportion, { emitEvent: false });
    this.claimingAuthorsContributionFG.get('authorUnitsClaimed')
      ?.setValue(maxUnits * proportion, { emitEvent: false });
  }

  // === Payload / preview / submit ===
  buildPayload(): Journal {
    const raw = this.form.getRawValue();

    return {
      id: (raw as any).id ?? 0,
      dhetNo: raw.dhetNo,
      year: raw.year,
      title: raw.title,
      publisher: raw.publisher,
      index: raw.index,
      comply: raw.comply,
      volume: raw.volume,
      issue: raw.issue,
      issn: raw.issn,
      eSsn: raw.eSsn,
      doi: raw.doi,
      authors: raw.authors as Authors[],
      units: raw.units as Units,
      claimingAuthorsContribution: raw.claimingAuthorsContribution as ClaimingAuthorsContribution
    };
  }

  preview() {
    this.previewJson = JSON.stringify(this.buildPayload(), null, 2);
    this.showPreview = true;
  }

  closePreview() {
    this.showPreview = false;
  }

  onSubmit() {

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      //return;
    }

    const payload = this.buildPayload();
    // optionally show preview before save
    console.log('Journal submit payload', payload);

    this.journalService.save(payload).subscribe({
      next: saved => {
        console.log('Saved journal', saved);
        // show toast / navigate
        alert('Journal saved successfully.');
        // this.router.navigate(['/journal']);
      },
      error: err => {
        console.error('Error saving journal', err);
        alert('Failed to save journal. Please try again.');
      }
    });
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
  }

  protected readonly MaxLengthValidator = MaxLengthValidator;
}

import {Component} from '@angular/core';
import {FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {NgIf} from '@angular/common';
import { CommonModule } from '@angular/common';
import {Router, RouterLink} from '@angular/router';


const DOI_REGEX = /^10\.\d{4,9}\/[\-._;()/:A-Z0-9]+$/i;
const ISSN_REGEX = /^\d{4}-\d{3}[\dX]$/i;

@Component({
  selector: 'app-research-output-detail-component',
  imports: [ReactiveFormsModule, NgIf, CommonModule, RouterLink],
  templateUrl: './research-output-detail-component.html',
  styleUrl: './research-output-detail-component.css'
})
export class ResearchOutputDetailComponent {
  showPreview = false;
  previewJson = '';
  form: FormGroup;


  constructor(private fb: FormBuilder, private router: Router) {
    const output = this.router.getCurrentNavigation()?.extras.state?.['output'];
    this.form = this.fb.group({
      title: [output?.title || '', [Validators.required, Validators.minLength(5)]],
      outputType: [output?.outputType || '', Validators.required],
      otherType: [output?.otherType || ''],
      year: [output?.year ?? null, [Validators.required, Validators.min(1900), Validators.max(2100)]],
      doi: [output?.doi || '', [this.patternOptional(DOI_REGEX)]],
      url: [output?.url || ''],
      authors: this.fb.array(
        output?.authors?.length
          ? output.authors.map((a: any) =>
              this.fb.group({
                name: [a.name || '', Validators.required],
                orcid: [a.orcid || '', [this.patternOptional(/^\d{4}-\d{4}-\d{4}-[\dX]{4}$/i)]],
                affiliation: [a.affiliation || ''],
              })
            )
          : [this.newAuthor()]
      ),
      outlet: this.fb.group({
        name: [output?.outlet?.name || ''],
        issn: [output?.outlet?.issn || '', [this.patternOptional(ISSN_REGEX)]],
        isbn: [output?.outlet?.isbn || ''],
        volume: [output?.outlet?.volume || ''],
        issue: [output?.outlet?.issue || ''],
        pages: [output?.outlet?.pages || ''],
        publicationDate: [output?.outlet?.publicationDate || ''],
      }),
      access: this.fb.group({
        openAccess: [output?.access?.openAccess ?? null, Validators.required],
        embargoEndDate: [output?.access?.embargoEndDate || ''],
        peerReviewed: [output?.access?.peerReviewed ?? false],
        indexing: this.fb.group({
          scopus: [output?.access?.indexing?.scopus ?? false],
          webOfScience: [output?.access?.indexing?.webOfScience ?? false],
          ibss: [output?.access?.indexing?.ibss ?? false],
          dhetAccredited: [output?.access?.indexing?.dhetAccredited ?? false],
        }),
        dhetYear: [output?.access?.dhetYear || ''],
      }),
      funding: this.fb.group({
        funder: [output?.funding?.funder || ''],
        grantNumber: [output?.funding?.grantNumber || ''],
      }),
      keywords: this.fb.array<string>(output?.keywords || []),
      abstractText: [output?.abstractText || '', [Validators.maxLength(2000)]],
      attachment: [null],
    });
  }




  get authorsFA() { return this.form.get('authors') as FormArray; }
  get keywordsFA() { return this.form.get('keywords') as FormArray; }
  get accessFG() { return this.form.get('access') as FormGroup; }
  get outletFG() { return this.form.get('outlet') as FormGroup; }

  newAuthor() {
    return this.fb.group({
      name: ['', Validators.required],
      orcid: ['', [this.patternOptional(/^\d{4}-\d{4}-\d{4}-[\dX]{4}$/i)]],
      affiliation: [''],
    });
  }

  patternOptional(rx: RegExp) {
    return (control: FormControl) => {
      const val = (control.value || '').trim();
      return !val || rx.test(val) ? null : { pattern: true };
    };
  }

  get fundingGroup(): FormGroup {
    return this.form.get('funding') as FormGroup;
  }

  get indexingGroup(): FormGroup {
    let accessForm  = this.form.get('access') as FormGroup
    return accessForm.get('indexing') as FormGroup;
  }

  onOutputTypeChange() {
    const other = this.form.get('otherType');
    if (this.form.get('outputType')?.value === 'Other') {
      other?.addValidators([Validators.required]);
    } else {
      other?.clearValidators();
      other?.setValue('');
    }
    other?.updateValueAndValidity();
  }

  onOpenAccessChange() {
    const embargo = this.accessFG.get('embargoEndDate');
    if (this.accessFG.get('openAccess')?.value !== 'Yes') {
      embargo?.setValue('');
    }
  }

  onIdxDhetChange() {
    const dhetYear = this.accessFG.get('dhetYear');
    if (this.accessFG.get('indexing.DHET Accredited')?.value) {
      dhetYear?.addValidators([Validators.required]);
    } else {
      dhetYear?.clearValidators();
      dhetYear?.setValue('');
    }
    dhetYear?.updateValueAndValidity();
  }

  addAuthor() { this.authorsFA.push(this.newAuthor()); }
  removeAuthor(i: number) { this.authorsFA.removeAt(i); }

  addKeywordFromInput(ev: KeyboardEvent) {
    const input = ev.target as HTMLInputElement;
    const val = input.value.trim().replace(/,$/, '');
    if ((ev.key === 'Enter' || ev.key === ',') && val) {
      ev.preventDefault();
      this.keywordsFA.push(new FormControl(val));
      input.value = '';
    }
  }
  removeKeyword(i: number) { this.keywordsFA.removeAt(i); }

  onFileSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || file.size > 20 * 1024 * 1024 || file.type !== 'application/pdf') {
      alert(file ? 'Invalid file.' : 'File is larger than 20MB.');
      input.value = '';
      this.form.get('attachment')?.setValue(null);
      return;
    }
    this.form.get('attachment')?.setValue(file);
  }

  reset() {
    this.form.reset();
    this.authorsFA.clear();
    this.authorsFA.push(this.newAuthor());
    this.keywordsFA.clear();
    this.previewJson = '';
    this.showPreview = false;
  }

  buildPayload() {
    const v = this.form.value;
    return {
      ...v,
      authors: v.authors.filter((a: any) => a?.name),
      access: {
        ...v.access,
        indexing: Object.keys(v.access.indexing).filter(k => v.access.indexing[k]),
      },
      attachment: v.attachment ? {
        name: v.attachment.name,
        size: v.attachment.size,
        type: v.attachment.type,
      } : null,
    };
  }

  preview() {
    this.previewJson = JSON.stringify(this.buildPayload(), null, 2);
    this.showPreview = true;
  }

  closePreview() { this.showPreview = false; }

  onSubmit() {
    console.log('Submit payload', this.buildPayload());
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    console.log('Submit payload', this.buildPayload());
    alert('Demo submit. Open Preview to see the JSON payload.');
  }
}

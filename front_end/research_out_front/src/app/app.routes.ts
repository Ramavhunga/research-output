import { Routes } from '@angular/router';
import {LoginComponent} from './components/login-component/login-component';
import {HomeComponent} from './components/home-component/home-component';
import {ResearchOutputComponent} from './components/research-output/research-output';
import {
  ResearchOutputDetailComponent
} from './components/research-output-detail-component/research-output-detail-component';
import {DashboardComponent} from './components/dashboard-component/dashboard-component';
import {AuthGuard} from './guards/auth.guard';
import {ManageSubmissionsComponents} from './components/manage-submissions-components/manage-submissions-components';
import {
  ManageSubmissionDetailsComponents
} from './components/manage-submission-details-components/manage-submission-details-components';
import {JournalComponent} from './components/journal-component/journal-component';
import {JournalDetailComponent} from './components/journal-detail-component/journal-detail-component';
import {BooksFieldsComponent} from './components/books-fields-component/books-fields-component';
import {BooksFieldsDetailComponent} from './components/books-fields-detail-component/books-fields-detail-component';
import {ChapterComponent} from './components/chapter-component/chapter-component';
import {ChapterDetailComponent} from './components/chapter-detail-component/chapter-detail-component';
import {
  ConferenceProceedingsComponent
} from './components/conference-proceedings-component/conference-proceedings-component';
import {
  ConferenceProceedingsDetailComponent
} from './components/conference-proceedings-detail-component/conference-proceedings-detail-component';
import { JournalReviewComponent } from './components/journal-review-component/journal-review-component';
import { RoleAssignmentComponent } from './components/role-assignment-component/role-assignment-component';


export const routes: Routes = [
    { path: 'login', component: LoginComponent },
      {
        path: '',
        component: HomeComponent,
        //canActivate: [AuthGuard],
        children: [
          { path: 'login', redirectTo: 'login', pathMatch: 'full' },
          { path: 'dashboard', component: DashboardComponent },
          { path: 'manage-submissions', component: ManageSubmissionsComponents },
          { path: 'manage-submissions/details', component: ManageSubmissionDetailsComponents },
          { path: 'research-output', component: ResearchOutputComponent },
          { path: 'research-output/create', component: ResearchOutputDetailComponent },
          { path: 'journal', component: JournalComponent },
          { path: 'journal/details', component: JournalDetailComponent},
          {
            path: 'journal/review',
            component: JournalReviewComponent,
            canActivate: [AuthGuard],
            data: { roles: ['ADMIN', 'REVIEWER_LEVEL_1', 'REVIEWER_LEVEL_2'] }
          },
          {
            path: 'admin/roles',
            component: RoleAssignmentComponent,
            canActivate: [AuthGuard],
            data: { roles: ['ADMIN'] }
          },
          { path: 'books', component: BooksFieldsComponent },
          { path: 'book/details', component: BooksFieldsDetailComponent},
          { path: 'chapters', component: ChapterComponent },
          { path: 'chapter/chapterdetails', component: ChapterDetailComponent},
          { path: 'proceedings', component: ConferenceProceedingsComponent },
          { path: 'proceeding/conferenceproceedingsdetails', component: ConferenceProceedingsDetailComponent}

        ]
      }
    ];

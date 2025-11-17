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


export const routes: Routes = [
   //   { path: 'login', component: LoginComponent },
      {
        path: '',
        component: HomeComponent,
        //canActivate: [AuthGuard],
        children: [
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
          { path: 'dashboard', component: DashboardComponent },
          { path: 'manage-submissions', component: ManageSubmissionsComponents },
          { path: 'manage-submissions/details', component: ManageSubmissionDetailsComponents },
          { path: 'research-output', component: ResearchOutputComponent },
          { path: 'research-output/create', component: ResearchOutputDetailComponent },
          { path: 'journal', component: JournalComponent },
          { path: 'journal/details', component: JournalDetailComponent}

        ]
      }
    ];

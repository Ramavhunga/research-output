import { Routes } from '@angular/router';
import {LoginComponent} from './components/login-component/login-component';
import {HomeComponent} from './components/home-component/home-component';
import {ResearchOutputComponent} from './components/research-output/research-output';
import {
  ResearchOutputDetailComponent
} from './components/research-output-detail-component/research-output-detail-component';
import {DashboardComponent} from './components/dashboard-component/dashboard-component';


export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: HomeComponent,
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'research-output', component: ResearchOutputComponent },
      { path: 'research-output/create', component: ResearchOutputDetailComponent }
    ]
  }
];

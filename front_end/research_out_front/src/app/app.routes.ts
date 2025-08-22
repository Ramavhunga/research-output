import { Routes } from '@angular/router';
import {LoginComponent} from './components/login-component/login-component';
import {HomeComponent} from './components/home-component/home-component';
import {ResearchOutputComponent} from './components/research-output/research-output';
import {
  ResearchOutputDetailComponent
} from './components/research-output-detail-component/research-output-detail-component';


export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    { path: 'home', component: HomeComponent },
    { path: 'research-outputs', component: ResearchOutputComponent },
    { path: 'research-outputs/create', component: ResearchOutputDetailComponent },
    { path: 'clients', loadChildren: () => import('./components/clients/clients.module').then(m => m.ClientsModule) }
  ];

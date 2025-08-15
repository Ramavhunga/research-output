import { Routes } from '@angular/router';
import {LoginComponent} from './components/login-component/login-component';


export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'clients', loadChildren: () => import('./clients/clients.module').then(m => m.ClientsModule) }
];

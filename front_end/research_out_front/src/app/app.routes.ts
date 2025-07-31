import { Routes } from '@angular/router';
import {LoginComponent} from './components/login-component/login-component';
import {HomeComponent} from './components/home-component/home-component';
import {ResearchOutputComponent} from './components/research-output/research-output';


export const routes: Routes = [
  {path: '', redirectTo: '/login', pathMatch: 'full' },
  {path:'login', component: LoginComponent},
  {path:'home', component: HomeComponent},
  {path:'research', component:ResearchOutputComponent}
];

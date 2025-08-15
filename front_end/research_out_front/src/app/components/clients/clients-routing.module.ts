import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {HomeComponent} from '../home-component/home-component';
import {ResearchOutputComponent} from '../research-output/research-output';
import {DashboardComponent} from '../dashboard-component/dashboard-component';

const routes: Routes = [
        {
          path: '',
          component: HomeComponent,
          children: [
            { path: '', component: DashboardComponent },
            { path: 'research-output', component: ResearchOutputComponent },
            { path: 'research-output/create', component: ResearchOutputComponent }
          ]
        }
      ];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ClientsRoutingModule { }

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AssignComponent } from './assign/assign.component';
import { AssingIndividualComponent } from './assign/assing-individual/assing-individual.component'
import { AssingMassiveComponent } from './assign/assing-massive/assing-massive.component';

const routes: Routes = [
  { path: '', component: AssignComponent },
  { path: 'admin', component: AssignComponent },
  { path: 'individual', component: AssingIndividualComponent },
  { path: 'massive', component: AssingMassiveComponent },

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AssignRoutingModule { }

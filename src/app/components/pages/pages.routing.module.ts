import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { StatusConciliationComponent } from './status-conciliation/status-conciliation.component';

const routes: Routes = [
  { path: 'service',loadChildren: () => import('./services/services.module').then(x => x.ServicesModule)}, 
  { path: 'myService',loadChildren: () => import('./my-services/my-services.module').then(x => x.MyServicesModule)}, 
  { path: 'assign',loadChildren: () => import('./assign/assign.module').then(x => x.AssignModule)}, 
  { path: 'statusConciliation', component: StatusConciliationComponent },
  { path: 'generateqr', loadChildren: () => import('./GenerateQR/generateqr.module').then(x => x.GenerateQRModule) },
  { path: 'GenerateQR', loadChildren: () => import('./GenerateQR/generateqr.module').then(x => x.GenerateQRModule) },
];


@NgModule({
  declarations: [],
  imports: [RouterModule.forChild(routes)], 
  exports: [RouterModule]
})
export class PagesRoutingModule { }


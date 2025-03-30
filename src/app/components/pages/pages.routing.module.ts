import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: 'service',loadChildren: () => import('./services/services.module').then(x => x.ServicesModule)}, 
  { path: 'myService',loadChildren: () => import('./my-services/my-services.module').then(x => x.MyServicesModule)}, 
  { path: 'assign',loadChildren: () => import('./assign/assign.module').then(x => x.AssignModule)}, 
];


@NgModule({
  declarations: [],
  imports: [RouterModule.forChild(routes)], 
  exports: [RouterModule]
})
export class PagesRoutingModule { }


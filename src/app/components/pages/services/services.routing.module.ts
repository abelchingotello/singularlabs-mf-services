import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NewServiceComponent } from './new-service/new-service.component';
import { ServicesComponent } from './services.component';

const routes: Routes = [
  { path: '', component: ServicesComponent },
  { path: 'add', component: NewServiceComponent },
  { path: 'edit/:id', component: NewServiceComponent },

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ServicesRoutingModule { 
}

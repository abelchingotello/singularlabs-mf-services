import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NewServiceComponent } from './new-service/new-service.component';
import { ServicesComponent } from './services.component';
import { DetailServiceComponent } from './detail-service/detail-service.component';
import { PaymentServiceComponent } from './payment-service/payment-service.component';
import { ImportServicesComponent } from './import-service/import-services.component';

const routes: Routes = [
  { path: '', component: ServicesComponent },
  { path: 'add', component: NewServiceComponent,
  data: { mode: 'create' } },
 // { path: 'import', component: ImportServicesComponent },
  { path: 'import/:value', component: ImportServicesComponent },
  { path: 'edit/:id', component: NewServiceComponent,
  data: { mode: 'edit' } },
  {
    path: 'advanced/:id',
    component: NewServiceComponent,
    data: { mode: 'advanced' }
  },
  { path: 'detail', component: DetailServiceComponent },
  { path: 'payment', component: PaymentServiceComponent },

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ServicesRoutingModule { 
}

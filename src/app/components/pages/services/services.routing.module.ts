import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NewServiceComponent } from './new-service/new-service.component';
import { ServicesComponent } from './services.component';
import { DetailServiceComponent } from './detail-service/detail-service.component';
import { PaymentServiceComponent } from './payment-service/payment-service.component';

const routes: Routes = [
  { path: '', component: ServicesComponent },
  { path: 'add', component: NewServiceComponent },
  { path: 'edit/:id', component: NewServiceComponent },
  { path: 'detail', component: DetailServiceComponent },
  { path: 'payment', component: PaymentServiceComponent },

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ServicesRoutingModule { 
}

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NewServiceComponent } from './new-service/new-service.component';
import { ServicesRoutingModule } from './services.routing.module';
import { MaterialModule } from 'src/app/modules/material/material.module';
import { LibraryModule } from '../../library/library.module';
import { ReactiveFormsModule } from '@angular/forms';
import { ServicesComponent } from './services.component';
import { DetailServiceComponent } from './detail-service/detail-service.component';
import { PaymentServiceComponent } from './payment-service/payment-service.component';



@NgModule({
  declarations: [
    NewServiceComponent,
    ServicesComponent,
    DetailServiceComponent,
    PaymentServiceComponent
  ],
  imports: [
    CommonModule,
    ServicesRoutingModule,
    MaterialModule,
    LibraryModule,
    ReactiveFormsModule,

  ]
})
export class ServicesModule { }

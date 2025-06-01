import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MyServicesRoutingModule } from './my-services-routing.module';
import { MyServicesComponent } from './my-services/my-services.component';
import { LibraryModule } from '../../library/library.module';
import { MaterialModule } from 'src/app/modules/material/material.module';


@NgModule({
  declarations: [
    MyServicesComponent
  ],
  imports: [
    CommonModule,
    MyServicesRoutingModule,
    LibraryModule,
    MaterialModule
  ]
})
export class MyServicesModule { }

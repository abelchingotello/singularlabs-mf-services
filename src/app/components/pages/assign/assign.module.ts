import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AssignRoutingModule } from './assign-routing.module';
import { AssignComponent } from './assign/assign.component';
import { MaterialModule } from 'src/app/modules/material/material.module';
import { LibraryModule } from "../../library/library.module";
import { ReactiveFormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    AssignComponent
  ],
  imports: [
    CommonModule,
    AssignRoutingModule,
    MaterialModule,
    LibraryModule,
    ReactiveFormsModule
]
})
export class AssignModule { }

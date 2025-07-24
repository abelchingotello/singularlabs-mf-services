import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { AssignRoutingModule } from './assign-routing.module';
import { AssignComponent } from './assign/assign.component';
import { MaterialModule } from 'src/app/modules/material/material.module';
import { LibraryModule } from "../../library/library.module";
import { ReactiveFormsModule } from '@angular/forms';
import { AssingIndividualComponent } from './assign/assing-individual/assing-individual.component';
import { AssingMassiveComponent } from './assign/assing-massive/assing-massive.component';


@NgModule({
  declarations: [
    AssignComponent,
    AssingIndividualComponent,
    AssingMassiveComponent
  ],
  imports: [
    CommonModule,
    AssignRoutingModule,
    MaterialModule,
    LibraryModule,
    ReactiveFormsModule,
    FormsModule
]
})
export class AssignModule { }

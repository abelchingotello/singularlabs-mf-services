import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GenerateQR } from './generateqr.component';

const routes: Routes = [
  { path: '', component: GenerateQR },

 // { path: 'import', component: ImportServicesComponent },


];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GenerateQRRoutingModule { 
}

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GenerateQR } from './generateqr.component';
import { GenerateQrReportsComponent } from './reports/generateqr-reports.component';

const routes: Routes = [
  { path: 'generate', component: GenerateQR },
  { path: 'reports', component: GenerateQrReportsComponent },

 // { path: 'import', component: ImportServicesComponent },


];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GenerateQRRoutingModule { 
}

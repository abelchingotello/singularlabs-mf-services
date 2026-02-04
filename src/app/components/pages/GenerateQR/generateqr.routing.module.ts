import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GenerateQR } from './generateqr.component';
import { GenerateQrReportsComponent } from './reports/generateqr-reports.component';
import { GenerateQrReprocesamientoPagosComponent } from './reprocesamiento-pagos/generateqr-reprocesamiento-pagos.component';

const routes: Routes = [
  { path: '', component: GenerateQR },
  { path: 'generate', component: GenerateQR },
  { path: 'reports', component: GenerateQrReportsComponent },
  { path: 'reprocesamiento-pagos', component: GenerateQrReprocesamientoPagosComponent },

 // { path: 'import', component: ImportServicesComponent },


];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GenerateQRRoutingModule { 
}

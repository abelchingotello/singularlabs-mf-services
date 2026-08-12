import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GenerateQR } from './generateqr.component';
import { GenerateQrReportsComponent } from './reports/generateqr-reports.component';
import { GenerateQrReprocesamientoPagosComponent } from './reprocesamiento-pagos/generateqr-reprocesamiento-pagos.component';
import { GenerateQrSftpServiciosComponent } from './sftp-servicios/generateqr-sftp-servicios.component';
import { GenerateQrDashboardComponent } from './dashboard/dashboard.component';
import { AssingIndividualComponent } from '../assign/assign/assing-individual/assing-individual.component';

const routes: Routes = [
  { path: '', component: GenerateQR },
  { path: 'generate', component: GenerateQR },
  { path: 'reports', component: GenerateQrReportsComponent, data: { reportMode: 'internal' } },
  { path: 'myreports', component: GenerateQrReportsComponent, data: { reportMode: 'external' } },
  { path: 'reportdaily', component: GenerateQrDashboardComponent },
  { path: 'reprocesamiento-pagos', component: GenerateQrReprocesamientoPagosComponent },
  { path: 'sftp-servicios', component: GenerateQrSftpServiciosComponent },
  { path: 'assign', component: AssingIndividualComponent },

  // { path: 'import', component: ImportServicesComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GenerateQRRoutingModule {
}

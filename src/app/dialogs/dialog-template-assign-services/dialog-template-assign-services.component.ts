import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MytoastrService } from 'src/app/services/mytoastr';
import { ServicesService } from 'src/app/services/services.service';
import { SpinnerService } from 'src/app/services/spinner.service';

@Component({
  selector: 'uni-dialog-template-assign-services',
  templateUrl: './dialog-template-assign-services.component.html',
  styleUrls: ['./dialog-template-assign-services.component.scss']
})
export class DialogTemplateAssignServiceComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<DialogTemplateAssignServiceComponent>,
    private readonly service: ServicesService,
    private readonly spinner: SpinnerService,
    private readonly mytoastr: MytoastrService
  ) { }

  ngOnInit(): void {
    console.log("respuesta de servicio")
  }

  download() {
    this.spinner.spinnerOnOff();



    const inbx = 'template_assign_services';
    const token = localStorage.getItem('fcmToken');
    this.service.exportServices("xlsx", { status: "HABILITADO" }, inbx, token).subscribe({
      next: (response) => {
        this.spinner.spinnerOnOff();
        if (response.statusCode === 200) {
          this.mytoastr.showWarning('', 'Procesando Archivo...')
        } else {
          this.mytoastr.showError('', 'Error al enviar la solicitud')
        }
      },
      error: (error) => {
        this.spinner.spinnerOnOff();
        console.error('Error durante la exportación:', error);
        this.mytoastr.showError('Error durante la exportación', '');
      }
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

}

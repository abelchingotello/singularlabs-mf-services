import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MytoastrService } from 'src/app/services/mytoastr';

@Component({
    selector: 'uni-new-service',
    templateUrl: './new-service.component.html',
    styleUrls: ['./new-service.component.scss']
})
export class NewServiceComponent implements OnInit {
    public serviceForm!: FormGroup;
    public idService: string
    constructor(
        private router: Router,
        private fb: FormBuilder,
        private readonly activeRouter: ActivatedRoute,
        private mytoastr: MytoastrService
    ) { }

    ngOnInit(): void {
        this.idService = this.activeRouter.snapshot.params['id'];
        console.log("ID: ", this.idService)
        this.initializeFormGroup();
    }

    initializeFormGroup() {
        this.serviceForm = this.fb.group({
            //   service_id: ['', Validators.required],
            service_name: [''],
            service_category: [''],
            service_type: ['', Validators.required],
            service_type_business: ['', Validators.required],
            service_state: ['', Validators.required],
            service_type_comision: ['', Validators.required],
            service_comision: ['', Validators.required],
            service_zone: ['', Validators.required],
        });

    }
    
    saveService() {
        if (!this.idService) {

            console.log("FORMULARIO : ",this.serviceForm.value)
            return



            this.mytoastr.showSuccess('Guardado correctamente', '')
            this.router.navigate(['/service'])
        } else {
            this.updateService();
        }
    }
    
    updateService() {
        this.mytoastr.showSuccess('Actualizado correctamente', '')
        this.router.navigate(['/service'])
    }

    indicatorValue(event){
        console.log("EVENTO SELECCIONADO : ",event.value)
    }



    indicators = [
        {
            "id": "PAY_BILL",
            "name": "BASE DE DATOS",
            "isActive": true
        },
        {
            "id": "PAY_PARTIAL",
            "name": "PAGO PARCIAL",
            "isActive": false
        },
        {
            "id": "PAY_CARD",
            "name": "PAGO CON TARJETA",
            "isActive": true
        },
        {
            "id": "FREQUENT_OPERATION",
            "name": "OPERACION FRECUENTE",
            "isActive": true
        },
        {
            "id": "PAY_DEBT_OLDEST",
            "name": "DEUDA MAS ANTIGUA",
            "isActive": false
        },
        {
            "id": "PAY_ONLINE",
            "name": "INTERCONECTADO, PAGO EN LINEA",
            "isActive": false
        },
        {
            "id": "PAY_ACCOUNT",
            "name": "PAGO CON CARGO EN CUENTA",
            "isActive": true
        },
        {
            "id": "PAY_REFLECTED",
            "name": "REFLEJO DE PAGO",
            "isActive": false
        },
        {
            "id": "PAY_AUTOMATIC",
            "name": "DEBITO AUTOMATICO",
            "isActive": true
        },
        {
            "id": "PAY_FIXED_RATE",
            "name": "TASAS FIJAS",
            "isActive": false
        },
        {
            "id": "PAY_CASH",
            "name": "PAGO EN EFECTIVO",
            "isActive": true
        },
        {
            "id": "PAY_CHECK_INTERNAL",
            "name": "PAGO CON CHEQUE PROPIO BANCO",
            "isActive": true
        },
        {
            "id": "PAY_CHECK_EXTERNAL",
            "name": "PAGO CON CHEQUE OTRO BANCO",
            "isActive": true
        },
        {
            "id": "PAY_MULTIPLE_PAYMENTS",
            "name": "ACTUALIZACION MASIVA DE DEUDAS",
            "isActive": false
        }
    ]





}

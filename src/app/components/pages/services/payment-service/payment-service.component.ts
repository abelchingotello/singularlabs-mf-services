import { Component, OnInit } from '@angular/core';
import { ServicesService } from 'src/app/services/services.service';

@Component({
  selector: 'uni-payment-service',
  templateUrl: './payment-service.component.html',
  styleUrls: ['./payment-service.component.scss']
})
export class PaymentServiceComponent implements OnInit {

  public nameTit : string;
  public suministro : string ;
  public money: number;
  public data1 = [
    {
        "valor": "AF00802",
        "titular": "ASMAT FLORES YRUA YANIRA",
        "id": "2000123001PENSION DICIEMBRE 2000                ",
        "number": "2000123001PENSION DICIEMBRE 2000                ",
        "fechaVencimiento": "2024-10-04",
        "monto": 5658.91,
        "moneda": "PEN ",
        "tipoMonto": "IMPORTE DEUDA TOTAL",
        "ers": "BBVA"
    },
    {
        "valor": "AF00802",
        "titular": "ASMAT FLORES YRUA YANIRA",
        "id": "2000123001PENSION DICIEMBRE 2000                ",
        "number": "2000123001PENSION DICIEMBRE 2000                ",
        "fechaVencimiento": "2024-10-04",
        "monto": 5658.91,
        "moneda": "PEN",
        "tipoMonto": "IMPORTE DEUDA TOTAL",
        "ers": "BBVA"
    },
]
public payment = {
  valor: 'AF00802',
  titular: 'ASMAT FLORES YRUA YANIRA',
  id: '2000123001PENSION DICIEMBRE 2000',
  number: '',
  fechaVencimiento: '2024-10-04',
  monto: 10000,
  moneda: 'PEN',
  tipoMonto: 'IMPORTE DEUDA',
  ers: 'BBVA'
}

  constructor(
    private service : ServicesService
  ) { }


  ngOnInit(): void {
    
    this.service.servicePayment.subscribe(
      (data)=>{
        console.log("data de pago:" ,data)
        this.nameTit = this.data1[0].titular;
        this.suministro = this.data1[0].valor;
        this.money = this.data1[0].monto
      }
    )
  }

}

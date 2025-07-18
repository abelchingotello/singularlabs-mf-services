import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';


@Component({
  selector: 'uni-assign',
  templateUrl: './assign.component.html',
  styleUrls: ['./assign.component.scss']
})
export class AssignComponent implements OnInit {
  constructor(
    private router: Router,
  ) { }

  ngOnInit(): void {
  }


  //Redireccionar a asignación individual(1) o masiva(2)
  redirectAsign(type: number) {
    if (type === 1) {
      this.router.navigate(['../assign/individual']);
    } else if (type === 2) {
      this.router.navigate(['../assign/massive']);
    }

  }
}

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
@Component({
  selector: 'icons-type',
  templateUrl: './icons_type.component.html',
  styleUrls: ['./icons_type.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
  ]
})
export class IconTypeComponent {
  @Input() type: string;
  @Input() priority: string;
  @Input() bg: boolean = true;
}

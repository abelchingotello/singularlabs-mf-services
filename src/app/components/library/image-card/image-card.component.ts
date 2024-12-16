import { Component, OnInit, Input } from '@angular/core';
import { assetUrl } from "src/single-spa/asset-url";


@Component({
  selector: 'uni-image-card',
  templateUrl: './image-card.component.html',
  styleUrls: ['./image-card.component.scss']
})
export class ImageCardComponent implements OnInit {
  @Input() title: string
  @Input() image: string;
  @Input() externImage: string;
  @Input() size: string;
  @Input() posContent: string;
  backImage: any;
  backSize: string;
  positionContent: string;

  defaultImage: string = 'https://i.pinimg.com/236x/1d/b2/c4/1db2c495b9cc3155944828306faa61d7.jpg';
  defaultSize: string = '140px'
  defaultPositionContent: string = 'start'
  constructor() { }

  ngOnInit(): void {
    if (this.image) {
      this.backImage = assetUrl(this.image);
    } else if (this.externImage) {
      this.backImage = this.externImage;
    }else{
      this.backImage = this.defaultImage;
    }
    this.backSize = this.size? this.size : this.defaultSize;
    this.positionContent = this.posContent? this.posContent : this.defaultPositionContent;
  }

}

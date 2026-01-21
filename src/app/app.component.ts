import { Component } from '@angular/core';
import { IdleService } from './services/idle.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'NexxLicense';

  constructor(private idle: IdleService) { }

}


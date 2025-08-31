import { Component, OnInit } from '@angular/core';
import { ErrorService, ErrorMessage } from '../../services/error.service';

@Component({
  selector: 'app-error',
  templateUrl: './error.component.html',
  styleUrls: ['./error.component.css']
})
export class ErrorComponent implements OnInit {
  error: ErrorMessage | null = null;
  show = false;

  constructor(private errorService: ErrorService) {}

  ngOnInit() {
    this.errorService.error$.subscribe(error => {
      this.error = error;
      this.show = !!error;
    });
  }

  close() {
    this.show = false;
    setTimeout(() => this.errorService.clearError(), 300); // Wait for animation
  }
}

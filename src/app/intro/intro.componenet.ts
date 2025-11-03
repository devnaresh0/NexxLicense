import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-intro',
  templateUrl: './intro.component.html',
  styleUrls: ['./intro.component.css']
})
export class IntroComponent implements OnInit {
  constructor(public router: Router) { }

  ngOnInit(): void {
    // Component initialization logic can go here
  }

  navigateTo(route: string): void {
    this.router.navigate([`/${route}`]);
  }
}
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

declare const $: any;

@Component({
  selector: 'app-build-manage',
  templateUrl: './build-manage.component.html',
  styleUrls: ['./build-manage.component.css']
})
export class BuildManageComponent implements OnInit, OnDestroy {
  buildId: string | null = null;
  private routeSub: Subscription | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.routeSub = this.route.paramMap.subscribe(params => {
      this.buildId = params.get('id');
      console.log('Build ID from route:', this.buildId);
      // You can add your API call here to fetch build details using this.buildId
    });
  }

  ngOnDestroy(): void {
    if (this.routeSub) {
      this.routeSub.unsubscribe();
    }
  }

  goBack(): void {
    this.router.navigate(['/builds']);
  }
}

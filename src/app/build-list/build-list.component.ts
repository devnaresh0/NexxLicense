import { Component, OnInit } from '@angular/core';
import { BuildService } from '../services/build.service';
import { Router } from '@angular/router';
import { LogoutService } from '../services/logout.service';

@Component({
  selector: 'app-build-list',
  templateUrl: './build-list.component.html',
  styleUrls: ['./build-list.component.css']
})
export class BuildListComponent implements OnInit {

  sessions: any[] = [];
  loading = true;

  // pagination vars
  currentPage = 1;
  pageSize = 11;

  constructor(private buildService: BuildService, private router: Router, private logoutService: LogoutService) { }

  ngOnInit() {
    this.buildService.getSessions().subscribe({
      next: (res: any) => {
        this.sessions = res;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  // slice array for current page
  get paginatedSessions() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.sessions.slice(start, start + this.pageSize);
  }

  get totalPages() {
    return Math.ceil(this.sessions.length / this.pageSize);
  }

  changePage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }

  onView(id: number) {
    this.router.navigate(['/build/info', id]);
  }
  
  navigateTo(url: string) {
    this.router.navigate([url]);
  }

  async onLogout() {
    const confirmed = await this.logoutService.showConfirmation();
    if (confirmed) {
      console.log('logout click');
      localStorage.removeItem('adminId');
      localStorage.removeItem('username');
      this.router.navigate(['/login']);
    }
  }

}

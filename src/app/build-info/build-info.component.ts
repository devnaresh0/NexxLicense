import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BuildInfoService } from '../services/build-info.service';
import { apiUrl } from 'src/environments/global';

@Component({
  selector: 'app-build-info',
  templateUrl: './build-info.component.html',
  styleUrls: ['./build-info.component.css']
})
export class BuildInfoComponent implements OnInit {

  loading = true;
  data: any = null;
  selectedLog: string | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private buildInfoService: BuildInfoService
  ) { }

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.buildInfoService.getBuildInfo(id).subscribe(
      (res) => {
        this.data = res;
        this.loading = false;
      },
      (err) => {
        console.error('Failed to load build info:', err);
        this.loading = false;
      }
    );
  }

  // Angular 6 safe version
  getFileName(fileId: number) {
    if (!this.data || !this.data.files) return 'Unknown';

    const file = this.data.files.find((f: any) => f.id === fileId);
    return file ? file.fileName : 'Unknown';
  }

  navigateTo(url: string) {
    this.router.navigate([url]);
  }

  // Add these methods to handle log viewing
  showLogs(logContent: string | null) {
    console.log('logs btn clicked');
    this.selectedLog = logContent;
  }
  closeLogs() {
    this.selectedLog = null;
  }

  exportCsv() {
    const a = document.createElement('a');
    a.href = `${apiUrl}/admin/build/info/${this.route.snapshot.paramMap.get('id')}/csv`;
    a.download = 'build.csv';
    a.click();
  }
}

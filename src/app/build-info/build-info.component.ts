import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BuildInfoService } from '../services/build-info.service';
import { apiUrl } from 'src/environments/global';
import { ErrorService } from '../services/error.service';

@Component({
  selector: 'app-build-info',
  templateUrl: './build-info.component.html',
  styleUrls: ['./build-info.component.css']
})
export class BuildInfoComponent implements OnInit {

  loading = true;
  data: any = null;
  selectedLog: string | null = null;
  selectedFileCancel: { fileId: number; fileName?: string } | null = null;
  cancelFileInProgress: boolean = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private buildInfoService: BuildInfoService,
    private errorService: ErrorService

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

  // Cancel confirmation state and handlers
  selectedCancel: { licenseId: number; fileId: number; customerName?: string; fileName?: string } | null = null;
  cancelInProgress: boolean = false;

  openCancelConfirm(customer: any, st: any) {
    const licenseId = (customer && (customer.id != null ? customer.id : (customer.licenseId != null ? customer.licenseId : customer.licenseID))) || null;
    console.log('cancel btn clicked for licenseId:', licenseId, 'fileId:', st ? st.fileId : null);
    if (!licenseId || !st || !st.fileId) {
      console.error('Missing licenseId or fileId for cancel');
      return;
    }
    this.selectedCancel = { licenseId, fileId: st.fileId, customerName: customer && customer.customerName, fileName: this.getFileName(st.fileId) };
  }

  closeCancelConfirm() {
    if (this.cancelInProgress) return; // prevent closing while request in progress
    this.selectedCancel = null;
  }

  confirmCancel() {
    if (!this.selectedCancel || this.cancelInProgress) return;
    const licenseId = this.selectedCancel.licenseId;
    const fileId = this.selectedCancel.fileId;

    this.cancelInProgress = true;
    this.buildInfoService.markCancelled(licenseId, fileId).subscribe(
      (res) => {
        // Update local copy of data to reflect cancellation
        if (this.data && Array.isArray(this.data.customers)) {
          for (let i = 0; i < this.data.customers.length; i++) {
            const c = this.data.customers[i];
            const lid = (c && (c.id != null ? c.id : (c.licenseId != null ? c.licenseId : c.licenseID)));
            if (lid === licenseId) {
              const fileStatuses = c.fileStatuses || [];
              for (let j = 0; j < fileStatuses.length; j++) {
                const st = fileStatuses[j];
                if (st && st.fileId === fileId) {
                  st.status = 'CANCELLED';
                }
              }
            }
          }
        }
        this.cancelInProgress = false;
        this.selectedCancel = null;
      },
      (err) => {
        console.error('Failed to mark cancelled:', err);
        this.cancelInProgress = false;
      }
    );
  }

  openFileCancelConfirm(file: any) {
    if (!file || !file.id) {
      console.error('Missing file id for cancel');
      return;
    }
    this.selectedFileCancel = { fileId: file.id, fileName: file.fileName };
  }

  closeFileCancelConfirm() {
    if (this.cancelFileInProgress) return;
    this.selectedFileCancel = null;
  }

  confirmFileCancel() {
    if (!this.selectedFileCancel || this.cancelFileInProgress) return;
    const fileId = this.selectedFileCancel.fileId;

    this.cancelFileInProgress = true;
    this.buildInfoService.cancelUploadedBuild(fileId).subscribe(
      (res) => {
        // update file entry
        if (this.data && Array.isArray(this.data.files)) {
          for (let i = 0; i < this.data.files.length; i++) {
            const f = this.data.files[i];
            if (f && f.id === fileId) {
              // mark cancelled for UI
              f.status = 'CANCELLED';
              f.cancelled = true;
            }
          }
        }

        // also update customer fileStatuses for this fileId
        if (this.data && Array.isArray(this.data.customers)) {
          for (let i = 0; i < this.data.customers.length; i++) {
            const c = this.data.customers[i];
            const fileStatuses = c.fileStatuses || [];
            for (let j = 0; j < fileStatuses.length; j++) {
              const st = fileStatuses[j];
              if (st && st.fileId === fileId) {
                st.status = 'CANCELLED';
              }
            }
          }
        }

        this.errorService.showError('Build cancelled successfully', 'success');
        this.cancelFileInProgress = false;
        this.selectedFileCancel = null;
      },
      (err) => {
        console.error('Failed to cancel uploaded build:', err);
        this.errorService.showError('Failed to cancel build', 'error');
        this.cancelFileInProgress = false;
      }
    );
  }

  exportCsv() {
    const a = document.createElement('a');
    a.href = `${apiUrl}/admin/build/info/${this.route.snapshot.paramMap.get('id')}/csv`;
    a.download = 'build.csv';
    a.click();
  }
}

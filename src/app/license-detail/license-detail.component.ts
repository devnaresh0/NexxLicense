// license-detail.component.ts
import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { LicenseService } from "../services/license.service";
import { from } from "rxjs";

export interface LicenseModule {
  id: number;
  module: string;
  numberOfUsers: number;
  startDate: string;
  endDate: string;
}

export interface LicenseHeader {
  id?: number;
  tenantId: string;
  domain: string;
  customerName: string;
  active: boolean;
}

@Component({
  selector: "app-license-detail",
  templateUrl: "./license-detail.component.html",
  styleUrls: ["./license-detail.component.css"],
})
export class LicenseDetailComponent implements OnInit {
  licenseId: string;
  isEditMode: boolean = false;
  isNewLicense: boolean = false;

  licenseHeader: LicenseHeader = {
    tenantId: "",
    domain: "",
    customerName: "",
    active: true,
  };

  licenseModules: LicenseModule[] = [];

  prevHeader: LicenseHeader;
  prevModules: LicenseModule[];

  originalLicenseData: any;
  availableModules: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private licenseService: LicenseService
  ) { }

  ngOnInit() {
    this.route.params.subscribe((params) => {
      if (params["id"] === "new") {
        this.isNewLicense = true;
        this.isEditMode = true;
        this.initializeNewLicense();
      } else {
        this.licenseId = params["id"];
        this.isEditMode =
          this.route.snapshot.routeConfig &&
            this.route.snapshot.routeConfig.path &&
            this.route.snapshot.routeConfig.path.endsWith("edit")
            ? true
            : false;
        this.loadLicense();
      }
      this.loadModules();
    });


  }

  initializeNewLicense() {
    this.licenseHeader = {
      tenantId: "",
      domain: "",
      customerName: "",
      active: true,
    };
    this.loadModules();
    this.licenseModules = [];
  }

  loadModules() {
    this.licenseService.getModules().subscribe(
      (data) => {
        this.availableModules = data;
      },
      (error) => {
        console.error("Error loading modules:", error);
      }
    );
  }

  loadLicense() {
    this.licenseService.getLicenseDetails(this.licenseId).subscribe(
      (data) => {
        console.log(data)
        this.licenseHeader = { ...data.header };
        this.licenseModules = data.modules.map((m) => ({ ...m }))
        this.originalLicenseData = JSON.parse(JSON.stringify(data));
        this.prevHeader = { ...this.licenseHeader };
        this.prevModules = this.licenseModules.map((m) => ({ ...m }));
      },
      (error) => {
        console.error("Error loading license:", error);
      }
    );
  }

  onList() {
    this.router.navigate(["/licenses"]);
  }

  onReset() {
    if (this.isNewLicense) {
      this.initializeNewLicense();
    } else if (this.originalLicenseData) {
      this.licenseHeader = { ...this.prevHeader };

      this.licenseModules = this.prevModules.map((m) => ({ ...m }))
    }
  }

  onSave() {
    const licenseData = {
      id: this.licenseId,
      header: {
        id: this.licenseId,
        tenantId: this.licenseHeader.tenantId,
        domain: this.licenseHeader.domain,
        customerName: this.licenseHeader.customerName,
        active: this.licenseHeader.active,
      },
      modules: this.licenseModules.map(m => ({ ...m })),  // Create a new array with current modules
    };
    console.log(licenseData, 'Data Sent')
    this.licenseService.saveLicense(licenseData).subscribe(
      (response) => {
        console.log("License response received:", response);
        // Show success message
        this.isEditMode = false;
        this.router.navigate(["/licenses"]);
      },
      (error) => {
        console.error("Error saving license:", error);
        // Show error message
      }
    );
  }

  addModule() {
    const newId = Math.max(...this.licenseModules.map((m) => +m.id), 0) + 1;
    const newModule: LicenseModule = {
      id: newId,
      module: "",
      numberOfUsers: 1,
      startDate: this.formatDate(new Date()),
      endDate: this.formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)), // 30 days from now
    };
    this.licenseModules.push(newModule);
  }

  removeModule(moduleId: number) {
    if (this.licenseModules.length > 1) {
      this.licenseModules = this.licenseModules.filter(
        (m) => m.id !== moduleId
      );
    }
  }

  onModuleChange(moduleId: number, field: string, value: any) {
    if (field == 'startDate' || field == 'endDate') {
      value = this.formatDate(value);
    }
    const module = this.licenseModules.find((m) => m.id === moduleId);
    console.log(value);
    if (module) {
      (module as any)[field] = value;
    }
  }

  onHeaderFieldChange(field: string, value: any) {
    if (this.licenseHeader) {
      (this.licenseHeader as any)[field] = value;
    }
  }

  private formatDate(date: Date): string {
    const formatted = date.toISOString().split('T')[0];
    console.log(formatted)
    return formatted;
  }

  toggleActiveStatus() {
    this.licenseHeader.active = !this.licenseHeader.active;
    console.log(this.licenseHeader.active, "toggle check")
  }
  justLog() {
    console.log(this.licenseHeader.active, 'active via the change')
  }
  isFormValid(): boolean {

    // Check header fields
    const isHeaderValid =
      this.licenseHeader.tenantId.trim() !== "" &&
      this.licenseHeader.domain.trim() !== "" &&
      this.licenseHeader.customerName.trim() !== "";

    // Check if any module is invalid (empty name or invalid user count)
    const hasInvalidModule = this.licenseModules.some(
      (module) =>
        !module.module ||
        module.module.trim() === "" ||
        module.module === "Select Module" ||
        module.numberOfUsers <= 0
    );

    // Check if any modules exist
    const hasModules = this.licenseModules.length > 0;

    // For edit mode, check if anything changed
    if (this.isEditMode && !this.isNewLicense) {


      // Check header changes including active status
      const headerChanged =
        this.licenseHeader.tenantId.trim() !== this.prevHeader.tenantId.trim() ||
        this.licenseHeader.domain.trim() !== this.prevHeader.domain.trim() ||
        this.licenseHeader.customerName.trim() !== this.prevHeader.customerName.trim() ||
        this.licenseHeader.active !== this.prevHeader.active;

      // Check if modules have changed by comparing their JSON representation
      const currentModules = JSON.stringify(
        this.licenseModules.map((m) => ({
          module: m.module,
          numberOfUsers: m.numberOfUsers,
          startDate: m.startDate,
          endDate: m.endDate,
        }))
      );

      const previousModules = JSON.stringify(
        this.prevModules.map((m) => ({
          module: m.module,
          numberOfUsers: m.numberOfUsers,
          startDate: m.startDate,
          endDate: m.endDate,
        }))
      );
      const modulesChanged = currentModules !== previousModules;

      // Return true if either header or modules changed and form is valid
      return (
        (headerChanged || modulesChanged) &&
        isHeaderValid &&
        !hasInvalidModule &&
        hasModules
      );
    }

    // For new license, just check basic validation
    return isHeaderValid && !hasInvalidModule && hasModules;
  }

  canEdit(): boolean {
    return this.isEditMode || this.isNewLicense;
  }
}

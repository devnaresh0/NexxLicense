import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BuildManageComponent } from './build-manage.component';

describe('BuildManageComponent', () => {
  let component: BuildManageComponent;
  let fixture: ComponentFixture<BuildManageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BuildManageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BuildManageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

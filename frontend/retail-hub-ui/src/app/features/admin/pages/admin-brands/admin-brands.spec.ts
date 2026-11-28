import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../../../../core/config/api.config';
import { AdminBrands } from './admin-brands';

describe('AdminBrands', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminBrands],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'http://localhost:5266/api' },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('surfaces backend ProblemDetails detail on 409 conflict and resets form on close', async () => {
    const fixture = TestBed.createComponent(AdminBrands);
    fixture.detectChanges();

    const initialReq = httpMock.expectOne(
      'http://localhost:5266/api/brands?includeInactive=false',
    );
    initialReq.flush([{ id: 1, name: 'OvenCraft', description: null, isActive: true }]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.page-heading h2')).toBeNull();

    const component = fixture.componentInstance as unknown as {
      openCreateForm: () => void;
      formName: string;
      saveBrand: () => void;
      closeForm: () => void;
      formError: string;
      isFormOpen: boolean;
    };

    component.openCreateForm();
    component.formName = 'OvenCraft';
    component.saveBrand();

    const postReq = httpMock.expectOne('http://localhost:5266/api/brands');
    postReq.flush(
      { title: 'Conflict', status: 409, detail: "Brand 'OvenCraft' already exists." },
      { status: 409, statusText: 'Conflict' },
    );
    fixture.detectChanges();

    expect(component.formError).toBe("Brand 'OvenCraft' already exists.");
    expect(fixture.nativeElement.textContent).toContain("Brand 'OvenCraft' already exists.");

    component.closeForm();
    expect(component.isFormOpen).toBe(false);
    expect(component.formName).toBe('');
    expect(component.formError).toBe('');
    void HttpErrorResponse;
  });
});

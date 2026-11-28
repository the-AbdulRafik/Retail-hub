import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../../../../core/config/api.config';
import { AdminCategories } from './admin-categories';

describe('AdminCategories', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminCategories],
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

  it('surfaces 409 ProblemDetails detail and resets editing state on closeForm', async () => {
    const fixture = TestBed.createComponent(AdminCategories);
    fixture.detectChanges();

    const initialReq = httpMock.expectOne(
      'http://localhost:5266/api/categories?includeInactive=false',
    );
    initialReq.flush([{ id: 1, name: 'Pizza', description: 'Hot pizzas', isActive: true }]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.page-heading h2')).toBeNull();

    const component = fixture.componentInstance as unknown as {
      openEditForm: (c: { id: number; name: string; description: string | null; isActive: boolean }) => void;
      formData: { name: string; description: string };
      saveCategory: () => void;
      closeForm: () => void;
      formError: string;
      isEditing: boolean;
      selectedCategoryId: number | null;
      showForm: boolean;
    };

    component.openEditForm({ id: 1, name: 'Pizza', description: 'Hot pizzas', isActive: true });
    expect(component.isEditing).toBe(true);
    component.formData.name = 'Cold Drinks';
    component.saveCategory();

    const putReq = httpMock.expectOne('http://localhost:5266/api/categories/1');
    putReq.flush(
      { title: 'Conflict', status: 409, detail: "Category 'Cold Drinks' already exists." },
      { status: 409, statusText: 'Conflict' },
    );
    fixture.detectChanges();

    expect(component.formError).toBe("Category 'Cold Drinks' already exists.");
    component.closeForm();
    expect(component.showForm).toBe(false);
    expect(component.isEditing).toBe(false);
    expect(component.selectedCategoryId).toBeNull();
    expect(component.formData.name).toBe('');
  });
});


import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface OrderItem {
  id: number;
  customerName: string;
  orderDate: string;
  totalAmount: number;
  itemCount: number;
  paymentStatus: string;
  orderStatus: string;
}

@Component({
  selector: 'app-admin-orders',
  imports: [FormsModule],
  templateUrl: './admin-orders.html',
  styleUrl: './admin-orders.css',
})
export class AdminOrders {
  protected searchTerm = '';
  protected selectedStatus = '';
  protected selectedPaymentStatus = '';
  protected showForm = false;
  protected selectedOrder: OrderItem | null = null;
  protected updatedStatus = '';

  protected readonly orders: OrderItem[] = [
    {
      id: 1001,
      customerName: 'Arun Kumar',
      orderDate: '2026-11-25',
      totalAmount: 1250,
      itemCount: 4,
      paymentStatus: 'Paid',
      orderStatus: 'Delivered',
    },
    {
      id: 1002,
      customerName: 'Priya Sharma',
      orderDate: '2026-11-26',
      totalAmount: 850,
      itemCount: 2,
      paymentStatus: 'Paid',
      orderStatus: 'Processing',
    },
    {
      id: 1003,
      customerName: 'Rahul Dev',
      orderDate: '2026-11-26',
      totalAmount: 2100,
      itemCount: 5,
      paymentStatus: 'Pending',
      orderStatus: 'Pending',
    },
    {
      id: 1004,
      customerName: 'Sneha Raj',
      orderDate: '2026-11-24',
      totalAmount: 450,
      itemCount: 1,
      paymentStatus: 'Paid',
      orderStatus: 'Shipped',
    },
    {
      id: 1005,
      customerName: 'Karthik S',
      orderDate: '2026-11-23',
      totalAmount: 1750,
      itemCount: 3,
      paymentStatus: 'Paid',
      orderStatus: 'Cancelled',
    },
    {
      id: 1006,
      customerName: 'Meena Devi',
      orderDate: '2026-11-27',
      totalAmount: 980,
      itemCount: 2,
      paymentStatus: 'Pending',
      orderStatus: 'Pending',
    },
  ];

  protected get filteredOrders(): OrderItem[] {
    const term = this.searchTerm.trim().toLowerCase();

    return this.orders.filter((order) => {
      const matchesSearch =
        !term ||
        String(order.id).includes(term) ||
        order.customerName.toLowerCase().includes(term);

      const matchesStatus =
        !this.selectedStatus ||
        order.orderStatus === this.selectedStatus;

      const matchesPayment =
        !this.selectedPaymentStatus ||
        order.paymentStatus === this.selectedPaymentStatus;

      return matchesSearch && matchesStatus && matchesPayment;
    });
  }

  protected get totalOrders(): number {
    return this.orders.length;
  }

  protected get pendingOrders(): number {
    return this.orders.filter(
      (order) => order.orderStatus === 'Pending',
    ).length;
  }

  protected get processingOrders(): number {
    return this.orders.filter(
      (order) => order.orderStatus === 'Processing',
    ).length;
  }

  protected get deliveredOrders(): number {
    return this.orders.filter(
      (order) => order.orderStatus === 'Delivered',
    ).length;
  }

  protected openUpdateForm(order: OrderItem): void {
    this.selectedOrder = order;
    this.updatedStatus = order.orderStatus;
    this.showForm = true;
  }

  protected updateOrderStatus(): void {
    if (!this.selectedOrder || !this.updatedStatus) {
      return;
    }

    this.selectedOrder.orderStatus = this.updatedStatus;
    this.closeForm();
  }

  protected closeForm(): void {
    this.showForm = false;
    this.selectedOrder = null;
    this.updatedStatus = '';
  }
}
